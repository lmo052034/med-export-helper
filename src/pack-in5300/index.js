/* 공개 배포용 IN-5300 팩: 프로젝트 폴더 팩에서 이메일, 서명 이름, 수출 단가, 현지 주소 제외 */
/* IN-5300 인도네시아 수출 제안 콘텐츠 팩 (프로젝트 폴더 전용, 공개 저장소에 올리지 않음)
   사용: PACK_DIR=/mnt/project-files/site/in5300-pack npm run dev
   값마다 출처 구분: company 회사 자료 / official 공식, 공개자료 / team 팀 설정(모의) */
import { blankDeal, snapshot, sanitize, newId as id } from "@/lib/deal/model.js";
import mainUnit from "./img/main-unit.webp";
import hpLinear from "./img/hp-linear.webp";
import hpPoint from "./img/hp-point.webp";

export const PACK = {
  key: "in5300-id",
  sampleKey: "in5300-id-v1",
  brand: "영인 파트너 데스크",
  credit: "에프킬라 (조주영, 이정호), 개발과 디자인",
  asOf: "자료 기준 2026.11 (등록 DB 조회 2026.11.5–10)",
  people: {
    orgs: [
      { id: "hq", label: "영인바이오텍", desc: "제조사, 서울. 해외영업, 인허가와 품질, 경영 검토" },
      { id: "partner", label: "PT FISIO MEDIKA INDONESIA", desc: "현지 수입, 판매사, 자카르타. 병원 영업, 설치, A/S" },
    ],
    roles: [
      { id: "hq-sales", label: "해외영업", desc: "견적, 수출 서류, 선적, 대금", org: "hq", owner: "영인 해외영업", kinds: ["doc", "ship", "follow"] },
      { id: "hq-ra", label: "인허가와 품질", desc: "AKL 등록, 원산지증명, 인증 서류", org: "hq", owner: "", kinds: ["doc"] },
      { id: "hq-mgmt", label: "경영 검토", desc: "전체 현황, 수익성, 근거자료 확인", org: "hq", owner: "", kinds: [] },
      { id: "local-sales", label: "현지 영업", desc: "병원 방문, 시연, 견적 회신", org: "partner", owner: "FISIO 영업", kinds: ["quote", "demo", "follow"] },
      { id: "tech", label: "기술 지원", desc: "시연 장비, 설치, 교육, A/S", org: "partner", owner: "FISIO 기술팀", kinds: ["demo", "as"] },
      { id: "local-mgmt", label: "현지 관리", desc: "병원 계약, 계약금과 잔금, 수입 통관", org: "partner", owner: "", kinds: ["quote", "ship"] },
    ],
  },
  hero: {
    model: "SuperStar+ IN-5300",
    eyebrow: "영인바이오텍 해외영업팀과 PT FISIO MEDIKA INDONESIA의 업무 화면",
    title: "IN-5300\n인도네시아 수출 운영",
    lead: "PT FISIO MEDIKA INDONESIA와의 수출 거래, 현지 병원 도입 제안, 선적 서류까지 지금 진행 중인 업무를 한곳에서 이어 갑니다.",
    cta: "진행 현황 보기",
    status: [
      { k: "인도네시아 등록", v: "AKL 21403620119, 2030.10까지 유효", live: true },
      { k: "진행 중 거래", v: "IN-5300 1세트, 인보이스 작성" },
      { k: "병원 제안", v: "민간 재활병원, 월 손익분기 48회" },
    ],
    note: "AKL 등록은 e-Info Alkes에서 2026-11-05에 조회했습니다.",
    image: mainUnit,
    imageAlt: "SuperStar+ IN-5300 본체와 카트 (제조사 카탈로그 사진)",
    imageCredit: "사진: YOUNG-IN Biotech High-End Catalog (2026.04)",
  },
  product: {
    kicker: "주력 제품",
    title: "한 본체에서 선형 초점과 점 초점을 바꿔 씁니다",
    lead: "병원이 장비를 고를 때 먼저 묻는 것은 '한 대로 어떤 시술 부위를 다룰 수 있나'입니다. IN-5300은 초점 형태가 다른 핸드피스를 한 본체에 연결해 씁니다.",
    handpieces: [
      { img: hpLinear, alt: "L25 선형 초점 핸드피스 (카탈로그 사진)", name: "L25 선형 초점", desc: "충격파가 선 모양 구역에 모입니다. 카탈로그는 이를 'Linear Zone'이라 부릅니다.", tag: "제안 구성에 포함" },
      { img: hpPoint, alt: "점 초점 핸드피스 (카탈로그 사진, 모델명 표기 없음)", name: "점 초점 (제안 구성은 F40)", desc: "충격파가 한 점에 모입니다. 카탈로그의 점 초점 핸드피스는 F25, F40, FS60 세 가지입니다.", tag: "제안 구성에 포함", note: "사진은 카탈로그의 점 초점 핸드피스이며, F40 단독 사진은 아닙니다." },
    ],
    facts: [
      { k: "제안 구성", v: "본체 + L25 + F40 + 젤패드 세트", src: "회사 가격표 품목명 (2026 1-2Q)" },
      { k: "별도 옵션", v: "F25, FS60 핸드피스, 트롤리", src: "카탈로그 라인업, 가격표 (가격은 따로 확인)" },
      { k: "국내 허가", v: "식약처 3등급, 2023.06.16 (제허 23-673호)", src: "식약처 의료기기 전자민원 조회" },
      { k: "사용 목적 (국내 허가)", v: "압전 충격파로 근골격계 통증 완화", src: "식약처 허가사항" },
      { k: "전원, 무게", v: "AC 220–230 V, 220 VA, 본체 23 kg", src: "카탈로그 사양표" },
    ],
    claims: [
      { text: "유럽 CE MDR 인증 취득", src: "회사 발표 (2026.10.28)" },
      { text: "싱가포르 현지 병원과 협의 후 IN-5300 출시", src: "회사 발표 (2026.10)" },
    ],
    caution: "선형, 점 초점을 함께 쓴다는 사실만으로 치료 효과가 더 좋거나 구매비용이 줄어든다고 보지 않습니다. 시술 부위별 사용은 각국 허가 범위와 의료진 판단을 따릅니다.",
  },
  country: {
    title: "IN-5300 등록이 유효한 인도네시아를 첫 시장으로 운영합니다",
    lead: "수출 비중이 비슷한 일본, 홍콩, 인도네시아의 정부 등록 DB를 같은 방법으로 조회했습니다.",
    scope: "조회 범위: 각국 정부 DB에서 체외충격파 치료기 일반명, 키워드와 IN-5300 검색 (2026.11.5–8). 검색 결과에 없다는 것은 '찾지 못함'이며, 그 자체로 판매 불가를 뜻하지 않습니다.",
    rows: [
      { country: "인도네시아", flag: "ID", status: "등록 유효", primary: true, detail: "AKL 21403620119, Kelas C, 2030.10.1까지. 등록사 PT Fisio Medika Indonesia", need: "등록은 완료. 출하 전 LoA(위임장), 라벨, 원산지 판정을 등록사와 점검", db: "e-Info Alkes (보건부)" },
      { country: "일본", flag: "JP", status: "찾지 못함", detail: "승인 7건에 IN-5300 없음", need: "판매하려면 PMDA 승인과 현지 MAH(제조판매업자) 필요", db: "PMDA 승인 검색" },
      { country: "홍콩", flag: "HK", status: "찾지 못함", detail: "유효 등재 27건에 IN-5300 없음", need: "등재는 자율 제도라 민간 판매 의무는 없음. 보건서 조달에는 등재 필요", db: "MDACS (위생서)" },
    ],
    compare: {
      head: ["", "인도네시아", "일본", "홍콩"],
      rows: [
        ["한국산 수입 비중 (HS 9018.90, 2025)", "4.3%, 5위", "4.0%, 5위", "4.9%, 5위"],
        ["기본 관세 (한국산 FTA)", "5% (원산지 충족 시 0%)", "0%", "0%"],
        ["등록된 한국 ESWT 제조사", "2곳", "0곳", "0곳"],
        ["민간 병원 비중", "61.8% (병원 3,235곳 중 1,998곳)", "", ""],
      ],
      note: "수입 비중은 ESWT만의 수치가 아님 (KOTRA TriBIG). 등록 제조사 수는 판매량이나 경쟁 강도가 아님. 병원 수는 구매 의향이 아님 (보건부 LAKIP 2025).",
    },
    gap: [
      "등록 유효와 거래 실행은 다릅니다. 실제 수출 전에 확인할 것:",
      "등록사와 대리점 계약, LoA(최소 2년), 유통업 허가(IDAK) 사본",
      "인도네시아어 라벨과 사용설명서",
      "부품 명세서(BOM)로 FTA 원산지 판정 (충족 못 하면 관세 5%)",
    ],
  },
  structure: {
    title: "수출은 현지 파트너와, 병원 공급은 파트너가 맡습니다",
    lead: "인도네시아에서는 AKL 등록사가 수입과 병원 공급을 맡습니다. 그래서 수출 계약과 현지 계약을 나눠 운영합니다.",
    label: "현재 거래 구조",
    actors: [
      { key: "maker", name: "한국 제조사", sub: "YOUNG-IN Biotech", roles: ["제조, 수출", "제품 설명, 시연, 교육"] },
      { key: "partner", name: "현지 파트너", sub: "PT Fisio Medika Indonesia (AKL 등록사)", roles: ["매입, 수입 신고", "병원 판매, 설치, A/S"] },
      { key: "hospital", name: "검토 병원 A", sub: "민간 재활, 정형 병원", roles: ["설치 환경 준비, 검수", "계약금, 잔금 지급"] },
    ],
    modes: {
      contract: { label: "계약", links: [{ from: "maker", to: "partner", text: "① 수출 매매 계약 (USD, EXW Seoul)" }, { from: "partner", to: "hospital", text: "② 현지 매매 계약 (IDR)" }], note: "제조사와 병원 사이에는 매매 계약이 없습니다. 병원에 줄 부가세 계산서는 현지 사업자인 파트너만 발행할 수 있습니다." },
      goods: { label: "제품 이동", links: [{ from: "maker", to: "partner", text: "서울에서 인도 (EXW), 항공 운송, 파트너가 수입 신고" }, { from: "partner", to: "hospital", text: "통관 후 병원에 설치" }], note: "수입자, 인보이스 구매자, 수하인은 모두 파트너입니다." },
      money: { label: "대금", links: [{ from: "partner", to: "maker", text: "T/T 100% 출하 전" }, { from: "hospital", to: "partner", text: "계약금 30%, 검수 후 잔금 70%" }], note: "파트너는 병원 잔금을 받기 전에 수출 대금을 먼저 냅니다. 이 사이에 필요한 자금은 가격, 수익성의 결제 흐름에서 계산합니다." },
      service: { label: "설치, 교육, A/S", links: [{ from: "maker", to: "partner", text: "제품 교육, 시연 지원" }, { from: "partner", to: "hospital", text: "설치, 사용자 교육, A/S, 부품 공급" }], note: "보증 기간과 범위는 회사 자료에 없어 계약에서 정해야 합니다." },
    },
  },
  user: { name: "김민영", team: "영인바이오텍 해외영업팀" },
  consult: {
    product: "IN-5300", chain: ["영인바이오텍", "현지 파트너", "재활병원 A"],
    mail: {
      from: "PT Fisio Medika Indonesia", fromTeam: "현지 영업팀", to: "영인바이오텍", toTeam: "해외영업팀",
      subject: "[견적 검토 요청] IN-5300 1세트 · 인도네시아 재활병원 A", hospital: "재활병원 A", sessions: 60,
      body: [
        "안녕하세요. 재활병원 A에서 IN-5300 한 세트의 견적을 요청했습니다.",
        "병원은 월 유료 시술을 약 60회로 예상하고 있습니다. 저희가 병원에 제시할 세금 포함 견적과, 이 조건에서 병원이 한 달에 몇 회 시술해야 비용을 충당할 수 있는지 검토 부탁드립니다.",
        "검토 결과를 보내주시면 저희가 병원에 안내하겠습니다.",
      ],
    },
    id: "in5300", name: "IN-5300 발표 기준안", link: "IN-5300 병원 도입 상담",
    title: "영인바이오텍 SuperStar+ IN-5300 | 인도네시아 병원 도입 상담",
    sub: "현지 등록사 PT Fisio Medika Indonesia를 통한 재판매 · 발표용 모의 거래",
    invest: 528086060, investNote: "부록 A8 값, 직접 입력", lifeMonths: 48, sessions: 60, price: 509000, variable: 39659, fixed: 11272667,
    src: "발표자료 12쪽·부록 A8~A9 기준. 수납액과 시술량은 상담용 가정",
    next: "병원에 최근 3개월 실제 회당 수납액과 월별 유료 시술 건수를 요청하세요.",
  },
  start: {
    image: mainUnit, imageAlt: "SuperStar+ IN-5300 본체 (카탈로그 이미지)",
    product: "SuperStar+ IN-5300",
    route: ["대한민국", "인도네시아"],
    partners: ["영인바이오텍", "PT FISIO MEDIKA INDONESIA"],
    facts: [
      { k: "판매 허가", v: "AKL 21403620119" },
      { k: "수입 세번", v: "HS 9018.90.31" },
      { k: "병원 손익분기", v: "월 48회" },
    ],
  },
  flow: {
    lead: "IN-5300 인도네시아 수출 1건, 세번부터 상업송장까지 한 화면 확인",
    hs: {
      task: "수출입 신고 품목번호 확정", result: "9018.90.31", sub: "인도네시아 수입 신고 8단위",
      chain: [["한국 수출 10단위", "9018.90-8900"], ["국제 공통 6단위", "9018.90"], ["인도네시아 8단위", "9018.90.31"]],
      note: "AI 후보 9018.90.30은 제목 줄이라 신고 불가, INSW 원문 대조로 .31 확정",
      src: "INSW 「HS 901890 세부 조회, 90189031 상세」 2026.11.4, 관세청 관세법령정보포털 「HS 해설서 9018호」",
    },
    tariff: {
      task: "수입 관세와 FTA 원산지 조건", result: "관세 0%", sub: "FTA 원산지 기준 충족 시 (미충족 시 MFN 5%)",
      rows: [["관세", "협정 0%, 미충족 시 MFN 5%"], ["적용 협정", "한-아세안, 한-인도네시아, RCEP"], ["수입 부가세 (PPN)", "11%"], ["법인세 선납 (PPh 22)", "2.5% (API 보유 수입자)"]],
      cond: "관세 0% 조건: ① 세번 변경(CTH) 또는 ② 역내부가가치 40% 이상, 판정 자료 영인바이오텍 부품 명세서(BOM)",
      src: "INSW 「90189031 상세, PMK 50/2026」 2026.11.4, 관세청 FTA 포털 「협정별 원산지결정기준 901890」 2026.11.17, PMK 131/2024, PMK 51/2025",
    },
    license: {
      task: "3개국 정부 등록 DB 직접 조회", result: "AKL 21403620119", sub: "Kelas C, 2030.10.1까지 유효",
      src: "인도네시아 보건부 e-Info Alkes 2026.11.5, 일본 PMDA 2026.11.6, 홍콩 위생서 MDACS 2026.11.8 조회",
    },
    structure: {
      task: "AKL 등록사인 현지 파트너 경유 공급", result: "파트너 재판매", sub: "수출 계약과 현지 판매 계약 분리",
      nodes: [
        { name: "영인바이오텍", role: "제조, 수출, 시연과 교육" },
        { name: "PT FISIO MEDIKA INDONESIA", role: "AKL 등록사, 수입, 병원 판매, A/S" },
        { name: "검토 병원 A", role: "민간 재활병원, 도입과 대금 지급" },
      ],
      src: "회사 견적 조건, e-Info Alkes 등록자 정보",
    },
    cases: [
      {
        id: "hs", subject: "[수정 요청] 상업송장 HS 코드 8단위 기재", from: "PT FISIO MEDIKA INDONESIA 수입 담당",
        ask: "INSW 사전 신고에서 HS 9018.90은 단위가 부족하다고 나옵니다. 인보이스를 8단위로 다시 보내 주세요.",
        steps: [
          { title: "한국 수출 신고 세번 확인", value: "9018.90-8900", detail: "한국 10단위, 앞 6단위 9018.90 공통", src: "영인바이오텍 수출 신고 세번" },
          { title: "인도네시아 8단위 확인", value: "9018.90.31", detail: "9018.90 아래 전기의료기기 갈래. 9018.90.30은 제목 줄이라 신고 불가", src: "INSW 「90189031 상세」 2026.11.4" },
          { title: "상업송장 HS 칸 수정", value: "9018.90 → 9018.90.31", action: { path: "exp.items.$0.hs", value: "9018.90.31", label: "인보이스에 반영", done: "상업송장, 견적서 HS 칸 9018.90.31" } },
          { title: "수정본 확인 후 회신", value: "상업송장 초안", detail: "HS 칸과 금액 재확인", link: { to: "/docs?doc=invoice", label: "상업송장 열기" } },
        ],
        reply: "HS를 인도네시아 8단위 9018.90.31로 고친 상업송장 수정본 송부. 한국 수출 신고 세번 9018.90-8900과 앞 6단위 동일.",
      },
      {
        id: "fta", subject: "[문의] FTA 관세 0% 적용 조건과 필요 서류", from: "PT FISIO MEDIKA INDONESIA 재무 담당",
        ask: "수입 관세가 5%로 잡혀 있는데, FTA로 0% 받을 수 있나요? 필요한 서류도 알려 주세요.",
        steps: [
          { title: "세율 확인", value: "MFN 5%, 협정 0%", detail: "9018.90.31 기준, 한-아세안, 한-인도네시아, RCEP 모두 0%", src: "INSW 「90189031 상세, PMK 50/2026」" },
          { title: "원산지 기준 확인", value: "세번 변경(CTH) 또는 역내부가가치 40%", detail: "세 협정 공통", src: "관세청 FTA 포털 「협정별 원산지결정기준 901890」 2026.11.17" },
          { title: "판정 자료와 증명서 확인", value: "부품 명세서(BOM), 원산지증명서", detail: "BOM 하나로 세 협정 함께 판정, 원산지증명서는 선적 전 발급 신청" },
          { title: "파트너 손익에 관세 0% 반영", value: "관세 5% → 0%", action: { path: "econ.dutyPct", value: "0", label: "관세 0% 적용", done: "파트너 마진 계산의 관세 0%" }, link: { to: "/price?tab=deal", label: "파트너 마진 보기" } },
        ],
        reply: "원산지 기준(CTH 또는 RVC 40%) 충족 시 세 협정 모두 관세 0%. 영인바이오텍 BOM으로 판정 후 선적 전 원산지증명서 발급 예정. 수입 부가세 11%, PPh 22 2.5%는 별도.",
      },
      {
        id: "akl", subject: "[문의] 인도네시아 판매 허가 번호와 유효기간", from: "검토 병원 A 구매팀 (파트너 영업 경유)",
        ask: "이 장비, 인도네시아에서 판매 허가 받은 제품인가요? 등록 번호와 유효기간을 알려 주세요.",
        steps: [
          { title: "보건부 등록 DB 조회", value: "AKL 21403620119", detail: "Kelas C, 상태 Berlaku(유효)", src: "인도네시아 보건부 e-Info Alkes 2026.11.5 조회" },
          { title: "유효기간 확인", value: "2030.10.1까지", detail: "발급 2026.3.27" },
          { title: "등록사와 공급 경로 확인", value: "PT FISIO MEDIKA INDONESIA", detail: "AKL 등록사가 수입과 병원 판매 담당" },
        ],
        reply: "IN-5300은 인도네시아 보건부 등록 제품. AKL 21403620119 (Kelas C), 2030.10.1까지 유효, 등록사 PT FISIO MEDIKA INDONESIA가 수입과 공급 담당.",
      },
      {
        id: "bep", subject: "[문의] 월 손익분기 시술 횟수", from: "검토 병원 A 원장 (파트너 영업 경유)",
        ask: "한 달에 몇 번 시술해야 손해가 안 나나요? 우리 병원은 월 60회 정도 예상합니다.",
        steps: [
          { title: "병원 도입가 확인", value: "Rp528,090,000", detail: "부가세 11% 포함, 48개월 배분", src: "사업계획서 부록 A8" },
          { title: "회당 실수납과 비용 확인", value: "Rp509,000", detail: "치료사, 유지관리, 공간비 월 Rp11,272,667", src: "RS Permata 2026 공개 판촉가, Jobstreet, 스마랑군 표준단가" },
          { title: "손익분기 확인", value: "월 48회", detail: "장비 대금 48개월 배분 기준" },
          { title: "병원 예상 시술 수 입력", value: "월 60회", action: { path: "econ.hospital.sessions", value: "60", label: "60회 입력", done: "05 병원 수익성 월 60회" } },
        ],
        reply: "장비 대금을 48개월로 배분한 월 손익분기점은 유료 시술 48회. 월 60회 예상이면 48회를 넘는 12회분만큼 월 이익 발생 (아래 05 병원 수익성 그래프).",
      },
    ],
    profit: { src: "회당 Rp509,000 RS Permata 2026 공개 판촉가, 물리치료사 Jobstreet 공고 중간값, 전력 PLN B-2, 도입가 사업계획서 부록 A8" },
  },
  footer: { project: "영인 파트너 데스크, 영인바이오텍 해외영업팀과 PT FISIO MEDIKA INDONESIA 공용", lines: ["영인바이오텍 해외영업팀과 PT FISIO MEDIKA INDONESIA가 병원 영업, 견적, 선적 서류를 함께 보는 화면입니다."] },
  notes: {
    hospital: {
      title: "사업계획서의 '월 48회'와 이 화면 숫자가 다른 이유",
      body: "사업계획서 부록 A9는 장비 도입가를 48개월로 나눈 상각비(월 약 Rp1,100만)를 월 고정비에 넣어 손익분기 48회를 구했어요. 여기서는 도입비를 초기 투자로 한 번만 넣고 월 비용에서는 뺐기 때문에, 운영 손익분기는 고정비(치료사, 유지관리, 공간)만으로 계산하고 회수기간을 따로 보여 줘요. 같은 입력이면 월 48회에서 단순 회수 약 47개월이에요.",
    },
    partner: "사업계획서 부록 A8의 예상이익 Rp95,150,641과 조금 다른 것은, 사업계획서가 관세에 세관 고시 환율(Rp18,141)을 쓰고 판매가를 반올림 전 값으로 계산했기 때문이에요.",
  },
};

const ev = (field, title, ref, asOf, checkedAt, supports, status, confirmed = false) => ({ id: id(), field, title, ref, asOf, checkedAt, supports, status, confirmed });

export function sampleDeal() {
  const d = blankDeal();
  d.kind = "sample";
  d.sampleKey = PACK.sampleKey;
  d.caseLabel = "진행 중 거래";
  d.meta = { ...d.meta, name: "IN-5300 1세트, PT FISIO MEDIKA INDONESIA, 검토 병원 A", no: "ID-2026-001", date: "2026-11-02", stage: "invoice" };
  d.parties.maker = { name: "YOUNG-IN Biotech Co., Ltd.", address: "Seoul, Korea", contact: "", email: "", phone: "" };
  d.parties.partner = { name: "PT Fisio Medika Indonesia", address: "Jakarta area, Indonesia", contact: "", email: "", phone: "" };
  d.parties.hospital = { name: "Hospital A (under review)", address: "", contact: "", email: "", phone: "" };
  d.counterpart = { requests: "", agreements: "Partner imports as AKL holder (AKL 21403620119) and resells to the hospital; the manufacturer supports demo and training." };
  d.exp = {
    ...d.exp, currency: "USD",
    items: [{ id: id(), kind: "main", model: "SuperStar+ IN-5300", desc: "ESWT system with L25 linear-focused and F40 point-focused handpieces, gel pad set", qty: "1", unit: "set", price: "", priceSource: "공개판 제외", hs: "9018.90" }],
    extras: [], incoterm: "EXW", place: "Seoul, Korea", incotermVersion: "2020", transport: "air",
    exportClearance: "export clearance by seller's broker on buyer's behalf",
    payment: [{ id: id(), label: "T/T in advance", pct: "100", amount: "", due: "before shipment" }],
    leadTime: "", validityDays: "30",
    quoteNo: "SAMPLE-Q-001", quoteDate: "2026-11-02", invoiceNo: "SAMPLE-CI-001", invoiceDate: "2026-11-30",
    origin: "Republic of Korea", destination: "Jakarta, Indonesia",
    packages: "", packageUnit: "CTN", packing: "Export carton with foam, ISPM-15 pallet",
    nw: "", nwUnit: "kg", gw: "", gwUnit: "kg", weightBasis: "total", /* 포장 수량, N.W., G.W.는 포장 후 실측 (발표자료 19쪽). 23 kg는 카탈로그 본체 무게라 포장 중량 근거 아님 */ remarks: "Trolley not included. HS 9018.90.31 in Indonesia, AKL No. 21403620119.",
  };
  d.local = {
    ...d.local, enabled: true, currency: "IDR", priceBasis: "mock",
    lines: [{ id: id(), desc: "SuperStar+ IN-5300 ESWT system, installation and training included", qty: "1", unit: "set", price: "475756757" }],
    vatPct: "11", vatIncluded: "no",
    payment: [
      { id: id(), label: "Deposit on contract", pct: "30", amount: "", due: "on contract" },
      { id: id(), label: "Balance after acceptance", pct: "70", amount: "", due: "after installation and acceptance" },
    ],
    quoteNo: "SAMPLE-LQ-001", quoteDate: "2026-11-02", validityDays: "30", delivery: "after deposit, subject to import release", acceptance: "after installation and training",
  };
  d.service = { install: "on-site installation at the hospital", installBy: "PT Fisio Medika Indonesia", training: "clinical demo and operator training", trainingBy: "YOUNG-IN Biotech Co., Ltd.", warranty: "", asBy: "PT Fisio Medika Indonesia", notes: "" };
  d.email = { ...d.email, senderName: "", senderTitle: "", senderEmail: "", subject: "Quotation SAMPLE-Q-001: SuperStar+ IN-5300", senderOrg: "YOUNG-IN Biotech Co., Ltd." };

  const cost = (label, amount, currency, basis, inCif, when, note) => ({ id: id(), label, amount, currency, basis, included: true, inCif, when, note });
  const hv = (label, amount, basis, note) => ({ id: id(), label, amount, basis, note });
  d.econ = {
    fx: { rate: "18130", date: "2026-11-06", source: "인도네시아 중앙은행(BI) 기준 환율" },
    dutyPct: "5", dutyBasis: "MFN 5% (INSW, PMK 50/2026). 원산지 요건을 충족하면 FTA 0%", importVatPct: "11", pph22Pct: "2.5",
    costs: [
      cost("한국 수출 업무 (통관 대행 등)", "300", "USD", "team", true, "before-ship", "팀 가정값"),
      cost("적하 보험", "48", "USD", "team", true, "before-ship", "팀 가정값"),
      cost("항공 운임", "2701.66", "USD", "official", true, "before-ship", "FedEx IDF 2026 Zone C 요율로 팀 계산"),
      cost("현지 비용 (물류, 설치, 교육, 영업, 보증)", "14000000", "IDR", "team", false, "install", "단일 예산 가정값"),
      cost("금융비 (잔금 전 부족액 × 9% × 60/365)", "3953236", "IDR", "team", false, "finance", "팀 계산값. 일정, 금액이 바뀌면 다시 계산해야 함"),
    ],
    hospital: {
      investMode: "local", investCustom: "",
      price: "509000", priceKind: "public-promo", priceSource: "RS Permata 2026 공개 판촉가 (실제 수납액이 아님)",
      sessions: "48", workDays: "24", horizon: "60",
      variable: [hv("의사 수당", "35000", "team", "팀 가정값"), hv("소모품", "4500", "team", "팀 가정값"), hv("전력", "159", "official", "220 VA × 30분 × PLN B-2 Rp1,444.70/kWh")],
      fixed: [hv("전담 물리치료사", "7000000", "official", "Jobstreet 자카르타 채용 공고 중간값"), hv("유지관리", "2472667", "official", "스마랑군 2026 공공 표준단가 연 29,672,000 ÷ 12. IN-5300 실제 유지비 아님"), hv("공간, 공통비", "1800000", "team", "배부 가정값")],
    },
    scenarios: [
      { id: id(), label: "보수", price: "407200", sessions: "40", note: "수납액 20% 감소 가정, 시술 40회" },
      { id: id(), label: "기준", price: "509000", sessions: "48", note: "공개 판촉가, 시술 48회" },
      { id: id(), label: "낙관", price: "577000", sessions: "60", note: "민간 7곳 게시가 중앙값, 시술 60회" },
    ],
  };
  d.evidence = [
    ev("product", "제품 사양과 사진", "YOUNG-IN High-End Catalog ENG (2604)", "2026.04", "2026-11-22", "핸드피스 라인업(L25, F25, F40, FS60), 220 VA, 본체 23 kg", "company", true),
    ev("product", "국내 허가 3등급 (제허 23-673호)", "식약처 의료기기 전자민원 조회", "2023-06-16", "2026-11-08", "사용 목적: 압전 충격파 근골격계 통증 완화", "official", true),
    ev("registration", "인도네시아 의료기기 등록 AKL 21403620119 (Kelas C)", "Kemenkes e-Info Alkes", "발급 2026-03-27, 만료 2030-10-01", "2026-11-05", "등록자 PT. FISIO MEDIKA INDONESIA, 상태 Berlaku(유효)", "official", true),
    ev("registration", "일본 PMDA 승인 검색", "PMDA 일반명 体外衝撃波疼痛治療装置 승인 검색", "", "2026-11-06", "승인 7건에 IN-5300 없음 (조회한 일반명 범위)", "official", true),
    ev("registration", "홍콩 MDACS 등재 검색", "Department of Health MDACS 'shock wave' 유효 등재 목록", "", "2026-11-08", "유효 27건에 IN-5300 없음. 등재는 자율 제도", "official", true),
    ev("market", "한국산 수입 비중, 수입액 (HS 9018.90)", "KOTRA 무역투자빅데이터(TriBIG)", "2025", "", "3국 비교 수치. ESWT만의 수치가 아님", "official", true),
    ev("market", "인도네시아 병원 3,235곳 중 민간 1,998곳", "인도네시아 보건부 LAKIP 2025", "2025.6.30", "", "병원 수 기준, 구매 의향이 아님", "official", true),
    ev("parties.partner", "파트너 영문 주소", "Kemenkes e-Info Alkes 등록자 정보", "", "2026-11-05", "인보이스 Buyer 주소", "official", false),
    ev("tariff", "인도네시아 세번 9018.90.31과 MFN 5%", "INSW 90189031 상세 (PMK 50/2026)", "", "2026-11-04", "관세율, 협정세율 0%(원산지 충족 시)", "official", true),
    ev("tariff", "수입 부가세 11%, PPh 22 2.5%", "PMK 131/2024, PMK 51/2025", "", "", "PPN은 매입세액 공제, PPh 22는 법인세 선납으로 보고 파트너 손익에서 제외", "official", false),
    ev("tariff", "의료서비스 PPN 면제 → 병원은 장비 매입 PPN 공제 불가", "PP 49/2022 제10조, 제11조 (DDTC 해설)", "2022", "", "병원 초기 도입비를 부가세 포함 금액으로 봄 (팀 해석)", "official", false),
    ev("econ.fx", "환율 Rp18,130 / USD", "인도네시아 중앙은행(BI) 기준 환율", "2026-11-06", "2026-11-06", "수출 대금과 운임을 현지 통화로 환산", "official", true),
    ev("local.lines", "현지 판매가 IDR 475,756,757 + PPN 11%", "팀 계산 (사업계획서 부록 A8, 이익률 20% 가정)", "", "", "파트너가 준 값이 아닌 팀 내부 가격", "team", false),
    ev("econ.hospital.price", "회당 수납 Rp509,000", "RS Permata ESWT 판촉가 2026", "2026", "", "공개 판촉가를 수납액으로 가정. 실제 수납액은 병원 확인 필요", "official", false),
    ev("econ.hospital.price", "민간 게시가 중앙값 Rp577,000", "Alodokter 민간 7곳", "", "2026-11-08", "낙관 시나리오 수납액", "official", false),
    ev("econ.hospital.fixed", "물리치료사 월 Rp7,000,000", "Jobstreet 자카르타 물리치료사 채용 공고", "", "2026-11-10", "공고 중간값, 시장 평균임금 아님", "official", false),
    ev("econ.hospital.fixed", "유지관리 월 Rp2,472,667", "스마랑군(Kab. Semarang) 2026 표준단가", "2026", "", "공공 표준단가. IN-5300 실제 유지비 아님", "official", false),
    ev("econ.hospital.variable", "전력 회당 Rp159", "PLN B-2 요금 Rp1,444.70/kWh (2026.10), 카탈로그 220 VA", "2026.10", "", "220 VA × 30분 기준", "official", false),
    ev("structure", "거래 구조: 제조사 → 파트너 수출, 파트너 → 병원 재판매", "사업계획서 11쪽 거래 구조", "", "", "수출 계약과 현지 재판매 계약을 나눠 운영", "team", false),
  ];
  d.baseline = snapshot(d);
  return sanitize(d);
}

/* 병원 도입 검토 (2026-11-22 추가). 값마다 출처 구분. 덱 수정60, 113–115 기준 숫자 */
PACK.review = {
  label: "IN-5300 표준 제안 조건",
  sampleName: "검토 병원 A (민간 재활병원)",
  device: { name: "체외충격파 치료기", nameId: "alat terapi gelombang kejut (ESWT)", model: "SuperStar+ IN-5300" },
  defaults: {
    device: { price: "528090000", lifeMonths: "48" },
    pay: { mode: "cash", depositPct: "30" },
    rev: { price: "509000" },
    demand: { mode: "sessions", sessions: "48", newPatients: "16", course: "3" },
    vc: { docFee: "35000", consumable: "4500", va: "220", powerMin: "30", tariff: "1444.70", hpCost: "", hpLife: "", shots: "2000" },
    fixed: [
      { id: "therapist", label: "전담 물리치료사", labelId: "Fisioterapis", amount: "7000000" },
      { id: "maint", label: "유지관리", labelId: "Pemeliharaan", amount: "2472667" },
      { id: "space", label: "공간과 공통비", labelId: "Ruang & overhead", amount: "1800000" },
    ],
  },
  sources: {
    "device.price": { basis: "team", src: "팀 계산 병원 도입가: 파트너 판매가 Rp475,756,757 + PPN 11% (사업계획서 부록 A8, 파트너 이익률 20% 가정)", note: "파트너가 병원에 낸 공식 견적가로 바꿔 넣을 것. 병원은 매입 부가세 공제 불가 (PP 49/2022)" },
    "device.lifeMonths": { basis: "team", src: "사업계획서 12쪽 기준: 장비 대금을 48개월로 배분", note: "이 값이면 손익분기 48회가 사업계획서와 같게 나옵니다" },
    "pay.depositPct": { basis: "team", src: "사업계획서 거래구조: 병원 계약금 30% 후 발주, 검수 후 잔금 70%", note: "표준 제안 조건. 병원별 계약에서 확정" },
    "rev.price": { basis: "official", src: "RS Permata ESWT 공개 판촉가 2026 (2026.1.1–12.31)", url: "https://www.rspermata.co.id/promo/details/promo-tindakan-eswt-extracorporeal-shock-wave-therapy", asOf: "2026", note: "판촉가를 실수납액으로 가정. 회수, 구성 미표시" },
    "demand.sessions": { basis: "team", src: "사업계획서 기준 시술량 (손익분기와 같은 48회)", note: "병원의 월 유료 시술 수로 바꿔 넣을 것" },
    "demand.newPatients": { basis: "team", src: "신규 환자 16명 × 코스 3회 = 48회" },
    "demand.course": { basis: "official", src: "1코스 주 1회 × 3–4회, 2,000발 (Vahdatpour, J Res Med Sci 2012; Dewi, DIMENSI 2023 Poltekkes Jakarta III)", note: "적응증, 의사 판단에 따라 다름" },
    "vc.docFee": { basis: "team", src: "팀 가정값 (사업계획서 부록 A13)", note: "병원의 jasa medis 배분 규칙으로 바꿔 넣을 것" },
    "vc.consumable": { basis: "team", src: "팀 가정값: 젤 등 (사업계획서 부록 A13)" },
    "vc.va": { basis: "company", src: "IN-5300 카탈로그 사양표: AC 220–230 V, 220 VA", asOf: "2026.04" },
    "vc.hpCost": { basis: "missing", src: "IN-5300 핸드피스 교체 가격: 회사 자료 없음", note: "제조사 확인 필요. 참고로 다른 압전 제품 치료원은 500만 발/2년 (PiezoWave² 자료)" },
    "vc.hpLife": { basis: "missing", src: "IN-5300 핸드피스 수명(발): 회사 자료 없음", note: "제조사 확인 필요" },
    "vc.shots": { basis: "official", src: "회당 2,000발 (Vahdatpour 2012; Dewi 2023)" },
    "fixed.therapist": { basis: "official", src: "Jobstreet 자카르타 물리치료사 채용 공고 중간값 Rp7,000,000 (2026-11-10 조회)", note: "공고 중간값, 평균임금 아님. 대도시 민간 범위 Rp6–12백만 (UNPRI 2026.4.27)" },
    "fixed.maint": { basis: "official", src: "스마랑군(Kab. Semarang) 2026 공공 표준단가 연 Rp29,672,000 ÷ 12", note: "IN-5300 실제 유지비 아님. 보증, 유지보수 계약으로 바꿔 넣을 것" },
    "fixed.space": { basis: "team", src: "팀 배부 가정값 (사업계획서 부록 A13)" },
  },
  benchmarks: [
    { label: "RS Permata 판촉가 (2026)", value: 509000, src: "RS Permata 2026 공개 판촉가", url: "https://www.rspermata.co.id/promo/details/promo-tindakan-eswt-extracorporeal-shock-wave-therapy" },
    { label: "민간병원 7곳 게시가 중앙값", value: 577000, src: "Alodokter 민간병원 7곳 게시가 (2026-11-08 조회, 범위 Rp40만–75만)", url: "https://www.alodokter.com/cari-rumah-sakit/neurologi/extracorporeal-shock-wave-therapy-eswt" },
    { label: "Physio Medical 클리닉 정가", value: 400000, src: "HDmall Physio Medical Clinic (할인가 Rp361,000)", url: "https://hdmall.id/fisioterapi/shockwave-therapy-terapi-shockwave-di-physio-medical-clinic" },
  ],
  facts: [
    { ko: "인도네시아 의료기기 등록 AKL 21403620119, Kelas C, 2030-10-01까지 유효, 등록사 PT. FISIO MEDIKA INDONESIA (e-Info Alkes, 2026-11-05 조회)", id: "Izin edar: AKL 21403620119 (Kelas C), berlaku s.d. 1 Oktober 2030, terdaftar atas nama PT Fisio Medika Indonesia (e-Info Alkes Kemenkes)." },
  ],
  faq: {
    izin: { id: "Ya. SuperStar+ IN-5300 terdaftar di Kemenkes dengan izin edar AKL 21403620119 (Kelas C), berlaku sampai 1 Oktober 2030, atas nama PT Fisio Medika Indonesia. Data dapat dicek di e-Info Alkes. Di Korea, alat ini disetujui MFDS sebagai alat kesehatan kelas 3 (2023).", ko: "네. AKL 21403620119 (Kelas C), 2030년 10월 1일까지 유효, 등록사 PT Fisio Medika Indonesia예요. 보건부 e-Info Alkes에서 확인할 수 있어요. 한국 식약처 3등급 허가(2023)도 있어요." },
    servis: { id: "Instalasi, pelatihan operator, dan servis purna jual ditangani PT Fisio Medika Indonesia sebagai pemegang izin edar; pabrikan mendukung demo dan pelatihan klinis. Masa dan cakupan garansi akan ditetapkan dalam kontrak.", ko: "설치, 사용자 교육, A/S는 등록사인 PT Fisio Medika Indonesia가 맡고, 제조사는 시연과 임상 교육을 지원해요. 보증 기간과 범위는 계약에서 정해요 (회사 자료에 아직 없음)." },
  },
};
