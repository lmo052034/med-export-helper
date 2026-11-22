/* 업무 현황판의 병원과 할 일, 그리고 할 일마다 여는 세부 내용.
   병원, 사람, 일정은 화면 구성용 샘플이고, 절차와 규정은 아래 REFS의 공개 실무 자료를 따릅니다.
   팩마다 이름(n)만 바꿔 씁니다. 공개판에는 회사명, 제품명, 단가를 넣지 않습니다 */

export const REFS = {
  insw: ["INSW 인도네시아 국가 단일창구 (수입 신고, 허가 조회)", "https://intr.insw.go.id/"],
  emerhubCustoms: ["Emerhub, 외국 기업의 인도네시아 수입 신고 (PIB, 관세 CIF 기준, 검사 경로)", "https://emerhub.com/indonesia/indonesia-customs-declaration-as-a-foreign-business/"],
  emerhubReg: ["Emerhub, 인도네시아 의료기기 등록 (AKL, 현지 등록 보유자)", "https://emerhub.com/indonesia/medical-devices-registration-indonesia/"],
  emerhubLabel: ["Emerhub, 인도네시아 의료기기 표시 (인도네시아어 표시, AKL 번호)", "https://emerhub.com/indonesia/guide-to-medical-device-labeling-in-indonesia/"],
  pmk62: ["Permenkes 62/2017 의료기기 유통 허가 (영문 번역본)", "https://peraturan.go.id/files2/permenkes-no-62-tahun-2017_terjemah.pdf"],
  idak: ["RAPath, 인도네시아 의료기기 유통업 허가 IDAK와 CDAKB", "https://rapath.github.io/id/market-access/idak-distribution-licence/"],
  ftaId: ["indonesia.go.id, FTA 특혜 관세와 원산지증명서 원본 제출 기한", "https://indonesia.go.id/kategori/trade/766/free-trade-agreement-fta-preferential-tariff?lang=2"],
  jetroAk: ["JETRO, 한-아세안 FTA 통관 절차표 (2011.12, 오래된 자료)", "https://www.jetro.go.jp/ext_images/theme/wto-fta/procedure/pdf/akfta_customs_clearance.pdf"],
  kcsFta: ["관세청 FTA 한눈에 보기 (협정별 원산지증명서 유효기간)", "https://www.customs.go.kr/upload/winPop/pop_easyFta.html"],
  kcciAk: ["구미상공회의소, FTA 원산지 발급 실무 아세안 편 (2024)", "https://gumicci.korcham.net/file/dext5uploaddata/2024/FTA원산지 발급실무-아세안 집중 공략편 교육(발송).pdf"],
  tradlinx: ["트레드링스, 수출신고필증 보는 법 (적재 30일, 결제금액 칸)", "https://www.tradlinx.com/blog/guide/%EC%88%98%EC%B6%9C%EC%8B%A0%EA%B3%A0%ED%95%84%EC%A6%9D-%EC%88%98%EC%B6%9C%EB%A9%B4%EC%9E%A5-%EB%B3%B4%EB%8A%94-%EB%B2%95/"],
  fedexExport: ["FedEx 수출 통관 안내 (한국어)", "https://fedex.com/content/dam/fedex/apac-asia-pacific/downloads/fedex-export-clearance-guideline-ko-kr.pdf"],
  awb: ["GoFreight, 항공화물운송장(AWB) 항목과 과금 중량", "https://gofreight.com/blog/education/air-waybill.html"],
  iataEawb: ["IATA, e-AWB 처리 지침", "https://www.iata.org/contentassets/b559d10aeb734d5196332b4953dcf312/e-awb-handling-guidelines-sg.pdf"],
  iccExw: ["ICC Academy, Incoterms 2020 EXW와 FCA 중 무엇을 쓸까", "https://academy.iccwbo.org/incoterms/article/incoterms-2020-exw-or-fca/"],
  tradeInco: ["미국 상무부 trade.gov, Know Your Incoterms", "https://trade.gov/know-your-incoterms"],
  kep1366: ["Kepmenkes HK.01.07/MENKES/1366/2024 (BPJS 환자 추가 비용 규정)", "https://jdih.kemkes.go.id/storage/documents/pdfs/2024kepmenkes1366.pdf"],
  bpjsPhysio: ["JawaPos, BPJS 물리치료 주 2회 제한 규정과 물리치료사협회 반발 (2018.7)", "https://www.jawapos.com/humaniora/1807270200/batasi-layanan-ikatan-fisioterapi-protes-aturan-baru-bpjs"],
  cermati: ["Cermati, 인도네시아 병원, 클리닉 물리치료 가격 (2024)", "https://www.cermati.com/artikel/harga-fisioterapi"],
  bast: ["보건부 물품 인수인계서(BAST) 서식 예시", "https://ppid.kemkes.go.id/wp-content/uploads/2025/10/BAST-1.pdf"],
  pm54: ["Permenkes 54/2015 의료기기 시험, 교정 (설치 후 점검 근거)", "https://peraturan.bpk.go.id/Download/107180/Permenkes%20Nomor%2054%20Tahun%202015.pdf"],
  svcReport: ["SafetyCulture, 의료기기 서비스 보고서 서식 (일련번호, 증상, 조치)", "https://safetyculture.com/library/health-care/service-report-ajhoa1ouqiky8e1v"],
  pmChecklist: ["Process Street, 의료기기 예방 점검 체크리스트", "https://www.process.st/templates/medical-equipment-preventive-maintenance-checklist/"],
  klip: ["Klipboard, 의료기기 예방 점검 체크리스트 만드는 법", "https://klipboard.io/how-to-create-a-medical-equipment-preventive-maintenance-checklist/"],
  demoTrial: ["Medindexer, 시연과 시험 사용 기간에 확인할 것 (2026.4)", "https://www.medindexer.com/knowledge/demo-and-trial-periods-what-to-test-before-signing"],
  uwDemo: ["워싱턴대, 시연, 대여 장비 반입 절차", "https://finance.uw.edu/fm/ps/sites/default/files/purchasing/policies-and-procedures/Section7/7.3.16DemoLoanedEquipment.pdf"],
  upstateDemo: ["SUNY Upstate, 장비 시연, 시험 사용 승인서 서식", "https://www.upstate.edu/materials/pdf/appendix_a_auth_equipment_demo_trial_loan.pdf"],
  mddiHospital: ["MDDI, 병원에 장비를 들이는 방법 (구매위원회, 평가)", "https://www.mddionline.com/business/tips-for-getting-your-device-into-a-hospital"],
  pipedrive: ["Pipedrive, 거래 상세 화면 (단계 진행, 요약, 기록 탭)", "https://support.pipedrive.com/article/deal-detail-view"],
  pipedriveAct: ["Pipedrive, 활동(다음 할 일과 기한)", "https://support.pipedrive.com/hc/en/articles/207344415-Activities"],
  hubspot: ["HubSpot, 레코드 화면 (정보, 활동 기록, 연결 항목, 첨부)", "https://knowledge.hubspot.com/records/work-with-records?fs=e"],
  zendesk: ["Zendesk, 티켓 항목 (요청자, 담당자, 상태, 우선순위, 기한)", "https://support.zendesk.com/hc/en-us/articles/4408886739098-About-ticket-fields"],
  jiraCrm: ["Atlassian, Jira로 영업 업무 관리하기 (기한, 연결 이슈)", "https://community.atlassian.com/t5/App-Central-articles/Using-Jira-for-Sales-and-CRM-A-Practical-Guide/ba-p/3081134"],
  sfPrm: ["Salesforce, 파트너 관계 관리(PRM) 화면", "https://salesforce.com/sales/partner-relationship-management"],
  sterisHistory: ["STERIS, 장비 서비스 이력 화면", "https://sterishelpdesk.freshdesk.com/support/solutions/articles/44002516680-equipment-device-data-screen-service-history-tab-"],
  flexport: ["Flexport, 선적 단계 표시", "https://support.portal.flexport.com/hc/en-us/articles/16645987392151"],
};

const ref = (...keys) => keys.map((k) => ({ label: REFS[k][0], url: REFS[k][1] }));

/* n: 팩마다 다른 이름
   hq 본사 담당 표기, sales 현지 영업 표기, tech 현지 기술 표기, demoTeam 시연 담당 표기,
   hqOrg, ptOrg 회사 표기, device 장비 이름, hpA, hpB 핸드피스 이름, hpCompare 스포츠클리닉 다음 할 일 */
export function makeDesk(n) {
  const hospitals = [
    {
      id: "h-a", name: "민간병원 A", city: "자카르타 남부", stage: "시연", owner: n.sales, next: `${n.device} 원내 시연, 재활의학과 치료사 2명 참석`, due: "11.27",
      detail: {
        type: "민간 종합병원, 재활의학과 외래", beds: "병상 약 150개 (병원 소개 자료 기준)",
        contact: [{ name: "dr. Rina", role: "재활의학과 과장 (Sp.KFR)", channel: "WhatsApp, 진료 끝난 뒤 16시 이후" }, { name: "Andi", role: "구매팀 담당", channel: "이메일, 견적과 계약 서류 담당" }],
        why: "기존 물리치료 장비가 오래돼 교체를 검토 중. 자비 환자 비중이 높아 시술 단가를 받을 수 있는 장비를 찾음.",
        log: [["11.06", n.sales, "첫 방문, 재활의학과 과장 면담. 장비 소개 자료 전달"], ["11.13", n.sales, "과장이 손익 자료 요청. 병원 제안 화면으로 도입 검토서 작성해 전달"], ["11.19", n.sales, "원내 시연 일정 11.27 10:00 확정, 치료사 2명 참석"], ["11.21", "dr. Rina", "BPJS 환자에게도 쓸 수 있는지 질문 (메일)"]],
      },
    },
    {
      id: "h-b", name: "재활클리닉 B", city: "반둥", stage: "견적 발송", owner: n.sales, next: "견적 회신 확인 (11.18 발송)", due: "11.25",
      detail: {
        type: "개인 재활클리닉, 치료실 4개", beds: "외래 전용",
        contact: [{ name: "dr. Hendra", role: "원장 겸 대표", channel: "전화, 오전 진료 전 8시대" }],
        why: "스포츠 손상, 만성 통증 자비 환자 위주. 원장이 직접 결정.",
        log: [["10.30", n.sales, "학회 부스에서 명함 교환"], ["11.11", n.sales, "클리닉 방문 시연 (휴대용 시연 장비)"], ["11.18", n.sales, "일시불 견적 발송, 유효기간 30일"], ["11.21", n.sales, "1차 연락, 회신 없음"]],
      },
    },
    {
      id: "h-c", name: "종합병원 C 재활의학과", city: "탕그랑", stage: "계약 협의", owner: n.hq, next: "계약금 30%, 납기 조건 협의", due: "11.29",
      detail: {
        type: "민간 종합병원 그룹 소속 병원", beds: "병상 약 300개 (병원 소개 자료 기준)",
        contact: [{ name: "Ibu Sari", role: "구매 부장", channel: "이메일, 회의는 화상" }, { name: "dr. Bayu", role: "재활의학과 과장", channel: "현지 영업 통해 연락" }],
        why: "그룹 본부 구매 승인을 거쳐야 함. 계약금 비율과 설치일이 쟁점.",
        log: [["10.22", n.sales, "재활의학과 시연, 과장 긍정 평가"], ["11.05", n.sales, "견적 발송"], ["11.17", "Ibu Sari", "계약금 20%로 낮추고 설치일을 계약서에 확정해 달라는 요청"], ["11.20", n.hq, "본사와 조건 검토 시작 (수출 납기, 선금 조건)"]],
      },
    },
    {
      id: "h-d", name: "정형외과 병원 D", city: "수라바야", stage: "견적 발송", owner: n.sales, next: "할부 36개월 조건으로 수정 견적", due: "11.24",
      detail: {
        type: "정형외과 전문병원", beds: "병상 약 80개",
        contact: [{ name: "dr. Agus", role: "원장 (Sp.OT)", channel: "WhatsApp" }, { name: "Ibu Maya", role: "재무 담당", channel: "이메일" }],
        why: "일시불 견적을 받고 월 납입 부담을 줄이고 싶다며 36개월 할부 견적을 요청.",
        log: [["11.04", n.sales, "원장 면담, 수술 후 재활 환자 수 확인"], ["11.12", n.sales, "일시불 견적 발송"], ["11.20", "Ibu Maya", "36개월 할부 조건 견적 요청 (메일)"]],
      },
    },
    {
      id: "h-e", name: "스포츠클리닉 E", city: "족자카르타", stage: "문의", owner: n.sales, next: n.hpCompare, due: "12.02",
      detail: {
        type: "스포츠의학 클리닉", beds: "외래 전용",
        contact: [{ name: "dr. Dimas", role: "원장", channel: "Instagram 메시지로 첫 문의, 이후 WhatsApp" }],
        why: "선수 환자가 많아 짧은 치료 시간을 중시. 핸드피스 종류를 먼저 비교하고 싶어 함.",
        log: [["11.18", "dr. Dimas", "온라인 문의"], ["11.20", n.sales, "통화, 비교 자료 요청 받음"]],
      },
    },
    {
      id: "h-f", name: "민간병원 F", city: "브카시", stage: "문의", owner: n.sales, next: "첫 방문, 담당 원장 면담", due: "12.04",
      detail: {
        type: "민간 종합병원", beds: "병상 약 120개",
        contact: [{ name: "dr. Lestari", role: "재활의학과 전문의", channel: "병원 대표 번호로 예약" }],
        why: "기존 거래 병원 소개로 연결.",
        log: [["11.21", n.sales, "소개받은 병원에 면담 요청, 12.04 확정"]],
      },
    },
  ];

  const tasks = [
    {
      id: "t-quote-d", kind: "quote", hospital: "h-d", title: "정형외과 병원 D 수정 견적 발송", owner: n.sales, meta: "할부 36개월", due: "11.24", sort: 1,
      detail: {
        status: "작성 중", priority: "높음", opened: "11.20",
        summary: "병원 D가 일시불 견적 대신 36개월 할부 조건의 견적을 다시 달라고 했습니다. 월 납입금과 총액이 바뀌므로 병원 손익도 같은 조건으로 다시 보여 줘야 합니다.",
        background: [
          "11.12에 일시불 견적을 보냈고, 11.20 재무 담당이 '월 부담을 줄이고 싶다'며 36개월 할부 견적을 메일로 요청했습니다.",
          "할부는 파트너가 대금을 나눠 받는 구조라 금융비가 붙습니다. 월 납입금이 시술 수익보다 작은지 원장이 가장 먼저 봅니다.",
          "병원은 장비 매입 부가세를 공제받지 못하므로 견적 총액은 부가세 포함 금액으로 비교합니다.",
        ],
        facts: [["요청 조건", "36개월 할부, 계약금 30%"], ["기존 견적", "11.12 일시불, 유효 30일"], ["금액 기준", "수익성 화면의 병원 도입가와 금리"], ["받는 사람", "재무 담당 (원장 참조)"]],
        steps: [
          ["수익성 화면에서 결제 방식을 할부 36개월로 바꿔 월 납입금 확인", true],
          ["금리, 계약금 비율을 파트너 재무 기준과 맞추기", false],
          ["병원 제안 화면에서 같은 조건으로 도입 검토서 다시 만들기", false],
          ["견적서 번호를 새로 매기고 기존 견적과 차이를 한 줄로 적기", false],
          ["재무 담당에게 발송, 원장 참조", false],
        ],
        docs: [["수정 견적서 (할부 36개월)", "작성 중", "/price"], ["병원 도입 검토서", "다시 만들 것", "/hospital"], ["11.12 일시불 견적서", "발송함", "/docs"]],
        next: ["수정 견적 발송", "11.24 (화)"],
        blockers: ["할부 금리를 파트너 재무팀이 아직 확정하지 않음. 확정 전이면 '예시 금리'로 표시하고 발송"],
        refs: ref("pipedrive", "pipedriveAct"),
      },
    },
    {
      id: "t-follow-a", kind: "follow", hospital: "h-a", title: "민간병원 A 원장 질문 회신", owner: n.hq, meta: "BPJS 환자 적용 여부", due: "11.24", sort: 2,
      detail: {
        status: "답변 준비", priority: "높음", opened: "11.21",
        summary: "재활의학과 과장이 'BPJS(국민건강보험) 환자에게도 이 치료를 하고 비용을 받을 수 있나'라고 물었습니다. 시연(11.27) 전에 답해야 손익 이야기를 이어갈 수 있습니다.",
        background: [
          "BPJS 환자에게 정해진 보장 밖 추가 비용을 받는 것은 규정으로 정해진 경우(예: 병실 등급 상향)로 제한됩니다. 그래서 병원 손익 계산은 자비 환자 시술만 넣고 BPJS 환자는 빼 두었습니다.",
          "BPJS는 2018년 물리치료를 주 2회로 제한하는 규정을 낸 적이 있습니다(물리치료사협회 반발). 지금도 같은지는 병원 BPJS 담당에게 확인이 필요합니다.",
          "답변은 '안 된다'로 끝내지 말고, 자비 환자 시술가와 월 건수로 손익이 맞는지를 함께 보여 주는 것이 좋습니다.",
        ],
        facts: [["질문자", "재활의학과 과장 (메일, 11.21)"], ["손익 기준", "자비 환자만, BPJS 환자 제외"], ["참고 시술가", "민간 물리치료 회당 Rp100–475천 (2024 조사)"], ["답변 언어", "한국어 초안, 인도네시아어로 보냄"]],
        steps: [
          ["BPJS 추가 비용 규정 문구 확인 (Kepmenkes 1366/2024)", true],
          ["병원 BPJS 담당에게 물리치료 청구 방식 확인 요청 (현지 영업)", false],
          ["병원 제안 화면 '원장 질문 답변'에서 초안 만들고 수치 대조", false],
          ["인도네시아어로 바꿔 과장에게 회신, 시연 날 다시 설명", false],
        ],
        docs: [["원장 질문 답변 초안", "만들 것", "/hospital"], ["병원 도입 검토서", "11.13 전달함", "/hospital"]],
        next: ["과장에게 회신", "11.24 (화)"],
        blockers: ["병원별 BPJS 계약 내용은 병원만 알 수 있음. 일반 규정까지만 답하고 나머지는 '병원 확인 필요'로 표시"],
        refs: ref("kep1366", "bpjsPhysio", "cermati", "zendesk"),
      },
    },
    {
      id: "t-quote-b", kind: "quote", hospital: "h-b", title: "재활클리닉 B 견적 회신 확인", owner: n.sales, meta: "2차 연락", due: "11.25", sort: 3,
      detail: {
        status: "회신 대기", priority: "보통", opened: "11.18",
        summary: "11.18에 보낸 견적에 아직 답이 없습니다. 11.21 1차 연락에도 회신이 없어 2차 연락을 합니다.",
        background: [
          "원장이 직접 결정하는 개인 클리닉이라 원장과 통화가 되면 빨리 결정됩니다. 오전 진료 전 8시대가 통화가 잘 됩니다.",
          "견적 유효기간은 30일(12.18까지)입니다. 그 전에 결정하지 않으면 환율을 다시 반영해 견적을 새로 내야 합니다.",
        ],
        facts: [["견적 발송", "11.18, 일시불"], ["유효기간", "12.18까지 (30일)"], ["1차 연락", "11.21 WhatsApp, 읽음, 답 없음"], ["결정권자", "원장"]],
        steps: [
          ["오전 8시대 원장에게 전화", false],
          ["망설이는 이유 확인 (가격, 할부, 설치 공간, 치료사 교육)", false],
          ["이유에 맞춰 할부 견적이나 손익 자료 다시 보내기", false],
          ["결과를 업무 현황에 기록, 다음 연락일 정하기", false],
        ],
        docs: [["11.18 견적서", "발송함", "/docs"], ["병원 도입 검토서", "보내지 않음", "/hospital"]],
        next: ["원장과 통화", "11.25 (수)"],
        blockers: [],
        refs: ref("pipedriveAct", "hubspot", "mddiHospital"),
      },
    },
    {
      id: "t-as-hp", kind: "as", hospital: "h-a", title: n.asTitle, owner: n.tech, meta: "시연 전 출력 확인", due: "11.25", sort: 4,
      detail: {
        status: "예정", priority: "높음", opened: "11.19",
        summary: "11.27 병원 A 시연 전에 시연용 장비의 핸드피스 출력과 사용 횟수를 점검합니다. 시연 중 출력이 약하거나 오류가 나면 평가가 크게 떨어집니다.",
        background: [
          "시연 장비는 여러 병원을 돌며 쓰기 때문에 운반 중 충격, 핸드피스 사용 횟수 누적이 생깁니다.",
          "점검 결과는 서비스 보고서 형식(장비 일련번호, 점검 항목, 측정값, 조치, 점검자)으로 남겨야 병원이 물어볼 때 보여 줄 수 있습니다.",
        ],
        facts: [["장비", `시연용 ${n.device} 1대`], ["핸드피스", `${n.hpA}, ${n.hpB}`], ["점검 장소", "파트너 사무실 창고"], ["시연일", "11.27 10:00"]],
        steps: [
          ["본체 일련번호, 소프트웨어 버전 기록", false],
          ["전원 코드, 접지, 외관 손상 확인 (전기 안전 점검)", false],
          ["핸드피스별 사용 횟수 확인, 교체 기준과 비교", false],
          ["출력 단계별 동작 시험, 오류 표시 없는지 확인", false],
          ["젤, 소모품, 예비 퓨즈 챙기기", false],
          ["서비스 보고서 작성, 시연 담당에게 공유", false],
        ],
        docs: [["서비스 보고서 (점검)", "작성 예정", null], ["시연 장비 반출 기록", "작성 예정", null]],
        next: ["점검 완료, 보고서 공유", "11.25 (수)"],
        blockers: [n.hpLifeNote],
        refs: ref("svcReport", "pmChecklist", "klip", "sterisHistory", "pm54"),
      },
    },
    {
      id: "t-doc-weight", kind: "doc", hospital: null, title: "포장명세서에 실측 중량 반영", owner: n.hq, due: "11.26", sort: 5,
      detail: {
        status: "실측 대기", priority: "보통", opened: "11.20",
        summary: "지금 포장명세서의 순중량, 총중량은 카탈로그 값과 가정 값입니다. 포장을 마친 뒤 저울로 잰 값으로 바꿔야 항공 운임과 통관 서류가 맞습니다.",
        background: [
          "항공 운임은 실제 중량과 부피 중량(가로×세로×높이 cm ÷ 6000) 중 큰 값으로 매깁니다. 상자 크기도 함께 재야 합니다.",
          "상업송장, 포장명세서, 항공화물운송장(AWB), 수출신고의 중량이 서로 다르면 통관에서 질문을 받습니다.",
        ],
        facts: [["지금 값", "카탈로그 본체 중량 + 포장 가정"], ["필요한 값", "순중량, 총중량, 상자 크기, 상자 수"], ["반영할 서류", "포장명세서, 상업송장, 수출신고"], ["누가 재나", "본사 출고 담당"]],
        steps: [
          ["포장 완료 후 상자별 총중량과 크기 측정, 사진 남기기", false],
          ["거래와 서류 화면에서 중량, 크기 고치기", false],
          ["부피 중량 계산해 운임 견적 기준 중량과 비교", false],
          ["상업송장, 포장명세서 다시 출력해 숫자 대조", false],
        ],
        docs: [["포장명세서", "가정 값", "/docs"], ["상업송장", "가정 값", "/docs"]],
        next: ["실측 값 반영", "11.26 (목)"],
        blockers: ["포장 자재 입고가 늦으면 실측도 늦어짐. 운임 확정(11.27)과 순서를 맞출 것"],
        refs: ref("awb", "fedexExport", "tradlinx", "flexport"),
      },
    },
    {
      id: "t-demo-a", kind: "demo", hospital: "h-a", title: "민간병원 A 원내 시연", owner: n.demoTeam, meta: "10:00", due: "11.27", sort: 6,
      detail: {
        status: "일정 확정", priority: "높음", opened: "11.19",
        summary: "재활의학과에서 치료사 2명이 직접 장비를 써 보는 원내 시연입니다. 원장 질문(BPJS) 답변과 손익 자료를 같은 날 다시 설명합니다.",
        background: [
          "병원은 시연에서 실제 진료 흐름에 맞는지(준비 시간, 1회 치료 시간, 환자 반응, 소음)를 봅니다. 평가 항목을 미리 정해 두면 결정이 빨라집니다.",
          "시연 장비를 병원에 두고 가는 경우에는 반입, 반출 기록과 책임 범위를 서면으로 남깁니다.",
        ],
        facts: [["일시", "11.27 (금) 10:00–11:30"], ["장소", "재활의학과 치료실"], ["참석", "과장, 치료사 2명, 구매팀 (선택)"], ["가져갈 것", `시연용 ${n.device}, 핸드피스 2종, 도입 검토서`]],
        steps: [
          ["장비 점검 완료 확인 (11.25 A/S 할 일)", false],
          ["BPJS 질문 답변 회신 확인 (11.24 할 일)", false],
          ["평가표 준비: 준비 시간, 치료 시간, 환자 반응, 조작 편의, 소음", false],
          ["도입 검토서 출력 2부", false],
          ["시연 후 당일 평가 결과와 다음 단계(견적, 계약 일정) 기록", false],
        ],
        docs: [["병원 도입 검토서", "출력 예정", "/hospital"], ["시연 평가표", "준비 중", null], ["서비스 보고서 (점검)", "11.25 예정", null]],
        next: ["시연 진행, 결과 기록", "11.27 (금)"],
        blockers: ["치료사 근무표가 바뀌면 오후로 미뤄질 수 있음. 전날 확인"],
        refs: ref("demoTrial", "uwDemo", "upstateDemo", "mddiHospital"),
      },
    },
    {
      id: "t-ship-air", kind: "ship", hospital: "h-c", title: "항공 운임 견적 2곳 비교 후 확정", owner: n.hq, due: "11.27", sort: 7,
      detail: {
        status: "견적 받는 중", priority: "보통", opened: "11.20",
        summary: "인천에서 자카르타(수카르노하타)로 보낼 항공 운임 견적을 포워더 2곳에서 받아 비교하고 하나로 정합니다.",
        background: [
          "견적은 같은 조건으로 받아야 비교됩니다: 출발지, 도착지, 과금 중량, 인도조건, 통관 대행 포함 여부, 보험.",
          `인도조건이 EXW면 원래 수출통관은 매수인 몫이지만, 실무에서는 한국 수출자가 수출신고를 하는 경우가 많습니다. ICC는 이럴 때 FCA를 쓰라고 권합니다. 계약서 조건과 실제 역할이 맞는지 같이 확인합니다.`,
          "수출신고가 수리된 뒤 30일 안에 적재하지 않으면 수리가 취소될 수 있으니, 출발편 날짜를 신고일과 맞춥니다.",
        ],
        facts: [["구간", "인천(ICN) → 자카르타(CGK)"], ["과금 중량", "실측 반영 후 확정 (11.26 할 일)"], ["비교 항목", "운임, 유류할증, 통관 대행, 보험, 소요일"], ["관련 병원", "종합병원 C 납기 협의에 영향"]],
        steps: [
          ["포워더 2곳에 같은 조건으로 견적 요청", true],
          ["실측 중량, 상자 크기 받아 견적 다시 맞추기", false],
          ["운임, 부대비용, 출발편, 소요일 표로 비교", false],
          ["인도조건과 수출신고 주체 확인", false],
          ["한 곳 확정, 예약 번호와 출발편 기록", false],
        ],
        docs: [["운임 견적 2건", "1건 받음", null], ["상업송장, 포장명세서", "중량 반영 대기", "/docs"]],
        next: ["포워더 확정", "11.27 (금)"],
        blockers: ["실측 중량이 나와야 최종 운임이 나옴"],
        refs: ref("awb", "iataEawb", "iccExw", "tradeInco", "tradlinx"),
      },
    },
    {
      id: "t-doc-coo", kind: "doc", hospital: null, title: "원산지증명서 발급 신청", owner: n.hq, meta: "FTA 특혜 관세용", due: "11.28", sort: 8,
      detail: {
        status: "서류 준비", priority: "보통", opened: "11.20",
        summary: "현지 파트너가 수입할 때 한-아세안 FTA 특혜 관세를 받으려면 원산지증명서(Form AK) 원본이 필요합니다. 선적 전에 발급을 신청합니다.",
        background: [
          "인도네시아는 수입 신고(PIB) 때 원산지증명서를 함께 내야 특혜 관세를 줍니다. 원본 제출 기한이 검사 경로에 따라 짧으므로(초록 경로 3일, 노랑, 빨강 경로는 다음 날 12시) 서류가 화물보다 늦으면 안 됩니다.",
          "발급 신청에는 상업송장, 원산지 판정 근거(세번 변경 또는 부가가치 기준, 원재료 명세)가 필요합니다.",
          "수입하는 쪽은 현지 등록(AKL)을 가진 유통사여야 하고, 라벨에는 인도네시아어 표시와 등록번호가 있어야 합니다. 원산지증명서의 수입자와 같은지 확인합니다.",
        ],
        facts: [["협정", "한-아세안 FTA (Form AK)"], ["수입자", `${n.ptOrg} (현지 등록 보유 유통사)`], ["필요 서류", "상업송장, 원산지 판정 근거, 원재료 명세"], ["원본 전달", "화물과 함께 또는 특송으로 먼저"]],
        steps: [
          ["원산지 판정 근거와 원재료 명세 정리", false],
          ["상업송장 최종본(중량 반영 후) 확정", false],
          ["발급 기관에 전자 신청", false],
          ["발급본의 수입자, 품목, 세번, 송장 번호 대조", false],
          ["원본을 현지 통관 대행에게 전달, 도착 확인", false],
        ],
        docs: [["원산지증명서 (Form AK)", "신청 전", null], ["상업송장", "중량 반영 대기", "/docs"]],
        next: ["발급 신청", "11.28 (토)"],
        blockers: ["상업송장 숫자가 확정돼야 신청 가능 (11.26 실측 할 일)"],
        refs: ref("ftaId", "jetroAk", "kcsFta", "kcciAk", "emerhubCustoms", "insw", "pmk62", "idak", "emerhubReg", "emerhubLabel"),
      },
    },
  ];
  return { hospitals, tasks };
}
