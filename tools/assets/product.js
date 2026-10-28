/* 영문 제품 정보: 05 홍보자료와 06 바이어·상담이 함께 씀 */
(function () {
  const P = TAK.profile();
  const first = (P.countries || "").split(/[,·]/)[0].trim();
  const EN = { 인도네시아: "Indonesia", 일본: "Japan", 홍콩: "Hong Kong", 베트남: "Vietnam", 태국: "Thailand", 미국: "United States", 독일: "Germany", 사우디: "Saudi Arabia", "UAE": "UAE", 튀르키예: "Türkiye", 말레이시아: "Malaysia", 필리핀: "Philippines", 인도: "India", 중국: "China", 멕시코: "Mexico", 브라질: "Brazil" };

  // 가상 예시 (화면 시연용, 실제 기업 아님)
  const SAMPLE = {
    company: "Hangyeol Medical Co., Ltd. (sample)",
    product: "HG-200 TENS Electrotherapy Device",
    oneliner: "Compact 4-channel TENS electrotherapy device for physiotherapy and rehabilitation clinics",
    country: EN[first] || first || "Indonesia", buyer: "physiotherapy clinic chains and medical device distributors",
    certs: "MFDS (Korea) Class II, ISO 13485:2016",
    usps: [
      { t: "Four independent channels treat two patients at once", ev: "Product spec sheet (4 output channels)" },
      { t: "Registration documents ready for local partners", ev: "MFDS certificate, ISO 13485:2016 certificate" },
      { t: "Fast electrode supply through a local partner", ev: "" },
    ],
    spec: "4 channels, 1–150 Hz, rechargeable battery, 0.4 kg",
    terms: "Sample order 10 units, FCA Incheon Airport, 3 weeks lead time",
    support: "Online training and spare electrode supply via local distributor",
    contact: "export@hangyeol-medical.example", hs: P.hs || "9018.90",
    use: "transcutaneous electrical nerve stimulation (TENS) therapy in physiotherapy, rehabilitation and orthopedic clinics",
    build: "handheld control unit with four output channels, lead wires, self-adhesive electrode pads and a charger",
    buyers: [
      { n: "Buyer A (가상)", f: 3, q: 3, s: 3, d: 2, v: 3 },
      { n: "Buyer B (가상)", f: 3, q: 1, s: 1, d: 1, v: 2 },
      { n: "Buyer C (가상)", f: 2, q: 3, s: 2, d: 3, v: 1 },
    ],
  };
  const BLANK = { company: P.companyEn || "", product: P.productEn || "", oneliner: "", country: EN[first] || first || "", buyer: "", certs: "", usps: [{ t: "", ev: "" }, { t: "", ev: "" }, { t: "", ev: "" }], spec: "", terms: "", support: "", contact: "", hs: P.hs || "", use: "", build: "", buyers: [{ n: "Buyer A", f: 1, q: 1, s: 1, d: 2, v: 1 }] };

  function get() { return TAK.load("product", null) || JSON.parse(JSON.stringify(P.sample ? SAMPLE : BLANK)); }
  function save(S) { TAK.save("product", S); }

  const FIELDS = [
    ["company", "회사 이름 (영문)"], ["product", "제품 이름 (영문)"], ["oneliner", "한 줄 소개 (영문)"],
    ["country", "팔고 싶은 나라 (영문)"], ["buyer", "누구에게 팔고 싶나요 (영문)"], ["certs", "가진 인증 (쉼표로)"],
    ["spec", "주요 사양"], ["terms", "거래 조건"], ["support", "교육·A/S"], ["contact", "연락처"], ["hs", "HS 코드"],
    ["use", "어디에 쓰나요 (용도·사용처, 영문)"], ["build", "무엇으로 구성되나요 (영문)"],
  ];
  function form(el, S, onChange, keys) {
    el.innerHTML = FIELDS.filter(([k]) => !keys || keys.includes(k)).map(([k, l]) => `<div class="field"><label>${l}</label><input data-k="${k}" value="${TAK.esc(S[k] || "")}"></div>`).join("") +
      (!keys || keys.includes("usps") ? `<label>강점 3개와 근거 자료</label>${S.usps.map((u, k) => `<div class="row" data-u="${k}" style="margin-bottom:6px"><input data-f="t" value="${TAK.esc(u.t)}" placeholder="강점 ${k + 1} (영문)"><input data-f="ev" value="${TAK.esc(u.ev)}" placeholder="근거 자료"></div>`).join("")}` : "");
    el.oninput = (e) => {
      const t = e.target;
      if (t.dataset.k) S[t.dataset.k] = t.value;
      else if (t.dataset.f) S.usps[+t.closest("[data-u]").dataset.u][t.dataset.f] = t.value;
      save(S); onChange();
    };
  }

  // 과장 표현 점검 (의료기기 광고에서 문제 되기 쉬운 말)
  const RISKY = [
    [/\b(only|unique|best(?! regards)|no\.?\s?1|number one|world'?s first)\b/i, "'only·unique·best' 같은 최상급 표현은 경쟁 제품을 확인하기 전에는 쓰지 마세요."],
    [/\b(cure[sd]?|guarantee[sd]?|100\s?%|no side effects?|painless|heals?)\b/i, "'완치·보장·부작용 없음' 같은 효능 표현은 의료기기 광고 규정에 걸릴 수 있어요."],
    [/(유일|최고|최초|완치|부작용 없|100%)/, "한국어 과장 표현이 들어 있어요."],
    [/\b(cheaper|lowest price)\b/i, "'더 싸다'는 경쟁 견적을 받기 전에는 쓰지 마세요."],
  ];
  function risky(S, text) {
    const ck = [];
    RISKY.forEach(([re, msg]) => { const m = text.match(re); if (m) ck.push(["warn", `"${m[0]}" · ${msg}`]); });
    S.usps.forEach((u, k) => { if (u.t && !u.ev) ck.push(["warn", `강점 ${k + 1} "${u.t}"에 근거 자료가 없어요. 근거가 없으면 빼거나 '계획'으로 쓰세요.`]); });
    if (/\bCE\b|FDA/.test(S.certs)) ck.push(["info", "CE·FDA는 인증서 사본(번호·대상 모델)을 확인한 뒤에만 쓰세요."]);
    if (!ck.some((c) => c[0] === "warn")) ck.unshift(["pass", "과장 표현이나 근거 없는 강점이 없어요."]);
    return ck;
  }

  window.PROD = { SAMPLE, BLANK, get, save, form, risky };
})();
