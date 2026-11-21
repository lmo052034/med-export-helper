/* 금액 계산: 수출 거래(제조사 → 파트너)와 현지 거래(파트너 → 병원)를 따로 계산합니다.
   현지 가격은 수출 가격에 환율을 곱해 만들지 않고, 입력한 값만 씁니다 */
import { parseNum, lineMinor, toMinor, schedule } from "./money.js";

export function calcExport(d) {
  const cur = d.exp.currency;
  const items = d.exp.items.map((it) => {
    const q = parseNum(it.qty), p = parseNum(it.price);
    const minor = q.state === "ok" && p.state === "ok" && q.value >= 0 && p.value >= 0 ? lineMinor(q.value, p.value, cur) : null;
    return { ...it, q, p, minor };
  });
  const extras = d.exp.extras.map((x) => { const a = parseNum(x.amount); return { ...x, a, minor: a.state === "ok" && a.value >= 0 ? toMinor(a.value, cur) : null }; });
  const complete = items.every((i) => i.minor !== null) && extras.filter((x) => x.included).every((x) => x.minor !== null);
  const itemsMinor = items.reduce((s, i) => s + (i.minor || 0), 0);
  const extrasMinor = extras.filter((x) => x.included).reduce((s, x) => s + (x.minor || 0), 0);
  const total = complete ? itemsMinor + extrasMinor : null;
  return { cur, items, extras, itemsMinor, extrasMinor, total, partialTotal: itemsMinor + extrasMinor, complete, pay: schedule(d.exp.payment, total, cur) };
}

export function calcLocal(d) {
  const cur = d.local.currency;
  const lines = d.local.lines.map((l) => {
    const q = parseNum(l.qty), p = parseNum(l.price);
    return { ...l, q, p, minor: q.state === "ok" && p.state === "ok" && q.value >= 0 && p.value >= 0 ? lineMinor(q.value, p.value, cur) : null };
  });
  const complete = lines.length > 0 && lines.every((l) => l.minor !== null);
  const net = complete ? lines.reduce((s, l) => s + l.minor, 0) : null;
  const vat = parseNum(d.local.vatPct);
  const vatMinor = net !== null && vat.state === "ok" && vat.value >= 0 ? Math.round((net * vat.value) / 100) : vat.state === "blank" ? 0 : null;
  const total = net !== null && vatMinor !== null ? net + vatMinor : null;
  return { cur, lines, net, vat, vatMinor, total, pay: schedule(d.local.payment, total, cur) };
}

/* 중량: 화물 전체 또는 포장 1개당으로 적은 값을 전체 중량으로 맞춤 */
export function weights(d) {
  const nw = parseNum(d.exp.nw), gw = parseNum(d.exp.gw), pk = parseNum(d.exp.packages);
  const per = d.exp.weightBasis === "per-package";
  const mul = per ? (pk.state === "ok" ? pk.value : null) : 1;
  const tot = (p) => (p.state === "ok" && mul !== null ? Math.round(p.value * mul * 1000) / 1000 : null);
  return { nw, gw, pk, per, nwTotal: tot(nw), gwTotal: tot(gw) };
}

export const partyOf = (d, role) => d.parties[d.roles[role]] || { name: "" };
export const invoiceTerms = (d) => (d.exp.invoiceOverride.on ? { incoterm: d.exp.invoiceOverride.incoterm, place: d.exp.invoiceOverride.place, overridden: true } : { incoterm: d.exp.incoterm, place: d.exp.place, overridden: false });
