/* 화면 틀: 위쪽에 거래명·저장 상태·주요 작업, 그 아래 메뉴 세 개(거래조건·검토 결과·서류 미리보기) */
import { useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { DropdownMenu } from "radix-ui";
import { ChevronDown, FileDown, FilePlus2, FileUp, FlaskConical, Trash2, X, Check, Loader2, AlertTriangle, Menu, Star } from "lucide-react";
import { PACK } from "@pack";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "../ui/sheet.jsx";
import { toast } from "sonner";
import { useDeal } from "../../lib/deal/DealContext.jsx";
import { summarize } from "../../lib/deal/checks.js";
import { Toaster } from "../ui/sonner.jsx";
import { cn } from "@/lib/utils";

export const KIND = { user: "내 거래", mock: "연습용 거래", case: "불러온 사례", sample: "진행 중 거래" };

function SaveStatus() {
  const { status } = useDeal();
  if (status.kind === "saving") return <span className="inline-flex items-center gap-1 text-[12px] text-[#6e6e73]"><Loader2 className="size-3 animate-spin" />저장 중</span>;
  if (status.kind === "error") return <span className="inline-flex items-center gap-1 text-[12px] text-amber-700" role="status"><AlertTriangle className="size-3" />저장 안 됨: {status.text}</span>;
  return <span className="inline-flex items-center gap-1 text-[12px] text-[#6e6e73]" role="status"><Check className="size-3" />이 브라우저에 저장됨 {status.at.toTimeString().slice(0, 5)}</span>;
}

function DealMenu() {
  const { deal, deals, actions } = useDeal();
  const file = useRef(null);
  const item = "flex items-center gap-2 rounded-md px-2.5 py-2 text-[14px] outline-none data-[highlighted]:bg-[var(--fill)] cursor-pointer";
  const onFile = async (e) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    try { const d = actions.importText(await f.text()); toast.success(`'${d.meta.name || f.name}'을(를) 새 거래로 열었어요. 기존 거래는 그대로예요.`); }
    catch (err) { toast.error("이 파일은 거래 데이터로 읽을 수 없어요."); }
  };
  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([actions.exportText()], { type: "application/json" }));
    a.download = `${(deal.meta.no || deal.meta.name || "deal").replace(/[^\w가-힣-]+/g, "_")}.json`;
    a.click();
  };
  return (
    <>
      <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={onFile} aria-hidden="true" tabIndex={-1} />
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="inline-flex h-8 items-center gap-1 rounded-md border border-[var(--line-strong)] bg-white px-2.5 text-[13px] font-medium hover:bg-[var(--fill)]">거래 <ChevronDown className="size-3.5" /></DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" sideOffset={6} className="z-50 w-72 rounded-lg border border-[var(--line)] bg-white p-1.5 shadow-[0_12px_32px_rgb(0_0_0/0.12)]">
            <DropdownMenu.Label className="px-2.5 pt-1 pb-1.5 text-[12px] text-[#6e6e73]">저장된 거래 {deals.length}건</DropdownMenu.Label>
            <DropdownMenu.RadioGroup value={deal.id} onValueChange={actions.switchTo}>
              {deals.map((x) => (
                <DropdownMenu.RadioItem key={x.id} value={x.id} className={item}>
                  <span className="w-4">{x.id === deal.id && <Check className="size-4 text-primary" />}</span>
                  <span className="min-w-0 flex-1 truncate">{x.meta.name || "이름 없는 거래"}</span>
                  <span className="text-[11px] text-[#86868b]">{KIND[x.kind]}</span>
                </DropdownMenu.RadioItem>
              ))}
            </DropdownMenu.RadioGroup>
            <DropdownMenu.Separator className="my-1 h-px bg-[var(--line)]" />
            <DropdownMenu.Item className={item} onSelect={actions.openSample}><Star className="size-4" />진행 중 거래 열기</DropdownMenu.Item>
            <DropdownMenu.Item className={item} onSelect={actions.newBlank}><FilePlus2 className="size-4" />새 거래 (빈칸)</DropdownMenu.Item>
            <DropdownMenu.Item className={item} onSelect={actions.openMock}><FlaskConical className="size-4" />연습용 거래 열기</DropdownMenu.Item>
            <DropdownMenu.Item className={item} onSelect={() => file.current?.click()}><FileUp className="size-4" />사례 파일 불러오기 (JSON)</DropdownMenu.Item>
            <DropdownMenu.Item className={item} onSelect={download}><FileDown className="size-4" />이 거래를 파일로 내보내기</DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 h-px bg-[var(--line)]" />
            <DropdownMenu.Item className={cn(item, "text-amber-700")} onSelect={() => { if (confirm(`'${deal.meta.name || "이름 없는 거래"}'을(를) 이 브라우저에서 삭제할까요? 되돌릴 수 없어요.`)) { actions.deleteActive(); toast("거래를 삭제했어요."); } }}><Trash2 className="size-4" />이 거래 삭제</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </>
  );
}

const MENU = [["/", "업무 현황"], ["/price", "견적과 마진"], ["/hospital", "병원 제안"], ["/deal", "선적 서류"], ["/evidence", "자료실"]];
const DOC_GROUP = ["/deal", "/review", "/docs"];
const SUBTABS = [["/deal", "거래조건 입력"], ["/review", "검토 결과"], ["/docs", "서류 미리보기"]];
const isActive = (p, pathname) => (p === "/deal" ? DOC_GROUP.includes(pathname) : p === pathname);

function DealBar({ showTabs }) {
  const { deal, findings } = useDeal();
  const s = summarize(findings);
  const nav = useNavigate();
  const { pathname } = useLocation();
  return (
    <div className="no-print border-b border-[var(--line)] bg-white">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-4 gap-y-1 px-4 pt-2.5 pb-2 sm:px-6">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
            {showTabs ? <h1 className="truncate text-[15px] leading-normal font-semibold tracking-tight" data-testid="deal-name">{deal.meta.name || "이름 없는 거래"}</h1> : <span className="truncate text-[15px] font-semibold tracking-tight" data-testid="deal-name">{deal.meta.name || "이름 없는 거래"}</span>}
            <span className={cn("text-[12px] font-medium", deal.kind === "user" ? "text-[#6e6e73]" : "text-amber-700")}>{KIND[deal.kind]}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden md:inline"><SaveStatus /></span>
          <DealMenu />
          {showTabs && <button type="button" onClick={() => nav("/docs?print=1")} className="inline-flex h-8 items-center rounded-full bg-primary px-3.5 text-[13px] font-medium text-white hover:brightness-110">인쇄·PDF</button>}
        </div>
      </div>
      {showTabs && (
        <nav aria-label="거래서류 메뉴" className="mx-auto flex max-w-[1200px] items-end gap-1 overflow-x-auto px-2 sm:px-4">
          {SUBTABS.map(([p, l]) => (
            <NavLink key={p} to={p} className={({ isActive }) => cn("tab-link", isActive && "is-active")}>
              {l}
              {p === "/review" && (s.fix > 0 ? <span className="ml-1.5 rounded bg-amber-100 px-1.5 text-[11px] font-semibold text-amber-800 tabular-nums">수정 {s.fix}</span> : s.confirm > 0 ? <span className="ml-1.5 text-[11px] text-[#6e6e73] tabular-nums">확인 {s.confirm}</span> : null)}
            </NavLink>
          ))}
          <span className="ml-auto pb-2 pr-2 md:hidden"><SaveStatus /></span>
        </nav>
      )}
    </div>
  );
}

export function AppShell({ children }) {
  const { notes, dismissNotes } = useDeal();
  const { pathname, search } = useLocation();
  const nav = useNavigate();
  const [menu, setMenu] = useState(false);
  const fromOld = new URLSearchParams(search).get("from") === "old";
  const work = pathname !== "/" && pathname !== "/evidence" && pathname !== "/hospital";
  return (
    <div className="min-h-svh bg-white">
      <a href="#main" className="skip-link">본문으로 건너뛰기</a>
      <header className="app-header no-print sticky top-0 z-40 border-b border-[var(--line)] bg-white">
        <div className="mx-auto flex h-12 max-w-[1200px] items-center gap-6 px-4 sm:px-6">
          <Link to="/" className="shrink-0 text-[15px] font-semibold tracking-tight">{PACK.brand}</Link>
          <nav aria-label="주요 메뉴" className="ml-auto hidden h-full items-stretch gap-1 md:flex">
            {MENU.map(([p, l]) => (
              <Link key={p} to={p} aria-current={isActive(p, pathname) ? "page" : undefined} className={cn("top-link", isActive(p, pathname) && "is-active")}>{l}</Link>
            ))}
          </nav>
          <button type="button" className="ml-auto grid size-10 place-items-center rounded-full hover:bg-[var(--fill)] md:hidden" aria-label="메뉴 열기" aria-expanded={menu} onClick={() => setMenu(true)}><Menu className="size-5" /></button>
        </div>
      </header>
      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="right" className="w-[min(86vw,340px)] p-0 gap-0">
          <div className="border-b border-[var(--line)] px-5 pt-5 pb-4"><SheetTitle className="text-[17px]">{PACK.brand}</SheetTitle><SheetDescription className="text-[13px]">메뉴</SheetDescription></div>
          <nav aria-label="모바일 메뉴" className="flex flex-col p-2">
            {MENU.map(([p, l]) => (
              <Link key={p} to={p} onClick={() => setMenu(false)} aria-current={isActive(p, pathname) ? "page" : undefined} className={cn("rounded-xl px-4 py-3.5 text-[17px]", isActive(p, pathname) ? "bg-[var(--fill-soft)] font-semibold text-primary" : "hover:bg-[var(--fill-soft)]")}>{l}</Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      {work && <DealBar showTabs={DOC_GROUP.includes(pathname)} />}
      {(notes.length > 0 || fromOld) && (
        <div className="no-print border-b border-[var(--line)] bg-[var(--fill-soft)]">
          <div className="mx-auto flex max-w-[1200px] items-start gap-3 px-4 py-2.5 text-[13px] sm:px-6">
            <div className="flex-1 space-y-0.5">
              {fromOld && <p>이전 메뉴(준비 진단, 지원사업, KOTRA 사례 등)는 정리했어요. 거래조건은 '거래서류'에서 입력해요.</p>}
              {notes.map((n, i) => <p key={i}>{n.text}</p>)}
            </div>
            <button type="button" aria-label="알림 닫기" onClick={() => { dismissNotes(); if (fromOld) nav(pathname, { replace: true }); }} className="rounded p-1 hover:bg-[var(--fill)]"><X className="size-4" /></button>
          </div>
        </div>
      )}
      <main id="main" tabIndex={-1} className="outline-none">{children}</main>
      <footer className="no-print border-t border-[var(--line)] bg-[var(--surface-2)] py-8 text-[12px] leading-relaxed text-[#6e6e73]">
        <div className="mx-auto grid max-w-[1200px] gap-4 px-4 sm:grid-cols-[1fr_auto] sm:px-6">
          <div className="space-y-1">
            <p className="font-medium text-[#424245]">{PACK.footer.project}</p>
            {(PACK.footer.lines || []).map((t, i) => <p key={i}>{t}</p>)}
            <p>숫자마다 출처(회사 자료, 공개자료, 내부 설정값)를 근거자료에 남겨 둡니다. {PACK.asOf}.</p>
            <p>작업 내용은 지금 쓰는 브라우저에 저장돼요. 계산과 서류 점검은 입력값과 규칙으로 하며, 통관과 판매 허가는 담당 기관 확인을 거쳐 진행합니다.</p>
          </div>
          <Link to="/evidence" className="self-start text-[13px] font-medium text-primary">근거자료 보기</Link>
        </div>
      </footer>
      <Toaster position="bottom-center" />
    </div>
  );
}
