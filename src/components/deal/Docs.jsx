/* 서류 초안: 수출 견적서, 상업송장 초안, 메일, 현지 견적. 모두 같은 거래 기준정보에서 만듭니다 */
import { useNavigate } from "react-router-dom";
import { useDeal } from "../../lib/deal/DealContext.jsx";
import { calcExport, calcLocal, weights, partyOf, invoiceTerms } from "../../lib/deal/calc.js";
import { fmtMoney, fmtDateEn, amountInWords, fmtNum, toMinor } from "../../lib/deal/money.js";
import { cn } from "@/lib/utils";

export const DOCS = [["quote", "수출 견적서"], ["invoice", "상업송장 초안"], ["email", "메일 초안"], ["local", "현지 견적"]];

export function useGoField() {
  const nav = useNavigate();
  return (path) => nav(`/deal?focus=${encodeURIComponent(path)}`);
}

/* 빈 값: 화면에서는 눌러서 입력란으로 이동, 인쇄에서는 빈 밑줄 */
function Miss({ field, label }) {
  const go = useGoField();
  return (
    <button type="button" data-doc-field={field} onClick={() => go(field)} className="doc-miss" title={`${label} 입력하러 가기`}>
      <span className="no-print">[{label} 미입력]</span><span className="print-only">________</span>
    </button>
  );
}
const V = ({ v, field, label }) => (String(v ?? "").trim() ? <span data-doc-field={field}>{v}</span> : <Miss field={field} label={label} />);

function Stamp({ d }) {
  const mock = d.kind !== "user";
  return <p className="doc-stamp">{mock ? "DRAFT · ASSUMED FOR SIMULATION" : "DRAFT · FOR REVIEW"}</p>;
}
function Paper({ id, children, d, title }) {
  return (
    <article className="doc-paper" data-doc={id} aria-label={title}>
      <Stamp d={d} />
      {children}
      <p className="doc-foot">{d.kind === "case" ? `Case data loaded from file (${d.caseLabel || "case"}). ` : d.kind === "mock" ? "Mock values for demonstration. " : d.kind === "sample" ? "Sample deal with mock terms set by the team; company and public figures are marked in the evidence list. " : ""}Generated from one set of deal data; not checked against any external document.</p>
    </article>
  );
}
const PartyBlock = ({ k, p, role, need = [] }) => (
  <div className="doc-box">
    <p className="doc-k">{k}</p>
    <p className="font-semibold"><V v={p.name} field={`parties.${role}.name`} label="회사명" /></p>
    {(p.address || need.includes("address")) && <p><V v={p.address} field={`parties.${role}.address`} label="주소" /></p>}
    {p.contact && <p>Attn: {p.contact}</p>}
    {(p.email || p.phone) && <p className="text-[#6e6e73]">{[p.email, p.phone].filter(Boolean).join(" · ")}</p>}
  </div>
);

function ItemsTable({ d, E, terms, showHs = true, showWeights }) {
  const cur = E.cur;
  return (
    <div className="overflow-x-auto">
      <table className="doc-table">
        <thead><tr><th>No.</th><th>Description</th>{showHs && <th>HS Code</th>}<th className="r">Q'ty</th><th className="r">Unit Price ({cur})</th><th className="r">Amount ({cur})</th></tr></thead>
        <tbody>
          {E.items.map((it, i) => (
            <tr key={it.id} data-doc-field={`exp.items.${it.id}.qty`}>
              <td>{i + 1}</td>
              <td><b><V v={it.model} field={`exp.items.${it.id}.model`} label="모델" /></b>{it.desc && <><br /><span className="text-[#6e6e73]">{it.desc}</span></>}</td>
              {showHs && <td className="nowrap">{it.hs || "—"}</td>}
              <td className="r nowrap">{it.q.state === "ok" ? `${fmtNum(it.q.value)} ${it.unit}` : <Miss field={`exp.items.${it.id}.qty`} label="수량" />}</td>
              <td className="r nowrap">{it.p.state === "ok" && it.p.value >= 0 ? fmtMoney(toMinor(it.p.value, cur), cur, { bare: true }) : <Miss field={`exp.items.${it.id}.price`} label="단가" />}</td>
              <td className="r nowrap">{it.minor !== null ? fmtMoney(it.minor, cur, { bare: true }) : "—"}</td>
            </tr>
          ))}
          {E.extras.filter((x) => x.included).map((x) => (
            <tr key={x.id}><td /><td>{x.label || "Additional cost"}</td>{showHs && <td />}<td /><td /><td className="r">{x.minor !== null ? fmtMoney(x.minor, cur, { bare: true }) : <Miss field={`exp.extras.${x.id}.amount`} label="금액" />}</td></tr>
          ))}
        </tbody>
        <tfoot><tr><td colSpan={showHs ? 5 : 4}>TOTAL{terms.incoterm ? ` · ${terms.incoterm} ${terms.place}` : ""}</td><td className="r nowrap">{E.total !== null ? fmtMoney(E.total, cur) : <span className="doc-miss-static">계산 불가 (빈칸 있음)</span>}</td></tr></tfoot>
      </table>
    </div>
  );
}

const payText = (rows, pay, cur) => rows.length ? pay.rows.map((r) => [r.label, r.pct ? `${r.pct}%` : "", r.minor !== null ? fmtMoney(r.minor, cur) : "", r.due].filter(Boolean).join(" ")).join("; ") : "";

export function QuoteDoc({ d }) {
  const E = calcExport(d), seller = partyOf(d, "exportSeller"), buyer = partyOf(d, "exportBuyer");
  const terms = { incoterm: d.exp.incoterm, place: d.exp.place };
  const pt = payText(d.exp.payment, E.pay, E.cur);
  return (
    <Paper id="quote" d={d} title="Quotation">
      <header className="doc-head">
        <div><p className="font-semibold text-[15px]"><V v={seller.name} field={`parties.${d.roles.exportSeller}.name`} label="판매자" /></p>{seller.address && <p className="text-[#6e6e73]">{seller.address}</p>}</div>
        <dl className="doc-meta"><dt>No.</dt><dd><V v={d.exp.quoteNo} field="exp.quoteNo" label="번호" /></dd><dt>Date</dt><dd><V v={fmtDateEn(d.exp.quoteDate)} field="exp.quoteDate" label="날짜" /></dd></dl>
      </header>
      <h2 className="doc-title">QUOTATION</h2>
      <div className="doc-grid2"><PartyBlock k="Messrs." p={buyer} role={d.roles.exportBuyer} /><div className="doc-box"><p className="doc-k">Validity</p><p><V v={d.exp.validityDays && `${d.exp.validityDays} days from quotation date`} field="exp.validityDays" label="유효기간" /></p><p className="doc-k mt-2">Origin</p><p>{d.exp.origin || "—"}</p></div></div>
      <ItemsTable d={d} E={E} terms={terms} />
      <dl className="doc-terms">
        <dt>Delivery terms</dt><dd data-doc-field="exp.incoterm">{d.exp.incoterm && d.exp.place ? `${d.exp.incoterm} ${d.exp.place} (Incoterms ${d.exp.incotermVersion})` : <Miss field={d.exp.incoterm ? "exp.place" : "exp.incoterm"} label="인도조건·장소" />}{d.exp.exportClearance ? `; ${d.exp.exportClearance}` : ""}</dd>
        <dt>Payment</dt><dd data-doc-field="exp.payment">{pt || <Miss field="exp.payment" label="결제조건" />}</dd>
        <dt>Lead time</dt><dd><V v={d.exp.leadTime} field="exp.leadTime" label="납기" /></dd>
        {d.exp.transport && <><dt>Transport</dt><dd>{{ air: "By air", sea: "By sea", road: "By road", multi: "Multimodal" }[d.exp.transport] || d.exp.transport}</dd></>}
        {d.exp.packing && <><dt>Packing</dt><dd>{d.exp.packing}</dd></>}
        {d.exp.remarks && <><dt>Remarks</dt><dd>{d.exp.remarks}</dd></>}
      </dl>
      <p className="doc-sign">{seller.name || "Seller"}<br />Authorized signature</p>
    </Paper>
  );
}

export function InvoiceDoc({ d }) {
  const E = calcExport(d), seller = partyOf(d, "exportSeller"), buyer = partyOf(d, "exportBuyer"), cons = d.parties[d.roles.consignee];
  const t = invoiceTerms(d), W = weights(d);
  const pt = payText(d.exp.payment, E.pay, E.cur);
  return (
    <Paper id="invoice" d={d} title="Commercial Invoice">
      <header className="doc-head">
        <div><p className="font-semibold text-[15px]"><V v={seller.name} field={`parties.${d.roles.exportSeller}.name`} label="수출자" /></p></div>
        <dl className="doc-meta"><dt>Invoice No.</dt><dd><V v={d.exp.invoiceNo} field="exp.invoiceNo" label="번호" /></dd><dt>Date</dt><dd><V v={fmtDateEn(d.exp.invoiceDate)} field="exp.invoiceDate" label="날짜" /></dd><dt>Ref.</dt><dd>{d.exp.quoteNo || "—"}</dd></dl>
      </header>
      <h2 className="doc-title">COMMERCIAL INVOICE</h2>
      <div className="doc-grid2">
        <PartyBlock k="Shipper / Exporter" p={seller} role={d.roles.exportSeller} need={["address"]} />
        <PartyBlock k="Buyer" p={buyer} role={d.roles.exportBuyer} need={["address"]} />
        {cons && d.roles.consignee !== d.roles.exportBuyer && <PartyBlock k="Consignee" p={cons} role={d.roles.consignee} />}
        <div className="doc-box"><p className="doc-k">Shipment</p><p>From {d.exp.origin === "Republic of Korea" ? "Korea" : d.exp.origin || "—"} to <V v={d.exp.destination} field="exp.destination" label="도착지" /></p>{d.roles.consignee === d.roles.exportBuyer && <p className="text-[#6e6e73]">Consignee: same as buyer</p>}</div>
      </div>
      <ItemsTable d={d} E={E} terms={t} />
      {E.total !== null && <p className="mt-2 text-[12px] font-semibold">{amountInWords(E.total, E.cur)}.</p>}
      <dl className="doc-terms">
        <dt>Terms of delivery</dt><dd data-doc-field="exp.incoterm" className={cn(t.overridden && "doc-diff")}>{t.incoterm && t.place ? `${t.incoterm} ${t.place} (Incoterms ${d.exp.incotermVersion})` : <Miss field="exp.incoterm" label="인도조건" />}{t.overridden && <span className="no-print"> · 견적서와 다름{d.exp.invoiceOverride.reason ? `: ${d.exp.invoiceOverride.reason}` : ""}</span>}</dd>
        <dt>Terms of payment</dt><dd>{pt || <Miss field="exp.payment" label="결제조건" />}</dd>
        <dt>Packages</dt><dd data-doc-field="exp.packages">{W.pk.state === "ok" ? `${fmtNum(W.pk.value)} ${d.exp.packageUnit}` : <Miss field="exp.packages" label="포장 수량" />}{d.exp.packing ? `, ${d.exp.packing}` : ""}</dd>
        <dt>N.W. / G.W.</dt><dd data-doc-field="exp.gw">
          {W.nw.state === "ok" ? `${fmtNum(W.nwTotal)} ${d.exp.nwUnit}` : <Miss field="exp.nw" label="순중량" />} / {W.gw.state === "ok" ? `${fmtNum(W.gwTotal)} ${d.exp.gwUnit}` : <Miss field="exp.gw" label="총중량" />}
          {W.per && W.nw.state === "ok" && <span className="text-[#6e6e73]"> (per package {d.exp.nw} / {d.exp.gw || "—"} × {d.exp.packages || "?"})</span>}
        </dd>
        <dt>Country of origin</dt><dd>{d.exp.origin || "—"}</dd>
      </dl>
      <p className="doc-sign">{seller.name || "Shipper"}<br />Signed by</p>
    </Paper>
  );
}

export function emailText(d) {
  const E = calcExport(d), em = d.email, items = E.items.map((i) => `${i.q.state === "ok" ? fmtNum(i.q.value) : "?"} ${i.unit} ${i.model || i.desc || "item"}`).join(", ");
  const subject = em.subject || `Quotation ${d.exp.quoteNo || ""} – ${E.items[0]?.model || "our products"}`.trim();
  const lines = [
    `Dear ${em.toName || "[recipient]"},`, "",
    em.intro || `Thank you for discussing the order with us. Please find attached our quotation ${d.exp.quoteNo || ""}.`.replace(/\s+\./, "."), "",
    `- Items: ${items}`,
    `- Total: ${E.total !== null ? fmtMoney(E.total, E.cur) : "[total not calculated]"}${d.exp.incoterm ? `, ${d.exp.incoterm} ${d.exp.place} (Incoterms ${d.exp.incotermVersion})` : ""}`,
    `- Payment: ${payText(d.exp.payment, E.pay, E.cur) || "[payment terms]"}`,
    d.exp.leadTime && `- Lead time: ${d.exp.leadTime}`,
    d.exp.validityDays && `- Validity: ${d.exp.validityDays} days`,
    d.counterpart.agreements && "", d.counterpart.agreements && `As agreed: ${d.counterpart.agreements}`,
    "", "Please let us know if you have any questions.", "", "Best regards,",
  ].filter((x) => x !== false && x !== undefined && x !== null);
  return { subject, lines };
}

export function EmailDoc({ d }) {
  const em = d.email, { subject, lines } = emailText(d);
  return (
    <Paper id="email" d={d} title="Email draft">
      <dl className="doc-mailhead">
        <dt>To</dt><dd>{em.toName || em.toEmail ? `${em.toName}${em.toEmail ? ` <${em.toEmail}>` : ""}` : <Miss field="email.toName" label="받는 사람" />}</dd>
        <dt>Subject</dt><dd className="font-semibold">{subject}</dd>
        <dt>Attach</dt><dd>{d.exp.quoteNo ? `${d.exp.quoteNo}.pdf` : "quotation.pdf"}</dd>
      </dl>
      <div className="whitespace-pre-wrap text-[14px] leading-[1.6]">{lines.join("\n")}</div>
      <div className="doc-signature" data-doc-field="email.senderName">
        <p className="font-semibold"><V v={em.senderName} field="email.senderName" label="발신자 이름" /></p>
        <p>{[em.senderTitle, em.senderOrg].filter(Boolean).join(", ") || <Miss field="email.senderTitle" label="직함·소속" />}</p>
        <p>{[em.senderEmail, em.senderPhone].filter(Boolean).join(" · ") || <Miss field="email.senderEmail" label="연락처" />}</p>
      </div>
    </Paper>
  );
}

export function LocalDoc({ d }) {
  const L = calcLocal(d), seller = partyOf(d, "localSeller"), buyer = partyOf(d, "localBuyer"), cur = L.cur;
  const basis = { partner: "Price provided by the partner", mock: "Price set by the team for simulation (not provided by the partner)" }[d.local.priceBasis];
  return (
    <Paper id="local" d={d} title="Local quotation">
      <header className="doc-head">
        <div><p className="font-semibold text-[15px]"><V v={seller.name} field={`parties.${d.roles.localSeller}.name`} label="현지 판매자" /></p>{seller.address && <p className="text-[#6e6e73]">{seller.address}</p>}</div>
        <dl className="doc-meta"><dt>No.</dt><dd>{d.local.quoteNo || "—"}</dd><dt>Date</dt><dd>{fmtDateEn(d.local.quoteDate) || "—"}</dd></dl>
      </header>
      <h2 className="doc-title">LOCAL QUOTATION</h2>
      <p className="mb-3 text-[12px]" data-doc-field="local.priceBasis">{basis || <Miss field="local.priceBasis" label="가격 출처" />}. Not converted from the export price.</p>
      <div className="doc-grid2"><PartyBlock k="To" p={buyer} role={d.roles.localBuyer} /><div className="doc-box"><p className="doc-k">Currency</p><p>{cur}</p>{d.local.validityDays && <><p className="doc-k mt-2">Validity</p><p>{d.local.validityDays} days</p></>}</div></div>
      <div className="overflow-x-auto"><table className="doc-table">
        <thead><tr><th>No.</th><th>Description</th><th className="r">Q'ty</th><th className="r">Unit Price ({cur})</th><th className="r">Amount ({cur})</th></tr></thead>
        <tbody>{L.lines.map((l, i) => <tr key={l.id}><td>{i + 1}</td><td><V v={l.desc} field={`local.lines.${l.id}.desc`} label="품목" /></td><td className="r">{l.q.state === "ok" ? `${fmtNum(l.q.value)} ${l.unit}` : <Miss field={`local.lines.${l.id}.qty`} label="수량" />}</td><td className="r">{l.p.state === "ok" ? fmtMoney(toMinor(l.p.value, cur), cur, { bare: true }) : <Miss field={`local.lines.${l.id}.price`} label="가격" />}</td><td className="r">{l.minor !== null ? fmtMoney(l.minor, cur, { bare: true }) : "—"}</td></tr>)}</tbody>
        <tfoot>
          {L.vat.state === "ok" && L.vat.value > 0 && <tr><td colSpan={4} className="font-normal">VAT {d.local.vatPct}%</td><td className="r">{L.vatMinor !== null ? fmtMoney(L.vatMinor, cur, { bare: true }) : "—"}</td></tr>}
          <tr><td colSpan={4}>TOTAL{L.vat.state === "ok" && L.vat.value > 0 ? " incl. VAT" : ""}</td><td className="r nowrap">{L.total !== null ? fmtMoney(L.total, cur) : "계산 불가"}</td></tr>
        </tfoot>
      </table></div>
      <dl className="doc-terms">
        <dt>Payment</dt><dd>{payText(d.local.payment, L.pay, cur) || <Miss field="local.payment" label="결제조건" />}</dd>
        {d.local.delivery && <><dt>Delivery</dt><dd>{d.local.delivery}</dd></>}
        {d.local.acceptance && <><dt>Acceptance</dt><dd>{d.local.acceptance}</dd></>}
        {(d.service.installBy || d.service.install) && <><dt>Installation</dt><dd>{[d.service.installBy, d.service.install].filter(Boolean).join(": ")}</dd></>}
        {(d.service.trainingBy || d.service.training) && <><dt>Training</dt><dd>{[d.service.trainingBy, d.service.training].filter(Boolean).join(": ")}</dd></>}
        {(d.service.asBy || d.service.warranty) && <><dt>Warranty / service</dt><dd>{[d.service.asBy, d.service.warranty].filter(Boolean).join(": ")}</dd></>}
      </dl>
    </Paper>
  );
}

export function DocView({ id, d }) {
  if (id === "invoice") return <InvoiceDoc d={d} />;
  if (id === "email") return <EmailDoc d={d} />;
  if (id === "local") return d.local.enabled ? <LocalDoc d={d} /> : <p className="p-6 text-[14px] text-[#6e6e73]">현지 판매를 켜면 현지 견적을 볼 수 있어요.</p>;
  return <QuoteDoc d={d} />;
}
