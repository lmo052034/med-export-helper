/* 견적 검토 화면 (홈 메일 → 현지 견적 → 병원 부담액과 손익 → 답장 초안)
   계산은 기존 calcLocal, hospitalCalc 재사용. 상담 문구와 기준값은 콘텐츠 팩 PACK.consult */
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Copy, RotateCcw } from "lucide-react";
import { PACK } from "@pack";
import { useDeal } from "../../lib/deal/DealContext.jsx";
import { calcLocal } from "../../lib/deal/calc.js";
import { hospitalCalc } from "../../lib/deal/econ.js";
import { parseNum } from "../../lib/deal/money.js";
import { cn } from "@/lib/utils";
import { FxBar, FxEq } from "./FxBar.jsx";

const fmt = (v) => (v === null || v === undefined || !Number.isFinite(v) ? "—" : Math.round(v).toLocaleString("en-US"));
export const rp = (v) => (v === null || v === undefined || !Number.isFinite(v) ? "—" : `Rp${fmt(v)}`);
export const manwon = (v) => `약 ${fmt(Math.abs(v) / 1e4)}만 루피아 ${v < 0 ? "적자" : "흑자"}`;

export function consultCalc(deal, life) {
  const H = hospitalCalc(deal);
  if (!(H.contribution > 0) || H.invest === null || H.fixed === null || H.sessions === null) return { H, bep: null, profit: null };
  const fixedAll = H.fixed + H.invest / life;
  return { H, bep: Math.ceil(fixedAll / H.contribution - 1e-9), profit: H.sessions * H.contribution - fixedAll };
}

const btn = "inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[var(--line-strong)] bg-white px-3.5 text-[14px] font-medium hover:bg-[var(--fill-soft)]";
const btnOn = "border-primary bg-primary text-white hover:bg-primary";
const inputCls = "h-10 w-full rounded-md border border-[var(--line-strong)] bg-white px-3 text-right text-[15px] tabular-nums";

function NumField({ id, label, value, onChange, suffix, note }) {
  return (
    <div>
      <label htmlFor={id} className="text-[13px] font-medium text-[#424245]">{label}</label>
      <div className="mt-1 flex items-center gap-2">
        <input id={id} inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))} className={inputCls} />
        {suffix && <span className="shrink-0 text-[13px] text-[#6e6e73]">{suffix}</span>}
      </div>
      {note && <p className="mt-1 text-[12px] text-[#6e6e73]">{note}</p>}
    </div>
  );
}

/* 현지 견적 바꾸기: 세금 제외 판매가 → 부가세, 세금 포함 총액 확인 → [견적 적용] */
function LocalEditor({ onDone }) {
  const { deal, update } = useDeal();
  const line = deal.local.lines[0];
  const [draft, setDraft] = useState(String(line?.price ?? ""));
  if (!line) return <p className="text-[13px] text-[#6e6e73]">현지 견적 줄이 없음</p>;
  const qty = parseNum(line.qty).value ?? 1;
  const vat = parseNum(deal.local.vatPct).value ?? 0;
  const p = parseNum(draft);
  const net = p.state === "ok" ? Math.round(p.value * qty) : null;
  const tax = net !== null ? Math.round((net * vat) / 100) : null;
  return (
    <div className="mt-3 rounded-xl bg-[var(--fill-soft)] p-4" data-testid="local-editor">
      <NumField id="local-net" label="세금 제외 판매가 (1세트)" value={draft} onChange={setDraft} suffix="IDR" />
      <dl className="mt-3 grid grid-cols-2 gap-y-1 text-[14px]">
        <dt className="text-[#6e6e73]">부가세 {vat}%</dt><dd className="text-right tabular-nums">{rp(tax)}</dd>
        <dt className="font-semibold">세금 포함 총액</dt><dd className="text-right font-semibold tabular-nums" data-testid="local-draft-total">{rp(net !== null ? net + tax : null)}</dd>
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={p.state !== "ok"} onClick={() => { update(`local.lines.${line.id}.price`, String(p.value)); onDone(); }} className={cn(btn, btnOn, "disabled:opacity-40")}>견적 적용</button>
        <button type="button" onClick={onDone} className={btn}>취소</button>
      </div>
      <p className="mt-2 text-[12px] text-[#6e6e73]">적용하면 홈과 현지 견적서에 같은 금액 반영. 본사가 파트너에게 내는 USD 수출 견적은 별도 계약이라 그대로.</p>
    </div>
  );
}

/* 병원 조건 바꾸기: 장비값 기준 세 가지, 회당 수납액, 월 시술 횟수 */
function HospitalEditor({ C }) {
  const { deal, update } = useDeal();
  const h = deal.econ.hospital;
  const pick = investKind(h, C);
  const L = calcLocal(deal);
  const choose = (k) => {
    update("econ.hospital.investPick", k);
    if (k === "baseline") { update("econ.hospital.investMode", "custom"); update("econ.hospital.investCustom", String(C.invest)); }
    if (k === "local") update("econ.hospital.investMode", "local");
    if (k === "custom") { update("econ.hospital.investMode", "custom"); update("econ.hospital.investCustom", h.investManual || String(C.invest)); }
  };
  const opts = [
    ["baseline", "발표 기준 사용", `부록 A8 ${rp(C.invest)}`],
    ["local", "현지 견적 사용", `현재 세금 포함 총액 ${rp(L.total)}`],
    ["custom", "직접 입력", "이 병원과 별도로 협의한 도입비"],
  ];
  return (
    <div className="mt-3 rounded-xl bg-[var(--fill-soft)] p-4" data-testid="hospital-editor">
      <p className="text-[14px] font-semibold">어떤 장비값으로 계산할까요?</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="장비값 기준">
        {opts.map(([k, l, d]) => (
          <button key={k} type="button" role="radio" aria-checked={pick === k} onClick={() => choose(k)} className={cn("rounded-md border px-3 py-2 text-left", pick === k ? "border-primary bg-white ring-1 ring-primary" : "border-[var(--line-strong)] bg-white")}>
            <span className="block text-[14px] font-medium">{l}</span><span className="block text-[12px] text-[#6e6e73]">{d}</span>
          </button>
        ))}
      </div>
      {pick === "custom" && (
        <div className="mt-3">
          <NumField id="invest-custom" label="이 병원 도입비 (직접 입력)" value={h.investCustom} onChange={(v) => { update("econ.hospital.investCustom", v); update("econ.hospital.investManual", v); }} suffix="IDR" note="이 병원 손익만 바뀌고 현지 견적서는 그대로" />
        </div>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <NumField id="consult-price" label="시술 1회당 병원이 받는 돈" value={h.price} onChange={(v) => { update("econ.hospital.price", v); update("econ.hospital.dropPrev", ""); }} suffix="IDR" />
        <NumField id="consult-sessions" label="한 달 예상 유료 시술 횟수" value={h.sessions} onChange={(v) => update("econ.hospital.sessions", v)} suffix="회" />
      </div>
    </div>
  );
}

function priceLabel(h, C) {
  if (h.dropPrev) return "수납액 20% 하락 가정";
  return Number(h.price) === C.price ? "발표자료 가정" : "직접 입력한 가정";
}

/* 장비값 기준: 수익성 화면에서 바꾼 경우도 같은 이름으로 (현지 견적 사용, 발표 기준, 직접 입력) */
export function investKind(h, C) {
  if (h.investMode !== "custom") return "local";
  if (h.investPick === "custom") return "custom";
  return Number(h.investCustom) === Number(C.invest) ? "baseline" : "custom";
}

/* 답장 전문 문구 (한국어, 인도네시아어). 숫자 형식은 덱과 같은 Rp528,090,000 */
const ROW_ID = { "회당 변동비": "Biaya variabel per tindakan", "월 운영 고정비": "Biaya tetap operasional bulanan", "항목": "Item" };
const idJuta = (v) => `${v < 0 ? "defisit" : "surplus"} sekitar ${rp(Math.round(Math.abs(v) / 1e4) * 1e4)}`;
const T = {
  ko: {
    label: (x) => x || "항목", none: "없음", times: (v) => `${v}회`,
    s7: "7. 병원 비용 구조 (월 손익 계산에 사용)",
    varSum: (t, list) => `   - 회당 변동비 합계 ${t}: ${list}`, fixSum: (t, list) => `   - 월 고정비 합계 ${t}: ${list}`,
    dep: (v, life) => `   - 장비비 월 배분 ${v} (도입비 ÷ ${life}개월)`,
    price: "시술 1회당 병원 수납액", sessions: "월 예상 유료 시술", investBase: "장비 도입비 기준",
    kind: { local: "현지 견적 총액", custom: "직접 입력", baseline: "발표 기준" },
    rowName: { variable: "회당 변동비", fixed: "월 고정비" }, added: (n, x) => `   - ${n} 추가: ${x}`, removed: (n, x) => `   - ${n} 삭제: ${x}`,
    localPrice: "현지 판매가 (세금 제외)", vat: "부가세율",
    s8: "8. 처음 기준안 대비 바꾼 조건", noChange: "   - 없음 (발표 기준 그대로)",
  },
  id: {
    label: (x) => ROW_ID[x || "항목"] || x, none: "tidak ada", times: (v) => `${v} kali`,
    s7: "7. Struktur biaya rumah sakit (dipakai dalam perhitungan laba rugi bulanan)",
    varSum: (t, list) => `   - Total biaya variabel per tindakan ${t}: ${list}`, fixSum: (t, list) => `   - Total biaya tetap bulanan ${t}: ${list}`,
    dep: (v, life) => `   - Alokasi biaya alat per bulan ${v} (biaya pengadaan ÷ ${life} bulan)`,
    price: "Pendapatan rumah sakit per tindakan", sessions: "Perkiraan tindakan berbayar per bulan", investBase: "Dasar biaya pengadaan alat",
    kind: { local: "total penawaran lokal", custom: "input manual", baseline: "dasar presentasi" },
    rowName: { variable: "Biaya variabel per tindakan", fixed: "Biaya tetap bulanan" }, added: (n, x) => `   - ${n} ditambahkan: ${x}`, removed: (n, x) => `   - ${n} dihapus: ${x}`,
    localPrice: "Harga jual lokal (sebelum pajak)", vat: "Tarif PPN",
    s8: "8. Perubahan dibandingkan rencana awal", noChange: "   - Tidak ada (sesuai dasar presentasi)",
  },
};

/* 비용 구조와 기준안 대비 바꾼 조건 (수익성 화면에서 바꾼 값 그대로) */
const num = (v) => { const x = parseNum(v); return x.state === "ok" ? x.value : null; };
const sumRows = (rows) => rows.reduce((a, r) => a + (num(r.amount) ?? 0), 0);
export function structureLines(deal, C, life, R, lang = "ko") {
  const t = T[lang] || T.ko;
  const h = deal.econ.hospital;
  const item = (r) => `${t.label(r.label)} ${rp(num(r.amount))}`;
  const out = ["", t.s7];
  out.push(t.varSum(rp(sumRows(h.variable)), h.variable.map(item).join(", ") || t.none));
  out.push(t.fixSum(rp(sumRows(h.fixed)), h.fixed.map(item).join(", ") || t.none));
  if (R.H.invest !== null) out.push(t.dep(rp(R.H.invest / life), life));
  const b = deal.baseline;
  const ch = [];
  if (b?.econ?.hospital) {
    const o = b.econ.hospital;
    const cmp = (name, a, z, f = rp) => { if (String(a ?? "") !== String(z ?? "")) ch.push(`   - ${name}: ${a === "" || a === undefined ? t.none : f(num(a))} → ${z === "" ? t.none : f(num(z))}`); };
    cmp(t.price, o.price, h.price);
    cmp(t.sessions, o.sessions, h.sessions, t.times);
    const kind = (x) => t.kind[investKind(x, C)];
    if (kind(o) !== kind(h) || (h.investMode === "custom" && String(o.investCustom) !== String(h.investCustom))) ch.push(`   - ${t.investBase}: ${kind(o)} → ${kind(h)}${h.investMode === "custom" ? ` ${rp(num(h.investCustom))}` : ""}`);
    for (const key of ["variable", "fixed"]) {
      const name = t.rowName[key];
      const before = new Map(o[key].map((r) => [r.id, r])), now = new Map(h[key].map((r) => [r.id, r]));
      for (const r of h[key]) {
        const p = before.get(r.id);
        if (!p) ch.push(t.added(name, item(r)));
        else if (String(p.amount) !== String(r.amount) || p.label !== r.label) ch.push(`   - ${name} '${t.label(r.label || p.label)}': ${rp(num(p.amount))} → ${rp(num(r.amount))}`);
      }
      for (const p of o[key]) if (!now.has(p.id)) ch.push(t.removed(name, item(p)));
    }
  }
  if (b?.local) {
    const lb = new Map(b.local.lines.map((l) => [l.id, l]));
    for (const l of deal.local.lines) { const p = lb.get(l.id); if (p && String(p.price) !== String(l.price)) ch.push(`   - ${t.localPrice}: ${rp(num(p.price))} → ${rp(num(l.price))}`); }
    if (String(b.local.vatPct) !== String(deal.local.vatPct)) ch.push(`   - ${t.vat}: ${b.local.vatPct}% → ${deal.local.vatPct}%`);
  }
  out.push("", t.s8, ...(ch.length ? ch : [t.noChange]));
  return out;
}

export function replyText({ C, deal, L, R, life, lang = "ko" }) {
  const h = deal.econ.hospital;
  const pick = investKind(h, C);
  const same = L.total !== null && R.H.invest !== null && Math.round(L.total) === Math.round(R.H.invest);
  const m = C.mail;
  const adj = Number(h.sessions) !== m.sessions;
  if (lang === "id") {
    const I = { ...m, ...(m.id || {}) };
    const investName = pick === "local" ? "menggunakan total penawaran lokal" : pick === "custom" ? "biaya pengadaan yang disepakati dengan rumah sakit ini, input manual" : "biaya pengadaan dasar presentasi, Lampiran A8";
    const priceName = h.dropPrev ? "asumsi pendapatan turun 20%" : Number(h.price) === C.price ? "asumsi materi presentasi" : "asumsi input manual";
    return [
      `Kepada: ${I.fromTeam}, ${I.from}`,
      `Perihal: Re: Permintaan tinjauan penawaran ${C.product} 1 set`,
      "",
      `Yth. ${I.fromTeam} ${I.from},`,
      "",
      `Berikut hasil tinjauan penawaran ${C.product} 1 set untuk ${I.hospital}.`,
      "",
      `1. Penawaran untuk rumah sakit (total penawaran lokal, termasuk pajak): ${rp(L.total)} (sebelum pajak ${rp(L.net)} + PPN ${deal.local.vatPct}%)`,
      same ? "2. Biaya pengadaan alat dalam perhitungan laba rugi: sama dengan total penawaran lokal di atas" : `2. Biaya pengadaan alat dalam perhitungan laba rugi: ${rp(R.H.invest)} (${investName}, berbeda dari total penawaran lokal)`,
      `3. Perkiraan tindakan berbayar per bulan: ${h.sessions} kali${adj ? ` (disesuaikan dari ${m.sessions} kali dalam email permintaan)` : ""}`,
      `4. Pendapatan rumah sakit per tindakan: ${rp(Number(h.price))} (${priceName}${h.dropPrev ? `, dibandingkan dasar ${rp(Number(h.dropPrev))}` : ""}. Bukan pendapatan aktual rumah sakit)`,
      `5. Jumlah tindakan per bulan untuk titik impas: ${R.bep !== null ? `${R.bep} kali per bulan` : "tidak dapat dihitung"} (termasuk alokasi biaya alat ${life} bulan)`,
      `6. Perkiraan laba rugi per bulan: ${R.profit !== null ? idJuta(R.profit) : "tidak dapat dihitung"}`,
      ...structureLines(deal, C, life, R, "id"),
      "",
      "Sebelum penawaran final, mohon konfirmasi pendapatan aktual per tindakan rumah sakit selama 3 bulan terakhir dan jumlah tindakan berbayar per bulan.",
      "",
      "Hormat kami,",
      `${I.toTeam}, ${I.to}`,
    ].join("\n");
  }
  const investName = pick === "local" ? "현지 견적 총액 적용" : pick === "custom" ? "이 병원과 협의한 도입비, 직접 입력" : "발표 기준 도입비, 부록 A8";
  const lines = [
    `받는 사람: ${m.from} ${m.fromTeam}`,
    `제목: Re: ${C.product} 1세트 견적 검토 요청`,
    "",
    `${m.from} ${m.fromTeam} 담당자님께,`,
    "",
    `${m.hospital}의 ${C.product} 1세트 견적 검토 결과를 보내드립니다.`,
    "",
    `1. 병원 제시 견적 (현지 견적 총액, 세금 포함): ${rp(L.total)} (세금 제외 ${rp(L.net)} + 부가세 ${deal.local.vatPct}%)`,
    same ? `2. 손익 계산에 적용한 장비 도입비: 위 현지 견적 총액과 같음` : `2. 손익 계산에 적용한 장비 도입비: ${rp(R.H.invest)} (${investName}, 현지 견적 총액과 다른 금액)`,
    `3. 월 예상 유료 시술: ${h.sessions}회${adj ? ` (요청 메일의 ${m.sessions}회에서 조정)` : ""}`,
    `4. 시술 1회당 병원 수납액: ${rp(Number(h.price))} (${priceLabel(h, C)}${h.dropPrev ? `, 기준 ${rp(Number(h.dropPrev))} 대비` : ""}. 병원의 실제 수납액 아님)`,
    `5. 본전에 필요한 월 시술 횟수: ${R.bep !== null ? `월 ${R.bep}회` : "산출 불가"} (장비값 ${life}개월 배분 포함)`,
    `6. 한 달 예상 손익: ${R.profit !== null ? manwon(R.profit) : "산출 불가"}`,
    ...structureLines(deal, C, life, R),
    "",
    "최종 제안 전에 병원의 최근 3개월 실제 회당 수납액과 월별 유료 시술 건수를 확인 부탁드립니다.",
    "",
    `${m.to} ${m.toTeam}`,
  ];
  return lines.join("\n");
}

/* 답장 언어 전환 (한국어, 인도네시아어) */
export function LangSwitch({ lang, setLang }) {
  return (
    <span role="group" aria-label="답장 언어" className="inline-flex rounded-md border border-[var(--line-strong)] p-0.5 text-[13px]">
      {[["ko", "한국어"], ["id", "Bahasa Indonesia"]].map(([k, l]) => (
        <button key={k} type="button" aria-pressed={lang === k} onClick={() => setLang(k)} className={cn("h-8 rounded px-3 font-medium", lang === k ? "bg-primary text-white" : "hover:bg-[var(--fill-soft)]")}>{l}</button>
      ))}
    </span>
  );
}

export function ConsultView({ children }) {
  const { deal, update } = useDeal();
  const C = PACK.consult;
  const m = C.mail;
  const life = Number(C.lifeMonths) || 48;
  const h = deal.econ.hospital;
  const L = calcLocal(deal);
  const R = consultCalc(deal, life);
  const [open, setOpen] = useState(null); // "local" | "hospital"
  const [reply, setReply] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState("ko");
  const drop = !!h.dropPrev;
  const toggleDrop = () => {
    if (drop) { update("econ.hospital.price", h.dropPrev); update("econ.hospital.dropPrev", ""); }
    else { const p = Number(h.price); if (!(p > 0)) return; update("econ.hospital.dropPrev", String(h.price)); update("econ.hospital.price", String(Math.round(p * 0.8))); }
  };
  const resetConsult = () => {
    ["investPick:baseline", "investMode:custom", `investCustom:${C.invest}`, `price:${C.price}`, `sessions:${C.sessions}`, "dropPrev:"].forEach((kv) => { const i = kv.indexOf(":"); update(`econ.hospital.${kv.slice(0, i)}`, kv.slice(i + 1)); });
  };
  const text = replyText({ C, deal, L, R, life, lang });
  const copy = async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { setCopied(false); } };
  const pick = investKind(h, C);
  const investName = pick === "local" ? "현지 견적 총액 적용" : pick === "custom" ? "직접 입력" : "발표 기준 (부록 A8)";

  return (
    <div className="mx-auto max-w-[1000px] px-4 pt-8 pb-24 sm:px-6" data-testid="consult">
      <Link to="/" className="text-[13px] text-[#6e6e73] hover:underline">← 받은 견적 요청으로</Link>
      <h1 className="mt-2 text-[26px] font-bold tracking-[-0.02em] sm:text-[30px]">견적 검토, {m.hospital}</h1>
      <p className="mt-1 text-[14px] text-[#424245]" data-testid="consult-request">{C.product} 1세트, {m.from} 요청, 병원 예상 월 {m.sessions}회</p>
      <ol className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px]" aria-label="거래 흐름">
        {C.chain.map((c, i) => (
          <li key={c} className="flex items-center gap-2">{i > 0 && <ArrowRight className="size-4 text-[#86868b]" aria-hidden="true" />}<span className={cn("rounded-md border px-2.5 py-1", i === C.chain.length - 1 ? "border-primary text-primary" : "border-[var(--line)]")}>{c}</span></li>
        ))}
      </ol>

      <FxBar className="mt-5" />

      <section aria-label="두 가지 금액" className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <p className="text-[13px] text-[#6e6e73]">현지 견적 총액</p>
          <p className="mt-0.5 text-[26px] font-semibold tabular-nums tracking-tight" data-testid="local-total">{rp(L.total)}</p>
          <FxEq idr={L.total} />
          <p className="text-[13px] text-[#424245]">파트너가 병원에 제시할 세금 포함 가격</p>
          <button type="button" aria-expanded={open === "local"} onClick={() => setOpen(open === "local" ? null : "local")} className={cn(btn, "mt-3")}>현지 견적 바꾸기</button>
          {open === "local" && <LocalEditor onDone={() => setOpen(null)} />}
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <p className="text-[13px] text-[#6e6e73]">병원 손익 계산에 쓰는 도입비</p>
          <p className="mt-0.5 text-[26px] font-semibold tabular-nums tracking-tight" data-testid="consult-invest">{rp(R.H.invest)}</p>
          <FxEq idr={R.H.invest} />
          <p className="text-[13px] text-[#424245]">이번 상담에서 장비값으로 적용할 금액, {investName}</p>
          <button type="button" aria-expanded={open === "hospital"} onClick={() => setOpen(open === "hospital" ? null : "hospital")} className={cn(btn, "mt-3")}>병원 조건 바꾸기</button>
          {open === "hospital" && <HospitalEditor C={C} />}
        </div>
      </section>

      <section aria-labelledby="res-t" className="mt-6 rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6">
        <h2 id="res-t" className="sr-only">검토 결과</h2>
        <p className="text-[13px] text-[#6e6e73]">시술 1회당 병원이 받는 돈 <b className="tabular-nums text-[#1d1d1f]" data-testid="consult-price">{rp(Number(h.price))}</b> ({priceLabel(h, C)}), 한 달 예상 유료 시술 <b className="tabular-nums text-[#1d1d1f]">{h.sessions}회</b></p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="border-l-2 border-primary pl-4">
            <dt className="text-[14px] text-[#424245]">본전에 필요한 월 시술 횟수</dt>
            <dd className="mt-0.5 text-[34px] font-semibold tabular-nums tracking-tight" data-testid="consult-bep">{R.bep !== null ? `월 ${R.bep}회` : "산출 불가"}</dd>
          </div>
          <div className="border-l-2 border-primary pl-4">
            <dt className="text-[14px] text-[#424245]">한 달 예상 손익</dt>
            <dd className="mt-0.5 text-[34px] font-semibold tabular-nums tracking-tight" data-testid="consult-profit">{R.profit !== null ? manwon(R.profit) : "산출 불가"}</dd>
            {R.profit !== null && <FxEq idr={R.profit} />}
          </div>
        </dl>
        <p className="mt-3 text-[13px] text-[#6e6e73]">장비값을 {life}개월로 나눈 비용까지 포함했어요</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" aria-pressed={drop} onClick={toggleDrop} className={cn(btn, drop && btnOn)}>한 번에 받는 돈이 20% 줄면?</button>
          <button type="button" onClick={resetConsult} className={btn}><RotateCcw className="size-4" aria-hidden="true" />발표 기준으로 보기</button>
        </div>
      </section>

      <section className="mt-6">
        <button type="button" aria-expanded={reply} onClick={() => setReply(!reply)} className={cn(btn, btnOn, "h-11 px-5 text-[15px]")}>파트너에게 보낼 답장 초안 보기</button>
        {reply && (
          <div className="mt-3 rounded-2xl border border-[var(--line)] bg-white p-5" data-testid="reply">
            <div className="mb-3"><LangSwitch lang={lang} setLang={setLang} /></div>
            <pre className="whitespace-pre-wrap font-sans text-[14px] leading-relaxed text-[#1d1d1f]">{text}</pre>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button type="button" onClick={copy} className={btn}><Copy className="size-4" aria-hidden="true" />복사</button>
              <span className="text-[12px] text-[#6e6e73]" aria-live="polite">{copied ? "복사됨" : "초안 보기와 복사만 가능, 발송 기능 없음"}</span>
            </div>
          </div>
        )}
      </section>

      <details className="mt-10 rounded-2xl border border-[var(--line)] bg-white">
        <summary className="cursor-pointer px-5 py-4 text-[15px] font-medium">계산 기준과 출처 보기</summary>
        <div className="border-t border-[var(--line)] px-1 pb-4">
          <p className="px-4 pt-4 text-[13px] text-[#424245]">{C.src}. 회당 수납액은 메일에 없는 값이라 발표자료 가정 사용.</p>
          {children}
        </div>
      </details>
    </div>
  );
}
