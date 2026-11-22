/* 가격과 수익성: 거래 가격 / 병원 운영 / 결제 흐름. 모두 같은 거래 데이터와 econ.js 계산 함수를 씁니다 */
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { useDeal } from "../lib/deal/DealContext.jsx";
import { calcExport, calcLocal } from "../lib/deal/calc.js";
import { hospitalCalc, partnerCalc, cashFlow, surplusCurve, changedFrom, withBaseline } from "../lib/deal/econ.js";
import { fmtMoney, parseNum, CURRENCIES } from "../lib/deal/money.js";
import { getPath, fieldId } from "../lib/deal/path.js";
import { EvidenceButton } from "../components/deal/Field.jsx";
import { EvidencePanel, EV_STATUS } from "../components/deal/EvidencePanel.jsx";
import { LineChart } from "../components/deal/LineChart.jsx";
import { cn } from "@/lib/utils";
import { PACK } from "@pack";

const fmt = (v, d = 0) => (v === null || v === undefined || !Number.isFinite(v) ? "—" : Math.round(v * 10 ** d) / 10 ** d).toLocaleString("en-US", { maximumFractionDigits: d });
const rp = (v) => (v === null || v === undefined ? "—" : `Rp ${fmt(v)}`);
const rpShort = (v) => { const a = Math.abs(v); const s = v < 0 ? "−" : ""; return a >= 1e9 ? `${s}${fmt(a / 1e9, 2)}B` : a >= 1e6 ? `${s}${fmt(a / 1e6, 1)}M` : `${s}${fmt(a)}`; };
const BASIS = [["company", "회사 자료"], ["official", "공개자료"], ["team", "팀 설정"], ["user", "사용자 입력"]];
const WHEN = [["before-ship", "출하 전"], ["import", "수입 신고"], ["install", "설치·운영"], ["finance", "금융"]];
const CTRL = "w-full min-w-0 rounded-[10px] border border-[var(--line-strong)] bg-white px-3 text-[15px] outline-none transition-[box-shadow,border-color] focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20 aria-[invalid=true]:border-amber-500";

function Changed({ path }) {
  const { deal, actions } = useDeal();
  if (!changedFrom(deal, path)) return null;
  const b = getPath(deal.baseline, path);
  return <button type="button" onClick={() => actions.resetToBaseline(path)} className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline" title="기준값으로 되돌리기"><RotateCcw className="size-3" aria-hidden="true" />변경됨{b !== undefined && b !== "" ? ` (기준 ${fmt(parseNum(b).value ?? NaN) !== "—" ? fmt(parseNum(b).value, 2) : b})` : ""}</button>;
}

/* 숫자 입력 + (선택) 슬라이더 */
function NumField({ path, label, unit, slider, hint, evidence, onEv, wide, row }) {
  const { deal, update } = useDeal();
  const v = getPath(deal, path) ?? "";
  const p = parseNum(v);
  const bad = p.state === "invalid" || (p.state === "ok" && p.value < 0);
  const id = fieldId(path);
  if (row) return (
    <div className="field min-w-0 border-b border-[var(--line)] py-3" data-field={path}>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,170px)_36px] items-center gap-x-3">
        <span className="flex min-w-0 items-center gap-1"><label htmlFor={id} className="text-[14px] text-[#424245]">{label}</label>{evidence && <EvidenceButton path={evidence} onOpen={onEv} />}</span>
        <input id={id} type="text" inputMode="decimal" autoComplete="off" value={v} aria-invalid={bad || p.state === "blank" || undefined} aria-describedby={`${id}-h`} onChange={(e) => update(path, e.target.value)} className={cn(CTRL, "h-10 text-right tabular-nums")} />
        <span className="text-[13px] text-[#6e6e73]">{unit}</span>
      </div>
      {slider && <input type="range" aria-label={`${label} 슬라이더`} min={slider.min} max={slider.max} step={slider.step} value={p.state === "ok" ? Math.min(Math.max(p.value, slider.min), slider.max) : slider.min} onChange={(e) => update(path, e.target.value)} className="range mt-3 w-full" />}
      <p id={`${id}-h`} className={cn("mt-1.5 flex flex-wrap items-center gap-x-2 text-[12px] leading-snug", bad || p.state === "blank" ? "text-amber-700" : "text-[#86868b]")}>
        <span>{p.state === "blank" ? "비어 있어요. 0과 다르게 계산하지 않아요." : bad ? (p.state === "invalid" ? "숫자로 적어 주세요." : "음수는 쓸 수 없어요.") : hint}</span><Changed path={path} />
      </p>
    </div>
  );
  return (
    <div className={cn("field min-w-0", wide && "sm:col-span-2")} data-field={path}>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <label htmlFor={id} className="text-[13px] font-medium text-[#424245]">{label}</label>
        <Changed path={path} />
        {evidence && <span className="ml-auto"><EvidenceButton path={evidence} onOpen={onEv} /></span>}
      </div>
      <div className="flex items-center gap-2">
        <input id={id} type="text" inputMode="decimal" autoComplete="off" value={v} aria-invalid={bad || p.state === "blank" || undefined} aria-describedby={`${id}-h`} onChange={(e) => update(path, e.target.value)} className={cn(CTRL, "h-10 text-right tabular-nums")} />
        {unit && <span className="shrink-0 text-[13px] text-[#6e6e73]">{unit}</span>}
      </div>
      {slider && <input type="range" aria-label={`${label} 슬라이더`} min={slider.min} max={slider.max} step={slider.step} value={p.state === "ok" ? Math.min(Math.max(p.value, slider.min), slider.max) : slider.min} onChange={(e) => update(path, e.target.value)} className="range mt-2 w-full" />}
      <p id={`${id}-h`} className={cn("mt-1 text-[12px] leading-snug", bad || p.state === "blank" ? "text-amber-700" : "text-[#86868b]")}>
        {p.state === "blank" ? "비어 있어요. 0과 다르게 계산하지 않아요." : bad ? (p.state === "invalid" ? "숫자로 적어 주세요." : "음수는 쓸 수 없어요.") : hint}
      </p>
    </div>
  );
}

function TextField({ path, label, placeholder }) {
  const { deal, update } = useDeal();
  return (
    <div className="min-w-0"><label htmlFor={fieldId(path)} className="mb-1 block text-[13px] font-medium text-[#424245]">{label}</label>
      <input id={fieldId(path)} value={getPath(deal, path) ?? ""} placeholder={placeholder} onChange={(e) => update(path, e.target.value)} className={cn(CTRL, "h-10")} /></div>
  );
}
function SelectField({ path, label, options }) {
  const { deal, update } = useDeal();
  return (
    <div className="min-w-0"><label htmlFor={fieldId(path)} className="mb-1 block text-[13px] font-medium text-[#424245]">{label}</label>
      <select id={fieldId(path)} value={getPath(deal, path) ?? ""} onChange={(e) => update(path, e.target.value)} className={cn(CTRL, "h-10")}>{options.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
  );
}

/* 비용 행 (병원 변동비·고정비) */
function HvRows({ base, unit, title, onEv, evPath }) {
  const { deal, update, add, remove } = useDeal();
  const rows = getPath(deal, base);
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 flex w-full items-center text-[15px] font-semibold">{title}<span className="ml-auto"><EvidenceButton path={evPath} onOpen={onEv} /></span></legend>
      <div className="space-y-2">
        {rows.map((r, i) => {
          const p = parseNum(r.amount);
          return (
            <div key={r.id} className="grid grid-cols-[minmax(0,1fr)_112px_32px] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_112px_96px_32px]" data-field={`${base}.${r.id}.amount`}>
              <input aria-label={`${title} ${i + 1} 항목`} value={r.label} onChange={(e) => update(`${base}.${r.id}.label`, e.target.value)} className={cn(CTRL, "h-9 text-[14px]")} />
              <input id={fieldId(`${base}.${r.id}.amount`)} aria-label={`${r.label || title + " " + (i + 1)} 금액 (${unit})`} inputMode="decimal" value={r.amount} aria-invalid={p.state !== "ok" || p.value < 0 || undefined} onChange={(e) => update(`${base}.${r.id}.amount`, e.target.value)} className={cn(CTRL, "h-9 text-right text-[14px] tabular-nums")} />
              <select aria-label={`${r.label || title} 출처 구분`} value={r.basis} onChange={(e) => update(`${base}.${r.id}.basis`, e.target.value)} className={cn(CTRL, "hidden h-9 px-2 text-[13px] sm:block")}>{BASIS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
              <button type="button" aria-label={`${r.label || "비용"} 삭제`} onClick={() => remove(base, r.id)} className="grid size-8 place-items-center rounded-full text-[#86868b] hover:bg-[var(--fill)]"><Trash2 className="size-4" /></button>
              {(r.note || changedFrom(deal, `${base}.${r.id}.amount`)) && <p className="col-span-full -mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#86868b]">{r.note}<Changed path={`${base}.${r.id}.amount`} /></p>}
            </div>
          );
        })}
      </div>
      <button type="button" onClick={() => add(base, { label: "", amount: "", basis: "user", note: "" })} className="mt-2 inline-flex h-8 items-center gap-1 rounded-full px-2 text-[13px] font-medium text-primary hover:bg-[var(--fill-soft)]"><Plus className="size-3.5" />항목 추가</button>
    </fieldset>
  );
}

function ResRow({ k, sub, v, delta, warn, testid }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 border-b border-[var(--line)] py-3" data-testid={testid}>
      <dt className="text-[14px] text-[#424245]">{k}{sub && <span className="block text-[12px] text-[#86868b]">{sub}</span>}</dt>
      <dd className={cn("text-right text-[18px] font-semibold tabular-nums", warn && "text-[15px] text-amber-700")}>{v}{delta && <span className="block text-[12px] font-medium text-[#6e6e73]">{delta}</span>}</dd>
    </div>
  );
}
const diff = (a, b, f = rp) => (a === null || b === null || a === undefined || b === undefined || Math.abs(a - b) < 1e-6 ? null : `기준안 대비 ${a > b ? "+" : "−"}${f(Math.abs(a - b)).replace(/^Rp /, "Rp ")}`);

/* ---------- 병원 운영 ---------- */
function Hospital({ onEv }) {
  const { deal, update } = useDeal();
  const H = hospitalCalc(deal);
  const B = useMemo(() => { const b = withBaseline(deal); return b ? hospitalCalc(b) : null; }, [deal]);
  const curve = useMemo(() => surplusCurve(deal, 120, 2).map((p) => ({ x: p.n, y: p.v })), [deal]);
  const baseCurve = useMemo(() => { const b = withBaseline(deal); return b ? surplusCurve(b, 120, 2).map((p) => ({ x: p.n, y: p.v })) : null; }, [deal]);
  const L = calcLocal(deal);
  const h = deal.econ.hospital;
  const scen = deal.econ.scenarios;
  const life = Number(PACK.review?.defaults?.device?.lifeMonths) || 48;
  const bepDep = H.contribution > 0 && H.invest !== null && H.fixed !== null ? Math.ceil((H.fixed + H.invest / life) / H.contribution) : null;
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
      <div className="space-y-7">
        <h2 className="text-[17px] font-semibold">입력</h2>
        <div className="field" data-field="econ.hospital.investCustom">
          <p className="text-[13px] font-medium text-[#424245]">병원 초기 도입비</p>
          <div className="mt-1 flex flex-wrap gap-4 text-[14px]">
            <label className="inline-flex items-center gap-2"><input type="radio" name="invest" checked={h.investMode === "local"} onChange={() => update("econ.hospital.investMode", "local")} className="accent-[var(--primary)]" />현지 견적 총액 사용</label>
            <label className="inline-flex items-center gap-2"><input type="radio" name="invest" checked={h.investMode === "custom"} onChange={() => update("econ.hospital.investMode", "custom")} className="accent-[var(--primary)]" />직접 입력</label>
          </div>
          {h.investMode === "local" ? (
            <p className="mt-2 text-[15px]"><b className="tabular-nums">{rp(L.total)}</b> <span className="text-[12px] text-[#6e6e73]">현지 판매가 + 부가세 {deal.local.vatPct || "—"}%. 병원은 매입 부가세를 공제받지 못한다고 보고 포함 (팀 해석). <Link to="/price?tab=deal" className="text-primary">판매가 바꾸기</Link></span></p>
          ) : <div className="mt-2"><NumField path="econ.hospital.investCustom" label="초기 도입비" unit="IDR" hint="장비 구입에 드는 현금. 월 비용에 다시 넣지 않아요." /></div>}
        </div>
        <NumField row path="econ.hospital.price" label="회당 실제 수납액" unit="IDR" slider={{ min: 100000, max: 1200000, step: 1000 }} hint={h.priceSource || "공개 정가와 실제 수납액은 다를 수 있어요."} evidence="econ.hospital.price" onEv={onEv} />
        <SelectField path="econ.hospital.priceKind" label="수납액의 성격" options={[["", "선택"], ["actual", "병원 실제 수납액"], ["public-list", "공개 정가"], ["public-promo", "공개 판촉가 (수납액으로 가정)"], ["mock", "팀 모의값"]]} />
        <NumField row path="econ.hospital.sessions" label="월 유료 시술 건수" unit="회" slider={{ min: 0, max: 150, step: 1 }} hint={H.perDay !== null ? `가동일 ${h.workDays}일 기준 하루 약 ${fmt(H.perDay, 1)}회. 환자 수나 치료 코스 수가 아니라 유료 시술 횟수예요.` : "환자 수나 치료 코스 수가 아니라 유료 시술 횟수예요."} />
        <div>
          <NumField row path="econ.hospital.workDays" label="월 가동일수" unit="일" hint="하루 평균 계산에만 써요." />
          <NumField row path="econ.hospital.horizon" label="누적 계산 기간" unit="개월" hint="최대 120개월" />
        </div>
        <HvRows base="econ.hospital.variable" unit="IDR/회" title="회당 변동비" onEv={onEv} evPath="econ.hospital.variable" />
        <HvRows base="econ.hospital.fixed" unit="IDR/월" title="월 추가 고정비" onEv={onEv} evPath="econ.hospital.fixed" />
        <p className="text-[12px] leading-relaxed text-[#6e6e73]">월 추가 고정비에는 장비 감가상각이나 할부 상환을 넣지 마세요. 도입비는 초기 투자액으로 한 번만 계산해요. 세전, 병원 전체 손익이 아니라 이 장비 1대의 현금흐름이에요.</p>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-[var(--line)] bg-white px-4 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] text-center lg:hidden no-print" aria-hidden="true">
        <p className="text-[11px] text-[#6e6e73]">월 현금잉여<b className="block text-[14px] text-foreground tabular-nums">{H.surplus !== null ? rpShort(H.surplus) : "—"}</b></p>
        <p className="text-[11px] text-[#6e6e73]">손익분기<b className="block text-[14px] text-foreground tabular-nums">{H.bep !== null ? `월 ${H.bep}회` : "산출 불가"}</b></p>
        <p className="text-[11px] text-[#6e6e73]">단순 회수<b className="block text-[14px] text-foreground tabular-nums">{H.payback !== null ? `${fmt(H.payback, 1)}개월` : "산출 불가"}</b></p>
      </div>
      <div className="min-w-0 lg:sticky lg:top-16 lg:self-start">
        {H.issues.length > 0 && (
          <div className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-[13px] text-amber-800" role="status">
            {H.issues.map((i) => <p key={i.field}>{i.text}</p>)}
          </div>
        )}
        <h2 className="text-[17px] font-semibold">결과</h2>
        <div aria-live="polite" className="mt-3">
          <div data-testid="h-surplus" className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 border-b border-[var(--line-strong)] pb-4">
            <div>
              <p className="text-[13px] text-[#6e6e73]">월 운영 현금잉여 (시술 {H.sessions ?? "—"}회)</p>
              <p className="mt-0.5 text-[36px] leading-tight font-semibold tracking-tight tabular-nums">{rp(H.surplus)}</p>
            </div>
            <p className="text-right text-[12px] text-[#6e6e73]">{B && diff(H.surplus, B.surplus) && <span className="block font-medium text-[#424245] tabular-nums">{diff(H.surplus, B.surplus)}</span>}시술 × 공헌액 − 고정비 {rp(H.fixed)}</p>
          </div>
          <dl>
            <ResRow testid="h-contribution" k="회당 공헌액" sub="수납액 − 회당 변동비" v={rp(H.contribution)} delta={B && diff(H.contribution, B.contribution)} />
            <ResRow k={`손익분기 (장비비 ${life}개월 배분)`} sub="고정비 + 도입비 ÷ 배분 개월, 공헌액으로 나눠 올림" v={bepDep !== null ? `월 ${bepDep}회` : "산출 불가"} />
            <ResRow testid="h-bep" k="손익분기 (운영비만)" sub={H.bep !== null ? "고정비 ÷ 회당 공헌액, 올림" : H.bepNote} v={H.bep !== null ? `월 ${H.bep}회` : "산출 불가"} warn={H.bep === null && H.bepNote} delta={B && H.bep !== null && B.bep !== null && H.bep !== B.bep ? `기준안 월 ${B.bep}회` : null} />
            <ResRow testid="h-payback" k="투자 회수" sub={H.payback !== null ? `도입비 ${rp(H.invest)} ÷ 월 현금잉여` : H.paybackNote} v={H.payback !== null ? `${fmt(H.payback, 1)}개월` : "산출 불가"} warn={H.payback === null && H.paybackNote} delta={B && H.payback !== null && B.payback !== null && Math.abs(H.payback - B.payback) > 0.05 ? `기준안 ${fmt(B.payback, 1)}개월` : null} />
          </dl>
        </div>
        <p className="mt-2 text-[12px] text-[#86868b]">월 조건이 일정하다는 전제의 계산이에요. 수요 예측이나 성공 가능성이 아니에요.</p>

        <div className="mt-8">
          <h3 className="text-[15px] font-semibold">월 시술 건수별 월 운영 현금잉여</h3>
          <LineChart data={curve} base={baseCurve} label="월 시술 건수에 따른 월 운영 현금잉여 그래프" xLabel="월 유료 시술 (회)" yLabel="IDR / 월" fmtY={rpShort} markers={[...(H.sessions !== null && H.surplus !== null ? [{ x: H.sessions, y: H.surplus, label: `현재 ${H.sessions}회: ${rpShort(H.surplus)}` }] : []), ...(bepDep !== null ? [{ x: bepDep, label: `장비비 포함 손익분기 ${bepDep}회`, color: "var(--primary)" }] : []), ...(H.bep !== null ? [{ x: H.bep, y: 0, label: `운영비만 ${H.bep}회`, color: "#86868b" }] : [])]} />
        </div>
        <div className="mt-8">
          <h3 className="text-[15px] font-semibold">누적 현금흐름 (도입 시점부터)</h3>
          <LineChart data={H.cumulative.map((p) => ({ x: p.m, y: p.v }))} base={B ? B.cumulative.slice(0, H.horizon + 1).map((p) => ({ x: p.m, y: p.v })) : null} label="개월별 누적 현금흐름 그래프" xLabel="개월" yLabel="IDR 누적" fmtY={rpShort} markers={H.payback !== null && H.payback <= H.horizon ? [{ x: Math.ceil(H.payback), y: H.cumulative[Math.ceil(H.payback)]?.v, label: `회수 ${Math.ceil(H.payback)}개월째` }] : []} />
          {H.payback !== null && H.payback > H.horizon && <p className="text-[12px] text-amber-700">계산 기간 {H.horizon}개월 안에 회수되지 않아요.</p>}
        </div>

        <div className="mt-10">
          <h3 className="text-[15px] font-semibold">시나리오 비교</h3>
          <p className="text-[12px] text-[#6e6e73]">입력 전제를 직접 바꿀 수 있어요. 성공 확률이나 실제 수요 예측이 아니에요. 다른 비용은 현재 입력값을 그대로 써요.</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-[14px]">
              <thead><tr className="border-b border-[var(--line-strong)] text-left text-[12px] text-[#6e6e73]"><th className="py-2 pr-2 font-medium">시나리오</th><th className="py-2 pr-2 text-right font-medium">회당 수납 (IDR)</th><th className="py-2 pr-2 text-right font-medium">월 시술</th><th className="py-2 pr-2 text-right font-medium">월 현금잉여</th><th className="py-2 pr-2 text-right font-medium">회수</th></tr></thead>
              <tbody>
                {scen.map((s) => {
                  const r = hospitalCalc(deal, { price: s.price, sessions: s.sessions });
                  return (
                    <tr key={s.id} className="border-b border-[var(--line)]">
                      <th scope="row" className="py-2 pr-2 text-left font-medium">{s.label}<span className="block text-[11px] font-normal text-[#86868b]">{s.note}</span></th>
                      <td className="py-2 pr-2"><input aria-label={`${s.label} 회당 수납`} inputMode="decimal" value={s.price} onChange={(e) => update(`econ.scenarios.${s.id}.price`, e.target.value)} className={cn(CTRL, "h-8 w-28 text-right text-[13px] tabular-nums")} /></td>
                      <td className="py-2 pr-2"><input aria-label={`${s.label} 월 시술`} inputMode="decimal" value={s.sessions} onChange={(e) => update(`econ.scenarios.${s.id}.sessions`, e.target.value)} className={cn(CTRL, "h-8 w-16 text-right text-[13px] tabular-nums")} /></td>
                      <td className="py-2 pr-2 text-right tabular-nums">{rp(r.surplus)}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{r.payback !== null ? `${fmt(r.payback, 1)}개월` : "산출 불가"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {deal.sampleKey && PACK.notes?.hospital && (
          <details className="mt-8 text-[13px] text-[#424245]">
            <summary className="cursor-pointer font-medium">{PACK.notes.hospital.title}</summary>
            <p className="mt-2 leading-relaxed">{PACK.notes.hospital.body}</p>
          </details>
        )}
      </div>
    </div>
  );
}

/* ---------- 거래 가격 ---------- */
function DealPrice({ onEv }) {
  const { deal, update, add, remove } = useDeal();
  const E = calcExport(deal), L = calcLocal(deal), P = partnerCalc(deal);
  const lc = deal.local.currency, ec = deal.exp.currency;
  const total = L.total;
  const parts = [...P.included.map((x) => ({ label: x.label, v: x.local })), ...(P.profit !== null && P.complete ? [{ label: "파트너 이익 (세전)", v: P.profit, profit: true }] : []), ...(L.vatMinor ? [{ label: `부가세 ${deal.local.vatPct}%`, v: L.vatMinor, vat: true }] : [])];
  const grays = ["#48484a", "#636366", "#8e8e93", "#aeaeb2", "#c7c7cc", "#9a9aa0", "#7c7c80"];
  const segColor = (p, i) => (p.profit ? "var(--primary)" : p.vat ? "#e5e5ea" : grays[i % grays.length]);
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
      <div className="space-y-8">
        <fieldset>
          <legend className="mb-3 flex w-full items-center text-[15px] font-semibold">수출 거래 (제조사 → 파트너, {ec})<span className="ml-auto"><EvidenceButton path="exp.items" onOpen={onEv} /></span></legend>
          <div className="space-y-3">
            {deal.exp.items.map((it, i) => (
              <div key={it.id} className="rounded-2xl bg-[var(--surface-2)] p-4" data-field={`exp.items.${it.id}.price`}>
                <div className="flex items-center gap-2">
                  <input aria-label={`${i + 1}번 품목 모델`} value={it.model} onChange={(e) => update(`exp.items.${it.id}.model`, e.target.value)} placeholder="모델" className={cn(CTRL, "h-9 text-[14px] font-medium")} />
                  {deal.exp.items.length > 1 && <button type="button" aria-label={`${i + 1}번 품목 삭제`} onClick={() => remove("exp.items", it.id)} className="grid size-8 shrink-0 place-items-center rounded-full text-[#86868b] hover:bg-[var(--fill)]"><Trash2 className="size-4" /></button>}
                </div>
                <div className="mt-2 grid grid-cols-[80px_minmax(0,1fr)] gap-2">
                  <input aria-label={`${i + 1}번 품목 수량`} inputMode="decimal" value={it.qty} onChange={(e) => update(`exp.items.${it.id}.qty`, e.target.value)} className={cn(CTRL, "h-9 text-right text-[14px] tabular-nums")} />
                  <input id={fieldId(`exp.items.${it.id}.price`)} aria-label={`${i + 1}번 품목 단가 (${ec})`} inputMode="decimal" value={it.price} placeholder={`단가 ${ec}`} aria-invalid={parseNum(it.price).state !== "ok" || undefined} onChange={(e) => update(`exp.items.${it.id}.price`, e.target.value)} className={cn(CTRL, "h-9 text-right text-[14px] tabular-nums")} />
                </div>
                <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px] text-[#6e6e73]">{it.kind !== "main" && parseNum(it.price).state === "blank" ? <span className="text-amber-700">추가 구성의 가격 확인 필요. 가격 근거 없이 금액을 만들지 않아요.</span> : it.priceSource || "가격 근거 미입력"}<Changed path={`exp.items.${it.id}.price`} /><Changed path={`exp.items.${it.id}.qty`} /></p>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => add("exp.items", { kind: "handpiece", model: "", desc: "", qty: "1", unit: "pc", price: "", priceSource: "", hs: deal.exp.items[0]?.hs || "" })} className="mt-2 inline-flex h-8 items-center gap-1 rounded-full px-2 text-[13px] font-medium text-primary hover:bg-[var(--fill-soft)]"><Plus className="size-3.5" />핸드피스·옵션 추가</button>
          <p className="mt-2 text-[14px]">수출 금액 <b className="tabular-nums">{E.total !== null ? fmtMoney(E.total, ec) : "빈칸이 있어 계산하지 않았어요"}</b> <span className="text-[12px] text-[#6e6e73]">{deal.exp.incoterm} {deal.exp.place}</span></p>
        </fieldset>

        <fieldset className="grid grid-cols-2 gap-4">
          <legend className="mb-3 flex w-full items-center text-[15px] font-semibold">환율과 수입 세금<span className="ml-auto"><EvidenceButton path="econ.fx" onOpen={onEv} /></span></legend>
          <NumField path="econ.fx.rate" label={`환율 (${lc} / ${ec})`} unit={lc} hint={[deal.econ.fx.source, deal.econ.fx.date].filter(Boolean).join(", ") || "기준일과 출처를 적어 주세요"} />
          <TextField path="econ.fx.date" label="환율 기준일" placeholder="YYYY-MM-DD" />
          <NumField path="econ.dutyPct" label="관세율" unit="%" hint={deal.econ.dutyBasis || "과세가격(CIF)에 적용"} />
          <div className="grid grid-cols-2 gap-2">
            <NumField path="econ.importVatPct" label="수입 부가세" unit="%" hint="결제 흐름에만" />
            <NumField path="econ.pph22Pct" label="PPh 22" unit="%" hint="결제 흐름에만" />
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-[15px] font-semibold">파트너가 부담하는 비용</legend>
          <p className="mb-3 text-[12px] text-[#6e6e73]">수출 통화 항목은 환율로 바꿔 더해요. 같은 비용을 두 번 넣지 마세요 (예: 보증 수리를 여기와 병원 유지비에 모두 넣지 않기).</p>
          <div className="space-y-3">
            {deal.econ.costs.map((c, i) => {
              const pc = parseNum(c.amount);
              return (
                <div key={c.id} className="rounded-2xl border border-[var(--line)] p-3" data-field={`econ.costs.${c.id}.amount`}>
                  <div className="flex items-center gap-2">
                    <input aria-label={`비용 ${i + 1} 이름`} value={c.label} onChange={(e) => update(`econ.costs.${c.id}.label`, e.target.value)} className={cn(CTRL, "h-9 text-[14px]")} />
                    <button type="button" aria-label={`${c.label || "비용"} 삭제`} onClick={() => remove("econ.costs", c.id)} className="grid size-8 shrink-0 place-items-center rounded-full text-[#86868b] hover:bg-[var(--fill)]"><Trash2 className="size-4" /></button>
                  </div>
                  <div className="mt-2 grid grid-cols-[minmax(0,1fr)_84px] gap-2 sm:grid-cols-[minmax(0,1fr)_84px_110px_100px]">
                    <input id={fieldId(`econ.costs.${c.id}.amount`)} aria-label={`${c.label || "비용"} 금액`} inputMode="decimal" value={c.amount} aria-invalid={pc.state !== "ok" || pc.value < 0 || undefined} onChange={(e) => update(`econ.costs.${c.id}.amount`, e.target.value)} className={cn(CTRL, "h-9 text-right text-[14px] tabular-nums")} />
                    <select aria-label={`${c.label || "비용"} 통화`} value={c.currency} onChange={(e) => update(`econ.costs.${c.id}.currency`, e.target.value)} className={cn(CTRL, "h-9 px-2 text-[13px]")}>{[ec, lc].filter((v, j, a) => a.indexOf(v) === j).map((k) => <option key={k}>{k}</option>)}</select>
                    <select aria-label={`${c.label || "비용"} 시점`} value={c.when} onChange={(e) => update(`econ.costs.${c.id}.when`, e.target.value)} className={cn(CTRL, "h-9 px-2 text-[13px]")}>{WHEN.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                    <select aria-label={`${c.label || "비용"} 출처 구분`} value={c.basis} onChange={(e) => update(`econ.costs.${c.id}.basis`, e.target.value)} className={cn(CTRL, "h-9 px-2 text-[13px]")}>{BASIS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#424245]">
                    <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={c.included} onChange={(e) => update(`econ.costs.${c.id}.included`, e.target.checked)} className="accent-[var(--primary)]" />손익에 포함</label>
                    <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={c.inCif} disabled={c.currency !== ec} onChange={(e) => update(`econ.costs.${c.id}.inCif`, e.target.checked)} className="accent-[var(--primary)]" />관세 과세가격(CIF)에 포함</label>
                    <span className="text-[#86868b]">{c.note}</span><Changed path={`econ.costs.${c.id}.amount`} />
                  </div>
                </div>
              );
            })}
          </div>
          <button type="button" onClick={() => add("econ.costs", { label: "", amount: "", currency: lc, basis: "user", included: true, inCif: false, when: "install", note: "" })} className="mt-2 inline-flex h-8 items-center gap-1 rounded-full px-2 text-[13px] font-medium text-primary hover:bg-[var(--fill-soft)]"><Plus className="size-3.5" />비용 추가</button>
        </fieldset>

        <fieldset>
          <legend className="mb-1 flex w-full items-center text-[15px] font-semibold">현지 판매가 (파트너 → 병원, {lc})<span className="ml-auto"><EvidenceButton path="local.lines" onOpen={onEv} /></span></legend>
          <p className="mb-3 text-[12px] text-[#6e6e73]">수출가에 환율을 곱해 정하지 않아요. 파트너가 제시한 값이나 팀이 정한 내부 설정값만 써요.</p>
          {deal.local.lines.map((l, i) => (
            <div key={l.id} className="mb-2"><NumField path={`local.lines.${l.id}.price`} label={`${l.desc ? l.desc.slice(0, 40) + (l.desc.length > 40 ? "…" : "") : `현지 품목 ${i + 1}`} 공급가`} unit={lc} slider={{ min: 300000000, max: 700000000, step: 1000000 }} hint={`수량 ${l.qty || "—"} ${l.unit}`} /></div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <NumField path="local.vatPct" label="부가세율" unit="%" hint="현지 견적에 표시" />
            <SelectField path="local.priceBasis" label="현지 가격의 출처" options={[["", "선택"], ["partner", "파트너 제시"], ["mock", "내부 설정값"]]} />
          </div>
          <p className="mt-2 text-[14px]">병원 도입가 <b className="tabular-nums">{rp(total)}</b> <span className="text-[12px] text-[#6e6e73]">부가세 포함. 현지 견적과 병원 운영의 초기 도입비에 함께 반영돼요.</span></p>
        </fieldset>
      </div>

      <div className="min-w-0 lg:sticky lg:top-16 lg:self-start">
        <h3 className="text-[15px] font-semibold">병원 도입가는 무엇으로 이뤄지나</h3>
        {total !== null && P.complete ? (
          <div className="mt-3">
            <div className="flex h-10 w-full overflow-hidden rounded-xl" role="img" aria-label={`병원 도입가 ${rp(total)} 구성 누적 막대`}>
              {parts.map((p, i) => <div key={p.label} style={{ width: `${Math.max(0, (p.v / total) * 100)}%`, background: segColor(p, i) }} className="border-r border-white last:border-r-0" />)}
            </div>
            <ul className="mt-3 grid gap-x-6 gap-y-1 text-[12px] sm:grid-cols-2">
              {parts.map((p, i) => (
                <li key={p.label} className="flex items-center gap-2 min-w-0">
                  <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: segColor(p, i) }} aria-hidden="true" />
                  <span className="min-w-0 truncate text-[#424245]">{p.label}</span>
                  <span className="ml-auto tabular-nums text-[#6e6e73]">{fmt((p.v / total) * 100, 1)}%</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-[#86868b]">합계 = 병원 도입가 {rp(total)} (부가세 포함). 각 금액은 한 번만 들어가요.</p>
          </div>
        ) : <p className="mt-2 rounded-2xl bg-amber-50 px-4 py-3 text-[13px] text-amber-800">{P.missing.length ? `빠진 값: ${P.missing.join(", ")}. 포함된 범위만 아래 표에 보여요.` : "현지 판매가가 없어 구성을 그리지 않았어요."}</p>}
        <table className="mt-4 w-full text-[14px]" data-testid="partner-table">
          <tbody>
            <tr className="border-b border-[var(--line-strong)]"><th scope="row" className="py-2 text-left font-medium">현지 매출 (공급가, 부가세 제외)</th><td className="py-2 text-right font-medium tabular-nums">{rp(P.revenue)}</td></tr>
            {P.included.map((x) => <tr key={x.key} className="border-b border-[var(--line)]"><th scope="row" className="py-2 pl-3 text-left font-normal text-[#424245]">− {x.label}<span className="block text-[11px] text-[#86868b]">{x.src}{x.basis ? `, ${BASIS.find((b) => b[0] === x.basis)?.[1] || ""}` : ""}</span></th><td className="py-2 text-right tabular-nums">{rp(x.local)}</td></tr>)}
            <tr className="border-t-2 border-[#1d1d1f]"><th scope="row" className="py-2.5 text-left font-semibold">파트너 거래 손익 (세전){!P.complete && " (일부 비용만)"}</th><td className="py-2.5 text-right text-[17px] font-semibold tabular-nums" data-testid="partner-profit">{rp(P.profit)}{P.margin !== null && <span className="block text-[12px] font-normal text-[#6e6e73]">매출 대비 {fmt(P.margin * 100, 1)}%</span>}</td></tr>
          </tbody>
        </table>
        <ul className="mt-3 space-y-1 text-[12px] leading-relaxed text-[#6e6e73]">
          {P.missing.length > 0 && <li className="text-amber-700">계산에 넣지 못한 항목: {P.missing.join(", ")}</li>}
          {P.excluded.length > 0 && <li>손익에서 뺀 항목: {P.excluded.join(", ")}</li>}
          <li>수입 부가세와 PPh 22는 공제·선납으로 보고 손익에서 빼고, 결제 흐름의 현금 지출에만 넣어요.</li>
          <li>제조원가 자료가 없어 제조사 이익은 계산하지 않아요. 제조사 매출은 수출 금액 {E.total !== null ? fmtMoney(E.total, ec) : "—"}이에요.</li>
          {deal.sampleKey && PACK.notes?.partner && <li>{PACK.notes.partner}</li>}
        </ul>
      </div>
    </div>
  );
}

/* ---------- 결제 흐름 ---------- */
function Cash() {
  const { deal } = useDeal();
  const C = cashFlow(deal);
  const who = { "hospital→partner": "병원 → 파트너", "partner→maker": "파트너 → 제조사", "partner→carrier": "파트너 → 운송·보험", "partner→customs": "파트너 → 세관", "partner→local": "파트너 → 현지 비용" };
  return (
    <div className="max-w-[860px]">
      <p className="text-[14px] text-[#424245]">날짜가 정해지지 않아 단계 순서로만 보여 줘요. 파트너의 처음 현금은 0으로 가정했어요.</p>
      <table className="mt-4 w-full text-[14px]" data-testid="cash-table">
        <thead><tr className="border-b border-[var(--line-strong)] text-left text-[12px] text-[#6e6e73]"><th className="py-2 font-medium">단계</th><th className="py-2 font-medium">흐름</th><th className="py-2 text-right font-medium">파트너 현금 ({C.cur})</th><th className="py-2 text-right font-medium">누적</th></tr></thead>
        <tbody>
          {C.rows.map((r, i) => (
            <tr key={i} className="border-b border-[var(--line)]">
              <td className="py-2.5 pr-2 text-[13px] text-[#6e6e73]">{r.step}</td>
              <td className="py-2.5 pr-2">{r.label}<span className="block text-[11px] text-[#86868b]">{who[r.who]}</span></td>
              <td className={cn("py-2.5 text-right tabular-nums", r.amount < 0 && "text-[#424245]")}>{r.amount > 0 ? "+" : "−"}{fmt(Math.abs(r.amount))}</td>
              <td className={cn("py-2.5 text-right tabular-nums", r.acc < 0 && "text-amber-700")}>{r.acc < 0 ? "−" : ""}{fmt(Math.abs(r.acc))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {C.rows.length > 0 && <p className="mt-4 text-[17px]">이 순서에서 파트너에게 일시적으로 필요한 자금 <b className="tabular-nums" data-testid="cash-need">{rp(C.need)}</b></p>}
      <ul className="mt-3 space-y-1 text-[12px] leading-relaxed text-[#6e6e73]">
        <li>수입 부가세와 PPh 22는 나중에 공제되거나 법인세에서 빠지지만, 수입 신고 때는 현금으로 나가요.</li>
        <li>제조사는 출하 전에 수출 대금을 받아요 (T/T 선지급). 병원은 계약금과 검수 후 잔금을 내요.</li>
        <li>금융비 항목을 비용에 넣었다면, 이 부족 자금과 기간에 맞는지 함께 확인하세요.</li>
      </ul>
    </div>
  );
}

const TABS = [["hospital", "병원 손익"], ["deal", "파트너 마진"], ["cash", "자금 흐름"]];

export default function PricePage() {
  const { deal, actions } = useDeal();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some(([k]) => k === params.get("tab")) ? params.get("tab") : "hospital";
  const [ev, setEv] = useState(null);
  const anyChanged = deal.baseline && JSON.stringify(withBaseline(deal).econ) !== JSON.stringify(deal.econ) || (deal.baseline && JSON.stringify(deal.baseline.local.lines) !== JSON.stringify(deal.local.lines)) || (deal.baseline && JSON.stringify(deal.baseline.exp.items) !== JSON.stringify(deal.exp.items));
  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-28 sm:px-6 lg:pb-20">
      <div className="flex flex-wrap items-end justify-between gap-4 pt-10 pb-6">
        <div>
          <h1 className="text-[34px] font-bold tracking-[-0.03em] sm:text-[40px]">수익성</h1>
          <p className="mt-1 max-w-[640px] text-[15px] text-[#424245]">병원 손익, 파트너 마진, 자금 흐름을 같은 거래 데이터로 계산합니다. 판매가를 바꾸면 현지 견적과 병원 도입비가 함께, 시술량을 바꾸면 병원 손익만 바뀝니다.</p>
        </div>
        {deal.baseline && (
          <button type="button" onClick={() => actions.resetToBaseline()} disabled={!anyChanged} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--line-strong)] px-4 text-[14px] font-medium disabled:opacity-40"><RotateCcw className="size-4" />기준값으로 되돌리기</button>
        )}
      </div>
      <div role="tablist" aria-label="수익성 보기" className="seg mb-8">
        {TABS.map(([k, l]) => <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setParams({ tab: k })} className="seg-btn">{l}</button>)}
      </div>
      {tab === "hospital" && <Hospital onEv={setEv} />}
      {tab === "deal" && <DealPrice onEv={setEv} />}
      {tab === "cash" && <Cash />}
      <EvidencePanel open={!!ev} path={ev} onOpenChange={(o) => !o && setEv(null)} />
    </div>
  );
}
