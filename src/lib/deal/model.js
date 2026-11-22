/* 거래 기준정보: 견적서·인보이스·메일·현지 견적이 모두 이 한 덩어리에서 만들어집니다.
   숫자는 입력한 문자열 그대로 저장해 빈칸과 0을 구분합니다 */

export const SCHEMA = 3;
const uid = () => Math.random().toString(36).slice(2, 10);
export const newId = uid;

const party = () => ({ name: "", address: "", contact: "", email: "", phone: "" });

export function blankDeal() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    schema: SCHEMA,
    id: uid(),
    kind: "user", // user = 직접 입력, sample = 대표 모의 거래, mock = 화면 시연용 모의 거래, case = 파일에서 불러온 사례
    caseLabel: "",
    sampleKey: "",
    meta: { name: "", no: "", date: today, stage: "quote", updatedAt: null },
    parties: { maker: party(), partner: party(), hospital: party() },
    roles: { exportSeller: "maker", exportBuyer: "partner", consignee: "partner", localSeller: "partner", localBuyer: "hospital" },
    exp: {
      currency: "USD",
      items: [{ id: uid(), kind: "main", model: "", desc: "", qty: "", unit: "set", price: "", priceSource: "", hs: "" }],
      extras: [],
      incoterm: "", place: "", incotermVersion: "2020", transport: "",
      exportClearance: "",
      payment: [{ id: uid(), label: "", pct: "", amount: "", due: "" }],
      leadTime: "", validityDays: "",
      quoteNo: "", quoteDate: "", invoiceNo: "", invoiceDate: "",
      origin: "Republic of Korea", destination: "",
      packages: "", packageUnit: "CTN", packing: "",
      nw: "", nwUnit: "kg", gw: "", gwUnit: "kg", weightBasis: "total",
      remarks: "",
      invoiceOverride: { on: false, incoterm: "", place: "", reason: "" },
    },
    local: {
      enabled: false, currency: "IDR", priceBasis: "",
      lines: [{ id: uid(), desc: "", qty: "", unit: "set", price: "" }],
      vatPct: "", vatIncluded: "no",
      payment: [{ id: uid(), label: "", pct: "", amount: "", due: "" }],
      quoteNo: "", quoteDate: "", validityDays: "", delivery: "", acceptance: "",
    },
    service: { install: "", installBy: "", training: "", trainingBy: "", warranty: "", asBy: "", notes: "" },
    counterpart: { requests: "", agreements: "" },
    email: { toName: "", toEmail: "", subject: "", intro: "", senderName: "", senderTitle: "", senderOrg: "", senderEmail: "", senderPhone: "" },
    econ: blankEcon(),
    evidence: [],
    review: { at: null, hash: null },
    changes: [],
    baseline: null, // 기준안: 대표 사례를 처음 만들 때의 가격·병원 운영 입력값 (비교와 되돌리기에 사용)
  };
}

/* 가격과 수익성 입력. 출처 구분 basis: company 회사 자료, public 공개자료, team 팀 설정(모의), user 사용자 입력 */
export function blankEcon() {
  return {
    fx: { rate: "", date: "", source: "" }, // 현지 통화 / 수출 통화 (예: IDR per USD)
    dutyPct: "", dutyBasis: "", importVatPct: "", pph22Pct: "",
    costs: [], // 파트너가 부담하는 수입·현지 비용 (운임, 보험, 설치·교육, 금융비 등)
    hospital: {
      investMode: "local", investCustom: "", // local = 현지 견적 총액(부가세 포함)을 초기 도입비로 사용
      price: "", priceKind: "", priceSource: "",
      sessions: "", workDays: "", horizon: "60",
      variable: [], fixed: [],
    },
    scenarios: [],
  };
}

/* 화면 시연용 모의 거래. 회사·주소·담당자·중량은 만들지 않고 빈칸으로 둡니다 */
export function mockDeal() {
  const d = blankDeal();
  d.kind = "mock";
  d.caseLabel = "모의 거래 (시연용)";
  d.meta = { ...d.meta, name: "모의 거래: 의료기기 장비 1세트 수출", no: "MOCK-001", stage: "invoice" };
  d.parties.maker.name = "제조사 (모의)";
  d.parties.partner.name = "현지 파트너 (모의)";
  d.parties.hospital.name = "병원 (모의)";
  d.exp.items = [
    { id: uid(), kind: "main", model: "MODEL-A", desc: "Main unit (mock)", qty: "1", unit: "set", price: "10000", priceSource: "모의 설정값", hs: "9018.90" },
    { id: uid(), kind: "handpiece", model: "HP-1", desc: "Handpiece (mock)", qty: "1", unit: "pc", price: "", priceSource: "", hs: "9018.90" },
  ];
  d.exp.incoterm = "EXW"; d.exp.place = "Seoul, Korea"; d.exp.transport = "air";
  d.exp.payment = [{ id: uid(), label: "T/T in advance", pct: "100", amount: "", due: "before shipment" }];
  d.exp.leadTime = "4 weeks after payment"; d.exp.validityDays = "30";
  d.exp.quoteNo = "MOCK-Q-001"; d.exp.quoteDate = d.meta.date;
  d.exp.invoiceNo = "MOCK-CI-001"; d.exp.invoiceDate = d.meta.date;
  d.exp.destination = "Indonesia"; d.exp.packages = "2";
  d.local.enabled = true; d.local.priceBasis = "mock";
  d.local.lines = [{ id: uid(), desc: "Main unit incl. delivery, installation, training (mock)", qty: "1", unit: "set", price: "200000000" }];
  d.local.vatPct = "11";
  d.local.payment = [
    { id: uid(), label: "Deposit on contract", pct: "30", amount: "", due: "on contract" },
    { id: uid(), label: "Balance after acceptance", pct: "70", amount: "", due: "after acceptance" },
  ];
  d.email.subject = "Quotation for MODEL-A (mock)";
  d.evidence = [{ id: uid(), field: "exp.items", title: "단가", ref: "모의 설정값", asOf: "", checkedAt: "", supports: "시연용으로 정한 값", status: "mock", confirmed: false }];
  return d;
}

/* ---------- 저장 데이터 검사·복구 ---------- */
const isObj = (o) => o && typeof o === "object" && !Array.isArray(o);
const str = (v) => (v === null || v === undefined ? "" : typeof v === "string" ? v : typeof v === "number" ? String(v) : "");

/* 기본 골격 위에 저장된 값을 얹되, 형식이 틀린 값은 버리고 기본값을 씁니다 */
function mergeShape(base, val) {
  if (Array.isArray(base)) return Array.isArray(val) ? val : base;
  if (isObj(base)) {
    const out = {};
    for (const k of Object.keys(base)) out[k] = mergeShape(base[k], isObj(val) ? val[k] : undefined);
    if (isObj(val)) for (const k of Object.keys(val)) if (!(k in base)) out[k] = val[k];
    return out;
  }
  if (typeof base === "boolean") return typeof val === "boolean" ? val : base;
  if (base === null) return val === undefined ? null : val;
  return val === undefined ? base : str(val);
}
const rowShape = {
  item: { id: "", kind: "main", model: "", desc: "", qty: "", unit: "set", price: "", priceSource: "", hs: "" },
  extra: { id: "", label: "", amount: "", included: true },
  pay: { id: "", label: "", pct: "", amount: "", due: "" },
  line: { id: "", desc: "", qty: "", unit: "set", price: "" },
  ev: { id: "", field: "", title: "", ref: "", asOf: "", checkedAt: "", supports: "", status: "team", confirmed: false },
  change: { at: "", field: "", from: "", to: "" },
  cost: { id: "", label: "", amount: "", currency: "USD", basis: "team", included: true, inCif: false, when: "before-ship", note: "" },
  hv: { id: "", label: "", amount: "", basis: "team", note: "" },
  scen: { id: "", label: "", price: "", sessions: "", note: "" },
};
const rows = (arr, shape) => (Array.isArray(arr) ? arr.filter(isObj).map((r) => ({ ...mergeShape(shape, r), id: str(r.id) || uid() })) : []);

export function sanitize(raw) {
  if (!isObj(raw)) throw new Error("거래 데이터 형식이 아닙니다");
  const d = mergeShape(blankDeal(), raw);
  d.schema = SCHEMA;
  d.id = str(raw.id) || uid();
  if (!["user", "mock", "case", "sample"].includes(d.kind)) d.kind = "user";
  if (!["quote", "invoice"].includes(d.meta.stage)) d.meta.stage = "quote";
  d.exp.items = rows(d.exp.items, rowShape.item);
  if (!d.exp.items.length) d.exp.items = blankDeal().exp.items;
  d.exp.extras = rows(d.exp.extras, rowShape.extra);
  d.exp.payment = rows(d.exp.payment, rowShape.pay);
  d.local.lines = rows(d.local.lines, rowShape.line);
  d.local.payment = rows(d.local.payment, rowShape.pay);
  d.evidence = rows(d.evidence, rowShape.ev);
  d.changes = rows(d.changes, rowShape.change).slice(-50);
  if (!isObj(d.review)) d.review = { at: null, hash: null };
  d.econ.costs = rows(d.econ.costs, rowShape.cost);
  d.econ.hospital.variable = rows(d.econ.hospital.variable, rowShape.hv);
  d.econ.hospital.fixed = rows(d.econ.hospital.fixed, rowShape.hv);
  d.econ.scenarios = rows(d.econ.scenarios, rowShape.scen);
  if (!["local", "custom"].includes(d.econ.hospital.investMode)) d.econ.hospital.investMode = "local";
  d.baseline = isObj(raw.baseline) ? raw.baseline : null;
  return d;
}

/* ---------- 이전 버전(07 견적서·인보이스 화면, 저장 키 deal) → 새 구조 ---------- */
export function migrateV1(old) {
  if (!isObj(old)) return null;
  const d = blankDeal();
  d.caseLabel = "이전 버전에서 옮긴 거래";
  d.meta.name = "이전 견적서·인보이스 입력값";
  const s = isObj(old.seller) ? old.seller : {}, b = isObj(old.buyer) ? old.buyer : {};
  d.parties.maker = { name: str(s.co), address: str(s.addr), contact: "", email: str(s.email), phone: str(s.tel) };
  d.parties.partner = { name: str(b.co), address: str(b.addr), contact: [str(b.name), str(b.title)].filter(Boolean).join(", "), email: str(b.email), phone: "" };
  if (Array.isArray(old.items)) d.exp.items = old.items.filter(isObj).map((it, i) => ({ id: uid(), kind: i ? "accessory" : "main", model: str(it.model), desc: str(it.desc), qty: str(it.qty), unit: "set", price: str(it.unit), priceSource: "", hs: str(it.hs) }));
  if (!d.exp.items.length) d.exp.items = blankDeal().exp.items;
  const fr = str(old.freight), ins = str(old.ins);
  if (fr) d.exp.extras.push({ id: uid(), label: "Freight", amount: fr, included: true });
  if (ins) d.exp.extras.push({ id: uid(), label: "Insurance", amount: ins, included: true });
  Object.assign(d.exp, {
    incoterm: str(old.inco), place: str(old.place), transport: str(old.mode),
    exportClearance: old.inco === "EXW" && old.sellerClear ? "seller arranges export clearance at buyer's cost" : "",
    leadTime: str(old.lead), validityDays: str(old.valid),
    quoteNo: str(old.qno), quoteDate: str(old.qdate), invoiceNo: str(old.ino), invoiceDate: str(old.idate),
    destination: str(old.dest), packing: str(old.pack), nw: str(old.nw), gw: str(old.gw),
  });
  if (old.pay) d.exp.payment = [{ id: uid(), label: str(old.pay), pct: "100", amount: "", due: "" }];
  if (old.invInco) d.exp.invoiceOverride = { on: true, incoterm: str(old.invInco), place: str(old.place), reason: "" };
  d.email.toName = str(b.sal); d.email.toEmail = str(b.email);
  d.email.senderName = str(old.sender); d.email.senderTitle = str(old.senderTitle); d.email.senderOrg = str(s.co); d.email.senderEmail = str(s.email); d.email.senderPhone = str(s.tel);
  if (Array.isArray(old.comp)) old.comp.filter((c) => isObj(c) && (c.name || c.src)).forEach((c) => d.evidence.push({ id: uid(), field: "exp.items", title: `경쟁 제품 가격: ${str(c.name)} ${str(c.price)}`, ref: str(c.src), asOf: "", checkedAt: "", supports: "단가 비교", status: "team", confirmed: false }));
  return d;
}

/* 이전 AI 답 확인 기록(저장 키 log) → 근거자료 목록 */
export function logToEvidence(log) {
  if (!Array.isArray(log)) return [];
  return log.filter((r) => isObj(r) && !r.seed && (r.source || r.fix)).map((r) => ({
    id: uid(), field: "", title: `이전 AI 답 확인 기록 (${str(r.part)})`, ref: str(r.source), asOf: "", checkedAt: str(r.at), supports: [str(r.fix), r.prompt ? `질문: ${str(r.prompt)}` : ""].filter(Boolean).join(" / "), status: "team", confirmed: false,
  }));
}

/* 검토 후 바뀌면 다시 확인해야 하는 핵심 조건 */
/* 기준안 스냅숏: 가격·구성·결제·병원 운영 입력만 담아 비교와 되돌리기에 씁니다 */
export function snapshot(d) {
  const c = (v) => JSON.parse(JSON.stringify(v));
  return { exp: { items: c(d.exp.items), extras: c(d.exp.extras), payment: c(d.exp.payment), currency: d.exp.currency }, local: { lines: c(d.local.lines), vatPct: d.local.vatPct, payment: c(d.local.payment) }, econ: c(d.econ) };
}

export function keyTerms(d) {
  return JSON.stringify([
    d.exp.currency, d.exp.items.map((i) => [i.model, i.qty, i.unit, i.price]), d.exp.extras.map((x) => [x.label, x.amount, x.included]),
    d.exp.incoterm, d.exp.place, d.exp.payment.map((p) => [p.pct, p.amount, p.due]), d.exp.nw, d.exp.gw, d.exp.packages,
    d.parties.partner.name, d.parties.maker.name, d.local.lines.map((l) => [l.qty, l.price]), d.local.payment.map((p) => [p.pct, p.amount]),
  ]);
}
export function hashOf(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16);
}
