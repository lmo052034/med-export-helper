/* 화면 틀: 위쪽에 거래명·저장 상태·주요 작업, 그 아래 메뉴 세 개(거래조건·검토 결과·서류 미리보기) */
import { useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { DropdownMenu } from "radix-ui";
import { ChevronDown, FileDown, FilePlus2, FileUp, FlaskConical, Trash2, X, Check, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useDeal } from "../../lib/deal/DealContext.jsx";
import { summarize } from "../../lib/deal/checks.js";
import { Toaster } from "../ui/sonner.jsx";
import { cn } from "@/lib/utils";

export const KIND = { user: "내 거래", mock: "모의 거래", case: "불러온 사례" };

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
            <DropdownMenu.Item className={item} onSelect={actions.newBlank}><FilePlus2 className="size-4" />새 거래 (빈칸)</DropdownMenu.Item>
            <DropdownMenu.Item className={item} onSelect={actions.openMock}><FlaskConical className="size-4" />모의 거래 열기</DropdownMenu.Item>
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

const TABS = [["/deal", "거래조건"], ["/review", "검토 결과"], ["/docs", "서류 미리보기"]];

export function AppShell({ children }) {
  const { deal, findings, notes, dismissNotes } = useDeal();
  const { pathname, search } = useLocation();
  const nav = useNavigate();
  const s = summarize(findings);
  const fromOld = new URLSearchParams(search).get("from") === "old";
  return (
    <div className="min-h-svh bg-white">
      <a href="#main" className="skip-link">본문으로 건너뛰기</a>
      <header className="app-header no-print sticky top-0 z-40 border-b border-[var(--line)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-4 gap-y-1 px-4 pt-2.5 sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-[#6e6e73]">의료기기 수출 거래서류 검토</p>
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
              <h1 className="truncate text-[17px] font-semibold tracking-tight">{deal.meta.name || "이름 없는 거래"}</h1>
              <span className={cn("text-[12px] font-medium", deal.kind === "user" ? "text-[#6e6e73]" : "text-amber-700")}>{deal.kind !== "user" && deal.caseLabel ? deal.caseLabel : KIND[deal.kind]}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden md:inline"><SaveStatus /></span>
            <DealMenu />
            <button type="button" onClick={() => nav("/docs?print=1")} className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-[13px] font-medium text-white hover:brightness-110">인쇄·PDF</button>
          </div>
        </div>
        <nav aria-label="주요 메뉴" className="mx-auto flex max-w-[1440px] items-end gap-1 overflow-x-auto px-2 sm:px-4">
          {TABS.map(([p, l]) => (
            <NavLink key={p} to={p} className={({ isActive }) => cn("tab-link", isActive && "is-active")}>
              {l}
              {p === "/review" && (s.fix > 0 ? <span className="ml-1.5 rounded bg-amber-100 px-1.5 text-[11px] font-semibold text-amber-800 tabular-nums">수정 {s.fix}</span> : s.confirm > 0 ? <span className="ml-1.5 text-[11px] text-[#6e6e73] tabular-nums">확인 {s.confirm}</span> : null)}
            </NavLink>
          ))}
          <span className="ml-auto pb-2 pr-2 md:hidden"><SaveStatus /></span>
        </nav>
      </header>
      {(notes.length > 0 || fromOld) && (
        <div className="no-print border-b border-[var(--line)] bg-[var(--fill-soft)]">
          <div className="mx-auto flex max-w-[1440px] items-start gap-3 px-4 py-2.5 text-[13px] sm:px-6">
            <div className="flex-1 space-y-0.5">
              {fromOld && <p>이전 메뉴(준비 진단·지원사업·KOTRA 사례 등)는 이번 개편에서 정리했어요. 거래조건부터 입력하세요.</p>}
              {notes.map((n, i) => <p key={i}>{n.text}</p>)}
            </div>
            <button type="button" aria-label="알림 닫기" onClick={() => { dismissNotes(); if (fromOld) nav(pathname, { replace: true }); }} className="rounded p-1 hover:bg-[var(--fill)]"><X className="size-4" /></button>
          </div>
        </div>
      )}
      <main id="main" tabIndex={-1} className="outline-none">{children}</main>
      <footer className="no-print border-t border-[var(--line)] px-4 py-5 text-[12px] leading-relaxed text-[#6e6e73] sm:px-6">
        <div className="mx-auto max-w-[1440px] space-y-1">
          <p>입력한 거래정보는 이 브라우저(localStorage)에만 저장돼요. 서버로 보내지 않고, 다른 기기에서는 보이지 않아요. 옮기려면 '거래 → 파일로 내보내기'를 쓰세요.</p>
          <p>검토는 입력값의 누락·계산·서류 간 일치를 규칙으로 확인해요. 법적 적합성, 통관 승인, 판매 가능 여부는 판단하지 않아요. · 에프킬라</p>
        </div>
      </footer>
      <Toaster position="bottom-center" />
    </div>
  );
}
