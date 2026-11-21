/* 수출 제안: 제품 → 국가 → 거래 구조 → 조건 바꿔보기 → 서류·근거.
   글은 콘텐츠 팩(@pack)에서, 숫자는 대표 모의 거래의 계산 함수에서 가져옵니다 */
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { PACK, sampleDeal } from "@pack";
import { useDeal } from "../lib/deal/DealContext.jsx";
import { calcExport, calcLocal } from "../lib/deal/calc.js";
import { hospitalCalc } from "../lib/deal/econ.js";
import { summarize } from "../lib/deal/checks.js";
import { fmtMoney } from "../lib/deal/money.js";
import { cn } from "@/lib/utils";

const idr = (v) => (v === null || v === undefined ? "—" : `Rp ${Math.round(v).toLocaleString("en-US")}`);

function Section({ id, kicker, title, lead, children, tone = "white" }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className={cn("px-4 py-20 sm:px-6 sm:py-28", tone === "gray" && "bg-[var(--surface-2)]")}>
      <div className="mx-auto max-w-[1080px]">
        {kicker && <p className="text-[14px] font-semibold text-primary">{kicker}</p>}
        <h2 id={`${id}-t`} className="mt-2 max-w-[760px] text-balance text-[32px] leading-[1.15] font-bold tracking-[-0.03em] sm:text-[44px]">{title}</h2>
        {lead && <p className="mt-4 max-w-[680px] text-[17px] leading-relaxed text-[#424245] sm:text-[19px]">{lead}</p>}
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

function Hero() {
  const h = PACK.hero;
  return (
    <section className="bg-[var(--surface-2)] px-4 pt-14 pb-0 sm:px-6 sm:pt-20" aria-labelledby="hero-t">
      <div className="mx-auto grid max-w-[1080px] items-end gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <div className="pb-14 md:pb-24">
          <p className="text-[15px] font-semibold text-[#6e6e73]">{h.eyebrow}</p>
          <h1 id="hero-t" className="mt-3 text-[40px] leading-[1.08] font-bold tracking-[-0.035em] sm:text-[60px] whitespace-pre-line">{h.title}</h1>
          <p className="mt-5 max-w-[520px] text-[18px] leading-relaxed text-[#424245] sm:text-[21px]">{h.lead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#product" className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-[16px] font-medium text-white hover:brightness-110">수출 제안 살펴보기</a>
            <Link to="/price?tab=hospital" className="inline-flex h-11 items-center gap-1 rounded-full px-5 text-[16px] font-medium text-primary hover:bg-white">거래조건 바꿔보기<ChevronRight className="size-4" /></Link>
          </div>
          <p className="mt-8 text-[13px] text-[#6e6e73]">대표 사례는 팀이 설정한 모의 거래예요. 실제 계약 조건이 아니에요.</p>
        </div>
        {h.image && (
          <figure className="relative mx-auto w-full max-w-[360px] md:max-w-none">
            <img src={h.image} alt={h.imageAlt} width="1110" height="1889" className="mx-auto h-auto max-h-[560px] w-auto object-contain" fetchpriority="high" />
            <figcaption className="pb-3 text-center text-[11px] text-[#86868b]">{h.imageCredit}</figcaption>
          </figure>
        )}
      </div>
    </section>
  );
}

function Product() {
  const p = PACK.product;
  return (
    <Section id="product" kicker={p.kicker || "왜 이 제품인가"} title={p.title} lead={p.lead}>
      {p.handpieces.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2">
          {p.handpieces.map((hp) => (
            <figure key={hp.name} className="rounded-[28px] bg-[var(--surface-2)] px-6 pt-8 pb-6">
              <div className="grid h-[200px] place-items-center"><img src={hp.img} alt={hp.alt} className="max-h-[200px] w-auto max-w-full object-contain" loading="lazy" /></div>
              <figcaption className="mt-6">
                <p className="text-[12px] font-semibold text-primary">{hp.tag}</p>
                <p className="mt-1 text-[22px] font-semibold tracking-tight">{hp.name}</p>
                <p className="mt-2 text-[15px] leading-relaxed text-[#424245]">{hp.desc}</p>
                {hp.note && <p className="mt-2 text-[12px] text-[#86868b]">{hp.note}</p>}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
      <dl className="mt-10 divide-y divide-[var(--line)] border-y border-[var(--line)]">
        {p.facts.map((f) => (
          <div key={f.k} className="grid gap-1 py-4 sm:grid-cols-[200px_minmax(0,1fr)_minmax(0,260px)] sm:gap-6">
            <dt className="text-[14px] text-[#6e6e73]">{f.k}</dt>
            <dd className="text-[16px] font-medium">{f.v}</dd>
            <dd className="text-[12px] text-[#86868b] sm:text-right">{f.src}</dd>
          </div>
        ))}
      </dl>
      {p.claims.length > 0 && (
        <div className="mt-8">
          <p className="text-[13px] font-semibold text-[#6e6e73]">회사 발표 (팀이 원문 게시물을 확인, 인증서 원본은 확인 전)</p>
          <ul className="mt-2 space-y-1 text-[15px]">{p.claims.map((c) => <li key={c.text}>{c.text} <span className="text-[12px] text-[#86868b]">{c.src}</span></li>)}</ul>
        </div>
      )}
      {p.caution && <p className="mt-8 max-w-[760px] text-[13px] leading-relaxed text-[#6e6e73]">{p.caution}</p>}
    </Section>
  );
}

function Country() {
  const c = PACK.country;
  if (!c.rows.length) return null;
  return (
    <Section id="country" kicker="왜 인도네시아인가" title={c.title} lead={c.lead} tone="gray">
      <ol className="grid gap-4 md:grid-cols-3">
        {c.rows.map((r) => (
          <li key={r.country} className={cn("rounded-[24px] bg-white p-6", r.primary && "ring-2 ring-primary")}>
            <p className="text-[15px] text-[#6e6e73]">{r.country}</p>
            <p className={cn("mt-1 text-[28px] font-bold tracking-tight", r.primary ? "text-primary" : "text-[#86868b]")}>{r.status}</p>
            <p className="mt-3 text-[15px] leading-relaxed">{r.detail}</p>
            <p className="mt-3 text-[13px] leading-relaxed text-[#6e6e73]">{r.need}</p>
            <p className="mt-4 text-[11px] text-[#86868b]">{r.db}</p>
          </li>
        ))}
      </ol>
      <p className="mt-6 max-w-[860px] text-[13px] leading-relaxed text-[#6e6e73]">{c.scope}</p>
      {c.compare && (
        <details className="group mt-8 rounded-[20px] bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 text-[15px] font-semibold">같은 지표로 비교하기<ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden="true" /></summary>
          <div className="overflow-x-auto px-6 pb-6">
            <table className="w-full min-w-[560px] text-left text-[14px]">
              <thead><tr className="border-b border-[var(--line-strong)]">{c.compare.head.map((h, i) => <th key={i} scope="col" className="py-2 pr-4 font-semibold">{h}</th>)}</tr></thead>
              <tbody>{c.compare.rows.map((row) => <tr key={row[0]} className="border-b border-[var(--line)]">{row.map((v, i) => i === 0 ? <th key={i} scope="row" className="py-2.5 pr-4 font-normal text-[#6e6e73]">{v}</th> : <td key={i} className="py-2.5 pr-4 tabular-nums">{v || "—"}</td>)}</tr>)}</tbody>
            </table>
            <p className="mt-3 text-[12px] text-[#86868b]">{c.compare.note}</p>
          </div>
        </details>
      )}
      {c.gap.length > 0 && (
        <div className="mt-10 max-w-[760px]">
          <p className="text-[17px] font-semibold">{c.gap[0]}</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] text-[#424245]">{c.gap.slice(1).map((g) => <li key={g}>{g}</li>)}</ul>
        </div>
      )}
    </Section>
  );
}

function Structure() {
  const s = PACK.structure;
  const modes = Object.entries(s.modes);
  const [mode, setMode] = useState(modes[0][0]);
  const m = s.modes[mode];
  const idx = Object.fromEntries(s.actors.map((a, i) => [a.key, i]));
  const linkBetween = (a, b) => m.links.find((l) => (idx[l.from] === a && idx[l.to] === b) || (idx[l.from] === b && idx[l.to] === a));
  return (
    <Section id="structure" kicker="어떻게 거래하는가" title={s.title} lead={s.lead}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="보기" className="seg">
          {modes.map(([k, v]) => <button key={k} type="button" role="tab" aria-selected={mode === k} onClick={() => setMode(k)} className="seg-btn">{v.label}</button>)}
        </div>
        <p className="text-[12px] font-medium text-amber-700">{s.label}</p>
      </div>
      <div className="mt-8 grid items-stretch gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1fr)]" role="tabpanel" aria-label={m.label}>
        {s.actors.map((a, i) => {
          const l = i < s.actors.length - 1 ? linkBetween(i, i + 1) : null;
          const right = l && idx[l.from] === i;
          return [
            <div key={a.key} className="rounded-[24px] bg-[var(--surface-2)] p-6">
              <p className="text-[20px] font-semibold tracking-tight">{a.name}</p>
              <p className="mt-0.5 text-[13px] text-[#6e6e73]">{a.sub}</p>
              <ul className="mt-4 space-y-1 text-[14px] text-[#424245]">{a.roles.map((r) => <li key={r}>{r}</li>)}</ul>
            </div>,
            i < s.actors.length - 1 && (
              <div key={a.key + "-l"} className="flex flex-col items-center justify-center px-2 py-2 text-center">
                {l ? <>
                  <span className="text-[13px] font-medium leading-snug">{l.text}</span>
                  <span aria-hidden="true" className={cn("mt-2 text-[22px] text-primary md:rotate-0", "rotate-90")}>{right ? "→" : "←"}</span>
                  <span className="sr-only">{right ? `${a.name}에서 ${s.actors[i + 1].name}로` : `${s.actors[i + 1].name}에서 ${a.name}로`}</span>
                </> : <span className="text-[13px] text-[#86868b]">해당 없음</span>}
              </div>
            ),
          ];
        })}
      </div>
      {m.note && <p className="mt-6 max-w-[760px] text-[14px] leading-relaxed text-[#424245]">{m.note}</p>}
    </Section>
  );
}

function TryIt() {
  const { deals } = useDeal();
  const nav = useNavigate();
  const sample = useMemo(() => deals.find((d) => d.sampleKey === PACK.sampleKey) || sampleDeal(), [deals]);
  const E = calcExport(sample), L = calcLocal(sample), H = hospitalCalc(sample);
  const kpis = [
    ["수출 단가", E.total !== null ? fmtMoney(E.total, E.cur) : "가격 확인 필요", `${sample.exp.incoterm} ${sample.exp.place}`.trim()],
    ["병원 도입비", L.total !== null ? idr(L.total) : "—", "현지 판매가 + 부가세, 팀 모의값"],
    [`월 ${H.sessions ?? "—"}회 시술 시 운영 현금잉여`, idr(H.surplus), "월 조건이 일정하다는 전제"],
    ["단순 회수 예상", H.payback ? `약 ${Math.ceil(H.payback)}개월` : "산출 불가", `운영 손익분기 월 ${H.bep ?? "—"}회`],
  ];
  return (
    <Section id="try" kicker="조건을 바꿔보기" title="판매가와 시술량을 바꾸면 병원 손익이 어떻게 달라질까요" lead="판매가와 시술량을 바꾸면 병원 손익과 회수 전망이 어떻게 달라지는지 확인할 수 있습니다." tone="gray">
      <dl className="grid gap-px overflow-hidden rounded-[24px] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(([k, v, n]) => (
          <div key={k} className="bg-white p-6">
            <dt className="text-[13px] text-[#6e6e73]">{k}</dt>
            <dd className="mt-2 text-[24px] font-semibold tracking-tight tabular-nums">{v}</dd>
            <dd className="mt-1 text-[12px] text-[#86868b]">{n}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-[12px] text-[#86868b]">대표 모의 거래 기준. 회당 수납액과 비용 항목의 출처는 근거자료에서 볼 수 있어요.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={() => nav("/price?tab=hospital")} className="inline-flex h-11 items-center gap-1.5 rounded-full bg-primary px-6 text-[16px] font-medium text-white hover:brightness-110">가격·수익성 검토<ArrowRight className="size-4" /></button>
      </div>
    </Section>
  );
}

function DocsLinks() {
  const { findings } = useDeal();
  const s = summarize(findings);
  const items = [
    ["/docs", "견적서와 인보이스", "입력한 거래조건이 수출 견적서, 상업송장, 현지 견적, 메일 서명에 함께 반영돼요."],
    ["/review", "누락과 불일치 검토", s.fix ? `지금 거래에 수정 필요 ${s.fix}건, 확인 필요 ${s.confirm}건이 있어요. 누르면 해당 입력칸으로 가요.` : "총중량, 서명, 결제 합계, 인도조건을 규칙으로 확인해요."],
    ["/evidence", "계산 근거와 자료 출처", "회사 자료, 공개자료, 팀 설정값을 나눠 보여 주고 계산식을 공개해요."],
  ];
  return (
    <Section id="docs" kicker="거래서류와 근거" title="조건이 정리되면 서류로 이어집니다">
      <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
        {items.map(([to, t, d]) => (
          <li key={to}>
            <Link to={to} className="group flex items-center gap-6 py-6">
              <span className="min-w-0 flex-1"><span className="block text-[21px] font-semibold tracking-tight">{t}</span><span className="mt-1 block text-[15px] text-[#424245]">{d}</span></span>
              <ArrowRight className="size-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <Product />
      <Country />
      <Structure />
      <TryIt />
      <DocsLinks />
    </>
  );
}
