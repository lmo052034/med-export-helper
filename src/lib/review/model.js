/* 병원 검토 건(case) 구조, 기본값, 출처. 장비별 값은 콘텐츠 팩(PACK.review)이 덮어씁니다.
   출처 구분: official 공식, 공개자료 / company 회사 자료 / team 팀 가정 / hospital 병원 입력 */
import { PACK } from "@pack";

export const BASIS = {
  official: { ko: "공개자료", id: "Data publik", tone: "official" },
  company: { ko: "회사 자료", id: "Data pabrikan", tone: "company" },
  team: { ko: "가정", id: "Asumsi", tone: "team" },
  hospital: { ko: "병원 입력", id: "Input RS", tone: "hospital" },
  missing: { ko: "확인 필요", id: "Perlu konfirmasi", tone: "missing" },
};

/* 장비와 상관없는 인도네시아 공통 근거 (공개 저장소에 둬도 되는 것만) */
export const COMMON_SOURCES = {
  "pay.rate": { basis: "official", src: "BI: 은행 신규 대출 평균금리 9.49% (2026.6)", url: "https://www.bi.go.id/id/publikasi/ruang-media/news-release/Documents/sp_2814226-Lampiran-3__Asesmen-Transparansi-SBDK.pdf", asOf: "2026.6", note: "그 뒤 BI 기준금리가 5.25%에서 6.00%로 올라(2026.11.18) 실제 견적은 더 높을 수 있음. 리스사(multifinance)는 은행보다 높은 편. 금융사 견적으로 바꿔 넣을 것" },
  "pay.biRate": { basis: "official", src: "Bank Indonesia: BI-Rate 6.00% (RDG 2026.11.17–18)", url: "https://www.bi.go.id/en/iru/highlight-news/Pages/BI-Rate-Raised-25-bps-to-6.00-percent-Strengthening-Stability,-Supporting-Economic-Growth.aspx", asOf: "2026-11-18" },
  "pay.rateType": { basis: "team", src: "리스, 할부 견적이 '플랫(bunga flat)'인지 '실효(efektif)'인지 꼭 확인", note: "같은 숫자라도 플랫 금리는 실효 금리보다 부담이 큽니다. 화면에 실효 금리로 환산해 보여 줍니다" },
  "vc.tariff": { basis: "official", src: "PLN 비즈니스 B-2 (6,600 VA–200 kVA) Rp1,444.70/kWh, 2026년 4분기(10–12월) 고시", url: "https://economy.okezone.com/read/2026/11/03/320/3251766/tarif-listrik-pln-terbaru-di-november-2026?page=all", asOf: "2026 4분기", note: "200 kVA 넘는 큰 병원(B-3)은 Rp1,114.74. 분기마다 조정 (Permen ESDM 7/2024)" },
  "device.price": { basis: "official", src: "의료서비스는 부가세(PPN) 면제라 병원은 장비 매입 부가세를 공제받지 못함 (PP 49/2022)", note: "그래서 도입가는 부가세 포함 금액으로 넣습니다" },
  "rev.bpjs": { basis: "official", src: "Kepmenkes HK.01.07/MENKES/1366/2024: JKN 환자 본인 차액(selisih biaya)은 병실 등급 상향 때의 규정", url: "https://kemkes.go.id/eng/launching-pedoman-selisih-biaya-kesehatan", asOf: "2024-09-11", note: "BPJS 환자는 INA-CBG 묶음 수가라 시술 1회 단가가 따로 들어오지 않음. 이 계산은 자비, 민간보험 환자만 셉니다" },
  "rev.feePct": { basis: "team", src: "카드, QRIS 수수료와 민간보험 청구 할인", note: "병원 결제 계약서의 수수료율로 바꿔 넣을 것" },
  "rev.discountPct": { basis: "team", src: "코스(패키지) 판매 할인", note: "현금 시술 클리닉은 코스로 팔면서 회당 단가를 낮추는 경우가 많음 (재활 장비 현금 시술 가이드, 2025)" },
  "ops.slotMin": { basis: "team", src: "예약 1칸 = 시술 + 준비, 기록 시간", note: "병원 실제 예약표로 확인" },
  "ops.hours": { basis: "team", src: "장비를 쓰는 하루 시간", note: "외래 운영 시간 기준" },
  "ops.workDays": { basis: "team", src: "월 진료일", note: "토요일 진료 포함 여부에 따라 다름" },
  "fixed.therapist": { basis: "official", src: "물리치료사 대도시 민간 월 Rp6–12백만 (UNPRI, 2026.4.27)", note: "전담이 아니라 기존 인력이 맡으면 해당 비율만 넣기" },
  "demand.rampMonths": { basis: "team", src: "도입 초기 환자가 늘어나는 기간", note: "0이면 첫 달부터 목표 시술량" },
  horizon: { basis: "team", src: "검토 기간" },
};

/* 기본 검토 조건. PACK.review.defaults가 있으면 그 값을 우선합니다 */
const BASE = {
  name: "", city: "",
  device: { price: "", lifeMonths: "48" },
  pay: { mode: "cash", depositPct: "30", downPct: "20", months: "36", rate: "9.49", rateType: "efektif", adminPct: "1" },
  rev: { price: "", discountPct: "0", feePct: "0" },
  demand: { mode: "sessions", sessions: "40", newPatients: "12", course: "3", completionPct: "100", rampMonths: "0" },
  ops: { slotMin: "30", hours: "8", workDays: "24" },
  vc: { docFee: "0", docPct: "0", consumable: "0", va: "", powerMin: "30", tariff: "1444.70", hpCost: "", hpLife: "", shots: "" },
  fixed: [{ id: "therapist", label: "전담 치료 인력", amount: "" }],
  horizon: "60",
};

const R = PACK.review || {};
const merge = (a, b) => {
  if (!b) return a;
  const out = { ...a };
  for (const k of Object.keys(b)) out[k] = b[k] && typeof b[k] === "object" && !Array.isArray(b[k]) ? merge(a[k] || {}, b[k]) : b[k];
  return out;
};

export const DEVICE = { name: "치료 장비", nameId: "alat terapi", ...R.device };
export const SOURCES = { ...COMMON_SOURCES, ...(R.sources || {}) };
export const FACTS = R.facts || [];
export const BENCHMARKS = R.benchmarks || [];
export const FAQ_FACTS = R.faq || {};
export const PACK_LABEL = R.label || "예시 조건 (공개판)";

let seq = 0;
export const caseId = () => `h${Date.now().toString(36)}${(seq++).toString(36)}`;

export function defaults() {
  const d = merge(BASE, R.defaults);
  return JSON.parse(JSON.stringify({ ...d, fixed: (d.fixed || []).map((r) => ({ ...r })) }));
}

export function newCase(name = "") {
  return { ...defaults(), id: caseId(), name, createdAt: new Date().toISOString() };
}

const get = (o, path) => path.split(".").reduce((x, k) => (x == null ? undefined : x[k]), o);
export const getVal = get;
export function setVal(o, path, value) {
  const keys = path.split(".");
  const out = Array.isArray(o) ? [...o] : { ...o };
  let cur = out;
  for (let i = 0; i < keys.length - 1; i++) { cur[keys[i]] = Array.isArray(cur[keys[i]]) ? [...cur[keys[i]]] : { ...cur[keys[i]] }; cur = cur[keys[i]]; }
  cur[keys[keys.length - 1]] = value;
  return out;
}

/* 칸의 출처: 기본값 그대로면 기본값의 출처, 바꿨으면 '병원 입력' */
export function metaOf(c, path) {
  const def = get(defaults(), path);
  const cur = get(c, path);
  const src = SOURCES[path];
  if (def !== undefined && String(def ?? "") !== String(cur ?? "")) return { basis: "hospital", src: "검토 중인 병원이 준 값", changed: true, def, base: src };
  if (cur === "" || cur === undefined || cur === null) return { basis: "missing", src: src?.src || "아직 값이 없음", note: src?.note };
  return src || { basis: "team", src: "기본 가정값" };
}

export function fixedMeta(c, row) {
  const def = (defaults().fixed || []).find((r) => r.id === row.id);
  const src = SOURCES[`fixed.${row.id}`];
  if (!def) return { basis: "hospital", src: "병원이 추가한 항목" };
  if (String(def.amount) !== String(row.amount)) return { basis: "hospital", src: "검토 중인 병원이 준 값", changed: true, def: def.amount, base: src };
  if (!row.amount) return { basis: "missing", src: src?.src || "아직 값이 없음" };
  return src || { basis: "team", src: "기본 가정값" };
}

/* 저장 (이 브라우저에만) */
const KEY = "mdk:hospital-review";
export function loadCases() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && Array.isArray(s.list) && s.list.length) return { list: s.list.map((c) => merge(defaults(), c)), active: s.active };
    }
  } catch { /* 저장소를 못 쓰는 브라우저 */ }
  const c = newCase(R.sampleName || "검토 병원 1");
  return { list: [c], active: c.id };
}
export function saveCases(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch { return false; }
}
