import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, BookOpen, ClipboardCopy, Lightbulb, X } from "lucide-react";
import { KCASES } from "../lib/cases.js";
import { CRIT } from "../lib/criteria.js";
import { load, profile, toPath } from "../lib/store.js";
import { Badge, Button, Card, CardHeader, Chip, cx, toneOf } from "../components/ui.jsx";
import { useApp } from "../components/shell.jsx";

const { CASES, PATTERNS, SRC } = KCASES;
const { C, STAGES, STATUS, SAMPLE } = CRIT;
const STATUS_TONE = { y: "teal", p: "amber", n: "amber", na: "gray", "": "outline" };

export default function Cases() {
  const { copy } = useApp();
  const { id } = useParams();
  const P = useMemo(profile, []);
  const R = useMemo(() => load("ready", null) || (P.sample ? SAMPLE : { s: {} }), [P]);
  const st = (k) => (R.s[k] && R.s[k][0]) || "";
  const [filter, setFilter] = useState("all");
  const [stage, setStage] = useState(0);
  const [hl, setHl] = useState("");

  const pct = (ids) => {
    let got = 0, max = 0;
    ids.forEach((k) => { const c = C.find((x) => x.id === k), v = STATUS[st(k)].v; if (!c || v === null) return; max += c.w; got += c.w * v; });
    return max ? Math.round((got / max) * 100) : 0;
  };
  const jump = (k) => {
    setFilter("all"); setStage(0); setHl(k);
    setTimeout(() => document.getElementById(k)?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
    setTimeout(() => setHl(""), 2200);
  };
  useEffect(() => { if (id) jump(id); }, [id]);

  const list = CASES.filter((c) => (filter === "all" || c.use === filter) && (!stage || c.stage.includes(stage)));
  const summary = CASES.map((c) => `[사례 ${c.no}] ${c.title}\n문제: ${c.problem}\n성과: ${c.result.map((r) => r.join(" ")).join(" / ")}\n할 일: ${c.todo}\n관련 기준: ${c.crit.join(", ")}`).join("\n\n") + "\n\n출처: " + SRC;

  return (
    <>
      <header className="mb-6 sm:mb-8">
        <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold">
          <span className="rounded-lg bg-graphite text-white px-2 py-0.5">KOTRA AI 활용 우수사례집 2025</span>
          <span className="text-muted-foreground">사례 11개 (세부 14건)</span>
        </div>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-[26px] sm:text-[32px] font-semibold leading-tight">KOTRA 사례로 보는 수출 준비</h1>
          <div className="no-print flex flex-wrap gap-2">
            <Button icon={ClipboardCopy} onClick={() => copy(summary, "사례 요약을 복사했어요")}>사례 요약 복사</Button>
            <Button as={Link} to="/readiness" variant="primary" icon={ArrowRight}>01 진단으로</Button>
          </div>
        </div>
        <p className="mt-2.5 max-w-3xl text-base text-ink-2 leading-relaxed">
          2025 KOTRA AI 활용 우수사례집의 사례를 문제 → AI 방식 → 성과로 정리하고, 각 사례를 우리 회사가 할 일과 이 도우미의 페이지에 연결했어요. 점검 상태는 <Link className="text-brand-700 font-semibold underline underline-offset-2" to="/readiness">01 수출 준비 진단</Link>에 입력한 값을 그대로 보여 줘요.
        </p>
      </header>

      <Card className="mb-6">
        <CardHeader icon={Lightbulb} title="사례집에서 반복되는 원칙 5가지" desc="이 도우미도 같은 원칙으로 만들었어요." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {PATTERNS.map(([t, d, k]) => (
            <div key={t} className="flex flex-col rounded-lg bg-surface px-4 py-3.5 text-sm">
              <b className="text-sm mb-1">{t}</b>
              <span className="text-ink-2 flex-1">{d}</span>
              <button type="button" className="mt-2 self-start text-brand-700 font-semibold text-sm hover:underline cursor-pointer" onClick={() => jump(k)}>사례 {CASES.find((c) => c.id === k).no} →</button>
            </div>
          ))}
        </div>
      </Card>

      <Card tone="soft" className="mb-6">
        <CardHeader icon={BookOpen} title="AI 수출비서의 8단계 수출 여정 × 우리 준비 상태" desc={`${P.company || "우리 회사"} · ${P.product || ""} 기준. 단계를 누르면 그 단계 사례만 봐요.`} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {STAGES.map((s) => {
            const p = pct(s.ids), nk = CASES.filter((c) => c.stage.includes(s.n)).length;
            return (
              <button key={s.n} type="button" onClick={() => setStage(stage === s.n ? 0 : s.n)} aria-pressed={stage === s.n}
                className={cx("text-left rounded-lg px-3.5 py-3 border transition-colors cursor-pointer", stage === s.n ? "bg-brand-600 border-brand-600 text-white" : "bg-white border-line hover:border-brand-500")}>
                <p className={cx("text-xs font-semibold", stage === s.n ? "text-white/75" : "text-muted-foreground")}>{s.n} · {s.g}</p>
                <p className="font-semibold text-sm mt-0.5">{s.name}</p>
                <div className={cx("h-1.5 rounded-full mt-2 overflow-hidden", stage === s.n ? "bg-white/25" : "bg-line")}><i className={cx("block h-full rounded-full", stage === s.n ? "bg-white" : "bg-brand-600")} style={{ width: p + "%" }} /></div>
                <p className={cx("flex justify-between text-xs mt-1.5", stage === s.n ? "text-white/80" : "text-muted-foreground")}><span>기준 {s.ids.length} · 사례 {nk}</span><b className={stage === s.n ? "text-white" : "text-ink"}>{p}%</b></p>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="no-print flex flex-wrap gap-2 mb-4">
        {[["all", "전체"], ["direct", "기업이 직접 이용"], ["method", "방식만 따라 하기"]].map(([k, l]) => <Chip key={k} on={filter === k} onClick={() => setFilter(k)}>{l}</Chip>)}
        {stage > 0 && <Chip on={false} onClick={() => setStage(0)}><span className="inline-flex items-center gap-1">단계 {stage} 해제 <X size={13} /></span></Chip>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {list.map((c) => (
          <article key={c.id} id={c.id} className={cx("scroll-mt-24 rounded-2xl bg-card border border-transparent p-5 sm:p-6 grid gap-4 content-start transition-shadow", hl === c.id ? "border-brand-500 ring-4 ring-brand-100" : "border-line")}>
            <div className="flex justify-between gap-3 items-start">
              <div>
                <p className="text-xs font-semibold text-brand-700">사례 {c.no} · p.{c.p}</p>
                <h2 className="text-lg font-semibold leading-snug mt-0.5">{c.title}</h2>
                <p className="text-sm text-muted-foreground">{c.sub}</p>
              </div>
              <Badge tone={c.use === "direct" ? "teal" : "blue"} className="shrink-0">{c.use === "direct" ? "직접 이용" : "방식 차용"}</Badge>
            </div>
            <div><p className="text-xs font-semibold text-muted-foreground mb-1">문제</p><p className="text-sm text-ink-2 leading-relaxed">{c.problem}</p></div>
            <div><p className="text-xs font-semibold text-muted-foreground mb-1">AI 방식</p><p className="text-sm text-ink-2 leading-relaxed">{c.ai}</p></div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">성과 (사례집 수치)</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {c.result.map(([a, b]) => <div key={a} className="rounded-lg bg-surface px-3.5 py-2.5"><b className="block text-base text-brand-700">{a}</b><span className="text-[13px] text-ink-2">{b}</span></div>)}
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 px-4 py-3"><p className="text-xs font-semibold text-amber-700 mb-1">우리 기업이 할 일</p><p className="text-sm leading-relaxed">{c.todo}</p></div>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap gap-1.5">
                {c.crit.map((k) => {
                  const cr = C.find((x) => x.id === k), s = st(k);
                  return <Link key={k} to={"/readiness/" + k} title={(cr ? cr.t : k) + " · " + STATUS[s].label}><Badge tone={STATUS_TONE[s] || toneOf(STATUS[s].cls)}>{k} {STATUS[s].label}</Badge></Link>;
                })}
              </div>
              {c.tool && <Button as={Link} to={toPath(c.tool[0])} size="sm" variant="soft" icon={ArrowRight}>{c.tool[1]}</Button>}
            </div>
          </article>
        ))}
        {!list.length && <p className="text-muted-foreground">조건에 맞는 사례가 없어요.</p>}
      </div>

      <p className="mt-6 text-[13px] text-muted-foreground">출처: {SRC}. 수치는 사례집 표기 그대로이며, 서비스 신청 조건·운영 기간은 KOTRA 무역투자24에서 다시 확인하세요.</p>
    </>
  );
}
