/* 거래 입력칸: 경로(path)에 묶여 있고, 검토 결과에서 이 칸으로 이동할 수 있게 id를 가집니다 */
import { useId } from "react";
import { FileSearch } from "lucide-react";
import { useDeal } from "../../lib/deal/DealContext.jsx";
import { getPath, fieldId } from "../../lib/deal/path.js";
import { cn } from "@/lib/utils";

const CTRL = "w-full min-w-0 rounded-md border border-[var(--line-strong)] bg-white px-2.5 text-[15px] text-foreground placeholder:text-[#a1a1a6] outline-none transition-[box-shadow,border-color] focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20 aria-[invalid=true]:border-amber-500";

export function useIssues(path) {
  const { findings } = useDeal();
  return findings.filter((f) => f.level !== "ok" && f.field === path);
}

export function EvidenceButton({ path, onOpen }) {
  const { deal } = useDeal();
  const n = deal.evidence.filter((e) => e.field === path || (path && e.field && path.startsWith(e.field + "."))).length;
  return (
    <button type="button" onClick={() => onOpen(path)} className="inline-flex items-center gap-1 rounded px-1 text-[12px] text-[#6e6e73] hover:text-primary" aria-label={`근거자료 ${n}건 보기`}>
      <FileSearch className="size-3.5" aria-hidden="true" />{n ? `근거 ${n}` : "근거"}
    </button>
  );
}

/* type: text | number | date | select | textarea | email */
export function DealField({ path, label, type = "text", options, placeholder, hint, className, inputClass, evidence, onEvidence, suffix, wide, inputMode, readOnly }) {
  const { deal, update } = useDeal();
  const issues = useIssues(path);
  const hid = useId();
  const v = getPath(deal, path);
  const value = v === undefined || v === null ? "" : v;
  const bad = issues.some((i) => i.level === "fix");
  const common = {
    id: fieldId(path), name: path, value, readOnly,
    "aria-invalid": bad || undefined,
    "aria-describedby": issues.length || hint ? hid : undefined,
    onChange: (e) => update(path, e.target.value),
  };
  let ctrl;
  if (type === "select") ctrl = (
    <select {...common} className={cn(CTRL, "h-9 pr-7 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236e6e73%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:12px] bg-[right_8px_center] bg-no-repeat", inputClass)}>
      {options.map((o) => (Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>))}
    </select>
  );
  else if (type === "textarea") ctrl = <textarea {...common} placeholder={placeholder} rows={3} className={cn(CTRL, "py-2 leading-relaxed resize-y", inputClass)} />;
  else ctrl = <input {...common} type={type === "number" ? "text" : type} inputMode={inputMode || (type === "number" ? "decimal" : undefined)} placeholder={placeholder} autoComplete="off" className={cn(CTRL, "h-9", type === "number" && "tabular-nums text-right", inputClass)} />;

  return (
    <div className={cn("field min-w-0", wide && "sm:col-span-2", className)} data-field={path}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label htmlFor={fieldId(path)} className="text-[13px] font-medium text-[#424245]">{label}</label>
        {evidence && <EvidenceButton path={evidence === true ? path : evidence} onOpen={onEvidence} />}
      </div>
      <div className="flex items-center gap-1.5">{ctrl}{suffix && <span className="shrink-0 text-[13px] text-[#6e6e73]">{suffix}</span>}</div>
      {(issues.length > 0 || hint) && (
        <div id={hid} className="mt-1 space-y-0.5">
          {issues.slice(0, 2).map((i) => <p key={i.id} className={cn("text-[12px] leading-snug", i.level === "fix" ? "text-amber-700" : "text-[#6e6e73]")}>{i.level === "fix" ? "수정 필요 · " : "확인 · "}{i.why}</p>)}
          {!issues.length && hint && <p className="text-[12px] text-[#86868b]">{hint}</p>}
        </div>
      )}
    </div>
  );
}

/* 표 안의 작은 입력칸 (품목·결제 회차) */
export function CellInput({ path, label, type = "text", className, placeholder, options }) {
  const { deal, update } = useDeal();
  const issues = useIssues(path);
  const v = getPath(deal, path);
  const p = { id: fieldId(path), "aria-label": label, value: v ?? "", "aria-invalid": issues.some((i) => i.level === "fix") || undefined, title: issues[0]?.why, onChange: (e) => update(path, e.target.value) };
  if (options) return <select {...p} className={cn(CTRL, "h-8 px-1.5 text-[14px]", className)}>{options.map((o) => (Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o}>{o}</option>))}</select>;
  return <input {...p} type="text" inputMode={type === "number" ? "decimal" : undefined} placeholder={placeholder} autoComplete="off" className={cn(CTRL, "h-8 px-2 text-[14px]", type === "number" && "text-right tabular-nums", className)} />;
}
