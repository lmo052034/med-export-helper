/* 화면 틀: 왼쪽 단계 메뉴, 페이지 머리말, 이전·다음 단계, 알림, AI 질문 창 */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { Menu, X, Home, BookOpen, ClipboardList, Package, ArrowRight, ArrowLeft, Copy, ExternalLink, Save } from "lucide-react";
import { STEPS, PARTS, addLog, copyText } from "../lib/store.js";
import { Button, Field, Input, Select, Textarea, cx } from "./ui.jsx";

/* ---------- 알림 + AI 질문 창 ---------- */
const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [msg, setMsg] = useState("");
  const timer = useRef();
  const toast = useCallback((m) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(""), 2400);
  }, []);
  const copy = useCallback(async (text, m) => {
    await copyText(text);
    toast(m || "복사했어요");
  }, [toast]);
  const [pq, setPq] = useState(null);
  const ask = useCallback((title, prompt, part) => setPq({ title, prompt, part }), []);

  return (
    <Ctx.Provider value={{ toast, copy, ask }}>
      {children}
      {pq && <PromptDialog {...pq} onClose={() => setPq(null)} toast={toast} copy={copy} />}
      <div
        role="status"
        className={cx(
          "fixed left-1/2 bottom-6 z-50 -translate-x-1/2 rounded-xl bg-graphite text-white px-4 py-2.5 text-[15px] font-semibold shadow-lg transition-all max-w-[calc(100%-32px)]",
          msg ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
        )}
      >
        {msg}
      </div>
    </Ctx.Provider>
  );
}

/* 프롬프트 보여 주기 → 복사 → 답을 받으면 확인 기록으로 저장 */
function PromptDialog({ title, prompt, part, onClose, toast, copy }) {
  const [f, setF] = useState({ part: PARTS.includes(part) ? part : PARTS[PARTS.length - 1], source: "", ai: "", fix: "" });
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [onClose]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-graphite/50 p-0 sm:p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full sm:max-w-2xl max-h-[92vh] overflow-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-7 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12.5px] font-bold text-brand-700">AI에게 묻기</p>
            <h3 className="text-xl font-bold mt-0.5">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="grid place-items-center size-9 rounded-full hover:bg-surface cursor-pointer" aria-label="닫기"><X size={20} /></button>
        </div>
        <ol className="mt-4 grid gap-1.5 text-[14px] text-ink-2">
          <li><b className="text-brand-700">1.</b> 질문을 복사해서 ChatGPT에 붙여 넣으세요.</li>
          <li><b className="text-brand-700">2.</b> 답에 나온 숫자·세율·인증은 '후보'로만 보고 공식 사이트에서 확인하세요.</li>
          <li><b className="text-brand-700">3.</b> 확인한 결과를 아래에 적으면 08 AI 답 확인 기록에 남아요.</li>
        </ol>
        <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-surface p-4 text-[14px] leading-relaxed font-sans max-h-[40vh] overflow-auto">{prompt}</pre>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button variant="primary" icon={Copy} onClick={() => copy(prompt, "질문을 복사했어요")}>질문 복사</Button>
          <Button as="a" href="https://chatgpt.com/" target="_blank" rel="noopener" icon={ExternalLink}>ChatGPT 열기</Button>
        </div>
        <div className="mt-6 pt-5 border-t border-line">
          <p className="text-[15px] font-bold mb-3">확인한 결과 기록하기</p>
          <div className="grid sm:grid-cols-2 gap-x-3">
            <Field label="분야"><Select value={f.part} onChange={set("part")} options={PARTS} /></Field>
            <Field label="확인한 공식자료"><Input value={f.source} onChange={set("source")} placeholder="예: UNI-PASS 세번 조회 화면 (날짜)" /></Field>
          </div>
          <Field label="AI 답 요약"><Textarea value={f.ai} onChange={set("ai")} placeholder="AI가 뭐라고 답했는지 한두 줄" className="min-h-20" /></Field>
          <Field label="고친 내용"><Input value={f.fix} onChange={set("fix")} placeholder="틀린 부분과 고친 내용 (맞았다면 '확인 결과 같음')" /></Field>
          <div className="flex gap-2">
            <Button icon={Save} onClick={() => { const n = addLog({ part: f.part, prompt, ai: f.ai, source: f.source, fix: f.fix }); toast(`AI 답 확인 기록에 저장했어요 (${n}건)`); onClose(); }}>기록에 저장</Button>
            <Button variant="ghost" onClick={onClose}>닫기</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 왼쪽 단계 메뉴 ---------- */
function NavList({ onPick }) {
  const item = ({ isActive }) =>
    cx("group flex items-center gap-3 rounded-xl px-3 h-11 text-[15px] font-semibold transition-colors", isActive ? "bg-brand-50 text-brand-800" : "text-ink-2 hover:bg-surface");
  return (
    <nav className="flex flex-col gap-0.5" onClick={onPick}>
      <NavLink to="/" end className={item}>
        <Home size={18} className="text-muted group-[.active]:text-brand-700" />
        시작하기
      </NavLink>
      <p className="px-3 mt-4 mb-1.5 text-[12px] font-bold text-muted">수출 8단계</p>
      {STEPS.map((s) => (
        <NavLink key={s.path} to={s.path} className={item}>
          {({ isActive }) => (
            <>
              <span className={cx("grid place-items-center size-7 rounded-lg text-[12.5px] font-bold tabular-nums", isActive ? "bg-brand-600 text-white" : "bg-surface text-muted")}>{s.n}</span>
              {s.name}
            </>
          )}
        </NavLink>
      ))}
      <p className="px-3 mt-4 mb-1.5 text-[12px] font-bold text-muted">참고</p>
      <NavLink to="/cases" className={item}>
        <BookOpen size={18} className="text-muted" />
        KOTRA AI 사례 11개
      </NavLink>
    </nav>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 font-bold text-[16.5px] text-ink">
      <span className="grid place-items-center size-8 rounded-xl bg-brand-600 text-white">
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M8 3v10" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>
      </span>
      의료기기 수출 도우미
    </Link>
  );
}

export function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); setOpen(false); }, [pathname]);
  return (
    <div className="min-h-screen lg:pl-72">
      <aside className="no-print hidden lg:flex fixed inset-y-0 left-0 w-72 flex-col border-r border-line bg-white px-4 py-5">
        <div className="px-2 mb-6"><Brand /></div>
        <div className="flex-1 overflow-y-auto -mx-1 px-1"><NavList /></div>
        <p className="px-2 pt-4 text-[12px] text-muted leading-relaxed">입력한 내용은 이 브라우저에만 저장돼요. 숫자·세율·인증·공고는 꼭 원문으로 확인하세요.</p>
      </aside>

      <header className="no-print lg:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-white/90 backdrop-blur border-b border-line">
        <Brand />
        <button type="button" onClick={() => setOpen(true)} className="grid place-items-center size-10 rounded-xl hover:bg-surface cursor-pointer" aria-label="메뉴 열기"><Menu size={22} /></button>
      </header>
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-graphite/40" onClick={() => setOpen(false)}>
          <div className="absolute inset-y-0 right-0 w-[86%] max-w-80 bg-white p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <Brand />
              <button type="button" onClick={() => setOpen(false)} className="grid place-items-center size-10 rounded-xl hover:bg-surface cursor-pointer" aria-label="메뉴 닫기"><X size={22} /></button>
            </div>
            <NavList onPick={(e) => e.target.closest("a") && setOpen(false)} />
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10 py-6 sm:py-10">{children}</main>
      <footer className="no-print mx-auto max-w-6xl px-4 sm:px-6 lg:px-10 pb-10 text-[13px] text-muted">에프킬라 · 의료기기 수출 도우미 · 화면의 회사·제품은 가상 예시입니다</footer>
    </div>
  );
}

/* ---------- 페이지 머리말 ---------- */
const GUIDE_ICON = [ClipboardList, Package, ArrowRight];
export function PageHeader({ path, desc, guide, actions }) {
  const s = STEPS.find((x) => x.path === path);
  return (
    <header className="mb-6 sm:mb-8">
      <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold">
        <span className="rounded-lg bg-brand-600 text-white px-2 py-0.5 tabular-nums">STEP {s.n}</span>
        <span className="text-muted">{s.kc} 방식</span>
      </div>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-[26px] sm:text-[32px] font-bold leading-tight">{s.name}</h1>
        {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
      </div>
      <p className="mt-2.5 max-w-3xl text-[16px] text-ink-2 leading-relaxed">{desc || s.what}</p>
      {guide && (
        <div className="no-print mt-5 grid sm:grid-cols-3 gap-2.5">
          {guide.map(([k, v], i) => {
            const Icon = GUIDE_ICON[i] || ArrowRight;
            return (
              <div key={k} className="flex gap-3 rounded-2xl bg-white border border-line px-4 py-3">
                <Icon size={18} className="text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[12.5px] font-bold text-muted">{k}</p>
                  <p className="text-[14.5px] text-ink">{v}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </header>
  );
}

/* ---------- 이전·다음 단계 ---------- */
export function StepPager({ path }) {
  const i = STEPS.findIndex((x) => x.path === path);
  const prev = STEPS[i - 1], next = STEPS[i + 1];
  return (
    <div className="no-print mt-12 grid sm:grid-cols-2 gap-3">
      {prev ? (
        <Link to={prev.path} className="flex items-center gap-3 rounded-2xl border border-line bg-white px-5 py-4 hover:border-brand-500">
          <ArrowLeft size={18} className="text-muted" />
          <div><p className="text-[12.5px] text-muted font-semibold">이전 단계 {prev.n}</p><p className="font-bold">{prev.name}</p></div>
        </Link>
      ) : <div className="hidden sm:block" />}
      {next ? (
        <Link to={next.path} className="flex items-center justify-end gap-3 rounded-2xl bg-brand-600 text-white px-5 py-4 hover:bg-brand-700 text-right">
          <div><p className="text-[12.5px] text-brand-100 font-semibold">다음 단계 {next.n}</p><p className="font-bold">{next.name}</p></div>
          <ArrowRight size={18} />
        </Link>
      ) : (
        <Link to="/cases" className="flex items-center justify-end gap-3 rounded-2xl bg-brand-600 text-white px-5 py-4 hover:bg-brand-700 text-right">
          <div><p className="text-[12.5px] text-brand-100 font-semibold">참고</p><p className="font-bold">KOTRA AI 사례 보기</p></div>
          <ArrowRight size={18} />
        </Link>
      )}
    </div>
  );
}
