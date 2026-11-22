/* 근거자료 보조 패널: 항목별 출처, 기준일, 확인일, 확인 상태. '출처 있음'과 '내용 확인함'을 따로 표시합니다 */
import { Plus, Trash2 } from "lucide-react";
import { useDeal } from "../../lib/deal/DealContext.jsx";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "../ui/sheet.jsx";
import { cn } from "@/lib/utils";

export const EV_STATUS = [["company", "회사 자료"], ["official", "공식, 공개자료"], ["team", "팀 설정, 제안"], ["mock", "내부 설정값"], ["user", "사용자 입력"]];
export const FIELD_NAMES = {
  "": "거래 전체", "exp.items": "제품, 가격", "exp.incoterm": "인도조건", "exp.payment": "결제조건", "exp.nw": "순중량", "exp.gw": "총중량",
  "exp.items.hs": "HS 코드", "product": "제품", "market": "시장", "econ.fx": "환율", "econ.hospital.price": "회당 수납액", "econ.hospital.fixed": "병원 고정비", "econ.hospital.variable": "병원 변동비", "parties.partner": "현지 파트너", "parties.maker": "제조사", "local.lines": "현지 가격", "registration": "등록, 인증", "tariff": "관세, 세금", "structure": "거래 구조",
};
const label = (f) => FIELD_NAMES[f] || f || "거래 전체";

export function EvidencePanel({ open, path, onOpenChange }) {
  const { deal, add, remove, update } = useDeal();
  const all = path === "*";
  const list = all ? deal.evidence : deal.evidence.filter((e) => e.field === path || (path && e.field && path.startsWith(e.field + ".")));
  const set = (id, k) => (e) => update(`evidence.${id}.${k}`, k === "confirmed" ? e.target.checked : e.target.value);
  const inp = "w-full rounded-md border border-[var(--line-strong)] bg-white px-2 h-8 text-[14px] outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20";
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[min(100vw,440px)] sm:max-w-[440px] overflow-y-auto p-0 gap-0">
        <div className="sticky top-0 z-10 border-b border-[var(--line)] bg-white px-5 pt-5 pb-4">
          <SheetTitle className="text-[17px]">근거자료 {all ? "전체" : `, ${label(path)}`}</SheetTitle>
          <SheetDescription className="mt-1 text-[13px] leading-relaxed">출처를 적는 것과 내용을 확인하는 것은 별개예요. 원문을 열어 이 값이 맞는지 본 뒤에만 '내용 확인함'을 체크하세요.</SheetDescription>
        </div>
        <ul className="divide-y divide-[var(--line)]">
          {list.map((e) => (
            <li key={e.id} className="px-5 py-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-[#6e6e73]">{label(e.field)}</span>
                <span className={cn("text-[12px] font-medium", e.confirmed ? "text-primary" : e.ref ? "text-amber-700" : "text-[#6e6e73]")}>{e.confirmed ? "내용 확인함" : e.ref ? "출처만 있음" : "출처 없음"}</span>
              </div>
              <input className={inp} aria-label="근거 제목" placeholder="무엇에 대한 근거인가요" value={e.title} onChange={set(e.id, "title")} />
              <input className={inp} aria-label="문서명, 기관명, URL" placeholder="문서명, 기관명, URL 또는 파일 이름" value={e.ref} onChange={set(e.id, "ref")} />
              <textarea className={cn(inp, "h-auto py-1.5")} rows={2} aria-label="뒷받침하는 내용" placeholder="이 자료가 뒷받침하는 내용" value={e.supports} onChange={set(e.id, "supports")} />
              <div className="grid grid-cols-3 gap-2">
                <label className="text-[11px] text-[#6e6e73]">자료 기준일<input className={inp} value={e.asOf} onChange={set(e.id, "asOf")} placeholder="2026-06" /></label>
                <label className="text-[11px] text-[#6e6e73]">확인일<input className={inp} value={e.checkedAt} onChange={set(e.id, "checkedAt")} placeholder="2026-11-21" /></label>
                <label className="text-[11px] text-[#6e6e73]">상태<select className={inp} value={e.status} onChange={set(e.id, "status")}>{EV_STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
              </div>
              {all && <label className="block text-[11px] text-[#6e6e73]">관련 항목<select className={inp} value={e.field} onChange={set(e.id, "field")}>{Object.entries(FIELD_NAMES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}{!(e.field in FIELD_NAMES) && <option value={e.field}>{e.field}</option>}</select></label>}
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-[13px]"><input type="checkbox" className="size-4 accent-[var(--primary)]" checked={!!e.confirmed} onChange={set(e.id, "confirmed")} disabled={!e.ref} />내용 확인함</label>
                <button type="button" onClick={() => confirm("이 근거를 지울까요?") && remove("evidence", e.id)} className="inline-flex items-center gap-1 text-[12px] text-[#6e6e73] hover:text-foreground"><Trash2 className="size-3.5" />삭제</button>
              </div>
            </li>
          ))}
          {!list.length && <li className="px-5 py-8 text-[14px] text-[#6e6e73]">아직 근거가 없어요.</li>}
        </ul>
        <div className="sticky bottom-0 border-t border-[var(--line)] bg-white px-5 py-3">
          <button type="button" onClick={() => add("evidence", { field: all ? "" : path, title: "", ref: "", asOf: "", checkedAt: "", supports: "", status: "team", confirmed: false })} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-[14px] font-medium text-white"><Plus className="size-4" />근거 추가</button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
