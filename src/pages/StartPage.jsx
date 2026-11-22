/* 처음 오는 사람을 위한 사이트 안내: 무엇을 하는 곳인지, 화면별로 무엇을 하는지, 첫 설정 3단계.
   목록은 글자 링크와 한 줄 설명으로 (Siemens Healthineers 온라인 서비스 목록 방식) */
import { Link, useNavigate } from "react-router-dom";
import { PACK } from "@pack";
import { useProfile } from "../lib/profile.js";

export const AREAS = [
  ["/desk", "업무 현황", "병원별 진행 단계와 이번 주 할 일. 담당자와 기한을 함께 봅니다."],
  ["/overview", "거래 요약", "지금 열린 거래의 제품, 조건, 병원 손익, 서류를 한 화면에."],
  ["/price", "수익성", "병원 손익, 파트너 마진, 자금 흐름을 입력값을 바꿔 가며 계산합니다."],
  ["/hospital", "병원 제안", "원장에게 보여 줄 도입 검토서와 질문 답변을 만듭니다."],
  ["/deal", "거래와 서류", "거래조건을 입력하고 견적서, 상업송장, 포장명세서를 점검합니다."],
  ["/evidence", "자료실", "화면의 숫자마다 출처와 기준일. 회사 자료, 공개자료, 내부 설정값을 구분합니다."],
];

const STEPS = [["사용자 정보", "이름과 직함"], ["소속과 역할", "역할에 맞게 홈의 할 일 순서가 바뀝니다"], ["기본값", "시간대, 제안서 언어, 시작 화면, 처음 열 거래"]];

export default function StartPage() {
  const profile = useProfile();
  const nav = useNavigate();
  const h = PACK.hero || {};
  return (
    <div className="bg-white px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
      <div className="mx-auto grid max-w-[1080px] gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <h1 className="text-[32px] font-bold tracking-[-0.03em] sm:text-[38px]">{PACK.brand}</h1>
          <p className="mt-3 max-w-[620px] text-[16px] leading-relaxed text-[#424245]">{(PACK.footer?.lines || [])[0] || h.lead}</p>

          <h2 className="mt-10 border-b border-[var(--line)] pb-2 text-[15px] font-semibold">화면별로 하는 일</h2>
          <dl className="divide-y divide-[var(--line)]">
            {AREAS.map(([to, name, desc]) => (
              <div key={to} className="grid gap-1 py-3.5 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-6">
                <dt><Link to={to} className="text-[15px] font-medium text-primary hover:underline">{name}</Link></dt>
                <dd className="text-[14px] leading-relaxed text-[#424245]">{desc}</dd>
              </div>
            ))}
          </dl>

          {h.image && (
            <div className="mt-10 grid grid-cols-[88px_minmax(0,1fr)] items-center gap-5 border-t border-[var(--line)] pt-6">
              <div className="grid h-[104px] place-items-center rounded-lg bg-[var(--surface-2)] p-2"><img src={h.image} alt={h.imageAlt || ""} className="max-h-full object-contain" /></div>
              <div>
                <p className="text-[13px] text-[#6e6e73]">{PACK.product?.kicker || "취급 제품"}</p>
                <p className="text-[16px] font-semibold">{h.model || PACK.product?.model || ""}</p>
                <p className="mt-0.5 text-[14px] text-[#424245]">{PACK.product?.title}</p>
              </div>
            </div>
          )}
        </div>

        <aside className="self-start lg:sticky lg:top-20" aria-labelledby="first-t">
          <div className="rounded-xl border border-[var(--line-strong)] p-6">
            <h2 id="first-t" className="text-[17px] font-semibold">{profile ? `${profile.name}님, 설정이 되어 있습니다` : "처음 쓰시나요?"}</h2>
            <p className="mt-1 text-[14px] text-[#6e6e73]">{profile ? "설정을 바꾸거나 홈으로 가세요." : "3단계, 1분 정도 걸립니다."}</p>
            {!profile && (
              <ol className="mt-4 space-y-3">
                {STEPS.map(([t, d], i) => (
                  <li key={t} className="grid grid-cols-[24px_minmax(0,1fr)] gap-2 text-[14px]">
                    <span className="grid size-6 place-items-center rounded-full border border-[var(--line-strong)] text-[12px] font-semibold tabular-nums text-[#424245]">{i + 1}</span>
                    <span><span className="font-medium">{t}</span><span className="block text-[13px] text-[#6e6e73]">{d}</span></span>
                  </li>
                ))}
              </ol>
            )}
            <div className="mt-6 grid gap-2">
              <button type="button" onClick={() => nav(profile ? "/" : "/setup")} className="h-11 rounded-lg bg-primary text-[15px] font-semibold text-white hover:brightness-110">{profile ? "홈으로" : "사용자 설정 시작"}</button>
              {profile
                ? <Link to="/settings" className="grid h-11 place-items-center rounded-lg border border-[var(--line-strong)] text-[15px] font-medium hover:bg-[var(--fill-soft)]">내 설정</Link>
                : <Link to="/overview" className="grid h-11 place-items-center rounded-lg border border-[var(--line-strong)] text-[15px] font-medium hover:bg-[var(--fill-soft)]">설정 없이 둘러보기</Link>}
            </div>
          </div>
          <p className="mt-3 px-1 text-[12px] leading-relaxed text-[#86868b]">입력한 이름과 작업 내용은 지금 쓰는 브라우저에만 저장됩니다. 서버로 보내지 않습니다.</p>
        </aside>
      </div>
    </div>
  );
}
