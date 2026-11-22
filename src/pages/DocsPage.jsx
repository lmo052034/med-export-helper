/* C. 서류 미리보기: 수출 견적서, 상업송장 초안, 메일 초안, (현지 판매가 켜져 있으면) 현지 견적.
   인쇄와 PDF에는 앱 메뉴 없이 서류만 나가고, 초안, 모의 표시는 그대로 남습니다 */
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Copy, Printer } from "lucide-react";
import { toast } from "sonner";
import { useDeal } from "../lib/deal/DealContext.jsx";
import { summarize } from "../lib/deal/checks.js";
import { DOCS, DocView, emailText } from "../components/deal/Docs.jsx";
import { cn } from "@/lib/utils";

export default function DocsPage() {
  const { deal, findings } = useDeal();
  const [params, setParams] = useSearchParams();
  const docs = DOCS.filter(([k]) => k !== "local" || deal.local.enabled);
  const want = params.get("doc");
  const [doc, setDoc] = useState(docs.some(([k]) => k === want) ? want : "quote");
  const [printSet, setPrintSet] = useState("one"); // one | all
  const hl = params.get("hl");
  const s = summarize(findings);
  const shown = printSet === "all" ? docs.map(([k]) => k) : [doc];

  const print = (mode) => { setPrintSet(mode); setTimeout(() => window.print(), 80); };
  useEffect(() => {
    if (params.get("print") === "1") { setParams((p) => { p.delete("print"); return p; }, { replace: true }); print("all"); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!hl) return;
    const t = setTimeout(() => {
      const el = document.querySelector(`[data-doc="${doc}"] [data-doc-field="${CSS.escape(hl)}"]`);
      if (el) { el.scrollIntoView({ block: "center", behavior: "smooth" }); el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 2200); }
    }, 80);
    return () => clearTimeout(t);
  }, [hl, doc]);

  const copyMail = async () => {
    const m = emailText(deal);
    try { await navigator.clipboard.writeText(`Subject: ${m.subject}\n\n${m.lines.join("\n")}`); toast.success("메일 내용을 복사했어요."); }
    catch { toast.error("복사하지 못했어요. 내용을 직접 선택해 복사하세요."); }
  };

  return (
    <div className="mx-auto max-w-[1080px] px-4 pb-16 sm:px-6">
      <div className="no-print flex flex-wrap items-end justify-between gap-3 pt-6 pb-4">
        <div>
          <h2 className="text-[24px] font-semibold tracking-tight">서류 미리보기</h2>
          <p className="mt-1 text-[13px] text-[#6e6e73]">모두 같은 거래조건에서 만든 초안이에요(기준정보로 동기화됨). 빈칸 표시를 누르면 그 입력란으로 가요.{s.fix ? <span className="text-amber-700"> 수정 필요 {s.fix}건이 남아 있어요.</span> : ""}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {doc === "email" && <button type="button" onClick={copyMail} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--line-strong)] px-3 text-[14px] hover:bg-[var(--fill)]"><Copy className="size-4" />메일 복사</button>}
          <button type="button" onClick={() => print("one")} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--line-strong)] px-3 text-[14px] hover:bg-[var(--fill)]"><Printer className="size-4" />이 서류 인쇄</button>
          <button type="button" onClick={() => print("all")} className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-[14px] font-medium text-white">전체 인쇄와 PDF</button>
        </div>
      </div>
      <div role="tablist" aria-label="서류" className="seg no-print mb-5">
        {docs.map(([k, l]) => <button key={k} role="tab" type="button" aria-selected={doc === k} onClick={() => { setDoc(k); setPrintSet("one"); }} className="seg-btn">{l}</button>)}
      </div>
      <div className="docs-stack space-y-8">
        {docs.map(([k]) => (
          <div key={k} className={cn("doc-wrap", !shown.includes(k) && "is-off", k !== doc && "screen-hidden")}><DocView id={k} d={deal} /></div>
        ))}
      </div>
    </div>
  );
}
