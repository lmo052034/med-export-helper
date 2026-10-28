import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronDown, Copy, FileText, ListChecks, MessageCircleQuestion, RotateCcw, Sparkles } from "lucide-react";
import { CRIT } from "../lib/criteria.js";
import { KCASES } from "../lib/cases.js";
import { profile, useStored, clone } from "../lib/store.js";
import { Badge, Button, Callout, Card, CardHeader, Chip, Input, Progress, Tabs, cx } from "../components/ui.jsx";
import { PageHeader, StepPager, useApp } from "../components/shell.jsx";

const { C, IND, STATUS, STAGES, KREF, SAMPLE } = CRIT;
// G(AI 활용)는 모든 단계에 공통이라 9번째 묶음으로 둡니다
const GROUPS = [...STAGES, { n: 9, g: "모든 단계", name: "AI 활용·확인", ids: C.filter((c) => c.cat === "G").map((c) => c.id) }];
const ANS = { y: "예", p: "일부", n: "아니오", na: "해당 없음" };
const ANS_ON = { y: "bg-brand-600 text-white", p: "bg-amber-100 text-amber-700", n: "bg-graphite text-white", na: "bg-surface text-muted-foreground" };
const crit = (id) => C.find((c) => c.id === id);

export default function Readiness() {
  const { ask, copy } = useApp();
  const { id: linkId } = useParams();
  const P = profile();
  const [S, setS] = useStored("ready", () => (P.sample ? clone(SAMPLE) : { s: {} }));
  const [view, setView] = useState("todo");
  const [stage, setStage] = useState(1);
  const [open, setOpen] = useState(() => new Set());

  const st = (id) => (S.s[id] && S.s[id][0]) || "";
  const note = (id) => (S.s[id] && S.s[id][1]) || "";
  const calc = (list) => {
    let got = 0, max = 0;
    list.forEach((c) => { const v = STATUS[st(c.id)].v; if (v === null) return; max += c.w; got += c.w * v; });
    return max ? Math.round((got / max) * 100) : 0;
  };
  const setAns = (id, a) => setS({ s: { ...S.s, [id]: [st(id) === a ? "" : a, note(id)] } });
  const setNote = (id, t) => setS({ s: { ...S.s, [id]: [st(id), t] } });
  const toggle = (id) => setOpen((o) => { const n = new Set(o); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const gaps = () =>
    C.filter((c) => st(c.id) !== "na" && st(c.id) !== "y")
      .map((c) => ({ c, score: c.w * (1 - STATUS[st(c.id)].v) + (st(c.id) === "" ? 0.1 : 0) + (9 - (GROUPS.find((g) => g.ids.includes(c.id)) || { n: 9 }).n) * 0.05 }))
      .sort((a, b) => b.score - a.score);

  function goto(id) {
    setStage((GROUPS.find((g) => g.ids.includes(id)) || GROUPS[0]).n);
    setOpen((o) => new Set(o).add(id));
    setView("stage");
    setTimeout(() => document.getElementById("q-" + id)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  }
  useEffect(() => { if (linkId && crit(linkId)) goto(linkId); }, [linkId]); // eslint-disable-line

  const prompt = (c) => `너는 의료기기 수출 실무를 돕는 조사 담당자다.
회사: ${P.company || "(입력)"} / 제품: ${P.product || "(입력)"} (HS ${P.hs || "모름"}, ${P.grade ? P.grade + "등급" : "등급 모름"}) / 관심 국가: ${P.countries || "(입력)"}

할 일: ${c.t}
이렇게 되면 완료: ${c.ok}
지금 상태: ${note(c.id) || (st(c.id) ? ANS[st(c.id)] : "모름")}
${c.ind ? "참고 제도: " + IND.med[c.ind] + "\n" : ""}
도와줄 것: ${c.ai}. 그리고 내가 직접 확인할 공식 화면(${c.src})을 어떻게 찾는지 단계별로 알려 줘.
규칙:
- 숫자·세율·인증·법 조항에는 기관명·문서명·URL·기준일을 붙여라.
- 확실하지 않으면 "확인 필요"라고 쓰고 추측하지 마라.
- 한국 기준과 수입국 기준을 섞지 마라.`;

  const counts = { y: 0, p: 0, n: 0, "": 0 };
  C.forEach((c) => { if (counts[st(c.id)] != null) counts[st(c.id)]++; });
  const total = calc(C);

  return (
    <>
      <PageHeader
        path="/readiness"
        desc="의료기기를 처음 수출할 때 갖춰야 할 52가지를 KOTRA AI 수출비서의 8단계 수출 여정 순서로 물어요. '예·일부·아니오'로 답하면 부족한 것부터 할 일을 뽑아 줘요."
        guide={[["이 페이지에서", "질문에 답하며 우리 회사의 준비 상태를 확인합니다."], ["준비물", "제품 카탈로그, 식약처 허가증, 가격표 (없으면 '아니오')"], ["다 하면", "'먼저 할 일 5가지'를 복사해 팀과 나누세요."]]}
        actions={<>
          <Button icon={Sparkles} onClick={() => confirm("가상 예시 답으로 바꿀까요? 지금 답은 지워져요.") && setS(clone(SAMPLE))}>가상 예시 보기</Button>
          <Button icon={RotateCcw} variant="ghost" onClick={() => { if (confirm("모든 답을 지우고 처음부터 할까요?")) { setS({ s: {} }); setStage(1); setView("stage"); } }}>처음부터</Button>
          <Button variant="primary" icon={Copy} onClick={() => {
            const lines = [`[먼저 할 일] ${P.company || ""} · ${P.product || ""} (준비 ${total}%)`, ""];
            gaps().slice(0, 5).forEach(({ c }, k) => lines.push(`${k + 1}. ${c.t}`, `   할 일: ${c.need}`, `   확인할 곳: ${c.src}`));
            copy(lines.join("\n"), "할 일 5가지를 복사했어요");
          }}>할 일 복사</Button>
        </>}
      />

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-[200px_minmax(0,1fr)] gap-6 items-center">
          <div>
            <p className="text-sm text-muted-foreground font-semibold">지금 준비된 정도</p>
            <p className="text-[56px] font-semibold leading-none text-brand-700 mt-2 tabular-nums">{total}<span className="text-2xl text-muted-foreground">%</span></p>
            <Progress value={total} className="mt-4" />
            <p className="text-[13px] text-muted-foreground mt-2">예 {counts.y} · 일부 {counts.p} · 아니오 {counts.n} · 아직 {counts[""]}</p>
          </div>
          <div>
            <p className="text-[13px] text-muted-foreground font-semibold mb-2.5">KOTRA AI 수출비서의 8단계 수출 여정 · 누르면 그 단계 질문으로 가요</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STAGES.map((s) => {
                const p = calc(s.ids.map(crit));
                const on = view === "stage" && stage === s.n;
                return (
                  <button key={s.n} type="button" onClick={() => { setStage(s.n); setView("stage"); }}
                    className={cx("text-left rounded-lg border p-3 transition cursor-pointer", on ? "border-brand-500 ring-2 ring-brand-100 bg-brand-50/40" : "border-line bg-white hover:border-brand-200")}>
                    <p className="text-[11.5px] text-muted-foreground font-semibold">{s.n} · {s.g}</p>
                    <p className="text-sm font-semibold mt-0.5 mb-2 leading-snug">{s.name}</p>
                    <Progress value={p} />
                    <p className="text-xs text-ink-2 mt-1.5 tabular-nums">{p}% · {s.ids.length}문항</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      <Tabs className="mb-5" value={view} onChange={setView} tabs={[["todo", "먼저 할 일 5가지", ListChecks], ["stage", "단계별 점검", FileText], ["ask", "AI 수출비서 질문", MessageCircleQuestion]]} />

      {view === "todo" && <Todo gaps={gaps().slice(0, 5)} st={st} note={note} onAsk={(c) => ask(c.t, prompt(c), "회사·제품")} onGoto={goto} />}

      {view === "stage" && (() => {
        const g = GROUPS.find((x) => x.n === stage);
        return (
          <div>
            <div className="flex flex-wrap gap-1.5 mb-5">
              {GROUPS.map((x) => <Chip key={x.n} on={x.n === stage} onClick={() => setStage(x.n)}>{x.n < 9 ? x.n + ". " : ""}{x.name}</Chip>)}
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl font-semibold">{g.n < 9 ? g.n + "단계 · " : ""}{g.name}</h2>
              <Badge tone="teal">{calc(g.ids.map(crit))}%</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{g.g} · {g.ids.length}문항</p>
            <div className="grid gap-2.5">
              {g.ids.map((id) => {
                const c = crit(id), s = st(id), isOpen = open.has(id);
                const k = (KREF[id] || []).map((x) => KCASES.CASES.find((y) => y.id === x)).filter(Boolean);
                return (
                  <div key={id} id={"q-" + id} className={cx("rounded-2xl border-2 bg-card transition", isOpen ? "border-primary/40" : "border-transparent")}>
                    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-3 md:items-center p-4">
                      <div>
                        <p className="font-semibold text-sm"><span className="text-xs text-muted-foreground mr-1.5">{id}</span>{c.t}</p>
                        <p className="text-sm text-ink-2 mt-0.5">{c.need}</p>
                        <button type="button" onClick={() => toggle(id)} className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 cursor-pointer">
                          {isOpen ? "접기" : "자세히"} <ChevronDown size={15} className={cx("transition", isOpen && "rotate-180")} />
                        </button>
                      </div>
                      <div className="inline-flex rounded-lg border border-line-2 overflow-hidden self-start md:self-center">
                        {["y", "p", "n", "na"].map((x) => (
                          <button key={x} type="button" onClick={() => setAns(id, x)}
                            className={cx("px-3 h-9 text-sm font-semibold border-r border-line last:border-r-0 cursor-pointer whitespace-nowrap", s === x ? ANS_ON[x] : "bg-white text-ink-2 hover:bg-surface")}>
                            {ANS[x]}
                          </button>
                        ))}
                      </div>
                    </div>
                    {isOpen && (
                      <div className="border-t border-line px-4 py-4 text-sm">
                        <dl className="grid sm:grid-cols-[120px_minmax(0,1fr)] gap-x-4 gap-y-2">
                          {[["'예'의 기준", c.ok], ["'일부'는", c.part], ["확인할 곳", c.src], c.ind && ["의료기기 참고", IND.med[c.ind]], ["AI가 할 일", c.ai], ["사람이 할 일", c.human]].filter(Boolean).map(([a, b]) => (
                            <div key={a} className="contents"><dt className="text-[13px] font-semibold text-muted-foreground">{a}</dt><dd>{b}</dd></div>
                          ))}
                          {k.length > 0 && (
                            <div className="contents"><dt className="text-[13px] font-semibold text-muted-foreground">KOTRA 사례</dt>
                              <dd className="flex flex-wrap gap-x-3">{k.map((x) => <Link key={x.id} to={"/cases/" + x.id} className="text-brand-700 font-semibold hover:underline">{x.no} {x.title}</Link>)}</dd></div>
                          )}
                        </dl>
                        <Input className="mt-4" value={note(id)} onChange={(e) => setNote(id, e.target.value)} placeholder="메모: 지금 상태나 근거 (예: 식약처 인증서 사본 있음)" />
                        <Button size="sm" variant="soft" className="mt-3" icon={MessageCircleQuestion} onClick={() => ask(c.t, prompt(c), "회사·제품")}>AI에게 묻기</Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {g.n < 9 && <Button variant="primary" className="mt-5" onClick={() => { setStage(g.n + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>다음 단계 →</Button>}
          </div>
        );
      })()}

      {view === "ask" && <Ask P={P} ask={ask} />}

      <StepPager path="/readiness" />
    </>
  );
}

function Todo({ gaps, st, note, onAsk, onGoto }) {
  if (!gaps.length) return <Callout tone="ok">부족한 항목이 없어요.</Callout>;
  return (
    <Card>
      <p className="text-sm text-muted-foreground mb-2">중요한데 아직 안 된 것부터 골랐어요. '자세히'를 누르면 어디서 확인하는지 나와요.</p>
      <ol className="divide-y divide-line">
        {gaps.map(({ c }, k) => (
          <li key={c.id} className="flex gap-4 py-4">
            <span className="grid place-items-center size-10 shrink-0 rounded-lg bg-brand-50 text-brand-700 font-semibold">{k + 1}</span>
            <div className="min-w-0">
              <h3 className="font-semibold text-base">{c.t}</h3>
              <p className="text-sm text-ink-2 mt-0.5">{c.need}</p>
              <p className="text-[13px] text-muted-foreground mt-1">지금: {note(c.id) || (st(c.id) ? ANS[st(c.id)] : "아직 답하지 않음")} · 확인할 곳: {c.src}</p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="primary" icon={MessageCircleQuestion} onClick={() => onAsk(c)}>AI에게 묻기</Button>
                <Button size="sm" onClick={() => onGoto(c.id)}>자세히</Button>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

// AI 수출비서의 단계별 질문 라이브러리처럼, 우리 제품에 맞춘 시작 질문
function Ask({ P, ask }) {
  const pr = P.product || "우리 의료기기", hs = P.hs || "(HS 코드)", cs = P.countries || "(관심 국가)";
  const L = [
    ["1. 글로벌 시장 탐색", [`HS ${hs} 의료기기 수입이 크고 빠르게 늘어나는 나라 5곳을 UN Comtrade·ITC Trade Map 기준으로 알려 줘. 연도와 출처를 붙여 줘.`, `${pr}를 주로 수출하는 나라와 한국의 점유율 순위는?`]],
    ["2. 타깃 국가 시장 동향", [`${cs}의 ${pr} 수입 관세(MFN·FTA)와 의료기기 인허가 제도를 비교해 줘. 공식 사이트 링크를 붙여 줘.`, `${cs}에서 ${pr}를 쓰는 병원·클리닉 수나 시장 규모를 알 수 있는 공식 통계는?`]],
    ["3. 마케팅·영업 준비", [`${pr}의 영문 카탈로그에 꼭 들어가야 할 항목(사양·인증·사용처)을 목록으로 줘.`, `바이코리아에 ${pr}를 등록할 때 쓸 영문 상품명과 키워드 10개를 제안해 줘.`]],
    ["4. 바이어 탐색", [`${cs}에서 ${pr}를 수입·유통할 만한 회사 유형과 찾는 방법(KOTRA 바이어 매칭, 전시회 참가사 목록 등)을 알려 줘.`, `통관 데이터에서 바이어를 고를 때 볼 변수(선적 빈도, 물량, 공급선 수)를 설명해 줘.`]],
    ["5. 마케팅·영업 실시", [`첫 화상상담에서 의료기기 바이어가 자주 묻는 질문 10개와 답변 준비 방법은?`]],
    ["6. 계약 체결", [`처음 거래하는 해외 유통사와 맺는 계약서에 꼭 넣을 조항(독점, 기간, A/S, 인허가 명의)을 알려 줘.`, `무역사기에서 자주 나오는 수법(결제 계좌 변경 요청 등)과 확인 방법은?`]],
    ["7. 수출 실행", [`항공으로 소량 샘플을 보낼 때 맞는 Incoterms와 필요한 서류(인보이스·패킹리스트)를 알려 줘.`]],
    ["8. 리스크·사후관리", [`${cs}의 의료기기 규제가 바뀌는지 꾸준히 확인할 수 있는 공식 채널은?`, `해외 판매 후 불량·부작용이 생기면 수출 기업이 해야 할 일은?`]],
  ];
  const report = `너는 KOTRA 해외시장 조사원처럼 답하는 수출 전략 보고서 작성자다.
제품: ${pr} (HS ${hs}, ${P.grade ? P.grade + "등급" : "등급 미상"}) / 회사 수출 경험: ${P.exp === "some" ? "있음" : "없음"} / 관심 국가: ${cs}
아래 7개 항목으로 수출 시장 전략 보고서를 써 줘.
1) 유망 시장 추천과 이유 2) 시장 규모·성장성 3) 경쟁 동향(주요 수입국·브랜드) 4) 유통 구조 5) 인증·규제 6) 바이어 유형과 찾는 방법 7) 진출 전략과 주의할 점(무역사기 포함)
규칙: 숫자마다 출처·기준연도를 붙이고, 모르는 것은 "확인 필요"로 써라. 마지막에 내가 공식자료로 확인할 목록을 따로 정리해 줘.`;
  const rule = "\n\n규칙: 숫자·세율·인증에는 출처와 기준일을 붙이고, 모르면 '확인 필요'라고 써라.";
  return (
    <div className="grid gap-5">
      <Callout tone="info">
        KOTRA <b>AI 수출비서</b>는 수출 여정 8단계마다 질문 예시를 준비해 두고, HS 코드·품목을 넣으면 7개 항목 보고서를 5분 만에 만들어 줘요 (사례집 01). 아래는 같은 방식으로 우리 제품에 맞춘 질문이에요. 무역투자24의 AI 수출비서에 그대로 물어봐도 돼요.
      </Callout>
      <Card className="bg-graphite! border-graphite! text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">수출 전략 보고서 (7개 항목)</h2>
            <p className="text-sm text-white/65 mt-0.5">한 번에 큰 그림을 보고 싶을 때</p>
          </div>
          <Button variant="primary" icon={FileText} onClick={() => ask("수출 전략 보고서 질문", report, "나라 고르기")}>보고서 질문 만들기</Button>
        </div>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {L.map(([t, qs]) => (
          <Card key={t}>
            <h3 className="font-semibold">{t}</h3>
            <ul className="mt-3 grid gap-2">
              {qs.map((q) => (
                <li key={q}>
                  <button type="button" onClick={() => ask("AI 수출비서 질문", q + rule, "회사·제품")}
                    className="w-full text-left rounded-lg bg-surface hover:bg-brand-50 px-3.5 py-2.5 text-sm text-ink-2 hover:text-brand-800 transition cursor-pointer flex gap-2">
                    <MessageCircleQuestion size={16} className="shrink-0 mt-0.5 text-brand-600" />
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
