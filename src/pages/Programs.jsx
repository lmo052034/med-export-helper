import { useMemo, useState } from "react";
import { CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, ExternalLink, GanttChart, LayoutList, MapPin, RefreshCw, Sparkles, Target, X, AlertTriangle, Check } from "lucide-react";
import { NLIB } from "../lib/notices.js";
import { REGIONS, profile, useStored } from "../lib/store.js";
import { Badge, Button, Callout, Card, CardHeader, CheckList, Chip, Field, Select, Tabs, cx, toneOf } from "../components/ui.jsx";
import { PageHeader, StepPager, useApp } from "../components/shell.jsx";

const { data, SRC, GOALS, AREAS } = NLIB;
const srcName = (n) => (SRC[n.src] || SRC.etc).name;
const fmt = (d) => (d ? d.slice(2).replace(/-/g, ".") : "");
const LINKS = [
  ["한국의료기기협동조합", "https://www.kmdica.or.kr/", "교육·해외인증·전시"],
  ["보건산업진흥원 교육·행사", "https://www.khidi.or.kr/board?menuId=MENU01491", "복지부 산하·협동조합 글"],
  ["기업마당 지원사업 공고", "https://www.bizinfo.go.kr/", "중기부·산업부 등 통합"],
  ["KOTRA 무역투자24", "https://www.kotra.or.kr/", "지사화·해외전시 신청"],
  ["글로벌전시플랫폼 (GEP)", "https://www.gep.or.kr/", "해외전시 한국관 모집"],
  ["수출바우처", "https://www.exportvoucher.com/", "마케팅·인증 비용 지원"],
];
const EV = { start: "bg-brand-50 text-brand-800", end: "bg-amber-50 text-amber-700", event: "bg-[#eaf1f7] text-[#2f6690]", posted: "bg-surface text-ink-2" };

export default function Programs() {
  const { ask, toast } = useApp();
  const P = profile();
  const [G, setG] = useStored("goal", () => NLIB.defaultGoal(P));
  const [view, setView] = useState("rec");
  const [calM, setCalM] = useState(NLIB.today.slice(0, 7));
  const [onlyRec, setOnlyRec] = useStored("calRec", false);
  const [srcF, setSrcF] = useStored("allSrc", "");
  const [showSrc, setShowSrc] = useState(false);
  const [pick, setPick] = useState(null);

  const rec = useMemo(() => NLIB.recommend(G), [G]);
  const toggle = (key, v) => setG({ ...G, [key]: G[key].includes(v) ? G[key].filter((x) => x !== v) : [...G[key], v] });

  const aiPrompt = (n) => `너는 중소 의료기기 기업의 수출 지원사업 신청을 돕는 담당자다.
우리 회사: ${P.company || "(입력)"} · 제품: ${P.product || "(입력)"} (HS ${P.hs || "?"}, ${P.grade ? P.grade + "등급" : "등급 미정"}) · 본사 ${P.region || "?"} · 수출 경험 ${P.exp === "some" ? "있음" : "없음"}
공고: ${n.title}
주관: ${n.org} / 접수 ${n.start || "?"} ~ ${n.end || "?"}${n.event ? ` / 행사 ${n.event.name} ${n.event.start}~${n.event.end} ${n.event.place || ""}` : ""}
원문: ${n.url}

해 줄 일:
1. 원문 공고를 기준으로 신청 자격, 제출 서류, 우리 회사 부담 비용을 표로 정리
2. 마감까지 날짜별 할 일 체크리스트 (서류 준비 → 온라인 신청 → 이메일 제출 → 신청금 납부처럼 단계가 여럿이면 모두)
3. 평가 기준(수출실적·기업경쟁력·전시적합성 등)에 맞춰 신청서에 쓸 우리 회사 강점 초안 3줄
규칙: 원문에 없는 내용은 "원문 확인 필요"라고 쓰고 추측하지 마라. 날짜·금액은 원문 그대로 옮겨라.`;

  const downloadIcs = (n) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([NLIB.ics(n)], { type: "text/calendar" }));
    a.download = "공고_" + n.id + ".ics";
    a.click();
    toast("캘린더 파일을 받았어요. 열면 내 캘린더에 들어가요");
  };
  const cardProps = { onIcs: downloadIcs, onAi: (n) => { setPick(null); ask("공고 신청 준비 질문", aiPrompt(n), "회사·제품"); } };

  const okN = data.sources.filter((s) => s.ok).length;
  const upd = data.updated ? new Date(data.updated).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" }) : "–";

  return (
    <>
      <PageHeader
        path="/programs"
        desc="한국의료기기협동조합·보건복지부·산업통상부·중소벤처기업부·KOTRA의 수출 지원 공고(해외 전시회, 지사화 포함)를 매일 모아 달력에 놓아요. 목표를 고르면 맞는 공고를 이유와 함께 추천해요."
        guide={[["이 페이지에서", "접수 중인 공고와 마감일을 한눈에 봅니다."], ["준비물", "하고 싶은 일(전시회·바이어·인증 등)과 관심 지역"], ["다 하면", "마음에 드는 공고를 내 캘린더에 넣고 원문으로 신청하세요."]]}
      />

      <div className="mb-6 rounded-xl bg-white border border-line px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-2">
        <span className="flex items-center gap-1.5"><RefreshCw size={15} className="text-brand-600" />마지막 수집 <b className="text-ink">{upd}</b></span>
        <span>공고 <b className="text-ink">{data.items.length}</b>건</span>
        <span>출처 {okN}/{data.sources.length}곳 정상</span>
        <button type="button" className="ml-auto text-sm font-semibold text-brand-700 cursor-pointer" onClick={() => setShowSrc(!showSrc)}>{showSrc ? "접기" : "출처별 상태 보기"}</button>
        {showSrc && (
          <div className="w-full pt-2">
            <CheckList items={data.sources.map((s) => [s.ok ? "pass" : "info", `${s.name} · ${s.count}건${s.note ? " · " + s.note : ""}`])} />
            <p className="text-[13px] text-muted-foreground mt-3">매일 오전 6시에 GitHub Actions가 수집해요. 공식 API를 우선 쓰고, 게시판은 robots.txt가 허용하는 곳만 읽어요. 중소벤처기업부·산업통상부·보건복지부·KOTRA 공고는 정부 통합 공고 창구인 기업마당 API로, 의료기기협동조합 공지는 보건산업진흥원 게시판으로 받아요.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="min-w-0">
          <Tabs className="mb-5" value={view} onChange={setView} tabs={[["rec", `추천 공고 ${rec.length}`, Sparkles], ["cal", "달력", CalendarDays], ["tl", "타임라인", GanttChart], ["all", "전체 공고", LayoutList]]} />

          {view === "rec" && (() => {
            const closed = data.items.filter((n) => NLIB.status(n).k === "closed" && (n.types || []).some((t) => G.goals.includes(t)) && n.med).slice(0, 3);
            return (
              <div className="grid gap-3">
                {rec.length ? (
                  <>
                    <p className="text-sm text-muted-foreground">목표·지역·마감일을 기준으로 <b className="text-ink">{rec.length}건</b>을 골랐어요. 위에 있을수록 더 잘 맞아요.</p>
                    {rec.map(({ n, why }) => <Notice key={n.id} n={n} why={why} {...cardProps} />)}
                  </>
                ) : (
                  <Callout>지금 조건에 맞는 공고가 없어요. 목표나 지역을 더 고르거나 기간을 늘려 보세요.</Callout>
                )}
                {closed.length > 0 && (
                  <>
                    <h3 className="font-semibold mt-4">지난 공고 <span className="text-muted-foreground font-normal text-sm">내년 일정 참고</span></h3>
                    {closed.map((n) => <Notice key={n.id} n={n} {...cardProps} />)}
                  </>
                )}
              </div>
            );
          })()}

          {view === "cal" && <Calendar calM={calM} setCalM={setCalM} onlyRec={onlyRec} setOnlyRec={setOnlyRec} recIds={new Set(rec.map((x) => x.n.id))} onPick={setPick} />}

          {view === "tl" && <Timeline />}

          {view === "all" && (
            <div className="grid gap-3">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[["", "전체"], ...Object.entries(SRC).map(([k, v]) => [k, v.name])].map(([k, l]) => (
                  <Chip key={k} on={srcF === k} onClick={() => setSrcF(k)}>{l} {k ? data.items.filter((n) => n.src === k).length : data.items.length}</Chip>
                ))}
              </div>
              {data.items.filter((n) => !srcF || n.src === srcF).map((n) => <Notice key={n.id} n={n} {...cardProps} />)}
            </div>
          )}
        </div>

        <aside className="grid gap-6 lg:sticky lg:top-8">
          <Card>
            <CardHeader icon={Target} title="우리 목표" desc="고르면 바로 추천이 바뀌어요." />
            <p className="text-sm font-semibold text-ink-2 mb-2">무엇을 하고 싶나요? <span className="font-normal text-muted-foreground">여러 개</span></p>
            <div className="flex flex-wrap gap-1.5 mb-4">{GOALS.map(([k, l]) => <Chip key={k} on={G.goals.includes(k)} onClick={() => toggle("goals", k)}>{l}</Chip>)}</div>
            <p className="text-sm font-semibold text-ink-2 mb-2">어느 지역에 팔고 싶나요?</p>
            <div className="flex flex-wrap gap-1.5 mb-4">{AREAS.map((a) => <Chip key={a} on={G.areas.includes(a)} onClick={() => toggle("areas", a)}>{a}</Chip>)}</div>
            <div className="grid grid-cols-2 gap-x-3">
              <Field label="본사 지역"><Select value={G.region} onChange={(e) => setG({ ...G, region: e.target.value })} options={REGIONS} /></Field>
              <Field label="언제까지"><Select value={String(G.months)} onChange={(e) => setG({ ...G, months: +e.target.value })} options={[["1", "1개월 안"], ["3", "3개월 안"], ["6", "6개월 안"], ["12", "1년 안"]]} /></Field>
            </div>
            <Field label="수출 경험"><Select value={G.exp} onChange={(e) => setG({ ...G, exp: e.target.value })} options={[["none", "처음이에요"], ["some", "조금 있어요"]]} /></Field>
            <Button size="sm" variant="ghost" icon={RefreshCw} onClick={() => setG(NLIB.defaultGoal(P))}>회사 정보로 다시 채우기</Button>
          </Card>
          <Card>
            <CardHeader icon={ExternalLink} title="공고 원문 바로가기" desc="여기서 직접 찾아볼 수도 있어요." />
            <ul className="grid gap-1.5">
              {LINKS.map(([n, u, d]) => (
                <li key={u}>
                  <a href={u} target="_blank" rel="noopener" className="flex items-center justify-between gap-3 rounded-lg bg-surface hover:bg-brand-50 px-3.5 py-2.5 text-sm font-semibold">
                    {n}<span className="text-xs font-normal text-muted-foreground text-right">{d}</span>
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>

      {pick && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-graphite/50 sm:p-4" onClick={(e) => e.target === e.currentTarget && setPick(null)}>
          <div className="relative w-full sm:max-w-xl max-h-[90vh] overflow-auto rounded-t-3xl sm:rounded-xl bg-white p-2">
            <button type="button" onClick={() => setPick(null)} className="absolute right-4 top-4 grid place-items-center size-9 rounded-full hover:bg-surface cursor-pointer z-10" aria-label="닫기"><X size={20} /></button>
            <Notice n={pick} {...cardProps} bare />
          </div>
        </div>
      )}

      <StepPager path="/programs" />
    </>
  );
}

function Notice({ n, why, onIcs, onAi, bare }) {
  const st = NLIB.status(n);
  return (
    <article className={cx("rounded-xl bg-white p-5", !bare && "border border-line hover:border-brand-200 transition", st.k === "closed" && "opacity-60")}>
      <div className="flex flex-wrap gap-1.5 pr-10">
        <Badge tone={toneOf(st.cls)}>{st.label}</Badge>
        {(n.types || []).map((t) => <Badge key={t} tone="outline">{t}</Badge>)}
        {n.regions && n.regions.length > 0 && <Badge tone="amber">{n.regions.join("·")} 기업만</Badge>}
      </div>
      <h3 className="mt-2.5 text-base font-semibold leading-snug">
        <a href={n.url} target="_blank" rel="noopener" className="hover:text-brand-700">{n.title}</a>
      </h3>
      <p className="text-sm text-muted-foreground mt-1">
        {n.org} · 출처 {srcName(n)}{n.via ? ` (${n.via})` : ""}
        {n.start || n.end ? ` · 접수 ${fmt(n.start) || "?"} ~ ${fmt(n.end) || "?"}` : n.posted ? ` · 게시 ${fmt(n.posted)}` : ""}
      </p>
      {n.event && (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-[#eef4f9] text-[#24577d] px-3 py-2 text-sm">
          <MapPin size={15} className="shrink-0" /><b>{n.event.name}</b> · {fmt(n.event.start)}–{fmt(n.event.end)} · {n.event.place || ""}
        </p>
      )}
      {n.summary && <p className="text-sm text-ink-2 mt-3 leading-relaxed">{n.summary}</p>}
      {n.caution && <p className="flex gap-1.5 text-sm text-amber-700 mt-2"><AlertTriangle size={15} className="shrink-0 mt-0.5" />{n.caution}</p>}
      {why && why.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">{why.map((w) => <Badge key={w} tone="teal"><Check size={12} strokeWidth={3} />{w}</Badge>)}</div>
      )}
      <div className="flex flex-wrap gap-2 mt-4">
        <Button as="a" size="sm" variant="primary" href={n.url} target="_blank" rel="noopener" icon={ExternalLink}>공고 원문 보기</Button>
        {(n.end || (n.event && n.event.start)) && <Button size="sm" icon={CalendarPlus} onClick={() => onIcs(n)}>내 캘린더에 추가</Button>}
        <Button size="sm" variant="soft" icon={Sparkles} onClick={() => onAi(n)}>AI로 신청 준비</Button>
      </div>
    </article>
  );
}

function Calendar({ calM, setCalM, onlyRec, setOnlyRec, recIds, onPick }) {
  const [y, m] = calM.split("-").map(Number);
  const first = new Date(y, m - 1, 1), start = new Date(y, m - 1, 1 - first.getDay());
  const evs = {};
  data.items.filter((n) => !onlyRec || recIds.has(n.id)).forEach((n) => NLIB.events(n).forEach((e) => (evs[e.d] = evs[e.d] || []).push({ n, e })));
  const move = (k) => { const d = new Date(y, m - 1 + k, 1); setCalM(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); };
  const cells = Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  return (
    <Card className="p-3! sm:p-5!">
      <div className="flex items-center justify-between gap-3 mb-3">
        <Button size="sm" icon={ChevronLeft} onClick={() => move(-1)}>이전</Button>
        <h3 className="text-lg sm:text-xl font-semibold tabular-nums">{y}년 {m}월</h3>
        <Button size="sm" onClick={() => move(1)}>다음 <ChevronRight size={15} /></Button>
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold text-ink-2 mb-3 cursor-pointer">
        <input type="checkbox" className="size-4 accent-brand-600" checked={onlyRec} onChange={(e) => setOnlyRec(e.target.checked)} /> 추천 공고만 보기
      </label>
      <div className="grid grid-cols-7 rounded-lg border border-line overflow-hidden text-xs">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => <div key={d} className="bg-surface text-center font-semibold text-muted-foreground py-2 border-b border-line">{d}</div>)}
        {cells.map((d, i) => {
          const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          const out = d.getMonth() !== m - 1;
          return (
            <div key={i} className={cx("min-h-16 sm:min-h-24 p-1 border-b border-r border-line [&:nth-child(7n)]:border-r-0", out && "bg-surface/60")}>
              <span className={cx("inline-grid place-items-center min-w-6 h-6 px-1 rounded-md text-xs font-semibold", ds === NLIB.today ? "bg-brand-600 text-white" : out ? "text-muted-foreground/60" : "text-ink-2")}>{d.getDate()}</span>
              {(evs[ds] || []).map(({ n, e }, k) => (
                <button key={k} type="button" onClick={() => onPick(n)} title={e.label + " · " + n.title}
                  className={cx("block w-full mt-0.5 truncate rounded-md px-1 py-0.5 text-left text-[10.5px] sm:text-[11.5px] font-semibold cursor-pointer hover:brightness-95", EV[e.k])}>
                  {e.label === "접수 마감" ? "마감 " : e.label === "접수 시작" ? "시작 " : ""}{e.k === "event" ? e.label : n.title}
                </button>
              ))}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2 mt-3 text-xs font-semibold">
        {[["start", "접수 시작"], ["end", "접수 마감"], ["event", "전시회·행사"], ["posted", "게시일 (기간은 원문 확인)"]].map(([k, l]) => <span key={k} className={cx("rounded-md px-2 py-0.5", EV[k])}>{l}</span>)}
      </div>
    </Card>
  );
}

function keyDate(n) { const st = NLIB.status(n); return st.k === "soon" ? n.start : n.end || (n.event && n.event.start) || n.posted || ""; }
function Timeline() {
  const list = data.items.filter((n) => NLIB.status(n).k !== "closed").sort((a, b) => keyDate(a).localeCompare(keyDate(b)));
  if (!list.length) return <p className="text-muted-foreground">진행 중이거나 예정된 공고가 없어요.</p>;
  const groups = [];
  list.forEach((n) => { const mon = keyDate(n).slice(0, 7); const g = groups[groups.length - 1]; g && g.mon === mon ? g.items.push(n) : groups.push({ mon, items: [n] }); });
  return (
    <div className="grid gap-6">
      {groups.map(({ mon, items }) => (
        <section key={mon}>
          <h3 className="text-lg font-semibold mb-3">{mon.replace("-", "년 ")}월</h3>
          <ol className="relative border-l-2 border-brand-100 ml-2 grid gap-3">
            {items.map((n) => {
              const st = NLIB.status(n), d = keyDate(n);
              return (
                <li key={n.id} className="relative pl-6">
                  <span className="absolute -left-[7px] top-4 size-3 rounded-full bg-brand-600 ring-4 ring-surface" />
                  <div className="rounded-xl bg-white border border-line p-4 grid sm:grid-cols-[72px_minmax(0,1fr)] gap-3">
                    <div><p className="text-lg font-semibold tabular-nums">{d.slice(5).replace("-", ".")}</p><p className="text-xs text-muted-foreground font-semibold">{st.k === "soon" ? "접수 시작" : n.end ? "접수 마감" : "게시"}</p></div>
                    <div className="min-w-0">
                      <a href={n.url} target="_blank" rel="noopener" className="font-semibold hover:text-brand-700">{n.title}</a>
                      <p className="text-[13px] text-muted-foreground mt-1 flex flex-wrap items-center gap-1.5">{n.org} · <Badge tone={toneOf(st.cls)}>{st.label}</Badge>{n.event ? ` · 전시 ${fmt(n.event.start)}` : ""}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
