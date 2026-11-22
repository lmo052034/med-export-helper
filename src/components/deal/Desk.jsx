/* 업무 현황판: 병원 단계별 현황, 회신 대기 견적, 서류와 선적 할 일, 시연과 A/S 요청.
   데이터는 콘텐츠 팩(PACK.desk)에서 가져옵니다 */
import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, FileText, Mail, Plane, Presentation, Wrench, PhoneCall } from "lucide-react";
import { PACK } from "@pack";
import { cn } from "@/lib/utils";

const KINDS = {
  quote: { label: "견적", icon: Mail, to: "/price" },
  follow: { label: "회신", icon: PhoneCall, to: "/hospital" },
  demo: { label: "시연", icon: Presentation, to: "/hospital" },
  doc: { label: "서류", icon: FileText, to: "/deal" },
  ship: { label: "선적", icon: Plane, to: "/deal" },
  as: { label: "A/S", icon: Wrench, to: "/hospital" },
};

export default function Desk() {
  const D = PACK.desk;
  if (!D) return null;
  const stages = D.stages || [];
  const counts = stages.map((s) => D.hospitals.filter((h) => h.stage === s).length);
  const max = Math.max(1, ...counts);
  const by = (k) => D.tasks.filter((t) => t.kind === k).length;
  const kpis = [
    ["회신 대기 견적", by("quote") + by("follow"), "/price"],
    ["이번 주 시연", by("demo"), "/hospital"],
    ["서류, 선적 할 일", by("doc") + by("ship"), "/deal"],
    ["A/S 요청", by("as"), "/hospital"],
  ];
  return (
    <section aria-labelledby="desk-t" className="bg-[var(--surface-2)] px-4 pt-10 pb-16 sm:px-6 sm:pt-14">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold text-primary">{D.team}</p>
            <h1 id="desk-t" className="mt-1 text-[32px] font-bold tracking-[-0.03em] sm:text-[40px]">{D.title || "업무 현황"}</h1>
          </div>
          <p className="flex items-center gap-1.5 text-[13px] text-[#6e6e73]"><CalendarClock className="size-4" aria-hidden="true" />{D.asOf}</p>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-[var(--line)] lg:grid-cols-4">
          {kpis.map(([k, v, to]) => (
            <Link key={k} to={to} className="group bg-white px-5 py-4 hover:bg-[var(--fill-soft)]">
              <dt className="text-[13px] text-[#6e6e73]">{k}</dt>
              <dd className="mt-1 flex items-baseline justify-between text-[28px] font-semibold tabular-nums tracking-tight">{v}<ArrowRight className="size-4 text-[#86868b] opacity-0 transition group-hover:opacity-100" aria-hidden="true" /></dd>
            </Link>
          ))}
        </dl>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <div className="rounded-2xl bg-white p-5 sm:p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[18px] font-semibold tracking-tight">병원 파이프라인</h2>
              <span className="text-[12px] text-[#86868b]">{D.hospitals.length}곳 진행</span>
            </div>
            <ol className="mt-4 grid grid-cols-5 gap-2" aria-label="단계별 병원 수">
              {stages.map((s, i) => (
                <li key={s} className="flex flex-col">
                  <div className="flex h-16 items-end rounded-lg bg-[var(--fill-soft)] p-1">
                    <div className={cn("w-full rounded-md", counts[i] ? "bg-primary" : "bg-transparent")} style={{ height: `${(counts[i] / max) * 100}%`, opacity: 0.35 + 0.65 * ((i + 1) / stages.length) }} />
                  </div>
                  <span className="mt-1.5 text-[20px] font-semibold tabular-nums leading-none">{counts[i]}</span>
                  <span className="mt-1 text-[12px] leading-tight text-[#6e6e73]">{s}</span>
                </li>
              ))}
            </ol>
            <div className="mt-6 -mx-5 overflow-x-auto sm:-mx-6">
              <table className="w-full min-w-[620px] text-left text-[13px]">
                <thead className="text-[12px] text-[#86868b]">
                  <tr className="border-b border-[var(--line)]">
                    <th className="py-2 pl-5 font-normal sm:pl-6">병원</th><th className="py-2 font-normal">단계</th><th className="py-2 font-normal">담당</th><th className="py-2 font-normal">다음 할 일</th><th className="py-2 pr-5 text-right font-normal sm:pr-6">기한</th>
                  </tr>
                </thead>
                <tbody>
                  {D.hospitals.map((h) => (
                    <tr key={h.name} className="border-b border-[var(--line)] last:border-0">
                      <td className="py-2.5 pl-5 sm:pl-6"><span className="font-medium text-[#1d1d1f]">{h.name}</span><span className="block text-[12px] text-[#86868b]">{h.city}</span></td>
                      <td className="py-2.5"><span className="rounded-full bg-[var(--fill-soft)] px-2 py-0.5 text-[12px] whitespace-nowrap">{h.stage}</span></td>
                      <td className="py-2.5 whitespace-nowrap text-[#424245]">{h.owner}</td>
                      <td className="py-2.5 text-[#424245]">{h.next}</td>
                      <td className="py-2.5 pr-5 text-right tabular-nums whitespace-nowrap sm:pr-6">{h.due}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 sm:p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[18px] font-semibold tracking-tight">이번 주 할 일</h2>
              <span className="text-[12px] text-[#86868b]">기한 순</span>
            </div>
            <ul className="mt-3 divide-y divide-[var(--line)]">
              {[...D.tasks].sort((a, b) => a.sort - b.sort).map((t) => {
                const K = KINDS[t.kind] || KINDS.doc;
                const I = K.icon;
                return (
                  <li key={t.title}>
                    <Link to={K.to} className="flex gap-3 py-3 hover:bg-[var(--fill-soft)] -mx-2 px-2 rounded-lg">
                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-[var(--fill-soft)] text-primary"><I className="size-4" aria-hidden="true" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-medium leading-snug text-[#1d1d1f]">{t.title}</span>
                        <span className="mt-0.5 block text-[12px] text-[#6e6e73]">{K.label}, {t.owner}{t.meta ? `, ${t.meta}` : ""}</span>
                      </span>
                      <span className="shrink-0 text-[13px] font-medium tabular-nums text-[#424245]">{t.due}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        {D.note && <p className="mt-4 text-[12px] text-[#86868b]">{D.note}</p>}
      </div>
    </section>
  );
}
