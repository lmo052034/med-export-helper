import { useMemo, useState } from "react";
import { AlertTriangle, Copy, FileSpreadsheet, Mail, MessageCircleQuestion, Printer, Receipt, RotateCcw, ShieldCheck, Columns3 } from "lucide-react";
import { makeProduct } from "../lib/product.js";
import { clone, fmtUSD, useStored } from "../lib/store.js";
import { Badge, Button, Card, CardHeader, CheckList, Field, Input, Select, Tabs, Textarea, cx } from "../components/ui.jsx";
import { PageHeader, StepPager, useApp } from "../components/shell.jsx";

const SEA_ONLY = ["FAS", "FOB", "CFR", "CIF"];
const NEEDS_FREIGHT = ["CFR", "CIF", "CPT", "CIP", "DAP"];
const NEEDS_INS = ["CIF", "CIP"];
const usd = (n) => fmtUSD(n, 2);

function makeDefault(PR) {
  // 가상 예시 (실제 기업·바이어 아님). 모든 값은 'Assumed for simulation'
  return {
    seller: { co: PR.company || "Hangyeol Medical Co., Ltd. (sample)", addr: "123 Sample-ro, Seongnam-si, Gyeonggi-do, Republic of Korea", tel: "+82-31-000-0000", email: PR.contact || "export@hangyeol-medical.example" },
    buyer: { co: "Sample Medical Distribution Co. (sample)", name: "Alex Tan", title: "Purchasing Manager", sal: "Mr. Tan", email: "purchasing@buyer.example", addr: (PR.country || "Indonesia") + " (address)" },
    items: [
      { model: PR.product || "HG-200 TENS Electrotherapy Device", desc: (PR.build || "Main unit with accessories").slice(0, 90), qty: 10, unit: 450, hs: PR.hs || "9018.90" },
      { model: "Spare electrode pads (pack of 10)", desc: "Consumable", qty: 20, unit: 12, hs: PR.hs || "9018.90" },
    ],
    inco: "FCA", place: "Incheon Airport, Korea", mode: "air", pay: "T/T 30% deposit, 70% before shipment", freight: "", ins: "", sellerClear: true,
    lead: "3 weeks after receipt of deposit", valid: 30,
    qno: "Q-2611-001", qdate: "2026-11-02", ino: "CI-2611-001", idate: "2026-11-30",
    dest: PR.country || "Indonesia", reg: "medical device", market: "supplies " + (PR.buyer || "clinics and hospitals") + " in " + (PR.country || "your country"),
    pitch: PR.oneliner ? PR.oneliner + "." : "",
    pack: "2 CTNs on 1 pallet", nw: "12", gw: "",
    invInco: "", invPay: "",
    comp: [{ name: "", price: "", src: "" }, { name: "", price: "", src: "" }, { name: "", price: "", src: "" }],
    sender: "", senderTitle: "Overseas Sales Team",
    pt: { akl: true, train: true, service: true },
  };
}
function fmtDate(d) {
  if (!d) return "–";
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function words(n) {
  const a = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
  const b = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
  const h = (x) => (x >= 100 ? a[Math.floor(x / 100)] + " HUNDRED" + (x % 100 ? " " : "") : "") + (x % 100 < 20 ? a[x % 100] : b[Math.floor((x % 100) / 10)] + (x % 10 ? "-" + a[x % 10] : ""));
  n = Math.round(n);
  if (!n) return "ZERO";
  const parts = [];
  [[1e6, "MILLION"], [1e3, "THOUSAND"], [1, ""]].forEach(([u, w]) => { const q = Math.floor(n / u) % 1000; if (q) parts.push(h(q) + (w ? " " + w : "")); });
  return parts.join(" ").trim();
}
const wordCount = (t) => (t.match(/[A-Za-z0-9][A-Za-z0-9'’.,/%+-]*/g) || []).length;

export default function Deal() {
  const { ask, copy, toast } = useApp();
  const PR = useMemo(() => makeProduct().get(), []);
  const DEFAULT = useMemo(() => makeDefault(PR), [PR]);
  const [S, setS] = useStored("deal", () => clone(DEFAULT));
  const D = { ...DEFAULT, ...S, seller: { ...DEFAULT.seller, ...S.seller } };
  const [view, setView] = useState("mail");
  const [printDoc, setPrintDoc] = useState("");

  const set = (path, v) => {
    const n = clone(D);
    const ks = path.split("."), last = ks.pop();
    ks.reduce((o, k) => o[k], n)[last] = v;
    setS(n);
  };
  const bind = (path, type) => {
    const v = path.split(".").reduce((o, k) => (o == null ? o : o[k]), D);
    if (type === "checkbox") return { checked: !!v, onChange: (e) => set(path, e.target.checked) };
    return { value: v == null ? "" : v, onChange: (e) => set(path, e.target.value) };
  };
  const setRow = (list, i, f, v) => setS({ ...D, [list]: D[list].map((r, j) => (j === i ? { ...r, [f]: v } : r)) });

  const sub = D.items.reduce((a, it) => a + (+it.qty || 0) * (+it.unit || 0), 0);
  const extra = (inco) => ({ f: NEEDS_FREIGHT.includes(inco) ? +D.freight || 0 : 0, i: NEEDS_INS.includes(inco) ? +D.ins || 0 : 0 });
  const total = (inco) => { const x = extra(inco); return sub + x.f + x.i; };
  const invInco = D.invInco || D.inco, invPay = D.invPay || D.pay;
  const termsLine = (inco) => `${inco} ${D.place} (Incoterms 2020)` + (inco === "EXW" && D.sellerClear ? ", export customs clearance arranged by seller at buyer's cost" : "");
  const cs = (() => {
    const v = D.comp.filter((c) => c.name && +c.price > 0);
    if (!v.length) return null;
    return { v, avg: v.reduce((a, c) => a + +c.price, 0) / v.length, n: v.length, sourced: v.filter((c) => c.src).length };
  })();
  const remarks = (() => {
    const main = D.items[0];
    let r = "Price basis: our export price list. Competitor price comparison to be added. ";
    if (cs) {
      const diff = ((+main.unit - cs.avg) / cs.avg) * 100;
      r = `Price basis: competitor prices ${cs.v.map((c) => `${c.name} USD ${(+c.price).toLocaleString()}`).join(", ")} (average USD ${Math.round(cs.avg).toLocaleString()}). ${main.model} is offered at USD ${(+main.unit).toLocaleString()}, ${Math.abs(diff).toFixed(0)}% ${diff <= 0 ? "below" : "above"} the competitor average. `;
    }
    return r + "Price, quantity, lead time and payment terms are assumed for simulation.";
  })();
  const email = (() => {
    const m = D.items[0], tr = D.items[1], p = D.pt, pts = [];
    if (p.akl) pts.push(`- Registration support: we supply the documents your team needs for local ${D.reg} registration${PR.certs ? ", including " + PR.certs : ""}.`);
    if (p.train) pts.push("- Clinical training: our specialists can train your clinic staff on-site or online after delivery.");
    if (p.service) pts.push("- After-sales: spare-parts supply and remote technical support from our team in Korea.");
    const subject = `Proposal: ${m.model} for ${D.buyer.co}`;
    const body = `Dear ${D.buyer.sal},

I am writing from ${D.seller.co}, a Korean medical device manufacturer${/13485/.test(PR.certs || "") ? " certified to ISO 13485:2016" : ""}.

We understand ${D.buyer.co} ${D.market}, and we believe ${m.model} can strengthen your portfolio. ${D.pitch}

For a first order, we propose ${m.qty} units of ${m.model}${tr && +tr.qty ? ` with ${tr.qty} × ${tr.model}` : ""} at USD ${(+m.unit).toLocaleString()} per unit, ${termsLine(D.inco).replace(", export customs clearance arranged by seller at buyer's cost", "")}, ${D.pay}, delivery ${D.lead}. Our quotation ${D.qno} is attached and valid for ${D.valid} days.
${pts.length ? "\n" + pts.join("\n") + "\n" : ""}
Could we schedule a 30-minute online meeting next week to discuss your clinic network and the registration plan?

Best regards,
${D.sender ? D.sender + "\n" : ""}${D.senderTitle}
${D.seller.co} | ${D.seller.email} | ${D.seller.tel}`;
    return { subject, body };
  })();
  const wc = wordCount(email.body);

  const rows = [
    ["제품·수량", D.items.map((i) => i.model + "×" + i.qty).join(", "), D.items.map((i) => i.model + "×" + i.qty).join(", ")],
    ["단가", D.items.map((i) => i.unit).join(" / "), D.items.map((i) => i.unit).join(" / ")],
    ["Incoterms", D.inco, invInco],
    ["결제조건", D.pay, invPay],
    ["총액", usd(total(D.inco)), usd(total(invInco))],
  ];
  const ck = [];
  const bad = rows.filter(([, a, b]) => a !== b);
  ck.push(bad.length ? ["warn", `견적서와 인보이스가 달라요: ${bad.map((r) => r[0]).join(", ")}. 바이어가 가장 먼저 보는 실수예요.`] : ["pass", "견적서와 인보이스의 제품·수량·단가·Incoterms·결제조건이 같아요."]);
  [D.inco, invInco].filter((v, k, a) => a.indexOf(v) === k).forEach((inc) => {
    if (D.mode === "air" && SEA_ONLY.includes(inc)) ck.push(["warn", `${inc}는 해상 전용 조건이에요. 항공 출하면 ${inc === "FOB" ? "FCA Incheon" : inc === "CIF" ? "CIP" : inc === "CFR" ? "CPT" : "FCA"}가 맞아요.`]);
    if (NEEDS_FREIGHT.includes(inc) && !+D.freight) ck.push(["warn", `${inc}는 판매자가 운임을 부담해요. 운임을 입력하세요.`]);
    if (NEEDS_INS.includes(inc) && !+D.ins) ck.push(["warn", `${inc}는 판매자가 보험을 들어요. 보험료를 입력하세요.`]);
  });
  if (D.inco === "EXW") ck.push(["info", D.sellerClear ? "EXW + 판매자 수출통관 대행 문구가 들어 있어요." : "EXW는 수출통관도 바이어 몫이에요. 한국에서는 보통 판매자가 수출신고를 하니 '판매자 대행' 문구를 넣으세요."]);
  if (D.inco === "FCA") ck.push(["info", "FCA는 정해진 장소(예: 인천공항 화물터미널)에서 바이어의 운송인에게 넘기면 끝나요. 첫 수출 항공 샘플 주문에 무난한 조건이에요."]);
  if (!cs || cs.n < 3) ck.push(["warn", `경쟁 제품 가격 ${cs ? cs.n : 0}/3개. 경쟁 가격 3개를 근거로 단가를 정하고 Remarks에 쓰면 바이어가 납득하기 쉬워요.`]);
  else ck.push(cs.sourced < cs.n ? ["warn", "경쟁 제품 가격 중 출처 없는 값이 있어요."] : ["pass", `경쟁가 평균 USD ${Math.round(cs.avg).toLocaleString()} 기준으로 Remarks 작성됨`]);
  ck.push(wc >= 150 && wc <= 250 ? ["pass", `이메일 ${wc}단어 (약 200단어 기준)`] : ["warn", `이메일 ${wc}단어. 약 200단어로 맞추세요.`]);
  if (D.qdate && D.idate) {
    const days = (new Date(D.idate) - new Date(D.qdate)) / 864e5;
    if (days < 0) ck.push(["warn", "인보이스 날짜가 견적서보다 빨라요."]);
    else if (days > +D.valid + 30) ck.push(["info", `견적일로부터 ${days}일 뒤 인보이스. 유효기간(${D.valid}일) 안에 주문됐다는 설정인지 확인하세요.`]);
  }
  if (new Set(D.items.map((i) => i.hs)).size === 1 && D.items.length > 1) ck.push(["info", "모든 품목을 같은 HS 코드로 적었어요. 부품·소모품·카트를 따로 신고하면 HS가 달라질 수 있으니 04 HS·인증에서 확인하세요."]);
  if (!D.gw) ck.push(["info", "G.W.와 박스 치수가 미정이에요. 인보이스·패킹리스트에 채우세요."]);
  ck.push(["pass", "세 문서 모두 'Assumed for simulation' 표시"]);

  const doPrint = () => {
    const target = view === "all" ? "quote" : view;
    if (view === "all") setView("quote");
    setPrintDoc(target);
    setTimeout(() => { window.print(); setPrintDoc(""); }, 80);
  };
  const breakDemo = () => {
    if (D.invInco) { setS({ ...D, invInco: "", mode: "air" }); toast("인보이스 조건을 견적서와 같게 되돌렸어요"); }
    else { setS({ ...D, invInco: "FOB", mode: "air" }); setView("all"); toast("인보이스만 FOB로 바꿨어요. 검사 결과를 보세요"); }
  };
  const mailPrompt = `아래는 ${D.dest} 의료기기 유통사에 보내는 첫 제안 이메일 초안이다. 영어 원어민 B2B 톤으로 다듬어 줘.
규칙:
- 200단어 안팎을 유지한다.
- 제품명, 수량, 단가, Incoterms(${D.inco} ${D.place}), 결제조건(${D.pay}), 납기, 견적번호(${D.qno})는 한 글자도 바꾸지 마라. 견적서·인보이스와 일치해야 한다.
- 인증은 우리가 실제로 가진 것(${PR.certs || "인증 목록"})만 언급한다. 없는 인증(FDA·CE 등)을 가진 것처럼 쓰지 마라.
- 의학적 효과를 과장하지 마라.
- 바꾼 문장과 이유를 표로 따로 보여줘.

[초안]
Subject: ${email.subject}

${email.body}`;

  const SheetHead = ({ title, no, date }) => (
    <>
      <span className="absolute top-4 right-4 text-[10.5px] font-extrabold uppercase tracking-wide text-amber-700 border-[1.5px] border-amber-600 rounded-md px-2 py-0.5">Assumed for simulation</span>
      <div className="flex justify-between gap-5 border-b-2 border-graphite pb-3 mt-4">
        <div><p className="font-extrabold text-[15px]">{D.seller.co}</p><p className="text-[12px] text-ink-2">{D.seller.addr}<br />Tel {D.seller.tel} · {D.seller.email}</p></div>
        <p className="text-right text-[12px]"><b>No.</b> {no}<br /><b>Date</b> {fmtDate(date)}</p>
      </div>
      <h2 className="text-2xl font-extrabold tracking-[.06em] my-5">{title}</h2>
    </>
  );
  const Items = ({ inco }) => {
    const x = extra(inco);
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px] border-collapse">
          <thead><tr className="bg-graphite text-white text-[11px]">{["No.", "Description", "HS Code", "Q'ty", "Unit Price", "Amount"].map((h, i) => <th key={h} className={cx("px-2 py-2 text-left font-semibold", i >= 3 && "text-right")}>{h}</th>)}</tr></thead>
          <tbody className="[&_td]:px-2 [&_td]:py-2 [&_td]:border-b [&_td]:border-line [&_td]:align-top">
            {D.items.map((it, k) => (
              <tr key={k}><td>{k + 1}</td><td><b>{it.model}</b><br /><span className="text-muted">{it.desc}</span></td><td className="whitespace-nowrap">{it.hs}</td><td className="text-right whitespace-nowrap">{it.qty} set</td><td className="text-right whitespace-nowrap">{usd(it.unit)}</td><td className="text-right whitespace-nowrap">{usd((+it.qty || 0) * (+it.unit || 0))}</td></tr>
            ))}
            {x.f > 0 && <tr><td /><td>Freight</td><td /><td /><td /><td className="text-right">{usd(x.f)}</td></tr>}
            {x.i > 0 && <tr><td /><td>Insurance</td><td /><td /><td /><td className="text-right">{usd(x.i)}</td></tr>}
            <tr className="font-extrabold [&_td]:border-t-2 [&_td]:border-graphite"><td colSpan={5}>TOTAL · {inco} {D.place}</td><td className="text-right whitespace-nowrap">{usd(total(inco))}</td></tr>
          </tbody>
        </table>
      </div>
    );
  };
  const Hl = ({ bad, children }) => <span className={cx("rounded px-1", bad ? "bg-amber-50 outline-[1.5px] outline outline-amber-600" : "bg-brand-50")}>{children}</span>;
  const Terms = ({ rows }) => (
    <dl className="grid grid-cols-[130px_minmax(0,1fr)] sm:grid-cols-[150px_minmax(0,1fr)] gap-x-3 gap-y-1 mt-4 text-[12.5px]">
      {rows.map(([a, b]) => <div key={a} className="contents"><dt className="font-bold text-ink-2">{a}</dt><dd>{b}</dd></div>)}
    </dl>
  );
  const Box = ({ k, children }) => <div className="border border-line-2 rounded-md px-3 py-2.5"><p className="text-[10.5px] font-extrabold text-muted uppercase tracking-wide mb-1">{k}</p>{children}</div>;
  const sheet = (id) => cx("sheet relative bg-white border border-line rounded-lg shadow-[0_10px_30px_rgba(20,30,30,.08)] px-5 pt-10 pb-8 sm:px-11 sm:pt-12 text-[13px]", printDoc === id && "print-on");

  const Quote = () => (
    <div className={sheet("quote")}>
      <SheetHead title="QUOTATION" no={D.qno} date={D.qdate} />
      <div className="grid sm:grid-cols-2 gap-3 my-4">
        <Box k="Messrs."><b>{D.buyer.co}</b><br />Attn: {D.buyer.name}, {D.buyer.title}<br />{D.buyer.addr}</Box>
        <Box k="Validity">{D.valid} days from {fmtDate(D.qdate)}<p className="text-[10.5px] font-extrabold text-muted uppercase tracking-wide mt-2 mb-1">Country of origin</p>Republic of Korea</Box>
      </div>
      <Items inco={D.inco} />
      <Terms rows={[["Delivery terms", <Hl key="t">{termsLine(D.inco)}</Hl>], ["Payment", <Hl key="p">{D.pay}</Hl>], ["Lead time", D.lead], ["Packing", D.pack], ["Transport", D.mode === "air" ? "By air" : "By sea"]]} />
      <p className="mt-4 rounded-md bg-surface px-3 py-2.5 text-[12px]"><b>Remarks</b> · {remarks}</p>
      <div className="flex justify-end mt-7"><p className="border-t border-ink pt-1 min-w-56 text-center text-[12px]">{D.seller.co}<br />Authorized signature</p></div>
    </div>
  );
  const Invoice = () => (
    <div className={sheet("inv")}>
      <SheetHead title="COMMERCIAL INVOICE" no={D.ino} date={D.idate} />
      <div className="grid sm:grid-cols-2 gap-3 my-4">
        <Box k="Shipper / Exporter"><b>{D.seller.co}</b><br />{D.seller.addr}</Box>
        <Box k="Consignee"><b>{D.buyer.co}</b><br />{D.buyer.addr}</Box>
        <Box k="Ref.">Quotation {D.qno} · {fmtDate(D.qdate)}</Box>
        <Box k="Shipment">From Korea to {D.dest} · {D.mode === "air" ? "By air" : "By sea"}</Box>
      </div>
      <Items inco={invInco} />
      <p className="text-[12px] mt-2"><b>SAY US DOLLARS {words(total(invInco))} ONLY.</b></p>
      <Terms rows={[["Terms of delivery", <Hl key="t" bad={invInco !== D.inco}>{termsLine(invInco)}</Hl>], ["Terms of payment", <Hl key="p" bad={invPay !== D.pay}>{invPay}</Hl>], ["Packing", D.pack], ["N.W. / G.W.", `${D.nw || "–"} kg / ${D.gw || "TBD"} kg`], ["Country of origin", "Republic of Korea"]]} />
      <p className="mt-4 rounded-md bg-surface px-3 py-2.5 text-[12px]">Assumed for simulation. Values and terms follow quotation {D.qno}.</p>
      <div className="flex justify-end mt-7"><p className="border-t border-ink pt-1 min-w-56 text-center text-[12px]">{D.seller.co}<br />Signed by</p></div>
    </div>
  );
  const MailDoc = () => (
    <div className={sheet("mail")}>
      <span className="absolute top-4 right-4 text-[10.5px] font-extrabold uppercase tracking-wide text-amber-700 border-[1.5px] border-amber-600 rounded-md px-2 py-0.5">Assumed for simulation</span>
      <dl className="grid grid-cols-[64px_minmax(0,1fr)] gap-y-1 border-b border-line pb-3 mb-4 text-[13px]">
        <dt className="text-muted font-semibold">To</dt><dd>{D.buyer.name} &lt;{D.buyer.email}&gt;</dd>
        <dt className="text-muted font-semibold">Subject</dt><dd className="font-bold">{email.subject}</dd>
        <dt className="text-muted font-semibold">Attach</dt><dd>{D.qno}.pdf · product brochure.pdf</dd>
      </dl>
      <div className="text-[14px] leading-relaxed whitespace-pre-wrap">{email.body}</div>
      <div className="no-print flex flex-wrap items-center gap-2 mt-5">
        <Badge tone={wc >= 150 && wc <= 250 ? "teal" : "amber"}>{wc} words · 목표 약 200</Badge>
        <Button size="sm" icon={Copy} onClick={() => copy("Subject: " + email.subject + "\n\n" + email.body, "이메일을 복사했어요")}>이메일 복사</Button>
      </div>
    </div>
  );

  const H = ({ children }) => <h3 className="text-[12.5px] font-bold text-brand-700 mt-6 mb-2.5 first:mt-0">{children}</h3>;
  return (
    <>
      <PageHeader
        path="/deal"
        desc="한 번 입력한 거래조건으로 제안 메일, 견적서, 상업송장(인보이스)을 함께 만들어요. 문서끼리 조건이 다르거나 Incoterms가 운송수단과 맞지 않으면 바로 알려 줘요."
        guide={[["이 페이지에서", "첫 주문용 서류 3가지를 만듭니다."], ["준비물", "단가, 경쟁 제품 가격 3개, 결제·운송 조건"], ["다 하면", "08 AI 답 확인에 확인한 내용을 기록해요."]]}
        actions={<>
          <Button variant="amber" icon={AlertTriangle} onClick={breakDemo}>조건 어긋남 보기</Button>
          <Button variant="ghost" icon={RotateCcw} onClick={() => confirm("입력값을 처음 값으로 되돌릴까요?") && setS(clone(DEFAULT))}>처음으로</Button>
          <Button variant="soft" icon={MessageCircleQuestion} onClick={() => ask("메일 다듬기 질문", mailPrompt, "거래조건")}>메일 다듬기 질문</Button>
          <Button variant="primary" icon={Printer} onClick={doPrint}>이 문서 인쇄·PDF</Button>
        </>}
      />

      <div className="grid grid-cols-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
        <div className="min-w-0">
          <Tabs className="mb-4" value={view} onChange={setView} tabs={[["mail", "제안 이메일", Mail], ["quote", "Quotation", FileSpreadsheet], ["inv", "Commercial Invoice", Receipt], ["all", "세 문서 비교", Columns3]]} />
          <div className="grid gap-5">
            {(view === "mail" || view === "all") && <MailDoc />}
            {(view === "quote" || view === "all") && <Quote />}
            {(view === "inv" || view === "all") && <Invoice />}
          </div>
        </div>

        <aside className="no-print grid grid-cols-[minmax(0,1fr)] gap-6 min-w-0">
          <Card>
            <CardHeader icon={ShieldCheck} title="서류 검사" desc="견적서와 인보이스의 같은 항목을 비교해요." />
            <div className="rounded-xl border border-line overflow-hidden mb-4">
              {rows.map(([k, a, b]) => (
                <div key={k} className="flex items-center justify-between gap-3 px-3 py-2.5 border-b border-line last:border-b-0 text-[13.5px]">
                  <div className="min-w-0"><p className="font-semibold">{k}</p><p className="text-[12px] text-muted truncate">{a}{a !== b && <> → <b className="text-amber-700">{b}</b></>}</p></div>
                  <Badge tone={a === b ? "teal" : "amber"}>{a === b ? "같음" : "다름"}</Badge>
                </div>
              ))}
            </div>
            <CheckList items={ck} />
          </Card>

          <Card>
            <H>우리 회사</H>
            <Field label="회사 (영문)"><Input {...bind("seller.co")} /></Field>
            <Field label="주소 (영문)"><Input {...bind("seller.addr")} /></Field>
            <div className="grid grid-cols-2 gap-x-3"><Field label="전화"><Input {...bind("seller.tel")} /></Field><Field label="이메일"><Input {...bind("seller.email")} /></Field></div>

            <H>바이어</H>
            <Field label="회사"><Input {...bind("buyer.co")} /></Field>
            <div className="grid grid-cols-2 gap-x-3">
              <Field label="담당자"><Input {...bind("buyer.name")} /></Field><Field label="직함"><Input {...bind("buyer.title")} /></Field>
              <Field label="호칭"><Input {...bind("buyer.sal")} /></Field><Field label="이메일"><Input {...bind("buyer.email")} /></Field>
            </div>
            <Field label="주소"><Input {...bind("buyer.addr")} /></Field>

            <H>품목</H>
            <div className="grid gap-2">
              {D.items.map((it, k) => (
                <div key={k} className="grid grid-cols-[minmax(0,1fr)_64px_88px] gap-1.5">
                  <Input value={it.model} onChange={(e) => setRow("items", k, "model", e.target.value)} className="h-9 px-2 text-[13px]" aria-label="모델" />
                  <Input type="number" min="0" value={it.qty} onChange={(e) => setRow("items", k, "qty", e.target.value === "" ? "" : +e.target.value)} className="h-9 px-2 text-[13px]" aria-label="수량" />
                  <Input type="number" min="0" value={it.unit} onChange={(e) => setRow("items", k, "unit", e.target.value === "" ? "" : +e.target.value)} className="h-9 px-2 text-[13px]" aria-label="단가 USD" />
                </div>
              ))}
              <p className="text-[12px] text-muted">모델 · 수량 · 단가(USD)</p>
            </div>

            <H>거래조건</H>
            <div className="grid grid-cols-2 gap-x-3">
              <Field label="Incoterms 2020"><Select {...bind("inco")} options={["EXW", "FCA", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP"]} /></Field>
              <Field label="지정 장소"><Input {...bind("place")} /></Field>
              <Field label="운송수단"><Select {...bind("mode")} options={[["air", "항공"], ["sea", "해상"]]} /></Field>
              <Field label="결제조건"><Select {...bind("pay")} options={["T/T 100% in advance", "T/T 30% deposit, 70% before shipment", "L/C at sight"]} /></Field>
            </div>
            {(NEEDS_FREIGHT.includes(D.inco) || NEEDS_FREIGHT.includes(invInco)) && (
              <div className="grid grid-cols-2 gap-x-3"><Field label="운임 USD"><Input type="number" {...bind("freight")} /></Field><Field label="보험료 USD"><Input type="number" {...bind("ins")} /></Field></div>
            )}
            {D.inco === "EXW" && <label className="flex gap-2 items-center text-[14px] font-semibold mb-3"><input type="checkbox" className="size-4 accent-brand-600" {...bind("sellerClear", "checkbox")} /> EXW지만 수출통관은 판매자가 대행</label>}
            <div className="grid grid-cols-2 gap-x-3">
              <Field label="납기"><Input {...bind("lead")} /></Field>
              <Field label="견적 유효(일)"><Input type="number" {...bind("valid")} /></Field>
              <Field label="견적 번호"><Input {...bind("qno")} /></Field>
              <Field label="견적 일자"><Input type="date" {...bind("qdate")} /></Field>
              <Field label="인보이스 번호"><Input {...bind("ino")} /></Field>
              <Field label="인보이스 일자"><Input type="date" {...bind("idate")} /></Field>
            </div>
            <Field label="포장"><Input {...bind("pack")} /></Field>
            <div className="grid grid-cols-2 gap-x-3"><Field label="N.W. (kg)"><Input {...bind("nw")} /></Field><Field label="G.W. (kg)"><Input {...bind("gw")} placeholder="미정" /></Field></div>

            <H>인보이스만 다르게 (어긋남 확인용)</H>
            <div className="grid grid-cols-2 gap-x-3">
              <Field label="인보이스 Incoterms"><Select {...bind("invInco")} options={[["", "견적서와 같음"], "EXW", "FCA", "FOB", "CIF", "CIP"]} /></Field>
              <Field label="인보이스 결제조건"><Select {...bind("invPay")} options={[["", "견적서와 같음"], "T/T 100% in advance", "L/C at sight"]} /></Field>
            </div>

            <H>경쟁 제품 가격 (단가 근거, 3개)</H>
            <div className="grid gap-2">
              {D.comp.map((c, k) => (
                <div key={k} className="grid grid-cols-[minmax(0,1fr)_80px] gap-1.5">
                  <Input value={c.name} placeholder={`경쟁 제품 ${k + 1}`} onChange={(e) => setRow("comp", k, "name", e.target.value)} className="h-9 px-2 text-[13px]" />
                  <Input type="number" value={c.price} placeholder="USD" onChange={(e) => setRow("comp", k, "price", e.target.value)} className="h-9 px-2 text-[13px]" />
                  <Input value={c.src} placeholder="출처 URL·일자" onChange={(e) => setRow("comp", k, "src", e.target.value)} className="col-span-2 h-8 px-2 text-[12.5px] bg-surface border-transparent" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-x-3 mt-3"><Field label="도착지"><Input {...bind("dest")} /></Field><Field label="현지 등록 제도"><Input {...bind("reg")} /></Field></div>

            <H>이메일</H>
            <Field label="바이어 설명" hint="We understand [회사] …"><Input {...bind("market")} /></Field>
            <Field label="제품 소개 문장 (영문)"><Textarea {...bind("pitch")} /></Field>
            <div className="grid grid-cols-2 gap-x-3"><Field label="보내는 사람"><Input {...bind("sender")} /></Field><Field label="직함"><Input {...bind("senderTitle")} /></Field></div>
            <p className="text-[13.5px] font-semibold text-ink-2 mb-1.5">강조할 점</p>
            {[["pt.akl", "현지 인허가 서류 지원"], ["pt.train", "클리닉 교육"], ["pt.service", "부품 공급·원격 기술지원"]].map(([k, l]) => (
              <label key={k} className="flex gap-2 items-center text-[14px] mb-1.5"><input type="checkbox" className="size-4 accent-brand-600" {...bind(k, "checkbox")} /> {l}</label>
            ))}
          </Card>
        </aside>
      </div>

      <StepPager path="/deal" />
    </>
  );
}
