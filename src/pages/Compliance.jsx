import { useState } from "react";
import { Copy, ExternalLink, Hash, Landmark, MessageCircleQuestion, ScanSearch, ShieldCheck, Timer, Save } from "lucide-react";
import { profile, load, useStored } from "../lib/store.js";
import { addLog } from "../lib/store.js";
import { Badge, Button, Callout, Card, CardHeader, CheckList, Chip, Field, Input, Select, Table, Textarea, cx } from "../components/ui.jsx";
import { PageHeader, StepPager, useApp } from "../components/shell.jsx";

// 나라별 기본 정보 (공개 제도 기준). 목록에 없는 나라는 '다른 나라' 틀을 씁니다
const KNOWN_C = {
  인도네시아: {
    fta: [["mfn", "일반 세율 (MFN)", "불필요"], ["cepa", "한-인니 CEPA", "IK-CEPA 원산지증명서"], ["akfta", "한-아세안 FTA", "Form AK"], ["rcep", "RCEP", "RCEP 원산지증명서"]],
    note: "협정마다 세율이 다를 수 있어요. 가장 낮은 세율과 그 협정의 원산지 기준을 FTA 포털에서 함께 확인하세요.",
    ce: [false, "CE는 필수가 아니에요.", "AKL(보건부 의료기기 판매허가)은 현지 유통사가 식약처 허가·ISO 13485 등으로 신청해요. 해외 인증이 있으면 심사·병원 구매에 도움이 돼요."],
    steps: [["현지 유통사 정하기 · 위임장(LoA)", "의료기기 유통 허가를 가진 회사", 0.5, 1], ["서류 준비", "식약처 허가증·자유판매증명, ISO 13485, 기술문서, 인니어 라벨", 1, 2], ["AKL 신청·심사", "등급에 따라 기간이 달라요", 2, 6], ["할랄 규정 대상인지 확인", "의료기기 단계적 의무화", 0, 1, true], ["첫 선적 · 수입통관", "거래조건에 따라 책임이 나뉘어요", 0.5, 1]],
    links: [["INSW · 인도네시아 관세율", "https://www.insw.go.id/", "세번·세율"], ["Regalkes · 보건부 의료기기 등록", "https://regalkes.kemkes.go.id/", "AKL·등급"]],
  },
  일본: {
    fta: [["mfn", "일반 세율 (MFN)", "불필요"], ["rcep", "RCEP", "RCEP 원산지증명서"]],
    note: "일반 세율이 이미 낮으면 원산지증명서를 준비할 이유가 줄어요. 두 세율을 모두 확인하세요.",
    ce: [false, "CE는 필요 없지만 일정이 길어요.", "일본 내 제조판매업자(MAH)와 등급별 인증·승인이 필요해서 1년 넘게 걸릴 수 있어요."],
    steps: [["일본 제조판매업자(MAH) 정하기", "현지 파트너가 허가 주체", 1, 3], ["외국제조업자 등록", "PMDA", 1, 3, true], ["인증(RCB) 또는 PMDA 승인", "등급·기준에 따라 경로가 달라요", 6, 18], ["QMS 적합성 조사", "심사와 함께 진행", 3, 6, true], ["판매 시작", "보험 적용은 따로 확인", 0.5, 1]],
    links: [["Japan Customs · 실행관세율표", "https://www.customs.go.jp/english/tariff/", "세번·세율"], ["PMDA (영문)", "https://www.pmda.go.jp/english/", "인증·승인 절차"]],
  },
  홍콩: {
    fta: [["free", "무관세 (자유항)", "불필요", 0]],
    note: "홍콩은 일반 수입관세가 없어요. 대신 의료기기 등재(MDACS)가 핵심이에요.",
    ce: [true, "해외 승인 서류가 중요해요.", "MDACS는 자율 등재이고 현지 책임자(LRP)가 필요해요. 한국 식약처 허가를 인정 자료로 쓸 수 있는지 홍콩 의료기기과(MDD) 안내로 확인하세요."],
    steps: [["해외 승인 서류 정리", "식약처 허가, CE·FDA 등 보유한 것", 0.5, 1], ["현지 책임자(LRP) 정하기", "현지 유통사가 맡는 경우가 많아요", 0.5, 1, true], ["MDACS 등재 신청·심사", "등급별 요건 확인", 3, 6], ["판매 시작", "수입관세 없음", 0.5, 1]],
    links: [["홍콩 위생서 의료기기과 (MDD)", "https://www.mdd.gov.hk/", "MDACS 요건"], ["Hong Kong Customs", "https://www.customs.gov.hk/", "관세 없음 확인"]],
  },
};
const GENERIC = {
  fta: [["mfn", "일반 세율 (MFN)", "불필요"], ["fta1", "FTA·협정 1", "협정별 원산지증명서"], ["fta2", "FTA·협정 2", "협정별 원산지증명서"]],
  note: "FTA 포털에서 이 나라와 맺은 협정을 찾아 세율을 비교하세요.",
  ce: [false, "나라마다 달라요.", "01 수출 준비 진단의 인증·규제 문항(D1–D7)을 먼저 확인하고, 아래 기간을 규제기관 자료로 고치세요."],
  steps: [["현지 파트너·등록 명의자 정하기", "유통사·수입자·현지 대리인", 1, 2], ["서류 준비", "식약처 허가, ISO 13485, 기술문서, 현지어 라벨", 1, 3], ["인허가 신청·심사", "제도·등급에 따라 달라요", 3, 12], ["특수 규정 확인", "전원·전파·할랄 등", 0.5, 2, true], ["첫 선적 · 수입통관", "거래조건에 따라 책임 구분", 0.5, 1]],
  links: [["WTO Tariff & Trade Data", "https://ttd.wto.org/", "나라별 일반 세율"]],
};
const COMMON_LINKS = [
  ["UNI-PASS · 관세청", "https://unipass.customs.go.kr/", "HS 세번·수출신고"],
  ["FTA 포털 · 관세청", "https://www.customs.go.kr/ftaportalkor/main.do", "협정 세율·원산지 기준"],
  ["식약처 의료기기 전자민원", "https://emedi.mfds.go.kr/", "국내 허가 확인"],
  ["KOTRA 해외시장뉴스", "https://dream.kotra.or.kr/", "나라별 인증·규제 정보"],
  ["FDA 510(k) DB", "https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm", "미국 허가 여부"],
];
const HEADINGS = [["9018", "내과·외과·치과·수의과용 기기 (전기 진단기기 포함)"], ["9019", "기계요법·마사지 기기, 호흡 치료기"], ["9021", "정형외과용 기기, 인공 신체 부분, 보청기"], ["9022", "X선·방사선을 쓰는 기기"], ["9402", "의료용 가구 (수술대, 진료 의자, 카트 등)"]];
const info = (c) => KNOWN_C[c] || GENERIC;
const fmtM = (n) => Math.round(n * 10) / 10;

/* AI 답 검사 */
const RULES = [
  { k: "HS 코드", re: /\b\d{4}\.\d{2}(?:[.\-]?\d{2,4})*\b|HS ?코드|세번/gi, where: "UNI-PASS 세번 조회, 수출신고필증, 수입국 관세율표" },
  { k: "세율·관세", re: /\d+(?:\.\d+)?\s?%|관세|세율|duty|tariff/gi, where: "수입국 관세청 관세율표, FTA 포털" },
  { k: "FTA·원산지", re: /FTA|CEPA|RCEP|원산지|Form ?AK|PSR/gi, where: "FTA 포털 (협정 세율·원산지 기준)" },
  { k: "인증·허가", re: /\bCE\b|FDA|510\(k\)|PMDA|AKL|MDACS|인증|허가|등록|등급|\bClass\b/gi, where: "수입국 규제기관, 식약처, 회사 인증서" },
  { k: "시장 숫자", re: /USD|\$\s?\d|억|백만|million|billion|점유율|증가율|시장 ?규모/gi, where: "UN Comtrade, ITC Trade Map, K-stat, KOTRA" },
  { k: "법·규정", re: /법률|법령|규정|의무화?|\bregulations?\b|\blaw\b|decree/gi, where: "수입국 정부 원문, KOTRA 해외시장뉴스" },
];
const KNOWN = [
  { re: /AKL[^.。\n]{0,30}\bCE\b|\bCE\b[^.。\n]{0,30}(있어야|필수|required)[^.。\n]{0,20}AKL/i, msg: "인도네시아 AKL은 CE가 필수 조건이 아니에요. 원산국 허가(식약처)·ISO 13485 등으로 신청해요 (Regalkes에서 확인)." },
  { re: /한국[^.。\n]{0,15}관세율|HSK[^.。\n]{0,20}\d+\s?%/, msg: "한국 관세율표 세율은 한국으로 들여올 때의 세율이에요. 수출할 때는 수입국 관세율표를 봐야 해요." },
  { re: /\bFOB\b[^.。\n]{0,30}(항공|air)|(항공|air)[^.。\n]{0,30}\bFOB\b/i, msg: "FOB는 배(해상) 전용 조건이에요. 항공이면 FCA가 맞아요." },
];
// 여러 규칙의 일치 부분을 한 번에 표시 (겹치면 먼저 시작한 쪽)
function highlight(txt) {
  const spans = [];
  RULES.forEach((r) => { for (const m of txt.matchAll(new RegExp(r.re.source, r.re.flags))) spans.push([m.index, m.index + m[0].length]); });
  spans.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const out = []; let pos = 0;
  spans.forEach(([a, b]) => { if (a < pos) return; out.push(txt.slice(pos, a), <mark key={a} className="bg-amber-100 text-amber-700 rounded px-0.5">{txt.slice(a, b)}</mark>); pos = b; });
  out.push(txt.slice(pos));
  return out;
}

export default function Compliance() {
  const { ask, copy, toast } = useApp();
  const P = profile();
  const mk = load("market", null);
  const names = mk && mk.names && Object.keys(mk.names).length ? ["c1", "c2", "c3"].map((k) => mk.names[k]).filter(Boolean) : (P.countries || "").split(/[,·]/).map((s) => s.trim()).filter(Boolean);
  const COUNTRIES = [...new Set([...(names.length ? names : ["인도네시아", "일본", "홍콩"]), "다른 나라"])];
  const [S, setS] = useStored("compliance", () => ({ c: COUNTRIES[0], hs: P.hs || "", how: "", by: {} }));
  const c = COUNTRIES.includes(S.c) ? S.c : COUNTRIES[0];
  const I = info(c);
  const st = S.by[c] || { tl: "", tlSrc: "", fta: {}, steps: I.steps.map((s) => ({ a: s[2], b: s[3] })) };
  const setSt = (patch) => setS({ ...S, c, by: { ...S.by, [c]: { ...st, ...patch } } });
  const fta = (id, fixed) => st.fta[id] || { r: fixed != null ? fixed : "", ok: fixed != null };
  const setFta = (id, fixed, patch) => setSt({ fta: { ...st.fta, [id]: { ...fta(id, fixed), ...patch } } });

  const vals = I.fta.map(([id, name, , fixed]) => ({ id, name, x: fta(id, fixed) })).filter(({ x }) => x.r !== "" && !isNaN(+x.r));
  const best = vals.slice().sort((a, b) => +a.x.r - +b.x.r)[0];

  // 인허가 일정: '동시에' 단계는 바로 앞 단계와 같이 시작
  let curA = 0, curB = 0, pA = 0, pB = 0;
  const rows = I.steps.map((s, k) => {
    const v = st.steps[k] || { a: s[2], b: s[3] }, par = s[4];
    const sa = par ? pA : curA, sb = par ? pB : curB, ea = sa + +v.a, eb = sb + +v.b;
    if (!par) { pA = sa; pB = sb; }
    curA = Math.max(curA, ea); curB = Math.max(curB, eb);
    return { s, v, sa, ea, eb, par };
  });
  const max = Math.max(6, Math.ceil(curB / 3) * 3);
  const setStep = (k, f, val) => {
    const steps = st.steps.map((x, j) => (j === k ? { ...x, [f]: Math.max(0, +val || 0) } : x));
    if (steps[k].b < steps[k].a) steps[k].b = steps[k].a;
    setSt({ steps });
  };
  const allOk = I.fta.every(([id, , , fixed]) => fta(id, fixed).ok && fta(id, fixed).r !== "");

  const [vq, setVq] = useState({ prompt: "", ai: "", src: "", fix: "", done: false });
  const vt = vq.ai.trim();
  const hits = RULES.map((r) => ({ r, m: [...new Set((vt.match(r.re) || []).map((s) => s.trim()))] })).filter((x) => x.m.length);
  const known = KNOWN.filter((k) => k.re.test(vt));

  const nm = c === "다른 나라" ? "(나라 이름)" : c;
  const prompt = `너는 의료기기 수출 규제 조사를 돕는 담당자다. 한국 ${P.company || "(회사)"}의 ${P.product || "(제품)"} (HS ${S.hs || "?"}, 한국 ${P.grade ? P.grade + "등급" : "등급 미상"})을 ${nm}에 수출하려 한다.
알려 줘:
1. ${nm}의 HS ${S.hs || "?"} 아래 8–10자리 세번 중 이 제품이 들어갈 후보와 근거
2. 그 세번의 일반 세율(MFN)과 ${I.fta.filter((f) => f[0] !== "mfn").map((f) => f[1]).join(", ") || "적용 가능한 협정"} 세율, 원산지 기준
3. 의료기기 판매허가 제도 이름, 예상 등급, 신청 주체(현지 대리인 필요 여부), 필요 서류, 표준 처리 기간
4. 한국 식약처 허가·ISO 13485만 있을 때 유리한 점과 부족한 점
규칙: 항목마다 공식 출처(기관명·문서명·URL)와 기준일을 붙여라. 모르면 "확인 필요"라고 써라. 한국 관세율표와 ${nm} 세율을 섞지 마라.`;
  const summary = () => [`[${c}] HS·관세·인증 요약`, `HS ${S.hs || "미정"} (${S.how || "확인 전"}) / ${c} 세번 ${st.tl || "미정"}`,
    ...I.fta.map(([id, name, co, fixed]) => { const x = fta(id, fixed); return `${name}: ${x.r === "" ? "미정" : x.r + "%"} · ${co}${x.ok ? " · 확인" : " · 확인 전"}`; }),
    `인허가 (추정 ${fmtM(curA)}–${fmtM(curB)}개월):`, ...rows.map(({ s, v }) => `- ${s[0]}: ${v.a}–${v.b}개월${s[4] ? " (동시에)" : ""}`)].join("\n");

  return (
    <>
      <PageHeader
        path="/compliance"
        desc="고른 나라에 팔려면 무엇이 필요한지 확인해요. HS 코드 → 관세 → 의료기기 인허가 순서로, AI 답을 공식자료와 맞춰 보는 검사기도 함께 있어요."
        guide={[["이 페이지에서", "HS 코드, 관세, 인허가 기간을 정리합니다."], ["준비물", "제품 설명서, 식약처 허가증, (있으면) 수출신고필증"], ["다 하면", "'요약 복사'로 정리하고 05 홍보자료로 넘어가요."]]}
        actions={<>
          <Button variant="soft" icon={MessageCircleQuestion} onClick={() => ask(nm + " 조사 질문", prompt, "인증·규제")}>이 나라 조사 질문</Button>
          <Button variant="primary" icon={Copy} onClick={() => copy(summary(), "요약을 복사했어요")}>요약 복사</Button>
        </>}
      />

      <div className="flex flex-wrap items-center gap-2 mb-6 no-print">
        <span className="text-sm font-semibold text-ink-2 mr-1">수출할 나라</span>
        {COUNTRIES.map((x) => <Chip key={x} on={x === c} onClick={() => setS({ ...S, c: x })}>{x}</Chip>)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHeader icon={Hash} title="① HS 코드 정하기" desc="세금과 서류가 모두 이 번호로 정해져요. AI 답은 '후보'로만 쓰세요." />
          <div className="grid sm:grid-cols-2 gap-x-3">
            <Field label="HS 6자리"><Input value={S.hs} onChange={(e) => setS({ ...S, hs: e.target.value })} placeholder="예: 9018.90" /></Field>
            <Field label="어떻게 확인했나요?">
              <Select value={S.how} onChange={(e) => setS({ ...S, how: e.target.value })} options={[["", "아직 확인 전"], "수출신고필증", "관세평가분류원 품목분류 사전심사", "UNI-PASS 세번 조회", "관세사 확인"]} />
            </Field>
          </div>
          <ol className="grid gap-2.5 my-2">
            {[["류(2자리) 고르기", "의료기기는 대부분 제90류(광학·측정·의료용 기기)예요."], ["호(4자리) 비교하기", "아래 표에서 우리 제품의 원리·용도와 맞는 호를 고르고, 맞지 않는 호는 왜 아닌지 한 줄씩 적어요."], ["6자리 확정하기", "수출신고필증이 있으면 그 번호가 가장 확실해요. 처음이면 관세평가분류원 사전심사나 관세사에게 확인받아요."]].map(([t, d], k) => (
              <li key={t} className="flex gap-3">
                <span className="grid place-items-center size-7 shrink-0 rounded-lg bg-brand-50 text-brand-700 text-[13px] font-semibold">{k + 1}</span>
                <p className="text-sm"><b className="block">{t}</b><span className="text-ink-2">{d}</span></p>
              </li>
            ))}
          </ol>
          <Table className="mt-4" head={["헷갈리는 호", "무엇이 들어가나"]}>
            {HEADINGS.map(([h, d]) => <tr key={h}><td className="font-semibold tabular-nums">{h}</td><td>{d}</td></tr>)}
          </Table>
          <p className="text-[13px] text-muted-foreground mt-2">호의 범위는 관세법령정보포털·UNI-PASS의 호 해설 원문으로 확인하세요.</p>
        </Card>

        <Card>
          <CardHeader icon={Landmark} title={`② ${c} 관세 비교`} desc="일반 세율(MFN)과 FTA 세율을 따로 적고, 공식 사이트에서 확인한 줄에 체크하세요." />
          <div className="grid sm:grid-cols-2 gap-x-3">
            <Field label="수입국 세번 (8–10자리)"><Input value={st.tl} onChange={(e) => setSt({ tl: e.target.value })} placeholder="수입국 관세율표에서 조회" /></Field>
            <Field label="확인 자료"><Input value={st.tlSrc} onChange={(e) => setSt({ tlSrc: e.target.value })} placeholder="관세율표 이름·조회일" /></Field>
          </div>
          <Table head={["세율 종류", "세율 %", "원산지 서류", "확인"]}>
            {I.fta.map(([id, name, co, fixed]) => {
              const x = fta(id, fixed);
              return (
                <tr key={id} className={cx(best && best.id === id && "bg-brand-50/60")}>
                  <td className="font-semibold">{name}</td>
                  <td><Input type="number" step="any" placeholder="후보" value={x.r} disabled={fixed != null} onChange={(e) => setFta(id, fixed, { r: e.target.value })} className="w-20 h-9 px-2" /></td>
                  <td className="text-[13px] text-ink-2">{co}</td>
                  <td><input type="checkbox" className="size-4 accent-brand-600" checked={!!x.ok} onChange={(e) => setFta(id, fixed, { ok: e.target.checked })} aria-label="확인함" /></td>
                </tr>
              );
            })}
          </Table>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <Badge tone={best ? (best.x.ok ? "teal" : "amber") : "gray"}>{best ? `가장 낮은 세율 ${best.x.r}% · ${best.name}${best.x.ok ? "" : " (확인 전)"}` : "세율을 넣어 주세요"}</Badge>
            <span className="text-muted-foreground">{I.note}</span>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <CardHeader icon={Timer} title={`③ ${c} 의료기기 인허가 일정`} desc="단계별 기간은 추정값이에요. 규제기관 자료나 대행사 견적으로 고치면 전체 일정이 다시 계산돼요." />
          <div className="text-right">
            <p className="text-[28px] font-semibold text-brand-700 tabular-nums leading-none">{fmtM(curA)}–{fmtM(curB)}개월</p>
            <p className="text-[13px] text-muted-foreground mt-1">첫 판매까지 예상</p>
          </div>
        </div>
        <Callout tone={I.ce[0] ? "warn" : "ok"} title={I.ce[1]} className="mb-5">{I.ce[2]}</Callout>
        <div className="hidden md:grid grid-cols-[minmax(0,320px)_minmax(0,1fr)] gap-4 mb-1">
          <div />
          <div className="flex justify-between text-[11.5px] text-muted-foreground tabular-nums">{Array.from({ length: max / 3 + 1 }, (_, k) => <span key={k}>{k * 3}개월</span>)}</div>
        </div>
        <div className="grid gap-1">
          {rows.map((r, k) => (
            <div key={k} className="grid grid-cols-1 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] gap-x-4 gap-y-2 items-center py-3 border-t border-line">
              <div>
                <p className="font-semibold text-sm">{r.s[0]} {r.par && <Badge tone="blue">동시에</Badge>}</p>
                <p className="text-xs text-muted-foreground">{r.s[1]}</p>
                <div className="flex items-center gap-1.5 mt-1.5 text-[13px]">
                  <Input type="number" min="0" step="0.5" value={r.v.a} onChange={(e) => setStep(k, "a", e.target.value)} className="w-16 h-8 px-2" aria-label="최소 개월" />–
                  <Input type="number" min="0" step="0.5" value={r.v.b} onChange={(e) => setStep(k, "b", e.target.value)} className="w-16 h-8 px-2" aria-label="최대 개월" />
                  <span className="text-muted-foreground">개월 (추정)</span>
                </div>
              </div>
              <div className="relative h-7 rounded-lg bg-surface overflow-hidden">
                <div className="absolute inset-y-1 rounded-md bg-brand-600" style={{ left: (r.sa / max) * 100 + "%", width: Math.max(0.6, ((r.ea - r.sa) / max) * 100) + "%" }} />
                <div className="absolute inset-y-1 rounded-md bg-brand-200" style={{ left: (r.ea / max) * 100 + "%", width: Math.max(0, ((r.eb - r.ea) / max) * 100) + "%" }} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 flex gap-3"><span className="flex items-center gap-1.5"><i className="inline-block size-3 rounded bg-brand-600" />최소 기간</span><span className="flex items-center gap-1.5"><i className="inline-block size-3 rounded bg-brand-200" />길어질 수 있는 기간</span></p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 items-start">
        <Card>
          <CardHeader icon={ScanSearch} title="④ AI 답 검사" desc="ChatGPT 답을 붙여 넣으면 꼭 확인해야 할 부분(숫자·세율·HS·인증·법)에 표시하고, 어디서 확인하는지 알려 줘요." />
          <Field label="AI에게 한 질문"><Textarea value={vq.prompt} onChange={(e) => setVq({ ...vq, prompt: e.target.value })} placeholder="ChatGPT에 보낸 질문" className="min-h-20" /></Field>
          <Field label="AI 답"><Textarea value={vq.ai} onChange={(e) => setVq({ ...vq, ai: e.target.value, done: false })} className="min-h-28" placeholder="예: 인도네시아는 HS 9018.90에 5% 관세를 부과하며, CE 인증이 있어야 AKL 등록이 가능합니다." /></Field>
          <Button variant="primary" icon={ScanSearch} onClick={() => setVq({ ...vq, done: true, fix: vq.fix || known.map((k) => k.msg).join(" ") })}>검사하기</Button>
          {vq.done && (
            <div className="mt-5 grid gap-3">
              {!vt ? <p className="text-sm text-muted-foreground">AI 답을 붙여 넣어 주세요.</p> : (
                <>
                  {known.length > 0 && <Callout tone="warn" title="자주 나오는 오답과 비슷해요.">{known.map((k) => <p key={k.msg}>{k.msg}</p>)}</Callout>}
                  <div className="rounded-lg bg-surface px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">{highlight(vt)}</div>
                  <CheckList items={hits.length ? hits.map(({ r, m }) => ["warn", `${r.k} · ${m.slice(0, 5).join(", ")} → 확인할 곳: ${r.where}`]) : [["pass", "꼭 확인해야 할 내용은 찾지 못했어요. 요약·초안으로 써도 돼요."]]} />
                  <div className="grid sm:grid-cols-2 gap-x-3 mt-1">
                    <Field label="확인한 공식자료"><Input value={vq.src} onChange={(e) => setVq({ ...vq, src: e.target.value })} /></Field>
                    <Field label="고친 내용"><Input value={vq.fix} onChange={(e) => setVq({ ...vq, fix: e.target.value })} /></Field>
                  </div>
                  <Button className="justify-self-start" icon={Save} onClick={() => { const n = addLog({ part: hits.some((h) => h.r.k === "인증·허가") ? "인증·규제" : "HS·관세", prompt: vq.prompt, ai: vt.slice(0, 300), source: vq.src, fix: vq.fix }); toast(`AI 답 확인 기록에 저장했어요 (${n}건)`); }}>기록에 저장</Button>
                </>
              )}
            </div>
          )}
        </Card>
        <div className="grid gap-6">
          <Card>
            <CardHeader icon={ExternalLink} title="공식 확인처" desc="AI 답은 여기서 확인해요. 확인한 화면은 캡처해 두세요." />
            <ul className="grid gap-1.5">
              {[...I.links, ...COMMON_LINKS].map(([n, u, d]) => (
                <li key={u}><a href={u} target="_blank" rel="noopener" className="flex items-center justify-between gap-3 rounded-lg bg-surface hover:bg-brand-50 px-3.5 py-2.5 text-sm font-semibold">{n}<span className="text-xs font-normal text-muted-foreground text-right">{d}</span></a></li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader icon={ShieldCheck} title="점검" />
            <CheckList items={[
              [S.hs && S.how ? "pass" : "warn", S.hs ? `HS ${S.hs} · ${S.how || "공식 확인 전"}` : "HS 6자리를 아직 정하지 않았어요"],
              [st.tl ? "pass" : "warn", st.tl ? `${c} 세번 ${st.tl}` : `${c} 관세율표에서 8–10자리 세번을 찾아 적으세요`],
              [allOk ? "pass" : "warn", allOk ? "일반 세율과 FTA 세율 모두 확인했어요" : "확인하지 않은 세율이 있어요"],
              ["info", `인허가까지 약 ${fmtM(curA)}–${fmtM(curB)}개월 (추정). 규제기관 안내나 대행사 견적으로 바꾸세요.`],
              ["info", "한국 관세율표(한국으로 들여올 때 세율)와 수입국 세율을 섞지 않았는지 확인하세요."],
            ]} />
          </Card>
        </div>
      </div>

      <StepPager path="/compliance" />
    </>
  );
}
