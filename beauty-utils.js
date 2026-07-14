import { g as e, nt as t, rt as n } from "./vue-Cxg3tivS.js";
import { A as r, C as i, D as a, E as o, O as s, T as c, a as l, c as u, d, g as f, h as p, o as m, r as h, t as g, v as _, w as v } from "./i18n-UkYQ0Akr.js";
import { r as y } from "./libs-C4HcdMbZ.js";
function b(e) {
  let t = d(e.params),
    n = { method: e.method || `GET`, url: `/fetch${e.url}${t ? `?` + t : ``}` },
    r = JSON.stringify(e.data);
  return (
    m(r) || ((n.body = r), e.headers ? e.headers.append(`Content-Type`, `application/json;charset=UTF-8`) : (e.headers = new Headers({ "Content-Type": `application/json;charset=UTF-8` }))),
    (n.headers = e.headers),
    n
  );
}
function x(e, t) {
  return M({ url: `/v2/plugin/esim/rsp/es9plus/execute.do`, method: `POST`, params: { action: e }, data: t });
}
function S(e, t) {
  let n = d(e),
    r = m(t) ? `` : JSON.stringify(t),
    i = Date.now().toString(),
    a = h.md5(h.base64.encrypt(n + r + i + `Hz3wU92K2ion6Kaq`, `UTF-8`));
  return new Headers({ "X-Timestamp": i, "X-Sign": a });
}
function C(e, t, n) {
  let r = d(e),
    i = m(t) ? `` : JSON.stringify(t),
    a = Date.now().toString(),
    o = new Headers({ "B-Timestamp": a }),
    s = ``;
  if (n) {
    let e = L();
    if (e.user?.token) ((s = e.user.token), o.append(`B-Token`, s));
    else throw Error(g().global.t(`tips.not-logined`));
  }
  let c = h.md5(h.base64.encrypt(r + i + s + a + `zv2B0eHe2StpI5My`, `UTF-8`));
  return (o.append(`B-Sign`, c), o);
}
async function w(e, t) {
  let n = { action: e };
  return await M({ headers: S(n, t), url: `/v2/plugin/mall/firmware.do`, method: `POST`, params: n, data: t });
}
async function T(e, t) {
  return await M({ url: `/v1/main/common/logger.do`, method: `POST`, params: { action: e }, data: t });
}
async function E(e, t) {
  let n = { action: e };
  return await M({ url: `/v1/main/user/mall/login.do`, headers: C(n, t), method: `POST`, params: n, data: t });
}
async function D(e, t) {
  return await M({ url: `/v1/main/user/mall/jwt/bluetooth.do`, headers: C(e, t, !0), method: `POST`, params: e, data: t });
}
var O = {};
function k(e) {
  return Date.now() - (O[e] || 0) < 6e5;
}
async function A(e) {
  if (k(e.to)) return { status: 200, msg: `Success` };
  let t = { action: `email` },
    n = await M({ url: `/v1/main/common/mall/vercode.do`, headers: C(t, e), method: `POST`, params: t, data: e });
  return (n.status === 200 && (O[e.to] = Date.now()), n);
}
async function j(e, t) {
  let n = { action: e };
  return await M({ url: `/v1/main/user/mall.do`, headers: C(n, t, !0), method: `POST`, params: n, data: t });
}
function M(e) {
  return new Promise((t, n) => {
    let r = b(e);
    fetch(r.url, r)
      .then((e) => {
        e.ok
          ? e
              .json()
              .then((e) => {
                (e.status === 401 && setTimeout(() => L().removeUserStore(), 3e3), t(e));
              })
              .catch((e) => {
                n({ status: 500, message: e.message });
              })
          : n({ status: e.status, message: e.statusText });
      })
      .catch((e) => {
        n({ status: 502, message: e.message });
      });
  });
}
function N(e, t) {
  if (t) return h.sha256.digest(r(h.sha256.hex(t) + e));
}
var P = new (class {
    smdpAddress;
    matchingId;
    confirmCode;
    pending = 0;
    total = 100;
    protocol;
    setSmdpAddress(e) {
      return (e === `rsp.simhub.cn` && (e = `rsp-eu.redteamobile.com`), (this.smdpAddress = e), s.isDebug() && s.info(`DP+地址：${this.smdpAddress || `<无>`}`, `设置DP+地址`), this);
    }
    setMatchingId(e) {
      return ((this.matchingId = e), s.isDebug() && s.info(`激活码：${this.matchingId || `<无>`}`, `设置激活码`), this);
    }
    setConfirmCode(e) {
      return ((this.confirmCode = e), s.isDebug() && s.info(`确认码：${this.confirmCode || `<无>`}`, `设置确认码`), this);
    }
    handleResponse(e) {
      if ((s.isDebug() && s.info(JSON.stringify(e), `DP+服务器应答`), _.addLoggerHttp(`response`, e.data), e.status === 200)) return e.data;
      if (e.data?.header?.functionExecutionStatus?.statusCodeData?.reasonCode) {
        let t = e.data.header.functionExecutionStatus.statusCodeData.reasonCode,
          n = g().global.t;
        switch (t) {
          case `6.1`:
            throw Error(n(`tips.rsp.auth-failed-esim-unavailable`, { code: t }));
          case `6.3`:
            throw Error(n(`tips.rsp.cert-expired-esim-unavailable`, { code: t }));
          case `4.8`:
            throw Error(n(`tips.rsp.no-enough-space`, { code: t }));
          case `3.9`:
            throw Error(n(`tips.rsp.unknown-param`, { code: t }));
          case `3.8`:
            throw Error(n(`tips.rsp.qrcode-expired`, { code: t }));
          case `2.2`:
            throw Error(n(`tips.rsp.missing-confirm-code`, { code: t }));
          default:
            throw Error(`[${t}] ${e.msg}`);
        }
      }
      throw Error(e.msg);
    }
    reportLogToServer(e) {
      _.addLoggerMessage(e);
      let t = _.toLoggerData();
      t && t.eid && t.smdpAddress && T(`save`, t).catch(() => {});
    }
    async start() {
      try {
        ((this.pending = 0),
          a.setPercentage(() => {
            s.percentage({ index: ++this.pending, total: this.total, label: this.pending.toString() });
          }),
          a.resetCounter(),
          a.setInited(!1));
        let e = g().global.t;
        s.percentage({ index: ++this.pending, total: this.total, message: e(`common.adding-esim`), loader: e(`common.initializing`), label: this.pending.toString() });
        let t = await _.getEID();
        (_.setLogger({ smdpAddress: this.smdpAddress, matchingId: this.matchingId, eid: t, items: [] }), await a.setTXPower(4));
        let n = await this.step1_InitiateAuthentication(),
          r = n.toJson().authenticateResponseOk.euiccSigned1.transactionId;
        s.percentage({ index: ++this.pending, total: this.total, loader: e(`common.verifying`), label: this.pending.toString() });
        let i = await this.step2_AuthenticateClient(r, n.toBase64());
        s.percentage({ index: ++this.pending, total: this.total, loader: e(`common.downloading`), label: this.pending.toString() });
        let o = await this.step3_GetBoundProfilePackage(r, i.toBase64());
        return (
          this.total - this.pending > 20 && (this.pending = this.total - 20),
          s.percentage({ index: ++this.pending, total: this.total, loader: e(`common.notifying`), label: this.pending.toString() }),
          await this.step4_HandleNotification(o),
          s.percentage({ index: 1e3, total: this.total, message: e(`common.install-success`) }),
          a.closePercentage(),
          this.reportLogToServer(`安装成功`),
          !0
        );
      } catch (e) {
        throw (this.reportLogToServer(e.message), s.percentage({ index: -1, total: this.total, message: e.message }), a.closePercentage(), e);
      }
    }
    async askUserWhetherContinue(e) {
      let t = o(h.base64.decryptAsBytes(e))[0],
        n = new v(t).toJson(),
        r = g().global.t;
      if (
        !(
          await p({
            title: `${r(`common.number`)}：${n.iccid}`,
            content: `${r(`api.install-continue-prompt`)}<${n.serviceProviderName || n.profileNickname || n.profileName || r(`common.unknown`)}>`,
            confirmText: r(`common.install-continue`),
          })
        ).confirm
      )
        throw Error(r(`api.cancel-install`));
    }
    async checkWhetherConfirmationCode(e) {
      let t = c(o(h.base64.decryptAsBytes(e)), `30`, `01`);
      if (t && t.value !== `00` && m(this.confirmCode)) {
        let e = g().global.t;
        throw Error(e(`api.missing-confirm-code`));
      }
    }
    async step1_InitiateAuthentication() {
      let e = g().global.t;
      if (this.smdpAddress) {
        s.percentage({ index: ++this.pending, total: this.total, loader: e(`common.reading`), label: this.pending.toString() });
        let t = await i.GetEUICCChallenge();
        s.isDebug() && s.info(t, `参数[euiccChallenge]`);
        let n = await i.GetEUICCInfo1();
        (s.isDebug() && s.info(JSON.stringify(n.toJson()), `参数[euiccInfo1]`),
          (this.protocol = `gsma/rsp/${_.setStoreData(`svn`, n.toJson().svn)}`),
          s.percentage({ index: ++this.pending, total: this.total, loader: e(`common.requesting`), label: this.pending.toString() }));
        let r = await F.InitAuthentication(t, n.toBase64(), this.smdpAddress, this.protocol),
          a = this.handleResponse(r);
        s.percentage({ index: ++this.pending, total: this.total, loader: e(`common.verifying`), label: this.pending.toString() });
        let o = await i.AuthenticateServer(a.serverSigned1, a.serverSignature1, a.euiccCiPKIdToBeUsed, a.serverCertificate, this.matchingId);
        return (s.isDebug() && s.info(JSON.stringify(o.toJson()), `应答[ES10b.AuthenticateServer]`), o);
      }
      let t = e(`common.missing-params`, { params: `${e(`common.smdp-address`)}、${e(`common.activation-code`)}` });
      return (s.percentage({ index: -1, total: this.total, message: t }), Promise.reject(`ES9p.InitAuthentication<br>` + t));
    }
    async step2_AuthenticateClient(e, t) {
      let n = await F.AuthenticateClient(e, t, this.smdpAddress, this.protocol),
        r = this.handleResponse(n);
      await this.checkWhetherConfirmationCode(r.smdpSigned2);
      let a = g().global.t;
      s.percentage({ index: ++this.pending, total: this.total, loader: a(`common.downloading`), label: this.pending.toString() });
      let o = await i.PrepareDownload(r.smdpSigned2, r.smdpSignature2, r.smdpCertificate, N(e, this.confirmCode));
      return (s.isDebug() && s.info(JSON.stringify(o.toJson()), `应答[ES10b.PrepareDownload]`), o);
    }
    async step3_GetBoundProfilePackage(e, t) {
      let n = await F.GetBoundProfilePackage(e, t, this.smdpAddress, this.protocol),
        r = this.handleResponse(n),
        o = g().global.t;
      s.percentage({ index: ++this.pending, total: this.total, loader: o(`common.writing`), label: this.pending.toString() });
      let c = h.base64.decryptAsBytes(r.boundProfilePackage),
        l = this.total - this.pending,
        u = Math.round(c.byteLength / a.StoreMaxLc) + 1;
      if (l - u < 10) {
        let e = u - l + 10;
        ((this.total += e), s.isDebug() && s.warning(`增加进度条数：${e}, 增加后：${this.total}`, `更新进度条总数`));
      }
      let d = await i.LoadBoundProfilePackage(c);
      return (s.isDebug() && s.info(JSON.stringify(d.toJson()), `应答[ES10b.LoadBoundProfilePackage]`), d);
    }
    async step4_HandleNotification(e) {
      try {
        (await F.HandleNotification(e.toBase64(), this.smdpAddress, this.protocol), s.percentage({ index: ++this.pending, total: this.total, label: this.pending.toString() }));
        let t = e.toJson().profileInstallationResultData.notificationMetadata;
        (await i.RemoveNotificationFromList(t.index), s.isDebug() && s.info(`发送通知至服务[${this.smdpAddress}]：发送成功！`, `应答[ES9p.HandleNotification]`));
      } catch (e) {
        s.isDebug() && s.error(`通知发送异常：${e.message}`, `ES9p.HandleNotification`);
      } finally {
        let t = e.toJson().profileInstallationResultData.finalResult;
        if (t) {
          if (t.successResult) return;
          if (t.errorResult) throw Error(t.errorResult.errorReason);
        }
        let n = g().global.t;
        throw Error(n(`api.install-result-unknown`));
      }
    }
  })(),
  F = {
    install: P,
    InitAuthentication(e, t, n, r) {
      let i = { euiccChallenge: e, euiccInfo1: t, smdpAddress: n, protocol: r };
      return (s.isDebug() && s.info(JSON.stringify(i), `es9p.InitAuthentication`), _.addLoggerHttp(`request`, i, `ES9p.InitAuthentication`), x(`initiateAuthentication`, i));
    },
    AuthenticateClient(e, t, n, r) {
      let i = { transactionId: e, authenticateServerResponse: t, smdpAddress: n, protocol: r };
      return (s.isDebug() && s.info(JSON.stringify(i), `es9p.AuthenticateClient`), _.addLoggerHttp(`request`, i, `ES9p.AuthenticateClient`), x(`authenticateClient`, i));
    },
    GetBoundProfilePackage(e, t, n, r) {
      let i = { transactionId: e, prepareDownloadResponse: t, smdpAddress: n, protocol: r };
      return (s.isDebug() && s.info(JSON.stringify(i), `es9p.GetBoundProfilePackage`), _.addLoggerHttp(`request`, i, `ES9p.GetBoundProfilePackage`), x(`getBoundProfilePackage`, i));
    },
    HandleNotification(e, t, n) {
      let r = { pendingNotification: e, smdpAddress: t, protocol: n };
      return (s.isDebug() && s.info(JSON.stringify(r), `es9p.HandleNotification`), _.addLoggerHttp(`request`, r, `ES9p.HandleNotification`), x(`handleNotification`, r));
    },
    async SendNotificationToDPServer(e) {
      let t = e.toPendingNotificationBase64(),
        [n] = e.toJson(),
        r;
      if (n)
        if (n.otherSignedNotification) r = n.otherSignedNotification.tbsOtherNotification.notificationAddress;
        else if (n.profileInstallationResult) r = n.profileInstallationResult.profileInstallationResultData.notificationMetadata.notificationAddress;
        else {
          let e = g().global.t;
          throw Error(e(`api.send-failed-missing-smdp`));
        }
      else {
        let e = g().global.t;
        throw Error(e(`api.send-failed-missing-notification`));
      }
      r === `rsp.simhub.cn` && (r = `rsp-eu.redteamobile.com`);
      let i = _.getStoreData().svn;
      return (i && (P.protocol = `gsma/rsp/${i}`), await F.HandleNotification(t, r, P.protocol));
    },
  },
  I = F;
const L = y(`global`, () => {
  let r = ``,
    o = { USER: `USER_INFO_DATA`, PROFILE: `PROFILE_LIST_DATA`, SETTINGS: `BEESIM_SETTINGS_DATA` },
    c = {},
    d = t(u.getObject(o.USER, {})),
    p = t(u.getObject(o.SETTINGS, { enable_sim_filter: !0 })),
    m = n(),
    h = n(),
    v = n(),
    y = n([]),
    b = e(() => h.value?.connected),
    x = t(O()),
    S = g().global.t;
  (_.setSettings(`skip_pin`, p.value.skip_pin),
    _.on(`connected`, (e) => {
      ((m.value = e.device), (h.value = e.server), (v.value = e.writer), (y.value = e.writers), a.setInited(!1), f({ message: S(`common.connected`), type: `success` }));
    }).on(`disconnected`, () => {
      ((m.value = void 0), (h.value = void 0), (v.value = void 0), (y.value = []), f({ message: S(`common.disconnected`), type: `error`, duration: 3e3 }));
    }));
  function C() {
    return l(d.value?.token);
  }
  function w(e, t) {
    d.value?.info && ((d.value.info[e] = t), T(d.value));
  }
  function T(e) {
    ((d.value = e), u.setObject(o.USER, e));
  }
  function E() {
    (u.remove(o.SETTINGS), u.remove(o.USER), _.setSettings(`skip_pin`, !1), location.reload());
  }
  function D(e, t) {
    if (p.value[e] !== t)
      switch (((p.value[e] = t), u.setObject(o.SETTINGS, p.value), e)) {
        case `enable_sim_filter`:
          c.profiles && (x.value = A(c.profiles));
          break;
        case `skip_pin`:
          _.setSettings(`skip_pin`, t);
          break;
        default:
          break;
      }
  }
  function O() {
    let { id: e, list: t } = u.getObject(o.PROFILE, { id: ``, list: [] });
    return ((r = e), (c.profiles = t), A(t));
  }
  function k() {
    c.profiles && r && u.setObject(o.PROFILE, { id: r, list: c.profiles });
  }
  function A(e) {
    return p.value.enable_sim_filter ? e.filter((e) => e.profileClass === `operational`) : e;
  }
  async function j(e) {
    return m.value?.id && !e && m.value.id === r && c.profiles?.length
      ? (x.value = A(c.profiles))
      : ((c.profiles = (await i.GetProfilesInfo()).toJson()), (c.refreshProfiles = !1), (r = m.value?.id || ``), k(), (x.value = A(c.profiles)));
  }
  async function M(e, t = 0) {
    try {
      (a.setPercentage(() => {
        s.percentage({ index: t++, total: 100 });
      }),
        s.percentage({ index: t++, total: 100, message: S(`common.sending-notification`), loader: S(`common.retrieving`) }));
      let n = await i.RetrieveNotificationsList(e);
      (t < 70 && (t = 70), s.percentage({ index: t++, total: 100, loader: S(`common.sending`) }));
      let r = await I.SendNotificationToDPServer(n);
      if (r.status !== 200) throw Error(S(`common.send-failed`, { msg: r.msg }));
      (t < 90 && (t = 90), s.percentage({ index: t++, total: 100, loader: S(`common.deleting`) }));
      let o = await i.RemoveNotificationFromList(e);
      return (s.percentage({ index: 1e3, total: 100, message: S(`common.send-success`) }), a.closePercentage(), o);
    } catch (e) {
      throw (a.closePercentage(), s.percentage({ index: -1, total: 100, message: e.message }), e);
    }
  }
  async function N(e, t, n = 1) {
    try {
      (a.setPercentage(() => {
        s.percentage({ index: n++, total: 100 });
      }),
        s.percentage({ index: n++, total: 100, message: S(`common.sending-notification`), loader: `读取中...` }));
      let r = (await i.ListNotification(e)).toJson();
      (n < 36 && (n = 36), s.percentage({ index: n++, total: 100 }), s.isDebug() && s.info(`检索到 ${r.length} 个通知，通知列表如下`, `检索结果`));
      let o;
      return (
        r.forEach((n) => {
          (s.isDebug() && s.info(`ICCID=${n.iccid}，类型=${n.profileManagementOperation}，地址=${n.notificationAddress}`, `通知【${n.index}】`),
            n.iccid === t && n.profileManagementOperation === e && (o = n));
        }),
        o ? await M(o.index, n + 1) : (a.closePercentage(), s.percentage({ index: 1e3, total: 100, message: S(`tips.notification-empty`) }), !0)
      );
    } catch (e) {
      throw (a.closePercentage(), s.percentage({ index: -1, total: 100, message: e.message }), e);
    }
  }
  async function P(e) {
    let t = x.value.find((t) => t.iccid === e);
    if (t)
      return (
        await i.EnableProfile(e),
        x.value.forEach((e) => {
          e.profileState = `OFF`;
        }),
        (t.profileState = `ON`),
        k(),
        await a.reset(),
        (_.reconnectable = !0),
        t
      );
    throw Error(S(`tips.sim-not-exist`));
  }
  async function F(e) {
    let t = x.value.find((t) => t.iccid === e);
    if (t) return (await i.DisableProfile(e), (t.profileState = `OFF`), k(), await a.reset(), (_.reconnectable = !0), t);
    throw Error(S(`tips.sim-not-exist`));
  }
  async function L(e) {
    let t = x.value.find((t) => t.iccid === e);
    if (t) {
      if (t.profileState === `ON`) throw Error(S(`tips.cant-delete-enabled-number`));
      (await i.DeleteProfile(e),
        await N(`DELETE`, e),
        c.profiles ? ((c.profiles = c.profiles.filter((t) => t.iccid !== e)), (x.value = A(c.profiles))) : ((x.value = x.value.filter((t) => t.iccid !== e)), (c.profiles = x.value)),
        k());
    } else throw Error(S(`tips.sim-not-exist`));
  }
  async function R(e, t) {
    let n = x.value.find((t) => t.iccid === e);
    if (n) return (await i.SetNickname(e, t), (n.profileNickname = t), k(), n);
    throw Error(S(`tips.sim-not-exist`));
  }
  return {
    cache: c,
    user: d,
    settings: p,
    device: m,
    writer: v,
    writers: y,
    connected: b,
    profiles: x,
    initProfileList: j,
    enableProfile: P,
    disableProfile: F,
    deleteProfile: L,
    setNickname: R,
    retrieveNotificationByIndex: M,
    setSettingsAndSave: D,
    setUserStore: T,
    removeUserStore: E,
    setUserValue: w,
    isLogined: C,
  };
});
export { E as a, w as c, T as i, I as n, j as o, D as r, A as s, L as t };
