import {
  $ as e,
  A as t,
  C as n,
  D as r,
  E as i,
  F as a,
  G as o,
  I as s,
  J as c,
  K as l,
  M as u,
  N as d,
  P as f,
  Q as p,
  R as m,
  S as h,
  T as g,
  X as _,
  Y as v,
  Z as y,
  at as b,
  ct as x,
  et as S,
  f as C,
  g as w,
  it as T,
  j as E,
  k as D,
  lt as O,
  nt as k,
  ot as A,
  p as j,
  st as M,
  tt as N,
  u as ee,
  w as P,
} from "./vue-Cxg3tivS.js";
function F(e, t, n) {
  var r = n || {},
    i = r.noTrailing,
    a = i === void 0 ? !1 : i,
    o = r.noLeading,
    s = o === void 0 ? !1 : o,
    c = r.debounceMode,
    l = c === void 0 ? void 0 : c,
    u,
    d = !1,
    f = 0;
  function p() {
    u && clearTimeout(u);
  }
  function m(e) {
    var t = (e || {}).upcomingOnly,
      n = t === void 0 ? !1 : t;
    (p(), (d = !n));
  }
  function h() {
    var n = [...arguments],
      r = this,
      i = Date.now() - f;
    if (d) return;
    function o() {
      ((f = Date.now()), t.apply(r, n));
    }
    function c() {
      u = void 0;
    }
    (!s && l && !u && o(), p(), l === void 0 && i > e ? (s ? ((f = Date.now()), a || (u = setTimeout(l ? c : o, e))) : o()) : a !== !0 && (u = setTimeout(l ? c : o, l === void 0 ? e - i : e)));
  }
  return ((h.cancel = m), h);
}
function I(e, t, n) {
  var r = (n || {}).atBegin;
  return F(e, t, { debounceMode: (r === void 0 ? !1 : r) !== !1 });
}
var L = typeof window < `u`,
  te,
  R = (e) => (te = e),
  ne = Symbol();
function re(e) {
  return e && typeof e == `object` && Object.prototype.toString.call(e) === `[object Object]` && typeof e.toJSON != `function`;
}
var z;
(function (e) {
  ((e.direct = `direct`), (e.patchObject = `patch object`), (e.patchFunction = `patch function`));
})((z ||= {}));
var ie = (() =>
  typeof window == `object` && window.window === window
    ? window
    : typeof self == `object` && self.self === self
      ? self
      : typeof global == `object` && global.global === global
        ? global
        : typeof globalThis == `object`
          ? globalThis
          : { HTMLElement: null })();
function ae(e, { autoBom: t = !1 } = {}) {
  return t && /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(e.type) ? new Blob([`﻿`, e], { type: e.type }) : e;
}
function oe(e, t, n) {
  let r = new XMLHttpRequest();
  (r.open(`GET`, e),
    (r.responseType = `blob`),
    (r.onload = function () {
      de(r.response, t, n);
    }),
    (r.onerror = function () {
      console.error(`could not download file`);
    }),
    r.send());
}
function se(e) {
  let t = new XMLHttpRequest();
  t.open(`HEAD`, e, !1);
  try {
    t.send();
  } catch {}
  return t.status >= 200 && t.status <= 299;
}
function ce(e) {
  try {
    e.dispatchEvent(new MouseEvent(`click`));
  } catch {
    let t = new MouseEvent(`click`, {
      bubbles: !0,
      cancelable: !0,
      view: window,
      detail: 0,
      screenX: 80,
      screenY: 20,
      clientX: 80,
      clientY: 20,
      ctrlKey: !1,
      altKey: !1,
      shiftKey: !1,
      metaKey: !1,
      button: 0,
      relatedTarget: null,
    });
    e.dispatchEvent(t);
  }
}
var le = typeof navigator == `object` ? navigator : { userAgent: `` },
  ue = (() => /Macintosh/.test(le.userAgent) && /AppleWebKit/.test(le.userAgent) && !/Safari/.test(le.userAgent))(),
  de = L ? (typeof HTMLAnchorElement < `u` && `download` in HTMLAnchorElement.prototype && !ue ? fe : `msSaveOrOpenBlob` in le ? pe : me) : () => {};
function fe(e, t = `download`, n) {
  let r = document.createElement(`a`);
  ((r.download = t),
    (r.rel = `noopener`),
    typeof e == `string`
      ? ((r.href = e), r.origin === location.origin ? ce(r) : se(r.href) ? oe(e, t, n) : ((r.target = `_blank`), ce(r)))
      : ((r.href = URL.createObjectURL(e)),
        setTimeout(function () {
          URL.revokeObjectURL(r.href);
        }, 4e4),
        setTimeout(function () {
          ce(r);
        }, 0)));
}
function pe(e, t = `download`, n) {
  if (typeof e == `string`)
    if (se(e)) oe(e, t, n);
    else {
      let t = document.createElement(`a`);
      ((t.href = e),
        (t.target = `_blank`),
        setTimeout(function () {
          ce(t);
        }));
    }
  else navigator.msSaveOrOpenBlob(ae(e, n), t);
}
function me(e, t, n, r) {
  if (((r ||= open(``, `_blank`)), r && (r.document.title = r.document.body.innerText = `downloading...`), typeof e == `string`)) return oe(e, t, n);
  let i = e.type === `application/octet-stream`,
    a = /constructor/i.test(String(ie.HTMLElement)) || `safari` in ie,
    o = /CriOS\/[\d]+/.test(navigator.userAgent);
  if ((o || (i && a) || ue) && typeof FileReader < `u`) {
    let t = new FileReader();
    ((t.onloadend = function () {
      let e = t.result;
      if (typeof e != `string`) throw ((r = null), Error(`Wrong reader.result type`));
      ((e = o ? e : e.replace(/^data:[^;]*;/, `data:attachment/file;`)), r ? (r.location.href = e) : location.assign(e), (r = null));
    }),
      t.readAsDataURL(e));
  } else {
    let t = URL.createObjectURL(e);
    (r ? r.location.assign(t) : (location.href = t),
      (r = null),
      setTimeout(function () {
        URL.revokeObjectURL(t);
      }, 4e4));
  }
}
var { assign: he } = Object;
function ge() {
  let t = v(!0),
    n = t.run(() => k({})),
    r = [],
    i = [],
    a = e({
      install(e) {
        (R(a), (a._a = e), e.provide(ne, a), (e.config.globalProperties.$pinia = a), i.forEach((e) => r.push(e)), (i = []));
      },
      use(e) {
        return (this._a ? r.push(e) : i.push(e), this);
      },
      _p: r,
      _a: null,
      _e: t,
      _s: new Map(),
      state: n,
    });
  return a;
}
var _e = () => {};
function ve(e, t, n, r = _e) {
  e.add(t);
  let i = () => {
    e.delete(t) && r();
  };
  return (!n && _() && S(i), i);
}
function ye(e, ...t) {
  e.forEach((e) => {
    e(...t);
  });
}
var be = (e) => e(),
  xe = Symbol(),
  Se = Symbol();
function Ce(e, t) {
  for (let n in (e instanceof Map && t instanceof Map ? t.forEach((t, n) => e.set(n, t)) : e instanceof Set && t instanceof Set && t.forEach(e.add, e), t)) {
    if (!t.hasOwnProperty(n)) continue;
    let r = t[n],
      i = e[n];
    re(i) && re(r) && e.hasOwnProperty(n) && !p(r) && !y(r) ? (e[n] = Ce(i, r)) : (e[n] = r);
  }
  return e;
}
var we = Symbol();
function Te(e) {
  return !re(e) || !Object.prototype.hasOwnProperty.call(e, we);
}
var { assign: B } = Object;
function Ee(e) {
  return !!(p(e) && e.effect);
}
function De(t, n, r, i) {
  let { state: a, actions: o, getters: s } = n,
    c = r.state.value[t],
    l;
  function u() {
    return (
      c || (r.state.value[t] = a ? a() : {}),
      B(
        b(r.state.value[t]),
        o,
        Object.keys(s || {}).reduce(
          (n, i) => (
            (n[i] = e(
              w(() => {
                R(r);
                let e = r._s.get(t);
                return s[i].call(e, e);
              }),
            )),
            n
          ),
          {},
        ),
      )
    );
  }
  return ((l = Oe(t, u, n, r, i, !0)), l);
}
function Oe(e, n, r = {}, i, a, s) {
  let c,
    l = B({ actions: {} }, r),
    u = { deep: !0 },
    d,
    f,
    m = new Set(),
    h = new Set(),
    g = i.state.value[e];
  (!s && !g && (i.state.value[e] = {}), k({}));
  let _;
  function b(n) {
    let r;
    ((d = f = !1),
      typeof n == `function`
        ? (n(i.state.value[e]), (r = { type: z.patchFunction, storeId: e, events: void 0 }))
        : (Ce(i.state.value[e], n), (r = { type: z.patchObject, payload: n, storeId: e, events: void 0 })));
    let a = (_ = Symbol());
    (t().then(() => {
      _ === a && (d = !0);
    }),
      (f = !0),
      ye(m, r, i.state.value[e]));
  }
  let x = s
    ? function () {
        let { state: e } = r,
          t = e ? e() : {};
        this.$patch((e) => {
          B(e, t);
        });
      }
    : _e;
  function S() {
    (c.stop(), m.clear(), h.clear(), i._s.delete(e));
  }
  let C = (t, n = ``) => {
      if (xe in t) return ((t[Se] = n), t);
      let r = function () {
        R(i);
        let n = Array.from(arguments),
          a = new Set(),
          o = new Set();
        function s(e) {
          a.add(e);
        }
        function c(e) {
          o.add(e);
        }
        ye(h, { args: n, name: r[Se], store: w, after: s, onError: c });
        let l;
        try {
          l = t.apply(this && this.$id === e ? this : w, n);
        } catch (e) {
          throw (ye(o, e), e);
        }
        return l instanceof Promise ? l.then((e) => (ye(a, e), e)).catch((e) => (ye(o, e), Promise.reject(e))) : (ye(a, l), l);
      };
      return ((r[xe] = !0), (r[Se] = n), r);
    },
    w = N({
      _p: i,
      $id: e,
      $onAction: ve.bind(null, h),
      $patch: b,
      $reset: x,
      $subscribe(t, n = {}) {
        let r = ve(m, t, n.detached, () => a()),
          a = c.run(() =>
            o(
              () => i.state.value[e],
              (r) => {
                (n.flush === `sync` ? f : d) && t({ storeId: e, type: z.direct, events: void 0 }, r);
              },
              B({}, u, n),
            ),
          );
        return r;
      },
      $dispose: S,
    });
  i._s.set(e, w);
  let E = ((i._a && i._a.runWithContext) || be)(() => i._e.run(() => (c = v()).run(() => n({ action: C }))));
  for (let t in E) {
    let n = E[t];
    (p(n) && !Ee(n)) || y(n) ? s || (g && Te(n) && (p(n) ? (n.value = g[t]) : Ce(n, g[t])), (i.state.value[e][t] = n)) : typeof n == `function` && ((E[t] = C(n, t)), (l.actions[t] = n));
  }
  return (
    B(w, E),
    B(T(w), E),
    Object.defineProperty(w, `$state`, {
      get: () => i.state.value[e],
      set: (e) => {
        b((t) => {
          B(t, e);
        });
      },
    }),
    i._p.forEach((e) => {
      B(
        w,
        c.run(() => e({ store: w, app: i._a, pinia: i, options: l })),
      );
    }),
    g && s && r.hydrate && r.hydrate(w.$state, g),
    (d = !0),
    (f = !0),
    w
  );
}
function ke(e, t, n) {
  let r,
    a = typeof t == `function`;
  r = a ? n : t;
  function o(n, o) {
    let s = g();
    return ((n ||= s ? i(ne, null) : null), n && R(n), (n = te), n._s.has(e) || (a ? Oe(e, t, r, n) : De(e, r, n)), n._s.get(e));
  }
  return ((o.$id = e), o);
}
function Ae() {}
var V = Object.assign,
  je = typeof window < `u`,
  Me = (e) => typeof e == `object` && !!e,
  H = (e) => e != null,
  Ne = (e) => typeof e == `function`,
  Pe = (e) => Me(e) && Ne(e.then) && Ne(e.catch),
  Fe = (e) => typeof e == `number` || /^\d+(\.\d+)?$/.test(e),
  Ie = () => (je ? /ios|iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()) : !1);
function Le(e, t) {
  let n = t.split(`.`),
    r = e;
  return (
    n.forEach((e) => {
      r = Me(r) ? (r[e] ?? ``) : ``;
    }),
    r
  );
}
function Re(e, t, n) {
  return t.reduce((t, r) => ((!n || e[r] !== void 0) && (t[r] = e[r]), t), {});
}
var ze = (e, t) => JSON.stringify(e) === JSON.stringify(t),
  Be = (e) => e.reduce((e, t) => e.concat(t), []),
  U = [Number, String],
  W = { type: Boolean, default: !0 },
  G = (e) => ({ type: e, required: !0 }),
  Ve = () => ({ type: Array, default: () => [] }),
  K = (e) => ({ type: U, default: e }),
  He = (e) => ({ type: String, default: e }),
  Ue = typeof window < `u`;
function We(e) {
  return Ue ? requestAnimationFrame(e) : -1;
}
function Ge(e) {
  Ue && cancelAnimationFrame(e);
}
function Ke(e) {
  We(() => We(e));
}
var qe = (e) => e === window,
  Je = (e, t) => ({ top: 0, left: 0, right: e, bottom: t, width: e, height: t }),
  q = (e) => {
    let t = A(e);
    if (qe(t)) {
      let e = t.innerWidth,
        n = t.innerHeight;
      return Je(e, n);
    }
    return t?.getBoundingClientRect ? t.getBoundingClientRect() : Je(0, 0);
  };
function Ye(e) {
  let t = i(e, null);
  if (t) {
    let e = P(),
      { link: n, unlink: r, internalChildren: i } = t;
    return (n(e), s(() => r(e)), { parent: t, index: w(() => i.indexOf(e)) });
  }
  return { parent: null, index: k(-1) };
}
function Xe(e) {
  let t = [],
    n = (e) => {
      Array.isArray(e) &&
        e.forEach((e) => {
          r(e) && (t.push(e), e.component?.subTree && (t.push(e.component.subTree), n(e.component.subTree.children)), e.children && n(e.children));
        });
    };
  return (n(e), t);
}
var Ze = (e, t) => {
  let n = e.indexOf(t);
  return n === -1 ? e.findIndex((e) => t.key !== void 0 && t.key !== null && e.type === t.type && e.key === t.key) : n;
};
function Qe(e, t, n) {
  let r = Xe(e.subTree.children);
  n.sort((e, t) => Ze(r, e.vnode) - Ze(r, t.vnode));
  let i = n.map((e) => e.proxy);
  t.sort((e, t) => i.indexOf(e) - i.indexOf(t));
}
function $e(e) {
  let t = N([]),
    n = N([]),
    r = P();
  return {
    children: t,
    linkChildren: (i) => {
      m(
        e,
        Object.assign(
          {
            link: (e) => {
              e.proxy && (n.push(e), t.push(e.proxy), Qe(r, t, n));
            },
            unlink: (e) => {
              let r = n.indexOf(e);
              (t.splice(r, 1), n.splice(r, 1));
            },
            children: t,
            internalChildren: n,
          },
          i,
        ),
      );
    },
  };
}
function et(e) {
  let n;
  (a(() => {
    (e(),
      t(() => {
        n = !0;
      }));
  }),
    E(() => {
      n && e();
    }));
}
function tt(e, t, n = {}) {
  if (!Ue) return;
  let { target: r = window, passive: i = !1, capture: a = !1 } = n,
    c = !1,
    l,
    u = (n) => {
      if (c) return;
      let r = A(n);
      r && !l && (r.addEventListener(e, t, { capture: a, passive: i }), (l = !0));
    },
    d = (n) => {
      if (c) return;
      let r = A(n);
      r && l && (r.removeEventListener(e, t, a), (l = !1));
    };
  (s(() => d(r)), f(() => d(r)), et(() => u(r)));
  let m;
  return (
    p(r) &&
      (m = o(r, (e, t) => {
        (d(t), u(e));
      })),
    () => {
      (m?.(), d(r), (c = !0));
    }
  );
}
var nt, rt;
function it() {
  if (!nt && ((nt = k(0)), (rt = k(0)), Ue)) {
    let e = () => {
      ((nt.value = window.innerWidth), (rt.value = window.innerHeight));
    };
    (e(), window.addEventListener(`resize`, e, { passive: !0 }), window.addEventListener(`orientationchange`, e, { passive: !0 }));
  }
  return { width: nt, height: rt };
}
var at = /scroll|auto|overlay/i,
  ot = Ue ? window : void 0;
function st(e) {
  return e.tagName !== `HTML` && e.tagName !== `BODY` && e.nodeType === 1;
}
function ct(e, t = ot) {
  let n = e;
  for (; n && n !== t && st(n);) {
    let { overflowY: e } = window.getComputedStyle(n);
    if (at.test(e)) return n;
    n = n.parentNode;
  }
  return t;
}
function lt(e, t = ot) {
  let n = k();
  return (
    a(() => {
      e.value && (n.value = ct(e.value, t));
    }),
    n
  );
}
var ut;
function dt() {
  if (!ut && ((ut = k(`visible`)), Ue)) {
    let e = () => {
      ut.value = document.hidden ? `hidden` : `visible`;
    };
    (e(), window.addEventListener(`visibilitychange`, e));
  }
  return ut;
}
function ft(e) {
  let t = `scrollTop` in e ? e.scrollTop : e.pageYOffset;
  return Math.max(t, 0);
}
function pt(e, t) {
  `scrollTop` in e ? (e.scrollTop = t) : e.scrollTo(e.scrollX, t);
}
function mt() {
  return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
}
function ht(e) {
  (pt(window, e), pt(document.body, e));
}
function gt(e, t) {
  if (e === window) return 0;
  let n = t ? ft(t) : mt();
  return q(e).top + n;
}
Ie();
var _t = (e) => e.stopPropagation();
function vt(e, t) {
  ((typeof e.cancelable != `boolean` || e.cancelable) && e.preventDefault(), t && _t(e));
}
function yt(e) {
  let t = A(e);
  if (!t) return !1;
  let n = window.getComputedStyle(t),
    r = n.display === `none`,
    i = t.offsetParent === null && n.position !== `fixed`;
  return r || i;
}
var { width: bt, height: xt } = it();
function J(e) {
  if (H(e)) return Fe(e) ? `${e}px` : String(e);
}
function St(e) {
  if (H(e)) {
    if (Array.isArray(e)) return { width: J(e[0]), height: J(e[1]) };
    let t = J(e);
    return { width: t, height: t };
  }
}
function Ct(e) {
  let t = {};
  return (e !== void 0 && (t.zIndex = +e), t);
}
var wt;
function Tt() {
  if (!wt) {
    let e = document.documentElement,
      t = e.style.fontSize || window.getComputedStyle(e).fontSize;
    wt = parseFloat(t);
  }
  return wt;
}
function Et(e) {
  return ((e = e.replace(/rem/g, ``)), +e * Tt());
}
function Dt(e) {
  return ((e = e.replace(/vw/g, ``)), (+e * bt.value) / 100);
}
function Ot(e) {
  return ((e = e.replace(/vh/g, ``)), (+e * xt.value) / 100);
}
function kt(e) {
  if (typeof e == `number`) return e;
  if (je) {
    if (e.includes(`rem`)) return Et(e);
    if (e.includes(`vw`)) return Dt(e);
    if (e.includes(`vh`)) return Ot(e);
  }
  return parseFloat(e);
}
var At = /-(\w)/g,
  jt = (e) => e.replace(At, (e, t) => t.toUpperCase()),
  Mt = (e, t, n) => Math.min(Math.max(e, t), n),
  { hasOwnProperty: Nt } = Object.prototype;
function Pt(e, t, n) {
  let r = t[n];
  H(r) && (!Nt.call(e, n) || !Me(r) ? (e[n] = r) : (e[n] = Ft(Object(e[n]), r)));
}
function Ft(e, t) {
  return (
    Object.keys(t).forEach((n) => {
      Pt(e, t, n);
    }),
    e
  );
}
var It = {
    name: `姓名`,
    tel: `电话`,
    save: `保存`,
    clear: `清空`,
    undo: `撤销`,
    cancel: `取消`,
    confirm: `确认`,
    delete: `删除`,
    loading: `加载中...`,
    noCoupon: `暂无优惠券`,
    nameEmpty: `请填写姓名`,
    addContact: `添加联系人`,
    telInvalid: `请填写正确的电话`,
    vanCalendar: {
      end: `结束`,
      start: `开始`,
      title: `日期选择`,
      weekdays: [`日`, `一`, `二`, `三`, `四`, `五`, `六`],
      monthTitle: (e, t) => `${e}\u5E74${t}\u6708`,
      rangePrompt: (e) => `\u6700\u591A\u9009\u62E9 ${e} \u5929`,
    },
    vanCascader: { select: `请选择` },
    vanPagination: { prev: `上一页`, next: `下一页` },
    vanPullRefresh: { pulling: `下拉即可刷新...`, loosing: `释放即可刷新...` },
    vanSubmitBar: { label: `合计:` },
    vanCoupon: { unlimited: `无门槛`, discount: (e) => `${e}\u6298`, condition: (e) => `\u6EE1${e}\u5143\u53EF\u7528` },
    vanCouponCell: { title: `优惠券`, count: (e) => `${e}\u5F20\u53EF\u7528` },
    vanCouponList: { exchange: `兑换`, close: `不使用`, enable: `可用`, disabled: `不可用`, placeholder: `输入优惠码` },
    vanAddressEdit: { area: `地区`, areaEmpty: `请选择地区`, addressEmpty: `请填写详细地址`, addressDetail: `详细地址`, defaultAddress: `设为默认收货地址` },
    vanAddressList: { add: `新增地址` },
  },
  Lt = k(`zh-CN`),
  Rt = N({ "zh-CN": It }),
  zt = {
    messages() {
      return Rt[Lt.value];
    },
    use(e, t) {
      ((Lt.value = e), this.add({ [e]: t }));
    },
    add(e = {}) {
      Ft(Rt, e);
    },
  };
function Bt(e) {
  let t = jt(e) + `.`;
  return (e, ...n) => {
    let r = zt.messages(),
      i = Le(r, t + e) || Le(r, e);
    return Ne(i) ? i(...n) : i;
  };
}
function Vt(e, t) {
  return t ? (typeof t == `string` ? ` ${e}--${t}` : Array.isArray(t) ? t.reduce((t, n) => t + Vt(e, n), ``) : Object.keys(t).reduce((n, r) => n + (t[r] ? Vt(e, r) : ``), ``)) : ``;
}
function Ht(e) {
  return (t, n) => (t && typeof t != `string` && ((n = t), (t = ``)), (t = t ? `${e}__${t}` : e), `${t}${Vt(t, n)}`);
}
function Y(e) {
  let t = `van-${e}`;
  return [t, Ht(t), Bt(t)];
}
var X = `van-hairline`;
(`${X}`, `${X}`, `${X}`, `${X}`, `${X}`);
var Ut = `${X}--top-bottom`,
  Wt = `${X}-unset--top-bottom`,
  Gt = `van-haptics-feedback`;
function Kt(e, { args: t = [], done: n, canceled: r, error: i }) {
  if (e) {
    let a = e.apply(null, t);
    Pe(a)
      ? a
          .then((e) => {
            e ? n() : r && r();
          })
          .catch(i || Ae)
      : a
        ? n()
        : r && r();
  } else n();
}
function Z(e) {
  return (
    (e.install = (t) => {
      let { name: n } = e;
      n && (t.component(n, e), t.component(jt(`-${n}`), e));
    }),
    e
  );
}
var qt = Symbol();
function Jt(e) {
  let t = i(qt, null);
  t &&
    o(t, (t) => {
      t && e();
    });
}
function Q(e) {
  let t = P();
  t && V(t.proxy, e);
}
var Yt = { to: [String, Object], url: String, replace: Boolean };
function Xt({ to: e, url: t, replace: n, $router: r }) {
  e && r ? r[n ? `replace` : `push`](e) : t && (n ? location.replace(t) : (location.href = t));
}
var [Zt, Qt] = Y(`badge`),
  $t = Z(
    n({
      name: Zt,
      props: { dot: Boolean, max: U, tag: He(`div`), color: String, offset: Array, content: U, showZero: W, position: He(`top-right`) },
      setup(e, { slots: t }) {
        let n = () => {
            if (t.content) return !0;
            let { content: n, showZero: r } = e;
            return H(n) && n !== `` && (r || (n !== 0 && n !== `0`));
          },
          r = () => {
            let { dot: r, max: i, content: a } = e;
            if (!r && n()) return t.content ? t.content() : H(i) && Fe(a) && +a > +i ? `${i}+` : a;
          },
          i = (e) => (e.startsWith(`-`) ? e.replace(`-`, ``) : `-${e}`),
          a = w(() => {
            let n = { background: e.color };
            if (e.offset) {
              let [r, a] = e.offset,
                { position: o } = e,
                [s, c] = o.split(`-`);
              t.default
                ? (typeof a == `number` ? (n[s] = J(s === `top` ? a : -a)) : (n[s] = s === `top` ? J(a) : i(a)),
                  typeof r == `number` ? (n[c] = J(c === `left` ? r : -r)) : (n[c] = c === `left` ? J(r) : i(r)))
                : ((n.marginTop = J(a)), (n.marginLeft = J(r)));
            }
            return n;
          }),
          o = () => {
            if (n() || e.dot) return h(`div`, { class: Qt([e.position, { dot: e.dot, fixed: !!t.default }]), style: a.value }, [r()]);
          };
        return () => {
          if (t.default) {
            let { tag: n } = e;
            return h(n, { class: Qt(`wrapper`) }, { default: () => [t.default(), o()] });
          }
          return o();
        };
      },
    }),
  ),
  [en, tn] = Y(`loading`),
  nn = Array(12)
    .fill(null)
    .map((e, t) => h(`i`, { class: tn(`line`, String(t + 1)) }, null)),
  rn = h(`svg`, { class: tn(`circular`), viewBox: `25 25 50 50` }, [h(`circle`, { cx: `50`, cy: `50`, r: `20`, fill: `none` }, null)]),
  an = Z(
    n({
      name: en,
      props: { size: U, type: He(`circular`), color: String, vertical: Boolean, textSize: U, textColor: String },
      setup(e, { slots: t }) {
        let n = w(() => V({ color: e.color }, St(e.size))),
          r = () => {
            let r = e.type === `spinner` ? nn : rn;
            return h(`span`, { class: tn(`spinner`, e.type), style: n.value }, [t.icon ? t.icon() : r]);
          },
          i = () => {
            if (t.default) return h(`span`, { class: tn(`text`), style: { fontSize: J(e.textSize), color: e.textColor ?? e.color } }, [t.default()]);
          };
        return () => {
          let { type: t, vertical: n } = e;
          return h(`div`, { class: tn([t, { vertical: n }]), "aria-live": `polite`, "aria-busy": !0 }, [r(), i()]);
        };
      },
    }),
  );
function on(e, t) {
  return e > t ? `horizontal` : t > e ? `vertical` : ``;
}
function sn() {
  let e = k(0),
    t = k(0),
    n = k(0),
    r = k(0),
    i = k(0),
    a = k(0),
    o = k(``),
    s = k(!0),
    c = () => o.value === `vertical`,
    l = () => o.value === `horizontal`,
    u = () => {
      ((n.value = 0), (r.value = 0), (i.value = 0), (a.value = 0), (o.value = ``), (s.value = !0));
    };
  return {
    move: (c) => {
      let l = c.touches[0];
      ((n.value = (l.clientX < 0 ? 0 : l.clientX) - e.value),
        (r.value = l.clientY - t.value),
        (i.value = Math.abs(n.value)),
        (a.value = Math.abs(r.value)),
        (!o.value || (i.value < 10 && a.value < 10)) && (o.value = on(i.value, a.value)),
        s.value && (i.value > 5 || a.value > 5) && (s.value = !1));
    },
    start: (n) => {
      (u(), (e.value = n.touches[0].clientX), (t.value = n.touches[0].clientY));
    },
    reset: u,
    startX: e,
    startY: t,
    deltaX: n,
    deltaY: r,
    offsetX: i,
    offsetY: a,
    direction: o,
    isVertical: c,
    isHorizontal: l,
    isTap: s,
  };
}
var [cn, $, ln] = Y(`picker`),
  un = (e) => e.find((e) => !e.disabled) || e[0];
function dn(e, t) {
  let n = e[0];
  if (n) {
    if (Array.isArray(n)) return `multiple`;
    if (t.children in n) return `cascade`;
  }
  return `default`;
}
function fn(e, t) {
  t = Mt(t, 0, e.length);
  for (let n = t; n < e.length; n++) if (!e[n].disabled) return n;
  for (let n = t - 1; n >= 0; n--) if (!e[n].disabled) return n;
  return 0;
}
var pn = (e, t, n) => t !== void 0 && e.some((e) => e[n.value] === t);
function mn(e, t, n) {
  return e[
    fn(
      e,
      e.findIndex((e) => e[n.value] === t),
    )
  ];
}
function hn(e, t, n) {
  let r = [],
    i = { [t.children]: e },
    a = 0;
  for (; i && i[t.children];) {
    let e = i[t.children],
      o = n.value[a];
    if (((i = H(o) ? mn(e, o, t) : void 0), !i && e.length)) {
      let n = un(e)[t.value];
      i = mn(e, n, t);
    }
    (a++, r.push(e));
  }
  return r;
}
function gn(e) {
  let { transform: t } = window.getComputedStyle(e),
    n = t.slice(7, t.length - 1).split(`, `)[5];
  return Number(n);
}
function _n(e) {
  return V({ text: `text`, value: `value`, children: `children` }, e);
}
var vn = 200,
  yn = 300,
  bn = 15,
  [xn, Sn] = Y(`picker-column`),
  Cn = Symbol(xn),
  wn = n({
    name: xn,
    props: { value: U, fields: G(Object), options: Ve(), readonly: Boolean, allowHtml: Boolean, optionHeight: G(Number), swipeDuration: G(U), visibleOptionNum: G(U) },
    emits: [`change`, `clickOption`, `scrollInto`],
    setup(e, { emit: t, slots: n }) {
      let r,
        i,
        a,
        o,
        s,
        c = k(),
        u = k(),
        d = k(0),
        f = k(0),
        p = sn(),
        m = () => e.options.length,
        g = () => (e.optionHeight * (e.visibleOptionNum - 1)) / 2,
        _ = (n) => {
          let i = fn(e.options, n),
            a = -i * e.optionHeight,
            o = () => {
              i > m() - 1 && (i = fn(e.options, n));
              let r = e.options[i][e.fields.value];
              r !== e.value && t(`change`, r);
            };
          (r && a !== d.value ? (s = o) : o(), (d.value = a));
        },
        v = () => e.readonly || !e.options.length,
        y = (n) => {
          r || v() || ((s = null), (f.value = vn), _(n), t(`clickOption`, e.options[n]));
        },
        b = (t) => Mt(Math.round(-t / e.optionHeight), 0, m() - 1),
        x = w(() => b(d.value)),
        S = (t, n) => {
          let r = Math.abs(t / n);
          t = d.value + (r / 0.003) * (t < 0 ? -1 : 1);
          let i = b(t);
          ((f.value = +e.swipeDuration), _(i));
        },
        C = () => {
          ((r = !1), (f.value = 0), (s &&= (s(), null)));
        },
        T = (e) => {
          if (!v()) {
            if ((p.start(e), r)) {
              let e = gn(u.value);
              d.value = Math.min(0, e - g());
            }
            ((f.value = 0), (i = d.value), (a = Date.now()), (o = i), (s = null));
          }
        },
        E = (n) => {
          if (v()) return;
          (p.move(n), p.isVertical() && ((r = !0), vt(n, !0)));
          let s = Mt(i + p.deltaY.value, -(m() * e.optionHeight), e.optionHeight),
            c = b(s);
          (c !== x.value && t(`scrollInto`, e.options[c]), (d.value = s));
          let l = Date.now();
          l - a > yn && ((a = l), (o = s));
        },
        D = () => {
          if (v()) return;
          let e = d.value - o,
            t = Date.now() - a;
          if (t < yn && Math.abs(e) > bn) {
            S(e, t);
            return;
          }
          let n = b(d.value);
          ((f.value = vn),
            _(n),
            setTimeout(() => {
              r = !1;
            }, 0));
        },
        O = () => {
          let t = { height: `${e.optionHeight}px` };
          return e.options.map((r, i) => {
            let a = r[e.fields.text],
              { disabled: o } = r,
              s = r[e.fields.value],
              c = { role: `button`, style: t, tabindex: o ? -1 : 0, class: [Sn(`item`, { disabled: o, selected: s === e.value }), r.className], onClick: () => y(i) },
              l = { class: `van-ellipsis`, [e.allowHtml ? `innerHTML` : `textContent`]: a };
            return h(`li`, c, [n.option ? n.option(r, i) : h(`div`, l, null)]);
          });
        };
      return (
        Ye(Cn),
        Q({ stopMomentum: C }),
        l(() => {
          let t = r ? Math.floor(-d.value / e.optionHeight) : e.options.findIndex((t) => t[e.fields.value] === e.value),
            n = fn(e.options, t),
            i = -n * e.optionHeight;
          (r && n < t && C(), (d.value = i));
        }),
        tt(`touchmove`, E, { target: c }),
        () =>
          h(`div`, { ref: c, class: Sn(), onTouchstartPassive: T, onTouchend: D, onTouchcancel: D }, [
            h(
              `ul`,
              {
                ref: u,
                style: { transform: `translate3d(0, ${d.value + g()}px, 0)`, transitionDuration: `${f.value}ms`, transitionProperty: f.value ? `all` : `none` },
                class: Sn(`wrapper`),
                onTransitionend: C,
              },
              [O()],
            ),
          ])
      );
    },
  }),
  [Tn] = Y(`picker-toolbar`),
  En = { title: String, cancelButtonText: String, confirmButtonText: String },
  Dn = [`cancel`, `confirm`, `title`, `toolbar`],
  On = Object.keys(En),
  kn = n({
    name: Tn,
    props: En,
    emits: [`confirm`, `cancel`],
    setup(e, { emit: t, slots: n }) {
      let r = () => {
          if (n.title) return n.title();
          if (e.title) return h(`div`, { class: [$(`title`), `van-ellipsis`] }, [e.title]);
        },
        i = () => t(`cancel`),
        a = () => t(`confirm`),
        o = () => {
          let t = e.cancelButtonText ?? ln(`cancel`);
          if (!(!n.cancel && !t)) return h(`button`, { type: `button`, class: [$(`cancel`), Gt], onClick: i }, [n.cancel ? n.cancel() : t]);
        },
        s = () => {
          let t = e.confirmButtonText ?? ln(`confirm`);
          if (!(!n.confirm && !t)) return h(`button`, { type: `button`, class: [$(`confirm`), Gt], onClick: a }, [n.confirm ? n.confirm() : t]);
        };
      return () => h(`div`, { class: $(`toolbar`) }, [n.toolbar ? n.toolbar() : [o(), r(), s()]]);
    },
  }),
  An = (e, t) => {
    let n = k(e());
    return (
      o(e, (e) => {
        e !== n.value && (n.value = e);
      }),
      o(n, (n) => {
        n !== e() && t(n);
      }),
      n
    );
  };
function jn(e, t, n) {
  let r,
    i = 0,
    a = e.scrollLeft,
    o = n === 0 ? 1 : Math.round((n * 1e3) / 16),
    s = a;
  function c() {
    Ge(r);
  }
  function l() {
    ((s += (t - a) / o), (e.scrollLeft = s), ++i < o && (r = We(l)));
  }
  return (l(), c);
}
function Mn(e, t, n, r) {
  let i,
    a = ft(e),
    o = a < t,
    s = n === 0 ? 1 : Math.round((n * 1e3) / 16),
    c = (t - a) / s;
  function l() {
    Ge(i);
  }
  function u() {
    ((a += c), ((o && a > t) || (!o && a < t)) && (a = t), pt(e, a), (o && a < t) || (!o && a > t) ? (i = We(u)) : r && (i = We(r)));
  }
  return (u(), l);
}
var Nn = 0;
function Pn() {
  let { name: e = `unknown` } = P()?.type || {};
  return `${e}-${++Nn}`;
}
function Fn() {
  let e = k([]),
    t = [];
  return (
    d(() => {
      e.value = [];
    }),
    [
      e,
      (n) => (
        t[n] ||
          (t[n] = (t) => {
            e.value[n] = t;
          }),
        t[n]
      ),
    ]
  );
}
function In(e, t) {
  if (!je || !window.IntersectionObserver) return;
  let n = new IntersectionObserver(
      (e) => {
        t(e[0].intersectionRatio > 0);
      },
      { root: document.body },
    ),
    r = () => {
      e.value && n.observe(e.value);
    },
    i = () => {
      e.value && n.unobserve(e.value);
    };
  (f(i), u(i), et(r));
}
var [Ln, Rn] = Y(`sticky`),
  zn = Z(
    n({
      name: Ln,
      props: { zIndex: U, position: He(`top`), container: Object, offsetTop: K(0), offsetBottom: K(0) },
      emits: [`scroll`, `change`],
      setup(e, { emit: n, slots: r }) {
        let i = k(),
          a = lt(i),
          s = N({ fixed: !1, width: 0, height: 0, transform: 0 }),
          c = k(!1),
          l = w(() => kt(e.position === `top` ? e.offsetTop : e.offsetBottom)),
          u = w(() => {
            if (c.value) return;
            let { fixed: e, height: t, width: n } = s;
            if (e) return { width: `${n}px`, height: `${t}px` };
          }),
          d = w(() => {
            if (!s.fixed || c.value) return;
            let t = V(Ct(e.zIndex), { width: `${s.width}px`, height: `${s.height}px`, [e.position]: `${l.value}px` });
            return (s.transform && (t.transform = `translate3d(0, ${s.transform}px, 0)`), t);
          }),
          f = (e) => n(`scroll`, { scrollTop: e, isFixed: s.fixed }),
          p = () => {
            if (!i.value || yt(i)) return;
            let { container: t, position: n } = e,
              r = q(i),
              a = ft(window);
            if (((s.width = r.width), (s.height = r.height), n === `top`))
              if (t) {
                let e = q(t),
                  n = e.bottom - l.value - s.height;
                ((s.fixed = l.value > r.top && e.bottom > 0), (s.transform = n < 0 ? n : 0));
              } else s.fixed = l.value > r.top;
            else {
              let { clientHeight: e } = document.documentElement;
              if (t) {
                let n = q(t),
                  i = e - n.top - l.value - s.height;
                ((s.fixed = e - l.value < r.bottom && e > n.top), (s.transform = i < 0 ? -i : 0));
              } else s.fixed = e - l.value < r.bottom;
            }
            f(a);
          };
        return (
          o(
            () => s.fixed,
            (e) => n(`change`, e),
          ),
          tt(`scroll`, p, { target: a, passive: !0 }),
          In(i, p),
          o([bt, xt], () => {
            !i.value ||
              yt(i) ||
              !s.fixed ||
              ((c.value = !0),
              t(() => {
                let e = q(i);
                ((s.width = e.width), (s.height = e.height), (c.value = !1));
              }));
          }),
          () => h(`div`, { ref: i, style: u.value }, [h(`div`, { class: Rn({ fixed: s.fixed && !c.value }), style: d.value }, [r.default?.call(r)])])
        );
      },
    }),
  ),
  [Bn, Vn] = Y(`swipe`),
  Hn = {
    loop: W,
    width: U,
    height: U,
    vertical: Boolean,
    autoplay: K(0),
    duration: K(500),
    touchable: W,
    lazyRender: Boolean,
    initialSwipe: K(0),
    indicatorColor: String,
    showIndicators: W,
    stopPropagation: W,
  },
  Un = Symbol(Bn),
  Wn = Z(
    n({
      name: Bn,
      props: Hn,
      emits: [`change`, `dragStart`, `dragEnd`],
      setup(e, { emit: n, slots: r }) {
        let i = k(),
          s = k(),
          c = N({ rect: null, width: 0, height: 0, offset: 0, active: 0, swiping: !1 }),
          l = !1,
          d = sn(),
          { children: p, linkChildren: m } = $e(Un),
          g = w(() => p.length),
          _ = w(() => c[e.vertical ? `height` : `width`]),
          v = w(() => (e.vertical ? d.deltaY.value : d.deltaX.value)),
          y = w(() => (c.rect ? (e.vertical ? c.rect.height : c.rect.width) - _.value * g.value : 0)),
          b = w(() => (_.value ? Math.ceil(Math.abs(y.value) / _.value) : g.value)),
          x = w(() => g.value * _.value),
          S = w(() => (c.active + g.value) % g.value),
          C = w(() => {
            let t = e.vertical ? `vertical` : `horizontal`;
            return d.direction.value === t;
          }),
          T = w(() => {
            let t = { transitionDuration: `${c.swiping ? 0 : e.duration}ms`, transform: `translate${e.vertical ? `Y` : `X`}(${+c.offset.toFixed(2)}px)` };
            if (_.value) {
              let n = e.vertical ? `height` : `width`,
                r = e.vertical ? `width` : `height`;
              ((t[n] = `${x.value}px`), (t[r] = e[r] ? `${e[r]}px` : ``));
            }
            return t;
          }),
          D = (t) => {
            let { active: n } = c;
            return t ? (e.loop ? Mt(n + t, -1, g.value) : Mt(n + t, 0, b.value)) : n;
          },
          O = (t, n = 0) => {
            let r = t * _.value;
            e.loop || (r = Math.min(r, -y.value));
            let i = n - r;
            return (e.loop || (i = Mt(i, y.value, 0)), i);
          },
          A = ({ pace: t = 0, offset: r = 0, emitChange: i }) => {
            if (g.value <= 1) return;
            let { active: a } = c,
              o = D(t),
              s = O(o, r);
            if (e.loop) {
              if (p[0] && s !== y.value) {
                let e = s < y.value;
                p[0].setOffset(e ? x.value : 0);
              }
              if (p[g.value - 1] && s !== 0) {
                let e = s > 0;
                p[g.value - 1].setOffset(e ? -x.value : 0);
              }
            }
            ((c.active = o), (c.offset = s), i && o !== a && n(`change`, S.value));
          },
          j = () => {
            ((c.swiping = !0), c.active <= -1 ? A({ pace: g.value }) : c.active >= g.value && A({ pace: -g.value }));
          },
          M = () => {
            (j(),
              d.reset(),
              Ke(() => {
                ((c.swiping = !1), A({ pace: -1, emitChange: !0 }));
              }));
          },
          ee = () => {
            (j(),
              d.reset(),
              Ke(() => {
                ((c.swiping = !1), A({ pace: 1, emitChange: !0 }));
              }));
          },
          P,
          F = () => clearTimeout(P),
          I = () => {
            (F(),
              +e.autoplay > 0 &&
                g.value > 1 &&
                (P = setTimeout(() => {
                  (ee(), I());
                }, +e.autoplay)));
          },
          L = (n = +e.initialSwipe) => {
            if (!i.value) return;
            let r = () => {
              if (!yt(i)) {
                let t = { width: i.value.offsetWidth, height: i.value.offsetHeight };
                ((c.rect = t), (c.width = +(e.width ?? t.width)), (c.height = +(e.height ?? t.height)));
              }
              (g.value && ((n = Math.min(g.value - 1, n)), n === -1 && (n = g.value - 1)),
                (c.active = n),
                (c.swiping = !0),
                (c.offset = O(n)),
                p.forEach((e) => {
                  e.setOffset(0);
                }),
                I());
            };
            yt(i) ? t().then(r) : r();
          },
          te = () => L(c.active),
          R,
          ne = (t) => {
            !e.touchable || t.touches.length > 1 || (d.start(t), (l = !1), (R = Date.now()), F(), j());
          },
          re = (t) => {
            e.touchable &&
              c.swiping &&
              (d.move(t),
              C.value &&
                ((!e.loop && ((c.active === 0 && v.value > 0) || (c.active === g.value - 1 && v.value < 0))) ||
                  (vt(t, e.stopPropagation), A({ offset: v.value }), (l ||= (n(`dragStart`, { index: S.value }), !0)))));
          },
          z = () => {
            if (!e.touchable || !c.swiping) return;
            let t = Date.now() - R,
              r = v.value / t;
            if ((Math.abs(r) > 0.25 || Math.abs(v.value) > _.value / 2) && C.value) {
              let t = e.vertical ? d.offsetY.value : d.offsetX.value,
                n = 0;
              ((n = e.loop ? (t > 0 ? (v.value > 0 ? -1 : 1) : 0) : -Math[v.value > 0 ? `ceil` : `floor`](v.value / _.value)), A({ pace: n, emitChange: !0 }));
            } else v.value && A({ pace: 0 });
            ((l = !1), (c.swiping = !1), n(`dragEnd`, { index: S.value }), I());
          },
          ie = (t, n = {}) => {
            (j(),
              d.reset(),
              Ke(() => {
                let r;
                ((r = e.loop && t === g.value ? (c.active === 0 ? 0 : t) : t % g.value),
                  n.immediate
                    ? Ke(() => {
                        c.swiping = !1;
                      })
                    : (c.swiping = !1),
                  A({ pace: r - c.active, emitChange: !0 }));
              }));
          },
          ae = (t, n) => {
            let r = n === S.value;
            return h(`i`, { style: r ? { backgroundColor: e.indicatorColor } : void 0, class: Vn(`indicator`, { active: r }) }, null);
          },
          oe = () => {
            if (r.indicator) return r.indicator({ active: S.value, total: g.value });
            if (e.showIndicators && g.value > 1) return h(`div`, { class: Vn(`indicators`, { vertical: e.vertical }) }, [Array(g.value).fill(``).map(ae)]);
          };
        return (
          Q({ prev: M, next: ee, state: c, resize: te, swipeTo: ie }),
          m({ size: _, props: e, count: g, activeIndicator: S }),
          o(
            () => e.initialSwipe,
            (e) => L(+e),
          ),
          o(g, () => L(c.active)),
          o(() => e.autoplay, I),
          o([bt, xt, () => e.width, () => e.height], te),
          o(dt(), (e) => {
            e === `visible` ? I() : F();
          }),
          a(L),
          E(() => L(c.active)),
          Jt(() => L(c.active)),
          f(F),
          u(F),
          tt(`touchmove`, re, { target: s }),
          () =>
            h(`div`, { ref: i, class: Vn() }, [
              h(`div`, { ref: s, style: T.value, class: Vn(`track`, { vertical: e.vertical }), onTouchstartPassive: ne, onTouchend: z, onTouchcancel: z }, [r.default?.call(r)]),
              oe(),
            ])
        );
      },
    }),
  ),
  [Gn, Kn] = Y(`tabs`),
  qn = n({
    name: Gn,
    props: { count: G(Number), inited: Boolean, animated: Boolean, duration: G(U), swipeable: Boolean, lazyRender: Boolean, currentIndex: G(Number) },
    emits: [`change`],
    setup(e, { emit: t, slots: n }) {
      let r = k(),
        i = (e) => t(`change`, e),
        s = () => {
          let t = n.default?.call(n);
          return e.animated || e.swipeable
            ? h(Wn, { ref: r, loop: !1, class: Kn(`track`), duration: e.duration * 1e3, touchable: e.swipeable, lazyRender: e.lazyRender, showIndicators: !1, onChange: i }, { default: () => [t] })
            : t;
        },
        c = (t) => {
          let n = r.value;
          n && n.state.active !== t && n.swipeTo(t, { immediate: !e.inited });
        };
      return (
        o(() => e.currentIndex, c),
        a(() => {
          c(e.currentIndex);
        }),
        Q({ swipeRef: r }),
        () => h(`div`, { class: Kn(`content`, { animated: e.animated || e.swipeable }) }, [s()])
      );
    },
  }),
  [Jn, Yn] = Y(`tabs`),
  Xn = {
    type: He(`line`),
    color: String,
    border: Boolean,
    sticky: Boolean,
    shrink: Boolean,
    active: K(0),
    duration: K(0.3),
    animated: Boolean,
    ellipsis: W,
    swipeable: Boolean,
    scrollspy: Boolean,
    offsetTop: K(0),
    background: String,
    lazyRender: W,
    showHeader: W,
    lineWidth: U,
    lineHeight: U,
    beforeChange: Function,
    swipeThreshold: K(5),
    titleActiveColor: String,
    titleInactiveColor: String,
  },
  Zn = Symbol(Jn),
  Qn = n({
    name: Jn,
    props: Xn,
    emits: [`change`, `scroll`, `rendered`, `clickTab`, `update:active`],
    setup(e, { emit: n, slots: r }) {
      let i,
        a,
        s,
        c,
        l,
        u = k(),
        d = k(),
        f = k(),
        p = k(),
        m = Pn(),
        g = lt(u),
        [_, v] = Fn(),
        { children: y, linkChildren: b } = $e(Zn),
        x = N({ inited: !1, position: ``, lineStyle: {}, currentIndex: -1 }),
        S = w(() => y.length > +e.swipeThreshold || !e.ellipsis || e.shrink),
        C = w(() => ({ borderColor: e.color, background: e.background })),
        T = (e, t) => e.name ?? t,
        D = w(() => {
          let e = y[x.currentIndex];
          if (e) return T(e, x.currentIndex);
        }),
        O = w(() => kt(e.offsetTop)),
        A = w(() => (e.sticky ? O.value + i : 0)),
        j = (t) => {
          let n = d.value,
            r = _.value;
          if (!S.value || !n || !r || !r[x.currentIndex]) return;
          let i = r[x.currentIndex].$el,
            a = i.offsetLeft - (n.offsetWidth - i.offsetWidth) / 2;
          (c && c(), (c = jn(n, a, t ? 0 : +e.duration)));
        },
        M = () => {
          let n = x.inited;
          t(() => {
            let t = _.value;
            if (!t || !t[x.currentIndex] || e.type !== `line` || yt(u.value)) return;
            let r = t[x.currentIndex].$el,
              { lineWidth: i, lineHeight: a } = e,
              o = r.offsetLeft + r.offsetWidth / 2,
              s = { width: J(i), backgroundColor: e.color, transform: `translateX(${o}px) translateX(-50%)` };
            if ((n && (s.transitionDuration = `${e.duration}s`), H(a))) {
              let e = J(a);
              ((s.height = e), (s.borderRadius = e));
            }
            x.lineStyle = s;
          });
        },
        ee = (e) => {
          let t = e < x.currentIndex ? -1 : 1;
          for (; e >= 0 && e < y.length;) {
            if (!y[e].disabled) return e;
            e += t;
          }
        },
        P = (t, r) => {
          let i = ee(t);
          if (!H(i)) return;
          let a = y[i],
            o = T(a, i),
            c = x.currentIndex !== null;
          (x.currentIndex !== i && ((x.currentIndex = i), r || j(), M()),
            o !== e.active && (n(`update:active`, o), c && n(`change`, o, a.title)),
            s && !e.scrollspy && ht(Math.ceil(gt(u.value) - O.value)));
        },
        F = (e, t) => {
          let n = y.findIndex((t, n) => T(t, n) === e);
          P(n === -1 ? 0 : n, t);
        },
        I = (t = !1) => {
          if (e.scrollspy) {
            let n = y[x.currentIndex].$el;
            if (n && g.value) {
              let r = gt(n, g.value) - A.value;
              ((a = !0),
                l && l(),
                (l = Mn(g.value, r, t ? 0 : +e.duration, () => {
                  a = !1;
                })));
            }
          }
        },
        L = (t, r, i) => {
          let { title: a, disabled: o } = y[r],
            s = T(y[r], r);
          (o ||
            (Kt(e.beforeChange, {
              args: [s],
              done: () => {
                (P(r), I());
              },
            }),
            Xt(t)),
            n(`clickTab`, { name: s, title: a, event: i, disabled: o }));
        },
        te = (e) => {
          ((s = e.isFixed), n(`scroll`, e));
        },
        R = (e) => {
          t(() => {
            (F(e), I(!0));
          });
        },
        ne = () => {
          for (let e = 0; e < y.length; e++) {
            let { top: t } = q(y[e].$el);
            if (t > A.value) return e === 0 ? 0 : e - 1;
          }
          return y.length - 1;
        },
        re = () => {
          e.scrollspy && !a && P(ne());
        },
        z = () => {
          if (e.type === `line` && y.length) return h(`div`, { class: Yn(`line`), style: x.lineStyle }, null);
        },
        ie = () => {
          let { type: t, border: n, sticky: i } = e,
            a = [
              h(`div`, { ref: i ? void 0 : f, class: [Yn(`wrap`), { [Ut]: t === `line` && n }] }, [
                h(`div`, { ref: d, role: `tablist`, class: Yn(`nav`, [t, { shrink: e.shrink, complete: S.value }]), style: C.value, "aria-orientation": `horizontal` }, [
                  r[`nav-left`]?.call(r),
                  y.map((e) => e.renderTitle(L)),
                  z(),
                  r[`nav-right`]?.call(r),
                ]),
              ]),
              r[`nav-bottom`]?.call(r),
            ];
          return i ? h(`div`, { ref: f }, [a]) : a;
        },
        ae = () => {
          (M(),
            t(() => {
              var e;
              (j(!0), (e = p.value?.swipeRef.value) == null || e.resize());
            }));
        };
      return (
        o(() => [e.color, e.duration, e.lineWidth, e.lineHeight], M),
        o(bt, ae),
        o(
          () => e.active,
          (e) => {
            e !== D.value && F(e);
          },
        ),
        o(
          () => y.length,
          () => {
            x.inited &&
              (F(e.active),
              M(),
              t(() => {
                j(!0);
              }));
          },
        ),
        Q({ resize: ae, scrollTo: R }),
        E(M),
        Jt(M),
        et(() => {
          (F(e.active, !0),
            t(() => {
              ((x.inited = !0), f.value && (i = q(f.value).height), j(!0));
            }));
        }),
        In(u, M),
        tt(`scroll`, re, { target: g, passive: !0 }),
        b({ id: m, props: e, setLine: M, scrollable: S, onRendered: (e, t) => n(`rendered`, e, t), currentName: D, setTitleRefs: v, scrollIntoView: j }),
        () =>
          h(`div`, { ref: u, class: Yn([e.type]) }, [
            e.showHeader ? (e.sticky ? h(zn, { container: u.value, offsetTop: O.value, onScroll: te }, { default: () => [ie()] }) : ie()) : null,
            h(
              qn,
              { ref: p, count: y.length, inited: x.inited, animated: e.animated, duration: e.duration, swipeable: e.swipeable, lazyRender: e.lazyRender, currentIndex: x.currentIndex, onChange: P },
              { default: () => [r.default?.call(r)] },
            ),
          ])
      );
    },
  }),
  $n = Symbol(),
  er = Symbol(),
  tr = () => i(er, null),
  nr = (e) => {
    let t = tr();
    (m($n, e),
      m(
        er,
        w(() => (t == null || t.value) && e.value),
      ));
  },
  [rr, ir] = Y(`tab`),
  ar = n({
    name: rr,
    props: {
      id: String,
      dot: Boolean,
      type: String,
      color: String,
      title: String,
      badge: U,
      shrink: Boolean,
      isActive: Boolean,
      disabled: Boolean,
      controls: String,
      scrollable: Boolean,
      activeColor: String,
      inactiveColor: String,
      showZeroBadge: W,
    },
    setup(e, { slots: t }) {
      let n = w(() => {
          let t = {},
            { type: n, color: r, disabled: i, isActive: a, activeColor: o, inactiveColor: s } = e;
          r && n === `card` && ((t.borderColor = r), i || (a ? (t.backgroundColor = r) : (t.color = r)));
          let c = a ? o : s;
          return (c && (t.color = c), t);
        }),
        r = () => {
          let n = h(`span`, { class: ir(`text`, { ellipsis: !e.scrollable }) }, [t.title ? t.title() : e.title]);
          return e.dot || (H(e.badge) && e.badge !== ``) ? h($t, { dot: e.dot, content: e.badge, showZero: e.showZeroBadge }, { default: () => [n] }) : n;
        };
      return () =>
        h(
          `div`,
          {
            id: e.id,
            role: `tab`,
            class: [ir([e.type, { grow: e.scrollable && !e.shrink, shrink: e.shrink, active: e.isActive, disabled: e.disabled }])],
            style: n.value,
            tabindex: e.disabled ? void 0 : e.isActive ? 0 : -1,
            "aria-selected": e.isActive,
            "aria-disabled": e.disabled || void 0,
            "aria-controls": e.controls,
            "data-allow-mismatch": `attribute`,
          },
          [r()],
        );
    },
  }),
  [or, sr] = Y(`swipe-item`),
  cr = Z(
    n({
      name: or,
      setup(e, { slots: n }) {
        let r,
          i = N({ offset: 0, inited: !1, mounted: !1 }),
          { parent: o, index: s } = Ye(Un);
        if (!o) return;
        let c = w(() => {
            let e = {},
              { vertical: t } = o.props;
            return (o.size.value && (e[t ? `height` : `width`] = `${o.size.value}px`), i.offset && (e.transform = `translate${t ? `Y` : `X`}(${i.offset}px)`), e);
          }),
          l = w(() => {
            let { loop: e, lazyRender: t } = o.props;
            if (!t || r) return !0;
            if (!i.mounted) return !1;
            let n = o.activeIndicator.value,
              a = o.count.value - 1,
              c = n === 0 && e ? a : n - 1,
              l = n === a && e ? 0 : n + 1;
            return ((r = s.value === n || s.value === c || s.value === l), r);
          });
        return (
          a(() => {
            t(() => {
              i.mounted = !0;
            });
          }),
          Q({
            setOffset: (e) => {
              i.offset = e;
            },
          }),
          () => h(`div`, { class: sr(), style: c.value }, [l.value ? n.default?.call(n) : null])
        );
      },
    }),
  ),
  [lr, ur] = Y(`tab`),
  dr = Z(
    n({
      name: lr,
      props: V({}, Yt, { dot: Boolean, name: U, badge: U, title: String, disabled: Boolean, titleClass: null, titleStyle: [String, Object], showZeroBadge: W }),
      setup(e, { slots: n }) {
        let r = Pn(),
          i = k(!1),
          a = P(),
          { parent: s, index: u } = Ye(Zn);
        if (!s) return;
        let d = () => e.name ?? u.value,
          f = () => {
            ((i.value = !0),
              s.props.lazyRender &&
                t(() => {
                  s.onRendered(d(), e.title);
                }));
          },
          p = w(() => {
            let e = d() === s.currentName.value;
            return (e && !i.value && f(), e);
          }),
          m = k(``),
          g = k(``);
        l(() => {
          let { titleClass: t, titleStyle: n } = e;
          ((m.value = t ? M(t) : ``), (g.value = n && typeof n != `string` ? O(x(n)) : n));
        });
        let _ = (t) =>
            h(
              ar,
              D(
                {
                  key: r,
                  id: `${s.id}-${u.value}`,
                  ref: s.setTitleRefs(u.value),
                  style: g.value,
                  class: m.value,
                  isActive: p.value,
                  controls: r,
                  scrollable: s.scrollable.value,
                  activeColor: s.props.titleActiveColor,
                  inactiveColor: s.props.titleInactiveColor,
                  onClick: (e) => t(a.proxy, u.value, e),
                },
                Re(s.props, [`type`, `color`, `shrink`]),
                Re(e, [`dot`, `badge`, `title`, `disabled`, `showZeroBadge`]),
              ),
              { title: n.title },
            ),
          v = k(!p.value);
        return (
          o(p, (e) => {
            e
              ? (v.value = !1)
              : Ke(() => {
                  v.value = !0;
                });
          }),
          o(
            () => e.title,
            () => {
              (s.setLine(), s.scrollIntoView());
            },
          ),
          nr(p),
          Q({ id: r, renderTitle: _ }),
          () => {
            let e = `${s.id}-${u.value}`,
              { animated: t, swipeable: a, scrollspy: o, lazyRender: l } = s.props;
            if (!n.default && !t) return;
            let d = o || p.value;
            if (t || a)
              return h(
                cr,
                {
                  id: r,
                  role: `tabpanel`,
                  class: ur(`panel-wrapper`, { inactive: v.value }),
                  tabindex: p.value ? 0 : -1,
                  "aria-hidden": !p.value,
                  "aria-labelledby": e,
                  "data-allow-mismatch": `attribute`,
                },
                { default: () => [h(`div`, { class: ur(`panel`) }, [n.default?.call(n)])] },
              );
            let f = i.value || o || !l ? n.default?.call(n) : null;
            return c(h(`div`, { id: r, role: `tabpanel`, class: ur(`panel`), tabindex: d ? 0 : -1, "aria-labelledby": e, "data-allow-mismatch": `attribute` }, [f]), [[ee, d]]);
          }
        );
      },
    }),
  ),
  fr = Z(Qn),
  [pr, mr] = Y(`picker-group`),
  hr = Symbol(pr);
n({
  name: pr,
  props: V({ tabs: Ve(), activeTab: K(0), nextStepText: String, showToolbar: W }, En),
  emits: [`confirm`, `cancel`, `update:activeTab`],
  setup(e, { emit: t, slots: n }) {
    let r = An(
        () => e.activeTab,
        (e) => t(`update:activeTab`, e),
      ),
      { children: i, linkChildren: a } = $e(hr);
    a();
    let o = () => +r.value < e.tabs.length - 1 && e.nextStepText,
      s = () => {
        o()
          ? (r.value = +r.value + 1)
          : t(
              `confirm`,
              i.map((e) => e.confirm()),
            );
      },
      c = () => t(`cancel`);
    return () => {
      let t = n.default
        ?.call(n)
        ?.filter((e) => e.type !== C)
        .map((e) => (e.type === j ? e.children : e));
      t &&= Be(t);
      let i = o() ? e.nextStepText : e.confirmButtonText;
      return h(`div`, { class: mr() }, [
        e.showToolbar ? h(kn, { title: e.title, cancelButtonText: e.cancelButtonText, confirmButtonText: i, onConfirm: s, onCancel: c }, Re(n, Dn)) : null,
        h(
          fr,
          { active: r.value, "onUpdate:active": (e) => (r.value = e), class: mr(`tabs`), shrink: !0, animated: !0, lazyRender: !1 },
          { default: () => [e.tabs.map((e, n) => h(dr, { title: e, titleClass: mr(`tab-title`) }, { default: () => [t?.[n]] }))] },
        ),
      ]);
    };
  },
});
var gr = Z(
  n({
    name: cn,
    props: V({}, V({ loading: Boolean, readonly: Boolean, allowHtml: Boolean, optionHeight: K(44), showToolbar: W, swipeDuration: K(1e3), visibleOptionNum: K(6) }, En), {
      columns: Ve(),
      modelValue: Ve(),
      toolbarPosition: He(`top`),
      columnsFieldNames: Object,
    }),
    emits: [`confirm`, `cancel`, `change`, `scrollInto`, `clickOption`, `update:modelValue`],
    setup(e, { emit: n, slots: r }) {
      let i = k(),
        a = k(e.modelValue.slice(0)),
        { parent: s } = Ye(hr),
        { children: c, linkChildren: l } = $e(Cn);
      l();
      let u = w(() => _n(e.columnsFieldNames)),
        d = w(() => kt(e.optionHeight)),
        f = w(() => dn(e.columns, u.value)),
        p = w(() => {
          let { columns: t } = e;
          switch (f.value) {
            case `multiple`:
              return t;
            case `cascade`:
              return hn(t, u.value, a);
            default:
              return [t];
          }
        }),
        m = w(() => p.value.some((e) => e.length)),
        g = w(() => p.value.map((e, t) => mn(e, a.value[t], u.value))),
        _ = w(() => p.value.map((e, t) => e.findIndex((e) => e[u.value.value] === a.value[t]))),
        v = (e, t) => {
          if (a.value[e] !== t) {
            let n = a.value.slice(0);
            ((n[e] = t), (a.value = n));
          }
        },
        y = () => ({ selectedValues: a.value.slice(0), selectedOptions: g.value, selectedIndexes: _.value }),
        b = (e, r) => {
          (v(r, e),
            f.value === `cascade` &&
              a.value.forEach((e, t) => {
                let n = p.value[t];
                pn(n, e, u.value) || v(t, n.length ? n[0][u.value.value] : void 0);
              }),
            t(() => {
              n(`change`, V({ columnIndex: r }, y()));
            }));
        },
        x = (e, t) => {
          let r = { columnIndex: t, currentOption: e };
          (n(`clickOption`, V(y(), r)), n(`scrollInto`, r));
        },
        S = () => {
          c.forEach((e) => e.stopMomentum());
          let e = y();
          return (
            t(() => {
              n(`confirm`, y());
            }),
            e
          );
        },
        C = () => n(`cancel`, y()),
        T = () =>
          p.value.map((t, i) =>
            h(
              wn,
              {
                value: a.value[i],
                fields: u.value,
                options: t,
                readonly: e.readonly,
                allowHtml: e.allowHtml,
                optionHeight: d.value,
                swipeDuration: e.swipeDuration,
                visibleOptionNum: e.visibleOptionNum,
                onChange: (e) => b(e, i),
                onClickOption: (e) => x(e, i),
                onScrollInto: (e) => {
                  n(`scrollInto`, { currentOption: e, columnIndex: i });
                },
              },
              { option: r.option },
            ),
          ),
        E = (e) => {
          if (m.value) {
            let t = { height: `${d.value}px` },
              n = { backgroundSize: `100% ${(e - d.value) / 2}px` };
            return [h(`div`, { class: $(`mask`), style: n }, null), h(`div`, { class: [Wt, $(`frame`)], style: t }, null)];
          }
        },
        O = () => {
          let t = d.value * +e.visibleOptionNum,
            n = { height: `${t}px` };
          return !e.loading && !m.value && r.empty ? r.empty() : h(`div`, { ref: i, class: $(`columns`), style: n }, [T(), E(t)]);
        },
        A = () => {
          if (e.showToolbar && !s) return h(kn, D(Re(e, On), { onConfirm: S, onCancel: C }), Re(r, Dn));
        },
        j = (e) => {
          e.forEach((e, t) => {
            e.length && !pn(e, a.value[t], u.value) && v(t, un(e)[u.value.value]);
          });
        };
      o(p, (e) => j(e), { immediate: !0 });
      let M;
      return (
        o(
          () => e.modelValue,
          (t) => {
            (!ze(t, a.value) && !ze(t, M) && ((a.value = t.slice(0)), (M = t.slice(0))), e.modelValue.length === 0 && j(p.value));
          },
          { deep: !0 },
        ),
        o(
          a,
          (t) => {
            ze(t, e.modelValue) || ((M = t.slice(0)), n(`update:modelValue`, M));
          },
          { immediate: !0 },
        ),
        tt(`touchmove`, vt, { target: i }),
        Q({ confirm: S, getSelectedOptions: () => g.value }),
        () =>
          h(`div`, { class: $() }, [
            e.toolbarPosition === `top` ? A() : null,
            e.loading ? h(an, { class: $(`loading`) }, null) : null,
            r[`columns-top`]?.call(r),
            O(),
            r[`columns-bottom`]?.call(r),
            e.toolbarPosition === `bottom` ? A() : null,
          ])
      );
    },
  }),
);
export { I as i, ge as n, ke as r, gr as t };
