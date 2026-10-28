/* 화면 틀: shadcn Sidebar(inset) + 머리줄, 페이지 머리말, 이전·다음 단계, 알림, AI 질문 창 */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { toast as sonner } from "sonner";
import { Home, BookOpen, ClipboardList, Package, ArrowRight, ArrowLeft, Copy, ExternalLink, Save, ShieldCheck } from "lucide-react";
import { STEPS, PARTS, addLog, copyText } from "../lib/store.js";
import { Button, Field, Input, Select, Textarea, Badge } from "./ui.jsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog.jsx";
import { Toaster } from "./ui/sonner.jsx";
import { Separator } from "./ui/separator.jsx";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb.jsx";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "./ui/sidebar.jsx";

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
            <pre className="whitespace-pre-wrap rounded-lg border bg-muted/40 p-4 text-sm leading-relaxed font-sans max-h-[36vh] overflow-auto">{pq.prompt}</pre>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" icon={Copy} onClick={() => copy(pq.prompt, "질문을 복사했어요")}>질문 복사</Button>
              <Button as="a" href="https://chatgpt.com/" target="_blank" rel="noopener" icon={ExternalLink}>ChatGPT 열기</Button>
            </div>
            <Separator />
            <div>
              <p className="font-semibold mb-1">확인한 결과 기록하기</p>
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

/* ---------- 왼쪽 메뉴 ---------- */
function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 rounded-md p-1.5 hover:bg-sidebar-accent">
      <span className="grid place-items-center size-8 rounded-lg bg-primary text-primary-foreground">
        <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M8 3v10" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>
      </span>
      <span className="grid leading-tight">
        <span className="text-sm font-semibold">의료기기 수출 도우미</span>
        <span className="text-xs text-muted-foreground">처음 수출하는 기업용</span>
      </span>
    </Link>
  );
}

function AppSidebar() {
  const { pathname } = useLocation();
  const { setOpenMobile } = useSidebar();
  const on = (p) => (p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/"));
  const close = () => setOpenMobile(false);
  return (
    <Sidebar variant="inset" className="no-print">
      <SidebarHeader><Brand /></SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={on("/")}><Link to="/" onClick={close}><Home /><span>시작하기</span></Link></SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>수출 8단계</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {STEPS.map((s) => (
                <SidebarMenuItem key={s.path}>
                  <SidebarMenuButton asChild isActive={on(s.path)}>
                    <Link to={s.path} onClick={close}>
                      <span className={"grid place-items-center size-5 rounded text-[11px] font-semibold tabular-nums " + (on(s.path) ? "bg-primary text-primary-foreground" : "bg-sidebar-accent text-muted-foreground")}>{s.n}</span>
                      <span>{s.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>참고</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={on("/cases")}><Link to="/cases" onClick={close}><BookOpen /><span>KOTRA AI 사례 11개</span></Link></SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="rounded-lg border bg-background p-3 text-xs text-muted-foreground leading-relaxed shadow-xs">
          <p className="flex items-center gap-1.5 font-medium text-foreground mb-1"><ShieldCheck className="size-3.5 text-primary" /> 이 브라우저에만 저장</p>
          숫자·세율·인증·공고는 꼭 원문으로 확인하세요.
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function SiteHeader() {
  const { pathname } = useLocation();
  const s = STEPS.find((x) => pathname === x.path || pathname.startsWith(x.path + "/"));
  const label = s ? `${s.n} ${s.name}` : pathname.startsWith("/cases") ? "KOTRA AI 사례" : null;
  return (
    <header className="no-print sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 border-b bg-background/90 backdrop-blur px-4 md:rounded-t-xl">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className={label ? "hidden sm:inline-flex" : ""}>
            {label ? <BreadcrumbLink asChild><Link to="/">수출 도우미</Link></BreadcrumbLink> : <BreadcrumbPage>수출 도우미</BreadcrumbPage>}
          </BreadcrumbItem>
          {label && <BreadcrumbSeparator className="hidden sm:block" />}
          {label && <BreadcrumbItem><BreadcrumbPage>{label}</BreadcrumbPage></BreadcrumbItem>}
        </BreadcrumbList>
      </Breadcrumb>
      <Badge tone="outline" className="ml-auto hidden sm:inline-flex font-normal text-muted-foreground">화면의 회사·제품은 가상 예시</Badge>
    </header>
  );
}

export function Layout({ children }) {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">{children}</div>
        <footer className="no-print mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pb-8 pt-2 text-xs text-muted-foreground">에프킬라 · 의료기기 수출 도우미 · 화면의 회사·제품은 가상 예시입니다</footer>
      </SidebarInset>
    </SidebarProvider>
  );
}

/* ---------- 페이지 머리말 ---------- */
const GUIDE_ICON = [ClipboardList, Package, ArrowRight];
export function PageHeader({ path, desc, guide, actions }) {
  const s = STEPS.find((x) => x.path === path);
  return (
    <header className="mb-6 sm:mb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="teal" className="tabular-nums">STEP {s.n}</Badge>
            <span className="text-xs text-muted-foreground">{s.kc} 방식</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">{s.name}</h1>
        </div>
        {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
      </div>
      <p className="mt-2 max-w-3xl text-muted-foreground leading-relaxed">{desc || s.what}</p>
      {guide && (
        <div className="no-print mt-5 grid sm:grid-cols-3 rounded-xl border bg-card shadow-xs divide-y sm:divide-y-0 sm:divide-x">
          {guide.map(([k, v], i) => {
            const Icon = GUIDE_ICON[i] || ArrowRight;
            return (
              <div key={k} className="flex gap-3 px-4 py-3.5">
                <Icon className="size-4 text-primary shrink-0 mt-0.5" />
                <div className="grid gap-0.5">
                  <p className="text-xs font-medium text-muted-foreground">{k}</p>
                  <p className="text-sm">{v}</p>
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
  const box = "group flex items-center gap-3 rounded-xl border bg-card px-5 py-4 shadow-xs transition-colors hover:bg-accent";
  return (
    <div className="no-print mt-12 grid sm:grid-cols-2 gap-3">
      {prev ? (
        <Link to={prev.path} className={box}>
          <ArrowLeft className="size-4 text-muted-foreground" />
          <div><p className="text-xs text-muted-foreground">이전 단계 {prev.n}</p><p className="text-sm font-medium">{prev.name}</p></div>
        </Link>
      ) : <div className="hidden sm:block" />}
      <Link to={next ? next.path : "/cases"} className={box + " justify-end text-right"}>
        <div><p className="text-xs text-muted-foreground">{next ? `다음 단계 ${next.n}` : "참고"}</p><p className="text-sm font-medium text-primary">{next ? next.name : "KOTRA AI 사례 보기"}</p></div>
        <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
