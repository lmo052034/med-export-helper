/* 기본 콘텐츠 팩 (공개 저장소용). 특정 회사, 제품 정보 없이 화면 구조만 보여 줍니다.
   실제 제안 콘텐츠는 프로젝트 폴더의 팩을 PACK_DIR로 지정해 빌드합니다 (README 참고). */
import { mockDeal, snapshot, sanitize, newId as id } from "@/lib/deal/model.js";

export const PACK = {
  key: "default",
  sampleKey: "default-v1",
  brand: "파트너 데스크",
  team: "에프킬라",
  asOf: "자료 기준 2026.11",
  hero: {
    eyebrow: "해외영업팀과 에프킬라의 인도네시아 수출 데스크",
    title: "의료기기\n인도네시아 수출 운영",
    lead: "현지 파트너와의 수출 거래, 병원 도입 제안, 선적 서류까지 지금 진행 중인 업무를 한곳에서 이어 갑니다.",
    cta: "진행 현황 보기",
    status: [
      { k: "진행 중 거래", v: "본체 1세트, 인보이스 작성", live: true },
      { k: "판매 구조", v: "제조사 → 현지 파트너 → 병원" },
      { k: "이번 주 할 일", v: "병원 도입 검토, 서류 점검" },
    ],
    note: "제품 사진과 단가, 거래처 정보는 거래처 공유본에서만 보여 줍니다.",
    image: null, imageAlt: "", imageCredit: "",
  },
  product: { title: "본체 1세트와 교체형 핸드피스로 공급합니다", lead: "제품 사진, 단가, 거래처 정보는 거래처 공유본에만 싣습니다.", handpieces: [], facts: [{ k: "제안 구성", v: "본체 1세트", src: "거래 조건" }], claims: [], caution: "" },
  country: { title: "진출 국가", lead: "국가별 등록 현황은 실제 제품을 정한 뒤 같은 기준으로 조회해 채웁니다.", scope: "", rows: [], compare: null, gap: [] },
  structure: {
    title: "제조사는 파트너에게 팔고, 파트너가 병원에 팝니다", lead: "수출 거래와 현지 거래를 나눠 봅니다.", label: "현재 거래 구조",
    actors: [{ key: "maker", name: "제조사", sub: "수출", roles: ["제조, 수출"] }, { key: "partner", name: "현지 파트너", sub: "수입, 유통", roles: ["수입, 병원 판매"] }, { key: "hospital", name: "병원", sub: "민간 병원", roles: ["검수, 대금 지급"] }],
    modes: {
      contract: { label: "계약", links: [{ from: "maker", to: "partner", text: "수출 매매 계약" }, { from: "partner", to: "hospital", text: "현지 매매 계약" }], note: "" },
      money: { label: "대금", links: [{ from: "partner", to: "maker", text: "수출 대금" }, { from: "hospital", to: "partner", text: "계약금, 잔금" }], note: "" },
    },
  },
  desk: {
    team: "해외영업팀, 현지 파트너 공용",
    title: "업무 현황",
    asOf: "11월 23일 (월) 기준",
    stages: ["문의", "시연", "견적 발송", "계약 협의", "설치, 교육"],
    hospitals: [
      { name: "민간병원 A", city: "자카르타 남부", stage: "시연", owner: "현지 영업", next: "원내 시연, 재활의학과 치료사 2명 참석", due: "11.27" },
      { name: "재활클리닉 B", city: "반둥", stage: "견적 발송", owner: "현지 영업", next: "견적 회신 확인 (11.18 발송)", due: "11.25" },
      { name: "종합병원 C 재활의학과", city: "탕그랑", stage: "계약 협의", owner: "본사 해외영업", next: "계약금 30%, 납기 조건 협의", due: "11.29" },
      { name: "정형외과 병원 D", city: "수라바야", stage: "견적 발송", owner: "현지 영업", next: "할부 36개월 조건으로 수정 견적", due: "11.24" },
      { name: "스포츠클리닉 E", city: "족자카르타", stage: "문의", owner: "현지 영업", next: "시연 일정 조율", due: "12.02" },
      { name: "민간병원 F", city: "브카시", stage: "문의", owner: "현지 영업", next: "첫 방문, 담당 원장 면담", due: "12.04" },
    ],
    tasks: [
      { kind: "quote", title: "정형외과 병원 D 수정 견적 발송", owner: "현지 영업", meta: "할부 36개월", due: "11.24", sort: 1 },
      { kind: "follow", title: "민간병원 A 원장 질문 회신", owner: "본사 해외영업", meta: "BPJS 환자 적용 여부", due: "11.24", sort: 2 },
      { kind: "quote", title: "재활클리닉 B 견적 회신 확인", owner: "현지 영업", meta: "2차 연락", due: "11.25", sort: 3 },
      { kind: "as", title: "시연 장비 핸드피스 점검", owner: "현지 기술팀", meta: "시연 전 출력 확인", due: "11.25", sort: 4 },
      { kind: "doc", title: "포장명세서에 실측 중량 반영", owner: "본사 해외영업", due: "11.26", sort: 5 },
      { kind: "demo", title: "민간병원 A 원내 시연", owner: "현지 영업, 현지 기술팀", meta: "10:00", due: "11.27", sort: 6 },
      { kind: "ship", title: "항공 운임 견적 2곳 비교 후 확정", owner: "본사 해외영업", due: "11.27", sort: 7 },
      { kind: "doc", title: "원산지증명서 발급 신청", owner: "본사 해외영업", meta: "FTA 특혜 관세용", due: "11.28", sort: 8 },
    ],
    note: "현황판의 병원과 일정은 화면 구성용 샘플 데이터입니다.",
  },
  footer: { project: "파트너 데스크, 해외영업팀과 에프킬라", lines: ["본사 해외영업과 현지 파트너가 병원 영업, 견적, 선적 서류를 함께 보는 화면입니다."] },
};

export function sampleDeal() {
  const d = mockDeal();
  d.kind = "sample"; d.sampleKey = PACK.sampleKey; d.caseLabel = "진행 중 거래";
  const hv = (label, amount) => ({ id: id(), label, amount, basis: "team", note: "모의 값" });
  d.econ = {
    ...d.econ,
    fx: { rate: "16000", date: "", source: "모의 값" }, dutyPct: "0", importVatPct: "", pph22Pct: "",
    costs: [{ id: id(), label: "운임, 보험 (모의)", amount: "500", currency: "USD", basis: "team", included: true, inCif: true, when: "before-ship", note: "모의 값" }],
    hospital: { investMode: "local", investCustom: "", price: "300000", priceKind: "mock", priceSource: "모의 값", sessions: "40", workDays: "24", horizon: "60", variable: [hv("소모품", "10000")], fixed: [hv("인건비", "5000000")] },
    scenarios: [{ id: id(), label: "보수", price: "250000", sessions: "30", note: "모의" }, { id: id(), label: "기준", price: "300000", sessions: "40", note: "모의" }, { id: id(), label: "낙관", price: "350000", sessions: "50", note: "모의" }],
  };
  d.baseline = snapshot(d);
  return sanitize(d);
}

/* 병원 도입 검토 (공개판): 특정 장비 없이 인도네시아 공통 근거만. 장비 값은 예시이며 '가정'으로 표시됩니다 */
PACK.review = {
  label: "기본 검토 조건",
  sampleName: "검토 병원 A",
  device: { name: "치료 장비", nameId: "alat terapi", model: "" },
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
