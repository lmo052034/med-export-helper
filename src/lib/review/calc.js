/* 병원 도입 검토 계산 (한 곳에서만 계산합니다)
   설계 참고:
   - 공헌이익, 손익분기, ROI 공식: Physicians Practice "ROI on purchasing new technology equipment" (2025.12)
   - 환자 수 × 코스 회수로 월 시술량을 잡는 방식, 월 납입금과 월 공헌이익 비교: 현금 시술 장비 ROI 워크시트 (재활 장비 제조사 eBook, 2025)
   - 리스 기간과 월 납입금 입력: 장비 리스 ROI 계산기 (2024)
   값은 모두 세전, 월 조건이 일정하다는 전제입니다. 확률이나 보장이 아닙니다. */
import { parseNum } from "../deal/money.js";

export const n = (raw) => { const p = parseNum(raw); return p.state === "ok" ? p.value : null; };
const pos = (v) => (v !== null && v >= 0 ? v : null);

/* 원리금 균등 월 납입금 (실효 연이율) */
export function annuity(principal, annualPct, months) {
  if (principal === null || months === null || months <= 0 || annualPct === null) return null;
  const r = annualPct / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - (1 + r) ** -months);
}

/* 인도네시아 리스, 할부 견적에 흔한 '플랫 금리' (원금 × 연이율 × 기간을 균등 분할) */
export function flatPayment(principal, annualPct, months) {
  if (principal === null || months === null || months <= 0 || annualPct === null) return null;
  return (principal * (1 + (annualPct / 100) * (months / 12))) / months;
}

/* 월 납입금에서 실효 연이율 역산 (이분법). 플랫 금리가 실제로 얼마인지 보여 줄 때 사용 */
export function effectiveRate(principal, payment, months) {
  if (!principal || !payment || !months) return null;
  if (payment * months <= principal + 1e-6) return 0;
  let lo = 0, hi = 2; // 월 0%–200%
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const pv = payment * (1 - (1 + mid) ** -months) / mid;
    if (pv > principal) lo = mid; else hi = mid;
  }
  return ((lo + hi) / 2) * 12 * 100;
}

/* 입력 읽기. 빈칸은 null로 두고, 계산에서 빠진 항목을 따로 알려 줍니다 */
export function readInputs(c) {
  const fixedRows = c.fixed.map((r) => ({ ...r, v: pos(n(r.amount)) }));
  return {
    price: pos(n(c.device.price)),
    lifeMonths: pos(n(c.device.lifeMonths)),
    mode: c.pay.mode,
    depositPct: pos(n(c.pay.depositPct)),
    downPct: pos(n(c.pay.downPct)),
    months: pos(n(c.pay.months)),
    rate: pos(n(c.pay.rate)),
    rateType: c.pay.rateType,
    adminPct: pos(n(c.pay.adminPct)),
    listPrice: pos(n(c.rev.price)),
    discountPct: pos(n(c.rev.discountPct)),
    feePct: pos(n(c.rev.feePct)),
    demandMode: c.demand.mode,
    sessionsDirect: pos(n(c.demand.sessions)),
    newPatients: pos(n(c.demand.newPatients)),
    course: pos(n(c.demand.course)),
    completion: pos(n(c.demand.completionPct)),
    rampMonths: pos(n(c.demand.rampMonths)),
    slotMin: pos(n(c.ops.slotMin)),
    hours: pos(n(c.ops.hours)),
    workDays: pos(n(c.ops.workDays)),
    docFee: pos(n(c.vc.docFee)),
    docPct: pos(n(c.vc.docPct)),
    consumable: pos(n(c.vc.consumable)),
    va: pos(n(c.vc.va)),
    powerMin: pos(n(c.vc.powerMin)),
    tariff: pos(n(c.vc.tariff)),
    hpCost: pos(n(c.vc.hpCost)),
    hpLife: pos(n(c.vc.hpLife)),
    shots: pos(n(c.vc.shots)),
    fixedRows,
    horizon: Math.min(Math.max(Math.round(n(c.horizon) ?? 60), 12), 120),
  };
}

/* 금융 조건 → 계약 시 현금, 월 납입금, 납입 개월, 총이자 */
export function financing(I) {
  const P = I.price;
  if (P === null) return { ok: false, upfront: null, payment: 0, months: 0, interest: 0, effRate: null, label: "장비 가격 없음" };
  if (I.mode === "cash") {
    return { ok: true, upfront: P, payment: 0, months: 0, interest: 0, effRate: null, principal: 0, label: "일시불" };
  }
  const down = (P * (I.downPct ?? 0)) / 100;
  const principal = P - down;
  const admin = (principal * (I.adminPct ?? 0)) / 100;
  const m = I.months ?? 0;
  const pay = I.rateType === "flat" ? flatPayment(principal, I.rate ?? 0, m) : annuity(principal, I.rate ?? 0, m);
  if (pay === null || m <= 0) return { ok: false, upfront: down + admin, payment: 0, months: 0, interest: 0, effRate: null, label: "할부 기간 없음" };
  return {
    ok: true, upfront: down + admin, payment: pay, months: m, principal,
    interest: pay * m - principal + admin,
    effRate: I.rateType === "flat" ? effectiveRate(principal - admin, pay, m) : I.rate,
    label: I.mode === "partner" ? "파트너 분할" : "금융사 할부, 리스",
  };
}

export function perSession(I) {
  const missing = [];
  const net = I.listPrice === null ? null : I.listPrice * (1 - (I.discountPct ?? 0) / 100) * (1 - (I.feePct ?? 0) / 100);
  if (net === null) missing.push("회당 시술가");
  const doctor = (I.docFee ?? 0) + (I.listPrice ?? 0) * (1 - (I.discountPct ?? 0) / 100) * ((I.docPct ?? 0) / 100);
  const power = I.va !== null && I.powerMin !== null && I.tariff !== null ? (I.va / 1000) * (I.powerMin / 60) * I.tariff : null;
  if (power === null) missing.push("전력 (VA, 사용 시간, 요금 중 빈칸)");
  let handpiece = null;
  if (I.hpCost !== null && I.hpLife && I.shots !== null) handpiece = (I.hpCost / I.hpLife) * I.shots;
  else missing.push("핸드피스 교체비 (가격, 수명, 회당 발수 중 빈칸)");
  const variable = doctor + (I.consumable ?? 0) + (power ?? 0) + (handpiece ?? 0);
  return { net, doctor, consumable: I.consumable ?? 0, power, handpiece, variable, contribution: net === null ? null : net - variable, missing };
}

export function volume(I) {
  if (I.demandMode === "patients") {
    if (I.newPatients === null || I.course === null) return { sessions: null, patients: I.newPatients };
    return { sessions: I.newPatients * I.course * ((I.completion ?? 100) / 100), patients: I.newPatients };
  }
  return { sessions: I.sessionsDirect, patients: I.course ? I.sessionsDirect / (I.course * ((I.completion ?? 100) / 100)) : null };
}

const ceil = (v) => Math.ceil(v - 1e-9);

/* 메인 계산 */
export function review(c, over = {}) {
  const I0 = readInputs(c);
  const I = { ...I0, ...over };
  const ps = perSession(I);
  const vol = volume(I);
  const S = over.sessions !== undefined ? over.sessions : vol.sessions;
  const fixed = I.fixedRows.reduce((s, r) => s + (r.v ?? 0), 0);
  const fixedMissing = I.fixedRows.filter((r) => r.v === null).map((r) => r.label || "고정비");
  const fin = financing(I);
  const C = ps.contribution;
  const dep = I.price !== null && I.lifeMonths ? I.price / I.lifeMonths : null;

  const bep = (extra) => (C !== null && C > 0 ? ceil((fixed + extra) / C) : null);
  const bepOperating = bep(0);
  const bepFinancing = fin.payment ? bep(fin.payment) : null;
  const bepAccounting = dep !== null ? bep(dep) : null;

  const capacity = I.slotMin && I.hours !== null && I.workDays !== null ? Math.floor((I.hours * 60) / I.slotMin) * I.workDays : null;
  const opProfit = C !== null && S !== null ? S * C - fixed : null; // 장비 대금 전
  const cashProfitDuring = opProfit !== null ? opProfit - fin.payment : null;
  const acctProfit = opProfit !== null && dep !== null ? opProfit - dep : null;

  // 누적 현금흐름 (0개월 = 계약 시 현금 지출). 초기 증가 기간은 선형으로 늘어난다고 가정
  const H = I.horizon;
  const series = [];
  let cum = fin.upfront !== null ? -fin.upfront : null, payback = null;
  if (cum !== null && C !== null && S !== null) {
    series.push({ m: 0, v: cum });
    const ramp = I.rampMonths ?? 0;
    for (let m = 1; m <= H; m++) {
      const s = ramp > 0 && m <= ramp ? (S * m) / (ramp + 1) : S;
      const flow = s * C - fixed - (m <= fin.months ? fin.payment : 0);
      const before = cum;
      cum += flow;
      if (payback === null && before < 0 && cum >= 0) payback = m - 1 + (-before / flow);
      series.push({ m, v: cum });
    }
    if (payback === null && series[0].v >= 0) payback = 0;
  }
  const totalPaid = fin.upfront !== null ? fin.upfront + fin.payment * fin.months : null;
  const endCum = series.length ? series[series.length - 1].v : null;
  const roi = endCum !== null && totalPaid ? (endCum / totalPaid) * 100 : null;

  const workDays = I.workDays || null;
  return {
    I, ps, S, patients: vol.patients, fixed, fixedMissing, fin, dep,
    bepOperating, bepFinancing, bepAccounting,
    bepPatients: (b) => (b !== null && I.course ? b / (I.course * ((I.completion ?? 100) / 100)) : null),
    perDay: (x) => (x !== null && workDays ? x / workDays : null),
    capacity, utilization: capacity && S !== null ? S / capacity : null,
    opProfit, cashProfitDuring, acctProfit,
    series, payback, totalPaid, endCum, roi, horizon: H,
    missing: [...ps.missing, ...fixedMissing.map((x) => `${x} 금액`), ...(I.price === null ? ["장비 도입가"] : [])],
    complete: ps.net !== null && S !== null && I.price !== null,
  };
}

/* 머리 숫자 기준: 할부면 월 납입금 포함, 일시불이면 장비비를 배분 기간으로 나눠 포함 (덱 12쪽과 같은 기준).
   배분 기간이 비어 있으면 운영비만 기준으로 대신 보여 줍니다 */
export const isFinanced = (r) => r.I.mode !== "cash" && r.fin.payment > 0;
export const headProfit = (r) => (isFinanced(r) ? r.cashProfitDuring : r.acctProfit ?? r.opProfit);
export const headBep = (r) => (isFinanced(r) ? r.bepFinancing : r.dep !== null ? r.bepAccounting : r.bepOperating);

/* 민감도: 값 하나씩 바꿨을 때 머리 숫자(월 손익, 손익분기) 변화 */
export function sensitivity(c) {
  const base = review(c);
  if (headProfit(base) === null) return [];
  const I = base.I;
  const rows = [
    { key: "price", label: "회당 시술가 −20%", over: { listPrice: I.listPrice * 0.8 } },
    { key: "volume", label: "월 시술량 −20%", over: { sessions: base.S * 0.8 } },
    { key: "fixed", label: "고정비 +20%", over: { fixedRows: I.fixedRows.map((r) => ({ ...r, v: r.v === null ? null : r.v * 1.2 })) } },
    { key: "discount", label: "패키지 할인 +10%p", over: { discountPct: (I.discountPct ?? 0) + 10 } },
  ];
  if (I.mode !== "cash") rows.push({ key: "rate", label: "금리 +2%p", over: { rate: (I.rate ?? 0) + 2 } });
  rows.push({ key: "volumeUp", label: "월 시술량 +20%", over: { sessions: base.S * 1.2 } });
  return rows.map((r) => {
    const x = review(c, r.over);
    return { ...r, value: headProfit(x), delta: headProfit(x) - headProfit(base), bep: headBep(x) };
  });
}

/* 시술량별 월 손익 (그래프). 머리 숫자와 같은 기준 */
export function profitCurve(c, maxN) {
  const out = [];
  const step = Math.max(1, Math.round(maxN / 40));
  for (let s = 0; s <= maxN; s += step) { const r = review(c, { sessions: s }); out.push({ x: s, y: headProfit(r) }); }
  return out;
}
