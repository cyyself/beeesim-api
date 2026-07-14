# BeeSIM BLE controller

Pure-Bluetooth control for **BeeSIM eUICC cards**, reverse-engineered from the
official web LPA at `https://beeesim.com/ble/` (build *"BeeSIM Web v2.1.4"*).
Enable / disable / delete / rename eSIM profiles, read the EID & card info,
manage notifications, and set the card's BLE TX power — all over BLE, no
network. Ships with a CLI and a Textual terminal UI (with a live signal-strength
readout) in a single file.

## Install

```bash
pip install bleak          # required (BLE)
pip install textual        # optional — only for the terminal UI
# or: pip install -r requirements.txt
```

## Quick start

```bash
python beesim.py                       # launch the terminal UI (default)
python beesim.py list                  # CLI: list profiles as JSON
python beesim.py enable  <iccid>       # enable a profile (then `reset`)
python beesim.py disable <iccid>
python beesim.py rename  <iccid> "Work SIM"
python beesim.py eid
python beesim.py txpower 4              # set BLE TX power (0=min .. 4=max)
python beesim.py --help                # full command list
```

### Terminal UI

`python beesim.py` (or `python beesim.py tui`) opens the TUI:

- **sidebar** — connection status, **live RSSI** (BLE signal strength), EID,
  Scan/Connect, Refresh, Enable/Disable/Delete/Rename, **TX Power**, Reset card
- **table** — profiles with live ON/OFF state
- **log** — actions and APDU traffic
- **keys** — `s` scan · `r` refresh · `e`/`d` enable/disable · `x` delete ·
  `n` rename · `i` info · `N` notifications · `t` TX power · `a` raw APDU ·
  `c` disconnect · `q` quit

The RSSI readout polls the **connected link** every ~2 s (via the platform
backend — CoreBluetooth on macOS, BlueZ on Linux). BeeSIM cards stop advertising
once connected, so a passive scanner can't see them; polling the live connection
is what makes the reading work. Windows has no equivalent, so it shows `—` there
(as does a dropped/stale link).

> Requires a host with a working Bluetooth adapter and OS BLE permissions
> (macOS: grant the terminal Bluetooth access in System Settings → Privacy).

---

## ⚠️ Security warning — unauthenticated BLE profile management

**This card exposes eUICC profile management over BLE with no reliable access
control, and provides no way to switch Bluetooth off. Treat it as a serious
attack surface.**

What this project shows about the card's security posture:

- The web app enforces **no PIN** on the BLE link: the `skip_pin` setting is
  stored but never read, and no verify/set/change-PIN command exists anywhere in
  the app (it is firmware-only, and dormant). Any BLE peer that can reach the
  card can run the full ES10 profile API: **list, enable, disable, delete, and
  rename profiles**, with no authentication.
- **Confirmed on real hardware.** Against a live card, this tool connects and
  runs the full ES10 profile API (read/enable/disable/…) with **no PIN prompt of
  any kind** — see the empirical probe in §5. No pairing, bonding, or link
  encryption is required to reach the eUICC.
- There is **no physical switch** to disable the card's Bluetooth radio. If the
  card is powered (in a phone, or a slot adapter), it is discoverable and
  connectable, continuously.
- **No audit trail or user notification.** Profile changes made over BLE are
  silent — the phone/owner gets no prompt, log, or alert, so the attack leaves
  little trace on the victim's side.

### Threat model

**Attacker prerequisites.** Cheap and off-the-shelf: a laptop/phone with a BLE
radio (optionally a high-gain antenna / amplified BLE front-end to push range
from ~10 m to **tens or hundreds of metres**), proximity to the victim once, and
— for the full hijack — a **portable LTE/5G base station** (a rogue gNB/eNB /
IMSI-catcher, now buildable with SDR + open-source stacks) plus a profile whose
credentials the attacker controls (their own SM-DP+ / test operator). No secret,
no PIN, and no pairing is needed to talk to the card.

**What the attacker can do, without the owner noticing:**

1. **Denial of service.** Disable or delete the victim's active eSIM → no data,
   no calls, no SMS. This alone can defeat **SMS-based 2FA / account recovery**
   at a chosen moment (e.g. while the attacker resets a victim's password), and
   can knock out emergency connectivity.
2. **Full mobile-data hijack.** Install/enable an **attacker-controlled
   profile**, then run a rogue base station whose network that profile is
   provisioned to trust. Because the profile carries the cellular auth keys the
   attacker chose, the rogue base station completes **mutual authentication** —
   the step that normally stops IMSI-catchers — and the phone attaches "legit".
   The attacker is now an on-path **man-in-the-middle for all mobile data**.

**A concrete attack chain:**

```
1. Attacker walks within BLE range of the powered card (pocket, bag, desk).
2. Connects over BLE — no PIN, no pairing (verified: full ES10 access).
3. Installs + enables a profile keyed to the attacker's own SM-DP+/operator.
4. Resets the eUICC so the phone re-attaches using the new profile.
5. Attacker's portable base station authenticates the phone and carries its data.
6. Attacker intercepts / redirects / downgrades / blocks traffic at will.
```

**Impact once MITM is established:** interception of any non-end-to-end-encrypted
traffic, **DNS/route manipulation**, TLS-downgrade and captive-portal style
redirection, **interception of SMS one-time-passwords**, selective blocking,
and **IMSI/location tracking**. The profile swap can persist across reboots
until the owner notices missing/renamed profiles and manually restores them.

The unauthenticated, always-on BLE interface is the pivot: it turns a
rogue-base-station attack (normally defeated by mutual authentication) into a
practical hijack — the attacker first **rewrites the SIM over Bluetooth**, then
captures the traffic **over the air**. The two weaknesses compose.

**Also at risk:** the SIM's own PIN/ADM key counters are reachable over this same
unauthenticated link (see §5) — a malicious peer could deliberately submit wrong
guesses to **block the SIM (PUK) or permanently block ADM keys**, a
non-recoverable denial of service, with no authentication required.

### Mitigations

**For owners (do this now):**

- **Turn the BLE TX power down to 0** — the single most practical step. This
  minimises the card's radio range so an attacker has to be very close:

  ```bash
  python beesim.py txpower 0          # 0 = minimum range
  ```

  It's reversible: you can restore it to full (**4**) later either with
  `python beesim.py txpower 4`, or **from the phone itself via the SIM Toolkit
  (STK) menu** (*SIM Applications / SIM Toolkit → BeeSIM → set TX power*), so you
  don't need this tool to undo it.
- Don't leave the card powered in an untrusted RF environment; keep it in a
  shielded/RF-blocking holder when not in use.

**For the vendor (real fix):**

- Enforce a mandatory PIN/authentication on the BLE link before any ES10 command
  (wire up the PIN the firmware already has), add a Bluetooth kill-switch, and
  use BLE bonding/encryption + pairing so arbitrary peers cannot connect.

> **Caveat:** lowering TX power **reduces range, it does not add authentication.**
> A determined attacker with a high-gain antenna / amplified receiver can still
> reach a low-power transmitter. Treat `txpower 0` as harm-reduction until the
> vendor ships proper access control — not as a fix.

### Responsible disclosure

This issue has been **reported to the vendor (BeeSIM)** by the card owner, and a
response is pending as of **2026-07-14**. This repository documents the owner's
own testing of their own card for defensive purposes; it intentionally ships no
profile-download or PIN-bypass tooling. Please do not use it against cards you do
not own. This section will be updated when the vendor responds or issues a fix.

---

## Protocol reference (reverse-engineered)

Source: the official web LPA at `https://beeesim.com/ble/` — a Vue 3 SPA,
build string **"BeeSIM Web v2.1.4"**. All of the below was recovered by
downloading and de-minifying the JS chunks (`index`, `i18n` (contains the BLE
core), `utils`, `pages`). The card is a **GSMA SGP.22 eUICC** (Remote SIM
Provisioning) reachable over Bluetooth Low Energy.

> **How the JS was obtained**: the CDN serves the JS assets only when the request
> sends `Accept-Encoding: gzip` (nginx `gzip_static` — a plain request 404s).
> `curl --compressed` (or a mobile User-Agent + Accept-Encoding) returns them.

---

## 1. BLE transport

| Item | Value |
|------|-------|
| Device name filter | `namePrefix: "BeeSIM"` |
| GATT service | `0000ae30-0000-1000-8000-00805f9b34fb` (16-bit `0xAE30`) |
| Write characteristic | the service char with `write` / `writeWithoutResponse` |
| Notify characteristic | the service char with `notify` / `indicate` |

The app does **not** hard-code the characteristic UUIDs — it selects them by
property from the first primary service. `beesim.py` does the same.

### Framing

APDUs longer than one ATT packet are split into **18-byte groups**. Every packet
(both directions) is prefixed with a 2-byte header:

```
byte0 = total number of groups
byte1 = this group's index, 1-based
byte2.. = up to 18 bytes of APDU
```

Reassembly: when `index == 1`, reset the buffer; append `packet[2:]`; when
`total == index`, the APDU response is complete. The reassembled response
**includes the trailing SW1 SW2 status word**.

---

## 2. Command architecture

The payload of each frame is an ISO-7816 APDU. Two families are used:

### 2a. Vendor commands (CLA `0xA0` and misc), sent raw

| Command | APDU (hex) | Meaning |
|---------|-----------|---------|
| Set BLE TX power | `A0 3E <pwr> 00 00` | `pwr` 0–4 (0=min, 4=max; 5–7 no effect); app uses `4` during download |
| Reset eUICC | `A0 3F 00 00 00` | soft reset / refresh |
| Firmware progress | `00 00 00 00 F4 01 01` | returns `10 .. crc(2) totalRows(2) currentRow(2)` |
| Firmware row write | `00 00 00 00 F4 .. <row>` | used by the OTA updater (per-line) |
| Device features | `80 AA 00 00 0A A9 08 81 00 82 01 01 83 01 07` | vendor GET DATA during channel open |

### 2b. eUICC session (ISO-7816 + GlobalPlatform), for all ES10 commands

Before any ES10 command the app opens a logical channel and selects the ISD-R:

```
00 70 80 01 00                     MANAGE CHANNEL — close channel 1
80 AA 00 00 0A A9 08 81 00 82 01 01 83 01 07   (vendor "device features")
00 70 00 01 00                     MANAGE CHANNEL — open  channel 1   (expect 90 00)
01 A4 04 00 10 A0000005591010FFFFFFFF8900000100   SELECT ISD-R AID
```

ES10 command **TLVs** are then carried inside **STORE DATA** and the response is
pulled with **GET RESPONSE**:

```
STORE DATA :  81 E2 <P1> <blk> <Lc> <data>   P1 = 0x11 (more) / 0x91 (last), blk from 0
              max 239 data bytes per block; last block replies 61 <len>
GET RESPONSE: 81 C0 00 00 <len>              loop while SW=61 xx; done on 90 00
```

`CLA = (channel & 0x0F) | 0x80 = 0x81` for channel 1.

If any command returns SW `68 81` ("logical channel not supported"), the app
re-opens the channel + re-selects ISD-R once and retries.

---

## 3. ES10 API surface (all recovered)

Commands are BER-TLV. ICCIDs are **nibble-swapped** on the card (JS helper `R`):
e.g. `89014103...` is stored/sent as `98104130...`.

| App function | Standard | Command TLV | Notes |
|--------------|----------|-------------|-------|
| `GetEID` | ES10c | `BF3E 03 5C 01 5A` | response `BF3E … 5A <eid>` |
| `GetEUICCInfo1` | ES10b | `BF20 00` | SVN etc. |
| `GetEUICCInfo2` | ES10b | `BF22 00` | firmware/capability info |
| `GetEUICCChallenge` | ES10b | `BF2E 00` | download step 1 |
| `GetProfilesInfo` | ES10c | `BF2D 00` | list all profiles (see §4) |
| `EnableProfile` | ES10c | `BF31 {A0{5A <iccid>}} 81 01 00` | refreshFlag=0 |
| `DisableProfile` | ES10c | `BF32 {A0{5A <iccid>}} 81 01 00` | |
| `DeleteProfile` | ES10c | `BF33 {5A <iccid>}` | |
| `SetNickname` | ES10c | `BF29 {5A <iccid>}{90 <utf8 name>}` | |
| `ListNotification` | ES10b | `BF28 00` | |
| `RetrieveNotificationsList` | ES10b | `BF2B {A0{80 <seq>}}` or `BF2B 00` | |
| `RemoveNotificationFromList` | ES10b | `BF30 {80 <seq>}` | |
| `AuthenticateServer` | ES10b | `BF38 <serverSigned1><serverSignature1><ciPKId><serverCert>{A0 …}` | download step 2 |
| `PrepareDownload` | ES10b | `BF21 <smdpSigned2><smdpSignature2>[04 <hashCC>]<smdpCert>` | download step 3 |
| `LoadBoundProfilePackage` | ES10b | BPP segmented into STORE DATA blocks | download step 4 |

**Result codes** (Enable/Disable/Delete/Nickname), read from response tag `80`:
`00`=success, `01`=iccid/profile not found, `02`=wrong state (already on/off),
`03`=profile-policy forbids it, `04`=profile error, `05`=eUICC busy.

### GetProfilesInfo response (§4)

`BF2D → A0 → [E3 …]`, each `E3` (ProfileInfo):

| Tag | Field | Decode |
|-----|-------|--------|
| `5A` | iccid | nibble-swap, strip trailing `F` |
| `4F` | isdpAid | hex |
| `9F70` | profileState | `01`→ON else OFF |
| `90` | profileNickname | UTF-8 |
| `91` | serviceProviderName | UTF-8 |
| `92` | profileName | UTF-8 |
| `93` | iconType | `01`→jpg else png |
| `94` | icon | base64 |
| `95` | profileClass | `01`=provisioning `02`=operational else test |

---

## 4. eSIM download (LPA) flow — reference only, NOT implemented

Downloading a *new* profile is intentionally **out of scope**: `beesim.py` is
pure BLE with no network traffic. This is inherent to GSMA RSP — the profile
lives on the operator's SM-DP+ server and cannot be obtained without an online
handshake, so it isn't "controlling the card over BLE".

For reference, the web app does it by proxying ES9+ through beeesim's backend
(`POST https://beeesim.com/fetch/v2/plugin/esim/rsp/es9plus/execute.do?action=…`,
actions `initiateAuthentication` / `authenticateClient` / `getBoundProfilePackage`
/ `handleNotification`), interleaved with the ES10b card commands
`GetEUICCChallenge → AuthenticateServer → PrepareDownload →
LoadBoundProfilePackage → RemoveNotificationFromList`. The ES10b card-side
building blocks (`get_euicc_challenge`, `store_and_read`, `store_bytes`,
`get_response`) remain in `beesim.py` if you ever want to build a downloader.

---

## 5. Bluetooth-PIN — firmware-only, not implemented here

For completeness (it underpins the security warning above): the web app has
**no working Bluetooth-PIN**. What's in the build:

- **Dormant strings only** — `enter-bluetooth-pin`, `bluetooth-pin`,
  `pin-first-tip`, `pin-remember-tip` exist in the translations but the UI never
  shows them.
- **`skip_pin`** — a `localStorage` toggle that is written but **never read** in
  the JS (so it does nothing; any enforcement would be in card firmware).
- **`reset_pin`** — a *server-side* HTTP action (`POST
  /v1/main/user/mall.do?action=reset_pin`, body `{eid}`, needs the account
  token), not a BLE command.
- **No VERIFY/SET/CHANGE-PIN APDU anywhere in the JavaScript.**

So there is nothing to drive over BLE, and this controller deliberately ships no
PIN command. If you obtain the firmware's PIN opcode (via a BLE/HCI-snoop capture
or the vendor spec), you can send it manually with `python beesim.py apdu <hex>`.

### Change-PIN APDUs tried against a real card (empirical)

I probed candidate verify/change-PIN commands over BLE against a live card
(assuming the stated default PIN `0000`). Results:

| Command (PIN 0000) | Response | Reading |
|---|---|---|
| `A0 20` / `A0 24` (vendor CLA) | `6E 00` | CLA not supported → **not a vendor command** |
| `00 20` / `00 24`, 4-byte data | `67 00` | wrong length → wants classic **8-byte CHV** |
| `00 20` / `00 24`, 8-byte CHV, P2=01 | `69 84` | CHV1 reference disabled/invalidated |
| `00 20` P2-sweep, 8-byte CHV `0000` | mixed | see below |

The P2 (reference) sweep showed the ISO `VERIFY` reaches the **SIM's own PIN
layer**, not a Bluetooth device PIN: `P2=01` (CHV1) disabled (`69 84`), and
**active PIN/ADM references at `P2=0A/0B/81`** returning `63 Cx` — these are the
SIM's ADM/application keys, *not* the Bluetooth PIN, and `0000` is not their
value. **No candidate returned `90 00`.**

Decisive point: the full ES10 profile API (list/enable/disable/…) works over BLE
**with no PIN prompt at all**, so no Bluetooth PIN is gating access on this card.
The change-PIN feature is a firmware layer not reachable via standard or vendor
APDUs — it could not be exercised, and nothing is wired in.

> ⚠️ **Do not brute-force `P2=0A/0B/81`.** Those are the SIM's ADM/app keys; a
> wrong guess decrements their retry counter and exhausting it blocks the key
> (PUK-required, or permanent for ADM). During probing each was tried exactly
> once and left with 2 attempts remaining — leave them alone.

---

## 6. Files

| File | What |
|------|------|
| `beesim.py` | single-file pure-BLE controller: transport + eUICC + ES10 + CLI + Textual TUI |
| `README.md` | this document |
| `requirements.txt` | `bleak` (+ `textual` for the TUI) |
| `assets/`, `src/`, `index.html` | the downloaded web-app sources (raw JS chunks) |
