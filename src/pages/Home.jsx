import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ExternalLink } from "lucide-react";
import { STEPS, REGIONS, SAMPLE_PROFILE, profile, setProfile, load } from "../lib/store.js";
import { NLIB } from "../lib/notices.js";
import { Badge, Button, Field, Input, Select, toneOf } from "../components/ui.jsx";
import { useApp } from "../components/shell.jsx";

/* apple.com 제품 페이지 구성: 흰 히어로 → 숫자 하이라이트 → 회색 바탕 타일 → 흰 바탕 입력 */
const Wrap = ({ className = "", children }) => <div className={"mx-auto w-full max-w-[1024px] px-5 sm:px-6 " + className}>{children}</div>;
const More = ({ to, children }) => (
  <Link to={to} className="group inline-flex items-center gap-0.5 text-[17px] text-primary hover:underline underline-offset-4">
    {children}
    <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.2} />
  </Link>
);

export default function Home() {
  const { toast } = useApp();
  const [P, setP] = useState(profile);
  const [saved, setSaved] = useState(P);
  const set = (k) => (e) => setP({ ...P, [k]: e.target.value });

  const goal = load("goal", null) || NLIB.defaultGoal(saved);
  const recs = useMemo(() => NLIB.recommend(goal).slice(0, 3), [saved]); // eslint-disable-line

  return (
    <>
      {/* 히어로 */}
      <section className="bg-white">
        <Wrap className="pt-16 pb-14 sm:pt-24 sm:pb-20 text-center">
          <p className="text-[17px] sm:text-[21px] font-semibold text-primary">의료기기 수출 도우미</p>
          <h1 className="mt-3 text-[40px] leading-[1.1] sm:text-[64px] sm:leading-[1.0625] font-semibold tracking-[-0.015em] text-[#1d1d1f]">
            처음 하는 수출,<br />8단계면 충분해요.
          </h1>
          <p className="mx-auto mt-5 max-w-[640px] text-[19px] sm:text-[24px] leading-[1.35] font-medium text-[#6e6e73]">
            무엇부터 할지, 어떤 지원사업을 신청할지, 바이어에게 무엇을 보낼지. 순서대로 따라오기만 하세요.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            <Button as={Link} to="/readiness" variant="primary" size="lg">준비 진단 시작하기</Button>
            <More to="/programs">지원사업 공고 보기</More>
          </div>
          <p className="mt-6 text-[12px] text-[#86868b]">가입·설치 없이 무료 · 2025 KOTRA AI 활용 우수사례집 구성을 따름</p>
        </Wrap>
      </section>

      {/* 하이라이트 숫자 */}
      <section className="bg-white border-t border-black/[0.06]">
        <Wrap className="py-12 sm:py-16">
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-y-10 text-center">
            {[
              ["8단계", "KOTRA 사례집 순서 그대로"],
              [NLIB.data.items.length + "건", "매일 아침 모으는 공고"],
              ["52개", "수출 준비 점검 기준"],
              ["0원", "가입·설치 없이 무료"],
            ].map(([v, d]) => (
              <div key={d}>
                <dt className="text-[40px] sm:text-[48px] leading-none font-semibold tracking-[-0.015em] tabular-nums text-[#1d1d1f]">{v}</dt>
                <dd className="mt-3 text-[14px] text-[#6e6e73]">{d}</dd>
              </div>
            ))}
          </dl>
        </Wrap>
      </section>

      {/* 8단계 타일 */}
      <section className="bg-[#f5f5f7]">
        <Wrap className="py-16 sm:py-24">
          <h2 className="text-[32px] leading-[1.125] sm:text-[48px] sm:leading-[1.08] font-semibold tracking-[-0.01em] text-[#1d1d1f]">이 순서대로 하세요.</h2>
          <p className="mt-3 text-[17px] sm:text-[21px] text-[#6e6e73]">한 단계씩, 해야 할 일과 만들 문서를 알려 드려요.</p>
          <ol className="mt-10 grid sm:grid-cols-2 gap-4 sm:gap-5">
            {STEPS.map((s) => (
              <li key={s.path}>
                <Link to={s.path} className="group flex h-full flex-col rounded-[28px] bg-white p-7 sm:p-9 transition-transform duration-300 ease-out hover:scale-[1.012]">
                  <span className="text-[14px] font-semibold tabular-nums text-primary">STEP {s.n}</span>
                  <h3 className="mt-2 text-[24px] sm:text-[28px] leading-tight font-semibold tracking-[-0.01em] text-[#1d1d1f]">{s.name}</h3>
                  <p className="mt-3 text-[17px] leading-[1.47] text-[#6e6e73] flex-1">{s.what}</p>
                  <span className="mt-6 inline-flex items-center gap-0.5 text-[17px] text-primary">
                    시작하기 <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.2} />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </Wrap>
      </section>

      {/* 회사 정보 + 맞는 공고 */}
      <section className="bg-white">
        <Wrap className="py-16 sm:py-24">
          <h2 className="text-[32px] leading-[1.125] sm:text-[48px] sm:leading-[1.08] font-semibold tracking-[-0.01em] text-[#1d1d1f]">우리 회사부터 알려 주세요.</h2>
          <p className="mt-3 text-[17px] sm:text-[21px] text-[#6e6e73]">한 번 적으면 모든 단계에서 함께 써요. 내용은 이 브라우저에만 저장돼요.</p>

          <div className="mt-10 grid lg:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
            <div className="rounded-[28px] bg-[#f5f5f7] p-6 sm:p-9">
              {P.sample && <Badge tone="amber" className="mb-5">가상 예시가 들어 있어요</Badge>}
              <div className="grid sm:grid-cols-2 gap-x-4">
                <Field label="회사 이름"><Input value={P.company || ""} onChange={set("company")} className="bg-white" /></Field>
                <Field label="회사 이름 (영문)"><Input value={P.companyEn || ""} onChange={set("companyEn")} className="bg-white" /></Field>
                <Field label="수출할 제품"><Input value={P.product || ""} onChange={set("product")} placeholder="예: 저주파 전기자극 치료기" className="bg-white" /></Field>
                <Field label="제품 이름 (영문)"><Input value={P.productEn || ""} onChange={set("productEn")} className="bg-white" /></Field>
                <Field label="HS 코드 6자리" hint="모르면 비워 두세요"><Input value={P.hs || ""} onChange={set("hs")} placeholder="예: 9018.90" className="bg-white" /></Field>
                <Field label="의료기기 등급">
                  <Select value={P.grade || ""} onChange={set("grade")} className="bg-white" options={[["", "모름"], ["1", "1등급"], ["2", "2등급"], ["3", "3등급"], ["4", "4등급"]]} />
                </Field>
                <Field label="본사 지역" hint="지역 한정 공고 거르기"><Select value={P.region || "서울"} onChange={set("region")} className="bg-white" options={REGIONS} /></Field>
                <Field label="수출 경험"><Select value={P.exp || "none"} onChange={set("exp")} className="bg-white" options={[["none", "처음이에요"], ["some", "조금 있어요"]]} /></Field>
                <Field label="관심 있는 나라" hint="쉼표로 구분, 2–3곳" className="sm:col-span-2"><Input value={P.countries || ""} onChange={set("countries")} placeholder="예: 인도네시아, 일본, 홍콩" className="bg-white" /></Field>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Button variant="primary" onClick={() => { const p = { ...P }; delete p.sample; setP(p); setProfile(p); setSaved(p); toast("저장했어요. 이제 준비 진단부터 시작하세요"); }}>저장</Button>
                <button type="button" className="text-[15px] text-primary hover:underline underline-offset-4" onClick={() => { setP({ region: "서울", exp: "none" }); toast("칸을 비웠어요. 다 쓰고 저장을 누르세요"); }}>비우고 새로 쓰기</button>
                <button type="button" className="text-[15px] text-primary hover:underline underline-offset-4" onClick={() => { setP({ ...SAMPLE_PROFILE }); setProfile({ ...SAMPLE_PROFILE }); setSaved({ ...SAMPLE_PROFILE }); }}>가상 예시 다시 넣기</button>
              </div>
            </div>

            <aside className="rounded-[28px] bg-[#f5f5f7] p-6 sm:p-8">
              <p className="text-[14px] font-semibold text-primary">우리 회사에 맞는 공고</p>
              <p className="mt-1 text-[13px] text-[#86868b]">{goal.region} 기업 · {goal.areas.join(", ") || "전체 지역"}</p>
              {recs.length ? (
                <ul className="mt-4 divide-y divide-black/[0.08]">
                  {recs.map(({ n, st }) => (
                    <li key={n.id} className="py-4">
                      <Badge tone={toneOf(st.cls)}>{st.label}</Badge>
                      <a href={n.url} target="_blank" rel="noopener" className="mt-2 flex gap-1 text-[17px] leading-snug font-semibold text-[#1d1d1f] hover:text-primary">
                        {n.title}
                        <ExternalLink size={13} className="shrink-0 mt-1.5 text-[#86868b]" />
                      </a>
                      <p className="mt-1 text-[13px] text-[#6e6e73]">{n.org}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-[15px] text-[#6e6e73]">지금 맞는 공고가 없어요. 목표를 넓혀 보세요.</p>
              )}
              <div className="mt-2"><More to="/programs">전체 공고 보기</More></div>
            </aside>
          </div>
        </Wrap>
      </section>

      {/* 약속 */}
      <section className="bg-[#f5f5f7]">
        <Wrap className="py-16 sm:py-24 text-center">
          <h2 className="text-[32px] leading-[1.125] sm:text-[48px] sm:leading-[1.08] font-semibold tracking-[-0.01em] text-[#1d1d1f]">AI는 돕고, 확인은 사람이.</h2>
          <div className="mt-10 grid sm:grid-cols-3 gap-8 text-left sm:text-center">
            {[
              ["찾고 정리하는 건 AI", "AI가 찾고, 정리하고, 초안을 써요. 숫자·세율·인증은 사람이 공식자료로 확인해요."],
              ["출처는 항상 함께", "답마다 출처를 붙이고, 확인한 내용은 기록으로 남겨요."],
              ["신청은 원문에서", "공고는 원문 링크로 연결해요. 신청 전에 꼭 원문을 읽으세요."],
            ].map(([t, d]) => (
              <div key={t}>
                <h3 className="text-[21px] font-semibold text-[#1d1d1f]">{t}</h3>
                <p className="mt-2 text-[17px] leading-[1.47] text-[#6e6e73]">{d}</p>
              </div>
            ))}
          </div>
        </Wrap>
      </section>
    </>
  );
}
