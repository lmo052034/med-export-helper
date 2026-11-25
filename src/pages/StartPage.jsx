/* 입장 페이지: 업무 화면(홈) 전에 보이는 개괄 화면.
   참고: SaaSFrame 2026 랜딩 트렌드(적은 메뉴, 실제 화면을 첫 화면에), Front 홈(메일함 중심 첫 화면),
   Azuro 의료기기 사이트 사례(제품과 인허가 근거를 앞에). 받은 메일함에서 견적 요청 메일을 바로 열어 봄 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Calculator, ChevronRight, FileText, LayoutGrid, Mail, MailOpen, Plus } from "lucide-react";
import "@fontsource/geist-mono/latin-400.css";
import "@fontsource/geist-mono/latin-500.css";
import { PACK } from "@pack";
import { cn } from "@/lib/utils";

const TIMES = ["오늘 09:12", "오늘 08:40", "어제 17:25", "어제 10:03", "11월 21일", "11월 20일"];

function inbox() {
  const C = PACK.consult;
  const list = [];
  if (C?.mail) {
    const m = C.mail;
    list.push({
      id: "consult", main: true, from: m.from, fromTeam: m.fromTeam, to: m.to, toTeam: m.toTeam,
      subject: m.subject, body: m.body,
      actions: [{ to: "/price", label: "이 요청으로 견적 검토하기", primary: true }, { to: "/", label: "업무 화면 홈에서 보기" }],
    });
  }
  (PACK.flow?.cases || []).forEach((c) => list.push({
    id: c.id, from: c.from, fromTeam: "", to: C?.mail?.to || "", toTeam: C?.mail?.toTeam || "",
    subject: c.subject || c.ask, body: [c.ask],
    actions: [{ to: `/?case=${c.id}`, label: "업무 화면에서 처리하기", primary: true }],
  }));
  return list.map((x, i) => ({ ...x, time: TIMES[i] || "" }));
}

function Inbox() {
  const mails = inbox();
  const [sel, setSel] = useState(mails[0]?.id);
  const [read, setRead] = useState(() => new Set());
  const reader = useRef(null);
  const cur = mails.find((x) => x.id === sel) || mails[0];
  useEffect(() => { if (cur) setRead((r) => new Set(r).add(cur.id)); }, [cur?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!cur) return null;
  const open = (id) => {
    setSel(id);
    if (window.matchMedia?.("(max-width: 1023px)").matches) setTimeout(() => reader.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };
  const unread = mails.filter((x) => !read.has(x.id)).length;
  const row = (k, v) => (<div className="flex gap-3"><dt className="w-[68px] shrink-0 text-[#6e6e73]">{k}</dt><dd className="min-w-0">{v}</dd></div>);
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]" data-testid="inbox">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3 sm:px-5">
        <p className="text-[14px] font-semibold">받은 메일함 <span className="ml-1 font-normal text-[#6e6e73] tabular-nums">{mails.length}통{unread ? `, 안 읽음 ${unread}` : ""}</span></p>
        <span className="text-[12px] text-[#86868b]">시연용 메일</span>
      </div>
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <ul className="divide-y divide-[var(--line)] border-b border-[var(--line)] lg:border-r lg:border-b-0" aria-label="메일 목록">
          {mails.map((x) => {
            const active = x.id === cur.id, isNew = !read.has(x.id);
            return (
              <li key={x.id}>
                <button type="button" onClick={() => open(x.id)} aria-current={active ? "true" : undefined} data-testid={`inbox-${x.id}`}
                  className={cn("flex w-full gap-3 px-4 py-3.5 text-left sm:px-5", active ? "bg-[var(--fill-soft)]" : "hover:bg-[var(--fill-soft)]")}>
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", isNew ? "bg-primary" : "bg-transparent")} aria-label={isNew ? "안 읽음" : undefined} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className={cn("truncate text-[14px]", isNew ? "font-semibold" : "text-[#424245]")}>{x.from}</span>
                      <span className="shrink-0 text-[12px] text-[#86868b] tabular-nums">{x.time}</span>
                    </span>
                    <span className={cn("mt-0.5 block truncate text-[14px]", isNew || active ? "text-[#1d1d1f]" : "text-[#424245]", x.main && "font-semibold")}>{x.subject}</span>
                    <span className="mt-0.5 block truncate text-[13px] text-[#86868b]">{x.body[0]}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <article ref={reader} aria-label="메일 내용" className="scroll-mt-4 p-5 sm:p-6" data-testid="inbox-reader">
          <div className="mb-3 flex items-center gap-2 text-[12px] text-[#86868b]"><MailOpen className="size-4" aria-hidden="true" />{cur.time}</div>
          <h3 className="text-[19px] font-semibold leading-snug tracking-tight">{cur.subject}</h3>
          <dl className="mt-3 space-y-1 border-b border-[var(--line)] pb-3 text-[14px]">
            {row("보낸 사람", [cur.from, cur.fromTeam].filter(Boolean).join(", "))}
            {cur.to && row("받는 사람", [cur.to, cur.toTeam].filter(Boolean).join(", "))}
            {row("제목", cur.subject)}
          </dl>
          <div className="mt-3 space-y-2 text-[15px] leading-relaxed text-[#1d1d1f]">
            {cur.body.map((t) => <p key={t}>{t}</p>)}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {cur.actions.map((a) => (
              <Link key={a.to} to={a.to} className={cn("inline-flex h-11 items-center gap-2 rounded-xl px-4 text-[15px] font-semibold", a.primary ? "bg-primary text-white hover:opacity-90" : "border border-[var(--line-strong)] text-[#1d1d1f] hover:bg-[var(--fill-soft)]")}>
                {a.label}{a.primary && <ArrowRight className="size-4" aria-hidden="true" />}
              </Link>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}

const MENU = [
  { to: "/", label: "업무 홈", Icon: LayoutGrid },
  { to: "/price", label: "수익성", Icon: Calculator },
  { to: "/deal", label: "거래와 서류", Icon: FileText },
];

const CLOCKS = [["SEOUL", "Asia/Seoul"], ["JAKARTA", "Asia/Jakarta"]];
const MONO = { fontFamily: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace' };
/* 사진 같은 질감: 아주 옅은 노이즈 */
const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .5 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  return (tz) => { try { return now.toLocaleTimeString("en-GB", { timeZone: tz, hour12: false }); } catch { return ""; } };
}

const brandLines = () => { const [a, ...b] = String(PACK.brand).split(" "); return b.length ? <>{a}<br />{b.join(" ")}</> : a; };

/* 첫 화면 구성 참고(2026-11-25 사용자 제공 캡처, land-book): Bricx, Apex.
   어두운 사진형 큰 구역 + 구역 안 알약 메뉴 + 왼쪽 아래 큰 흰 제목 + 오른쪽 아래 반투명 어두운 카드
   + 맨 아래 도시와 시각(고정폭 글꼴) + 구역 아래 회색 칸 줄. 강조색은 기존 청록 */
export default function StartPage() {
  const img = PACK.hero?.image;
  const count = inbox().length;
  const [show, setShow] = useState(false);
  const box = useRef(null);
  const clock = useClock();
  const toggle = () => { setShow((v) => !v); setTimeout(() => box.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0); };
  return (
    <div className="flex min-h-svh flex-col bg-[#f4f4f1] text-[#1d1d1f]" data-testid="start">
      <main id="main" className="flex-1 p-3 sm:p-4">
        <section className="relative isolate mx-auto flex min-h-[calc(100svh-1.5rem)] max-w-[1440px] flex-col overflow-hidden rounded-[22px] bg-[#e8ebe7] text-[#1d1d1f] sm:min-h-[calc(100svh-2rem)]">
          {/* 배경: 조명, 바닥면, 질감 */}
          <div aria-hidden="true" className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_55%_70%_at_62%_38%,#ffffff_0%,#f1f4f1_40%,#e3e8e4_80%)]" />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-20 hidden h-[24%] sm:block bg-[linear-gradient(180deg,#dde3df_0%,#d3dad5_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-[0.05] mix-blend-multiply" style={{ backgroundImage: GRAIN }} />
          {img && (
            <div aria-hidden="true" className="pointer-events-none absolute top-[11%] left-1/2 -z-10 h-[40%] -translate-x-1/2 sm:top-auto sm:bottom-[13%] sm:left-[60%] sm:h-[84%]">
              <div className="absolute -bottom-[2%] left-1/2 h-[6%] w-[90%] -translate-x-1/2 rounded-[50%] bg-black/25 blur-xl" />
              <img src={img} alt="" className="relative h-full w-auto object-contain [filter:saturate(0.8)] drop-shadow-[0_30px_40px_rgba(0,0,0,0.15)]" data-testid="start-photo" />
            </div>
          )}
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(232,235,231,0.9)_0%,rgba(232,235,231,0.4)_38%,rgba(232,235,231,0)_60%)]" />

          <header className="flex items-center gap-3 px-5 pt-5 sm:px-7 sm:pt-6">
            <span className="flex items-center gap-2.5">
              <span className="grid size-7 place-items-center rounded-md bg-primary text-white" aria-hidden="true"><Plus className="size-4" strokeWidth={3.2} /></span>
              <span className="hidden text-[15px] font-semibold tracking-[-0.01em] sm:inline">{PACK.brand}</span>
            </span>
            <nav aria-label="주요 화면" className="mx-auto hidden items-center gap-1 rounded-full bg-white/60 p-1 ring-1 ring-black/[0.06] backdrop-blur-md md:flex">
              {MENU.map(({ to, label }) => (
                <Link key={to} to={to} className="rounded-full px-3.5 py-1.5 text-[14px] font-medium text-[#424245] transition hover:bg-white hover:text-[#1d1d1f]">{label}</Link>
              ))}
            </nav>
            <button type="button" onClick={toggle} className="relative ml-auto grid size-9 place-items-center rounded-full bg-white/60 ring-1 ring-black/[0.06] backdrop-blur-md transition hover:bg-white md:ml-0" aria-label={`받은 메일 ${count}통`}>
              <Mail className="size-4" aria-hidden="true" />
              <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#ff3b30] px-1 text-[10px] font-bold text-white tabular-nums">{count}</span>
            </button>
            <Link to="/" className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#1d1d1f] px-4 text-[14px] font-semibold text-white transition hover:opacity-90">업무 화면<ArrowUpRight className="size-3.5" aria-hidden="true" /></Link>
          </header>

          <div className="mt-auto grid gap-8 px-5 pt-[48svh] pb-5 sm:px-7 sm:pt-24 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end">
            <div>
              <p className="flex items-center gap-2 text-[12px] tracking-[0.14em] text-[#6e6e73] uppercase" style={MONO}><span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />Partner Desk</p>
              <h1 className="mt-4 text-[44px] font-semibold leading-[1.04] tracking-[-0.035em] sm:text-[60px] lg:text-[70px]">{brandLines()}</h1>
            </div>

            <div className="rounded-[18px] bg-white/65 p-4 shadow-[0_20px_50px_rgba(30,50,45,0.10)] ring-1 ring-black/[0.06] backdrop-blur-xl sm:p-5">
              <div className="flex items-baseline justify-between">
                <p className="text-[19px] font-medium tracking-[-0.01em]">바로 가기</p>
                <p className="text-[11px] tracking-[0.1em] text-[#86868b]" style={MONO}>MENU</p>
              </div>
              <ul className="mt-4 grid grid-cols-1 gap-2">
                {MENU.map(({ to, label, Icon }) => (
                  <li key={to}>
                    <Link to={to} className="flex h-12 items-center gap-2.5 rounded-[10px] bg-white/80 px-3 text-[15px] text-[#1d1d1f] ring-1 ring-black/[0.05] transition hover:bg-white">
                      <Icon className="size-4 text-primary" strokeWidth={1.8} aria-hidden="true" />{label}<ChevronRight className="ml-auto size-4 text-[#aeaeb2]" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={toggle} aria-expanded={show} aria-controls="inbox-box" data-testid="mail-button" className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1d1d1f] text-[15px] font-semibold text-white transition hover:opacity-90">
                <Mail className="size-4" aria-hidden="true" />받은 메일 열기<span className="rounded-full bg-[#ff3b30] px-1.5 text-[11px] font-bold text-white tabular-nums">{count}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-black/[0.06] px-5 py-3 text-[11px] tracking-[0.08em] text-[#86868b] sm:px-7" style={MONO}>
            {CLOCKS.map(([city, tz]) => (<span key={city}>{city}<span className="ml-2 text-[#aeaeb2]">[ {clock(tz)} ]</span></span>))}
          </div>
        </section>

        {show && (
          <section id="inbox-box" ref={box} aria-label="받은 메일함" className="mx-auto mt-4 max-w-[1440px] scroll-mt-4">
            <Inbox />
          </section>
        )}
      </main>
    </div>
  );
}
