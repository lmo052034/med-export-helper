/* B. 검토 결과: 수정 필요 / 확인 필요 / 입력값 일치. 각 항목에서 입력란으로 바로 이동 */
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useDeal } from "../lib/deal/DealContext.jsx";
import { LEVELS, SECTIONS, summarize } from "../lib/deal/checks.js";
import { DOCS } from "../components/deal/Docs.jsx";
import { EV_STATUS } from "../components/deal/EvidencePanel.jsx";
import { cn } from "@/lib/utils";

const DOC_NAME = Object.fromEntries(DOCS);
const EV_NAME = Object.fromEntries(EV_STATUS);
const FIELD_KO = { model: "모델", qty: "수량", unit: "단위", price: "단가", amount: "금액", pct: "비율", name: "회사명", incoterm: "인도조건", place: "지정 장소", nw: "순중량", gw: "총중량", packages: "포장 수량", currency: "통화", vatPct: "부가세율" };
function changeLabel(d, field) {
  const ks = field.split("."), last = FIELD_KO[ks[ks.length - 1]] || ks[ks.length - 1];
  if (ks[1] === "items") { const it = d.exp.items.find((x) => x.id === ks[2]); return `${it ? it.model || it.desc || "품목" : "삭제된 품목"} ${last}`; }
  if (ks[1] === "extras") return `별도 비용 ${last}`;
  if (ks[1] === "payment") return `${ks[0] === "local" ? "현지 " : ""}결제 회차 ${last}`;
  if (ks[1] === "lines") return `현지 품목 ${last}`;
  if (ks[0] === "parties") return `${{ maker: "제조사", partner: "파트너", hospital: "병원" }[ks[1]] || ks[1]} ${last}`;
  return last;
}
const when = (iso) => { const t = new Date(iso); return isNaN(t) ? "" : `${t.getMonth() + 1}/${t.getDate()} ${t.toTimeString().slice(0, 5)}`; };

function Finding({ f }) {
  const nav = useNavigate();
  const go = () => nav(`/deal?focus=${encodeURIComponent(f.field)}`);
  return (
    <li className="grid gap-x-6 gap-y-1 py-4 sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <p className="text-[15px] font-semibold leading-snug">{f.label}</p>
        <p className="text-[12px] text-[#6e6e73]">{SECTIONS[f.section]}{f.docs.length ? ` · ${f.docs.map((d) => DOC_NAME[d]).join(", ")}` : ""}</p>
      </div>
      <div className="min-w-0 text-[14px] leading-relaxed">
        <p><span className="text-[#6e6e73]">현재 값 </span><span className={cn("tabular-nums", f.level === "fix" && "font-medium")}>{f.value}</span></p>
        <p className="text-[#424245]">{f.why}</p>
        {f.how && <p className="text-[#424245]"><span className="text-[#6e6e73]">고치는 방법 </span>{f.how}</p>}
      </div>
      <div className="flex items-start gap-1 sm:flex-col sm:items-end">
        {f.level !== "ok" && <button type="button" onClick={go} className="inline-flex h-8 items-center gap-1 rounded-md border border-[var(--line-strong)] px-2.5 text-[13px] font-medium text-primary hover:bg-[var(--fill-soft)]">{f.field === "evidence" ? "근거 패널 열기" : "입력란으로 이동"}<ArrowRight className="size-3.5" /></button>}
        {f.docs[0] && <button type="button" onClick={() => nav(`/docs?doc=${f.docs[0]}&hl=${encodeURIComponent(f.field)}`)} className="inline-flex h-8 items-center rounded-md px-2 text-[13px] text-[#6e6e73] hover:text-foreground">서류에서 보기</button>}
      </div>
    </li>
  );
}

export default function ReviewPage() {
  const { deal, findings, actions } = useDeal();
  const s = summarize(findings);
  const stale = findings.some((f) => f.label === "검토 후 조건 변경");
  const groups = ["fix", "confirm", "ok"].map((lv) => [lv, findings.filter((f) => f.level === lv)]);
  const ev = deal.evidence;
  return (
    <div className="mx-auto max-w-[1080px] px-4 pb-16 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pt-6 pb-5">
        <div>
          <h2 className="text-[24px] font-semibold tracking-tight">검토 결과</h2>
          <p className="mt-1 text-[14px] text-[#424245]">
            {s.fix ? <><b className="text-amber-700">수정 필요 {s.fix}건</b>, </> : "수정할 항목은 없어요. "}확인 필요 {s.confirm}건, 입력값 일치 {s.ok}건 · {deal.meta.stage === "invoice" ? "출하·인보이스 단계 기준" : "견적 단계 기준"}
          </p>
          <p className="mt-1 text-[12px] text-[#6e6e73]">입력값의 누락, 계산, 서류 간 일치를 규칙으로 확인한 결과예요. 법적 적합성, 통관 승인, 판매 가능 여부는 판단하지 않고, 이 도구 밖의 문서와 대조하지 않아요.</p>
        </div>
        <div className="text-right">
          <button type="button" onClick={actions.markReviewed} disabled={s.fix > 0} className="inline-flex h-9 items-center rounded-md bg-primary px-3.5 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">이 조건으로 검토 완료 표시</button>
          <p className="mt-1 text-[12px] text-[#6e6e73]">{s.fix > 0 ? "수정 필요 항목을 먼저 고치세요." : deal.review.at ? `${when(deal.review.at)}에 검토 완료${stale ? " · 이후 주요 조건이 바뀜" : ""}` : "아직 검토 완료 표시가 없어요."}</p>
        </div>
      </div>

      {groups.map(([lv, list]) => list.length > 0 && (
        <section key={lv} aria-labelledby={`lv-${lv}`} className="mt-8">
          <h3 id={`lv-${lv}`} className="flex items-baseline gap-2 text-[17px] font-semibold">
            <span className={cn("inline-block size-2 rounded-full", lv === "fix" ? "bg-amber-500" : lv === "confirm" ? "bg-[#a1a1a6]" : "bg-primary")} aria-hidden="true" />
            {LEVELS[lv].label} <span className="text-[14px] font-normal text-[#6e6e73] tabular-nums">{list.length}</span>
          </h3>
          <p className="text-[13px] text-[#6e6e73]">{LEVELS[lv].desc}</p>
          <ul className="mt-1 divide-y divide-[var(--line)] border-t border-[var(--line)]">{list.map((f) => <Finding key={f.id} f={f} />)}</ul>
        </section>
      ))}

      <section className="mt-12 grid gap-10 md:grid-cols-2">
        <div>
          <h3 className="text-[17px] font-semibold">근거자료 {ev.length}건</h3>
          <p className="text-[13px] text-[#6e6e73]">출처가 있는 것과 내용을 확인한 것을 나눠 보여줘요.</p>
          <ul className="mt-2 divide-y divide-[var(--line)] border-t border-[var(--line)] text-[14px]">
            {ev.map((e) => (
              <li key={e.id} className="flex items-baseline justify-between gap-3 py-2.5">
                <span className="min-w-0"><span className="block truncate">{e.title || e.ref || "제목 없음"}</span><span className="text-[12px] text-[#6e6e73]">{EV_NAME[e.status] || e.status}{e.checkedAt ? ` · 확인일 ${e.checkedAt}` : ""}</span></span>
                <span className={cn("shrink-0 text-[12px] font-medium", e.confirmed ? "text-primary" : e.ref ? "text-amber-700" : "text-[#6e6e73]")}>{e.confirmed ? "내용 확인함" : e.ref ? "출처만 있음" : "출처 없음"}</span>
              </li>
            ))}
            {!ev.length && <li className="py-3 text-[#6e6e73]">아직 근거가 없어요. 거래조건 화면의 '근거' 버튼으로 추가하세요.</li>}
          </ul>
        </div>
        <div>
          <h3 className="text-[17px] font-semibold">변경 기록</h3>
          <p className="text-[13px] text-[#6e6e73]">가격, 수량, 조건, 중량처럼 서류 금액·조건을 바꾸는 값만 남겨요 (최근 50건).</p>
          <ul className="mt-2 divide-y divide-[var(--line)] border-t border-[var(--line)] text-[13px]">
            {[...deal.changes].reverse().slice(0, 12).map((c, i) => (
              <li key={i} className="grid grid-cols-[72px_minmax(0,1fr)] gap-2 py-2">
                <span className="tabular-nums text-[#6e6e73]">{when(c.at)}</span>
                <span className="min-w-0 break-words"><span className="text-[#6e6e73]">{changeLabel(deal, c.field)}</span> {String(c.from ?? "") || "(빈칸)"} → <b className="font-medium">{String(c.to ?? "") || "(빈칸)"}</b></span>
              </li>
            ))}
            {!deal.changes.length && <li className="py-3 text-[#6e6e73]">아직 바뀐 값이 없어요.</li>}
          </ul>
        </div>
      </section>
    </div>
  );
}
