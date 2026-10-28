import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, CalendarDays, ShieldCheck, Sparkles, ExternalLink, ListChecks } from "lucide-react";
import { STEPS, REGIONS, SAMPLE_PROFILE, profile, setProfile, load } from "../lib/store.js";
import { NLIB } from "../lib/notices.js";
import { Badge, Button, Card, CardHeader, Field, Input, Select, toneOf } from "../components/ui.jsx";
import { useApp } from "../components/shell.jsx";

export default function Home() {
  const { toast } = useApp();
  const [P, setP] = useState(profile);
  const [saved, setSaved] = useState(P);
  const set = (k) => (e) => setP({ ...P, [k]: e.target.value });

  const goal = load("goal", null) || NLIB.defaultGoal(saved);
  const recs = useMemo(() => NLIB.recommend(goal).slice(0, 4), [saved]); // eslint-disable-line

  return (
    <>
      <header className="mb-6 sm:mb-8">
        <Badge tone="teal">2025 KOTRA AI 활용 우수사례집 구성을 따름</Badge>
        <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">처음 수출하는 의료기기 기업을 위한 8단계 수출 도우미</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground leading-relaxed">
          무엇부터 할지, 어떤 지원사업을 신청할지, 바이어에게 무엇을 보낼지 순서대로 안내해요. 회원가입이나 설치 없이 바로 쓰고, 입력한 내용은 이 브라우저에만 저장돼요.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button as={Link} to="/readiness" variant="primary" icon={Sparkles}>01 준비 진단부터 시작</Button>
          <Button as={Link} to="/programs" icon={CalendarDays}>지원사업 공고 보기</Button>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          ["수출 순서", "8단계", "KOTRA 사례집 순서 그대로", ListChecks],
          ["지원사업 공고", NLIB.data.items.length + "건", "매일 아침 새로 모아요", CalendarDays],
          ["진단 기준", "52개", "8단계 수출 여정별 점검", ShieldCheck],
          ["이용료", "0원", "가입·설치 없이 무료", Sparkles],
        ].map(([k, v, d, Icon]) => (
          <div key={k} className="rounded-xl border bg-gradient-to-t from-primary/5 to-card shadow-xs p-4 sm:p-5">
            <div className="flex items-center justify-between text-sm text-muted-foreground">{k}<Icon className="size-4" /></div>
            <p className="mt-2 text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight">{v}</p>
            <p className="mt-1 text-xs text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <div className="grid gap-6">
          <Card>
            <CardHeader
              icon={Building2}
              title="우리 회사 정보"
              desc="한 번 적으면 모든 단계에서 함께 써요."
              action={P.sample && <Badge tone="amber">가상 예시가 들어 있어요</Badge>}
            />
            <div className="grid sm:grid-cols-2 gap-x-4">
              <Field label="회사 이름"><Input value={P.company || ""} onChange={set("company")} /></Field>
              <Field label="회사 이름 (영문)"><Input value={P.companyEn || ""} onChange={set("companyEn")} /></Field>
              <Field label="수출할 제품"><Input value={P.product || ""} onChange={set("product")} placeholder="예: 저주파 전기자극 치료기" /></Field>
              <Field label="제품 이름 (영문)"><Input value={P.productEn || ""} onChange={set("productEn")} /></Field>
              <Field label="HS 코드 6자리" hint="모르면 비워 두세요"><Input value={P.hs || ""} onChange={set("hs")} placeholder="예: 9018.90" /></Field>
              <Field label="의료기기 등급">
                <Select value={P.grade || ""} onChange={set("grade")} options={[["", "모름"], ["1", "1등급"], ["2", "2등급"], ["3", "3등급"], ["4", "4등급"]]} />
              </Field>
              <Field label="본사 지역" hint="지역 한정 공고 거르기"><Select value={P.region || "서울"} onChange={set("region")} options={REGIONS} /></Field>
              <Field label="수출 경험"><Select value={P.exp || "none"} onChange={set("exp")} options={[["none", "처음이에요"], ["some", "조금 있어요"]]} /></Field>
              <Field label="관심 있는 나라" hint="쉼표로 구분, 2–3곳" className="sm:col-span-2"><Input value={P.countries || ""} onChange={set("countries")} placeholder="예: 인도네시아, 일본, 홍콩" /></Field>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              <Button variant="primary" onClick={() => { const p = { ...P }; delete p.sample; setP(p); setProfile(p); setSaved(p); toast("저장했어요. 이제 01 수출 준비 진단부터 시작하세요"); }}>저장</Button>
              <Button onClick={() => { setP({ region: "서울", exp: "none" }); toast("칸을 비웠어요. 다 쓰고 저장을 누르세요"); }}>비우고 새로 쓰기</Button>
              <Button variant="ghost" onClick={() => { setP({ ...SAMPLE_PROFILE }); setProfile({ ...SAMPLE_PROFILE }); setSaved({ ...SAMPLE_PROFILE }); }}>가상 예시 다시 넣기</Button>
            </div>
          </Card>

          <div>
            <div className="flex items-end justify-between mb-3">
              <h2 className="text-lg font-semibold tracking-tight">이 순서대로 하세요</h2>
              <span className="text-[13px] text-muted-foreground">KOTRA 사례집 순서</span>
            </div>
            <ol className="grid sm:grid-cols-2 gap-3">
              {STEPS.map((s) => (
                <li key={s.path}>
                  <Link to={s.path} className="group flex h-full gap-4 rounded-xl border bg-card p-4 shadow-xs hover:bg-accent/60 transition-colors">
                    <span className="grid place-items-center size-9 shrink-0 rounded-md border bg-background text-sm font-semibold tabular-nums text-primary shadow-xs group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">{s.n}</span>
                    <div className="min-w-0">
                      <h3 className="font-medium">{s.name}</h3>
                      <p className="text-sm text-ink-2 mt-0.5 leading-relaxed">{s.what}</p>
                      <p className="text-xs text-muted-foreground mt-1.5">{s.kc} 방식</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <aside className="grid gap-6 lg:sticky lg:top-8">
          <Card>
            <CardHeader icon={CalendarDays} title="우리 회사에 맞는 공고" desc={`${goal.region} 기업 · 관심 지역 ${goal.areas.join(", ") || "전체"} 기준`} />
            {recs.length ? (
              <ul className="divide-y -my-1">
                {recs.map(({ n, st, why }) => (
                  <li key={n.id} className="py-3">
                    <Badge tone={toneOf(st.cls)}>{st.label}</Badge>
                    <a href={n.url} target="_blank" rel="noopener" className="mt-1.5 flex gap-1 font-medium text-sm leading-snug hover:text-primary">
                      {n.title}
                      <ExternalLink size={13} className="shrink-0 mt-1 text-muted-foreground" />
                    </a>
                    <p className="text-[13px] text-muted-foreground mt-1">{n.org} · {why.slice(0, 2).join(" · ")}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">지금 맞는 공고가 없어요. 목표를 넓혀 보세요.</p>
            )}
            <Button as={Link} to="/programs" variant="soft" className="mt-4 w-full">지원사업 캘린더 전체 보기 <ArrowRight size={16} /></Button>
          </Card>
          <Card tone="soft">
            <CardHeader icon={ShieldCheck} title="이 도구의 약속" />
            <ul className="grid gap-2.5 text-sm text-ink-2">
              <li>AI는 찾고, 정리하고, 초안을 써요. 숫자·세율·인증은 사람이 공식자료로 확인해요.</li>
              <li>답마다 출처를 붙이고, 확인한 내용은 기록으로 남겨요.</li>
              <li>공고는 원문 링크로 연결해요. 신청 전에 꼭 원문을 읽으세요.</li>
            </ul>
          </Card>
        </aside>
      </div>
    </>
  );
}
