/* 지원사업 공고: 상태 계산 · 목표 기반 추천. 데이터는 public/data/notices.js가 window.NOTICES로 넣어 줌 */
  const SRC = {
    kotra: { name: "KOTRA", url: "https://www.kotra.or.kr/" },
    kmdica: { name: "한국의료기기협동조합", url: "https://www.kmdica.or.kr/" },
    mohw: { name: "보건복지부·보건산업진흥원", url: "https://www.khidi.or.kr/" },
    motie: { name: "산업통상부", url: "https://www.motir.go.kr/" },
    mss: { name: "중소벤처기업부", url: "https://www.mss.go.kr/" },
    etc: { name: "지자체·기타 기관", url: "" },
  };
  const GOALS = [
    ["전시", "해외 전시회 참가"],
    ["바이어", "바이어 발굴·상담"],
    ["지사화", "현지 지사 대행 (지사화)"],
    ["인증", "해외 인증·인허가"],
    ["마케팅", "홍보·마케팅·바우처"],
    ["교육", "교육·설명회"],
  ];
  const AREAS = ["북미", "유럽", "중동", "동남아", "중국", "일본", "중남미", "인도"];

  const COUNTRY_AREA = [
    [/미국|캐나다/, "북미"], [/독일|프랑스|영국|이탈리아|스페인|폴란드|네덜란드|튀르키예|터키|유럽/, "유럽"],
    [/UAE|아랍|두바이|사우디|카타르|중동|이집트/, "중동"], [/인도네시아|베트남|태국|말레이|필리핀|싱가포르|캄보디아|미얀마/, "동남아"],
    [/중국|홍콩|대만/, "중국"], [/일본/, "일본"], [/브라질|멕시코|칠레|페루|콜롬비아/, "중남미"], [/인도(?!네시아)/, "인도"],
  ];
  const areasOf = (countries) => [...new Set(String(countries || "").split(/[,·\s]+/).map((c) => (COUNTRY_AREA.find(([re]) => re.test(c)) || [])[1]).filter(Boolean))];
  function defaultGoal(p) {
    return { goals: ["전시", "바이어", "인증"], areas: areasOf(p.countries), region: p.region || "서울", exp: p.exp || "none", months: 3 };
  }

  const data = (typeof window !== "undefined" && window.NOTICES) || { items: [], sources: [] };
  const today = new Date().toISOString().slice(0, 10);
  const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

  // 접수 상태: open 접수 중 · soon 접수 예정 · closed 마감 · info 기간 없음(교육·안내)
  function status(n) {
    if (n.end && n.end < today) return { k: "closed", label: "마감", cls: "" };
    if (n.start && n.start > today) return { k: "soon", label: `접수 예정 (${n.start.slice(5).replace("-", ".")}부터)`, cls: "info" };
    if (n.end) {
      const d = days(today, n.end);
      return { k: "open", label: d === 0 ? "오늘 마감" : `접수 중 · D-${d}`, cls: d <= 7 ? "warn" : "ok", d };
    }
    return { k: "info", label: "기간은 원문 확인", cls: "line" };
  }

  // 목표: { goals:[], areas:[], region:"", exp:"none|some", months:3 }
  function recommend(goal) {
    const horizon = new Date(Date.now() + (goal.months || 3) * 30 * 864e5).toISOString().slice(0, 10);
    return data.items
      .map((n) => {
        const st = status(n);
        const why = [];
        let s = 0;
        if (st.k === "closed") return null;
        if (n.regions && n.regions.length && !n.regions.includes(goal.region)) return null; // 다른 지역 기업 전용
        const g = (n.types || []).filter((t) => goal.goals.includes(t));
        if (g.length) { s += 30 * g.length; why.push("목표: " + g.map((t) => GOALS.find((x) => x[0] === t)[1]).join(", ")); }
        const a = (n.areas || []).filter((t) => goal.areas.includes(t));
        if (a.length) { s += 25; why.push("관심 지역: " + a.join(", ")); }
        else if (!(n.areas || []).length) s += 4;
        if (n.med) { s += 20; why.push("의료기기 관련"); } else s += 3;
        if (n.regions && n.regions.length) { s += 10; why.push(goal.region + " 기업 대상"); }
        if (st.k === "open" && n.end <= horizon) { s += 15; why.push(`${goal.months}개월 안 마감`); }
        if (st.k === "soon" && n.start <= horizon) { s += 10; why.push("곧 접수 시작"); }
        if (goal.exp === "none" && /초보|내수|첫|처음|교육|안내서/.test(n.title)) { s += 8; why.push("수출 초보에게 맞음"); }
        if (!g.length && !a.length) s -= 15;
        return { n, st, s, why };
      })
      .filter((x) => x && x.s > 20)
      .sort((x, y) => y.s - x.s || (x.n.end || "9").localeCompare(y.n.end || "9"));
  }

  // 달력에 놓을 날짜들
  function events(n) {
    const out = [];
    if (n.start) out.push({ d: n.start, k: "start", label: "접수 시작" });
    if (n.end) out.push({ d: n.end, k: "end", label: "접수 마감" });
    if (n.event && n.event.start) out.push({ d: n.event.start, k: "event", label: n.event.name + " 개막" });
    if (!n.start && !n.end && n.posted) out.push({ d: n.posted, k: "posted", label: "게시" });
    return out;
  }

  // .ics 파일 (내 캘린더에 추가)
  function ics(n) {
    const f = (d) => d.replace(/-/g, "");
    const next = (d) => new Date(Date.parse(d) + 864e5).toISOString().slice(0, 10);
    const ev = [];
    if (n.end) ev.push(["[마감] " + n.title, n.end]);
    if (n.event && n.event.start) ev.push([n.event.name + " (" + (n.event.place || "") + ")", n.event.start, n.event.end]);
    const body = ev.map(([t, a, b], k) => [
      "BEGIN:VEVENT", `UID:${n.id}-${k}@medexport`, `DTSTAMP:${f(today)}T000000Z`, `DTSTART;VALUE=DATE:${f(a)}`, `DTEND;VALUE=DATE:${f(next(b || a))}`,
      "SUMMARY:" + t.replace(/[,;]/g, " "), "DESCRIPTION:" + (n.org + " " + n.url).replace(/[,;]/g, " "), "END:VEVENT",
    ].join("\r\n")).join("\r\n");
    return "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//MedExportKit//KO\r\n" + body + "\r\nEND:VCALENDAR\r\n";
  }

  export const NLIB = { data, areasOf, defaultGoal, SRC, GOALS, AREAS, status, recommend, events, ics, today, days };
