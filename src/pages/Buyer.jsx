import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, FileSearch, Mic, NotebookPen, Package, Plus, ShieldCheck, Sparkles, Users } from "lucide-react";
import { makeProduct } from "../lib/product.js";
import { Badge, Button, Card, CardHeader, CheckList, Doc, Input, SectionTitle, Select, Table, Tabs } from "../components/ui.jsx";
import { PageHeader, StepPager, useApp } from "../components/shell.jsx";
import ProductForm from "../components/ProductForm.jsx";

// 사례집 08-2 AI 수출 부스터의 바이어 고르는 기준. 현지 확인 전에는 연락하지 않는다
const SV = [
  ["f", "1년 선적 횟수", ["1–2회", "분기 1회", "월 1회 이상"]],
  ["q", "한 번 물량 vs 우리 최소 주문", ["너무 큼", "조금 큼", "맞음"]],
  ["s", "공급처 수", ["1곳 (독점)", "2곳", "3곳 이상"]],
  ["d", "주 공급처 비중", ["늘어남", "그대로", "줄어듦 (바꿀 신호)"]],
  ["v", "현지 확인", ["안 함", "홈페이지·등록번호", "무역관·파트너 확인"]],
];
const FLOW = [["매칭 신청", "영문 제품 설명으로 비슷한 제품을 실제 수입한 바이어 찾기"], ["바이어 고르기", "선적 횟수·물량·공급처로 점수 매기고 현지 확인"], ["화상상담", "질문 순서와 예상 반론 준비"], ["상담일지·후속", "요약 → 보완 → 다시 상담"]];
const total = (b) => SV.reduce((a, [k]) => a + (+b[k] || 1), 0);
const AD = /\b(innovative|premium|leading|advanced|high-end|best|unique|only|world-class|cutting-edge)\b/i;

export default function Buyer() {
  const { ask, copy } = useApp();
  const PROD = useMemo(makeProduct, []);
  const [S, setRaw] = useState(PROD.get);
  const setS = (v) => { setRaw(v); PROD.save(v); };
  const [tab, setTab] = useState("match");

  const certs = S.certs.split(",").map((s) => s.trim()).filter(Boolean);
  const usps = S.usps.filter((u) => u.t);
  // 사례집 08-1: 실거래(B/L) 매칭은 우리 제품 설명과 바이어 수입품 설명의 '뜻이 얼마나 비슷한지'로 바이어를 찾는다.
  // 그래서 광고 문구가 아니라 "무엇을, 어디에, 누가 쓰는지"를 쓴다.
  const matchText = `This product is the ${S.product}, used for ${S.use}. It consists of a ${S.build}. Main specifications: ${S.spec}. It is manufactured by ${S.company} in the Republic of Korea and exported under HS ${S.hs}.`;
  const wc = matchText.split(/\s+/).length;
  const callText = `1. 인사 (1분)
"Thank you for your time. I am with ${S.company}. May I ask how your team currently handles [the need this product solves]?"

2. 바이어 상황 듣기 (3분)
- How many clinics or sites would use it?
- What do you check first when buying: registration, price, or service?
- Who approves the purchase, and what documents do they need?

3. 제안 (3분)
${usps.map((x, k) => `- Point ${k + 1}: ${x.t}${x.ev ? " (show: " + x.ev + ")" : ""}`).join("\n")}
- Terms: ${S.terms}

4. 예상 반론
- "Price is higher than other brands" → compare total cost incl. service and downtime; offer a sample order.
- "Is it registered here?" → explain the registration plan and the documents we provide (${certs.slice(0, 2).join(", ")}).
- "Who repairs it?" → ${S.support}.

5. 다음 단계 (1분)
"Could we send a quotation and arrange a demo within two weeks?"
→ 상담 후 24시간 안에 요약 메일 + 견적서 보내기`;
  const d = new Date(), ds = d.toISOString().slice(0, 10), due = new Date(d.getTime() + 7 * 864e5).toISOString().slice(0, 10);
  const logText = `[상담일지] ${ds}
바이어: (회사 · 담당자 · 직함)   방식: 화상 / 전시 / 상담회
제품: ${S.product} → ${S.country}

1. 상담 요약 (3줄)
-
2. 바이어가 원한 것
- 인증·등록:
- 가격·조건 (지금 제안: ${S.terms}):
- 교육·A/S (지금 제안: ${S.support}):
3. 우리가 약속한 것 · 담당 · 기한
- 견적서 · (담당) · 24시간 안
- 보완 자료 (인증서 사본·카탈로그) · (담당) · ${due}
4. 다음 상담 준비
-
5. 지금 단계: 첫 만남 → 상담 → 샘플·견적 → 계약 중 (   )`;
  const mailText = `Subject: Follow-up on our meeting – ${S.product}

Dear [Name],

Thank you for meeting us on ${ds}. Here is a short summary:
- Your main questions: [registration / price / service]
- What we will send: quotation (within 24 hours) and [documents] by ${due}

Next step: a follow-up call or product demo within two weeks.
Please let us know a convenient time.

Best regards,
${S.company}
${S.contact}`;
  const screenText = ["바이어,선적횟수,물량,공급처수,공급처비중,현지확인,합계"].concat(S.buyers.map((b) => [b.n, ...SV.map(([k]) => b[k]), total(b)].join(","))).join("\n");
  const text = { match: matchText, screen: screenText, call: callText, minute: logText + "\n\n---\n\n" + mailText }[tab];

  const setBuyer = (i, k, v) => setS({ ...S, buyers: S.buyers.map((b, j) => (j === i ? { ...b, [k]: v } : b)) });
  const ck = [];
  if (tab === "match") {
    const m = matchText.match(AD);
    ck.push(m ? ["warn", `"${m[0]}"은 광고 문구예요. 매칭 정확도를 떨어뜨려요.`] : ["pass", "꾸밈말 없이 용도·구성 중심으로 썼어요."]);
    if (!S.use) ck.push(["warn", "'어디에 쓰나요'가 비어 있어요. 매칭에 가장 중요해요."]);
    if (!S.build) ck.push(["warn", "'무엇으로 구성되나요'가 비어 있어요."]);
  } else if (tab === "screen") {
    const hold = S.buyers.filter((b) => (+b.v || 1) === 1).length;
    ck.push(hold ? ["info", `현지 확인 안 한 바이어 ${hold}곳은 연락을 미뤄요. 무역관·현지 파트너에게 실재를 확인하세요.`] : ["pass", "모든 바이어를 현지 확인했어요."]);
    ck.push(["info", "첫 거래 전에 결제 계좌 변경 요청 같은 무역사기 신호가 없는지 확인하세요."]);
  } else ck.push(...PROD.risky(S, text));

  const screenPrompt = `너는 ${S.country} 의료기기 수입 바이어를 고르는 분석 담당자다.
우리 제품: ${S.product} (HS ${S.hs}) · ${S.use}
우리 조건: ${S.terms}

아래 통관(B/L) 데이터에서 바이어별로 표를 만들어 줘.
1) 최근 12개월 선적 횟수와 최근 선적일
2) 한 번 평균 물량(무게·금액)과 우리 최소 주문량과의 차이
3) 공급처 수와 상위 공급처 비중, 작년보다 비중이 늘었는지 줄었는지
4) 우리 제품과 품목 설명이 얼마나 비슷한지 (같음/비슷/다름 + 이유)
5) 공급처를 바꿀 가능성이 높은 바이어 3곳과 근거
규칙: 데이터에 없는 값은 "데이터 없음"으로 쓰고 추측하지 마라. 바이어가 실제로 있는 회사인지는 판단하지 마라 (무역관·현지 파트너로 따로 확인한다).

[통관 데이터 붙여 넣기]
`;

  return (
    <>
      <PageHeader
        path="/buyer"
        desc="KOTRA가 바이어를 찾고 상담을 이어 가는 방식(사례집 07·08)을 그대로 따라 해요. 매칭 신청용 영문 제품 설명 → 바이어 고르기 → 상담 대본 → 상담일지까지 이어져요."
        guide={[["이 페이지에서", "바이어 매칭 신청부터 상담 후속까지 준비합니다."], ["준비물", "제품 용도·구성(영문), 받은 바이어 목록"], ["다 하면", "07 견적서·인보이스로 넘어가요."]]}
        actions={<Button variant="primary" icon={Copy} onClick={() => copy(text, "복사했어요")}>복사</Button>}
      />

      <ol className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-6">
        {FLOW.map(([t, d], k) => {
          const on = ["match", "screen", "call", "minute"][k] === tab;
          return (
            <li key={t}>
              <button type="button" onClick={() => setTab(["match", "screen", "call", "minute"][k])}
                className={"w-full h-full text-left rounded-2xl border px-4 py-3 transition cursor-pointer " + (on ? "border-brand-500 bg-brand-50/50 ring-2 ring-brand-100" : "border-line bg-white hover:border-brand-200")}>
                <span className="text-[12px] font-bold text-brand-700">STEP {k + 1}</span>
                <p className="font-bold mt-0.5">{t}</p>
                <p className="text-[13px] text-ink-2 mt-0.5 leading-snug">{d}</p>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="grid gap-6 min-w-0">
          <div>
            <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[["match", "① 매칭용 제품 설명", FileSearch], ["screen", "② 바이어 고르기", Users], ["call", "③ 상담 대본", Mic], ["minute", "④ 상담일지·후속 메일", NotebookPen]]} />
            <Card>
              {tab === "match" && (
                <>
                  <SectionTitle>KOTRA 바이어 매칭 신청 필수 4가지</SectionTitle>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {[["사업자등록번호", "신청서에 직접 적어요", "info"], ["HS 코드 6자리", S.hs || "비어 있음", S.hs ? "ok" : "warn"], ["영문 수출제품 설명", wc + "단어", wc >= 40 && wc <= 120 ? "ok" : "warn"], ["진출 희망 국가", S.country || "비어 있음", S.country ? "ok" : "warn"]].map(([a, b, t]) => (
                      <div key={a} className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3.5 py-2.5">
                        <div><p className="font-semibold text-[14px]">{a}</p><p className="text-[13px] text-muted">{b}</p></div>
                        <Badge tone={t === "ok" ? "teal" : t === "warn" ? "amber" : "blue"}>{t === "ok" ? "준비됨" : t === "warn" ? "보완" : "직접"}</Badge>
                      </div>
                    ))}
                  </div>
                  <SectionTitle>매칭용 영문 제품 설명</SectionTitle>
                  <Doc>{matchText}</Doc>
                  <p className="text-[13px] text-muted mt-3">AI가 이 문장과 실제 수입 바이어의 선하증권(B/L) 품목 설명을 비교해 비슷한 바이어 20곳을 추천해요. 2025년 129개사에 바이어 2,473곳을 연결해 6개국 15건 계약이 나왔어요 (사례집 08-1). 꾸밈말보다 용도·사용처·구성을 정확히 쓰세요.</p>
                </>
              )}
              {tab === "screen" && (
                <>
                  <p className="text-[14px] text-ink-2 mb-3">KOTRA 매칭이나 통관 데이터 서비스(Export Genius·Abrams 등)로 받은 바이어를 같은 기준으로 점수 매겨요. <b>현지 확인을 '안 함'이면 점수와 상관없이 연락하지 않아요.</b></p>
                  <Table head={["바이어", ...SV.map((v) => v[1]), { label: "합계", num: true }, "판단"]}>
                    {S.buyers.map((b, i) => {
                      const tot = total(b), hold = (+b.v || 1) === 1;
                      return (
                        <tr key={i}>
                          <td><Input value={b.n} onChange={(e) => setBuyer(i, "n", e.target.value)} className="min-w-28 h-9 px-2 text-[13.5px]" /></td>
                          {SV.map(([k, , opt]) => (
                            <td key={k}><Select value={b[k]} onChange={(e) => setBuyer(i, k, +e.target.value)} className="h-9 text-[13px] min-w-32 px-2" options={opt.map((o, j) => [j + 1, `${j + 1} · ${o}`])} /></td>
                          ))}
                          <td className="text-right font-bold tabular-nums whitespace-nowrap">{tot}/15</td>
                          <td>{hold ? <Badge tone="dark">연락 보류</Badge> : tot >= 12 ? <Badge tone="teal">먼저 연락</Badge> : <Badge tone="amber">검토</Badge>}</td>
                        </tr>
                      );
                    })}
                  </Table>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button size="sm" icon={Plus} onClick={() => setS({ ...S, buyers: [...S.buyers, { n: "Buyer " + String.fromCharCode(65 + S.buyers.length), f: 1, q: 1, s: 1, d: 2, v: 1 }] })}>바이어 추가</Button>
                    <Button size="sm" variant="soft" icon={Sparkles} onClick={() => ask("통관 데이터 바이어 분석 질문", screenPrompt, "바이어·상담")}>통관 데이터 분석 질문</Button>
                  </div>
                  <p className="text-[13px] text-muted mt-3">기준 출처: KOTRA 'AI 수출 부스터'. 알제무역관은 바이어의 공급처 비중 변화를 포착해 끊긴 거래를 되살렸어요 (62만 달러, 사례집 08-2).</p>
                </>
              )}
              {tab === "call" && (
                <>
                  <Doc>{callText}</Doc>
                  <p className="text-[13px] text-muted mt-3">KOTRA 상담회는 AI 통번역 자막을 휴대폰으로 보여 줘요 (사례집 07). 통역이 없을 때는 이 대본을 짧은 문장으로 유지하세요.</p>
                </>
              )}
              {tab === "minute" && (
                <>
                  <SectionTitle>상담일지</SectionTitle>
                  <Doc>{logText}</Doc>
                  <SectionTitle>후속 메일</SectionTitle>
                  <Doc>{mailText}</Doc>
                  <p className="text-[13px] text-muted mt-3">KOTRA는 상담 음성을 바로 글로 바꿔 일지를 만들고, 상담 요약·진출 전략·다음 준비 사항을 담은 진단보고서를 기업에 줘요. 녹음을 AI로 요약할 때는 바이어 동의를 받으세요.</p>
                </>
              )}
            </Card>
          </div>
          <Card>
            <CardHeader icon={ShieldCheck} title="점검" />
            <CheckList items={ck} />
          </Card>
        </div>

        <Card className="lg:sticky lg:top-8">
          <CardHeader icon={Package} title="제품 정보" desc="05 홍보자료와 같은 정보예요." />
          <ProductForm PROD={PROD} S={S} setS={setS} keys={["product", "country", "hs", "use", "build", "spec", "terms", "support"]} />
          <Button as={Link} to="/promo" size="sm">강점·인증 고치기 →</Button>
        </Card>
      </div>

      <StepPager path="/buyer" />
    </>
  );
}
