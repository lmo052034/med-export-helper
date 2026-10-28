// 의료기기 수출 지원사업 공고 일간 수집기
// 실행: node scripts/collect-notices.mjs   (GitHub Actions가 매일 06:00 KST에 실행)
// 결과: tools/data/notices.js  (window.NOTICES = {...}; 브라우저에서 script 태그로 읽음)
//
// 출처 원칙
// - 공식 API가 있으면 API를 쓴다 (기업마당: 중기부·산업부·복지부·KOTRA 등 정부 지원사업 통합 공고).
// - 게시판을 읽을 때는 robots.txt를 먼저 확인하고, 막혀 있으면 수집하지 않는다.
// - 출처별 성공·실패를 sources에 남겨 화면에 그대로 보여 준다.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = ROOT + "/tools/data/notices.js";
const UA = "MedExportKit-NoticeBot/1.0 (+https://github.com/lmo052034/global-ai-trade-lab)";
const TODAY = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); // KST

/* ---------- 분류 규칙 (화면 추천에서 그대로 사용) ---------- */
export const TYPES = [
  ["전시", /전시|박람회|한국관|공동관|EXPO|MEDICA|WHX|Arab ?Health|FIME|RSNA|CMEF|KIMES|Hospitalar|Medical Japan/i],
  ["지사화", /지사화|해외지사|현지 ?지사/],
  ["바이어", /바이어|매칭|상담회|사절단|수출상담|B2B|구매상담/],
  ["인증", /인증|인허가|FDA|\bCE\b|MDR|규제|임상|허가|PRRC|사이버보안/i],
  ["마케팅", /바우처|마케팅|홍보|온라인|카탈로그|콘텐츠|숏폼|디지털/],
  ["교육", /교육|설명회|세미나|워크숍|아카데미|간담회|안내서/],
];
export const AREAS = [
  ["북미", /미국|캐나다|북미|RSNA|FIME|시카고|마이애미|FDA/],
  ["유럽", /독일|유럽|프랑스|영국|EU\b|MEDICA|뒤셀도르프|MDR|PRRC/],
  ["중동", /두바이|UAE|사우디|중동|WHX|Arab|카타르/],
  ["동남아", /베트남|인도네시아|태국|말레이|필리핀|싱가포르|동남아|아세안|ASEAN/],
  ["중국", /중국|CMEF|상하이|광저우/],
  ["일본", /일본|도쿄|오사카/],
  ["중남미", /브라질|멕시코|중남미|칠레|콜롬비아|페루|Hospitalar/],
  ["인도", /인도(?!네시아)|뭄바이|델리/],
];
const REGIONS = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
const MED = /의료|헬스|바이오|보건|병원|메디|Medical|MEDICA|WHX|RSNA|FIME|KIMES|의료기기|재활|진단/i;
const EXPORT = /수출|해외|글로벌|전시|바이어|지사화|FTA|통상|인증|무역|진출/;

export function classify(n) {
  const text = `${n.title} ${n.org || ""} ${n.summary || ""} ${(n.event && n.event.name) || ""}`;
  n.types = n.types && n.types.length ? n.types : TYPES.filter(([, re]) => re.test(text)).map(([k]) => k);
  if (!n.types.length) n.types = ["기타"];
  n.areas = n.areas && n.areas.length ? n.areas : AREAS.filter(([, re]) => re.test(text)).map(([k]) => k);
  if (!n.regions) {
    // 제목·주관기관에 지자체 이름이 있으면 그 지역 기업만 신청 가능한 공고로 본다
    // "KOTRA대전세종충남지원본부"처럼 KOTRA 지역 본부 이름은 신청 자격 제한이 아니므로 뺀다
    const head = `${n.title} ${(n.org || "").replace(/KOTRA\S*/g, "")}`;
    n.regions = REGIONS.filter((r) => new RegExp(r + "(광역시|특별시|특별자치시|특별자치도|도|시|테크노파크|TP|지원본부)?").test(head) && /지역|광역|도청|시청|테크노파크|TP|지원본부|소재/.test(head + (n.summary || "")));
  }
  n.med = n.med != null ? n.med : MED.test(text);
  return n;
}

/* ---------- 유틸 ---------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, asJson) {
  const r = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9" }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const buf = Buffer.from(await r.arrayBuffer());
  let t = buf.toString("utf8");
  if (/charset=["']?(euc-kr|ks_c_5601)/i.test(t.slice(0, 3000))) t = new TextDecoder("euc-kr").decode(buf);
  return asJson ? JSON.parse(t) : t;
}
export async function robotsAllows(url, fetchText = get) {
  const u = new URL(url);
  let txt = "";
  try { txt = await fetchText(u.origin + "/robots.txt"); } catch { return true; } // robots.txt가 없으면 허용
  return robotsCheck(txt, u.pathname + u.search);
}
export function robotsCheck(txt, path) {
  // User-agent: * 그룹의 Allow/Disallow 중 가장 긴 일치 규칙을 따른다
  let on = false; const rules = [];
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim(); if (!line) continue;
    const [k, ...rest] = line.split(":"); const v = rest.join(":").trim(); const key = k.trim().toLowerCase();
    if (key === "user-agent") on = v === "*";
    else if (on && (key === "allow" || key === "disallow") && v) rules.push([key, v]);
  }
  const hit = rules.filter(([, p]) => path.startsWith(p.replace(/\*.*$/, ""))).sort((a, b) => b[1].length - a[1].length)[0];
  return !hit || hit[0] === "allow";
}
export function parseRange(s) {
  // "20261001 ~ 20261031", "2026.10.01 ~ 2026.10.31", "2026-10-01~2026-10-31"
  const d = [...String(s || "").matchAll(/(20\d\d)[.\-\/년 ]?\s?(\d{1,2})[.\-\/월 ]?\s?(\d{1,2})/g)].map((m) => `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`);
  return { start: d[0] || "", end: d[1] || d[0] || "" };
}
const strip = (h) => String(h || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
const idOf = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return "n" + h.toString(36); };

/* ---------- 출처 1: 기업마당 지원사업정보 API ---------- */
// 중기부가 운영하는 정부 지원사업 통합 공고. 중기부·산업부·복지부·KOTRA·지자체 공고가 함께 올라온다.
// 인증키는 기업마당에서 무료 발급 → GitHub 저장소 Settings → Secrets → BIZINFO_KEY
const MINISTRY = [
  ["kotra", /KOTRA|대한무역투자진흥공사/],
  ["mohw", /보건복지부|보건산업진흥원|의료기기안전정보원/],
  ["motie", /산업통상|산업부/],
  ["mss", /중소벤처기업부|중소기업|중기부|중진공|중소기업기술정보진흥원/],
];
export function fromBizinfo(json) {
  const arr = json.jsonArray || json.items || (json.response && json.response.body && json.response.body.items) || [];
  return arr
    .map((x) => {
      const org = [x.jrsdInsttNm, x.excInsttNm].filter(Boolean).join(" · ");
      const r = parseRange(x.reqstBeginEndDe);
      const src = (MINISTRY.find(([, re]) => re.test(org)) || ["etc"])[0];
      let url = x.pblancUrl || "";
      if (url && url.startsWith("/")) url = "https://www.bizinfo.go.kr" + url;
      return { title: strip(x.pblancNm), org, src, url, posted: parseRange(x.creatPnttm).start, start: r.start, end: r.end, summary: strip(x.bsnsSumryCn).slice(0, 220), via: "기업마당" };
    })
    .filter((n) => n.title && EXPORT.test(`${n.title} ${n.summary}`));
}
async function srcBizinfo() {
  const key = process.env.BIZINFO_KEY;
  if (!key) return { items: [], note: "인증키(BIZINFO_KEY)가 없어 건너뜀" };
  const items = [];
  for (const tag of ["수출", "해외", "의료기기"]) {
    const url = `https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do?crtfcKey=${encodeURIComponent(key)}&dataType=json&searchCnt=200&hashtags=${encodeURIComponent(tag)}`;
    items.push(...fromBizinfo(await get(url, true)));
    await sleep(800);
  }
  return { items };
}

/* ---------- 출처 2: 한국보건산업진흥원 게시판 (보건복지부 산하, 의료기기협동조합 글 포함) ---------- */
export function fromKhidiList(html, base) {
  const out = [];
  for (const tr of html.match(/<tr[\s\S]*?<\/tr>/gi) || []) {
    const a = tr.match(/<a[^>]+href=["']([^"']*board\/view[^"']*)["'][^>]*>([\s\S]*?)<\/a>/i);
    if (!a) continue;
    const cells = (tr.match(/<td[\s\S]*?<\/td>/gi) || []).map(strip);
    const title = strip(a[2]);
    const org = cells.find((c) => /협동조합|진흥원|협회|정보원|재단|센터|산업진흥원|기타|KOTRA/.test(c) && c !== title) || "";
    const date = (cells.join(" ").match(/20\d\d[.\-]\d\d[.\-]\d\d/) || [""])[0].replace(/\./g, "-");
    const url = new URL(a[1].replace(/&amp;/g, "&"), base).href;
    out.push({ title, org: org || "한국보건산업진흥원", src: /의료기기협동조합|의료기기공업협동조합/.test(org) ? "kmdica" : "mohw", url, posted: date, start: "", end: "", via: "보건산업진흥원 게시판" });
  }
  return out;
}
async function srcKhidi() {
  const pages = [
    "https://www.khidi.or.kr/board?menuId=MENU01491", // 기관별 교육·행사 (의료기기협동조합·안전정보원·산업협회 글)
    "https://www.khidi.or.kr/board?menuId=MENU02458&categoryId=01", // 공지사항 중 공고
  ];
  const items = [];
  for (const p of pages) {
    if (!(await robotsAllows(p))) throw new Error("robots.txt가 수집을 막음: " + p);
    items.push(...fromKhidiList(await get(p), p));
    await sleep(1200);
  }
  return { items };
}

const SOURCES = [
  { key: "bizinfo", name: "기업마당 API (중기부·산업부·복지부·KOTRA 통합 공고)", url: "https://www.bizinfo.go.kr/", run: srcBizinfo },
  { key: "khidi", name: "한국보건산업진흥원 게시판 (보건복지부·의료기기협동조합 글)", url: "https://www.khidi.or.kr/board?menuId=MENU01491", run: srcKhidi },
];

/* ---------- 병합·저장 ---------- */
export function load(path = OUT) {
  if (!existsSync(path)) return { items: [] };
  const t = readFileSync(path, "utf8");
  return JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1));
}
export function merge(prev, fresh) {
  const map = new Map(prev.map((n) => [n.id, n]));
  for (const n of fresh) {
    n.id = n.id || idOf(n.url || n.title);
    const old = map.get(n.id);
    map.set(n.id, old && old.verified ? Object.assign({}, n, old) : Object.assign({ first: TODAY }, old || {}, n));
  }
  const cutoff = new Date(Date.parse(TODAY) - 120 * 864e5).toISOString().slice(0, 10);
  return [...map.values()]
    .map(classify)
    .filter((n) => n.verified || (n.end || n.posted || TODAY) >= cutoff) // 마감 120일이 지난 공고는 정리
    .sort((a, b) => (a.end || "9999").localeCompare(b.end || "9999"));
}

async function main() {
  const prev = load();
  const sources = [];
  let fresh = [];
  for (const s of SOURCES) {
    try {
      const r = await s.run();
      fresh = fresh.concat(r.items);
      sources.push({ key: s.key, name: s.name, url: s.url, ok: !r.note, count: r.items.length, note: r.note || "" });
    } catch (e) {
      sources.push({ key: s.key, name: s.name, url: s.url, ok: false, count: 0, note: String(e.message || e).slice(0, 160) });
    }
    console.log(sources.at(-1));
  }
  const items = merge(prev.items || [], fresh);
  const data = { updated: new Date().toISOString(), today: TODAY, sources, items };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, "/* 자동 생성: scripts/collect-notices.mjs */\nwindow.NOTICES = " + JSON.stringify(data, null, 1) + ";\n");
  console.log(`saved ${items.length} notices (${fresh.length} fetched today)`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
