/* 근거자료: 값의 출처 구분(회사 자료 / 공개자료 / 팀 설정 / 모의 / 사용자 입력), 계산식, 바뀐 값 기록 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useDeal } from "../lib/deal/DealContext.jsx";
import { EvidencePanel, EV_STATUS, FIELD_NAMES } from "../components/deal/EvidencePanel.jsx";
import { changeLabel } from "./ReviewPage.jsx";
import { PACK } from "@pack";
import { cn } from "@/lib/utils";

const FORMULAS = [
  ["회당 공헌액", "회당 실제 수납액 − 회당 변동비"],
  ["월 운영 현금잉여", "월 유료 시술 × 회당 공헌액 − 월 추가 고정비 (장비 상각비 제외)"],
  ["운영 손익분기 시술량", "올림(월 추가 고정비 ÷ 회당 공헌액). 공헌액이 0 이하이면 산출하지 않음"],
  ["단순 투자 회수 예상", "초기 도입비 ÷ 월 운영 현금잉여. 잉여가 0 이하이면 산출하지 않음"],
  ["누적 현금흐름", "−초기 도입비 + 경과 개월 × 월 운영 현금잉여 (할인율, 세금 미반영)"],
  ["병원 초기 도입비", "현지 견적 공급가 + 부가세 (병원은 매입 부가세를 공제받지 못한다고 가정) 또는 직접 입력"],
  ["파트너 거래 손익 (세전)", "현지 공급가(부가세 제외) − 수출 대금 × 환율 − 포함한 비용 − 관세. 수입 부가세, PPh 22는 공제·선납이라 제외"],
  ["관세", "과세가격(CIF: 수출 금액 + CIF 포함 표시한 운임·보험) × 환율 × 관세율"],
  ["일시 필요 자금", "결제 단계 순서대로 더한 파트너 현금의 최저점 (처음 현금 0 가정)"],
];

export default function EvidencePage() {
  const { deal } = useDeal();
  const [panel, setPanel] = useState(null);
  const ev = deal.evidence;
  const groups = EV_STATUS.map(([k, l]) => [k, l, ev.filter((e) => e.status === k)]);
  const P = PACK.evidence || {};
  return (
    <div className="mx-auto max-w-[1080px] px-4 pb-20 sm:px-6">
      <div className="pt-10 pb-8">
        <h1 className="text-[34px] font-bold tracking-[-0.03em] sm:text-[40px]">근거자료</h1>
        <p className="mt-2 max-w-[680px] text-[15px] text-[#424245]">화면의 값이 어디서 왔는지 구분해요. 회사 자료와 공개자료는 원문 기준일을, 내부 설정값은 계약 전에 거래처와 확정할 값으로 표시해요. 현재 거래: <b>{deal.name}</b></p>
        {P.note && <p className="mt-2 max-w-[680px] text-[13px] text-[#6e6e73]">{P.note}</p>}
      </div>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px] bg-[var(--line)] sm:grid-cols-5">
        {groups.map(([k, l, list]) => (
          <a key={k} href={`#ev-${k}`} onClick={(e) => { e.preventDefault(); document.getElementById(`ev-${k}`)?.scrollIntoView({ block: "start" }); }} className="block bg-white p-4 hover:bg-[var(--surface-2)]">
            <dt className="text-[13px] text-[#6e6e73]">{l}</dt><dd className="mt-1 text-[24px] font-semibold tabular-nums">{list.length}</dd>
          </a>
        ))}
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setPanel("*")} className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-[14px] font-medium text-white">근거 편집하기</button>
        <Link to="/review" className="inline-flex h-9 items-center rounded-full border border-[var(--line-strong)] px-4 text-[14px] font-medium">검토 결과 보기</Link>
      </div>

      {groups.filter(([, , list]) => list.length).map(([k, l, list]) => (
        <section key={k} id={`ev-${k}`} className="scroll-mt-16 pt-12">
          <h2 className="text-[22px]">{l} <span className="text-[15px] font-normal text-[#86868b]">{list.length}건</span></h2>
          <ul className="mt-3 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {list.map((e) => (
              <li key={e.id} className="grid gap-1 py-3 sm:grid-cols-[150px_minmax(0,1fr)_120px] sm:gap-4">
                <span className="text-[12px] text-[#6e6e73]">{FIELD_NAMES[e.field] || e.field || "거래 전체"}</span>
                <div className="min-w-0 text-[14px]">
                  <p className="font-medium">{e.title || "(제목 없음)"}</p>
                  {e.supports && <p className="text-[#424245]">{e.supports}</p>}
                  <p className="text-[12px] break-words text-[#6e6e73]">{/^https?:\/\//.test(e.ref) ? <a href={e.ref} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover:underline">{e.ref}</a> : e.ref || "출처 미입력"}{e.asOf && `, 기준 ${e.asOf}`}{e.checkedAt && `, 확인 ${e.checkedAt}`}</p>
                </div>
                <span className={cn("text-[12px] font-medium sm:text-right", e.confirmed ? "text-primary" : e.ref ? "text-amber-700" : "text-[#6e6e73]")}>{e.confirmed ? "내용 확인함" : e.ref ? "출처만 있음" : "출처 없음"}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="pt-14">
        <h2 className="text-[22px]">계산식</h2>
        <p className="mt-1 text-[13px] text-[#6e6e73]">모든 화면은 같은 계산 함수를 써요. 월 조건이 일정하다는 전제의 계산이며, 세금과 할인율은 위에 적은 범위만 반영해요.</p>
        <dl className="mt-4 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {FORMULAS.map(([k, v]) => <div key={k} className="grid gap-1 py-3 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-4"><dt className="text-[14px] font-medium">{k}</dt><dd className="text-[14px] text-[#424245]">{v}</dd></div>)}
        </dl>
      </section>

      <section className="pt-14">
        <h2 className="text-[22px]">바뀐 값 기록</h2>
        <ul className="mt-3 divide-y divide-[var(--line)] border-y border-[var(--line)] text-[14px]">
          {[...deal.changes].reverse().slice(0, 20).map((c) => (
            <li key={c.id} className="py-2.5"><span className="text-[#6e6e73]">{changeLabel(deal, c.field)}</span> {c.from || "(빈칸)"} → <b className="font-medium">{c.to || "(빈칸)"}</b></li>
          ))}
          {!deal.changes.length && <li className="py-3 text-[#6e6e73]">아직 바뀐 값이 없어요.</li>}
        </ul>
      </section>
      <EvidencePanel open={!!panel} path={panel} onOpenChange={(o) => !o && setPanel(null)} />
    </div>
  );
}
