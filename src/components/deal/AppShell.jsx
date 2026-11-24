/* 화면 틀: 위쪽에 사이트 이름, 메뉴 세 개(홈, 수익성, 거래와 서류), 고정 사용자 이름. 서류 화면에서는 거래명과 하위 탭 */
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { PACK } from "@pack";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "../ui/sheet.jsx";
import { useDeal } from "../../lib/deal/DealContext.jsx";
import { summarize } from "../../lib/deal/checks.js";
import { Toaster } from "../ui/sonner.jsx";
import { cn } from "@/lib/utils";
import { USER } from "../../lib/user.js";

const MENU = [["/", "홈"], ["/price", "수익성"], ["/deal", "거래와 서류"]];
const DOC_GROUP = ["/deal", "/review", "/docs"];
const SUBTABS = [["/deal", "거래조건 입력"], ["/review", "검토 결과"], ["/docs", "서류 미리보기"]];
const isActive = (p, pathname) => (p === "/deal" ? DOC_GROUP.includes(pathname) : p === pathname);

function DealBar() {
  const { deal, findings } = useDeal();
  const s = summarize(findings);
  return (
    <div className="no-print border-b border-[var(--line)] bg-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-2.5 pb-1 sm:px-6">
        <h1 className="truncate text-[15px] leading-normal font-semibold tracking-tight" data-testid="deal-name">{deal.meta.name || "이름 없는 거래"}</h1>
      </div>
      <nav aria-label="거래서류 메뉴" className="mx-auto flex max-w-[1200px] items-end gap-1 overflow-x-auto px-2 sm:px-4">
        {SUBTABS.map(([p, l]) => (
          <NavLink key={p} to={p} className={({ isActive }) => cn("tab-link", isActive && "is-active")}>
            {l}
            {p === "/review" && (s.fix > 0 ? <span className="ml-1.5 rounded bg-amber-100 px-1.5 text-[11px] font-semibold text-amber-800 tabular-nums">수정 {s.fix}</span> : s.confirm > 0 ? <span className="ml-1.5 text-[11px] text-[#6e6e73] tabular-nums">확인 {s.confirm}</span> : null)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function UserChip() {
  return (
    <span className="flex items-center gap-2 text-[13px]" aria-label={`사용자 ${USER.name}`}>
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--fill)] text-[12px] font-semibold text-[#424245]" aria-hidden="true">{USER.name.slice(0, 1)}</span>
      <span className="hidden leading-tight sm:block"><span className="block font-medium">{USER.name}</span><span className="block text-[11px] text-[#6e6e73]">{USER.team}</span></span>
    </span>
  );
}

export function AppShell({ children }) {
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(false);
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  if (pathname === "/start") return <>{children}<Toaster /></>;
  return (
    <div className="min-h-svh bg-white">
      <a href="#main" className="skip-link">본문으로 건너뛰기</a>
      <header className="app-header no-print sticky top-0 z-40 border-b border-[var(--line)] bg-white">
        <div className="mx-auto flex h-12 max-w-[1200px] items-center gap-6 px-4 sm:px-6">
          <Link to="/start" className="shrink-0 text-[15px] font-semibold tracking-tight">{PACK.brand}</Link>
          <nav aria-label="주요 메뉴" className="ml-auto hidden h-full items-stretch gap-0.5 md:flex">
            {MENU.map(([p, l]) => (
              <Link key={p} to={p} aria-current={isActive(p, pathname) ? "page" : undefined} className={cn("top-link", isActive(p, pathname) && "is-active")}>{l}</Link>
            ))}
          </nav>
          <span className="ml-auto flex md:ml-4"><UserChip /></span>
          <button type="button" className="grid size-10 place-items-center rounded-full hover:bg-[var(--fill)] md:hidden" aria-label="메뉴 열기" aria-expanded={menu} onClick={() => setMenu(true)}><Menu className="size-5" /></button>
        </div>
      </header>
      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="right" className="w-[min(86vw,340px)] p-0 gap-0">
          <div className="border-b border-[var(--line)] px-5 pt-5 pb-4"><SheetTitle className="text-[17px]">{PACK.brand}</SheetTitle><SheetDescription className="text-[13px]">{USER.name}, {USER.team}</SheetDescription></div>
          <nav aria-label="모바일 메뉴" className="flex flex-col p-2">
            {MENU.map(([p, l]) => (
              <Link key={p} to={p} onClick={() => setMenu(false)} aria-current={isActive(p, pathname) ? "page" : undefined} className={cn("rounded-xl px-4 py-3.5 text-[17px]", isActive(p, pathname) ? "bg-[var(--fill-soft)] font-semibold text-primary" : "hover:bg-[var(--fill-soft)]")}>{l}</Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      {DOC_GROUP.includes(pathname) && <DealBar />}
      <main id="main" tabIndex={-1} className="outline-none">{children}</main>
      <footer className="no-print border-t border-[var(--line)] bg-[var(--surface-2)] py-6 text-[12px] leading-relaxed text-[#6e6e73]">
        <div className="mx-auto max-w-[1200px] space-y-1 px-4 sm:px-6">
          <p className="font-medium text-[#424245]">{PACK.footer.project}</p>
          <p>숫자마다 출처 구분 (회사 자료, 공개자료, 내부 설정값). {PACK.asOf}.</p>
          {PACK.credit && <p>제작: {PACK.credit}</p>}
        </div>
      </footer>
      <Toaster position="bottom-center" />
    </div>
  );
}
