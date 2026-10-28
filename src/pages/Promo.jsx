import { useMemo, useState } from "react";
import { Copy, Eraser, FileText, Film, Languages, Megaphone, Package, ShieldCheck, Sparkles, Store } from "lucide-react";
import { makeProduct } from "../lib/product.js";
import { clone } from "../lib/store.js";
import { Badge, Button, Card, CardHeader, CheckList, Doc, SectionTitle, Tabs } from "../components/ui.jsx";
import { PageHeader, StepPager, useApp } from "../components/shell.jsx";
import ProductForm from "../components/ProductForm.jsx";

const TOOLS = [["상품 소개문", "ChatGPT·Gemini (다국어)"], ["홍보 이미지", "Photoroom (모델·배경 합성)"], ["e-카탈로그", "Zeeditor"], ["숏폼 영상", "Runway"]];

export default function Promo() {
  const { ask, copy } = useApp();
  const PROD = useMemo(makeProduct, []);
  const [S, setRaw] = useState(PROD.get);
  const setS = (v) => { setRaw(v); PROD.save(v); };
  const [tab, setTab] = useState("listing");

  const certs = S.certs.split(",").map((s) => s.trim()).filter(Boolean);
  const usps = S.usps.filter((u) => u.t);
  const short2 = S.product.split(" ").slice(0, 2).join(" ");
  const listingText = `${S.oneliner}.

Key benefits
${usps.map((u) => "- " + u.t).join("\n")}

Certifications: ${certs.join(" · ")}
Specifications: ${S.spec}
HS code: ${S.hs}
Trade terms: ${S.terms}
Support: ${S.support}

Contact: ${S.contact}`;
  const snsText = `Looking for a reliable ${short2} partner in ${S.country}?

${S.oneliner}.

${usps.map((u) => "✔ " + u.t).join("\n")}

Certified: ${certs.join(", ")}.
We are now meeting ${S.buyer} in ${S.country}. Message us for a product sheet and sample-order terms.

${S.contact}
#${S.country.replace(/\s/g, "")} #MedicalDevice #B2B #Export`;
  const kw = [...new Set((S.product + " " + S.oneliner).toLowerCase().match(/[a-z][a-z-]{3,}/g) || [])].filter((w) => !["with", "unit", "system", "and", "for", "device"].includes(w)).slice(0, 8);
  const scenes = [
    ["0–5초", `${short2} 클로즈업`, `"${S.oneliner}."`],
    ["5–20초", "제품 사용 장면", usps[0] ? `"${usps[0].t}."` : ""],
    ["20–35초", "인증서·서류 화면", `"${certs.slice(0, 3).join(", ")}."`],
    ["35–50초", "교육·A/S 장면", usps[2] ? `"${usps[2].t}."` : `"${S.support}."`],
    ["50–60초", "로고 + 연락처", `"Sample orders for ${S.buyer} in ${S.country}. Contact ${S.contact}."`],
  ];
  const text = { listing: `Title: ${S.product}\nKeywords: ${kw.join(", ")}\n\n${listingText}`, sns: snsText, short: scenes.map((r) => r.join(" | ")).join("\n") }[tab];

  return (
    <>
      <PageHeader
        path="/promo"
        desc="제품 정보를 한 번 쓰면 바이코리아 등록문, LinkedIn 게시물, 1분 영상 대본을 만들어 줘요. 근거 없는 강점과 과장 표현은 바로 알려 줘요."
        guide={[["이 페이지에서", "바이어에게 보여 줄 영문 홍보 글을 만듭니다."], ["준비물", "영문 카탈로그나 제품 설명서, 인증서"], ["다 하면", "바이코리아에 등록하고 06 바이어 찾기로 넘어가요."]]}
        actions={<>
          <Button variant="soft" icon={Languages} onClick={() => ask("현지어 번역 질문", `아래 B2B 홍보 글을 ${S.country}에서 쓰는 언어로 번역해 줘.
규칙:
- 제품명, 모델명, 인증 이름, 숫자, 이메일은 바꾸지 마라.
- 효능을 부풀리거나 새 주장을 넣지 마라.
- 현지 병원·유통사 구매 담당자가 쓰는 자연스러운 존댓말로.
- 번역 아래에 어색해서 바꾼 부분을 표로 보여 줘.

[원문]
${text}`, "영문자료·홍보")}>현지어 번역 질문</Button>
          <Button variant="primary" icon={Copy} onClick={() => copy(text, "복사했어요")}>복사</Button>
        </>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <div className="grid grid-cols-1 gap-6 min-w-0">
          <div>
            <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[["listing", "바이코리아 등록문", Store], ["sns", "LinkedIn 게시물", Megaphone], ["short", "1분 영상 대본", Film]]} />
            <Card>
              {tab === "listing" && (
                <>
                  <SectionTitle>상품명</SectionTitle>
                  <p className="text-lg font-semibold">{S.product.slice(0, 80)}</p>
                  <SectionTitle>검색 키워드</SectionTitle>
                  <div className="flex flex-wrap gap-1.5">{kw.map((k) => <Badge key={k} tone="teal">{k}</Badge>)}</div>
                  <SectionTitle>상품 설명</SectionTitle>
                  <Doc>{listingText}</Doc>
                  <p className="text-[13px] text-muted-foreground mt-3">바이코리아는 제품 사진을 올리면 AI가 상품명·카테고리·설명을 자동으로 채워 줘요 (사례집 02-2). 자동 결과를 이 글로 고치면 돼요.</p>
                </>
              )}
              {tab === "sns" && (
                <div className="max-w-xl rounded-xl border border-line p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="grid place-items-center size-10 rounded-full bg-brand-600 text-white font-semibold">{(S.company || "?")[0]}</span>
                    <div><p className="font-semibold text-sm">{S.company}</p><p className="text-xs text-muted-foreground">LinkedIn 미리보기</p></div>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">{snsText}</div>
                </div>
              )}
              {tab === "short" && (
                <>
                  <ol className="grid gap-2">
                    {scenes.map(([t, v, n]) => (
                      <li key={t} className="grid sm:grid-cols-[80px_160px_minmax(0,1fr)] gap-x-4 gap-y-1 rounded-lg bg-surface px-4 py-3 text-sm">
                        <span className="font-semibold text-brand-700 tabular-nums">{t}</span>
                        <span className="text-ink-2">{v}</span>
                        <span>{n}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="text-[13px] text-muted-foreground mt-3">경상 AI무역지원센터는 '특장점 정리 → 1분 숏폼 → 바이어 발굴 → 화상상담'으로 73개사의 첫 수출을 도왔어요 (사례집 03). 효능을 약속하는 문구는 넣지 않았어요.</p>
                </>
              )}
            </Card>
          </div>
          <Card>
            <CardHeader icon={ShieldCheck} title="표현 점검" desc="의료기기 광고에서 문제 되기 쉬운 말과 근거 없는 강점을 찾아요." />
            <CheckList items={PROD.risky(S, listingText + "\n" + snsText)} />
          </Card>
          <Card tone="soft">
            <CardHeader icon={Sparkles} title="AI무역지원센터에서 무료로 만들 수 있는 것" desc="사례집 03: 전국 20개 센터가 상용 AI로 홍보물을 무료 제작해요. 여기서 만든 글을 들고 가면 빨라요." />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {TOOLS.map(([a, b]) => <div key={a} className="rounded-lg bg-white px-3.5 py-3 text-sm"><b className="block">{a}</b><span className="text-ink-2">{b}</span></div>)}
            </div>
          </Card>
        </div>

        <Card className="lg:sticky lg:top-8">
          <CardHeader icon={Package} title="제품 정보" desc="영문으로 한 번만 쓰면 06 바이어·상담에서도 써요." />
          <ProductForm PROD={PROD} S={S} setS={setS} keys={["company", "product", "oneliner", "country", "buyer", "certs", "usps", "spec", "terms", "support", "contact", "hs"]} />
          <div className="flex gap-2">
            <Button size="sm" icon={FileText} onClick={() => setS(clone(PROD.SAMPLE))}>가상 예시</Button>
            <Button size="sm" variant="ghost" icon={Eraser} onClick={() => setS(clone(PROD.BLANK))}>비우기</Button>
          </div>
        </Card>
      </div>

      <StepPager path="/promo" />
    </>
  );
}
