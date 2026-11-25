/* 입장 페이지: 업무 화면(홈) 전에 보이는 개괄 화면.
   참고: SaaSFrame 2026 랜딩 트렌드(적은 메뉴, 실제 화면을 첫 화면에), Front 홈(메일함 중심 첫 화면),
   Azuro 의료기기 사이트 사례(제품과 인허가 근거를 앞에). 받은 메일함에서 견적 요청 메일을 바로 열어 봄 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calculator, FileText, LayoutGrid, Mail, MailOpen, Plus } from "lucide-react";
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

const TILES = [
  { to: "/", label: "업무 홈", Icon: LayoutGrid },
  { to: "/price", label: "수익성", Icon: Calculator },
  { to: "/deal", label: "거래와 서류", Icon: FileText },
];

/* 첫 화면 구성 참고(2026-11-25 사용자 제공 캡처): land-book 수록 Bricx, Apex 첫 화면
   = 화면 높이 둥근 큰 구역 + 구역 안 위쪽 메뉴 + 왼쪽 아래 큰 제목과 짧은 선 라벨 + 오른쪽 아래 카드.
   색은 기존(흰색, 회색, 청록 그라데이션) 유지, 사진 대신 로고 모양을 크게 흐리게 */
const brandLines = () => { const [a, ...b] = String(PACK.brand).split(" "); return b.length ? <>{a}<br />{b.join(" ")}</> : a; };

export default function StartPage() {
  const count = inbox().length;
  const [show, setShow] = useState(false);
  const box = useRef(null);
  const toggle = () => { setShow((v) => !v); setTimeout(() => box.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0); };
  const tile = "flex aspect-[4/3] w-full flex-col items-center justify-center gap-2.5 rounded-xl border border-[var(--line)] bg-white text-[14px] font-semibold transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_8px_24px_rgba(13,122,108,0.10)]";
  return (
    <div className="flex min-h-svh flex-col bg-white text-[#1d1d1f]" data-testid="start">
      <main id="main" className="flex-1 p-3 sm:p-4">
        <section className="relative isolate mx-auto flex max-w-[1400px] flex-col min-h-[calc(100svh-1.5rem)] overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#f7f8f9_0%,#eef5f3_55%,#e3efec_100%)] sm:min-h-[calc(100svh-2rem)]">
          {/* 큰 로고 모양 (사진 자리) */}
          <Plus aria-hidden="true" strokeWidth={2.2} className="pointer-events-none absolute -top-[12%] -right-[8%] -z-10 size-[520px] text-[#dce9e6] sm:size-[760px]" />

          <header className="flex items-center gap-3 px-5 pt-5 sm:px-8 sm:pt-7">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-white" aria-hidden="true"><Plus className="size-5" strokeWidth={3} /></span>
            <span className="hidden text-[15px] font-semibold tracking-tight sm:inline">{PACK.brand}</span>
            <button type="button" onClick={toggle} className="relative ml-auto grid size-10 place-items-center rounded-full bg-white/70 ring-1 ring-[var(--line)] backdrop-blur hover:bg-white" aria-label={`받은 메일 ${count}통`}>
              <Mail className="size-[18px]" aria-hidden="true" />
              <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#ff3b30] px-1 text-[10px] font-bold text-white tabular-nums">{count}</span>
            </button>
            <Link to="/" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#1d1d1f] whitespace-nowrap px-4 text-[14px] font-semibold text-white hover:opacity-90">업무 화면<ArrowRight className="size-4" aria-hidden="true" /></Link>
          </header>

          <div className="mt-auto grid gap-8 px-5 pt-20 pb-6 sm:px-8 sm:pb-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end">
            <div>
              <h1 className="text-[52px] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-[88px] lg:text-[104px]">{brandLines()}</h1>
              <p className="mt-6 flex items-center gap-3 text-[12px] font-medium tracking-[0.22em] text-[#6e6e73] uppercase"><span className="h-px w-10 bg-primary" aria-hidden="true" />Partner Desk</p>
            </div>

            <nav aria-label="바로 가기" className="rounded-2xl bg-white/75 p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_rgba(13,122,108,0.08)] ring-1 ring-[var(--line)] backdrop-blur-md sm:p-4">
              <div className="grid grid-cols-2 gap-2.5">
                <button type="button" onClick={toggle} aria-expanded={show} aria-controls="inbox-box" data-testid="mail-button" className={cn(tile, show && "border-primary")}>
                  <span className="relative">
                    <Mail className="size-8 text-primary" strokeWidth={1.6} aria-hidden="true" />
                    <span className="absolute -top-1.5 -right-2.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#ff3b30] px-1 text-[11px] font-bold text-white tabular-nums">{count}</span>
                  </span>
                  받은 메일
                </button>
                {TILES.map(({ to, label, Icon }) => (
                  <Link key={to} to={to} className={tile}><Icon className="size-8 text-primary" strokeWidth={1.6} aria-hidden="true" />{label}</Link>
                ))}
              </div>
            </nav>
          </div>
        </section>

        {show && (
          <section id="inbox-box" ref={box} aria-label="받은 메일함" className="mx-auto mt-4 max-w-[1400px] scroll-mt-4">
            <Inbox />
          </section>
        )}
      </main>
    </div>
  );
}
