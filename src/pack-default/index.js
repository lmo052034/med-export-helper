/* 기본 콘텐츠 팩 (공개 저장소용). 특정 회사·제품 정보 없이 화면 구조만 보여 줍니다.
   실제 제안 콘텐츠는 프로젝트 폴더의 팩을 PACK_DIR로 지정해 빌드합니다 (README 참고). */
import { mockDeal, snapshot, sanitize, newId as id } from "@/lib/deal/model.js";

export const PACK = {
  key: "default",
  sampleKey: "default-v1",
  brand: "의료기기 수출 제안",
  team: "에프킬라",
  asOf: "예시 콘텐츠",
  hero: { eyebrow: "예시 의료기기 (가상)", title: "의료기기 수출 제안", lead: "제품 선정부터 현지 판매 구조까지 살펴보고, 거래조건에 따른 가격과 병원 손익을 확인하세요.", image: null, imageAlt: "", imageCredit: "" },
  product: { title: "제품 구성", lead: "공개 사이트에는 특정 회사의 제품 사진, 가격, 거래처 정보를 싣지 않고 가상 예시로 구조만 보여 줍니다.", handpieces: [], facts: [{ k: "제안 구성", v: "본체 1세트 (예시)", src: "예시" }], claims: [], caution: "" },
  country: { title: "진출 국가", lead: "국가별 등록 현황은 실제 제품을 정한 뒤 같은 기준으로 조회해 채웁니다.", scope: "", rows: [], compare: null, gap: [] },
  structure: {
    title: "제조사는 파트너에게 팔고, 파트너가 병원에 팝니다", lead: "수출 거래와 현지 거래를 나눠 봅니다.", label: "예시 구조",
    actors: [{ key: "maker", name: "제조사", sub: "예시", roles: ["제조, 수출"] }, { key: "partner", name: "현지 파트너", sub: "예시", roles: ["수입, 병원 판매"] }, { key: "hospital", name: "병원", sub: "예시", roles: ["검수, 대금 지급"] }],
    modes: {
      contract: { label: "계약", links: [{ from: "maker", to: "partner", text: "수출 매매 계약" }, { from: "partner", to: "hospital", text: "현지 매매 계약" }], note: "" },
      money: { label: "대금", links: [{ from: "partner", to: "maker", text: "수출 대금" }, { from: "hospital", to: "partner", text: "계약금, 잔금" }], note: "" },
    },
  },
  footer: { project: "의료기기 수출 제안 (예시)" },
};

export function sampleDeal() {
  const d = mockDeal();
  d.kind = "sample"; d.sampleKey = PACK.sampleKey; d.caseLabel = "대표 모의 거래 (예시)";
  const hv = (label, amount) => ({ id: id(), label, amount, basis: "team", note: "모의 값" });
  d.econ = {
    ...d.econ,
    fx: { rate: "16000", date: "", source: "모의 값" }, dutyPct: "0", importVatPct: "", pph22Pct: "",
    costs: [{ id: id(), label: "운임·보험 (모의)", amount: "500", currency: "USD", basis: "team", included: true, inCif: true, when: "before-ship", note: "모의 값" }],
    hospital: { investMode: "local", investCustom: "", price: "300000", priceKind: "mock", priceSource: "모의 값", sessions: "40", workDays: "24", horizon: "60", variable: [hv("소모품", "10000")], fixed: [hv("인건비", "5000000")] },
    scenarios: [{ id: id(), label: "보수", price: "250000", sessions: "30", note: "모의" }, { id: id(), label: "기준", price: "300000", sessions: "40", note: "모의" }, { id: id(), label: "낙관", price: "350000", sessions: "50", note: "모의" }],
  };
  d.baseline = snapshot(d);
  return sanitize(d);
}

/* 병원 도입 검토 (공개판): 특정 장비 없이 인도네시아 공통 근거만. 장비 값은 예시이며 '가정'으로 표시됩니다 */
PACK.review = {
  label: "공개판 예시 조건",
  sampleName: "예시 병원 A",
  device: { name: "치료 장비 (예시)", nameId: "alat terapi", model: "" },
  defaults: {
    device: { price: "300000000", lifeMonths: "48" },
    rev: { price: "300000" },
    demand: { sessions: "40", course: "4" },
    vc: { consumable: "5000", va: "300" },
    fixed: [{ id: "therapist", label: "전담 치료 인력", labelId: "Terapis", amount: "7000000" }],
  },
  sources: {
    "device.price": { basis: "team", src: "예시 값. 파트너의 공식 견적가(부가세 포함)로 바꿔 넣을 것", note: "병원은 장비 매입 부가세를 공제받지 못함 (PP 49/2022)" },
    "rev.price": { basis: "official", src: "민간 물리치료 회당 Rp100–475천 범위 안의 예시 값 (Cermati, 2024)", note: "실제 수납액은 병원 숫자로" },
    "demand.sessions": { basis: "team", src: "예시 값. 병원의 월 유료 시술 수로" },
    "demand.course": { basis: "team", src: "예시 값. 장비, 적응증별 표준 코스로" },
  },
  benchmarks: [],
  facts: [],
};
