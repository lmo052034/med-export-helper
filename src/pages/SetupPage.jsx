/* 첫 설정 3단계: 사용자 정보 → 소속과 역할 → 기본값.
   단계는 왼쪽 목록과 "1/3단계" 글자로 표시하고, 2, 3단계는 나중에 할 수 있습니다 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { PACK } from "@pack";
import { useDeal } from "../lib/deal/DealContext.jsx";
import { PEOPLE, TIMEZONES, DOC_LANGS, START_PAGES, blankProfile, saveProfile, useProfile } from "../lib/profile.js";
import { cn } from "@/lib/utils";

const CTRL = "h-11 w-full rounded-lg border border-[var(--line-strong)] bg-white px-3 text-[15px] outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20";
const STEPS = ["사용자 정보", "소속과 역할", "기본값"];
const OPEN = [["sample", "진행 중 거래", "지금 진행 중인 거래와 서류를 그대로 엽니다"], ["blank", "빈 거래", "거래조건을 처음부터 입력합니다"], ["mock", "연습용 거래", "실제 거래와 섞이지 않는 연습용 숫자로 엽니다"]];

export function Row({ label, htmlFor, hint, required, children }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="text-[14px] font-medium text-[#1d1d1f]">{label}{required && <span className="ml-1 text-[12px] font-normal text-[#6e6e73]">(필수)</span>}</label>
      {children}
      {hint && <p className="text-[12px] text-[#6e6e73]">{hint}</p>}
    </div>
  );
}

export function Choice({ name, value, options, onChange }) {
  return (
    <div role="radiogroup" className="divide-y divide-[var(--line)] rounded-lg border border-[var(--line-strong)]">
      {options.map((o) => (
        <label key={o.id} className={cn("flex cursor-pointer items-start gap-3 px-4 py-3", value === o.id && "bg-[var(--fill-soft)]")}>
          <input type="radio" name={name} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} className="mt-1 size-4 accent-[var(--primary)]" />
          <span className="min-w-0"><span className="block text-[15px] font-medium">{o.label}</span>{o.desc && <span className="block text-[13px] text-[#6e6e73]">{o.desc}</span>}</span>
        </label>
      ))}
    </div>
  );
}

export function Select({ id, value, onChange, options }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={CTRL}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

export default function SetupPage() {
  const existing = useProfile();
  const nav = useNavigate();
  const { actions } = useDeal();
  const [step, setStep] = useState(0);
  const [p, setP] = useState(() => ({ ...blankProfile(), ...(existing || {}) }));
  const [open, setOpen] = useState("sample");
  const [err, setErr] = useState("");
  const set = (k) => (v) => setP((x) => ({ ...x, [k]: v }));
  const roles = PEOPLE.roles.filter((r) => !p.org || r.org === p.org);

  const next = () => {
    if (step === 0 && !p.name.trim()) { setErr("이름을 입력해 주세요. 홈 인사와 담당자 표시에 씁니다."); return; }
    setErr("");
    if (step < 2) setStep(step + 1); else finish();
  };
  const finish = () => {
    saveProfile({ ...p, name: p.name.trim(), title: p.title.trim(), createdAt: existing?.createdAt || new Date().toISOString() });
    if (!existing) { if (open === "blank") actions.newBlank(); else if (open === "mock") actions.openMock(); else actions.openSample(); }
    nav("/", { replace: true });
  };

  return (
    <div className="bg-[var(--surface-2)] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto grid max-w-[880px] overflow-hidden rounded-xl border border-[var(--line)] bg-white md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-b border-[var(--line)] bg-[var(--surface-2)]/60 p-6 md:border-r md:border-b-0">
          <p className="text-[13px] font-semibold">{PACK.brand}</p>
          <p className="text-[12px] text-[#6e6e73]">사용자 설정</p>
          <ol className="mt-6 space-y-1" aria-label="설정 단계">
            {STEPS.map((s, i) => (
              <li key={s} aria-current={i === step ? "step" : undefined} className={cn("flex items-center gap-2.5 rounded-md px-2 py-2 text-[14px]", i === step ? "bg-white font-semibold text-[#1d1d1f]" : i < step ? "text-[#424245]" : "text-[#86868b]")}>
                <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border text-[11px] tabular-nums", i < step ? "border-primary bg-primary text-white" : i === step ? "border-[#1d1d1f]" : "border-[var(--line-strong)]")}>{i < step ? <Check className="size-3" /> : i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </aside>

        <form className="p-6 sm:p-8" onSubmit={(e) => { e.preventDefault(); next(); }} noValidate>
          <p className="text-[13px] tabular-nums text-[#6e6e73]">{step + 1}/3단계</p>
          <h1 className="mt-1 text-[24px] font-bold tracking-tight">{STEPS[step]}</h1>

          {step === 0 && (
            <div className="mt-6 grid gap-5">
              <Row label="이름" htmlFor="pf-name" required hint="홈 인사와 할 일 담당자 표시에 씁니다.">
                <input id="pf-name" autoFocus autoComplete="name" value={p.name} onChange={(e) => set("name")(e.target.value)} aria-invalid={!!err || undefined} aria-describedby={err ? "pf-err" : undefined} className={CTRL} placeholder="예: 홍길동" />
              </Row>
              <Row label="직함" htmlFor="pf-title" hint="선택. 예: 해외영업 과장, Sales Manager">
                <input id="pf-title" autoComplete="organization-title" value={p.title} onChange={(e) => set("title")(e.target.value)} className={CTRL} />
              </Row>
              {err && <p id="pf-err" role="alert" className="text-[13px] text-amber-700">{err}</p>}
            </div>
          )}

          {step === 1 && (
            <div className="mt-6 grid gap-6">
              <fieldset className="grid gap-2"><legend className="mb-2 text-[14px] font-medium">소속</legend>
                <Choice name="org" value={p.org} options={PEOPLE.orgs} onChange={(v) => setP((x) => ({ ...x, org: v, role: PEOPLE.roles.find((r) => r.id === x.role && r.org === v) ? x.role : "" }))} />
              </fieldset>
              <fieldset className="grid gap-2"><legend className="mb-2 text-[14px] font-medium">역할</legend>
                <Choice name="role" value={p.role} options={roles} onChange={set("role")} />
                <p className="text-[12px] text-[#6e6e73]">역할에 맞는 할 일이 홈 맨 위에 옵니다. 나중에 내 설정에서 바꿀 수 있습니다.</p>
              </fieldset>
            </div>
          )}

          {step === 2 && (
            <div className="mt-6 grid gap-5">
              <Row label="시간대" htmlFor="pf-tz" hint="홈의 날짜와 시각, 기한 계산에 씁니다."><Select id="pf-tz" value={p.tz} onChange={set("tz")} options={TIMEZONES} /></Row>
              <Row label="병원 제안서 기본 언어" htmlFor="pf-lang" hint="병원 제안 화면에서 언제든 바꿀 수 있습니다."><Select id="pf-lang" value={p.docLang} onChange={set("docLang")} options={DOC_LANGS} /></Row>
              <Row label="시작 화면" htmlFor="pf-start" hint="사이트를 열 때 처음 보일 화면입니다."><Select id="pf-start" value={p.start} onChange={set("start")} options={START_PAGES} /></Row>
              {!existing && (
                <fieldset className="grid gap-2"><legend className="mb-2 text-[14px] font-medium">처음 열 거래</legend>
                  <Choice name="open" value={open} options={OPEN.map(([id, label, desc]) => ({ id, label, desc }))} onChange={setOpen} />
                </fieldset>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-5">
            {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="h-10 rounded-lg border border-[var(--line-strong)] px-4 text-[14px] font-medium hover:bg-[var(--fill-soft)]">이전</button>}
            {step > 0 && <button type="button" onClick={() => (step < 2 ? setStep(step + 1) : finish())} className="h-10 px-3 text-[14px] text-[#6e6e73] hover:text-[#1d1d1f]">나중에 하기</button>}
            {step === 0 && <Link to="/start" className="h-10 px-3 text-[14px] leading-10 text-[#6e6e73] hover:text-[#1d1d1f]">사이트 안내로</Link>}
            <button type="submit" className="ml-auto h-10 rounded-lg bg-primary px-5 text-[14px] font-semibold text-white hover:brightness-110">{step < 2 ? "다음" : "설정 완료"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
