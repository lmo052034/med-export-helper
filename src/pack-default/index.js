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
