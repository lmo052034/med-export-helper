/* 홈: 고정 사용자 인사 → 진행 중 수출 1건을 사업계획서 순서(세번 → 관세와 FTA → 판매 허가 → 거래 구조 → 병원 수익성 → 서류)로 한 화면에.
   발표 1분 시연 흐름: 위에서 아래로 훑고, 5단계 슬라이더 조작, 6단계 상업송장 열기.
   단계별 문구와 출처는 콘텐츠 팩의 PACK.flow, 금액과 손익분기는 지금 거래(useDeal)와 같은 계산 함수 */
import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Check, RefreshCw } from "lucide-react";
import { PACK } from "@pack";
import { useDeal } from "../lib/deal/DealContext.jsx";
import { calcExport, calcLocal } from "../lib/deal/calc.js";
import { summarize } from "../lib/deal/checks.js";
import { hospitalCalc, surplusCurve } from "../lib/deal/econ.js";
import { fmtMoney, parseNum } from "../lib/deal/money.js";
import { DocView } from "../components/deal/Docs.jsx";
import { LineChart } from "../components/deal/LineChart.jsx";
import { USER, greeting, today } from "../lib/user.js";
import { cn } from "@/lib/utils";

const fmt = (v, d = 0) => (v === null || v === undefined || !Number.isFinite(v) ? "—" : (Math.round(v * 10 ** d) / 10 ** d).toLocaleString("en-US", { maximumFractionDigits: d }));
const rp = (v) => (v === null || v === undefined || !Number.isFinite(v) ? "—" : `Rp${fmt(v)}`);
const rpShort = (v) => { const a = Math.abs(v); const s = v < 0 ? "−" : ""; return a >= 1e9 ? `${s}${fmt(a / 1e9, 2)}B` : a >= 1e6 ? `${s}${fmt(a / 1e6, 1)}M` : `${s}${fmt(a)}`; };
const STAGE = { quote: "견적 단계", invoice: "인보이스 작성 단계" };

/* 한 단계 = 한 줄: 번호와 업무명(왼쪽), 핵심 결과(가운데), 세부(아래), 출처(맨 아래) */
function Step({ no, title, task, result, sub, to, more, src, children }) {
  return (
    <li className="grid gap-x-8 gap-y-3 border-t border-[var(--line)] py-6 first:border-t-0 lg:grid-cols-[220px_minmax(0,1fr)]">
      <div className="flex items-baseline gap-3 lg:block">
        <span className="text-[13px] font-semibold tabular-nums text-primary">{String(no).padStart(2, "0")}</span>
        <div className="lg:mt-1">
          <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
          <p className="text-[13px] text-[#6e6e73]">{task}</p>
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <p className="flex flex-wrap items-baseline gap-x-3"><span className="text-[26px] font-semibold tracking-tight tabular-nums">{result}</span>{sub && <span className="text-[14px] text-[#424245]">{sub}</span>}</p>
          {to && <Link to={to} className="inline-flex shrink-0 items-center gap-1 text-[14px] font-medium text-primary hover:underline">{more}<ArrowRight className="size-4" aria-hidden="true" /></Link>}
        </div>
        {children && <div className="mt-3">{children}</div>}
        {src && <p className="mt-3 text-[12px] leading-snug text-[#86868b]">출처: {src}</p>}
      </div>
    </li>
  );
}

function Rows({ rows, head }) {
  return (
    <table className="w-full max-w-[720px] text-[14px]">
      {head && <thead><tr className="text-left text-[12px] text-[#86868b]">{head.map((h) => <th key={h} className="pb-1.5 pr-3 font-normal">{h}</th>)}</tr></thead>}
      <tbody>
        {rows.map((r) => (
          <tr key={r.join("|")} className="border-t border-[var(--line)]">
            {r.map((c, i) => i === 0
              ? <th key={i} scope="row" className="w-[34%] py-2 pr-3 text-left align-top font-normal text-[#6e6e73]">{c}</th>
              : <td key={i} className="py-2 pr-3 align-top tabular-nums">{c}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* 01 세번: 한국 → 국제 6단위 → 인도네시아 8단위 */
function HsChain({ chain }) {
  return (
    <ol className="flex flex-wrap items-stretch gap-2 text-[14px]">
      {chain.map(([k, v], i) => (
        <li key={k} className="flex items-center gap-2">
          <span className={cn("rounded-lg border px-3 py-2", i === chain.length - 1 ? "border-primary text-primary" : "border-[var(--line-strong)]")}>
            <span className="block text-[11px] text-[#6e6e73]">{k}</span>
            <span className="font-semibold tabular-nums">{v}</span>
          </span>
          {i < chain.length - 1 && <ArrowRight className="size-4 text-[#86868b]" aria-hidden="true" />}
        </li>
      ))}
    </ol>
  );
}

/* 04 거래 구조: 제조사 → 파트너 → 병원, 선 위에 계약과 대금 */
function Structure({ nodes, links }) {
  return (
    <div className="grid items-center gap-2 text-[14px] md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)]">
      {nodes.map((n, i) => (
        <div key={n.name} className="contents">
          <div className={cn("rounded-lg border px-3 py-2.5", i === 1 ? "border-primary" : "border-[var(--line-strong)]")}>
            <p className="font-semibold leading-snug">{n.name}</p>
            <p className="text-[12px] text-[#6e6e73]">{n.role}</p>
          </div>
          {i < links.length && (
            <div className="flex items-center gap-2 px-1 md:flex-col md:items-stretch md:gap-1">
              <p className="text-[12px] leading-snug text-[#424245] md:text-center">{links[i].top}</p>
              <span className="hidden h-px bg-[var(--line-strong)] md:block" aria-hidden="true" />
              <ArrowRight className="size-4 shrink-0 text-[#86868b] md:hidden" aria-hidden="true" />
              <p className="text-[12px] leading-snug text-[#6e6e73] md:text-center">{links[i].bottom}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* 05 병원 수익성: 월 시술 슬라이더 하나와 그래프 */
function Profit() {
  const { deal, update } = useDeal();
  const H = hospitalCalc(deal);
  const curve = useMemo(() => surplusCurve(deal, 120, 2).map((p) => ({ x: p.n, y: p.v })), [deal]);
  const life = Number(PACK.review?.defaults?.device?.lifeMonths) || 48;
  const h = deal.econ.hospital;
  const bep = H.contribution > 0 && H.invest !== null && H.fixed !== null ? Math.ceil((H.fixed + H.invest / life) / H.contribution) : null;
  const monthly = H.surplus !== null && H.invest !== null ? H.surplus - H.invest / life : null;
  const p = parseNum(h.sessions);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
      <div className="min-w-0">
        <div className="grid grid-cols-[minmax(0,1fr)_96px_24px] items-center gap-2">
          <label htmlFor="home-sessions" className="text-[14px] text-[#424245]">월 유료 시술</label>
          <input id="home-sessions" inputMode="decimal" value={h.sessions} onChange={(e) => update("econ.hospital.sessions", e.target.value)} className="h-10 w-full rounded-[10px] border border-[var(--line-strong)] bg-white px-3 text-right text-[15px] tabular-nums outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20" />
          <span className="text-[13px] text-[#6e6e73]">회</span>
        </div>
        <input type="range" aria-label="월 유료 시술 슬라이더" min={0} max={120} step={1} value={p.state === "ok" ? Math.min(Math.max(p.value, 0), 120) : 0} onChange={(e) => update("econ.hospital.sessions", e.target.value)} className="range mt-3 w-full" />
        <dl className="mt-4 border-t border-[var(--line)] text-[14px]">
          {[
            ["월 손익 (장비비 배분 후)", monthly !== null ? `${monthly < 0 ? "−" : "+"}${rp(Math.abs(monthly))}` : "—", monthly !== null && monthly < 0],
            ["회당 실수납", rp(Number(h.price))],
            ["병원 도입가", rp(H.invest)],
          ].map(([k, v, neg]) => (
            <div key={k} className="flex items-baseline justify-between gap-3 border-b border-[var(--line)] py-2">
              <dt className="text-[#6e6e73]">{k}</dt>
              <dd className={cn("font-medium tabular-nums", neg && "text-amber-700")}>{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-[12px] leading-snug text-[#86868b]">장비 대금 {life}개월 배분, 세전, 장비 1대 기준</p>
      </div>
      <div className="min-w-0">
        <LineChart
          data={curve.map((c) => ({ x: c.x, y: H.invest !== null ? c.y - H.invest / life : null }))}
          label="월 시술 건수별 월 손익 그래프" xLabel="월 유료 시술 (회)" yLabel="IDR / 월" fmtY={rpShort} height={220}
          markers={[...(bep !== null ? [{ x: bep, y: 0, label: `손익분기 ${bep}회`, color: "var(--primary)" }] : []), ...(H.sessions !== null && monthly !== null && H.sessions !== bep ? [{ x: H.sessions, y: monthly, label: `현재 ${H.sessions}회` }] : [])]}
        />
      </div>
    </div>
  );
}

/* 06 서류: 같은 거래 데이터에서 만든 견적서와 상업송장 */
function DocThumbs() {
  const { deal } = useDeal();
  const list = [["quote", "수출 견적서"], ["invoice", "상업송장"]];
  return (
    <ul className="grid max-w-[720px] gap-4 sm:grid-cols-2">
      {list.map(([k, t]) => (
        <li key={k} className="min-w-0">
          <Link to={`/docs?doc=${k}`} className="group block">
            <div className="relative h-[230px] overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface-2)]" aria-hidden="true">
              <div style={{ scale: "0.4" }} className="pointer-events-none absolute top-3 left-1/2 w-[820px] origin-top -translate-x-1/2 bg-white shadow-sm" inert="">
                <DocView id={k} d={deal} />
              </div>
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[var(--surface-2)] to-transparent" />
            </div>
            <p className="mt-2 flex items-center justify-between text-[14px] font-medium">{t}<ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* 확인 요청: 콘텐츠 팩 PACK.flow.cases 중 하나를 무작위로 제시. 처리 주체는 담당자,
   화면은 단계별 확인 자료와 입력 반영만 보조. 주소에 ?case=id 를 붙이면 해당 요청 고정 (리허설용) */
function pickCase(list, avoid) {
  const fixed = new URLSearchParams(window.location.hash.split("?")[1] || "").get("case");
  const hit = fixed && list.find((c) => c.id === fixed);
  if (hit && !avoid) return hit;
  const pool = list.filter((c) => c.id !== avoid);
  return pool[Math.floor(Math.random() * pool.length)] || list[0];
}

function Cases({ list }) {
  const { deal, update } = useDeal();
  const [cur, setCur] = useState(() => (list?.length ? pickCase(list) : null));
  const [done, setDone] = useState([]);
  if (!cur) return null;
  const steps = cur.steps;
  const next = steps.findIndex((_, i) => !done.includes(i));
  const all = next === -1;
  const resolve = (path) => path.replace(/\$(\d+)/g, (_, n) => deal.exp.items[Number(n)]?.id ?? n);
  const apply = (st) => { if (st.action) update(resolve(st.action.path), st.action.value); };
  const check = (i) => { apply(steps[i]); setDone((d) => [...d, i]); };
  const other = () => { setCur(pickCase(list, cur.id)); setDone([]); };
  return (
    <section aria-labelledby="case-t" className="mb-5 rounded-2xl bg-white px-5 py-5 sm:px-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <h2 id="case-t" className="text-[13px] font-semibold text-[#6e6e73]">확인 요청 1건, {cur.from}</h2>
          <p className="mt-1 text-[19px] font-semibold leading-snug tracking-tight">“{cur.ask}”</p>
        </div>
        {list.length > 1 && <button type="button" onClick={other} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-[var(--line-strong)] px-3 text-[13px] font-medium hover:bg-[var(--fill-soft)]"><RefreshCw className="size-3.5" aria-hidden="true" />다른 요청</button>}
      </div>
      <ol className="mt-4 border-t border-[var(--line)]">
        {steps.map((st, i) => {
          const ok = done.includes(i), now = i === next;
          return (
            <li key={st.title} className={cn("grid grid-cols-[28px_minmax(0,1fr)_auto] items-start gap-3 border-b border-[var(--line)] py-3", !ok && !now && "opacity-50")}>
              <span className={cn("mt-0.5 grid size-6 place-items-center rounded-full border text-[12px] font-semibold tabular-nums", ok ? "border-primary bg-primary text-white" : now ? "border-primary text-primary" : "border-[var(--line-strong)] text-[#6e6e73]")}>{ok ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}</span>
              <div className="min-w-0">
                <p className="text-[15px] font-medium">{st.title}</p>
                {(ok || now) && <p className="mt-0.5 text-[14px] text-[#424245]"><span className="font-semibold tabular-nums text-[#1d1d1f]">{st.value}</span>{st.detail && <span>, {st.detail}</span>}</p>}
                {(ok || now) && st.src && <p className="mt-0.5 text-[12px] text-[#86868b]">출처: {st.src}</p>}
                {ok && st.action && <p className="mt-1 text-[12px] font-medium text-primary">반영: {st.action.done}</p>}
              </div>
              <div className="flex items-center gap-2">
                {(ok || now) && st.link && <Link to={st.link.to} className="text-[13px] font-medium text-primary hover:underline">{st.link.label}</Link>}
                {now && <button type="button" onClick={() => check(i)} className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-[13px] font-medium text-white hover:brightness-110">{st.action ? st.action.label : "확인"}</button>}
              </div>
            </li>
          );
        })}
      </ol>
      {all && (
        <div className="mt-4 rounded-lg bg-[var(--surface-2)] px-4 py-3">
          <p className="text-[13px] font-semibold text-primary">처리 완료, 회신 내용</p>
          <p className="mt-1 text-[14px] leading-relaxed text-[#1d1d1f]">{cur.reply}</p>
        </div>
      )}
    </section>
  );
}

export default function HomePage() {
  const { search } = useLocation();
  const { deal, findings } = useDeal();
  const F = PACK.flow;
  const E = calcExport(deal), L = calcLocal(deal), H = hospitalCalc(deal);
  const life = Number(PACK.review?.defaults?.device?.lifeMonths) || 48;
  const bep = H.contribution > 0 && H.invest !== null && H.fixed !== null ? Math.ceil((H.fixed + H.invest / life) / H.contribution) : null;
  const s = summarize(findings);
  const pay = (arr) => arr.filter((x) => x.pct).map((x) => `${x.pct}%`).join(" + ");
  const exportAmt = E.total !== null ? fmtMoney(E.total, deal.exp.currency) : "단가 확인 필요";
  const links = [
    { top: `수출 ${exportAmt}, ${deal.exp.incoterm} ${deal.exp.place.split(",")[0]}`, bottom: `${deal.exp.payment[0]?.label || ""} ${deal.exp.payment[0]?.due ? `(${deal.exp.payment[0].due})` : ""}`.trim() },
    ...(deal.local.enabled ? [{ top: `현지 판매 ${rp(L.total)}`, bottom: `부가세 ${deal.local.vatPct}% 포함, 계약금과 잔금 ${pay(deal.local.payment)}` }] : []),
  ];
  return (
    <div className="bg-[var(--surface-2)] px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-wrap items-end justify-between gap-3 pb-6">
          <div>
            <p className="text-[13px] text-[#6e6e73]">{today()}</p>
            <h1 className="mt-0.5 text-[28px] font-bold tracking-[-0.02em] sm:text-[32px]">{USER.name}님, {greeting()}</h1>
            <p className="mt-1 text-[15px] text-[#424245]">{F.lead}</p>
          </div>
          <p className="text-[13px] text-[#6e6e73]">{PACK.asOf}</p>
        </div>

        <Cases key={search} list={F.cases} />

        <section aria-labelledby="deal-t" className="rounded-2xl bg-white px-5 sm:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-[var(--line)] py-5">
            <div>
              <p className="text-[13px] font-semibold text-primary">진행 중 수출{deal.meta.no ? `, ${deal.meta.no}` : ""}</p>
              <h2 id="deal-t" className="mt-0.5 text-[20px] font-semibold tracking-tight">{deal.meta.name}</h2>
            </div>
            <p className="text-[13px] text-[#6e6e73]">{STAGE[deal.meta.stage] || ""}</p>
          </div>
          <ol>
            <Step no={1} title="HS 세번" task={F.hs.task} result={F.hs.result} sub={F.hs.sub} src={F.hs.src}>
              <HsChain chain={F.hs.chain} />
              {F.hs.note && <p className="mt-2 text-[13px] text-[#424245]">{F.hs.note}</p>}
            </Step>
            <Step no={2} title="관세와 FTA" task={F.tariff.task} result={F.tariff.result} sub={F.tariff.sub} src={F.tariff.src}>
              <Rows rows={F.tariff.rows} />
              {F.tariff.cond && <p className="mt-2 text-[13px] text-[#424245]">{F.tariff.cond}</p>}
            </Step>
            <Step no={3} title="판매 허가" task={F.license.task} result={F.license.result} sub={F.license.sub} src={F.license.src}>
              <Rows head={["국가", "등록 조회 결과", "판매 요건"]} rows={(PACK.country?.rows || []).map((r) => [r.country, r.status, r.need.split(".")[0]])} />
            </Step>
            <Step no={4} title="거래 구조" task={F.structure.task} result={F.structure.result} sub={F.structure.sub} to="/price?tab=deal" more="파트너 마진" src={F.structure.src}>
              <Structure nodes={F.structure.nodes} links={links} />
            </Step>
            <Step no={5} title="병원 수익성" task="병원 원장의 도입 판단 근거" result={bep !== null ? `월 ${bep}회` : "산출 불가"} sub="손익분기 유료 시술 수" to={PACK.consult ? "/price?tab=hospital&consult=1" : "/price"} more={PACK.consult?.link || "수익성 계산"} src={F.profit?.src}>
              <Profit />
            </Step>
            <Step no={6} title="견적과 선적 서류" task="같은 거래 데이터로 서류 자동 작성" result={s.fix > 0 ? `수정 필요 ${s.fix}건` : "빈칸 없음"} sub={`견적서, 상업송장, 자동 점검 ${findings.length}항목`} to="/docs?doc=invoice" more="상업송장 열기">
              <DocThumbs />
            </Step>
          </ol>
        </section>
      </div>
    </div>
  );
}
