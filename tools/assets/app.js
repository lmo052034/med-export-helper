/* 공통: 상단 메뉴, 페이지 머리말, 회사 정보, 저장, 복사, 프롬프트 창, AI 답 확인 기록 */
(function () {
  // 메뉴 순서 = 수출 순서. kc는 2025 KOTRA AI 활용 우수사례집에서 같은 방식을 쓴 사례
  const STEPS = [
    { n: "01", file: "readiness.html", name: "수출 준비 진단", short: "준비 진단", kc: "사례 01 · AI 수출비서", what: "8단계 수출 여정으로 지금 준비 상태를 점검하고, 먼저 할 일을 뽑아 줍니다." },
    { n: "02", file: "programs.html", name: "지원사업 캘린더", short: "지원사업", kc: "사례 02-1 · 무역투자24 AI 큐레이션", what: "정부·KOTRA·협동조합 공고를 매일 모아 달력에 놓고, 우리 목표에 맞는 공고를 추천합니다." },
    { n: "03", file: "market.html", name: "수출할 나라 고르기", short: "나라 고르기", kc: "사례 02-3 · TriBIG, 06 · 시장정보 조사", what: "후보국 2–3곳을 같은 기준으로 비교해 첫 수출국을 고릅니다." },
    { n: "04", file: "compliance.html", name: "HS·관세·인증 확인", short: "HS·인증", kc: "사례 05 · 규제정보 전파", what: "HS 코드, 수입국 관세, 의료기기 인허가 일정을 확인합니다." },
    { n: "05", file: "promo.html", name: "홍보자료 만들기", short: "홍보자료", kc: "사례 02-2 · buyKOREA, 03 · AI무역지원센터", what: "바이코리아 등록문, SNS 글, 1분 영상 대본을 만듭니다." },
    { n: "06", file: "buyer.html", name: "바이어 찾기·상담", short: "바이어·상담", kc: "사례 08 · 바이어 매칭, 07 · 상담일지", what: "매칭용 제품 설명, 바이어 고르는 표, 상담 대본과 상담일지를 만듭니다." },
    { n: "07", file: "deal.html", name: "견적서·인보이스", short: "견적·서류", kc: "AI 수출비서 6·7단계 (계약·수출 실행)", what: "제안 메일, 견적서, 인보이스를 한 번에 만들고 조건이 맞는지 검사합니다." },
    { n: "08", file: "log.html", name: "AI 답 확인 기록", short: "AI 답 확인", kc: "사례 09 · 근거를 함께 보여 주는 AI", what: "AI에게 물은 것과 공식자료로 확인한 결과를 모아 둡니다." },
  ];

  const here = location.pathname.split("/").pop() || "index.html";
  const bar = document.createElement("header");
  bar.className = "topbar";
  bar.innerHTML =
    '<div class="topbar-in"><a class="brand" href="index.html"><span class="brand-dot"></span>의료기기 수출 도우미</a><nav class="nav">' +
    STEPS.map((s) => `<a href="${s.file}" class="${s.file === here ? "on" : ""}"><small>${s.n}</small>${s.short}</a>`).join("") +
    `<a href="cases.html" class="${here === "cases.html" ? "on" : ""}">KOTRA 사례</a></nav></div>`;
  document.body.prepend(bar);

  const foot = document.createElement("footer");
  foot.className = "foot";
  foot.textContent = "에프킬라 · Global Trade AI Lab 시연용 · 입력한 내용은 이 브라우저에만 저장됩니다 · 숫자·세율·인증·공고 내용은 꼭 원문으로 확인하세요";
  document.body.append(foot);

  const toastEl = document.createElement("div");
  toastEl.className = "toast";
  document.body.append(toastEl);
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  // 저장 키 앞머리를 바꿔 예전 버전(특정 기업 예시) 값이 섞이지 않게 합니다
  function load(key, fallback) {
    try {
      const v = localStorage.getItem("mdk:" + key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function save(key, value) {
    try {
      localStorage.setItem("mdk:" + key, JSON.stringify(value));
    } catch (e) {}
  }

  async function copy(text, msg) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.append(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    toast(msg || "복사했어요");
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- 페이지 머리말 ---------- */
  function head(file, sub, guide, actions) {
    const s = STEPS.find((x) => x.file === file);
    const el = document.getElementById("head");
    el.className = "page-head";
    el.innerHTML =
      `<div class="step-badge"><b>${s.n}</b>${s.name}<span>· ${s.kc} 방식</span></div>
      <div class="row-top"><h1>${s.name}</h1>${actions ? `<div class="btns no-print">${actions}</div>` : ""}</div>
      <p class="sub">${sub || s.what}</p>` +
      (guide ? `<div class="guide no-print">${guide.map(([k, v]) => `<div><b>${k}</b>${v}</div>`).join("")}</div>` : "");
  }

  /* ---------- 회사·제품 정보 (모든 페이지가 함께 씀) ---------- */
  const SAMPLE_PROFILE = {
    company: "(가상) 한결메디칼", companyEn: "Hangyeol Medical Co., Ltd. (sample)",
    product: "저주파 전기자극 치료기", productEn: "HG-200 TENS Electrotherapy Device",
    hs: "9018.90", grade: "2", region: "경기", countries: "인도네시아, 일본, 홍콩", exp: "none", sample: true,
  };
  const REGIONS = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
  function profile() { return load("profile", SAMPLE_PROFILE); }
  function setProfile(p) { save("profile", p); }

  /* ---------- 창 ---------- */
  const bg = document.createElement("div");
  bg.className = "modal-bg";
  bg.innerHTML = '<div class="modal"></div>';
  document.body.append(bg);
  bg.addEventListener("click", (e) => { if (e.target === bg) bg.classList.remove("show"); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") bg.classList.remove("show"); });
  function modal(html) {
    bg.firstElementChild.innerHTML = html;
    bg.classList.add("show");
    return bg.firstElementChild;
  }
  function closeModal() { bg.classList.remove("show"); }

  /* ---------- AI 답 확인 기록: 물은 것 / AI 답 / 확인 자료 / 고친 내용 ---------- */
  const PARTS = ["나라 고르기", "HS·관세", "인증·규제", "영문자료·홍보", "바이어·상담", "거래조건", "회사·제품"];
  const SEED_LOG = [
    {
      part: "HS·관세",
      prompt: "일본에 HS 9018.90 의료기기를 수출하면 관세가 몇 %야?",
      ai: "(형식 예시) 한국 관세율표의 세율을 일본 관세처럼 답함",
      source: "일본 세관 실행관세율표 제90류 (Free)",
      fix: "수입국(일본) 관세율표 기준으로 무세(Free)로 고침. 한국 관세율표는 한국으로 들여올 때의 세율",
      seed: true,
    },
    {
      part: "거래조건",
      prompt: "항공으로 보내는 첫 주문 견적서를 FOB 인천 조건으로 써 줘",
      ai: "(형식 예시) FOB Incheon Airport로 견적서 작성",
      source: "ICC Incoterms 2020: FOB는 해상·내수로 운송 전용",
      fix: "항공 운송이므로 FCA Incheon Airport로 바꿈",
      seed: true,
    },
  ];
  function getLog() { return load("log", SEED_LOG); }
  function setLog(rows) { save("log", rows); }
  function addLog(row) {
    const rows = getLog();
    rows.push(Object.assign({ at: new Date().toISOString().slice(0, 10) }, row));
    setLog(rows);
    toast("AI 답 확인 기록에 저장했어요 (" + rows.length + "건)");
  }

  /* 프롬프트 보여 주기 → 복사 → 답을 받으면 확인 기록으로 저장 */
  function promptModal(title, prompt, part) {
    const m = modal(
      `<h3>${esc(title)}</h3>
      <p class="hint mb">① 복사해서 ChatGPT에 붙여 넣으세요. ② 답에 나온 숫자·세율·인증은 '후보'로만 보고 공식 사이트에서 확인하세요. ③ 확인한 결과를 아래에 적으면 기록으로 남습니다.</p>
      <pre>${esc(prompt)}</pre>
      <div class="btns mt"><button class="btn primary" id="pm-copy">질문 복사</button>
      <a class="btn" href="https://chatgpt.com/" target="_blank" rel="noopener">ChatGPT 열기</a></div>
      <div class="mt" style="border-top:1px solid var(--line);padding-top:14px">
        <div class="row"><div class="field"><label>분야</label><select id="pm-part">${PARTS.map((p) => `<option ${p === part ? "selected" : ""}>${p}</option>`).join("")}</select></div>
        <div class="field"><label>확인한 공식자료</label><input id="pm-src" placeholder="예: UNI-PASS 세번 조회 화면 (날짜)"></div></div>
        <div class="field"><label>AI 답 요약</label><textarea id="pm-ai" placeholder="AI가 뭐라고 답했는지 한두 줄"></textarea></div>
        <div class="field"><label>고친 내용</label><input id="pm-fix" placeholder="틀린 부분과 고친 내용 (맞았다면 '확인 결과 같음')"></div>
        <div class="btns"><button class="btn" id="pm-save">기록에 저장</button><button class="btn" id="pm-close">닫기</button></div>
      </div>`
    );
    m.querySelector("#pm-copy").onclick = () => copy(prompt, "질문을 복사했어요");
    m.querySelector("#pm-close").onclick = closeModal;
    m.querySelector("#pm-save").onclick = () => {
      addLog({ part: m.querySelector("#pm-part").value, prompt, ai: m.querySelector("#pm-ai").value, source: m.querySelector("#pm-src").value, fix: m.querySelector("#pm-fix").value });
      closeModal();
    };
  }

  function checks(el, list) {
    el.innerHTML = list.map(([k, t]) => `<li class="${k}"><span class="ic">${k === "pass" ? "✓" : k === "warn" ? "!" : "i"}</span><span>${esc(t)}</span></li>`).join("");
  }

  function fmtUSD(n, digits) {
    if (n == null || n === "" || isNaN(n)) return "–";
    return "USD " + Number(n).toLocaleString("en-US", { minimumFractionDigits: digits || 0, maximumFractionDigits: digits || 0 });
  }

  window.TAK = { STEPS, REGIONS, SAMPLE_PROFILE, profile, setProfile, head, toast, load, save, copy, esc, modal, closeModal, getLog, setLog, addLog, promptModal, checks, PARTS, SEED_LOG, fmtUSD };
})();
