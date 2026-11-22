/* 병원 도입 검토: 현지 파트너 영업 담당자가 병원 원장 앞에서 쓰는 화면.
   병원이 시술가, 환자 수, 결제 조건을 넣으면 손익분기와 월 손익이 바로 바뀌고,
   같은 숫자로 인도네시아어 제안서와 원장 질문 답변을 만듭니다 (AI 연결 시 문장을 다듬음). */
import { useEffect, useMemo, useRef, useState } from "react";
import { Popover } from "radix-ui";
import { toast } from "sonner";
import { ArrowDownRight, ArrowUpRight, Check, ChevronDown, Copy, ExternalLink, FileText, Info, KeyRound, Loader2, MessageCircleQuestion, Plus, Printer, RotateCcw, Sparkles, Square, Trash2 } from "lucide-react";
import { review, sensitivity, profitCurve, n as toNum } from "../lib/review/calc.js";
import { BASIS, DEVICE, BENCHMARKS, SOURCES, PACK_LABEL, defaults, newCase, loadCases, saveCases, getVal, setVal, metaOf, fixedMeta, caseId } from "../lib/review/model.js";
import { rp, krShort, rpShort, headline, missingId, proposalId, proposalKo, QUESTIONS, answer, aiContext } from "../lib/review/proposal.js";
import { generate, getKey, setKey, errorText, MODEL } from "../lib/review/ai.js";
import { LineChart } from "../components/deal/LineChart.jsx";
import { cn } from "@/lib/utils";

const fmt = (v, d = 0) => (v === null || v === undefined || !Number.isFinite(v) ? "—" : v.toLocaleString("ko-KR", { maximumFractionDigits: d }));
const CTRL = "w-full min-w-0 rounded-[10px] border border-[var(--line-strong)] bg-white px-3 text-[15px] outline-none transition-[box-shadow,border-color] focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20 aria-[invalid=true]:border-amber-500";

/* 화면 언어 (결과 패널만). 원장에게 화면을 돌려 보여 줄 때 인도네시아어로 */
const T = {
  ko: { result: "이 조건의 결과", bep: "손익분기", perMonth: "회/월", monthly: "월 손익", payback: "누적 현금 회수", months: "개월", none: "기간 안에 안 됨", per: "손익분기를 넘는 시술 1회마다", day: "진료일 하루", patients: "신규 환자", cap: "장비 처리 한도", plan: "계획", op: "운영비만", during: "할부 기간 중", after: "다 갚은 뒤", missing: "아직 빠진 값", pre: "세전, 월 조건이 일정하다는 가정. 수익 보장이 아닙니다." },
  id: { result: "Hasil dengan kondisi ini", bep: "Titik impas", perMonth: "tindakan/bln", monthly: "Hasil bersih/bln", payback: "Balik modal (kas kumulatif)", months: "bulan", none: "belum dalam periode", per: "Setiap tindakan di atas titik impas", day: "per hari kerja", patients: "pasien baru", cap: "Kapasitas alat", plan: "Rencana", op: "Operasional saja", during: "Selama cicilan", after: "Setelah lunas", missing: "Data yang belum ada", pre: "Sebelum pajak, kondisi bulanan dianggap tetap. Bukan jaminan pendapatan." },
};

/* ---------- 작은 부품 ---------- */
function Badge({ basis, className }) {
  const b = BASIS[basis] || BASIS.team;
  const tone = { official: "bg-[oklch(0.95_0.03_180)] text-[oklch(0.38_0.07_180)]", company: "bg-[#eef1ff] text-[#3b4aa8]", team: "bg-[var(--fill)] text-[#424245]", hospital: "bg-[oklch(0.95_0.05_85)] text-[oklch(0.42_0.09_65)]", missing: "bg-[#fff1f0] text-[#b42318]" }[b.tone];
  return <span className={cn("inline-flex items-center rounded-full px-2 py-[1px] text-[11px] font-semibold", tone, className)}>{b.ko}</span>;
}

function SourcePop({ meta, onReset }) {
  if (!meta) return null;
  return (
    <Popover.Root>
      <Popover.Trigger className="inline-flex items-center gap-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/40" aria-label={`출처: ${meta.src}`}>
        <Badge basis={meta.basis} /><Info className="size-3 text-[#86868b]" aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={6} align="start" className="z-50 w-[min(92vw,340px)] rounded-xl border border-[var(--line)] bg-white p-3.5 text-[13px] leading-relaxed shadow-[0_16px_40px_rgb(0_0_0/0.14)]">
          <div className="mb-1.5 flex items-center gap-2"><Badge basis={meta.basis} />{meta.asOf && <span className="text-[12px] text-[#86868b]">기준 {meta.asOf}</span>}</div>
          <p className="font-medium text-[#1d1d1f]">{meta.src}</p>
          {meta.note && <p className="mt-1 text-[#6e6e73]">{meta.note}</p>}
          {meta.changed && meta.base && <p className="mt-2 border-t border-[var(--line)] pt-2 text-[#6e6e73]">기본값 {meta.def}: {meta.base.src}</p>}
          <div className="mt-2 flex flex-wrap gap-3">
            {(meta.url || meta.base?.url) && <a href={meta.url || meta.base.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-primary">원문 열기<ExternalLink className="size-3" /></a>}
            {meta.changed && onReset && <button type="button" onClick={onReset} className="inline-flex items-center gap-1 font-medium text-primary"><RotateCcw className="size-3" />기본값으로</button>}
          </div>
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Seg({ value, onChange, options, label, size = "md" }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex w-full rounded-[10px] bg-[var(--fill)] p-[3px]", size === "sm" && "w-auto")}>
      {options.map(([v, l, sub]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}
          className={cn("rounded-[8px] px-3 py-1.5", size === "sm" ? "flex-none whitespace-nowrap" : "min-w-0 flex-1", " text-[13px] font-medium transition-[background,box-shadow,color] duration-150", value === v ? "bg-white text-[#1d1d1f] shadow-[0_1px_3px_rgb(0_0_0/0.12)]" : "text-[#6e6e73] hover:text-[#1d1d1f]")}>
          <span className="block truncate">{l}</span>{sub && <span className="block truncate text-[11px] font-normal text-[#86868b]">{sub}</span>}
        </button>
      ))}
    </div>
  );
}

function Num({ c, set, path, label, unit, hint, slider, className, meta }) {
  const v = getVal(c, path) ?? "";
  const s = String(v).replace(/,/g, "").trim();
  const bad = s !== "" && !/^\d+(\.\d+)?$/.test(s);
  const m = meta || metaOf(c, path);
  const id = `f-${path.replace(/\./g, "-")}`;
  const sv = Number(s);
  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
        <label htmlFor={id} className="text-[13px] font-medium text-[#424245]">{label}</label>
        <span className="ml-auto"><SourcePop meta={m} onReset={() => set(path, getVal(defaults(), path))} /></span>
      </div>
      <div className="relative">
        <input id={id} type="text" inputMode="decimal" autoComplete="off" value={v} aria-invalid={bad || undefined} onChange={(e) => set(path, e.target.value)}
          className={cn(CTRL, "h-11 tabular-nums text-right", unit && "pr-[4.2rem]")} />
        {unit && <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-[13px] text-[#86868b]">{unit}</span>}
      </div>
      {slider && <input type="range" aria-label={`${label} 조절`} min={slider[0]} max={slider[1]} step={slider[2]} value={Number.isFinite(sv) ? Math.min(Math.max(sv, slider[0]), slider[1]) : slider[0]} onChange={(e) => set(path, e.target.value)} className="range mt-2.5 w-full" />}
      {unit === "IDR" && !bad && s !== "" && Number(s) >= 10000 && <p className="mt-1 text-right text-[12px] font-medium text-[#424245] tabular-nums">{rp(Number(s))} ({krShort(Number(s))})</p>}
      {(hint || bad) && <p className={cn("mt-1 text-[12px] leading-snug", bad ? "text-amber-700" : "text-[#86868b]")}>{bad ? "숫자만 적어 주세요 (쉼표 가능)." : hint}</p>}
    </div>
  );
}

function Step({ no, title, sub, children, aside }) {
  return (
    <section className="rv-step rounded-[18px] border border-[var(--line)] bg-white p-5 sm:p-6" aria-labelledby={`step-${no}`}>
      <header className="mb-4 flex items-start gap-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#1d1d1f] text-[13px] font-semibold text-white tabular-nums">{no}</span>
        <div className="min-w-0 flex-1"><h2 id={`step-${no}`} className="text-[19px] leading-tight">{title}</h2>{sub && <p className="mt-0.5 text-[13px] text-[#6e6e73]">{sub}</p>}</div>
        {aside}
      </header>
      {children}
    </section>
  );
}

/* 손익분기 막대: 0 → 장비 처리 한도. 손익분기 왼쪽은 손실 구간, 오른쪽은 이익 구간, 점은 이 병원 계획 */
function BepMeter({ r, h, t }) {
  const plan = r.S ?? 0, bep = h.bep;
  const max = Math.max(r.capacity || 0, plan * 1.4, (bep || 0) * 1.4, 10);
  const pct = (x) => `${Math.min(Math.max((x / max) * 100, 0), 100)}%`;
  const over = bep !== null && plan >= bep;
  return (
    <div className="mt-5" aria-hidden="true">
      <div className="relative h-3 overflow-hidden rounded-full bg-[var(--fill)]">
        {bep !== null && <div className="absolute inset-y-0 right-0 bg-[oklch(0.85_0.06_180)]" style={{ left: pct(bep) }} />}
        <div className={cn("absolute inset-y-0 left-0 rounded-full transition-[width] duration-300", over ? "bg-primary" : "bg-[#a1a1a6]")} style={{ width: pct(plan) }} />
      </div>
      <div className="relative mt-1.5 h-9 text-[11px] text-[#6e6e73]">
        {bep !== null && <span className="absolute -translate-x-1/2 text-center" style={{ left: pct(bep) }}><span className="mx-auto block h-2 w-px bg-white/70" /><span className="whitespace-nowrap font-semibold text-white">{t.bep} {fmt(bep)}</span></span>}
        <span className="absolute -translate-x-1/2 whitespace-nowrap text-center" style={{ left: pct(plan), top: 18 }}>{t.plan} {fmt(plan, 1)}</span>
        {r.capacity && <span className="absolute right-0 top-0">{t.cap} {fmt(r.capacity)}</span>}
      </div>
    </div>
  );
}

function ResultPanel({ c, r, lang, setLang, set }) {
  const t = T[lang];
  const h = headline(r);
  const money = lang === "id" ? rpShort : krShort;
  const good = h.profit !== null && h.profit >= 0;
  return (
    <aside className="rv-result rounded-[22px] bg-[#1d1d1f] p-5 text-white sm:p-6" aria-label={t.result} aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-white/60">{t.result}</p>
        <div className="flex rounded-full bg-white/10 p-[3px] text-[12px] font-semibold" role="radiogroup" aria-label="결과 화면 언어">
          {[["ko", "한국어"], ["id", "Bahasa"]].map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={lang === k} onClick={() => setLang(k)} className={cn("rounded-full px-2.5 py-1 transition-colors", lang === k ? "bg-white text-[#1d1d1f]" : "text-white/70 hover:text-white")}>{l}</button>)}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[13px] text-white/60">{t.bep}</p>
          <p className="mt-0.5 text-[44px] leading-none font-bold tracking-[-0.04em] tabular-nums" data-testid="bep">{fmt(h.bep)}<span className="ml-1 text-[15px] font-medium tracking-normal text-white/60">{t.perMonth}</span></p>
          <p className="mt-1.5 text-[12px] leading-snug text-white/55">{lang === "id" ? h.basisId : h.basisKo}</p>
        </div>
        <div>
          <p className="text-[13px] text-white/60">{t.monthly}{h.financed ? ` (${t.during})` : ""}</p>
          <p className={cn("mt-0.5 text-[32px] leading-none font-bold tracking-[-0.03em] tabular-nums", good ? "text-[oklch(0.82_0.11_175)]" : "text-[#ff9f8f]")} data-testid="profit">{money(h.profit)}</p>
          <p className="mt-1.5 text-[12px] leading-snug text-white/55">{t.plan} {fmt(r.S, 1)} {t.perMonth}</p>
        </div>
      </div>

      <BepMeter r={r} h={h} t={t} />

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[14px] bg-white/10 text-[13px]">
        {[
          [t.per, `+${money(r.ps.contribution)}`],
          [t.payback, r.payback !== null ? `${fmt(Math.ceil(r.payback))} ${t.months}` : t.none],
          [`${t.bep} ${t.day}`, `${fmt(r.perDay(h.bep), 1)}`],
          [`${t.bep} ${t.patients}`, r.bepPatients(h.bep) !== null ? `${fmt(r.bepPatients(h.bep), 1)}` : "—"],
          [`${t.bep} (${t.op})`, `${fmt(r.bepOperating)} ${t.perMonth}`],
          [h.financed ? t.after : `${t.monthly} (${t.op})`, money(r.opProfit)],
        ].map(([k, v]) => <div key={k} className="bg-[#1d1d1f] px-3.5 py-3"><dt className="text-[12px] leading-snug text-white/55">{k}</dt><dd className="mt-0.5 text-[17px] font-semibold tabular-nums">{v}</dd></div>)}
      </dl>

      {/* 시연용: 원장이 말하는 숫자를 바로 반영 */}
      <div className="mt-5 space-y-3 rounded-[14px] bg-white/[0.06] p-4">
        <Quick label={lang === "id" ? "Harga per tindakan" : "회당 시술가"} value={c.rev.price} min={100000} max={1500000} step={10000} onChange={(v) => set("rev.price", v)} fmtV={(v) => rp(Number(v))} />
        {c.demand.mode === "patients"
          ? <Quick label={lang === "id" ? "Pasien baru per bulan" : "월 신규 환자"} value={c.demand.newPatients} min={0} max={80} step={1} onChange={(v) => set("demand.newPatients", v)} fmtV={(v) => (lang === "id" ? `${v} pasien` : `${v}명`)} />
          : <Quick label={lang === "id" ? "Tindakan berbayar per bulan" : "월 유료 시술"} value={c.demand.sessions} min={0} max={Math.max(200, r.capacity || 0)} step={1} onChange={(v) => set("demand.sessions", v)} fmtV={(v) => (lang === "id" ? `${v} tindakan` : `${v}회`)} />}
      </div>

      {r.missing.length > 0 && <p className="mt-4 rounded-[12px] bg-[#ff9f8f]/12 px-3.5 py-2.5 text-[12px] leading-relaxed text-[#ffd0c7]"><b className="font-semibold">{t.missing}:</b> {(lang === "id" ? missingId(r.missing) : r.missing).join(", ")}</p>}
      <p className="mt-3 text-[11px] leading-relaxed text-white/45">{t.pre}</p>
    </aside>
  );
}

function Quick({ label, value, min, max, step, onChange, fmtV }) {
  const v = Number(String(value).replace(/,/g, "")) || 0;
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-[12px] text-white/60"><span>{label}</span><span className="text-[15px] font-semibold text-white tabular-nums">{fmtV(v)}</span></span>
      <input type="range" min={min} max={max} step={step} value={Math.min(Math.max(v, min), max)} onChange={(e) => onChange(e.target.value)} className="range range-dark mt-1.5 w-full" />
    </label>
  );
}

/* ---------- 아래 탭 ---------- */
function CashTab({ c, r }) {
  const data = r.series.map((p) => ({ x: p.m, y: p.v }));
  const curve = useMemo(() => profitCurve(c, Math.max(r.capacity || 0, (r.S || 0) * 2, 60)), [c, r.capacity, r.S]);
  const h = headline(r);
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <h3 className="text-[17px]">누적 현금 흐름</h3>
        <p className="mb-3 text-[13px] text-[#6e6e73]">0개월 = 계약 때 낸 돈{r.fin.months ? `, ${r.fin.months}개월까지 할부금 차감` : ""}{Number(c.demand.rampMonths) > 0 ? `, 첫 ${c.demand.rampMonths}개월은 환자가 점점 늘어난다고 가정` : ""}</p>
        <LineChart data={data} label="누적 현금 흐름" xLabel="개월" yLabel="IDR 누적" fmtY={krShort} markers={[r.payback !== null && { x: Math.ceil(r.payback), y: 0, label: `회수 ${Math.ceil(r.payback)}개월`, color: "var(--primary)" }, r.fin.months && { x: r.fin.months, label: "할부 끝" , color: "#86868b" }].filter(Boolean)} />
      </div>
      <div>
        <h3 className="text-[17px]">시술량별 월 손익</h3>
        <p className="mb-3 text-[13px] text-[#6e6e73]">오른쪽 결과와 같은 기준 ({h.basisKo})</p>
        <LineChart data={curve} label="시술량별 월 손익" xLabel="월 유료 시술 (회)" yLabel="IDR / 월" fmtY={krShort} markers={[{ x: Math.round(r.S || 0), y: headline(review(c, { sessions: Math.round(r.S || 0) })).profit, label: `계획 ${fmt(r.S, 1)}회` }, h.bep !== null && { x: h.bep, y: 0, label: `손익분기 ${h.bep}회`, color: "#86868b" }].filter(Boolean)} />
      </div>
    </div>
  );
}

function SensTab({ c, r }) {
  const s = useMemo(() => sensitivity(c), [c]);
  const max = Math.max(...s.map((x) => Math.abs(x.delta)), 1);
  if (!s.length) return <p className="text-[14px] text-[#6e6e73]">시술가, 시술량, 장비 가격을 넣으면 민감도를 계산해요.</p>;
  return (
    <div>
      <p className="mb-4 text-[14px] text-[#424245]">한 가지만 바꿨을 때 오른쪽 결과의 월 손익({headline(r).basisKo})이 얼마나 움직이는지예요. 지금 월 손익은 <b className="tabular-nums">{krShort(headline(r).profit)}</b>예요.</p>
      <ul className="space-y-2.5">
        {s.map((x) => (
          <li key={x.key} className="grid grid-cols-[minmax(0,9.5rem)_1fr_auto] items-center gap-3 text-[14px] sm:grid-cols-[12rem_1fr_9rem]">
            <span className="truncate text-[#424245]">{x.label}</span>
            <span className="relative h-6">
              <span className="absolute inset-y-0 left-1/2 w-px bg-[var(--line-strong)]" />
              <span className={cn("absolute inset-y-1 rounded-[4px]", x.delta < 0 ? "bg-[#ff7a66]" : "bg-primary")} style={x.delta < 0 ? { right: "50%", width: `${(Math.abs(x.delta) / max) * 50}%` } : { left: "50%", width: `${(Math.abs(x.delta) / max) * 50}%` }} />
            </span>
            <span className={cn("text-right tabular-nums font-semibold", x.delta < 0 ? "text-[#c4321c]" : "text-[oklch(0.42_0.08_180)]")}>{x.delta < 0 ? "" : "+"}{krShort(x.delta)}<span className="block text-[11px] font-normal text-[#86868b]">손익분기 {fmt(x.bep)}회</span></span>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-[12px] text-[#86868b]">민감도는 확률이 아니에요. 원장이 가장 걱정하는 값(대개 시술가와 환자 수)을 먼저 병원 숫자로 바꿔 넣으세요.</p>
    </div>
  );
}

function AiBox({ onRun, busy, onStop }) {
  const [k, setK] = useState(getKey());
  const [remember, setRemember] = useState(false);
  const has = !!getKey();
  return (
    <Popover.Root>
      <Popover.Trigger className={cn("inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold", has ? "bg-primary/10 text-primary" : "bg-[var(--fill)] text-[#424245]")}><KeyRound className="size-3.5" />{has ? "AI 연결됨" : "AI 연결"}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={6} align="end" className="z-50 w-[min(92vw,360px)] rounded-xl border border-[var(--line)] bg-white p-4 text-[13px] shadow-[0_16px_40px_rgb(0_0_0/0.14)]">
          <p className="font-semibold">Claude API 키</p>
          <p className="mt-1 leading-relaxed text-[#6e6e73]">키가 없으면 계산값으로 만든 기본 문안을 써요. 키를 넣으면 이 브라우저에서 바로 Claude({MODEL})를 불러 문장을 다듬고 자유 질문에 답해요. 키는 다른 서버로 보내지 않아요.</p>
          <input type="password" value={k} onChange={(e) => setK(e.target.value)} placeholder="sk-ant-..." className={cn(CTRL, "mt-3 h-10 font-mono text-[13px]")} aria-label="Anthropic API 키" />
          <label className="mt-2 flex items-center gap-2 text-[#424245]"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />이 브라우저에 계속 기억 (공용 PC에서는 끄기)</label>
          <div className="mt-3 flex gap-2">
            <Popover.Close className="h-9 rounded-full bg-primary px-4 font-semibold text-white" onClick={() => { setKey(k.trim(), remember); toast.success(k.trim() ? "AI를 연결했어요." : "키를 지웠어요."); }}>저장</Popover.Close>
            {has && <Popover.Close className="h-9 rounded-full bg-[var(--fill)] px-4 font-semibold" onClick={() => { setKey("", false); setK(""); toast("키를 지웠어요."); }}>키 지우기</Popover.Close>}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function useAi() {
  const [state, setState] = useState({ busy: false, text: "", error: "" });
  const ctl = useRef(null);
  const run = async (args) => {
    const apiKey = getKey();
    if (!apiKey) { toast("AI가 연결되지 않아 기본 문안을 보여 줘요. 오른쪽 위 'AI 연결'에서 키를 넣을 수 있어요."); return null; }
    ctl.current?.abort();
    ctl.current = new AbortController();
    setState({ busy: true, text: "", error: "" });
    try {
      const out = await generate({ ...args, apiKey, signal: ctl.current.signal, onText: (t) => setState((s) => ({ ...s, text: s.text + t })) });
      setState({ busy: false, text: out, error: "" });
      return out;
    } catch (e) { setState((s) => ({ ...s, busy: false, error: errorText(e) })); return null; }
  };
  return { ...state, run, stop: () => ctl.current?.abort(), clear: () => setState({ busy: false, text: "", error: "" }) };
}

function copy(text) { navigator.clipboard?.writeText(text).then(() => toast.success("복사했어요."), () => toast.error("복사하지 못했어요.")); }

function printDoc(title, text, lang = "ko") {
  const w = window.open("", "_blank");
  if (!w) { toast.error("팝업이 막혀 인쇄 창을 열지 못했어요."); return; }
  const esc = (s) => s.replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[ch]));
  w.document.write(`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font:14px/1.6 -apple-system,"Pretendard",Arial,sans-serif;color:#1d1d1f;max-width:720px;margin:40px auto;padding:0 24px}pre{white-space:pre-wrap;font:inherit}h1{font-size:13px;color:#6e6e73;font-weight:500;letter-spacing:.02em}</style></head><body><h1>${esc(title)}</h1><pre>${esc(text)}</pre></body></html>`);
  w.document.close(); w.focus(); w.print();
}

function ProposalTab({ c, r, sens, metaFor }) {
  const [pl, setPl] = useState("ko");
  const ai = useAi();
  const base = pl === "ko" ? proposalKo(c, r) : proposalId(c, r);
  const text = ai.text || base;
  const title = pl === "ko" ? `${DEVICE.model ? `${DEVICE.model} ` : ""}도입 검토 결과, ${c.name || "검토 병원"}` : `Simulasi investasi ${DEVICE.model || ""} untuk ${c.name || "Rumah Sakit"}`;
  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Seg size="sm" label="제안서 언어" value={pl} onChange={(v) => { setPl(v); ai.clear(); }} options={[["ko", "한국어"], ["id", "인도네시아어"]]} />
        <span className={cn("rounded-full px-2.5 py-0.5 text-[12px] font-semibold", ai.text ? "bg-primary/10 text-primary" : "bg-[var(--fill)] text-[#424245]")}>{ai.text ? (ai.busy ? "AI 작성 중" : "AI가 다듬은 문안") : "계산값으로 만든 기본 문안"}</span>
        <span className="ml-auto flex flex-wrap gap-2">
          {ai.busy ? <button type="button" onClick={ai.stop} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--fill)] px-3.5 text-[13px] font-semibold"><Square className="size-3.5" />멈추기</button>
            : <button type="button" onClick={() => ai.run({ task: "proposal", lang: pl, context: aiContext(c, r, sens, metaFor) })} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-[13px] font-semibold text-white"><Sparkles className="size-3.5" />AI로 다듬기</button>}
          {ai.text && !ai.busy && <button type="button" onClick={ai.clear} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--fill)] px-3.5 text-[13px] font-semibold"><RotateCcw className="size-3.5" />기본 문안</button>}
          <button type="button" onClick={() => copy(text)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--fill)] px-3.5 text-[13px] font-semibold"><Copy className="size-3.5" />복사</button>
          <button type="button" onClick={() => printDoc(title, text, pl)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--fill)] px-3.5 text-[13px] font-semibold"><Printer className="size-3.5" />인쇄, PDF</button>
        </span>
      </div>
      {ai.error && <p className="mb-3 rounded-[12px] bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-800">{ai.error} 기본 문안은 그대로 쓸 수 있어요.</p>}
      <pre lang={pl} className="max-w-[820px] whitespace-pre-wrap rounded-[16px] border border-[var(--line)] bg-[var(--surface-2)] p-5 font-sans text-[15px] leading-[1.75] text-[#1d1d1f] sm:p-7" data-testid="proposal">{text}{ai.busy && <Loader2 className="ml-1 inline size-4 animate-spin text-primary" />}</pre>
      <p className="mt-3 max-w-[820px] text-[12px] leading-relaxed text-[#86868b]">기본 문안은 화면의 숫자만으로 만들어요. AI도 같은 숫자와 출처만 받아 쓰고, 빠진 값은 '확인 필요'로 적게 했어요. 병원에 보낼 때는 인도네시아어 버전을 쓰고, 보내기 전에 숫자를 한 번 더 보세요.</p>
    </div>
  );
}

function QaTab({ c, r, sens, metaFor }) {
  const [open, setOpen] = useState("bep");
  const [q, setQ] = useState("");
  const ai = useAi();
  const ans = answer(open, c, r, sens);
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <ul className="space-y-1.5" role="listbox" aria-label="자주 묻는 질문">
        {QUESTIONS.map((x) => (
          <li key={x.key}><button type="button" role="option" aria-selected={open === x.key} onClick={() => { setOpen(x.key); ai.clear(); }} className={cn("w-full rounded-[12px] px-3.5 py-2.5 text-left transition-colors", open === x.key ? "bg-[#1d1d1f] text-white" : "hover:bg-[var(--fill-soft)]")}>
            <span className="block text-[14px] font-medium leading-snug">{x.ko}</span>
            <span lang="id" className={cn("block text-[12px]", open === x.key ? "text-white/60" : "text-[#86868b]")}>{x.id}</span>
          </button></li>
        ))}
      </ul>
      <div className="min-w-0 space-y-4">
        {!ai.text && !ai.busy && (
          <article className="rounded-[16px] border border-[var(--line)] p-5" data-testid="answer">
            <p className="text-[16px] leading-[1.7]">{ans.ko}</p>
            <p lang="id" className="mt-3 border-t border-[var(--line)] pt-3 text-[13px] leading-relaxed text-[#6e6e73]"><span className="mr-1.5 rounded bg-[var(--fill)] px-1.5 py-0.5 text-[11px] font-semibold text-[#424245]">인도네시아어</span>{ans.id}</p>
            <div className="mt-3 flex gap-2"><button type="button" onClick={() => copy(ans.ko)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[var(--fill)] px-3 text-[12px] font-semibold"><Copy className="size-3" />한국어 복사</button><button type="button" onClick={() => copy(ans.id)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[var(--fill)] px-3 text-[12px] font-semibold"><Copy className="size-3" />인도네시아어 복사</button></div>
          </article>
        )}
        <form className="rounded-[16px] bg-[var(--surface-2)] p-4" onSubmit={(e) => { e.preventDefault(); if (q.trim()) ai.run({ task: "qa", lang: "ko", question: q.trim(), context: aiContext(c, r, sens, metaFor) }); }}>
          <label htmlFor="qa-free" className="text-[13px] font-medium text-[#424245]">원장이 다른 걸 물으면 (AI 연결 필요)</label>
          <div className="mt-2 flex gap-2">
            <input id="qa-free" value={q} onChange={(e) => setQ(e.target.value)} placeholder="예: 치료사를 2명 쓰면 손익분기는 몇 회인가요?" className={cn(CTRL, "h-11")} />
            {ai.busy ? <button type="button" onClick={ai.stop} className="h-11 shrink-0 rounded-full bg-[var(--fill)] px-4 text-[13px] font-semibold">멈추기</button>
              : <button type="submit" className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-white"><MessageCircleQuestion className="size-4" />답 만들기</button>}
          </div>
          {ai.error && <p className="mt-2 text-[13px] text-amber-800">{ai.error}</p>}
        </form>
        {(ai.text || ai.busy) && <article className="rounded-[16px] border border-primary/30 p-5"><p className="mb-2 text-[12px] font-semibold text-primary">AI 답변 (계산값과 출처만 사용)</p><pre className="whitespace-pre-wrap font-sans text-[15px] leading-[1.7]">{ai.text}{ai.busy && <Loader2 className="ml-1 inline size-4 animate-spin text-primary" />}</pre></article>}
      </div>
    </div>
  );
}

const REFS = [
  { t: "공헌이익 → 손익분기 → ROI 순서", d: "회당 공헌이익(수납 − 변동비), 고정비 ÷ 공헌이익 = 손익분기 건수, (회수액 − 투자 − 비용) ÷ 투자로 ROI를 보는 표준 순서를 그대로 씀", s: "Physicians Practice, ROI on purchasing new technology equipment (2025.12)", u: "https://www.physicianspractice.com/view/roi-on-purchasing-new-technology-equipment" },
  { t: "환자 수 × 코스 회수로 시술량 잡기", d: "현금 시술 장비 ROI 워크시트는 월 신규 평가 환자, 전환율, 방문 횟수로 시술량을 잡고 월 대출 상환액과 비교함. 코스(패키지) 할인, 12개월 회수 목표도 제시", s: "Chattanooga (Enovis) Cash Pay eBook (2025)", u: "https://learn.chattanoogarehab.com/hubfs/REC_SCI/REC_SCI_eBooks/Cash%20Pay%20eBook.pdf" },
  { t: "리스 기간, 월 납입금 대 월 수입", d: "장비 리스 ROI 계산기는 리스 기간, 월 시술 수, 월 납입금, 회당 요금으로 월 수입과 총 납입을 비교함 (손익분기는 없음 → 이 도구는 추가)", s: "Shockwave Source ROI and financial planning (2024.6)", u: "https://shockwave-therapy-machines--n6iwq.kinsta.page/blog/shockwave-roi-and-financial-planning/" },
  { t: "고정 금리, 예측 가능한 납입", d: "의료장비 금융사는 '은행 한도를 쓰지 않는 고정 금리 할부'를 핵심으로 내세움 → 이 도구도 납입금을 따로 보여 주고 할부 끝난 뒤 손익을 구분", s: "Siemens Financial Services, Alternative financing in healthcare", u: "https://assets.new.siemens.com/siemens/assets/api/uuid:839cdbe8-05a2-4115-a709-f8043c714614/alternative-financing-healthcare-leaflet-sfs-uk.pdf" },
];

function SourcesTab({ c, r }) {
  const rows = [
    ["장비 도입가 (부가세 포함)", "device.price", rp(r.I.price)], ["장비비 배분 개월", "device.lifeMonths", `${fmt(r.I.lifeMonths)}개월`],
    ["금리", "pay.rate", `${fmt(r.I.rate, 2)}%`], ["회당 시술가", "rev.price", rp(r.I.listPrice)],
    ["BPJS 환자", "rev.bpjs", "계산 제외"], ["코스당 회수", "demand.course", `${fmt(r.I.course)}회`],
    ["의사 수당", "vc.docFee", rp(r.I.docFee)], ["소모품", "vc.consumable", rp(r.I.consumable)], ["소비 전력", "vc.va", `${fmt(r.I.va)} VA`], ["PLN 요금", "vc.tariff", `${rp(r.I.tariff)}/kWh`],
    ["핸드피스 교체비", "vc.hpCost", rp(r.I.hpCost)], ["핸드피스 수명", "vc.hpLife", `${fmt(r.I.hpLife)}발`], ["회당 발수", "vc.shots", `${fmt(r.I.shots)}발`],
    ["예약 1칸", "ops.slotMin", `${fmt(r.I.slotMin)}분`], ["월 진료일", "ops.workDays", `${fmt(r.I.workDays)}일`],
  ];
  return (
    <div className="space-y-8">
      <div className="overflow-x-auto rounded-[16px] border border-[var(--line)]">
        <table className="w-full min-w-[640px] text-[13px]">
          <thead className="bg-[var(--surface-2)] text-left text-[12px] text-[#6e6e73]"><tr><th className="px-4 py-2.5 font-medium">항목</th><th className="px-4 py-2.5 text-right font-medium">값</th><th className="px-4 py-2.5 font-medium">구분</th><th className="px-4 py-2.5 font-medium">출처, 확인할 점</th></tr></thead>
          <tbody>
            {rows.map(([k, p, v]) => { const m = metaOf(c, p); return (
              <tr key={p} className="border-t border-[var(--line)] align-top"><td className="px-4 py-2.5 font-medium">{k}</td><td className="px-4 py-2.5 text-right tabular-nums">{v}</td><td className="px-4 py-2.5"><Badge basis={m.basis} /></td>
                <td className="px-4 py-2.5 text-[#424245]">{m.url ? <a href={m.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{m.src}</a> : m.src}{m.asOf ? ` (${m.asOf})` : ""}{m.note && <span className="block text-[12px] text-[#86868b]">{m.note}</span>}</td></tr>
            ); })}
            {c.fixed.map((row) => { const m = fixedMeta(c, row); return (
              <tr key={row.id} className="border-t border-[var(--line)] align-top"><td className="px-4 py-2.5 font-medium">월 고정비: {row.label}</td><td className="px-4 py-2.5 text-right tabular-nums">{rp(toNum(row.amount))}</td><td className="px-4 py-2.5"><Badge basis={m.basis} /></td><td className="px-4 py-2.5 text-[#424245]">{m.url ? <a href={m.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{m.src}</a> : m.src}{m.note && <span className="block text-[12px] text-[#86868b]">{m.note}</span>}</td></tr>
            ); })}
            <tr className="border-t border-[var(--line)] align-top"><td className="px-4 py-2.5 font-medium">기준금리 참고</td><td className="px-4 py-2.5 text-right tabular-nums">6.00%</td><td className="px-4 py-2.5"><Badge basis="official" /></td><td className="px-4 py-2.5"><a href={SOURCES["pay.biRate"].url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{SOURCES["pay.biRate"].src}</a></td></tr>
          </tbody>
        </table>
      </div>
      <div>
        <h3 className="text-[17px]">이 도구를 만들 때 참고한 실무 도구</h3>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {REFS.map((x) => <li key={x.t} className="rounded-[14px] border border-[var(--line)] p-4"><p className="text-[14px] font-semibold">{x.t}</p><p className="mt-1 text-[13px] leading-relaxed text-[#424245]">{x.d}</p><a href={x.u} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[12px] text-primary">{x.s}<ExternalLink className="size-3" /></a></li>)}
        </ul>
        <p className="mt-3 text-[12px] text-[#86868b]">그대로 가져오지 않은 것: 미국 세법 감면(Section 179), 미국 시술가. 인도네시아에서는 의료서비스 부가세 면제(매입 부가세 공제 불가)와 BPJS 묶음 수가를 대신 반영했어요.</p>
      </div>
    </div>
  );
}

/* ---------- 페이지 ---------- */
export default function HospitalReviewPage() {
  const [store, setStore] = useState(loadCases);
  const [lang, setLang] = useState("ko");
  const [tab, setTab] = useState("cash");
  const c = store.list.find((x) => x.id === store.active) || store.list[0];
  useEffect(() => { saveCases(store); }, [store]);
  const set = (path, value) => setStore((s) => ({ ...s, list: s.list.map((x) => (x.id === c.id ? setVal(x, path, value) : x)) }));
  const r = useMemo(() => review(c), [c]);
  const sens = useMemo(() => sensitivity(c), [c]);
  const metaFor = (p) => { const m = metaOf(c, p); return { basis: m.basis, src: m.src, asOf: m.asOf || null }; };

  const addCase = () => { const n = newCase(`검토 병원 ${store.list.length + 1}`); setStore((s) => ({ list: [...s.list, n], active: n.id })); toast.success("새 병원 검토를 기본 조건으로 열었어요."); };
  const dupCase = () => { const n = { ...JSON.parse(JSON.stringify(c)), id: caseId(), name: `${c.name || "검토 병원"} (사본)` }; setStore((s) => ({ list: [...s.list, n], active: n.id })); };
  const delCase = () => { if (store.list.length < 2) { toast("마지막 검토는 지울 수 없어요. 기본값으로 되돌리기를 쓰세요."); return; } if (!confirm(`'${c.name || "이름 없음"}' 검토를 지울까요?`)) return; setStore((s) => { const list = s.list.filter((x) => x.id !== c.id); return { list, active: list[0].id }; }); };
  const resetCase = () => { if (!confirm("이 병원의 입력을 모두 기본 조건으로 되돌릴까요?")) return; setStore((s) => ({ ...s, list: s.list.map((x) => (x.id === c.id ? { ...newCase(x.name), id: x.id, city: x.city } : x)) })); };
  const setFixed = (i, k, v) => set("fixed", c.fixed.map((row, j) => (j === i ? { ...row, [k]: v } : row)));
  const P = c.pay;
  const h = headline(r);

  const TABS = [["cash", "현금 흐름"], ["sens", "민감도"], ["proposal", "제안서"], ["qa", "원장 질문"], ["src", "근거와 가정"]];

  return (
    <div className="rv bg-[var(--surface-2)]">
      {/* 머리말 */}
      <div className="border-b border-[var(--line)] bg-white">
        <div className="mx-auto max-w-[1200px] px-4 pt-8 pb-6 sm:px-6 sm:pt-12">
          <p className="text-[13px] font-semibold text-primary">병원 도입 검토 <span className="font-normal text-[#86868b]">{DEVICE.model ? `${DEVICE.model}, ` : ""}{PACK_LABEL}</span></p>
          <h1 className="mt-2 text-[32px] sm:text-[44px]">이 병원 조건이면, 몇 회부터 남을까요?</h1>
          <p className="mt-3 max-w-[680px] text-[17px] leading-relaxed text-[#424245]">원장이 말하는 시술가, 환자 수, 결제 조건을 그 자리에서 넣으면 손익분기와 월 손익이 바로 바뀌어요. 같은 숫자로 인도네시아어 제안서와 질문 답변을 만들어요.</p>
          <div className="mt-6 flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1 sm:max-w-[280px]">
              <label htmlFor="case-pick" className="mb-1 block text-[12px] text-[#6e6e73]">검토 중인 병원 ({store.list.length}곳 저장)</label>
              <div className="relative">
                <select id="case-pick" value={c.id} onChange={(e) => setStore((s) => ({ ...s, active: e.target.value }))} className={cn(CTRL, "h-11 appearance-none pr-9 font-medium")}>
                  {store.list.map((x) => <option key={x.id} value={x.id}>{x.name || "이름 없는 병원"}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#86868b]" />
              </div>
            </div>
            <div className="min-w-[180px] flex-1 sm:max-w-[240px]"><label htmlFor="case-name" className="mb-1 block text-[12px] text-[#6e6e73]">병원 이름</label><input id="case-name" value={c.name} onChange={(e) => set("name", e.target.value)} placeholder="RS ..." className={cn(CTRL, "h-11")} /></div>
            <div className="min-w-[140px] flex-1 sm:max-w-[180px]"><label htmlFor="case-city" className="mb-1 block text-[12px] text-[#6e6e73]">도시</label><input id="case-city" value={c.city} onChange={(e) => set("city", e.target.value)} placeholder="Jakarta" className={cn(CTRL, "h-11")} /></div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={addCase} className="inline-flex h-11 items-center gap-1.5 rounded-full bg-[#1d1d1f] px-4 text-[14px] font-semibold text-white"><Plus className="size-4" />새 병원</button>
              <button type="button" onClick={dupCase} className="inline-flex h-11 items-center gap-1.5 rounded-full bg-[var(--fill)] px-4 text-[14px] font-semibold"><Copy className="size-4" />복제</button>
              <button type="button" onClick={resetCase} className="inline-flex h-11 items-center gap-1.5 rounded-full bg-[var(--fill)] px-4 text-[14px] font-semibold"><RotateCcw className="size-4" />기본 조건</button>
              <button type="button" onClick={delCase} aria-label="이 병원 검토 삭제" className="grid size-11 place-items-center rounded-full bg-[var(--fill)] text-[#6e6e73] hover:text-[#b42318]"><Trash2 className="size-4" /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1200px] gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:py-8">
        <div className="min-w-0 space-y-5">
          <Step no="1" title="장비 가격과 결제" sub="파트너가 병원에 낸 견적가와 결제 방법">
            <div className="grid gap-4 sm:grid-cols-2">
              <Num c={c} set={set} path="device.price" label="장비 도입가 (부가세 포함)" unit="IDR" hint="병원은 매입 부가세를 공제받지 못해 부가세 포함 금액이 실제 부담이에요." />
              <Num c={c} set={set} path="device.lifeMonths" label="장비비 배분 기간" unit="개월" hint="일시불일 때 손익분기에 넣는 월 장비비 = 도입가 ÷ 이 기간" />
            </div>
            <div className="mt-5">
              <p className="mb-2 text-[13px] font-medium text-[#424245]">결제 방법</p>
              <Seg label="결제 방법" value={P.mode} onChange={(v) => set("pay.mode", v)} options={[["cash", "일시불", "계약금 + 검수 후 잔금"], ["partner", "파트너 분할", "유통사가 할부 제공"], ["loan", "할부, 리스", "금융사, 은행"]]} />
            </div>
            {P.mode === "cash" ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2"><Num c={c} set={set} path="pay.depositPct" label="계약금" unit="%" hint={`잔금 ${fmt(100 - (Number(P.depositPct) || 0))}%는 설치, 검수 후`} /></div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Num c={c} set={set} path="pay.downPct" label="선납금 (DP)" unit="%" />
                <Num c={c} set={set} path="pay.months" label="기간" unit="개월" slider={[6, 60, 6]} />
                <Num c={c} set={set} path="pay.rate" label="연 금리" unit="%" />
                <div className="sm:col-span-2">
                  <p className="mb-1 text-[13px] font-medium text-[#424245]">금리 방식</p>
                  <Seg size="sm" label="금리 방식" value={P.rateType} onChange={(v) => set("pay.rateType", v)} options={[["efektif", "실효 (efektif)"], ["flat", "플랫 (flat)"]]} />
                  <p className="mt-1.5 text-[12px] text-[#86868b]">{P.rateType === "flat" && r.fin.effRate ? <>플랫 {fmt(Number(P.rate), 2)}%는 실효 금리로 약 <b className="text-[#1d1d1f]">{fmt(r.fin.effRate, 1)}%</b>예요. 견적서의 금리 방식을 꼭 확인하세요.</> : "인도네시아 리스, 할부 견적은 플랫 금리로 적는 경우가 많아요. 같은 숫자라도 플랫이 더 비쌉니다."}</p>
                </div>
                <Num c={c} set={set} path="pay.adminPct" label="수수료 (원금 대비)" unit="%" />
                <div className="sm:col-span-3 grid grid-cols-3 gap-px overflow-hidden rounded-[12px] bg-[var(--line)] text-[13px]">
                  {[["계약 때 내는 돈", krShort(r.fin.upfront)], ["월 납입금", krShort(r.fin.payment)], ["총이자와 수수료", krShort(r.fin.interest)]].map(([k, v]) => <div key={k} className="bg-[var(--surface-2)] px-3 py-2.5"><p className="text-[12px] text-[#6e6e73]">{k}</p><p className="font-semibold tabular-nums">{v}</p></div>)}
                </div>
              </div>
            )}
          </Step>

          <Step no="2" title="시술가와 환자 수" sub="자비, 민간보험 환자만 셉니다. BPJS 환자는 묶음 수가라 빼요." aside={<SourcePop meta={SOURCES["rev.bpjs"]} />}>
            <div className="grid gap-4 sm:grid-cols-3">
              <Num c={c} set={set} path="rev.price" label="회당 시술가" unit="IDR" className="sm:col-span-3" slider={[100000, 1500000, 10000]} />
            </div>
            {BENCHMARKS.length > 0 && (
              <div className="mt-3">
                <p className="mb-1.5 text-[12px] text-[#6e6e73]">공개된 인도네시아 시술가 (눌러서 적용)</p>
                <div className="flex flex-wrap gap-2">
                  {BENCHMARKS.map((b) => <button key={b.label} type="button" onClick={() => set("rev.price", String(b.value))} title={b.src} className={cn("rounded-full border px-3 py-1.5 text-left text-[12px] transition-colors", String(c.rev.price) === String(b.value) ? "border-primary bg-primary/5 text-primary" : "border-[var(--line-strong)] hover:border-[#86868b]")}><b className="tabular-nums">{rp(b.value)}</b> <span className="text-[#6e6e73]">{b.label}</span></button>)}
                </div>
                <p className="mt-1.5 text-[11px] text-[#86868b]">공개 게시가, 판촉가예요. 실제 수납액은 병원 숫자로 바꿔 넣으세요.</p>
              </div>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Num c={c} set={set} path="rev.discountPct" label="코스 할인" unit="%" />
              <Num c={c} set={set} path="rev.feePct" label="카드, QRIS, 보험 청구 차감" unit="%" />
            </div>
            <div className="mt-5">
              <p className="mb-2 text-[13px] font-medium text-[#424245]">시술량을 어떻게 넣을까요?</p>
              <Seg label="시술량 입력 방식" value={c.demand.mode} onChange={(v) => set("demand.mode", v)} options={[["sessions", "월 시술 횟수로"], ["patients", "신규 환자 수로"]]} />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {c.demand.mode === "sessions" ? <Num c={c} set={set} path="demand.sessions" label="월 유료 시술" unit="회" slider={[0, 200, 1]} />
                : <Num c={c} set={set} path="demand.newPatients" label="월 신규 환자" unit="명" slider={[0, 80, 1]} />}
              <Num c={c} set={set} path="demand.course" label="환자 1명 코스" unit="회" />
              <Num c={c} set={set} path="demand.completionPct" label="코스 완주율" unit="%" />
              <Num c={c} set={set} path="demand.rampMonths" label="환자 늘어나는 기간" unit="개월" />
            </div>
            <p className="mt-3 text-[13px] text-[#424245]">{c.demand.mode === "sessions" ? `월 ${fmt(r.S, 1)}회는 코스 ${fmt(r.I.course)}회 기준 신규 환자 약 ${fmt(r.patients, 1)}명이에요.` : `신규 ${fmt(r.I.newPatients)}명 × 코스 ${fmt(r.I.course)}회 × 완주 ${fmt(r.I.completion)}% = 월 ${fmt(r.S, 1)}회`}{r.utilization !== null && <> 장비 처리 한도의 <b className={cn(r.utilization > 1 ? "text-[#b42318]" : "")}>{fmt(r.utilization * 100)}%</b>{r.utilization > 1 && " (한도 초과, 예약 칸이나 진료 시간을 늘려야 해요)"}.</>}</p>
          </Step>

          <Step no="3" title="운영 비용" sub="회당 드는 돈과 매달 드는 돈">
            <h3 className="mb-3 text-[13px] font-semibold tracking-wide text-[#6e6e73]">회당 변동비 <span className="font-normal">합계 {rp(r.ps.variable)}</span></h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Num c={c} set={set} path="vc.docFee" label="의사 수당 (정액)" unit="IDR" />
              <Num c={c} set={set} path="vc.docPct" label="의사 수당 (시술가 대비)" unit="%" />
              <Num c={c} set={set} path="vc.consumable" label="소모품 (젤 등)" unit="IDR" />
              <Num c={c} set={set} path="vc.va" label="소비 전력" unit="VA" />
              <Num c={c} set={set} path="vc.powerMin" label="회당 켜 두는 시간" unit="분" />
              <Num c={c} set={set} path="vc.tariff" label="PLN 전기 요금" unit="Rp/kWh" />
            </div>
            <p className="mt-2 text-[12px] text-[#86868b]">회당 전기료 = {fmt(r.I.va)} VA × {fmt(r.I.powerMin)}분 × {rp(r.I.tariff)}/kWh = <b className="text-[#1d1d1f]">{rp(r.ps.power)}</b></p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Num c={c} set={set} path="vc.hpCost" label="핸드피스 교체 가격" unit="IDR" />
              <Num c={c} set={set} path="vc.hpLife" label="핸드피스 수명" unit="발" />
              <Num c={c} set={set} path="vc.shots" label="회당 발수" unit="발" />
            </div>
            <p className={cn("mt-2 text-[12px]", r.ps.handpiece === null ? "text-amber-700" : "text-[#86868b]")}>{r.ps.handpiece === null ? "핸드피스 교체비는 세 칸이 모두 있어야 계산돼요. 지금은 결과에서 빠져 있어요." : `회당 핸드피스 교체비 ${rp(r.ps.handpiece)}`}</p>

            <h3 className="mt-6 mb-3 text-[13px] font-semibold tracking-wide text-[#6e6e73]">월 고정비 <span className="font-normal">합계 {rp(r.fixed)}</span></h3>
            <ul className="space-y-2.5">
              {c.fixed.map((row, i) => { const m = fixedMeta(c, row); return (
                <li key={row.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,11rem)_auto] items-center gap-2">
                  <input value={row.label} onChange={(e) => setFixed(i, "label", e.target.value)} aria-label="고정비 항목 이름" className={cn(CTRL, "h-10")} />
                  <input value={row.amount} onChange={(e) => setFixed(i, "amount", e.target.value)} inputMode="decimal" aria-label={`${row.label} 월 금액`} className={cn(CTRL, "h-10 text-right tabular-nums")} />
                  <span className="flex items-center gap-1"><SourcePop meta={m} onReset={() => setFixed(i, "amount", (defaults().fixed.find((d) => d.id === row.id) || {}).amount || "")} /><button type="button" aria-label={`${row.label} 삭제`} onClick={() => set("fixed", c.fixed.filter((_, j) => j !== i))} className="grid size-8 place-items-center rounded-full text-[#86868b] hover:bg-[var(--fill)] hover:text-[#b42318]"><Trash2 className="size-3.5" /></button></span>
                </li>
              ); })}
            </ul>
            <button type="button" onClick={() => set("fixed", [...c.fixed, { id: caseId(), label: "새 항목", amount: "" }])} className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-primary"><Plus className="size-4" />고정비 항목 추가</button>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Num c={c} set={set} path="ops.slotMin" label="예약 1칸" unit="분" />
              <Num c={c} set={set} path="ops.hours" label="하루 사용 시간" unit="시간" />
              <Num c={c} set={set} path="ops.workDays" label="월 진료일" unit="일" />
            </div>
          </Step>
        </div>

        <div className="lg:sticky lg:top-16 lg:self-start">
          <ResultPanel c={c} r={r} lang={lang} setLang={setLang} set={set} />
        </div>
      </div>

      {/* 아래: 그래프, 민감도, 제안서, 질문, 근거 */}
      <div className="border-t border-[var(--line)] bg-white">
        <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <div role="tablist" aria-label="검토 결과 자세히" className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-[var(--fill)] p-1">
              {TABS.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("shrink-0 rounded-full px-4 py-2 text-[14px] font-semibold transition-[background,color]", tab === k ? "bg-white text-[#1d1d1f] shadow-[0_1px_3px_rgb(0_0_0/0.1)]" : "text-[#6e6e73] hover:text-[#1d1d1f]")}>{l}</button>)}
            </div>
            {(tab === "proposal" || tab === "qa") && <span className="ml-auto"><AiBox /></span>}
          </div>
          <div className="mt-6" role="tabpanel">
            {tab === "cash" && <CashTab c={c} r={r} />}
            {tab === "sens" && <SensTab c={c} r={r} />}
            {tab === "proposal" && <ProposalTab c={c} r={r} sens={sens} metaFor={metaFor} />}
            {tab === "qa" && <QaTab c={c} r={r} sens={sens} metaFor={metaFor} />}
            {tab === "src" && <SourcesTab c={c} r={r} />}
          </div>
        </div>
      </div>

      {/* 모바일: 아래 줄에 핵심 숫자 */}
      <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#1d1d1f] px-4 pt-2.5 pb-[max(10px,env(safe-area-inset-bottom))] text-white lg:hidden">
        <div className="mx-auto flex max-w-[640px] items-center justify-between gap-3 text-[12px]">
          <span><span className="block text-white/55">손익분기</span><b className="text-[17px] tabular-nums">{fmt(h.bep)}회</b></span>
          <span><span className="block text-white/55">월 손익</span><b className="text-[17px] tabular-nums">{krShort(h.profit)}</b></span>
          <span><span className="block text-white/55">회수</span><b className="text-[17px] tabular-nums">{r.payback !== null ? `${Math.ceil(r.payback)}개월` : "—"}</b></span>
        </div>
      </div>
      <div className="h-16 lg:hidden" />
    </div>
  );
}
