/* 할 일 세부와 병원 세부.
   맨 위 상태 줄(Zendesk 티켓 항목: 상태, 우선순위, 담당, 기한) → 왼쪽 본문(요약, 배경, 순서, 진행 기록)
   → 오른쪽(다음 단계와 기한, 막힌 점, 상대방, 관련 서류, 참고 자료). HubSpot 레코드, Pipedrive 거래 상세 방식 */
import { useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Check, ExternalLink } from "lucide-react";
import { PACK } from "@pack";
import { cn } from "@/lib/utils";

const KIND = { quote: "견적", follow: "질문 회신", demo: "시연", doc: "서류", ship: "선적, 운송", as: "장비 점검, A/S" };
const STEP_KEY = "mdk:steps";
const readSteps = () => { try { return JSON.parse(window.localStorage.getItem(STEP_KEY) || "{}"); } catch { return {}; } };
const writeSteps = (v) => { try { window.localStorage.setItem(STEP_KEY, JSON.stringify(v)); } catch { /* 저장 못 해도 화면은 계속 */ } };

export const taskPath = (t) => `/desk/t/${t.id}`;
export const hospitalPath = (h) => `/desk/h/${h.id}`;

function Side({ title, children }) {
  return (
    <section className="rounded-xl border border-[var(--line)] bg-white">
      <h2 className="border-b border-[var(--line)] px-5 py-3 text-[14px] font-semibold">{title}</h2>
      <div className="px-5 py-4 text-[14px]">{children}</div>
    </section>
  );
}

function H2({ children }) {
  return <h2 className="border-b border-[var(--line)] pb-2 text-[16px] font-semibold">{children}</h2>;
}

function Log({ rows }) {
  return (
    <ol className="mt-3">
      {rows.map(([at, who, text], i) => (
        <li key={i} className="grid grid-cols-[56px_14px_minmax(0,1fr)] gap-2">
          <span className="pt-0.5 text-[13px] tabular-nums text-[#6e6e73]">{at}</span>
          <span className="relative flex justify-center"><span className="mt-1.5 size-2 rounded-full bg-[#86868b]" />{i < rows.length - 1 && <span className="absolute top-4 bottom-0 w-px bg-[var(--line-strong)]" />}</span>
          <span className="pb-4 text-[14px] leading-relaxed"><span className="font-medium">{who}</span><span className="text-[#424245]">, {text}</span></span>
        </li>
      ))}
    </ol>
  );
}

function Contacts({ list }) {
  return (
    <ul className="grid gap-3">
      {list.map((c) => (
        <li key={c.name}><p className="font-medium">{c.name}</p><p className="text-[13px] text-[#424245]">{c.role}</p><p className="text-[12px] text-[#6e6e73]">{c.channel}</p></li>
      ))}
    </ul>
  );
}

export function TaskDetailPage() {
  const { id } = useParams();
  const D = PACK.desk;
  const t = D?.tasks.find((x) => x.id === id);
  const [steps, setSteps] = useState(readSteps);
  if (!t || !t.detail) return <Navigate to="/desk" replace />;
  const d = t.detail;
  const h = D.hospitals.find((x) => x.id === t.hospital);
  const done = (i) => (steps[t.id]?.[i] ?? d.steps[i][1]);
  const toggle = (i) => { const next = { ...steps, [t.id]: { ...(steps[t.id] || {}), [i]: !done(i) } }; setSteps(next); writeSteps(next); };
  const doneCount = d.steps.filter((_, i) => done(i)).length;
  const log = h?.detail?.log || [];
  const others = D.tasks.filter((x) => x.id !== t.id && x.hospital && x.hospital === t.hospital);

  return (
    <div className="bg-[var(--surface-2)] px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      <div className="mx-auto max-w-[1120px]">
        <p className="text-[13px] text-[#6e6e73]"><Link to="/desk" className="hover:underline">업무 현황</Link> / 할 일 / {KIND[t.kind]}</p>
        <h1 className="mt-1 text-[26px] font-bold tracking-[-0.02em] sm:text-[30px]">{t.title}</h1>
        <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-5">
          {[["상태", d.status], ["우선순위", d.priority], ["담당", t.owner], ["기한", d.next?.[1] || t.due], ["등록", d.opened]].map(([k, v]) => (
            <div key={k} className="bg-white px-4 py-3"><dt className="text-[12px] text-[#6e6e73]">{k}</dt><dd className={cn("mt-0.5 text-[14px] font-medium", k === "우선순위" && v === "높음" && "text-amber-700")}>{v}</dd></div>
          ))}
        </dl>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid min-w-0 content-start gap-8 rounded-xl border border-[var(--line)] bg-white p-5 sm:p-7">
            <section>
              <H2>무슨 일인가요</H2>
              <p className="mt-3 text-[15px] leading-relaxed">{d.summary}</p>
              <dl className="mt-4 grid gap-x-6 gap-y-2 text-[14px] sm:grid-cols-[120px_minmax(0,1fr)]">
                {d.facts.map(([k, v]) => <div key={k} className="contents"><dt className="text-[#6e6e73]">{k}</dt><dd>{v}</dd></div>)}
              </dl>
            </section>

            <section>
              <H2>알아 둘 배경</H2>
              <ul className="mt-3 grid gap-2.5 text-[14px] leading-relaxed text-[#424245]">
                {d.background.map((b, i) => <li key={i} className="grid grid-cols-[12px_minmax(0,1fr)]"><span className="mt-2 size-1 rounded-full bg-[#86868b]" />{b}</li>)}
              </ul>
            </section>

            <section>
              <div className="flex items-baseline justify-between border-b border-[var(--line)] pb-2"><h2 className="text-[16px] font-semibold">처리 순서</h2><span className="text-[13px] tabular-nums text-[#6e6e73]">{doneCount}/{d.steps.length} 완료</span></div>
              <ol className="mt-2 divide-y divide-[var(--line)]">
                {d.steps.map(([text], i) => (
                  <li key={i}>
                    <label className="flex cursor-pointer items-start gap-3 py-2.5 text-[14px]">
                      <input type="checkbox" checked={done(i)} onChange={() => toggle(i)} className="sr-only" />
                      <span aria-hidden="true" className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded border", done(i) ? "border-primary bg-primary text-white" : "border-[var(--line-strong)] bg-white")}>{done(i) && <Check className="size-3.5" />}</span>
                      <span className={cn(done(i) && "text-[#6e6e73] line-through decoration-[#c7c7cc]")}>{i + 1}. {text}</span>
                    </label>
                  </li>
                ))}
              </ol>
              <p className="mt-1 text-[12px] text-[#86868b]">체크한 내용은 이 브라우저에만 저장됩니다.</p>
            </section>

            {log.length > 0 && (
              <section>
                <H2>진행 기록{h ? `, ${h.name}` : ""}</H2>
                <Log rows={log} />
              </section>
            )}
          </div>

          <aside className="grid min-w-0 content-start gap-4">
            <Side title="다음 단계">
              <p className="font-medium">{d.next[0]}</p>
              <p className="mt-0.5 text-[13px] tabular-nums text-[#6e6e73]">기한 {d.next[1]}</p>
              {d.blockers.length > 0 && (
                <div className="mt-4 border-t border-[var(--line)] pt-3">
                  <p className="text-[13px] font-medium text-amber-800">막힌 점</p>
                  <ul className="mt-1 grid gap-1.5 text-[13px] leading-relaxed text-[#424245]">{d.blockers.map((b) => <li key={b}>{b}</li>)}</ul>
                </div>
              )}
            </Side>

            {h && (
              <Side title="관련 병원">
                <Link to={hospitalPath(h)} className="font-medium text-primary hover:underline">{h.name}</Link>
                <p className="text-[13px] text-[#6e6e73]">{h.city}, {h.stage} 단계</p>
                <div className="mt-3 border-t border-[var(--line)] pt-3"><Contacts list={h.detail.contact} /></div>
              </Side>
            )}

            <Side title="관련 서류">
              <ul className="grid gap-2">
                {d.docs.map(([name, state, to]) => (
                  <li key={name} className="flex items-baseline justify-between gap-3">
                    {to ? <Link to={to} className="text-primary hover:underline">{name}</Link> : <span>{name}</span>}
                    <span className="shrink-0 text-[12px] text-[#6e6e73]">{state}</span>
                  </li>
                ))}
              </ul>
            </Side>

            {others.length > 0 && (
              <Side title="같은 병원의 다른 할 일">
                <ul className="grid gap-2">{others.map((o) => <li key={o.id} className="flex justify-between gap-3"><Link to={taskPath(o)} className="text-primary hover:underline">{o.title}</Link><span className="shrink-0 text-[12px] tabular-nums text-[#6e6e73]">{o.due}</span></li>)}</ul>
              </Side>
            )}

            <Side title="참고한 실무 자료">
              <ul className="grid gap-2 text-[13px] leading-snug">
                {d.refs.map((r) => <li key={r.url}><a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1 text-[#424245] hover:text-primary hover:underline">{r.label}<ExternalLink className="mt-0.5 size-3 shrink-0" aria-hidden="true" /></a></li>)}
              </ul>
            </Side>
          </aside>
        </div>
        {D.note && <p className="mt-4 text-[12px] text-[#86868b]">{D.note} 절차와 규정 설명은 참고한 실무 자료를 따릅니다.</p>}
      </div>
    </div>
  );
}

export function HospitalDetailPage() {
  const { id } = useParams();
  const D = PACK.desk;
  const h = D?.hospitals.find((x) => x.id === id);
  if (!h || !h.detail) return <Navigate to="/desk" replace />;
  const d = h.detail;
  const tasks = D.tasks.filter((t) => t.hospital === h.id);
  const si = D.stages.indexOf(h.stage);
  return (
    <div className="bg-[var(--surface-2)] px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      <div className="mx-auto max-w-[1120px]">
        <p className="text-[13px] text-[#6e6e73]"><Link to="/desk" className="hover:underline">업무 현황</Link> / 병원</p>
        <h1 className="mt-1 text-[26px] font-bold tracking-[-0.02em] sm:text-[30px]">{h.name}</h1>
        <p className="mt-0.5 text-[14px] text-[#6e6e73]">{h.city}, {d.type}. 담당 {h.owner}</p>

        <ol className="mt-5 grid grid-cols-5 overflow-hidden rounded-xl border border-[var(--line)] bg-white text-[13px]" aria-label="진행 단계">
          {D.stages.map((s, i) => (
            <li key={s} aria-current={i === si ? "step" : undefined} className={cn("border-r border-[var(--line)] px-3 py-3 last:border-r-0", i === si ? "bg-primary font-semibold text-white" : i < si ? "text-[#1d1d1f]" : "text-[#86868b]")}>
              <span className="block text-[11px] tabular-nums opacity-80">{i + 1}단계</span>{s}
            </li>
          ))}
        </ol>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid min-w-0 content-start gap-8 rounded-xl border border-[var(--line)] bg-white p-5 sm:p-7">
            <section>
              <H2>병원 상황</H2>
              <p className="mt-3 text-[15px] leading-relaxed">{d.why}</p>
              <dl className="mt-4 grid gap-x-6 gap-y-2 text-[14px] sm:grid-cols-[120px_minmax(0,1fr)]">
                <dt className="text-[#6e6e73]">구분</dt><dd>{d.type}</dd>
                <dt className="text-[#6e6e73]">규모</dt><dd>{d.beds}</dd>
                <dt className="text-[#6e6e73]">다음 할 일</dt><dd>{h.next}, 기한 {h.due}</dd>
              </dl>
            </section>
            <section>
              <H2>할 일</H2>
              {tasks.length ? (
                <ul className="mt-1 divide-y divide-[var(--line)]">
                  {tasks.map((t) => <li key={t.id}><Link to={taskPath(t)} className="flex items-baseline justify-between gap-3 py-2.5 text-[14px] hover:bg-[var(--fill-soft)]"><span><span className="font-medium text-primary">{t.title}</span><span className="block text-[12px] text-[#6e6e73]">{KIND[t.kind]}, {t.owner}, {t.detail?.status}</span></span><span className="shrink-0 tabular-nums">{t.due}</span></Link></li>)}
                </ul>
              ) : <p className="mt-3 text-[14px] text-[#6e6e73]">이번 주 등록된 할 일이 없습니다.</p>}
            </section>
            <section>
              <H2>진행 기록</H2>
              <Log rows={d.log} />
            </section>
          </div>
          <aside className="grid min-w-0 content-start gap-4">
            <Side title="연락처"><Contacts list={d.contact} /></Side>
            <Side title="이 병원에 쓸 화면">
              <ul className="grid gap-2">
                <li><Link to="/hospital" className="text-primary hover:underline">병원 도입 검토서 만들기</Link></li>
                <li><Link to="/price" className="text-primary hover:underline">수익성 계산</Link></li>
                <li><Link to="/docs" className="text-primary hover:underline">견적서와 서류 미리보기</Link></li>
              </ul>
            </Side>
          </aside>
        </div>
        {D.note && <p className="mt-4 text-[12px] text-[#86868b]">{D.note}</p>}
      </div>
    </div>
  );
}
