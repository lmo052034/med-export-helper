/* 가격·수익성 계산. 모든 화면이 이 함수만 씁니다 (화면마다 계산식을 따로 두지 않음).
   - 병원 운영: 현금흐름 기준. 초기 도입비는 투자액으로 한 번만 넣고, 월 비용에 감가상각을 다시 넣지 않습니다.
   - 파트너 거래 손익: 입력한 비용만 더하고, 빠진 항목은 범위로 알려 줍니다. 수입 부가세·PPh 22는 공제·선납이라 손익에서 제외합니다.
   - 제조사 이익: 제조원가 자료가 없어 계산하지 않습니다. */
import { parseNum, toMinor, fromMinor } from "./money.js";
import { calcExport, calcLocal } from "./calc.js";
import { getPath } from "./path.js";

const val = (raw) => { const p = parseNum(raw); return p.state === "ok" ? p.value : null; };

/* 입력 상태: ok | blank | invalid | negative */
function field(raw, { allowNeg = false } = {}) {
  const p = parseNum(raw);
  if (p.state !== "ok") return { state: p.state, value: null };
  if (!allowNeg && p.value < 0) return { state: "negative", value: p.value };
  return { state: "ok", value: p.value };
}

export function hospitalInputs(d) {
  const h = d.econ.hospital;
  const L = calcLocal(d);
  const invest = h.investMode === "custom" ? field(h.investCustom) : L.total !== null ? { state: "ok", value: L.total, fromLocal: true } : { state: "blank", value: null, fromLocal: true };
  const rows = (list) => list.map((r) => ({ ...r, f: field(r.amount) }));
  return { cur: d.local.currency, invest, price: field(h.price), sessions: field(h.sessions), workDays: field(h.workDays), horizon: field(h.horizon), variable: rows(h.variable), fixed: rows(h.fixed) };
}

/* 월 조건이 일정하다는 전제의 모의 분석 */
export function hospitalCalc(d, override = {}) {
  const I = hospitalInputs(d);
  const price = override.price !== undefined ? field(override.price) : I.price;
  const sessions = override.sessions !== undefined ? field(override.sessions) : I.sessions;
  const issues = [];
  const bad = (f) => f.state !== "ok";
  if (bad(price)) issues.push({ field: "econ.hospital.price", text: price.state === "blank" ? "회당 실수납액이 비어 있어요." : "회당 실수납액이 숫자가 아니거나 음수예요." });
  if (bad(sessions)) issues.push({ field: "econ.hospital.sessions", text: sessions.state === "blank" ? "월 유료 시술 건수가 비어 있어요." : "월 유료 시술 건수가 숫자가 아니거나 음수예요." });
  for (const r of [...I.variable, ...I.fixed]) if (bad(r.f)) issues.push({ field: `econ.hospital.${I.variable.includes(r) ? "variable" : "fixed"}.${r.id}.amount`, text: `${r.label || "비용"} 값이 ${r.f.state === "blank" ? "비어 있어요" : "숫자가 아니거나 음수예요"}.` });
  if (bad(I.invest)) issues.push({ field: I.invest.fromLocal ? "local.lines" : "econ.hospital.investCustom", text: I.invest.fromLocal ? "현지 견적 총액이 계산되지 않아 초기 도입비를 알 수 없어요." : "초기 도입비가 비어 있거나 잘못됐어요." });

  const sum = (list) => (list.every((r) => r.f.state === "ok") ? list.reduce((s, r) => s + r.f.value, 0) : null);
  const varCost = sum(I.variable), fixed = sum(I.fixed);
  const p = price.state === "ok" ? price.value : null, n = sessions.state === "ok" ? sessions.value : null;
  const contribution = p !== null && varCost !== null ? p - varCost : null;
  const revenue = p !== null && n !== null ? p * n : null;
  const varTotal = varCost !== null && n !== null ? varCost * n : null;
  const surplus = contribution !== null && n !== null && fixed !== null ? n * contribution - fixed : null;
  let bep = null, bepNote = "";
  if (contribution !== null && fixed !== null) {
    if (contribution <= 0) bepNote = "회당 공헌액이 0 이하라 시술을 늘려도 고정비를 메울 수 없어요.";
    else bep = Math.ceil(fixed / contribution - 1e-9);
  }
  const invest = I.invest.state === "ok" ? I.invest.value : null;
  let payback = null, paybackNote = "";
  if (surplus !== null && invest !== null) {
    if (surplus <= 0) paybackNote = "월 운영 현금잉여가 0 이하라 이 조건에서는 회수기간을 산출할 수 없어요.";
    else payback = invest / surplus;
  }
  const H = I.horizon.state === "ok" ? Math.min(Math.max(Math.round(I.horizon.value), 1), 120) : 60;
  const cumulative = invest !== null && surplus !== null ? Array.from({ length: H + 1 }, (_, m) => ({ m, v: -invest + m * surplus })) : [];
  const perDay = n !== null && I.workDays.state === "ok" && I.workDays.value > 0 ? n / I.workDays.value : null;
  return { cur: I.cur, inputs: I, price: p, sessions: n, varCost, fixed, contribution, revenue, varTotal, surplus, bep, bepNote, invest, payback, paybackNote, horizon: H, cumulative, perDay, issues, complete: issues.length === 0 };
}

/* 시술량별 월 운영 현금잉여 (그래프용). 같은 hospitalCalc를 씁니다 */
export function surplusCurve(d, maxN = 120, step = 4) {
  const out = [];
  for (let n = 0; n <= maxN; n += step) { const r = hospitalCalc(d, { sessions: String(n) }); out.push({ n, v: r.surplus }); }
  return out;
}

/* 파트너 비용을 현지 통화로: 수출 통화 항목은 환율을 곱함 */
function toLocal(amount, currency, d, fx) {
  if (amount === null) return null;
  if (currency === d.local.currency) return amount;
  if (currency === d.exp.currency) return fx === null ? null : amount * fx;
  return null;
}

/* 파트너 거래 손익 (1건, 세전). 매출 = 현지 견적 공급가(부가세 제외) */
export function partnerCalc(d) {
  const E = calcExport(d), L = calcLocal(d);
  const fx = field(d.econ.fx.rate);
  const fxv = fx.state === "ok" && fx.value > 0 ? fx.value : null;
  const included = [], missing = [], excluded = [];
  const exportCost = E.total !== null ? fromMinor(E.total, d.exp.currency) : null; // 수출 통화 금액
  const exportLocal = toLocal(exportCost, d.exp.currency, d, fxv);
  if (exportLocal === null) missing.push(E.total === null ? "수출 금액 (빈칸 있음)" : "환율");
  else included.push({ key: "export", label: "수출 대금 (제조사 지급)", local: exportLocal, src: `${d.exp.currency} × 환율` });

  let cifUsd = exportCost;
  const costs = d.econ.costs.map((c) => {
    const f = field(c.amount);
    const local = f.state === "ok" ? toLocal(f.value, c.currency, d, fxv) : null;
    return { ...c, f, local };
  });
  for (const c of costs) {
    if (!c.included) { excluded.push(c.label || "비용"); continue; }
    if (c.local === null) { missing.push(c.label || "비용"); continue; }
    included.push({ key: c.id, label: c.label, local: c.local, src: c.currency === d.local.currency ? "현지 통화" : `${c.currency} × 환율`, basis: c.basis });
    if (c.inCif && cifUsd !== null && c.currency === d.exp.currency) cifUsd += c.f.value;
  }
  const duty = field(d.econ.dutyPct);
  let dutyLocal = null;
  if (duty.state === "ok") {
    const cifLocal = toLocal(cifUsd, d.exp.currency, d, fxv);
    if (cifLocal === null) missing.push("관세 (과세가격 계산 불가)");
    else { dutyLocal = Math.round(cifLocal * duty.value / 100); included.push({ key: "duty", label: `관세 ${duty.value}%`, local: dutyLocal, src: "과세가격(CIF) × 세율" }); }
  } else missing.push("관세율");
  const revenue = L.net;
  if (revenue === null) missing.push("현지 판매가");
  const cost = included.reduce((s, x) => s + x.local, 0);
  const profit = revenue !== null ? revenue - Math.round(cost) : null;
  const cifLocal = toLocal(cifUsd, d.exp.currency, d, fxv);
  return { cur: d.local.currency, fx: fxv, revenue, included, missing, excluded, cost: Math.round(cost), profit, margin: profit !== null && revenue ? profit / revenue : null, complete: missing.length === 0, cifLocal, dutyLocal, exportLocal };
}

/* 결제 흐름 (단계 순서). 날짜가 없어 시점은 순서로만 보여 줍니다. 파트너 초기 현금은 0으로 가정 */
export function cashFlow(d) {
  const E = calcExport(d), L = calcLocal(d), P = partnerCalc(d);
  const steps = [];
  const pay = L.pay.rows;
  const first = pay[0], rest = pay.slice(1);
  const vat = field(d.econ.importVatPct), pph = field(d.econ.pph22Pct);
  if (first && first.minor !== null) steps.push({ step: "병원 계약", who: "hospital→partner", label: `병원 계약금${first.pct ? ` ${first.pct}%` : ""}${first.label ? ` (${first.label})` : ""}`, amount: first.minor });
  if (P.exportLocal !== null) {
    const freight = P.included.filter((x) => !["export", "duty"].includes(x.key) && d.econ.costs.find((c) => c.id === x.key)?.when === "before-ship").reduce((s, x) => s + x.local, 0);
    steps.push({ step: "출하 전", who: "partner→maker", label: "수출 대금 (제조사 지급)", amount: -Math.round(P.exportLocal) });
    if (freight) steps.push({ step: "출하 전", who: "partner→carrier", label: "운임·보험 등 출하 전 비용", amount: -Math.round(freight) });
  }
  if (P.cifLocal !== null && P.dutyLocal !== null) {
    const base = P.cifLocal + P.dutyLocal;
    const taxes = P.dutyLocal + (vat.state === "ok" ? base * vat.value / 100 : 0) + (pph.state === "ok" ? base * pph.value / 100 : 0);
    steps.push({ step: "수입 신고", who: "partner→customs", label: `관세${vat.state === "ok" ? " + 수입 부가세" : ""}${pph.state === "ok" ? " + PPh 22" : ""} (현금 지출)`, amount: -Math.round(taxes) });
  }
  const after = P.included.filter((x) => d.econ.costs.find((c) => c.id === x.key)?.when && d.econ.costs.find((c) => c.id === x.key).when !== "before-ship").reduce((s, x) => s + x.local, 0);
  if (after) steps.push({ step: "설치·운영", who: "partner→local", label: "현지 비용 (설치·교육·금융 등)", amount: -Math.round(after) });
  for (const r of rest) if (r.minor !== null) steps.push({ step: "검수 후", who: "hospital→partner", label: `병원 잔금${r.pct ? ` ${r.pct}%` : ""}${r.label ? ` (${r.label})` : ""}`, amount: r.minor });
  let acc = 0, low = 0;
  const rows = steps.map((s) => { acc += s.amount; low = Math.min(low, acc); return { ...s, acc }; });
  return { cur: d.local.currency, rows, low, need: low < 0 ? -low : 0, exportPay: E.pay, complete: P.complete && L.total !== null };
}

/* 기준안과 다른 값인지 (대표 사례의 변경 표시) */
export function changedFrom(d, path) {
  if (!d.baseline) return false;
  const b = getPath(d.baseline, path);
  if (b === undefined) return path.split(".").length > 3; // 기준안에 없던 행
  return String(b ?? "") !== String(getPath(d, path) ?? "");
}
export const toMinorLocal = (v, cur) => toMinor(v, cur);
export { val };

/* 기준안 값을 얹은 거래 (기준안 결과와 비교할 때 사용) */
export function withBaseline(d) {
  if (!d.baseline) return null;
  const b = d.baseline;
  return { ...d, exp: { ...d.exp, ...b.exp }, local: { ...d.local, ...b.local }, econ: b.econ };
}
