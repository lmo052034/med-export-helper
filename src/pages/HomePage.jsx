/* 홈(통합 화면): 오늘 업무 요약 → 제품(사진과 설명) → 거래조건(표) → 수익성(입력과 그래프) → 서류(미리보기).
   모든 숫자는 지금 열린 거래(useDeal)와 같은 계산 함수에서 가져옵니다. 세부 화면은 각 영역의 링크로 이동 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PACK } from "@pack";
import { useDeal } from "../lib/deal/DealContext.jsx";
import { calcExport, calcLocal } from "../lib/deal/calc.js";
import { hospitalCalc, surplusCurve } from "../lib/deal/econ.js";
import { fmtMoney, parseNum } from "../lib/deal/money.js";
import { DocView } from "../components/deal/Docs.jsx";
import { LineChart } from "../components/deal/LineChart.jsx";
import { cn } from "@/lib/utils";
import Desk from "../components/deal/Desk.jsx";

const fmt = (v, d = 0) => (v === null || v === undefined || !Number.isFinite(v) ? "—" : (Math.round(v * 10 ** d) / 10 ** d).toLocaleString("en-US", { maximumFractionDigits: d }));
const rp = (v) => (v === null || v === undefined || !Number.isFinite(v) ? "—" : `Rp ${fmt(v)}`);
const rpShort = (v) => { const a = Math.abs(v); const s = v < 0 ? "−" : ""; return a >= 1e9 ? `${s}${fmt(a / 1e9, 2)}B` : a >= 1e6 ? `${s}${fmt(a / 1e6, 1)}M` : `${s}${fmt(a)}`; };
const VARIANT = import.meta.env.VITE_VARIANT || "c";
const CTRL = "w-full min-w-0 rounded-[10px] border border-[var(--line-strong)] bg-white px-3 text-[15px] outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20";

/* 영역 머리글: 제목 왼쪽, 세부 화면 링크 오른쪽 */
function Panel({ id, title, to, more, className, children }) {
  if (VARIANT === "b") return (
    <section id={id} aria-labelledby={`${id}-t`} className="grid scroll-mt-28 gap-4 border-t border-[var(--line)] py-10 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">
      <div>
        <h2 id={`${id}-t`} className="text-[20px] font-semibold tracking-tight">{title}</h2>
        {to && <Link to={to} className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline">{more}<ArrowRight className="size-3.5" aria-hidden="true" /></Link>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
  if (VARIANT === "c") return (
    <section id={id} aria-labelledby={`${id}-t`} className={cn("min-w-0 rounded-2xl bg-white p-5 sm:p-6", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 id={`${id}-t`} className="text-[13px] font-semibold text-[#6e6e73]">{title}</h2>
        {to && <Link to={to} className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-primary hover:underline">{more}<ArrowRight className="size-3.5" aria-hidden="true" /></Link>}
      </div>
      <div className="pt-3">{children}</div>
    </section>
  );
  return (
    <section id={id} aria-labelledby={`${id}-t`} className={cn("min-w-0 rounded-2xl bg-white p-5 sm:p-7", className)}>
      <div className="flex items-baseline justify-between gap-4 border-b border-[var(--line)] pb-3">
        <h2 id={`${id}-t`} className="text-[19px] font-semibold tracking-tight">{title}</h2>
        {to && <Link to={to} className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-primary hover:underline">{more}<ArrowRight className="size-3.5" aria-hidden="true" /></Link>}
      </div>
      <div className="pt-5">{children}</div>
    </section>
  );
}

/* 1. 오늘 업무 요약 */
function Today({ listOnly, className }) {
  const D = PACK.desk;
  if (!D) return null;
  const by = (...k) => D.tasks.filter((t) => k.includes(t.kind)).length;
  const figs = [["회신 대기 견적", by("quote", "follow")], ["이번 주 시연", by("demo")], ["서류, 선적 할 일", by("doc", "ship")], ["A/S 요청", by("as")], ["진행 중 병원", D.hospitals.length]];
  const next = [...D.tasks].sort((a, b) => a.sort - b.sort).slice(0, listOnly ? 6 : 4);
  if (listOnly) return (
    <Panel id="today" title="이번 주 할 일" to="/desk" more="업무 현황" className={className}>
      <table className="w-full text-[14px]">
        <caption className="sr-only">가까운 기한 순 할 일</caption>
        <tbody>
          {next.map((t) => (
            <tr key={t.title} className="border-b border-[var(--line)] last:border-0">
              <td className="w-14 py-2 align-top tabular-nums font-medium text-[#1d1d1f]">{t.due}</td>
              <td className="py-2 align-top">{t.title}<span className="block text-[12px] text-[#86868b]">{t.owner}{t.meta ? `, ${t.meta}` : ""}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
  return (
    <Panel id="today" title="오늘 업무" to="/desk" more="업무 현황 전체">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <dl className="grid self-start grid-cols-3 gap-y-4 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5">
          {figs.map(([k, v]) => (
            <div key={k} className="min-w-0 border-l border-[var(--line)] pl-4 first:border-l-0 first:pl-0 [&:nth-child(4)]:border-l-0 [&:nth-child(4)]:pl-0 sm:[&:nth-child(4)]:border-l sm:[&:nth-child(4)]:pl-4 lg:[&:nth-child(4)]:border-l-0 lg:[&:nth-child(4)]:pl-0 xl:[&:nth-child(4)]:border-l xl:[&:nth-child(4)]:pl-4">
              <dt className="text-[12px] text-[#6e6e73]">{k}</dt>
              <dd className="mt-0.5 text-[26px] font-semibold tabular-nums tracking-tight">{v}</dd>
            </div>
          ))}
        </dl>
        <table className="w-full text-[14px]">
          <caption className="sr-only">가까운 기한 순 할 일</caption>
          <tbody>
            {next.map((t) => (
              <tr key={t.title} className="border-b border-[var(--line)] last:border-0">
                <td className="w-14 py-2 align-top tabular-nums font-medium text-[#1d1d1f]">{t.due}</td>
                <td className="py-2 align-top">{t.title}<span className="block text-[12px] text-[#86868b]">{t.owner}{t.meta ? `, ${t.meta}` : ""}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* 2. 제품: 사진과 설명 */
function Product({ compact, className }) {
  const { deal } = useDeal();
  const p = PACK.product, h = PACK.hero;
  const facts = p.facts.slice(0, compact ? 3 : 5);
  return (
    <Panel id="product" title="제품" to="/evidence" more="제품 자료" className={className ?? "lg:col-span-7"}>
      <div className={cn("grid gap-6", h.image && (compact ? "grid-cols-[96px_minmax(0,1fr)] gap-4" : "sm:grid-cols-[180px_minmax(0,1fr)]"))}>
        {h.image && (
          <figure className="m-0">
            <div className={cn("grid place-items-center rounded-xl bg-[var(--surface-2)]", compact ? "h-[150px] p-2" : "h-[240px] p-3")}><img src={h.image} alt={h.imageAlt} className="max-h-full w-auto object-contain" loading="lazy" /></div>
            {!compact && p.handpieces.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {p.handpieces.map((hp) => <div key={hp.name} className="grid h-[72px] place-items-center rounded-lg bg-[var(--surface-2)] p-1.5"><img src={hp.img} alt={hp.alt} className="max-h-full w-auto object-contain" loading="lazy" /></div>)}
              </div>
            )}
            {!compact && <figcaption className="mt-1.5 text-[11px] leading-snug text-[#86868b]">{h.imageCredit}</figcaption>}
          </figure>
        )}
        <div className="min-w-0">
          <p className="text-[13px] text-[#6e6e73]">{PACK.review?.device?.name || "치료 장비"}</p>
          <p className="mt-0.5 text-[22px] font-semibold tracking-tight">{PACK.review?.device?.model || deal.exp.items[0]?.model || "본체"}</p>
          <p className="mt-2 text-[15px] leading-relaxed text-[#424245]">{compact ? p.title : `${p.title}. ${p.lead}`}</p>
          <table className="mt-4 w-full text-[14px]">
            <tbody>
              {facts.map((f) => (
                <tr key={f.k} className="border-t border-[var(--line)]">
                  <th scope="row" className="w-[34%] py-2 pr-3 text-left align-top font-normal text-[#6e6e73]">{f.k}</th>
                  <td className="py-2 align-top">{f.v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Panel>
  );
}

/* 3. 거래조건: 표 */
function Terms({ className }) {
  const { deal } = useDeal();
  const E = calcExport(deal), L = calcLocal(deal);
  const pay = (arr) => arr.filter((p) => p.label || p.pct).map((p) => `${p.pct ? `${p.pct}% ` : ""}${p.label}${p.due ? ` (${p.due})` : ""}`).join(", ") || "—";
  const items = deal.exp.items.map((i) => `${i.model || "품목"} ${i.qty || "—"} ${i.unit || ""}`.trim()).join(", ");
  const rows = [
    ["수출", [
      ["품목", items],
      ["인도조건", `${deal.exp.incoterm || "—"} ${deal.exp.place || ""}`.trim()],
      ["수출 금액", E.total !== null ? fmtMoney(E.total, deal.exp.currency) : "단가 확인 필요"],
      ["결제", pay(deal.exp.payment)],
      ["납기", deal.exp.leadTime || "—"],
      ["HS 코드", deal.exp.items[0]?.hs || "—"],
    ]],
    ...(deal.local.enabled ? [["현지 판매", [
      ["병원 도입가", L.total !== null ? `${rp(L.total)} (부가세 ${deal.local.vatPct || "—"}% 포함)` : "—"],
      ["결제", pay(deal.local.payment)],
    ]]] : []),
  ];
  return (
    <Panel id="terms" title="거래조건" to="/deal" more="거래조건 입력" className={className ?? "lg:col-span-5"}>
      <p className="-mt-1 mb-3 text-[13px] text-[#6e6e73]">{deal.name}</p>
      <table className="w-full text-[14px]">
        {rows.map(([g, rs]) => (
          <tbody key={g}>
            <tr><th colSpan={2} scope="colgroup" className="pt-3 pb-1 text-left text-[12px] font-semibold text-primary first:pt-0">{g}</th></tr>
            {rs.map(([k, v]) => (
              <tr key={g + k} className="border-t border-[var(--line)]">
                <th scope="row" className="w-[30%] py-2 pr-3 text-left align-top font-normal text-[#6e6e73]">{k}</th>
                <td className="py-2 align-top tabular-nums">{v}</td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </Panel>
  );
}

/* 4. 수익성: 입력과 그래프 */
function Profit({ stack, className }) {
  const { deal, update } = useDeal();
  const H = hospitalCalc(deal);
  const curve = useMemo(() => surplusCurve(deal, 120, 2).map((p) => ({ x: p.n, y: p.v })), [deal]);
  const h = deal.econ.hospital;
  const life = Number(PACK.review?.defaults?.device?.lifeMonths) || 48;
  const bepDep = H.contribution > 0 && H.invest !== null && H.fixed !== null ? Math.ceil((H.fixed + H.invest / life) / H.contribution) : null;
  const inputs = [
    ["econ.hospital.price", "회당 실제 수납액", "IDR", h.price, { min: 100000, max: 1200000, step: 1000 }],
    ["econ.hospital.sessions", "월 유료 시술", "회", h.sessions, { min: 0, max: 150, step: 1 }],
  ];
  const out = [
    ["월 운영 현금잉여", rp(H.surplus)],
    [`손익분기 (장비비 ${life}개월 배분)`, bepDep !== null ? `월 ${bepDep}회` : "산출 불가"],
    ["손익분기 (운영비만)", H.bep !== null ? `월 ${H.bep}회` : "산출 불가"],
    ["투자 회수", H.payback !== null ? `${fmt(H.payback, 1)}개월` : "산출 불가"],
    ["병원 도입비", rp(H.invest)],
  ];
  return (
    <Panel id="profit" title="병원 수익성" to="/price" more="수익성 화면" className={className ?? "lg:col-span-12"}>
      <div className={cn("grid gap-8", stack ? "[&>*:first-child]:order-2 [&>*:last-child]:order-1 [&>*:first-child]:md:grid [&>*:first-child]:md:grid-cols-2 [&>*:first-child]:md:gap-x-8 [&>*:first-child>dl]:md:mt-0" : "lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]")}>
        <div className="min-w-0">
          <div className="space-y-5">
            {inputs.map(([path, label, unit, v, sl]) => {
              const p = parseNum(v);
              return (
                <div key={path}>
                  <div className="grid grid-cols-[minmax(0,1fr)_150px_32px] items-center gap-2">
                    <label htmlFor={`home-${path}`} className="text-[14px] text-[#424245]">{label}</label>
                    <input id={`home-${path}`} inputMode="decimal" value={v} onChange={(e) => update(path, e.target.value)} className={cn(CTRL, "h-10 text-right tabular-nums")} />
                    <span className="text-[13px] text-[#6e6e73]">{unit}</span>
                  </div>
                  <input type="range" aria-label={`${label} 슬라이더`} min={sl.min} max={sl.max} step={sl.step} value={p.state === "ok" ? Math.min(Math.max(p.value, sl.min), sl.max) : sl.min} onChange={(e) => update(path, e.target.value)} className="range mt-2 w-full" />
                </div>
              );
            })}
          </div>
          <dl className="mt-6 border-t border-[var(--line)]">
            {out.map(([k, v], i) => (
              <div key={k} className="flex items-baseline justify-between gap-3 border-b border-[var(--line)] py-2.5">
                <dt className="text-[14px] text-[#6e6e73]">{k}</dt>
                <dd className={cn("tabular-nums", i === 0 ? "text-[20px] font-semibold" : "text-[15px] font-medium")}>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-[12px] leading-snug text-[#86868b]">장비 1대의 월 현금흐름, 세전. 변동비와 고정비는 수익성 화면에서 바꿉니다.</p>
        </div>
        <div className="min-w-0">
          <p className="mb-2 text-[14px] font-medium text-[#424245]">월 시술 건수별 월 운영 현금잉여</p>
          <LineChart data={curve} label="월 시술 건수에 따른 월 운영 현금잉여 그래프" xLabel="월 유료 시술 (회)" yLabel="IDR / 월" fmtY={rpShort} height={260} markers={[...(H.sessions !== null && H.surplus !== null ? [{ x: H.sessions, y: H.surplus, label: `현재 ${H.sessions}회` }] : []), ...(bepDep !== null ? [{ x: bepDep, label: `장비비 포함 손익분기 ${bepDep}회`, color: "var(--primary)" }] : []), ...(H.bep !== null ? [{ x: H.bep, y: 0, label: `운영비만 ${H.bep}회`, color: "#86868b" }] : [])]} />
        </div>
      </div>
    </Panel>
  );
}

/* 5. 서류: 문서 미리보기 */
function Docs({ className }) {
  const { deal } = useDeal();
  const list = [["quote", "수출 견적서"], ["invoice", "상업송장"], ...(deal.local.enabled ? [["local", "현지 견적"]] : [])];
  return (
    <Panel id="docs" title="서류" to="/docs" more="서류 전체" className={className ?? "lg:col-span-12"}>
      <ul className={cn("grid gap-5 sm:grid-cols-2", list.length === 3 && "lg:grid-cols-3")}>
        {list.map(([k, t]) => (
          <li key={k} className="min-w-0">
            <Link to={`/docs?doc=${k}`} className="group block">
              <div className="relative h-[300px] overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-2)]" aria-hidden="true">
                <div style={{ scale: VARIANT === "a" ? "0.4" : "0.31" }} className="pointer-events-none absolute top-3 left-1/2 w-[820px] origin-top -translate-x-1/2 bg-white shadow-sm" inert="">
                  <DocView id={k} d={deal} />
                </div>
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--surface-2)] to-transparent" />
              </div>
              <p className="mt-2 flex items-center justify-between text-[14px] font-medium">{t}<ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></p>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Summary() {
  const { deal } = useDeal();
  const D = PACK.desk;
  const H = hospitalCalc(deal);
  const life = Number(PACK.review?.defaults?.device?.lifeMonths) || 48;
  const bepDep = H.contribution > 0 && H.invest !== null && H.fixed !== null ? Math.ceil((H.fixed + H.invest / life) / H.contribution) : null;
  const by = (...k) => (D ? D.tasks.filter((t) => k.includes(t.kind)).length : 0);
  const figs = [
    ["병원 월 운영 현금잉여", rp(H.surplus), `시술 월 ${H.sessions ?? "—"}회 기준`, "/price"],
    ["손익분기", bepDep !== null ? `월 ${bepDep}회` : "—", `장비비 ${life}개월 배분 포함`, "/price"],
    ["회신 대기 견적", `${by("quote", "follow")}건`, "견적, 원장 질문", "/desk"],
    ["진행 중 병원", `${D?.hospitals.length ?? 0}곳`, `이번 주 시연 ${by("demo")}건`, "/desk"],
  ];
  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-2xl bg-white lg:grid-cols-4">
      {figs.map(([k, v, n, to], i) => (
        <Link key={k} to={to} className={cn("block px-5 py-5 hover:bg-[var(--fill-soft)] sm:px-6", i % 2 === 1 && "border-l border-[var(--line)]", i >= 2 && "border-t border-[var(--line)] lg:border-t-0", i === 2 && "lg:border-l")}>
          <dt className="text-[13px] text-[#6e6e73]">{k}</dt>
          <dd className="mt-1 text-[26px] font-semibold tabular-nums tracking-tight sm:text-[30px]">{v}</dd>
          <dd className="text-[12px] text-[#86868b]">{n}</dd>
        </Link>
      ))}
    </dl>
  );
}

const ANCHORS = [["today", "오늘 업무"], ["product", "제품"], ["terms", "거래조건"], ["profit", "수익성"], ["docs", "서류"]];

export default function HomePage() {
  const D = PACK.desk;
  if (VARIANT === "b") return (
    <div className="bg-white px-4 pb-16 sm:px-6">
      <div className="mx-auto max-w-[1120px]">
        <div className="flex flex-wrap items-end justify-between gap-2 pt-10 pb-6">
          <div>
            <h1 className="text-[30px] font-bold tracking-[-0.03em] sm:text-[36px]">{PACK.brand}</h1>
            {D?.team && <p className="mt-0.5 text-[14px] text-[#6e6e73]">{D.team}</p>}
          </div>
          {D?.asOf && <p className="text-[13px] text-[#6e6e73]">{D.asOf}</p>}
        </div>
        <nav aria-label="이 화면의 영역" className="sticky top-12 z-20 -mx-4 overflow-x-auto border-y border-[var(--line)] bg-white/95 px-4 backdrop-blur sm:-mx-6 sm:px-6">
          <ul className="flex gap-6 text-[14px]">{ANCHORS.map(([id, l]) => <li key={id}><a href={`#${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); }} className="block py-3 whitespace-nowrap text-[#424245] hover:text-primary">{l}</a></li>)}</ul>
        </nav>
        <Today />
        <Product />
        <Terms />
        <Profit />
        <Docs />
        {D?.note && <p className="border-t border-[var(--line)] pt-4 text-[12px] text-[#86868b]">{D.note}</p>}
      </div>
    </div>
  );
  if (VARIANT === "c") return (
    <div className="bg-[var(--surface-2)] px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-wrap items-end justify-between gap-2 pb-5">
          <h1 className="text-[28px] font-bold tracking-[-0.03em] sm:text-[32px]">{PACK.brand}</h1>
          {D?.asOf && <p className="text-[13px] text-[#6e6e73]">{D?.team ? `${D.team}, ` : ""}{D.asOf}</p>}
        </div>
        <Summary />
        <div className="mt-5 grid gap-5 lg:grid-cols-12">
          <div className="grid min-w-0 content-start gap-5 lg:col-span-8">
            <Profit stack className="" />
            <Docs className="" />
          </div>
          <div className="grid min-w-0 content-start gap-5 lg:col-span-4">
            <Today listOnly className="" />
            <Terms className="" />
            <Product compact className="" />
          </div>
        </div>
        {D?.note && <p className="mt-4 text-[12px] text-[#86868b]">{D.note}</p>}
      </div>
    </div>
  );
  return (
    <div className="bg-[var(--surface-2)] px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-wrap items-end justify-between gap-2 pb-5">
          <div>
            <h1 className="text-[28px] font-bold tracking-[-0.03em] sm:text-[34px]">{PACK.brand}</h1>
            {D?.team && <p className="mt-0.5 text-[14px] text-[#6e6e73]">{D.team}</p>}
          </div>
          {D?.asOf && <p className="text-[13px] text-[#6e6e73]">{D.asOf}</p>}
        </div>
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-12"><Today /></div>
          <Product />
          <Terms />
          <Profit />
          <Docs />
        </div>
        {D?.note && <p className="mt-4 text-[12px] text-[#86868b]">{D.note}</p>}
      </div>
    </div>
  );
}
