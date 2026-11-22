/* 설정을 마친 사용자의 홈.
   이름 인사와 날짜(Flexport) → 시작 체크리스트(Dub, Hyperline, ClickUp) → 역할별 할 일 건수와 목록(NetSuite, HubSpot)
   → 오른쪽: 지금 열린 거래, 최근 연 화면(Power BI), 화면 바로가기(Siemens) */
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { PACK } from "@pack";
import { useDeal } from "../lib/deal/DealContext.jsx";
import { KIND } from "../components/deal/AppShell.jsx";
import { PAGE_NAMES, ago, nowIn, orgOf, patchProfile, roleOf, useProfile } from "../lib/profile.js";
import { AREAS } from "./StartPage.jsx";
import { cn } from "@/lib/utils";

const CHECK = [
  { path: "/deal", title: "거래조건 확인", desc: "품목, 인도조건, 결제조건, 당사자", time: "3분", required: true },
  { path: "/price", title: "병원 손익 기본값 확인", desc: "회당 수납액, 월 시술 건수, 비용", time: "2분", required: true },
  { path: "/hospital", title: "병원 제안서 만들어 보기", desc: "원장에게 보여 줄 도입 검토서", time: "5분" },
  { path: "/docs", title: "서류 미리보기와 인쇄", desc: "견적서, 상업송장, 포장명세서", time: "2분" },
  { path: "/evidence", title: "숫자 출처 훑어보기", desc: "회사 자료, 공개자료, 내부 설정값", time: "3분" },
];
const KINDS = { quote: ["견적 회신 대기", "/desk"], follow: ["원장, 거래처 질문 회신", "/hospital"], demo: ["시연 일정", "/desk"], doc: ["서류 준비", "/deal"], ship: ["선적, 운송", "/deal"], as: ["장비 점검, A/S", "/desk"] };
const STAGE = { quote: "견적 단계", invoice: "인보이스 작성" };

function Box({ title, right, children, className }) {
  return (
    <section className={cn("min-w-0 rounded-xl border border-[var(--line)] bg-white", className)}>
      <div className="flex items-baseline justify-between gap-3 border-b border-[var(--line)] px-5 py-3">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function Checklist({ p }) {
  const done = CHECK.filter((c) => p.done?.includes(c.path)).length;
  if (!p.checklist || done === CHECK.length) return null;
  return (
    <Box title="시작 체크리스트" right={<span className="flex items-center gap-3 text-[13px] text-[#6e6e73]"><span className="tabular-nums">{done}/{CHECK.length} 완료</span><button type="button" onClick={() => patchProfile({ checklist: false })} className="hover:text-[#1d1d1f] hover:underline">숨기기</button></span>}>
      <ol className="divide-y divide-[var(--line)]">
        {CHECK.map((c) => {
          const ok = p.done?.includes(c.path);
          return (
            <li key={c.path} className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 px-5 py-3">
              <span className={cn("grid size-5 place-items-center rounded-full border", ok ? "border-primary bg-primary text-white" : "border-[var(--line-strong)]")} aria-label={ok ? "확인함" : "아직"}>{ok && <Check className="size-3" />}</span>
              <span className="min-w-0">
                <span className={cn("text-[14px] font-medium", ok && "text-[#6e6e73] line-through decoration-[#c7c7cc]")}>{c.title}</span>
                {c.required && !ok && <span className="ml-2 text-[12px] text-amber-700">필수</span>}
                <span className="block text-[12px] text-[#6e6e73]">{c.desc}, 약 {c.time}</span>
              </span>
              <Link to={c.path} className="inline-flex h-8 items-center rounded-md border border-[var(--line-strong)] px-3 text-[13px] font-medium hover:bg-[var(--fill-soft)]">{ok ? "다시 열기" : "열기"}</Link>
            </li>
          );
        })}
      </ol>
    </Box>
  );
}

function MyWork({ p }) {
  const D = PACK.desk;
  const role = roleOf(p);
  if (!D) return null;
  const mine = (t) => !role || !role.owner || t.owner.includes(role.owner);
  const tasks = [...D.tasks].sort((a, b) => a.sort - b.sort);
  const list = tasks.filter(mine).slice(0, 6);
  const kinds = Object.keys(KINDS).sort((a, b) => (role?.kinds?.includes(b) ? 1 : 0) - (role?.kinds?.includes(a) ? 1 : 0));
  const count = (k) => D.tasks.filter((t) => t.kind === k).length;
  return (
    <>
      <Box title={role?.owner ? `내 할 일, ${role.label}` : "이번 주 할 일"} right={<Link to="/desk" className="text-[13px] font-medium text-primary hover:underline">업무 현황 전체</Link>}>
        {list.length === 0
          ? <p className="px-5 py-6 text-[14px] text-[#6e6e73]">이번 주 {role?.label} 담당 할 일이 없습니다. <Link to="/desk" className="text-primary hover:underline">팀 전체 할 일 보기</Link></p>
          : (
            <table className="w-full text-left text-[14px]">
              <caption className="sr-only">기한 순 할 일</caption>
              <thead className="text-[12px] text-[#86868b]"><tr className="border-b border-[var(--line)]"><th className="w-16 py-2 pl-5 font-normal">기한</th><th className="py-2 font-normal">할 일</th><th className="hidden py-2 pr-5 font-normal sm:table-cell">담당</th></tr></thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t.title} className="border-b border-[var(--line)] last:border-0">
                    <td className="py-2.5 pl-5 align-top font-medium tabular-nums">{t.due}</td>
                    <td className="py-2.5 pr-3 align-top">{t.title}{t.meta && <span className="block text-[12px] text-[#86868b]">{t.meta}</span>}</td>
                    <td className="hidden py-2.5 pr-5 align-top text-[13px] whitespace-nowrap text-[#6e6e73] sm:table-cell">{t.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </Box>
      <Box title="팀 전체 건수">
        <ul className="divide-y divide-[var(--line)]">
          {kinds.map((k) => (
            <li key={k}>
              <Link to={KINDS[k][1]} className="flex items-center justify-between px-5 py-2.5 text-[14px] hover:bg-[var(--fill-soft)]">
                <span className={cn(role?.kinds?.includes(k) ? "font-medium text-[#1d1d1f]" : "text-[#424245]")}>{KINDS[k][0]}</span>
                <span className="tabular-nums font-semibold">{count(k)}</span>
              </Link>
            </li>
          ))}
          <li><Link to="/desk" className="flex items-center justify-between px-5 py-2.5 text-[14px] hover:bg-[var(--fill-soft)]"><span className="text-[#424245]">진행 중 병원</span><span className="tabular-nums font-semibold">{D.hospitals.length}</span></Link></li>
        </ul>
      </Box>
    </>
  );
}

export default function WorkspacePage() {
  const p = useProfile();
  const { deal } = useDeal();
  if (!p) return null;
  const { date, time } = nowIn(p.tz);
  const org = orgOf(p);
  const role = roleOf(p);
  const tzName = { "Asia/Jakarta": "자카르타", "Asia/Seoul": "서울", "Asia/Makassar": "마카사르" }[p.tz] || p.tz;
  return (
    <div className="bg-[var(--surface-2)] px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-wrap items-end justify-between gap-3 pb-6">
          <div>
            <p className="text-[13px] text-[#6e6e73]">{date}, {tzName} {time}</p>
            <h1 className="mt-0.5 text-[26px] font-bold tracking-[-0.02em] sm:text-[30px]">{p.name}님, 안녕하세요</h1>
            <p className="mt-0.5 text-[14px] text-[#6e6e73]">{[org?.label, role?.label, p.title].filter(Boolean).join(", ") || "소속과 역할을 아직 정하지 않았습니다"} <Link to="/settings" className="ml-1 text-primary hover:underline">바꾸기</Link></p>
          </div>
          {PACK.desk?.asOf && <p className="text-[13px] text-[#6e6e73]">업무 현황 {PACK.desk.asOf}</p>}
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid min-w-0 content-start gap-5">
            <Checklist p={p} />
            <MyWork p={p} />
          </div>

          <div className="grid min-w-0 content-start gap-5">
            <Box title="지금 열린 거래">
              <div className="px-5 py-4">
                <p className="text-[15px] font-semibold leading-snug">{deal.meta.name || "이름 없는 거래"}</p>
                <dl className="mt-3 grid grid-cols-[72px_minmax(0,1fr)] gap-y-1.5 text-[13px]">
                  <dt className="text-[#6e6e73]">구분</dt><dd className={deal.kind === "mock" ? "text-amber-700" : ""}>{KIND[deal.kind]}</dd>
                  {deal.meta.no && (<><dt className="text-[#6e6e73]">거래번호</dt><dd className="tabular-nums">{deal.meta.no}</dd></>)}
                  <dt className="text-[#6e6e73]">단계</dt><dd>{STAGE[deal.meta.stage] || deal.meta.stage || "—"}</dd>
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to="/overview" className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-[13px] font-medium text-white hover:brightness-110">거래 요약</Link>
                  <Link to="/deal" className="inline-flex h-8 items-center rounded-md border border-[var(--line-strong)] px-3 text-[13px] font-medium hover:bg-[var(--fill-soft)]">거래조건 입력</Link>
                </div>
              </div>
            </Box>

            <Box title="최근 연 화면">
              {p.recent?.length
                ? <ul className="divide-y divide-[var(--line)]">{p.recent.map((r) => <li key={r.path}><Link to={r.path} className="flex items-center justify-between px-5 py-2.5 text-[14px] hover:bg-[var(--fill-soft)]"><span>{PAGE_NAMES[r.path]}</span><span className="text-[12px] text-[#86868b]">{ago(r.at)}</span></Link></li>)}</ul>
                : <p className="px-5 py-4 text-[14px] text-[#6e6e73]">아직 연 화면이 없습니다. 열어 본 화면이 여기에 쌓입니다.</p>}
            </Box>

            <Box title="화면 바로가기">
              <ul className="divide-y divide-[var(--line)]">
                {AREAS.map(([to, name, desc]) => (
                  <li key={to} className="px-5 py-2.5"><Link to={to} className="text-[14px] font-medium text-primary hover:underline">{name}</Link><span className="block text-[12px] leading-snug text-[#6e6e73]">{desc}</span></li>
                ))}
              </ul>
            </Box>
          </div>
        </div>
        {PACK.desk?.note && <p className="mt-4 text-[12px] text-[#86868b]">{PACK.desk.note}</p>}
      </div>
    </div>
  );
}
