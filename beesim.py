#!/usr/bin/env python3
"""
beesim.py — Python BLE controller for BeeSIM eUICC cards.

Reverse-engineered from the official web LPA at https://beeesim.com/ble/
(Vue SPA, build "BeeSIM Web v2.1.4"). This re-implements, in Python, the exact
BLE transport framing and the GSMA SGP.22 (ES10) command set the web app sends
over Web Bluetooth.

The BeeSIM card is a GSMA Remote-SIM-Provisioning eUICC exposed over BLE:

  * BLE device name:   starts with "BeeSIM"
  * GATT service:      0000ae30-0000-1000-8000-00805f9b34fb  (16-bit 0xAE30)
  * Write char:        the service characteristic with WRITE / WRITE_NO_RESPONSE
  * Notify char:       the service characteristic with NOTIFY / INDICATE
  * Framing:           each ATT packet = [total_groups, group_index(1-based)] + up-to-18 payload bytes
  * Payload:           an ISO-7816 APDU (vendor A0.. commands, or STORE DATA / GET RESPONSE
                       carrying ES10 BER-TLV commands to the ISD-R applet)

Requires: pip install bleak

This controller is **pure BLE** — every command below is an ISO-7816 APDU sent
straight to the card over GATT; there is no network traffic. (Downloading a
*new* eSIM profile is intentionally out of scope: GSMA RSP requires an online
SM-DP+ server dialogue, which is not "controlling the card over BLE". The card
crypto for that lives in the ES10b methods here if you ever need it.)

USAGE:
  python beesim.py                                # launch the terminal UI (default)
  python beesim.py tui                            # ... same, explicitly
  python beesim.py scan
  python beesim.py info
  python beesim.py eid
  python beesim.py list
  python beesim.py enable   <iccid>
  python beesim.py disable  <iccid>
  python beesim.py delete   <iccid>
  python beesim.py rename   <iccid> "<nickname>"
  python beesim.py reset
  python beesim.py txpower  <0-4>                  # set BLE TX power (0=min, 4=max)
  python beesim.py notifications
  python beesim.py apdu     A03F0000 00           # send a raw hex APDU (advanced)

The TUI (Textual) is optional: `pip install textual`. The CLI works with bleak
alone. The TUI also shows live BLE signal strength (RSSI). See README.md for the
full protocol documentation and a security note on the card's open BLE surface.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from typing import List, Optional, Tuple

try:
    from bleak import BleakClient, BleakScanner
except ImportError:  # pragma: no cover
    BleakClient = BleakScanner = None  # allow --help / offline TLV work without bleak

# --------------------------------------------------------------------------- #
# Constants (verified from the web bundle)
# --------------------------------------------------------------------------- #
SERVICE_UUID = "0000ae30-0000-1000-8000-00805f9b34fb"
NAME_PREFIX = "BeeSIM"

# GSMA ISD-R AID selected on the logical channel (A4 04 00) before any ES10 cmd.
ISDR_AID = bytes.fromhex("A0000005591010FFFFFFFF8900000100")

STORE_MAX_LC = 239          # max data bytes per STORE DATA block  (pe.StoreMaxLc)
GROUP_PAYLOAD = 18          # bytes of APDU per BLE packet          (groupValue)
LOGICAL_CHANNEL = 1         # fixed logical channel                 (pe.channel)


# --------------------------------------------------------------------------- #
# Small byte / BER-TLV helpers (ports of V, B, R, H, K, ce, be from the bundle)
# --------------------------------------------------------------------------- #
def h2b(hexstr: str) -> bytes:
    return bytes.fromhex(hexstr.replace(" ", ""))


def b2h(data: bytes) -> str:
    return data.hex().upper()


def swap_nibbles(hexstr: str) -> str:
    """ICCID <-> on-card nibble-swapped form (JS `R`). Pads odd length with 'F'."""
    if len(hexstr) % 2:
        hexstr += "F"
    return "".join(hexstr[i + 1] + hexstr[i] for i in range(0, len(hexstr), 2))


def der_len(n: int) -> bytes:
    if n < 0x80:
        return bytes([n])
    if n <= 0xFF:
        return bytes([0x81, n])
    if n <= 0xFFFF:
        return bytes([0x82, (n >> 8) & 0xFF, n & 0xFF])
    return bytes([0x83, (n >> 16) & 0xFF, (n >> 8) & 0xFF, n & 0xFF])


def tlv(tag, *children: bytes) -> bytes:
    """Build a BER-TLV (port of JS `H`): tag + length + concatenated children.

    `tag` may be an int (single byte) or a bytes/list of tag bytes. Length uses
    a single byte, or 0x82 hi lo when > 255 (matching the bundle exactly).
    """
    if isinstance(tag, int):
        tag = bytes([tag])
    else:
        tag = bytes(tag)
    value = b"".join(children)
    n = len(value)
    length = bytes([0x82, (n >> 8) & 0xFF, n & 0xFF]) if n > 255 else bytes([n & 0xFF])
    return tag + length + value


def parse_tlv(data: bytes, start: int = 0, end: Optional[int] = None) -> list:
    """Recursive BER-TLV parser (port of JS `K`). Returns a list of nodes:
    {tag: 'HEX', length: int, value: bytes|list}. Constructed tags nest a list."""
    if end is None:
        end = len(data)
    out = []
    i = start
    while i < end:
        tag_start = i
        constructed = (data[i] & 0x20) != 0
        if (data[i] & 0x1F) == 0x1F:  # multi-byte tag
            i += 1
            while i < end and (data[i] & 0x80):
                i += 1
            i += 1
        else:
            i += 1
        tag = data[tag_start:i].hex().upper()
        # length
        if data[i] & 0x80:
            nlen = data[i] & 0x7F
            i += 1
            length = 0
            for _ in range(nlen):
                length = (length << 8) | data[i]
                i += 1
        else:
            length = data[i]
            i += 1
        value_bytes = data[i:i + length]
        if constructed:
            value = parse_tlv(data, i, i + length)
        else:
            value = value_bytes
        out.append({"tag": tag, "length": length, "value": value})
        i += length
    return out


def find_tag(nodes: list, *tags: str):
    """Depth-first search through parsed TLV for a tag path (port of `be`/`ye`).
    Returns the matching node's value (bytes for primitive, list for constructed)."""
    current = nodes
    node = None
    for want in tags:
        node = _find_one(current, want)
        if node is None:
            return None
        current = node["value"] if isinstance(node["value"], list) else []
    if node is None:
        return None
    return node["value"]


def _find_one(nodes: list, want: str):
    nested = []
    for n in nodes:
        if n["tag"] == want:
            return n
        if isinstance(n["value"], list):
            nested.append(n)
    for n in nested:
        found = _find_one(n["value"], want)
        if found:
            return found
    return None


def serialize_tlv(node: dict) -> str:
    """Serialize a parsed node back to hex (port of JS `Ce`)."""
    if isinstance(node["value"], str):  # already-hex primitive (unused here)
        v = node["value"]
    elif isinstance(node["value"], bytes):
        v = node["value"].hex().upper()
    else:  # constructed
        v = "".join(serialize_tlv(c) for c in node["value"])
    tag = node["tag"]
    return tag + der_len(len(v) // 2).hex().upper() + v


# --------------------------------------------------------------------------- #
# BLE transport layer  (ports of Ye.open / writeBytes / writeGroupBytes / notify)
# --------------------------------------------------------------------------- #
class BeeSimTransport:
    """Low-level BLE link: discovers the AE30 service, chunk-frames APDUs out and
    reassembles the grouped notifications back into a full response (incl. SW)."""

    def __init__(self, client: "BleakClient", write_uuid: str, notify_uuid: str):
        self.client = client
        self.write_uuid = write_uuid
        self.notify_uuid = notify_uuid
        self._buf = bytearray()
        self._future: Optional[asyncio.Future] = None
        self._loop = asyncio.get_event_loop()

    # --- notification reassembly (port of toInitNotification handler) ---------
    def _on_notify(self, _char, data: bytearray):
        if not data:
            if self._future and not self._future.done():
                self._future.set_result(b"")
            return
        total, index = data[0], data[1]
        if index == 1:
            self._buf = bytearray()
        self._buf.extend(data[2:])
        if total == index:  # last group -> response complete
            if self._future and not self._future.done():
                self._future.set_result(bytes(self._buf))

    async def start(self):
        await self.client.start_notify(self.notify_uuid, self._on_notify)

    # --- outbound framing (port of groupValue + writeGroupBytes) --------------
    async def send(self, apdu: bytes, timeout: float = 20.0) -> bytes:
        # split payload into <=18-byte groups
        groups = [apdu[i:i + GROUP_PAYLOAD] for i in range(0, len(apdu), GROUP_PAYLOAD)] or [b""]
        total = len(groups)
        self._future = self._loop.create_future()
        # A characteristic with WRITE_NO_RESPONSE is used when available.
        for idx, g in enumerate(groups, start=1):
            packet = bytes([total, idx]) + g
            await self.client.write_gatt_char(self.write_uuid, packet, response=False)
        return await asyncio.wait_for(self._future, timeout=timeout)


# --------------------------------------------------------------------------- #
# eUICC command layer  (ports of pe/G: channel, SELECT, STORE DATA, GET RESPONSE)
# --------------------------------------------------------------------------- #
class Euicc:
    def __init__(self, transport: BeeSimTransport, debug: bool = False):
        self.t = transport
        self.channel = LOGICAL_CHANNEL
        self.inited = False
        self.debug = debug
        self.on_log = None  # optional callback(str) — used by the TUI

    def _log(self, *a):
        if self.on_log is not None:
            self.on_log(" ".join(str(x) for x in a))
        if self.debug:
            print("[euicc]", *a, file=sys.stderr)

    async def send_command(self, apdu: bytes, reinit_on_6881: bool = True) -> bytes:
        self._log("-->", b2h(apdu))
        resp = await self.t.send(apdu)
        self._log("<--", b2h(resp))
        if reinit_on_6881 and len(resp) >= 2 and resp[-2] == 0x68 and resp[-1] == 0x81:
            # "logical channel not supported" -> re-open channel and retry once
            self.inited = False
            await self.init()
            resp = await self.t.send(apdu)
            self._log("<-- (retry)", b2h(resp))
        return resp

    # --- vendor commands (CLA 0xA0) ------------------------------------------
    async def set_tx_power(self, power: int = 1):
        """A0 3E <power> 00 00 — set BLE TX power. Valid 0-4 (0=min, 4=max;
        levels 5-7 are meaningless). Web app uses 4 during install."""
        await self.send_command(bytes([0xA0, 0x3E, power & 0xFF, 0x00, 0x00]), reinit_on_6881=False)

    async def reset(self):
        """A0 3F 00 00 00 — soft reset of the eUICC (re-does ATR/refresh)."""
        try:
            await self.send_command(bytes([0xA0, 0x3F, 0x00, 0x00, 0x00]), reinit_on_6881=False)
        finally:
            self.inited = False

    async def check_upgrading(self) -> dict:
        """00 00 00 00 F4 01 01 — vendor firmware-progress query."""
        r = await self.send_command(bytes([0x00, 0x00, 0x00, 0x00, 0xF4, 0x01, 0x01]), reinit_on_6881=False)
        if r and r[0] == 0x10:
            return {
                "crc": b2h(r[49:51]),
                "totalRows": int.from_bytes(r[51:53], "big"),
                "currentRow": int.from_bytes(r[53:55], "big"),
            }
        raise RuntimeError("check_upgrading failed: " + b2h(r))

    # --- logical channel + ISD-R select (port of openChannel/selectApplication)
    async def open_channel(self):
        ch = self.channel
        await self.send_command(bytes([0x00, 0x70, 0x80, ch, 0x00]), reinit_on_6881=False)  # close ch
        # vendor "device features" GET DATA
        await self.send_command(h2b("80AA00000AA9088100820101830107"), reinit_on_6881=False)
        r = await self.send_command(bytes([0x00, 0x70, 0x00, ch, 0x00]), reinit_on_6881=False)  # open ch
        if not (len(r) >= 2 and r[-2] == 0x90 and r[-1] == 0x00):
            raise RuntimeError("open channel failed: " + b2h(r))

    async def select_isdr(self):
        apdu = bytes([self.channel, 0xA4, 0x04, 0x00, len(ISDR_AID)]) + ISDR_AID
        r = await self.send_command(apdu, reinit_on_6881=False)
        if r and r[0] == 0x61:
            return await self.get_response(r[1])
        if not (r and r[0] == 0x90):
            raise RuntimeError("SELECT ISD-R failed: " + b2h(r))

    async def init(self):
        if self.inited:
            return
        self.inited = True
        await self.open_channel()
        await self.select_isdr()

    # --- GET RESPONSE loop (port of readBytesFromEUICC) -----------------------
    async def get_response(self, le: int, retries: int = 0) -> bytes:
        cla = (self.channel & 0x0F) | 0x80
        buf = bytearray()
        while True:
            r = await self.send_command(bytes([cla, 0xC0, 0x00, 0x00, le]))
            body, sw1, sw2 = r[:-2], r[-2], r[-1]
            if sw1 == 0x61:                 # more data available
                buf.extend(body)
                le = sw2
            elif sw1 == 0x90:               # done
                if retries < 3 and len(body) == 0:
                    retries += 1
                    continue
                buf.extend(body)
                return bytes(buf)
            elif sw1 == 0x6C or sw2 == 0x6C:  # wrong Le -> resend with sw2
                le = sw2
            else:
                self.inited = False
                raise RuntimeError("GET RESPONSE error: " + b2h(r))

    # --- STORE DATA chaining (port of storeBytesToEUICC) ----------------------
    async def store_bytes(self, data: bytes) -> bytes:
        cla = (self.channel & 0x0F) | 0x80
        block = 0
        pos = 0
        while True:
            remaining = data[pos:]
            more = len(remaining) > STORE_MAX_LC
            chunk = remaining[:STORE_MAX_LC] if more else remaining
            p1 = 0x11 if more else 0x91
            apdu = bytes([cla, 0xE2, p1, block, len(chunk)]) + chunk
            r = await self.send_command(apdu)
            if r and r[0] == 0x61:
                return r
            if r and r[0] == 0x90:
                if more:
                    block += 1
                    pos += STORE_MAX_LC
                    continue
                return r
            self.inited = False
            raise RuntimeError("STORE DATA error: " + b2h(r))

    async def store_and_read(self, data: bytes) -> bytes:
        """Send an ES10 command TLV and return its full response TLV (port of storeAndReadBytes)."""
        await self.init()
        r = await self.store_bytes(data)
        if r and r[0] == 0x61:
            return await self.get_response(r[1])
        raise RuntimeError("store_and_read: unexpected " + b2h(r))


# --------------------------------------------------------------------------- #
# ES10 API — the high-level "APIs" the web app exposes (ports of the `Ve` object)
# --------------------------------------------------------------------------- #
class BeeSim:
    def __init__(self, euicc: Euicc):
        self.e = euicc

    # -- ES10c: identity & profiles -------------------------------------------
    async def get_eid(self) -> str:
        # BF 3E 03 5C 01 5A  (GET DATA, tag list = EID)
        r = await self.e.store_and_read(bytes([0xBF, 0x3E, 0x03, 0x5C, 0x01, 0x5A]))
        eid = find_tag(parse_tlv(r), "BF3E", "5A")
        if eid is None:
            raise RuntimeError("EID not found: " + b2h(r))
        return b2h(eid)

    async def get_euicc_info2(self) -> dict:
        r = await self.e.store_and_read(h2b("BF2200"))
        return _tlv_to_debug(parse_tlv(r))

    async def get_profiles(self) -> List[dict]:
        # BF 2D 00  (get all ProfileInfo)
        r = await self.e.store_and_read(bytes([0xBF, 0x2D, 0x00]))
        nodes = parse_tlv(r)
        if not (nodes and nodes[0]["tag"] == "BF2D"):
            raise RuntimeError("GetProfilesInfo failed: " + b2h(r))
        profiles = []
        a0 = _child(nodes[0], "A0")
        if a0:
            for e3 in a0:
                if e3["tag"] == "E3":
                    profiles.append(_parse_profile(e3))
        return profiles

    async def enable_profile(self, iccid: str) -> bool:
        cmd = tlv([0xBF, 0x31], tlv([0xA0], tlv([0x5A], h2b(swap_nibbles(iccid)))), bytes([0x81, 0x01, 0x00]))
        return await self._result(cmd, "EnableProfile")

    async def disable_profile(self, iccid: str) -> bool:
        cmd = tlv([0xBF, 0x32], tlv([0xA0], tlv([0x5A], h2b(swap_nibbles(iccid)))), bytes([0x81, 0x01, 0x00]))
        return await self._result(cmd, "DisableProfile")

    async def delete_profile(self, iccid: str) -> bool:
        cmd = tlv([0xBF, 0x33], tlv([0x5A], h2b(swap_nibbles(iccid))))
        return await self._result(cmd, "DeleteProfile")

    async def set_nickname(self, iccid: str, nickname: str) -> bool:
        cmd = tlv([0xBF, 0x29], tlv([0x5A], h2b(swap_nibbles(iccid))), tlv([0x90], nickname.encode("utf-8")))
        r = await self.e.store_and_read(cmd)
        code = find_tag(parse_tlv(r), "BF29", "80")
        if code == b"\x00":
            return True
        raise RuntimeError(f"SetNickname failed (code={b2h(code) if code else '??'})")

    async def _result(self, cmd: bytes, name: str) -> bool:
        r = await self.e.store_and_read(cmd)
        code = find_tag(parse_tlv(r), "80")
        if code == b"\x00":
            return True
        msgs = {1: "not-exist", 2: "wrong-state", 3: "policy-forbidden", 4: "profile-error", 5: "busy"}
        c = code[0] if code else -1
        raise RuntimeError(f"{name} failed: {msgs.get(c, 'code ' + str(c))}")

    # -- ES10b: notifications --------------------------------------------------
    async def list_notifications(self) -> bytes:
        return await self.e.store_and_read(bytes([0xBF, 0x28, 0x00]))

    async def retrieve_notification(self, seq: int) -> bytes:
        return await self.e.store_and_read(tlv([0xBF, 0x2B], tlv([0xA0], tlv([0x80], _int_bytes(seq)))))

    async def remove_notification(self, seq: int) -> bool:
        r = await self.e.store_and_read(tlv([0xBF, 0x30], tlv([0x80], _int_bytes(seq))))
        return find_tag(parse_tlv(r), "80") == b"\x00"

    async def get_euicc_challenge(self) -> bytes:
        r = await self.e.store_and_read(bytes([0xBF, 0x2E, 0x00]))
        return find_tag(parse_tlv(r), "80")

    async def set_tx_power(self, power: int) -> None:
        """Set the card's BLE transmit power (0-4, 0=min/4=max; vendor A0 3E).
        Convenience wrapper around the eUICC-level command."""
        await self.e.set_tx_power(power)


# --------------------------------------------------------------------------- #
# Profile-info parsing (port of Re/ze)
# --------------------------------------------------------------------------- #
def _child(node: dict, tag: str):
    if isinstance(node["value"], list):
        for c in node["value"]:
            if c["tag"] == tag:
                return c["value"]
    return None


def _parse_profile(e3: dict) -> dict:
    out = {}
    text = lambda v: bytes(v).decode("utf-8", "replace")
    for f in e3["value"]:
        t, v = f["tag"], f["value"]
        if t == "5A":
            out["iccid"] = swap_nibbles(b2h(v)).rstrip("F")
        elif t == "4F":
            out["isdpAid"] = b2h(v)
        elif t == "9F70":
            out["profileState"] = "ON" if v == b"\x01" else "OFF"
        elif t == "90":
            out["profileNickname"] = text(v)
        elif t == "91":
            out["serviceProviderName"] = text(v)
        elif t == "92":
            out["profileName"] = text(v)
        elif t == "95":
            out["profileClass"] = {b"\x01": "provisioning", b"\x02": "operational"}.get(v, "test")
    return out


def _int_bytes(n: int) -> bytes:
    if n == 0:
        return b"\x00"
    length = (n.bit_length() + 7) // 8
    return n.to_bytes(length, "big")


def _tlv_to_debug(nodes: list) -> dict:
    def conv(n):
        if isinstance(n["value"], list):
            return {n["tag"]: [conv(c) for c in n["value"]]}
        return {n["tag"]: b2h(n["value"])}
    return {"tlv": [conv(n) for n in nodes]}


# --------------------------------------------------------------------------- #
# BLE discovery + connection helper
# --------------------------------------------------------------------------- #
async def connect(address: Optional[str] = None, debug: bool = False) -> Tuple["BleakClient", BeeSim, Euicc]:
    if BleakClient is None:
        raise RuntimeError("bleak is not installed. Run: pip install bleak")

    if address is None:
        print(f"Scanning for '{NAME_PREFIX}*' ...", file=sys.stderr)
        dev = await BleakScanner.find_device_by_filter(
            lambda d, ad: (d.name or "").startswith(NAME_PREFIX), timeout=15.0
        )
        if not dev:
            raise RuntimeError(f"No BeeSIM device found (name prefix '{NAME_PREFIX}').")
        address = dev.address
        print(f"Found {dev.name} @ {address}", file=sys.stderr)

    client = BleakClient(address)
    await client.connect()

    # discover the AE30 service and its write/notify characteristics by property
    write_uuid = notify_uuid = None
    for service in client.services:
        if service.uuid.lower() != SERVICE_UUID.lower():
            continue
        for ch in service.characteristics:
            props = ch.properties
            if ("write" in props or "write-without-response" in props) and write_uuid is None:
                write_uuid = ch.uuid
            if "notify" in props or "indicate" in props:
                notify_uuid = ch.uuid
    if not write_uuid or not notify_uuid:
        # fall back: some stacks list chars only under the primary service
        for ch in (c for s in client.services for c in s.characteristics):
            props = ch.properties
            if ("write" in props or "write-without-response" in props) and write_uuid is None:
                write_uuid = ch.uuid
            if ("notify" in props or "indicate" in props) and notify_uuid is None:
                notify_uuid = ch.uuid
    if not write_uuid or not notify_uuid:
        raise RuntimeError("Could not locate write/notify characteristics on AE30 service.")

    transport = BeeSimTransport(client, write_uuid, notify_uuid)
    await transport.start()
    euicc = Euicc(transport, debug=debug)
    return client, BeeSim(euicc), euicc


async def read_rssi(client) -> Optional[int]:
    """Best-effort RSSI (dBm) of the *connected* link, or None if unavailable.

    BeeSIM cards stop advertising once connected, so a passive scanner sees
    nothing — we must query the live connection. bleak exposes this on the
    platform backend: `client._backend.get_rssi()` (CoreBluetooth on macOS,
    BlueZ on Linux). Windows has no equivalent, so None there.
    """
    for target in (client, getattr(client, "_backend", None)):
        fn = getattr(target, "get_rssi", None) if target is not None else None
        if fn is None:
            continue
        try:
            val = fn()
            if asyncio.iscoroutine(val):
                val = await val
            if val is not None:
                return int(val)
        except Exception:
            continue
    return None


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #
async def _run(args):
    if args.command == "scan":
        if BleakScanner is None:
            raise RuntimeError("bleak not installed")
        devs = await BleakScanner.discover(timeout=8.0)
        found = [d for d in devs if (d.name or "").startswith(NAME_PREFIX)]
        for d in found:
            print(f"{d.address}  {d.name}")
        if not found:
            print("No BeeSIM devices found.")
        return

    client, sim, euicc = await connect(args.address, debug=args.debug)
    try:
        if args.command == "info":
            print("EID       :", await sim.get_eid())
            print("EUICCInfo2:", json.dumps(await sim.get_euicc_info2(), indent=2))
        elif args.command == "eid":
            print(await sim.get_eid())
        elif args.command == "list":
            profiles = await sim.get_profiles()
            print(json.dumps(profiles, indent=2, ensure_ascii=False))
        elif args.command == "enable":
            print("OK" if await sim.enable_profile(args.iccid) else "FAILED")
            await euicc.reset()
        elif args.command == "disable":
            print("OK" if await sim.disable_profile(args.iccid) else "FAILED")
            await euicc.reset()
        elif args.command == "delete":
            print("OK" if await sim.delete_profile(args.iccid) else "FAILED")
        elif args.command == "rename":
            print("OK" if await sim.set_nickname(args.iccid, args.nickname) else "FAILED")
        elif args.command == "reset":
            await euicc.reset()
            print("reset sent")
        elif args.command == "txpower":
            await euicc.set_tx_power(int(args.level))
            print("tx power set")
        elif args.command == "notifications":
            print("ListNotification TLV:", b2h(await sim.list_notifications()))
        elif args.command == "apdu":
            resp = await euicc.send_command(h2b(args.hex))
            print(b2h(resp))
    finally:
        await client.disconnect()


# --------------------------------------------------------------------------- #
# Terminal UI (Textual) — merged in; imported lazily so the CLI works without it
# --------------------------------------------------------------------------- #
def _build_tui_app():
    """Build and return the Textual `BeeSimApp` class (imports Textual lazily so
    the CLI works without it). Kept separate from run_tui() for headless tests."""
    try:
        from textual.app import App, ComposeResult
        from textual.binding import Binding
        from textual.containers import Horizontal, Vertical
        from textual.screen import ModalScreen
        from textual.widgets import (
            Button, DataTable, Footer, Header, Input, Label, RichLog, Select, Static,
        )
        from textual import work
    except ImportError:
        sys.exit("The TUI needs Textual:  pip install textual")

    class ConfirmScreen(ModalScreen[bool]):
        """Yes/No confirmation."""

        def __init__(self, question: str):
            super().__init__()
            self.question = question

        def compose(self) -> ComposeResult:
            with Vertical(id="dialog"):
                yield Label(self.question, id="dialog-q")
                with Horizontal(id="dialog-buttons"):
                    yield Button("Cancel", variant="default", id="no")
                    yield Button("Confirm", variant="error", id="yes")

        def on_button_pressed(self, event: Button.Pressed) -> None:
            self.dismiss(event.button.id == "yes")


    class InputScreen(ModalScreen[str | None]):
        """Single-line text prompt (used for rename / APDU / activation code)."""

        def __init__(self, title: str, placeholder: str = "", value: str = ""):
            super().__init__()
            self.title_text = title
            self.placeholder = placeholder
            self.value = value

        def compose(self) -> ComposeResult:
            with Vertical(id="dialog"):
                yield Label(self.title_text, id="dialog-q")
                yield Input(value=self.value, placeholder=self.placeholder, id="dialog-input")
                with Horizontal(id="dialog-buttons"):
                    yield Button("Cancel", variant="default", id="cancel")
                    yield Button("OK", variant="primary", id="ok")

        def on_mount(self) -> None:
            self.query_one("#dialog-input", Input).focus()

        def on_input_submitted(self, event: Input.Submitted) -> None:
            self.dismiss(event.value)

        def on_button_pressed(self, event: Button.Pressed) -> None:
            if event.button.id == "ok":
                self.dismiss(self.query_one("#dialog-input", Input).value)
            else:
                self.dismiss(None)


    class TxPowerScreen(ModalScreen[int | None]):
        """Pick the card's BLE transmit power level (0-4; vendor A0 3E)."""

        def compose(self) -> ComposeResult:
            levels = [(f"{n}  ({'min' if n == 0 else 'max' if n == 4 else 'level ' + str(n)})", n)
                      for n in range(5)]
            with Vertical(id="dialog"):
                yield Label("Set BLE TX power", id="dialog-q")
                yield Static(
                    "0 = min, 4 = max (levels 5-7 have no effect). Higher = "
                    "stronger signal / longer range, more battery.",
                    id="dialog-hint",
                )
                yield Select(levels, value=4, allow_blank=False, id="tx-level")
                with Horizontal(id="dialog-buttons"):
                    yield Button("Cancel", id="cancel")
                    yield Button("Set", variant="warning", id="set")

        def on_button_pressed(self, event: Button.Pressed) -> None:
            if event.button.id == "set":
                self.dismiss(self.query_one("#tx-level", Select).value)
            else:
                self.dismiss(None)


    # --------------------------------------------------------------------------- #
    # Main app
    # --------------------------------------------------------------------------- #
    class BeeSimApp(App):
        CSS = """
        Screen { layout: vertical; }
        #body { height: 1fr; }
        #sidebar {
            width: 34; border: round $primary; padding: 1; margin: 0 1 0 0;
        }
        #sidebar Button { width: 100%; margin-bottom: 1; }
        #status { color: $text-muted; margin-bottom: 1; }
        #eid { color: $success; text-style: bold; }
        #rssi { text-style: bold; margin-bottom: 1; }
        #main { width: 1fr; }
        #profiles { height: 1fr; border: round $primary; }
        #log { height: 12; border: round $secondary; padding: 0 1; }
        #dialog {
            width: 62; height: auto; padding: 1 2; border: thick $primary;
            background: $panel; align: center middle;
        }
        #dialog-q { margin-bottom: 1; text-style: bold; }
        #dialog-hint { color: $text-muted; margin-bottom: 1; }
        #dialog Select, #dialog Input { margin-bottom: 1; }
        #dialog-buttons { height: auto; align: right middle; }
        #dialog-buttons Button { width: auto; margin-left: 2; }
        .connected { color: $success; }
        .disconnected { color: $error; }
        """

        BINDINGS = [
            Binding("s", "scan", "Scan/Connect"),
            Binding("r", "refresh", "Refresh"),
            Binding("e", "enable", "Enable"),
            Binding("d", "disable", "Disable"),
            Binding("x", "delete", "Delete"),
            Binding("n", "rename", "Rename"),
            Binding("i", "info", "Info"),
            Binding("N", "notifications", "Notifs"),
            Binding("t", "txpower", "TX Power"),
            Binding("a", "apdu", "APDU"),
            Binding("c", "disconnect", "Disconnect"),
            Binding("q", "quit", "Quit"),
        ]

        def __init__(self, address: str | None = None):
            super().__init__()
            self.address = address
            self.client = None
            self.sim: BeeSim | None = None
            self.euicc: Euicc | None = None
            self.busy = False
            self.rssi = None            # latest RSSI in dBm (None = unknown)
            self.rssi_ts = 0.0          # monotonic timestamp of last RSSI sample

        # -- layout ---------------------------------------------------------------
        def compose(self) -> ComposeResult:
            yield Header(show_clock=True)
            with Horizontal(id="body"):
                with Vertical(id="sidebar"):
                    yield Static("● disconnected", id="status", classes="disconnected")
                    yield Static("", id="eid")
                    yield Static("RSSI —", id="rssi")
                    yield Static("", id="devname")
                    yield Button("Scan & Connect", id="btn-scan", variant="success")
                    yield Button("Refresh", id="btn-refresh", variant="primary")
                    yield Button("Enable", id="btn-enable")
                    yield Button("Disable", id="btn-disable")
                    yield Button("Delete", id="btn-delete", variant="error")
                    yield Button("Rename", id="btn-rename")
                    yield Button("TX Power", id="btn-txpower")
                    yield Button("Reset card", id="btn-reset", variant="warning")
                with Vertical(id="main"):
                    yield DataTable(id="profiles", zebra_stripes=True, cursor_type="row")
                    yield RichLog(id="log", highlight=True, markup=True, wrap=True)
            yield Footer()

        def on_mount(self) -> None:
            self.title = "BeeSIM"
            self.sub_title = "BLE eUICC controller"
            table = self.query_one("#profiles", DataTable)
            table.add_columns("ICCID", "State", "Name", "Provider", "Class")
            self.log_line("[dim]Press [b]s[/b] to scan & connect your BeeSIM card.[/dim]")
            self._set_buttons(connected=False)
            self.set_interval(1.0, self._render_rssi)   # keep the RSSI readout fresh

        # -- helpers --------------------------------------------------------------
        def log_line(self, msg: str) -> None:
            self.query_one("#log", RichLog).write(msg)

        # -- live RSSI ------------------------------------------------------------
        def _render_rssi(self) -> None:
            import time
            w = self.query_one("#rssi", Static)
            if self.client is None or self.rssi is None:
                w.update("RSSI —")
                return
            age = time.monotonic() - self.rssi_ts
            dbm = self.rssi
            # 4-block signal bar from dBm (~ -50 strong .. -100 weak)
            bars = max(0, min(4, (dbm + 100) // 12))
            bar = "▂▄▆█"[:bars] + "·" * (4 - bars)
            colour = "green" if dbm >= -67 else "yellow" if dbm >= -80 else "red"
            stale = "  [dim](stale)[/dim]" if age > 5 else ""
            w.update(f"RSSI [{colour}]{bar} {dbm} dBm[/{colour}]{stale}")

        @work(exclusive=True, group="rssi")
        async def _rssi_monitor(self) -> None:
            """Poll the connected link's RSSI (the card stops advertising once
            connected, so a scanner won't see it). Uses read_rssi()."""
            import time
            warned = False
            while self.client is not None:
                try:
                    r = await read_rssi(self.client)
                except Exception:
                    r = None
                if r is not None:
                    self.rssi = r
                    self.rssi_ts = time.monotonic()
                elif not warned:
                    warned = True
                    self.log_line("[dim]Live RSSI not available on this platform.[/dim]")
                await asyncio.sleep(2.0)

        def _from_ble(self, msg: str) -> None:
            # called from euicc.on_log (already on the event loop)
            self.query_one("#log", RichLog).write(f"[dim]{msg}[/dim]")

        def _set_buttons(self, connected: bool) -> None:
            for bid in ("btn-refresh", "btn-enable", "btn-disable", "btn-delete",
                        "btn-rename", "btn-txpower", "btn-reset"):
                self.query_one(f"#{bid}", Button).disabled = not connected

        def _status(self, text: str, ok: bool) -> None:
            s = self.query_one("#status", Static)
            s.update(("● " if ok else "○ ") + text)
            s.set_class(ok, "connected")
            s.set_class(not ok, "disconnected")

        def _selected_iccid(self) -> str | None:
            table = self.query_one("#profiles", DataTable)
            if table.row_count == 0:
                return None
            try:
                row = table.get_row_at(table.cursor_row)
            except Exception:
                return None
            return str(row[0])

        def _guard(self) -> bool:
            if self.sim is None:
                self.log_line("[yellow]Not connected — press [b]s[/b] first.[/yellow]")
                return False
            if self.busy:
                self.log_line("[yellow]Busy — wait for the current operation.[/yellow]")
                return False
            return True

        # -- button routing -------------------------------------------------------
        def on_button_pressed(self, event: Button.Pressed) -> None:
            actions = {
                "btn-scan": self.action_scan, "btn-refresh": self.action_refresh,
                "btn-enable": self.action_enable, "btn-disable": self.action_disable,
                "btn-delete": self.action_delete, "btn-rename": self.action_rename,
                "btn-txpower": self.action_txpower, "btn-reset": self.action_reset,
            }
            act = actions.get(event.button.id)
            if act:
                act()

        # -- actions (each spawns an async worker) --------------------------------
        def action_scan(self) -> None:
            if self.sim is not None:
                self.log_line("[yellow]Already connected.[/yellow]")
                return
            self._connect_worker()

        @work(exclusive=True)
        async def _connect_worker(self) -> None:
            self.busy = True
            self._status("scanning…", False)
            self.log_line("Scanning for [b]BeeSIM*[/b] …")
            try:
                self.client, self.sim, self.euicc = await connect(self.address)
                self.euicc.on_log = self._from_ble
                name = getattr(self.client, "address", "device")
                self.query_one("#devname", Static).update(f"[dim]{name}[/dim]")
                self._status("connected", True)
                self._set_buttons(connected=True)
                self.log_line("[green]Connected.[/green] Reading EID…")
                self._rssi_monitor()                     # start live RSSI
                eid = await self.sim.get_eid()
                self.query_one("#eid", Static).update(f"EID {eid}")
                self.log_line(f"[green]EID[/green] {eid}")
                await self._load_profiles()
            except Exception as exc:  # noqa: BLE001
                self._status("disconnected", False)
                self.log_line(f"[red]Connect failed:[/red] {exc}")
                self.client = self.sim = self.euicc = None
                self.rssi = None
            finally:
                self.busy = False

        def action_refresh(self) -> None:
            if self._guard():
                self._refresh_worker()

        @work(exclusive=True)
        async def _refresh_worker(self) -> None:
            self.busy = True
            try:
                await self._load_profiles()
            except Exception as exc:  # noqa: BLE001
                self.log_line(f"[red]Refresh failed:[/red] {exc}")
            finally:
                self.busy = False

        async def _load_profiles(self) -> None:
            self.log_line("Reading profiles…")
            profiles = await self.sim.get_profiles()
            table = self.query_one("#profiles", DataTable)
            table.clear()
            for p in profiles:
                state = p.get("profileState", "?")
                dot = "[green]● ON [/green]" if state == "ON" else "[dim]○ OFF[/dim]"
                table.add_row(
                    p.get("iccid", "?"), dot,
                    p.get("profileNickname") or p.get("profileName", ""),
                    p.get("serviceProviderName", ""),
                    p.get("profileClass", ""),
                )
            self.log_line(f"[green]{len(profiles)} profile(s).[/green]")

        def action_enable(self) -> None:
            self._profile_op("enable")

        def action_disable(self) -> None:
            self._profile_op("disable")

        def _profile_op(self, op: str) -> None:
            if not self._guard():
                return
            iccid = self._selected_iccid()
            if not iccid:
                self.log_line("[yellow]Select a profile row first.[/yellow]")
                return
            self._op_worker(op, iccid)

        @work(exclusive=True)
        async def _op_worker(self, op: str, iccid: str) -> None:
            self.busy = True
            try:
                self.log_line(f"{op.capitalize()} {iccid} …")
                if op == "enable":
                    await self.sim.enable_profile(iccid)
                else:
                    await self.sim.disable_profile(iccid)
                self.log_line(f"[green]{op} OK.[/green] Reset the card to apply (press Reset card).")
                await self._load_profiles()
            except Exception as exc:  # noqa: BLE001
                self.log_line(f"[red]{op} failed:[/red] {exc}")
            finally:
                self.busy = False

        def action_delete(self) -> None:
            if not self._guard():
                return
            iccid = self._selected_iccid()
            if not iccid:
                self.log_line("[yellow]Select a profile row first.[/yellow]")
                return

            def done(confirmed: bool | None) -> None:
                if confirmed:
                    self._delete_worker(iccid)

            self.push_screen(ConfirmScreen(f"Delete profile {iccid}?\nThis is irreversible."), done)

        @work(exclusive=True)
        async def _delete_worker(self, iccid: str) -> None:
            self.busy = True
            try:
                self.log_line(f"Deleting {iccid} …")
                await self.sim.delete_profile(iccid)
                self.log_line("[green]Deleted.[/green]")
                await self._load_profiles()
            except Exception as exc:  # noqa: BLE001
                self.log_line(f"[red]Delete failed:[/red] {exc}")
            finally:
                self.busy = False

        def action_rename(self) -> None:
            if not self._guard():
                return
            iccid = self._selected_iccid()
            if not iccid:
                self.log_line("[yellow]Select a profile row first.[/yellow]")
                return

            def done(name: str | None) -> None:
                if name is not None and name != "":
                    self._rename_worker(iccid, name)

            self.push_screen(InputScreen(f"New nickname for {iccid}:", "nickname"), done)

        @work(exclusive=True)
        async def _rename_worker(self, iccid: str, name: str) -> None:
            self.busy = True
            try:
                self.log_line(f"Renaming {iccid} → {name!r} …")
                await self.sim.set_nickname(iccid, name)
                self.log_line("[green]Renamed.[/green]")
                await self._load_profiles()
            except Exception as exc:  # noqa: BLE001
                self.log_line(f"[red]Rename failed:[/red] {exc}")
            finally:
                self.busy = False

        def action_reset(self) -> None:
            if self._guard():
                self._reset_worker()

        @work(exclusive=True)
        async def _reset_worker(self) -> None:
            self.busy = True
            try:
                self.log_line("Resetting card…")
                await self.euicc.reset()
                self.log_line("[green]Reset sent.[/green] (BLE link may drop; reconnect with [b]s[/b].)")
            except Exception as exc:  # noqa: BLE001
                self.log_line(f"[red]Reset failed:[/red] {exc}")
            finally:
                self.busy = False

        def action_txpower(self) -> None:
            if not self._guard():
                return

            def done(level: int | None) -> None:
                if level is not None:
                    self._txpower_worker(level)

            self.push_screen(TxPowerScreen(), done)

        @work(exclusive=True)
        async def _txpower_worker(self, level: int) -> None:
            self.busy = True
            try:
                self.log_line(f"Setting BLE TX power to {level} …")
                await self.euicc.set_tx_power(level)
                self.log_line(f"[green]TX power set to {level}.[/green]")
            except Exception as exc:  # noqa: BLE001
                self.log_line(f"[red]TX power failed:[/red] {exc}")
            finally:
                self.busy = False

        def action_info(self) -> None:
            if self._guard():
                self._info_worker()

        @work(exclusive=True)
        async def _info_worker(self) -> None:
            self.busy = True
            try:
                self.log_line("Reading EUICCInfo2…")
                info = await self.sim.get_euicc_info2()
                import json
                for line in json.dumps(info, indent=2).splitlines():
                    self.log_line(f"[cyan]{line}[/cyan]")
            except Exception as exc:  # noqa: BLE001
                self.log_line(f"[red]Info failed:[/red] {exc}")
            finally:
                self.busy = False

        def action_notifications(self) -> None:
            if self._guard():
                self._notif_worker()

        @work(exclusive=True)
        async def _notif_worker(self) -> None:
            self.busy = True
            try:
                self.log_line("Listing notifications…")
                raw = await self.sim.list_notifications()
                self.log_line(f"[cyan]ListNotification TLV:[/cyan] {b2h(raw)}")
            except Exception as exc:  # noqa: BLE001
                self.log_line(f"[red]Notifications failed:[/red] {exc}")
            finally:
                self.busy = False

        def action_apdu(self) -> None:
            if not self._guard():
                return

            def done(hexstr: str | None) -> None:
                if hexstr:
                    self._apdu_worker(hexstr)

            self.push_screen(
                InputScreen("Raw APDU (hex) — e.g. A03F0000 00:", "A0 3F 00 00 00"), done
            )

        @work(exclusive=True)
        async def _apdu_worker(self, hexstr: str) -> None:
            self.busy = True
            try:
                apdu = h2b(hexstr)
                self.log_line(f"[magenta]--> {b2h(apdu)}[/magenta]")
                resp = await self.euicc.send_command(apdu, reinit_on_6881=False)
                self.log_line(f"[magenta]<-- {b2h(resp)}[/magenta]")
            except Exception as exc:  # noqa: BLE001
                self.log_line(f"[red]APDU failed:[/red] {exc}")
            finally:
                self.busy = False

        def action_disconnect(self) -> None:
            if self.client is not None:
                self._disconnect_worker()

        @work(exclusive=True)
        async def _disconnect_worker(self) -> None:
            client = self.client
            self.client = self.sim = self.euicc = None   # signals the RSSI monitor to stop
            self.rssi = None
            try:
                if client is not None:
                    await client.disconnect()
            except Exception:  # noqa: BLE001
                pass
            self._status("disconnected", False)
            self._set_buttons(connected=False)
            self.query_one("#eid", Static).update("")
            self.query_one("#devname", Static).update("")
            self.query_one("#profiles", DataTable).clear()
            self.log_line("[yellow]Disconnected.[/yellow]")

        async def action_quit(self) -> None:
            client = self.client
            self.client = None                           # stop the RSSI monitor
            if client is not None:
                try:
                    await client.disconnect()
                except Exception:  # noqa: BLE001
                    pass
            self.exit()



    return BeeSimApp


def run_tui(address=None):
    """Launch the Textual terminal UI (press the footer keys in-app)."""
    _build_tui_app()(address=address).run()


def main():
    p = argparse.ArgumentParser(description="BeeSIM BLE controller")
    p.add_argument("--address", help="BLE MAC/UUID (skip scan)")
    p.add_argument("--debug", action="store_true", help="log all APDU traffic to stderr")
    sub = p.add_subparsers(dest="command")
    sub.add_parser("tui", help="launch the terminal UI (default when no command given)")
    sub.add_parser("scan")
    sub.add_parser("info")
    sub.add_parser("eid")
    sub.add_parser("list")
    for c in ("enable", "disable", "delete"):
        sp = sub.add_parser(c)
        sp.add_argument("iccid")
    sp = sub.add_parser("rename"); sp.add_argument("iccid"); sp.add_argument("nickname")
    sub.add_parser("reset")
    sp = sub.add_parser("txpower", help="set the card's BLE TX power (0-4)")
    sp.add_argument("level", type=int, choices=range(5))
    sub.add_parser("notifications")
    sp = sub.add_parser("apdu"); sp.add_argument("hex")
    args = p.parse_args()

    # No sub-command (or an explicit `tui`) -> launch the terminal UI.
    if args.command in (None, "tui"):
        run_tui(args.address)
    else:
        asyncio.run(_run(args))


if __name__ == "__main__":
    main()
