/* 내 설정: 묶음 제목과 설명은 왼쪽, 입력은 오른쪽 (Shopify 관리자 설정 방식).
   바꾼 내용은 아래 저장 막대에서 저장하거나 취소합니다 */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PEOPLE, TIMEZONES, DOC_LANGS, START_PAGES, saveProfile, useProfile } from "../lib/profile.js";
import { Row, Choice, Select } from "./SetupPage.jsx";

const CTRL = "h-11 w-full rounded-lg border border-[var(--line-strong)] bg-white px-3 text-[15px] outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20";

function Section({ title, desc, children }) {
  return (
    <section className="grid gap-4 border-t border-[var(--line)] py-8 first:border-t-0 first:pt-0 md:grid-cols-[240px_minmax(0,1fr)] md:gap-10">
      <div>
        <h2 className="text-[16px] font-semibold">{title}</h2>
        {desc && <p className="mt-1 text-[13px] leading-relaxed text-[#6e6e73]">{desc}</p>}
      </div>
      <div className="grid min-w-0 gap-5 rounded-xl border border-[var(--line)] bg-white p-5 sm:p-6">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const profile = useProfile();
  const nav = useNavigate();
  const [p, setP] = useState(profile);
  useEffect(() => { if (!profile) nav("/setup", { replace: true }); }, [profile, nav]);
  if (!profile || !p) return null;
  const set = (k) => (v) => setP((x) => ({ ...x, [k]: v }));
  const dirty = JSON.stringify({ ...p, recent: 0, done: 0 }) !== JSON.stringify({ ...profile, recent: 0, done: 0 });
  const save = () => {
    if (!p.name.trim()) { toast.error("이름은 비워 둘 수 없습니다."); return; }
    saveProfile({ ...profile, ...p, name: p.name.trim(), title: p.title.trim(), recent: profile.recent, done: profile.done });
    toast.success("설정을 저장했습니다.");
  };
  const roles = PEOPLE.roles.filter((r) => !p.org || r.org === p.org);

  return (
    <div className="bg-[var(--surface-2)] px-4 pt-10 pb-28 sm:px-6">
      <div className="mx-auto max-w-[960px]">
        <p className="text-[13px] text-[#6e6e73]"><Link to="/" className="hover:underline">홈</Link> / 내 설정</p>
        <h1 className="mt-1 text-[28px] font-bold tracking-tight">내 설정</h1>
        <p className="mt-1 text-[14px] text-[#6e6e73]">이 브라우저에만 저장됩니다. 다른 컴퓨터에서는 다시 설정해야 합니다.</p>

        <div className="mt-8">
          <Section title="사용자 정보" desc="홈 인사와 할 일 담당자 표시에 씁니다.">
            <Row label="이름" htmlFor="st-name" required><input id="st-name" autoComplete="name" value={p.name} onChange={(e) => set("name")(e.target.value)} className={CTRL} /></Row>
            <Row label="직함" htmlFor="st-title"><input id="st-title" autoComplete="organization-title" value={p.title} onChange={(e) => set("title")(e.target.value)} className={CTRL} /></Row>
          </Section>

          <Section title="소속과 역할" desc="역할에 맞는 할 일이 홈 맨 위에 옵니다.">
            <fieldset className="grid gap-2"><legend className="mb-2 text-[14px] font-medium">소속</legend>
              <Choice name="st-org" value={p.org} options={PEOPLE.orgs} onChange={(v) => setP((x) => ({ ...x, org: v, role: PEOPLE.roles.find((r) => r.id === x.role && r.org === v) ? x.role : "" }))} />
            </fieldset>
            <fieldset className="grid gap-2"><legend className="mb-2 text-[14px] font-medium">역할</legend>
              <Choice name="st-role" value={p.role} options={roles} onChange={set("role")} />
            </fieldset>
          </Section>

          <Section title="기본값" desc="화면을 열 때 처음 적용되는 값입니다. 각 화면에서 그때그때 바꿀 수 있습니다.">
            <Row label="시간대" htmlFor="st-tz"><Select id="st-tz" value={p.tz} onChange={set("tz")} options={TIMEZONES} /></Row>
            <Row label="병원 제안서 기본 언어" htmlFor="st-lang"><Select id="st-lang" value={p.docLang} onChange={set("docLang")} options={DOC_LANGS} /></Row>
            <Row label="시작 화면" htmlFor="st-start" hint="사이트 주소를 열 때 이 화면으로 갑니다."><Select id="st-start" value={p.start} onChange={set("start")} options={START_PAGES} /></Row>
          </Section>

          <Section title="홈 화면" desc="처음 쓰는 동안 보이는 안내입니다.">
            <label className="flex items-start gap-3 text-[14px]">
              <input type="checkbox" checked={p.checklist} onChange={(e) => set("checklist")(e.target.checked)} className="mt-0.5 size-4 accent-[var(--primary)]" />
              <span><span className="font-medium">시작 체크리스트 보이기</span><span className="block text-[13px] text-[#6e6e73]">다 끝내면 자동으로 접힙니다.</span></span>
            </label>
            <p className="text-[14px]"><Link to="/start" className="font-medium text-primary hover:underline">사이트 안내 다시 보기</Link></p>
          </Section>

          <Section title="이 브라우저의 데이터" desc="사용자 정보와 거래는 따로 저장됩니다.">
            <p className="text-[14px] leading-relaxed text-[#424245]">사용자 정보를 지워도 저장한 거래는 남습니다. 거래를 지우려면 화면 위 '거래' 메뉴를 쓰세요.</p>
            <div><button type="button" onClick={() => { if (confirm("이 브라우저의 사용자 정보를 지울까요? 거래는 남습니다.")) { saveProfile(null); nav("/start", { replace: true }); } }} className="h-10 rounded-lg border border-[var(--line-strong)] px-4 text-[14px] font-medium text-amber-800 hover:bg-[var(--fill-soft)]">사용자 정보 지우기</button></div>
          </Section>
        </div>
      </div>

      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-white/95 backdrop-blur" role="region" aria-label="저장하지 않은 변경">
          <div className="mx-auto flex max-w-[960px] items-center gap-3 px-4 py-3 sm:px-6">
            <p className="flex-1 text-[14px] font-medium">저장하지 않은 변경 사항</p>
            <button type="button" onClick={() => setP(profile)} className="h-9 rounded-lg border border-[var(--line-strong)] px-4 text-[14px] font-medium hover:bg-[var(--fill-soft)]">취소</button>
            <button type="button" onClick={save} className="h-9 rounded-lg bg-primary px-4 text-[14px] font-semibold text-white hover:brightness-110">저장</button>
          </div>
        </div>
      )}
    </div>
  );
}
