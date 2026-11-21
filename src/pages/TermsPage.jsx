/* A. 거래조건: 업무 순서대로 나눈 입력 구역 + (넓은 화면) 오른쪽 서류 미리보기 */
import { useEffect, useLayoutEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useDeal } from "../lib/deal/DealContext.jsx";
import { calcExport, calcLocal, weights } from "../lib/deal/calc.js";
import { fmtMoney, fmtNum, CURRENCIES } from "../lib/deal/money.js";
import { INCOTERMS, SECTIONS } from "../lib/deal/checks.js";
import { fieldId, sectionOf, getPath } from "../lib/deal/path.js";
import { DealField, CellInput, EvidenceButton } from "../components/deal/Field.jsx";
import { EvidencePanel } from "../components/deal/EvidencePanel.jsx";
import { DocView, DOCS } from "../components/deal/Docs.jsx";
import { cn } from "@/lib/utils";

const PARTY = [["maker", "제조사"], ["partner", "현지 파트너"], ["hospital", "병원"]];
const KINDS = [["main", "본체"], ["handpiece", "핸드피스"], ["accessory", "부속품"], ["consumable", "소모품"]];
const CUR = Object.keys(CURRENCIES);

function Section({ id, n, open, onToggle, summary, children }) {
  const { findings } = useDeal();
  const fix = findings.filter((f) => f.level === "fix" && sectionOf(f.field) === id).length;
  const conf = findings.filter((f) => f.level === "confirm" && sectionOf(f.field) === id).length;
  return (
    <section id={`sec-${id}`} className="border-b border-[var(--line)]">
      <h2>
        <button type="button" aria-expanded={open} aria-controls={`sec-${id}-body`} onClick={onToggle} className="flex w-full items-center gap-3 px-1 py-3.5 text-left hover:bg-[var(--fill-soft)]">
          <span className="w-5 text-[12px] tabular-nums text-[#86868b]">{n}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-semibold tracking-tight">{SECTIONS[id]}</span>
            {!open && summary && <span className="block truncate text-[13px] text-[#6e6e73]">{summary}</span>}
          </span>
          {fix > 0 && <span className="text-[12px] font-semibold text-amber-700 tabular-nums">수정 {fix}</span>}
          {conf > 0 && <span className="text-[12px] text-[#6e6e73] tabular-nums">확인 {conf}</span>}
          <ChevronDown className={cn("size-4 text-[#86868b] transition-transform", open && "rotate-180")} aria-hidden="true" />
        </button>
      </h2>
      {open && <div id={`sec-${id}-body`} className="pb-6 pl-1 sm:pl-8 pr-1">{children}</div>}
    </section>
  );
}

const Grid = ({ children, cols = 2 }) => <div className={cn("grid gap-x-4 gap-y-3.5", cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>{children}</div>;
const Sub = ({ children, first }) => <h3 className={cn("mb-2.5 text-[13px] font-semibold text-[#1d1d1f]", !first && "mt-6")}>{children}</h3>;
function Check({ path, label }) {
  const { deal, update } = useDeal();
  return <label className="inline-flex items-center gap-2 text-[14px]"><input id={fieldId(path)} type="checkbox" className="size-4 accent-[var(--primary)]" checked={!!getPath(deal, path)} onChange={(e) => update(path, e.target.checked)} />{label}</label>;
}
const AddBtn = ({ onClick, children }) => <button type="button" onClick={onClick} className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-[13px] font-medium text-primary hover:bg-[var(--fill-soft)]"><Plus className="size-3.5" />{children}</button>;
const DelBtn = ({ onClick, label }) => <button type="button" onClick={onClick} aria-label={label} className="grid size-8 place-items-center rounded-md text-[#86868b] hover:bg-[var(--fill)] hover:text-foreground"><Trash2 className="size-4" /></button>;

function PaymentRows({ base, cur, sched }) {
  const { deal, add, remove } = useDeal();
  const rows = getPath(deal, base);
  return (
    <div>
      <div className="hidden sm:grid grid-cols-[minmax(0,1.4fr)_70px_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_32px] gap-2 pb-1 text-[12px] text-[#6e6e73]"><span>회차</span><span className="text-right">비율 %</span><span className="text-right">또는 금액</span><span>시점</span><span className="text-right">계산 금액</span><span /></div>
      <div className="space-y-2" id={fieldId(base)} tabIndex={-1}>
        {rows.map((r, i) => {
          const c = sched.rows.find((x) => x.id === r.id);
          return (
            <div key={r.id} className="grid grid-cols-2 sm:grid-cols-[minmax(0,1.4fr)_70px_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_32px] items-center gap-2">
              <CellInput path={`${base}.${r.id}.label`} label={`${i + 1}회차 이름`} placeholder="예: 계약금" className="col-span-2 sm:col-span-1" />
              <CellInput path={`${base}.${r.id}.pct`} label={`${i + 1}회차 비율`} type="number" placeholder="%" />
              <CellInput path={`${base}.${r.id}.amount`} label={`${i + 1}회차 금액`} type="number" placeholder={cur} />
              <CellInput path={`${base}.${r.id}.due`} label={`${i + 1}회차 시점`} placeholder="예: before shipment" />
              <span className="text-right text-[13px] tabular-nums text-[#424245]">{c && c.minor !== null ? fmtMoney(c.minor, cur, { bare: true }) : "—"}</span>
              <DelBtn onClick={() => remove(base, r.id)} label={`${i + 1}회차 삭제`} />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <AddBtn onClick={() => add(base, { label: "", pct: "", amount: "", due: "" })}>회차 추가</AddBtn>
        <span className="text-[12px] text-[#6e6e73]">{sched.mode === "pct" ? `비율 합계 ${fmtNum(sched.pctSum)}%` : sched.mode === "amount" ? `금액 합계 ${fmtMoney(sched.amountSum, cur)}` : sched.mode === "mixed" ? "비율과 금액을 섞어 적었어요" : ""}{sched.remainder ? ` · 반올림 차이 ${fmtMoney(Math.abs(sched.remainder), cur, { bare: true })}를 마지막 회차에 반영` : ""}</span>
      </div>
    </div>
  );
}

function ItemsEditor({ onEv }) {
  const { deal, add, remove } = useDeal();
  const E = calcExport(deal), cur = deal.exp.currency;
  return (
    <div>
      <Grid cols={3}><DealField path="exp.currency" label="수출 통화" type="select" options={CUR} /></Grid>
      <div className="mt-4 space-y-3" id={fieldId("exp.items")} tabIndex={-1}>
        {deal.exp.items.map((it, i) => {
          const c = E.items.find((x) => x.id === it.id);
          return (
            <div key={it.id} className="rounded-lg border border-[var(--line)] p-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-[110px_minmax(0,1fr)_minmax(0,1.4fr)_32px]">
                <CellInput path={`exp.items.${it.id}.kind`} label={`${i + 1}번 품목 구분`} options={KINDS} />
                <CellInput path={`exp.items.${it.id}.model`} label={`${i + 1}번 품목 모델`} placeholder="모델명" />
                <CellInput path={`exp.items.${it.id}.desc`} label={`${i + 1}번 품목 설명`} placeholder="설명 (영문)" className="col-span-2 sm:col-span-1" />
                <span className="hidden sm:block"><DelBtn onClick={() => remove("exp.items", it.id)} label={`${i + 1}번 품목 삭제`} /></span>
              </div>
              <div className="mt-2 grid grid-cols-[70px_70px_minmax(0,1fr)] gap-2 sm:grid-cols-[80px_80px_120px_minmax(0,1fr)_110px]">
                <CellInput path={`exp.items.${it.id}.qty`} label={`${i + 1}번 품목 수량`} type="number" placeholder="수량" />
                <CellInput path={`exp.items.${it.id}.unit`} label={`${i + 1}번 품목 단위`} placeholder="set" />
                <CellInput path={`exp.items.${it.id}.price`} label={`${i + 1}번 품목 단가`} type="number" placeholder={`단가 ${cur}`} />
                <CellInput path={`exp.items.${it.id}.priceSource`} label={`${i + 1}번 품목 가격 근거`} placeholder="가격 근거 (가격표·합의 등)" className="col-span-3 sm:col-span-1" />
                <CellInput path={`exp.items.${it.id}.hs`} label={`${i + 1}번 품목 HS 코드`} placeholder="HS 코드" className="col-span-2 sm:col-span-1" />
                <span className="sm:hidden justify-self-end"><DelBtn onClick={() => remove("exp.items", it.id)} label={`${i + 1}번 품목 삭제`} /></span>
              </div>
              <p className="mt-1.5 text-right text-[13px] tabular-nums text-[#424245]">{c?.minor !== null && c?.minor !== undefined ? `금액 ${fmtMoney(c.minor, cur)}` : it.kind !== "main" && c?.p.state === "blank" ? <span className="text-amber-700">추가 구성의 가격 확인 필요 · 금액을 계산하지 않았어요</span> : "금액 —"}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        <AddBtn onClick={() => add("exp.items", { kind: "main", model: "", desc: "", qty: "", unit: "set", price: "", priceSource: "", hs: "" })}>본체</AddBtn>
        <AddBtn onClick={() => add("exp.items", { kind: "handpiece", model: "", desc: "", qty: "1", unit: "pc", price: "", priceSource: "", hs: deal.exp.items[0]?.hs || "" })}>핸드피스</AddBtn>
        <AddBtn onClick={() => add("exp.items", { kind: "accessory", model: "", desc: "", qty: "1", unit: "pc", price: "", priceSource: "", hs: "" })}>부속품</AddBtn>
        <span className="ml-auto"><EvidenceButton path="exp.items" onOpen={onEv} /></span>
      </div>
      <Sub>가격 외 별도 비용</Sub>
      <div className="space-y-2" id={fieldId("exp.extras")} tabIndex={-1}>
        {deal.exp.extras.map((x, i) => (
          <div key={x.id} className="grid grid-cols-[minmax(0,1fr)_120px_auto_32px] items-center gap-2">
            <CellInput path={`exp.extras.${x.id}.label`} label={`비용 ${i + 1} 이름`} placeholder="예: Freight" />
            <CellInput path={`exp.extras.${x.id}.amount`} label={`비용 ${i + 1} 금액`} type="number" placeholder={cur} />
            <Check path={`exp.extras.${x.id}.included`} label="총액에 포함" />
            <DelBtn onClick={() => remove("exp.extras", x.id)} label={`비용 ${i + 1} 삭제`} />
          </div>
        ))}
        {!deal.exp.extras.length && <p className="text-[13px] text-[#6e6e73]">운임·보험·포장비처럼 단가와 따로 받는 비용이 있으면 추가하세요. '총액에 포함'을 끄면 총액 계산에서 빠져요.</p>}
      </div>
      <AddBtn onClick={() => add("exp.extras", { label: "", amount: "", included: true })}>비용 추가</AddBtn>
      <div className="mt-4 flex items-baseline justify-between border-t border-[var(--line)] pt-3">
        <span className="text-[13px] text-[#6e6e73]">수출 총액 (품목{E.extrasMinor ? " + 포함 비용" : ""})</span>
        <span className="text-[17px] font-semibold tabular-nums">{E.total !== null ? fmtMoney(E.total, cur) : <span className="text-[14px] font-medium text-amber-700">빈칸이 있어 계산하지 않았어요</span>}</span>
      </div>
    </div>
  );
}

function PreviewPane({ compact }) {
  const { deal } = useDeal();
  const [doc, setDoc] = useState("quote");
  const docs = DOCS.filter(([k]) => k !== "local" || deal.local.enabled);
  return (
    <div className={cn("preview-pane", compact && "is-compact")}>
      <div role="tablist" aria-label="미리볼 서류" className="seg mb-3">
        {docs.map(([k, l]) => <button key={k} role="tab" type="button" aria-selected={doc === k} onClick={() => setDoc(k)} className="seg-btn">{l}</button>)}
      </div>
      <div className="preview-scale"><DocView id={doc} d={deal} /></div>
      <p className="mt-2 text-[12px] text-[#6e6e73]">입력하면 바로 바뀌어요. 같은 기준정보로 만든 서류라 금액·조건이 서로 같아요(기준정보로 동기화됨).</p>
    </div>
  );
}

export default function TermsPage() {
  const { deal } = useDeal();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(() => new Set(["basic"]));
  const [mobileView, setMobileView] = useState("form");
  const [ev, setEv] = useState(null);
  const focus = params.get("focus");
  const toggle = (id) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // 검토 결과·서류에서 넘어온 입력란 이동
  useEffect(() => { if (focus) { setOpen((s) => new Set([...s, sectionOf(focus)])); setMobileView("form"); } }, [focus]);
  useLayoutEffect(() => {
    if (!focus) return;
    const t = setTimeout(() => {
      if (focus === "evidence") { setEv("*"); setParams((p) => { p.delete("focus"); return p; }, { replace: true }); return; }
      let p = focus, el = document.getElementById(fieldId(p));
      while (!el && p.includes(".")) { p = p.slice(0, p.lastIndexOf(".")); el = document.getElementById(fieldId(p)); }
      if (!el) el = document.getElementById(`sec-${sectionOf(focus)}`);
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        el.focus({ preventScroll: true });
        const box = el.closest(".field") || el;
        box.classList.add("flash");
        setTimeout(() => box.classList.remove("flash"), 2200);
      }
      setParams((p) => { p.delete("focus"); return p; }, { replace: true });
    }, 60);
    return () => clearTimeout(t);
  }, [focus, setParams]);

  const E = calcExport(deal), L = calcLocal(deal), W = weights(deal), cur = deal.exp.currency;
  const sum = {
    basic: [deal.meta.no, deal.meta.stage === "invoice" ? "출하·인보이스 단계" : "견적 단계"].filter(Boolean).join(" · "),
    parties: PARTY.map(([k]) => deal.parties[k].name).filter(Boolean).join(" → "),
    items: `${deal.exp.items.map((i) => i.model || i.desc).filter(Boolean).join(", ") || "품목 없음"} · ${E.total !== null ? fmtMoney(E.total, cur) : "총액 미계산"}`,
    terms: [deal.exp.incoterm && `${deal.exp.incoterm} ${deal.exp.place}`, deal.exp.payment.map((p) => p.label || (p.pct && p.pct + "%")).filter(Boolean).join(" / ")].filter(Boolean).join(" · "),
    packing: `${deal.exp.packages || "?"} ${deal.exp.packageUnit} · N.W. ${deal.exp.nw || "—"} · G.W. ${deal.exp.gw || "—"} ${deal.exp.gwUnit}`,
    service: [deal.service.installBy && `설치 ${deal.service.installBy}`, deal.service.asBy && `A/S ${deal.service.asBy}`].filter(Boolean).join(" · ") || "합의 내용 없음",
    local: deal.local.enabled ? `${L.total !== null ? fmtMoney(L.total, deal.local.currency) : "총액 미계산"} · ${deal.local.priceBasis === "partner" ? "파트너 제공 가격" : deal.local.priceBasis === "mock" ? "팀 모의 가격" : "가격 출처 미선택"}` : "사용 안 함",
    docs: [deal.exp.quoteNo, deal.exp.invoiceNo, deal.email.senderName ? `서명 ${deal.email.senderName}` : "서명 없음"].filter(Boolean).join(" · "),
  };
  const roleOpts = PARTY.map(([k, l]) => [k, `${l}${deal.parties[k].name ? ` (${deal.parties[k].name})` : ""}`]);
  const S = (id, n, body) => <Section id={id} n={n} open={open.has(id)} onToggle={() => toggle(id)} summary={sum[id]}>{body}</Section>;

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <div role="tablist" aria-label="화면 전환" className="seg mt-4 xl:hidden no-print">
        <button role="tab" type="button" aria-selected={mobileView === "form"} onClick={() => setMobileView("form")} className="seg-btn">입력</button>
        <button role="tab" type="button" aria-selected={mobileView === "preview"} onClick={() => setMobileView("preview")} className="seg-btn">미리보기</button>
      </div>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_560px]">
        <div className={cn("min-w-0 pt-4 pb-16", mobileView !== "form" && "hidden xl:block")}>
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[14px] text-[#424245]">한 거래의 기준정보를 입력하면 견적서·인보이스·메일이 함께 바뀌어요.</p>
            <button type="button" onClick={() => setEv("*")} className="text-[13px] font-medium text-primary">근거자료 전체 ({deal.evidence.length})</button>
          </div>

          {S("basic", 1, <Grid>
            <DealField path="meta.name" label="거래명" placeholder="예: 인도네시아 파트너 1세트 수출" wide />
            <DealField path="meta.no" label="거래번호" />
            <DealField path="meta.date" label="작성일" type="date" />
            <DealField path="meta.stage" label="작성 단계" type="select" options={[["quote", "견적 단계 (인보이스 항목은 확인만)"], ["invoice", "출하·인보이스 단계 (중량·주소 필수)"]]} wide hint="단계에 따라 반드시 채울 항목이 달라져요." />
          </Grid>)}

          {S("parties", 2, <>
            {PARTY.map(([k, l], i) => (
              <div key={k}>
                <Sub first={i === 0}>{l}</Sub>
                <Grid>
                  <DealField path={`parties.${k}.name`} label="회사명 (영문)" evidence={`parties.${k}`} onEvidence={setEv} />
                  <DealField path={`parties.${k}.contact`} label="담당자" placeholder="받은 명함·메일 기준" />
                  <DealField path={`parties.${k}.address`} label="주소 (영문)" wide placeholder="회사 자료에 있는 주소만" />
                  <DealField path={`parties.${k}.email`} label="이메일" type="email" />
                  <DealField path={`parties.${k}.phone`} label="전화" />
                </Grid>
              </div>
            ))}
            <Sub>계약별 당사자</Sub>
            <Grid>
              <DealField path="roles.exportSeller" label="수출 계약 판매자" type="select" options={roleOpts} />
              <DealField path="roles.exportBuyer" label="수출 계약 구매자" type="select" options={roleOpts} />
              <DealField path="roles.consignee" label="수하인 (인보이스)" type="select" options={roleOpts} hint="화물을 받는 회사. 보통 수입자인 구매자와 같아요." />
              {deal.local.enabled && <><DealField path="roles.localSeller" label="현지 판매 판매자" type="select" options={roleOpts} /><DealField path="roles.localBuyer" label="현지 판매 구매자" type="select" options={roleOpts} /></>}
            </Grid>
            <Sub>거래 상대방 요청사항·합의사항</Sub>
            <Grid>
              <DealField path="counterpart.requests" label="상대방 요청사항" type="textarea" placeholder="예: 시연 일정, 인증서 사본 요청" />
              <DealField path="counterpart.agreements" label="합의한 내용" type="textarea" placeholder="메일 본문에 'As agreed'로 들어가요" />
            </Grid>
          </>)}

          {S("items", 3, <ItemsEditor onEv={setEv} />)}

          {S("terms", 4, <>
            <Grid cols={3}>
              <DealField path="exp.incoterm" label="인도조건 (Incoterms)" type="select" options={[["", "선택"], ...INCOTERMS]} evidence onEvidence={setEv} />
              <DealField path="exp.place" label="지정 장소" placeholder="예: Seoul, Korea" />
              <DealField path="exp.incotermVersion" label="Incoterms 버전" type="select" options={["2020", "2010"]} />
              <DealField path="exp.transport" label="운송 방식" type="select" options={[["", "선택"], ["air", "항공"], ["sea", "해상"], ["road", "육상"], ["multi", "복합"]]} />
              <DealField path="exp.leadTime" label="납기" placeholder="예: 4 weeks after payment" />
              <DealField path="exp.validityDays" label="견적 유효기간" type="number" suffix="일" />
            </Grid>
            {deal.exp.incoterm === "EXW" && <div className="mt-3.5"><DealField path="exp.exportClearance" label="EXW 수출통관 담당 (합의 내용)" placeholder="예: export clearance by seller's broker on buyer's behalf" hint="EXW는 원칙적으로 구매자가 수출통관을 맡아요. 다르게 합의했다면 적으세요." /></div>}
            <Sub>결제 일정 (비율 또는 금액 한 가지로)</Sub>
            <PaymentRows base="exp.payment" cur={cur} sched={E.pay} />
          </>)}

          {S("packing", 5, <>
            <Grid cols={3}>
              <DealField path="exp.packages" label="포장 수량" type="number" hint="제품 수량과 달라도 돼요." />
              <DealField path="exp.packageUnit" label="포장 단위" type="select" options={["CTN", "PLT", "CASE", "PKG"]} />
              <DealField path="exp.weightBasis" label="중량 기준" type="select" options={[["total", "화물 전체"], ["per-package", "포장 1개당"]]} />
              <DealField path="exp.nw" label="순중량 N.W." type="number" />
              <DealField path="exp.nwUnit" label="N.W. 단위" type="select" options={["kg", "lb"]} />
              <span className="hidden sm:block" />
              <DealField path="exp.gw" label="총중량 G.W." type="number" />
              <DealField path="exp.gwUnit" label="G.W. 단위" type="select" options={["kg", "lb"]} />
            </Grid>
            <div className="mt-3.5"><DealField path="exp.packing" label="포장 방법" placeholder="예: Export carton with foam, ISPM-15 pallet" /></div>
            <p className="mt-3 text-[13px] text-[#6e6e73]">인보이스에 들어갈 전체 중량: N.W. {W.nwTotal ?? "—"} / G.W. {W.gwTotal ?? "—"} {deal.exp.gwUnit}{W.per ? ` (1개당 값 × ${deal.exp.packages || "?"}개)` : ""}. 포장 후 실측한 값만 적으세요.</p>
          </>)}

          {S("service", 6, <Grid>
            <DealField path="service.installBy" label="설치 담당" /><DealField path="service.install" label="설치 합의 내용" />
            <DealField path="service.trainingBy" label="교육 담당" /><DealField path="service.training" label="교육 합의 내용" />
            <DealField path="service.asBy" label="A/S 담당" /><DealField path="service.warranty" label="보증·A/S 합의 내용" />
            <DealField path="service.notes" label="메모" type="textarea" wide />
          </Grid>)}

          {S("local", 7, <>
            <Check path="local.enabled" label="현지 판매(파트너 → 병원)도 관리하기" />
            {deal.local.enabled && <div className="mt-4">
              <p className="mb-3 text-[13px] text-[#6e6e73]">현지 판매는 수출 거래와 별개의 계약이에요. 현지 가격은 수출가에 환율을 곱해 만들지 않고, 파트너가 준 값이나 팀이 정한 모의 값만 써요.</p>
              <Grid cols={3}>
                <DealField path="local.currency" label="현지 통화" type="select" options={CUR} />
                <DealField path="local.priceBasis" label="현지 가격의 출처" type="select" options={[["", "선택"], ["partner", "파트너 제공"], ["mock", "팀 모의 설정"]]} evidence="local.lines" onEvidence={setEv} />
                <DealField path="local.vatPct" label="부가세율" type="number" suffix="%" />
              </Grid>
              <Sub>현지 견적 품목</Sub>
              <div className="space-y-2" id={fieldId("local.lines")} tabIndex={-1}>
                {deal.local.lines.map((l, i) => (
                  <div key={l.id} className="grid grid-cols-[minmax(0,1fr)_60px_32px] sm:grid-cols-[minmax(0,1fr)_60px_60px_150px_32px] items-center gap-2">
                    <CellInput path={`local.lines.${l.id}.desc`} label={`현지 품목 ${i + 1}`} placeholder="품목 (설치·교육 포함 여부 등)" />
                    <CellInput path={`local.lines.${l.id}.qty`} label={`현지 품목 ${i + 1} 수량`} type="number" placeholder="수량" />
                    <span className="hidden sm:block"><CellInput path={`local.lines.${l.id}.unit`} label={`현지 품목 ${i + 1} 단위`} /></span>
                    <CellInput path={`local.lines.${l.id}.price`} label={`현지 품목 ${i + 1} 가격`} type="number" placeholder={deal.local.currency} className="col-span-2 sm:col-span-1" />
                    <DelBtn onClick={() => remove("local.lines", l.id)} label={`현지 품목 ${i + 1} 삭제`} />
                  </div>
                ))}
              </div>
              <AddBtn onClick={() => add("local.lines", { desc: "", qty: "1", unit: "set", price: "" })}>품목 추가</AddBtn>
              <p className="mt-2 text-right text-[14px] tabular-nums">공급가 {L.net !== null ? fmtMoney(L.net, deal.local.currency) : "—"} · 부가세 {L.vatMinor !== null ? fmtMoney(L.vatMinor, deal.local.currency, { bare: true }) : "—"} · <b>합계 {L.total !== null ? fmtMoney(L.total, deal.local.currency) : "—"}</b></p>
              <Sub>현지 결제 일정</Sub>
              <PaymentRows base="local.payment" cur={deal.local.currency} sched={L.pay} />
              <div className="mt-4"><Grid cols={3}>
                <DealField path="local.quoteNo" label="현지 견적 번호" /><DealField path="local.quoteDate" label="현지 견적일" type="date" /><DealField path="local.validityDays" label="유효기간" type="number" suffix="일" />
              </Grid></div>
              <div className="mt-3.5"><Grid><DealField path="local.delivery" label="인도 조건" placeholder="예: after deposit, subject to customs release" /><DealField path="local.acceptance" label="검수 조건" /></Grid></div>
            </div>}
          </>)}

          {S("docs", 8, <>
            <Sub first>서류 번호와 날짜</Sub>
            <Grid>
              <DealField path="exp.quoteNo" label="견적서 번호" /><DealField path="exp.quoteDate" label="견적일" type="date" />
              <DealField path="exp.invoiceNo" label="인보이스 번호" /><DealField path="exp.invoiceDate" label="인보이스 날짜" type="date" />
              <DealField path="exp.origin" label="원산지" /><DealField path="exp.destination" label="도착 국가·도시" />
              <DealField path="exp.remarks" label="견적서 비고" type="textarea" wide />
            </Grid>
            <Sub>인보이스만 다르게 적을 조건</Sub>
            <Check path="exp.invoiceOverride.on" label="인보이스의 인도조건을 견적서와 다르게 적기" />
            {deal.exp.invoiceOverride.on && <div className="mt-3"><Grid cols={3}>
              <DealField path="exp.invoiceOverride.incoterm" label="인보이스 인도조건" type="select" options={[["", "선택"], ...INCOTERMS]} />
              <DealField path="exp.invoiceOverride.place" label="인보이스 지정 장소" />
              <DealField path="exp.invoiceOverride.reason" label="변경 사유" placeholder="예: 파트너 요청으로 FCA로 변경 (11/20 메일)" />
            </Grid></div>}
            <Sub>메일과 발신자 서명</Sub>
            <Grid>
              <DealField path="email.toName" label="받는 사람 (호칭)" placeholder="예: Mr. Tan" /><DealField path="email.toEmail" label="받는 사람 이메일" type="email" />
              <DealField path="email.subject" label="제목" placeholder="비우면 견적 번호로 만들어요" wide />
              <DealField path="email.intro" label="첫 문단" type="textarea" wide placeholder="비우면 기본 문장을 써요" />
              <DealField path="email.senderName" label="발신자 이름" /><DealField path="email.senderTitle" label="직함" />
              <DealField path="email.senderOrg" label="소속 회사" /><DealField path="email.senderEmail" label="발신자 이메일" type="email" />
              <DealField path="email.senderPhone" label="발신자 전화" />
            </Grid>
          </>)}
        </div>
        <aside className={cn("min-w-0 pt-4 pb-10 xl:sticky xl:top-[64px] xl:max-h-[calc(100svh-64px)] xl:overflow-y-auto xl:border-l xl:border-[var(--line)] xl:pl-6", mobileView !== "preview" && "hidden xl:block")} aria-label="서류 미리보기">
          <PreviewPane />
        </aside>
      </div>
      <EvidencePanel open={!!ev} path={ev} onOpenChange={(o) => !o && setEv(null)} />
    </div>
  );
}
