/* 환율 줄: 처음엔 PPT 기준 환율(콘텐츠 팩 값). '오늘 환율로 다시 계산'을 눌렀을 때만 공개 API 환율을 거래에 적용
   적용 대상: econ.fx.rate (파트너 마진 환산), econ.fx.krw (원화 환산 표시). 실패하면 PPT 값 그대로 */
import { useState } from "react";
import { RefreshCw, RotateCcw } from "lucide-react";
import { useDeal } from "../../lib/deal/DealContext.jsx";
import { fetchLiveFx } from "../../lib/fx.js";
import { cn } from "@/lib/utils";

const n0 = (v) => Math.round(v).toLocaleString("en-US");

/* IDR 금액의 원화, 달러 환산 (오늘 환율 적용 중일 때만 표시) */
export function FxEq({ idr, className }) {
  const { deal } = useDeal();
  const fx = deal.econ.fx || {};
  const rate = Number(fx.rate), krw = Number(fx.krw);
  if (!fx.live || !(rate > 0) || !(krw > 0) || !Number.isFinite(idr)) return null;
  const usd = idr / rate, won = usd * krw;
  return <span className={cn("block text-[12px] font-normal text-[#6e6e73] tabular-nums", className)} data-testid="fx-eq">약 {won < 0 ? "−" : ""}₩{n0(Math.abs(won))}, {usd < 0 ? "−" : ""}${n0(Math.abs(usd))} (오늘 환율)</span>;
}

export function FxBar({ className }) {
  const { deal, update } = useDeal();
  const fx = deal.econ.fx || {};
  const base = deal.baseline?.econ?.fx || fx;
  const [state, setState] = useState("idle"); // idle | loading | fail
  const live = !!fx.live;
  const apply = async () => {
    setState("loading");
    const r = await fetchLiveFx();
    if (!r) { setState("fail"); return; }
    update("econ.fx", { ...fx, rate: String(Math.round(r.idr)), krw: String(Math.round(r.krw * 100) / 100), date: r.date, source: r.source, live: true });
    setState("idle");
  };
  const reset = () => { update("econ.fx", { rate: base.rate, date: base.date, source: base.source }); setState("idle"); };
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-[13px]", className)} data-testid="fx-bar">
      <span className="min-w-0 text-[#424245]">
        <b className="font-semibold">{live ? "오늘 환율 적용 중" : "환율 PPT 기준"}</b>{" "}
        <span className="tabular-nums">USD 1 = Rp{n0(Number(fx.rate) || 0)}{live && Number(fx.krw) > 0 ? `, ₩${n0(Number(fx.krw))}` : ""}</span>
        <span className="ml-1 text-[12px] text-[#86868b]" data-testid="fx-src">({[fx.date, fx.source].filter(Boolean).join(", ")})</span>
      </span>
      <span className="ml-auto flex gap-2">
        {live ? (
          <button type="button" onClick={reset} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--line-strong)] px-3 font-medium hover:bg-[var(--fill-soft)]"><RotateCcw className="size-3.5" aria-hidden="true" />PPT 환율로 되돌리기</button>
        ) : (
          <button type="button" onClick={apply} disabled={state === "loading"} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--line-strong)] px-3 font-medium hover:bg-[var(--fill-soft)] disabled:opacity-50"><RefreshCw className={cn("size-3.5", state === "loading" && "animate-spin")} aria-hidden="true" />{state === "loading" ? "불러오는 중" : "오늘 환율로 다시 계산"}</button>
        )}
      </span>
      {state === "fail" && <span className="w-full text-[12px] text-amber-700" role="status">환율을 불러오지 못해 PPT 기준 환율 유지</span>}
      {live && <span className="w-full text-[12px] text-[#86868b]">병원 손익(루피아)은 그대로, 원화와 달러 환산, 파트너 마진의 달러 환산만 오늘 환율로 계산</span>}
    </div>
  );
}
