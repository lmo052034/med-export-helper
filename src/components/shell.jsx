/* 화면 틀: apple.com 방식 위쪽 메뉴, 페이지 머리말, 이전·다음 단계, 알림, AI 질문 창 */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { toast as sonner } from "sonner";
import { ChevronLeft, ChevronRight, Copy, ExternalLink, Save, Menu, X } from "lucide-react";
import { STEPS, PARTS, addLog, copyText } from "../lib/store.js";
import { Button, Field, Input, Select, Textarea } from "./ui.jsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog.jsx";
import { Toaster } from "./ui/sonner.jsx";
import { Separator } from "./ui/separator.jsx";

/* ---------- 알림 + AI 질문 창 ---------- */
const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const toast = useCallback((m) => sonner(m), []);
  const copy = useCallback(async (text, m) => {
    await copyText(text);
    sonner.success(m || "복사했어요");
  }, []);
  const [pq, setPq] = useState(null);
  const ask = useCallback((title, prompt, part) => setPq({ title, prompt, part }), []);

  return (
    <Ctx.Provider value={{ toast, copy, ask }}>
      {children}
      <PromptDialog pq={pq} onClose={() => setPq(null)} toast={toast} copy={copy} />
      <Toaster position="bottom-center" />
    </Ctx.Provider>
  );
}

/* 프롬프트 보여 주기 → 복사 → 답을 받으면 확인 기록으로 저장 */
function PromptDialog({ pq, onClose, toast, copy }) {
  const [f, setF] = useState({ part: PARTS[0], source: "", ai: "", fix: "" });
  useEffect(() => {
    if (pq) setF({ part: PARTS.includes(pq.part) ? pq.part : PARTS[PARTS.length - 1], source: "", ai: "", fix: "" });
  }, [pq]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Dialog open={!!pq} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        {pq && (
          <>
            <DialogHeader>
              <p className="text-xs font-medium text-primary">AI에게 묻기</p>
              <DialogTitle>{pq.title}</DialogTitle>
              <DialogDescription>질문을 복사해서 ChatGPT에 붙여 넣고, 답에 나온 숫자·세율·인증은 공식 사이트에서 확인한 뒤 아래에 기록하세요.</DialogDescription>
            </DialogHeader>
            <pre className="whitespace-pre-wrap rounded-2xl bg-[rgba(120,120,128,0.08)] p-4 text-[15px] leading-relaxed font-sans max-h-[36vh] overflow-auto">{pq.prompt}</pre>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" icon={Copy} onClick={() => copy(pq.prompt, "질문을 복사했어요")}>질문 복사</Button>
              <Button as="a" href="https://chatgpt.com/" target="_blank" rel="noopener" icon={ExternalLink}>ChatGPT 열기</Button>
            </div>
            <Separator />
            <div>
              <p className="text-[17px] font-semibold mb-1">확인한 결과 기록하기</p>
              <p className="text-sm text-muted-foreground mb-4">적은 내용은 08 AI 답 확인 기록에 모여요.</p>
              <div className="grid sm:grid-cols-2 gap-x-3">
                <Field label="분야"><Select value={f.part} onChange={set("part")} options={PARTS} /></Field>
                <Field label="확인한 공식자료"><Input value={f.source} onChange={set("source")} placeholder="예: UNI-PASS 세번 조회 화면 (날짜)" /></Field>
              </div>
              <Field label="AI 답 요약"><Textarea value={f.ai} onChange={set("ai")} placeholder="AI가 뭐라고 답했는지 한두 줄" className="min-h-20" /></Field>
              <Field label="고친 내용"><Input value={f.fix} onChange={set("fix")} placeholder="틀린 부분과 고친 내용 (맞았다면 '확인 결과 같음')" /></Field>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose}>닫기</Button>
                <Button variant="primary" icon={Save} onClick={() => { const n = addLog({ part: f.part, prompt: pq.prompt, ai: f.ai, source: f.source, fix: f.fix }); toast(`AI 답 확인 기록에 저장했어요 (${n}건)`); onClose(); }}>기록에 저장</Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ---------- 위쪽 메뉴 (apple.com 방식: 반투명 전역 메뉴 + 단계 메뉴) ---------- */
const NAV = [["/", "시작하기"], ...STEPS.map((s) => [s.path, s.short]), ["/cases", "KOTRA 사례"]];
const isOn = (pathname, p) => (p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/"));

function GlobalNav() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  return (
    <nav className="no-print sticky top-0 z-40 bg-[rgba(251,251,253,0.8)] backdrop-blur-2xl backdrop-saturate-150 border-b border-black/[0.08]">
      <div className="mx-auto flex h-12 max-w-[1024px] items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-[14px] font-semibold text-[#1d1d1f]">
          <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true" className="text-primary"><rect width="16" height="16" rx="4.5" fill="currentColor" /><path d="M4.5 8h7M8 4.5v7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></svg>
          의료기기 수출 도우미
        </Link>
        <ul className="hidden lg:flex items-center gap-6">
          {NAV.slice(1).map(([p, label]) => (
            <li key={p}>
              <Link to={p} className={"text-[12px] tracking-[-0.01em] transition-colors " + (isOn(pathname, p) ? "text-[#1d1d1f]" : "text-[#1d1d1f]/70 hover:text-[#1d1d1f]")}>{label}</Link>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="메뉴" className="lg:hidden grid place-items-center size-9 -mr-2 text-[#1d1d1f]">
          {open ? <X className="size-5" strokeWidth={1.5} /> : <Menu className="size-5" strokeWidth={1.5} />}
        </button>
      </div>
      {open && (
        <div className="lg:hidden border-t border-black/[0.06] bg-[rgba(251,251,253,0.97)] backdrop-blur-2xl">
          <ul className="mx-auto max-w-[1024px] px-6 py-4">
            {NAV.map(([p, label], i) => (
              <li key={p}>
                <Link to={p} className={"flex items-baseline gap-3 py-2.5 text-[24px] font-semibold tracking-tight " + (isOn(pathname, p) ? "text-[#1d1d1f]" : "text-[#1d1d1f]/60")}>
                  {i > 0 && i <= STEPS.length && <span className="text-[13px] font-medium tabular-nums text-[#86868b]">{STEPS[i - 1].n}</span>}
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}

/* 단계 페이지 아래에 붙는 로컬 메뉴 (제품 이름 + 다음 버튼) */
function LocalNav() {
  const { pathname } = useLocation();
  const i = STEPS.findIndex((x) => isOn(pathname, x.path));
  if (i < 0) return null;
  const s = STEPS[i], next = STEPS[i + 1];
  return (
    <div className="no-print sticky top-12 z-30 bg-[rgba(255,255,255,0.72)] backdrop-blur-2xl backdrop-saturate-150 border-b border-black/[0.08]">
      <div className="mx-auto flex h-[52px] max-w-[1024px] items-center justify-between gap-4 px-4 sm:px-6">
        <p className="min-w-0 truncate text-[19px] sm:text-[21px] font-semibold tracking-tight text-[#1d1d1f]">{s.name}</p>
        <div className="flex shrink-0 items-center gap-4">
          <span className="hidden sm:inline text-[12px] tabular-nums text-[#86868b]">{s.n} / {String(STEPS.length).padStart(2, "0")}</span>
          <Link to={next ? next.path : "/cases"} className="press inline-flex h-7 items-center rounded-full bg-primary px-3 text-[12px] font-medium text-primary-foreground">
            {next ? "다음 단계" : "사례 보기"}
          </Link>
        </div>
      </div>
    </div>
  );
}

export function Layout({ children }) {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  const home = pathname === "/";
  return (
    <div className="min-h-svh bg-[#f5f5f7]">
      <GlobalNav />
      <LocalNav />
      <main className={home ? "" : "mx-auto w-full max-w-[1024px] px-4 sm:px-6 pt-10 pb-16 sm:pt-16"}>{children}</main>
      <footer className="no-print border-t border-black/[0.08] bg-[#f5f5f7]">
        <div className="mx-auto max-w-[1024px] px-4 sm:px-6 py-6 text-[12px] leading-relaxed text-[#6e6e73]">
          <p>숫자·세율·인증·공고는 꼭 원문으로 확인하세요. 입력한 내용은 이 브라우저에만 저장돼요.</p>
          <p className="mt-2 pt-2 border-t border-black/[0.08]">에프킬라 · 의료기기 수출 도우미 · 화면의 회사·제품은 가상 예시입니다</p>
        </div>
      </footer>
    </div>
  );
}

/* ---------- 페이지 머리말 (apple.com 섹션 제목 방식) ---------- */
export function PageHeader({ path, desc, guide, actions }) {
  const s = STEPS.find((x) => x.path === path);
  return (
    <header className="mb-10 sm:mb-14">
      <p className="text-[17px] font-semibold text-primary tabular-nums">STEP {s.n}</p>
      <h1 className="mt-2 text-[36px] leading-[1.11] sm:text-[56px] sm:leading-[1.07] font-semibold tracking-[-0.035em] text-[#1d1d1f]">{s.name}</h1>
      <p className="mt-4 max-w-[720px] text-[19px] sm:text-[21px] leading-[1.38] text-[#6e6e73]">{desc || s.what}</p>
      <p className="mt-3 text-[13px] text-[#86868b]">{s.kc} 방식</p>
      {actions && <div className="no-print mt-7 flex flex-wrap items-center gap-3">{actions}</div>}
      {guide && (
        <dl className="no-print mt-10 grid sm:grid-cols-3 gap-6 sm:gap-8 border-t border-black/[0.08] pt-8">
          {guide.map(([k, v]) => (
            <div key={k}>
              <dt className="text-[14px] font-semibold text-[#1d1d1f]">{k}</dt>
              <dd className="mt-1.5 text-[17px] leading-[1.47] text-[#6e6e73]">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
}

/* ---------- 이전·다음 단계 ---------- */
export function StepPager({ path }) {
  const i = STEPS.findIndex((x) => x.path === path);
  const prev = STEPS[i - 1], next = STEPS[i + 1];
  return (
    <nav className="no-print mt-16 grid sm:grid-cols-2 gap-4 border-t border-black/[0.08] pt-8">
      {prev ? (
        <Link to={prev.path} className="group">
          <p className="text-[13px] text-[#86868b]">이전 단계 {prev.n}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-[21px] font-semibold text-[#1d1d1f] group-hover:text-primary"><ChevronLeft className="size-5" strokeWidth={2} />{prev.name}</p>
        </Link>
      ) : <div className="hidden sm:block" />}
      <Link to={next ? next.path : "/cases"} className="group sm:text-right">
        <p className="text-[13px] text-[#86868b]">{next ? `다음 단계 ${next.n}` : "참고"}</p>
        <p className="mt-1 inline-flex items-center gap-1 text-[21px] font-semibold text-primary">{next ? next.name : "KOTRA AI 사례 보기"}<ChevronRight className="size-5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} /></p>
      </Link>
    </nav>
  );
}
