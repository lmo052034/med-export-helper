/* 기본 콘텐츠 팩 (공개 저장소용). 특정 회사, 제품 정보 없이 화면 구조만 보여 줍니다.
   실제 제안 콘텐츠는 프로젝트 폴더의 팩을 PACK_DIR로 지정해 빌드합니다 (README 참고). */
import { mockDeal, snapshot, sanitize, newId as id } from "@/lib/deal/model.js";

export const PACK = {
  key: "default",
  sampleKey: "default-v1",
  brand: "파트너 데스크",
  credit: "에프킬라 (개발, 디자인)",
  asOf: "자료 기준 2026.11",
  hero: {
    eyebrow: "본사 해외영업팀과 현지 파트너의 업무 화면",
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
  user: { name: "김민영", team: "본사 해외영업팀" },
  consult: {
    product: "치료 장비", chain: ["본사", "현지 파트너", "재활병원 A"],
    mail: {
      id: { from: "Mitra Lokal", fromTeam: "Tim Penjualan Lokal", to: "Kantor Pusat", toTeam: "Tim Penjualan Luar Negeri", hospital: "Rumah Sakit Rehabilitasi A" },
      from: "현지 파트너사", fromTeam: "현지 영업팀", to: "본사", toTeam: "해외영업팀",
      subject: "[견적 검토 요청] 치료 장비 1세트, 재활병원 A", hospital: "재활병원 A", sessions: 60,
      body: [
        "안녕하세요. 재활병원 A에서 치료 장비 한 세트의 견적을 요청했습니다.",
        "병원은 월 유료 시술을 약 60회로 예상하고 있습니다. 저희가 병원에 제시할 세금 포함 견적과, 이 조건에서 병원이 한 달에 몇 회 시술해야 비용을 충당할 수 있는지 검토 부탁드립니다.",
        "검토 결과를 보내주시면 저희가 병원에 안내하겠습니다.",
      ],
    },
    id: "sample", name: "병원 도입 상담 예시", link: "병원 도입 상담",
    title: "치료 장비 | 병원 도입 상담",
    sub: "현지 등록사를 통한 재판매, 예시 거래",
    invest: 500000000, lifeMonths: 48, sessions: 60, price: 500000, variable: 40000, fixed: 11000000,
    src: "예시 값. 수납액과 시술량은 상담용 가정",
    next: "병원에 최근 3개월 실제 회당 수납액과 월별 유료 시술 건수를 요청하세요.",
  },

  flow: {
    lead: "진행 중 수출 1건, 세번부터 서류까지 한 화면 확인",
    hs: { task: "수출입 신고 품목번호 확정", result: "9018.90", sub: "국제 공통 6단위", chain: [["국제 공통 6단위", "9018.90"], ["수입국 세부 단위", "수입국 세율표로 확인"]], note: "", src: "예시. 실제 제품의 수출 신고 세번과 수입국 세율표로 확정" },
    tariff: { task: "수입 관세와 FTA 원산지 조건", result: "확인 필요", sub: "수입국 세율표와 협정별 원산지 기준", rows: [["기본 관세", "수입국 세율표"], ["협정 관세", "원산지 기준 충족 시"]], cond: "", src: "예시" },
    license: { task: "수입국 의료기기 등록 조회", result: "조회 전", sub: "국가별 정부 등록 DB", src: "예시" },
    structure: {
      task: "제조사, 현지 파트너, 병원의 역할 구분", result: "파트너 재판매", sub: "수출 계약과 현지 판매 계약 분리",
      nodes: [{ name: "제조사", role: "제조, 수출" }, { name: "현지 파트너", role: "수입, 등록, 병원 판매" }, { name: "병원", role: "도입, 대금 지급" }],
      src: "예시",
    },
    profit: { src: "모의 값" },
    cases: [
      {
        id: "hs", subject: "[수정 요청] 상업송장 HS 코드 세부 단위 기재", from: "현지 파트너 수입 담당",
        ask: "수입 신고에서 HS 6단위는 부족하다고 나옵니다. 인보이스를 수입국 세부 단위로 다시 보내 주세요.",
        steps: [
          { title: "수출 신고 세번 확인", value: "9018.90", detail: "국제 공통 6단위 (예시)" },
          { title: "수입국 세부 단위 확인", value: "수입국 세율표", detail: "같은 6단위 아래 갈래 중 제품에 맞는 줄" },
          { title: "상업송장 HS 칸 수정 후 회신", value: "상업송장 초안", link: { to: "/docs?doc=invoice", label: "상업송장 열기" } },
        ],
        reply: "수입국 세부 단위로 고친 상업송장 수정본 송부 (예시).",
      },
      {
        id: "bep", subject: "[문의] 월 손익분기 시술 횟수", from: "검토 병원 원장 (파트너 영업 경유)",
        ask: "한 달에 몇 번 시술해야 손해가 안 나나요? 우리 병원은 월 60회 정도 예상합니다.",
        steps: [
          { title: "병원 도입가와 회당 수납 확인", value: "모의 값", detail: "거래 데이터 기준" },
          { title: "손익분기 확인", value: "05 병원 수익성", detail: "장비 대금 배분 기준" },
          { title: "병원 예상 시술 수 입력", value: "월 60회", action: { path: "econ.hospital.sessions", value: "60", label: "60회 입력", done: "05 병원 수익성 월 60회" } },
        ],
        reply: "손익분기와 월 60회 기준 손익은 아래 05 병원 수익성 그래프 참고 (모의 값).",
      },
    ],
  },
  footer: { project: "파트너 데스크, 본사 해외영업팀과 현지 파트너 공용", lines: ["본사 해외영업과 현지 파트너가 병원 영업, 견적, 선적 서류를 함께 보는 화면입니다."] },
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
