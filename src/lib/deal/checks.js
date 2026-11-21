/* 검토 규칙: 입력 누락, 계산, 서류 간 일치, 중량·포장, 조건 변경.
   모두 입력값과 계산식으로만 판단합니다. 법적 적합성, 통관 승인, 판매 가능 여부는 판단하지 않습니다 */
import { parseNum, parseDate, daysBetween, fmtMoney, digitsOf } from "./money.js";
import { calcExport, calcLocal, weights, partyOf, invoiceTerms } from "./calc.js";
import { keyTerms, hashOf } from "./model.js";

export const LEVELS = {
  fix: { label: "수정 필요", desc: "이대로는 서류가 틀리거나 빈칸이 남아요." },
  confirm: { label: "확인 필요", desc: "값은 있지만 근거나 조건을 한 번 더 확인하세요." },
  ok: { label: "입력값 일치", desc: "이 도구가 검사한 범위 안에서 문제가 없어요." },
};
export const SECTIONS = {
  basic: "기본 거래정보", parties: "당사자", items: "제품·가격", terms: "결제·운송", packing: "포장·중량", service: "설치·서비스", local: "현지 판매", docs: "서류·메일",
};
const SEA_ONLY = ["FAS", "FOB", "CFR", "CIF"];
export const INCOTERMS = ["EXW", "FCA", "CPT", "CIP", "DAP", "DPU", "DDP", "FAS", "FOB", "CFR", "CIF"];
const NEEDS_FREIGHT = ["CPT", "CIP", "CFR", "CIF", "DAP", "DPU", "DDP"];
const NEEDS_INS = ["CIP", "CIF"];

export function runChecks(d) {
  const out = [];
  const add = (level, section, field, label, value, why, how, docs = []) => out.push({ id: `${section}:${field}:${label}`, level, section, field, label, value, why, how, docs });
  const stage = d.meta.stage; // quote | invoice
  const inv = stage === "invoice";
  const E = calcExport(d), cur = d.exp.currency;
  const blank = (v) => !String(v || "").trim();

  /* --- 기본 --- */
  if (blank(d.meta.name)) add("confirm", "basic", "meta.name", "거래명", "비어 있음", "여러 거래를 저장하면 구분하기 어려워요.", "거래명을 적으세요. 예: 인도네시아 파트너 1세트 수출");

  /* --- 당사자 --- */
  const seller = partyOf(d, "exportSeller"), buyer = partyOf(d, "exportBuyer");
  if (blank(seller.name)) add("fix", "parties", `parties.${d.roles.exportSeller}.name`, "수출 판매자 이름", "비어 있음", "견적서·인보이스의 발행자 칸이 비어요.", "판매자(제조사) 회사명을 공식 영문 표기로 적으세요.", ["quote", "invoice"]);
  if (blank(buyer.name)) add("fix", "parties", `parties.${d.roles.exportBuyer}.name`, "수출 구매자 이름", "비어 있음", "견적서 수신처와 인보이스 Buyer 칸이 비어요.", "현지 파트너(수입자) 회사명을 적으세요.", ["quote", "invoice"]);
  if (d.roles.exportSeller === d.roles.exportBuyer) add("fix", "parties", "roles.exportBuyer", "수출 계약 당사자", "판매자와 구매자가 같음", "같은 회사가 사고팔 수는 없어요.", "수출 계약의 구매자를 다시 고르세요.");
  if (inv) {
    if (blank(seller.address)) add("fix", "parties", `parties.${d.roles.exportSeller}.address`, "판매자(Shipper) 주소", "비어 있음", "상업송장에는 수출자 주소가 들어가야 해요.", "회사 자료에 있는 영문 주소를 적으세요. 임의로 만들지 마세요.", ["invoice"]);
    if (blank(buyer.address)) add("fix", "parties", `parties.${d.roles.exportBuyer}.address`, "구매자 주소", "비어 있음", "상업송장의 Buyer 칸에 주소가 필요해요.", "파트너에게 받은 영문 주소를 적으세요.", ["invoice"]);
    const cons = d.parties[d.roles.consignee];
    if (d.roles.consignee && cons && blank(cons.name)) add("fix", "parties", `parties.${d.roles.consignee}.name`, "수하인(Consignee)", "비어 있음", "화물을 받는 회사가 인보이스에 없어요.", "수하인을 고르거나 이름을 적으세요.", ["invoice"]);
    if (d.roles.consignee === "hospital" && d.local.enabled) add("confirm", "parties", "roles.consignee", "수하인", "병원", "수입자(구매자)와 화물 수령처가 다르면 수입 신고 주체를 다시 확인해야 해요.", "현지 파트너와 수입 신고 주체를 확인한 뒤 수하인을 정하세요.", ["invoice"]);
  }

  /* --- 제품·가격 --- */
  if (!E.items.length) add("fix", "items", "exp.items", "제품 구성", "품목 없음", "서류에 들어갈 품목이 없어요.", "본체를 한 줄 이상 추가하세요.");
  E.items.forEach((it, i) => {
    const name = it.model || it.desc || `${i + 1}번 품목`;
    const f = (k) => `exp.items.${it.id}.${k}`;
    if (blank(it.model) && blank(it.desc)) add("fix", "items", f("model"), `${i + 1}번 품목 이름`, "비어 있음", "서류에 품명이 없어요.", "모델명과 설명을 적으세요.", ["quote", "invoice"]);
    if (it.q.state === "blank") add("fix", "items", f("qty"), `${name} 수량`, "비어 있음", "금액을 계산할 수 없어요.", "수량을 적으세요.", ["quote", "invoice"]);
    else if (it.q.state === "invalid") add("fix", "items", f("qty"), `${name} 수량`, `"${it.qty}"`, "숫자가 아니에요.", "숫자만 적으세요.");
    else if (it.q.value < 0) add("fix", "items", f("qty"), `${name} 수량`, it.qty, "수량은 음수일 수 없어요.", "0보다 큰 수로 고치세요.");
    else if (it.q.value === 0) add("fix", "items", f("qty"), `${name} 수량`, "0", "수량이 0이면 서류에 넣을 이유가 없어요.", "수량을 고치거나 이 줄을 지우세요.");
    else if (!Number.isInteger(it.q.value)) add("confirm", "items", f("qty"), `${name} 수량`, it.qty, "세트·개 단위인데 소수예요.", "단위가 kg·m처럼 소수가 맞는지 확인하세요.");
    if (it.p.state === "blank") {
      if (it.kind !== "main") add("fix", "items", f("price"), `${name} 단가`, "비어 있음", "추가 구성의 가격 확인이 필요해요. 가격 근거 없이 금액을 계산하지 않았어요.", "가격표나 파트너와 합의한 단가를 적고, 본체 가격에 포함이면 0과 근거를 적으세요.", ["quote", "invoice"]);
      else add("fix", "items", f("price"), `${name} 단가`, "비어 있음", "총액을 계산할 수 없어요.", "단가를 적으세요.", ["quote", "invoice"]);
    } else if (it.p.state === "invalid") add("fix", "items", f("price"), `${name} 단가`, `"${it.price}"`, "숫자가 아니에요.", "숫자만 적으세요. 쉼표는 괜찮아요.");
    else if (it.p.value < 0) add("fix", "items", f("price"), `${name} 단가`, it.price, "단가는 음수일 수 없어요.", "할인은 별도 줄로 적지 말고 단가에 반영하세요.");
    else {
      const dec = (String(it.price).split(".")[1] || "").length;
      if (dec > digitsOf(cur)) add("confirm", "items", f("price"), `${name} 단가`, it.price, `${cur}는 소수 ${digitsOf(cur)}자리까지 표시해요. 금액은 반올림해 계산했어요.`, "단가를 표시 자릿수에 맞게 고치세요.");
      if (it.p.value === 0) add("confirm", "items", f("price"), `${name} 단가`, "0", "무상 품목인지 본체 가격 포함인지 서류만 봐서는 몰라요.", "가격 근거 칸에 '본체 가격에 포함' 등 이유를 적으세요.");
      if (blank(it.priceSource)) add("confirm", "items", f("priceSource"), `${name} 가격 근거`, "비어 있음", it.kind === "main" ? "단가의 출처가 없으면 견적 근거를 설명하기 어려워요." : "추가 구성의 가격 근거가 없어요.", "가격표 이름·기준일이나 '파트너와 합의(날짜)'를 적으세요.");
    }
    if (it.minor !== null) add("ok", "items", f("qty"), `${name} 금액`, fmtMoney(it.minor, cur), "수량 × 단가로 계산했고 서류 세 곳에 같은 값이 들어가요.", "");
  });
  E.extras.forEach((x) => {
    const lab = x.label || "추가 비용";
    if (x.a.state !== "ok") add("fix", "items", `exp.extras.${x.id}.amount`, lab, x.a.state === "blank" ? "비어 있음" : `"${x.amount}"`, x.included ? "합계에 넣는 비용인데 금액이 없어요." : "금액이 없어요.", "금액을 적거나 줄을 지우세요.");
    else if (x.a.value < 0) add("fix", "items", `exp.extras.${x.id}.amount`, lab, x.amount, "음수예요.", "0 이상으로 고치세요.");
  });
  if (E.total !== null) add("ok", "items", "exp.items", "수출 총액", fmtMoney(E.total, cur), "품목 금액" + (E.extrasMinor ? "과 포함 비용" : "") + "의 합계예요. 줄마다 반올림한 뒤 더했어요.", "");

  /* --- 결제·운송 --- */
  const inc = d.exp.incoterm;
  if (blank(inc)) add("fix", "terms", "exp.incoterm", "인도조건", "비어 있음", "누가 어디까지 비용과 위험을 지는지 서류에 없어요.", "Incoterms 규칙을 고르세요.", ["quote", "invoice"]);
  if (blank(d.exp.place)) add("fix", "terms", "exp.place", "인도 지정 장소", "비어 있음", "Incoterms는 규칙 이름과 지정 장소를 함께 써야 뜻이 정해져요.", "예: EXW Seoul, FCA Incheon Airport처럼 장소를 적으세요.", ["quote", "invoice"]);
  if (inc && SEA_ONLY.includes(inc) && d.exp.transport && d.exp.transport !== "sea") add("confirm", "terms", "exp.incoterm", "인도조건과 운송 방식", `${inc} · ${d.exp.transport === "air" ? "항공" : d.exp.transport}`, `ICC Incoterms 2020은 ${inc}를 해상·내수로 운송용으로 안내해요.`, "항공·복합운송이면 FCA·CPT·CIP 같은 규칙이 맞는지 파트너와 확인하세요.", ["quote", "invoice"]);
  if (inc === "EXW" && blank(d.exp.exportClearance)) add("confirm", "terms", "exp.exportClearance", "EXW 수출통관 담당", "비어 있음", "EXW는 원칙적으로 구매자가 수출통관을 맡아요. 한국 수출신고를 누가 할지 서류에 없어요.", "판매자가 대행한다면 그 내용을 적으세요.", ["quote"]);
  if (NEEDS_FREIGHT.includes(inc) && !E.extras.some((x) => /freight|운임/i.test(x.label))) add("confirm", "terms", "exp.extras", `${inc} 운임`, "운임 줄 없음", `${inc}는 판매자가 운임을 부담하는 조건이에요.`, "운임을 단가에 넣었는지, 별도 줄이 필요한지 확인하세요.");
  if (NEEDS_INS.includes(inc) && !E.extras.some((x) => /insur|보험/i.test(x.label))) add("confirm", "terms", "exp.extras", `${inc} 보험`, "보험 줄 없음", `${inc}는 판매자가 보험을 들어야 하는 조건이에요.`, "보험료 처리 방법을 확인하세요.");
  if (blank(d.exp.transport)) add("confirm", "terms", "exp.transport", "운송 방식", "비어 있음", "인도조건이 운송 방식에 맞는지 확인할 수 없어요.", "항공·해상 등 운송 방식을 고르세요.");

  const pay = E.pay;
  if (!d.exp.payment.length || d.exp.payment.every((p) => blank(p.pct) && blank(p.amount) && blank(p.label))) add("fix", "terms", "exp.payment", "결제조건", "비어 있음", "언제 얼마를 받는지 서류에 없어요.", "결제 회차와 비율 또는 금액을 적으세요.", ["quote", "invoice"]);
  else checkPayment(add, "terms", "exp.payment", "수출 결제", pay, E.total, cur);
  if (blank(d.exp.leadTime)) add("confirm", "terms", "exp.leadTime", "납기", "비어 있음", "견적서에 출고 시점이 없어요.", "예: 입금 후 4주");
  const v = parseNum(d.exp.validityDays);
  if (v.state === "blank") add("fix", "terms", "exp.validityDays", "견적 유효기간", "비어 있음", "가격이 언제까지 유효한지 없어요.", "일 수를 적으세요. 예: 30");
  else if (v.state === "invalid" || v.value <= 0 || !Number.isInteger(v.value)) add("fix", "terms", "exp.validityDays", "견적 유효기간", d.exp.validityDays, "1 이상의 정수가 아니에요.", "일 수를 정수로 적으세요.");

  /* --- 날짜·번호 --- */
  const qd = parseDate(d.exp.quoteDate), id = parseDate(d.exp.invoiceDate);
  if (blank(d.exp.quoteNo)) add("fix", "docs", "exp.quoteNo", "견적서 번호", "비어 있음", "인보이스가 어느 견적을 따르는지 연결할 수 없어요.", "견적 번호를 정하세요.", ["quote", "invoice"]);
  if (qd.state === "blank") add("fix", "docs", "exp.quoteDate", "견적일", "비어 있음", "유효기간의 시작일이 없어요.", "견적일을 고르세요.", ["quote"]);
  else if (qd.state === "invalid") add("fix", "docs", "exp.quoteDate", "견적일", d.exp.quoteDate, "날짜 형식이 아니거나 없는 날짜예요.", "YYYY-MM-DD 형식으로 고르세요.");
  if (inv) {
    if (blank(d.exp.invoiceNo)) add("fix", "docs", "exp.invoiceNo", "인보이스 번호", "비어 있음", "상업송장 번호가 없어요.", "번호를 정하세요.", ["invoice"]);
    if (id.state === "blank") add("fix", "docs", "exp.invoiceDate", "인보이스 날짜", "비어 있음", "상업송장 날짜가 없어요.", "날짜를 고르세요.", ["invoice"]);
    else if (id.state === "invalid") add("fix", "docs", "exp.invoiceDate", "인보이스 날짜", d.exp.invoiceDate, "날짜 형식이 아니거나 없는 날짜예요.", "YYYY-MM-DD 형식으로 고르세요.");
    if (qd.state === "ok" && id.state === "ok") {
      const gap = daysBetween(qd.value, id.value);
      if (gap < 0) add("fix", "docs", "exp.invoiceDate", "인보이스 날짜", d.exp.invoiceDate, "견적일보다 앞서요.", "날짜 순서를 고치세요.", ["invoice"]);
      else if (v.state === "ok" && gap > v.value) add("confirm", "docs", "exp.invoiceDate", "견적 유효기간 경과", `견적일 + ${gap}일`, `견적 유효기간(${v.value}일) 뒤에 인보이스를 발행해요.`, "유효기간 안에 주문받았는지, 가격을 다시 확인했는지 보세요.");
    }
    if (blank(d.exp.destination)) add("confirm", "docs", "exp.destination", "도착 국가", "비어 있음", "인보이스의 도착지가 비어요.", "도착 국가·도시를 적으세요.", ["invoice"]);
  }

  /* --- 서류 간 일치 (같은 기준정보에서 만든 서류) --- */
  const it = invoiceTerms(d);
  if (it.overridden) {
    const diff = [];
    if (it.incoterm !== d.exp.incoterm) diff.push(`인도조건 ${d.exp.incoterm || "—"} → ${it.incoterm || "—"}`);
    if (it.place !== d.exp.place) diff.push(`장소 ${d.exp.place || "—"} → ${it.place || "—"}`);
    if (diff.length && blank(d.exp.invoiceOverride.reason)) add("fix", "docs", "exp.invoiceOverride.reason", "인보이스만 다른 조건", diff.join(", "), "견적서와 인보이스 조건이 다른데 이유가 없어요.", "변경 사유를 적거나 '인보이스만 다르게'를 끄세요.", ["quote", "invoice"]);
    else if (diff.length) add("confirm", "docs", "exp.invoiceOverride.reason", "인보이스만 다른 조건", `${diff.join(", ")} (사유: ${d.exp.invoiceOverride.reason})`, "견적서와 인보이스의 인도조건이 달라요.", "파트너와 합의한 변경인지 확인하세요.", ["quote", "invoice"]);
    else add("ok", "docs", "exp.invoiceOverride.on", "인보이스 별도 조건", "견적서와 같음", "별도 값을 켰지만 견적서와 같아요.", "");
  } else if (d.exp.incoterm && d.exp.place) add("ok", "docs", "exp.incoterm", "견적서·인보이스 인도조건", `${d.exp.incoterm} ${d.exp.place}`, "두 서류가 같은 기준정보에서 만들어져요 (기준정보로 동기화됨).", "");
  if (E.total !== null && buyer.name) add("ok", "docs", "exp.items", "견적서·인보이스·메일 품목과 금액", `${E.items.length}개 품목 · ${new Intl.NumberFormat("en-US").format(E.total / 10 ** digitsOf(cur))} ${cur}`, "모델·수량·단위·단가·통화·총액·구매자를 같은 기준정보로 만들어요 (기준정보로 동기화됨). 이 도구 밖의 문서와는 대조하지 않았어요.", "");

  /* --- 포장·중량 --- */
  const W = weights(d);
  const wl = inv ? "fix" : "confirm";
  if (W.pk.state === "blank") add(wl, "packing", "exp.packages", "포장 수량", "비어 있음", "인보이스·패킹리스트의 포장 개수가 비어요.", "포장 개수를 적으세요. 제품 수량과 같을 필요는 없어요.", ["invoice"]);
  else if (W.pk.state === "invalid" || W.pk.value <= 0 || !Number.isInteger(W.pk.value)) add("fix", "packing", "exp.packages", "포장 수량", d.exp.packages, "1 이상의 정수가 아니에요.", "포장 개수를 정수로 적으세요.");
  ["nw", "gw"].forEach((k) => {
    const p = W[k], lab = k === "nw" ? "순중량(N.W.)" : "총중량(G.W.)";
    if (p.state === "blank") add(wl, "packing", `exp.${k}`, lab, "비어 있음", inv ? "인보이스 중량 칸이 비어요." : "출하 전에 인보이스 중량 칸을 채워야 해요.", "포장 후 실측한 값을 적으세요. 추정값을 넣지 마세요.", ["invoice"]);
    else if (p.state === "invalid") add("fix", "packing", `exp.${k}`, lab, `"${d.exp[k]}"`, "숫자가 아니에요.", "숫자만 적으세요.");
    else if (p.value <= 0) add("fix", "packing", `exp.${k}`, lab, d.exp[k], "0 이하예요.", "실측값으로 고치세요.");
  });
  if (W.nw.state === "ok" && W.gw.state === "ok" && W.nw.value > 0 && W.gw.value > 0) {
    if (d.exp.nwUnit !== d.exp.gwUnit) add("fix", "packing", "exp.gwUnit", "중량 단위", `N.W. ${d.exp.nwUnit} · G.W. ${d.exp.gwUnit}`, "순중량과 총중량 단위가 달라 비교할 수 없어요.", "같은 단위로 맞추세요.", ["invoice"]);
    else if (W.gw.value < W.nw.value) add("fix", "packing", "exp.gw", "총중량 < 순중량", `G.W. ${d.exp.gw} < N.W. ${d.exp.nw} ${d.exp.gwUnit}`, "총중량은 포장재를 포함하므로 순중량보다 작을 수 없어요.", "두 값을 바꿔 적지 않았는지, 개당·전체를 섞지 않았는지 확인하세요.", ["invoice"]);
    else add("ok", "packing", "exp.gw", "순중량·총중량", `N.W. ${W.nwTotal ?? "—"} / G.W. ${W.gwTotal ?? "—"} ${d.exp.gwUnit}${W.per ? " (포장 1개당 × 개수)" : ""}`, "총중량이 순중량 이상이고 단위가 같아요.", "");
    if (W.per && W.pk.state !== "ok") add("fix", "packing", "exp.packages", "포장 1개당 중량", "포장 수량 없음", "포장 1개당 중량으로 적었는데 포장 수량이 없어 전체 중량을 계산할 수 없어요.", "포장 수량을 적거나 '화물 전체'로 바꾸세요.", ["invoice"]);
    if (W.per) add("confirm", "packing", "exp.weightBasis", "중량 기준", "포장 1개당", "모든 포장이 같은 무게라고 가정해 전체 중량을 곱했어요.", "포장마다 무게가 다르면 '화물 전체'로 바꿔 합계를 적으세요.", ["invoice"]);
  }

  /* --- 설치·서비스 --- */
  if (d.local.enabled) {
    if (blank(d.service.installBy)) add("confirm", "service", "service.installBy", "설치 담당", "비어 있음", "병원에 누가 설치하는지 정해지지 않았어요.", "합의한 담당 회사를 적으세요.");
    if (blank(d.service.asBy)) add("confirm", "service", "service.asBy", "A/S 담당", "비어 있음", "판매 후 수리 책임자가 서류에 없어요.", "합의한 담당 회사를 적으세요.");
  }

  /* --- 현지 판매 --- */
  if (d.local.enabled) {
    const L = calcLocal(d), lc = d.local.currency;
    const lbuyer = partyOf(d, "localBuyer"), lseller = partyOf(d, "localSeller");
    if (blank(lbuyer.name)) add("fix", "local", `parties.${d.roles.localBuyer}.name`, "현지 구매자(병원) 이름", "비어 있음", "현지 견적서 수신처가 없어요.", "병원 이름을 적으세요.", ["local"]);
    if (blank(lseller.name)) add("fix", "local", `parties.${d.roles.localSeller}.name`, "현지 판매자 이름", "비어 있음", "현지 견적서 발행자가 없어요.", "현지 파트너 이름을 적으세요.", ["local"]);
    if (!d.local.priceBasis) add("fix", "local", "local.priceBasis", "현지 가격의 성격", "선택 안 함", "파트너가 준 가격인지 팀이 모의로 정한 가격인지 구분되지 않아요.", "가격 출처를 고르세요.", ["local"]);
    if (lc === d.exp.currency) add("confirm", "local", "local.currency", "현지 거래 통화", lc, "현지 거래와 수출 거래의 통화가 같아요.", "현지 판매 통화가 맞는지 확인하세요.", ["local"]);
    L.lines.forEach((l, i) => {
      const lab = l.desc || `${i + 1}번 줄`;
      if (l.q.state !== "ok" || l.q.value <= 0) add("fix", "local", `local.lines.${l.id}.qty`, `현지 견적 ${lab} 수량`, l.q.state === "blank" ? "비어 있음" : l.qty, "수량이 없거나 0 이하예요.", "수량을 적으세요.", ["local"]);
      if (l.p.state === "blank") add("fix", "local", `local.lines.${l.id}.price`, `현지 견적 ${lab} 가격`, "비어 있음", "현지 가격이 없어요. 수출가에 환율을 곱해 만들지 않아요.", "파트너가 준 값이나 팀이 정한 모의 값을 적으세요.", ["local"]);
      else if (l.p.state === "invalid" || l.p.value < 0) add("fix", "local", `local.lines.${l.id}.price`, `현지 견적 ${lab} 가격`, l.price, "숫자가 아니거나 음수예요.", "고치세요.", ["local"]);
    });
    if (L.vat.state === "invalid" || (L.vat.state === "ok" && (L.vat.value < 0 || L.vat.value > 100))) add("fix", "local", "local.vatPct", "부가세율", d.local.vatPct, "0–100 사이 숫자가 아니에요.", "세율을 고치세요.", ["local"]);
    else if (L.vat.state === "blank") add("confirm", "local", "local.vatPct", "부가세율", "비어 있음", "현지 견적에 부가세가 빠졌어요(0으로 계산).", "세율을 확인해 적으세요.", ["local"]);
    if (!d.local.payment.length) add("fix", "local", "local.payment", "현지 결제조건", "비어 있음", "병원이 언제 얼마를 내는지 없어요.", "결제 회차를 적으세요.", ["local"]);
    else checkPayment(add, "local", "local.payment", "현지 결제", L.pay, L.total, lc);
    if (L.total !== null) add("ok", "local", "local.lines", "현지 견적 총액", fmtMoney(L.total, lc), `입력한 현지 가격${L.vatMinor ? "과 부가세" : ""}로 계산했어요. 수출 금액과 환산하지 않았어요.`, "");
  }

  /* --- 메일 --- */
  const em = d.email;
  if (blank(em.senderName)) add("fix", "docs", "email.senderName", "메일 서명: 발신자 이름", "비어 있음", "메일 끝에 보낸 사람이 없어요.", "실제 보내는 사람의 이름을 적으세요.", ["email"]);
  if (blank(em.senderEmail) && blank(em.senderPhone)) add("fix", "docs", "email.senderEmail", "메일 서명: 연락처", "비어 있음", "받는 사람이 답장할 연락처가 서명에 없어요.", "회사 이메일이나 전화번호를 적으세요.", ["email"]);
  if (blank(em.senderTitle) || blank(em.senderOrg)) add("confirm", "docs", blank(em.senderTitle) ? "email.senderTitle" : "email.senderOrg", "메일 서명: 직함·소속", "일부 비어 있음", "서명에 직함이나 회사명이 없어요.", "직함과 회사명을 적으세요.", ["email"]);
  if (blank(em.toName) && blank(em.toEmail)) add("confirm", "docs", "email.toName", "메일 받는 사람", "비어 있음", "메일 인사말과 수신 주소가 비어요.", "파트너 담당자 이름 또는 이메일을 적으세요.", ["email"]);

  /* --- 조건 변경 --- */
  if (d.review.hash && d.review.hash !== hashOf(keyTerms(d))) add("confirm", "basic", "meta.name", "검토 후 조건 변경", `검토 표시 ${d.review.at ? d.review.at.slice(0, 16).replace("T", " ") : ""} 이후 바뀜`, "검토를 표시한 뒤 품목·수량·단가·결제·중량 등 핵심 조건이 바뀌었어요.", "변경 기록을 보고 서류를 다시 확인한 뒤 검토를 다시 표시하세요.");

  /* --- 근거자료 --- */
  const unconfirmed = d.evidence.filter((e) => e.ref && !e.confirmed && e.status !== "mock");
  if (unconfirmed.length) add("confirm", "basic", "evidence", "출처만 있고 내용 미확인", `${unconfirmed.length}건`, "출처를 적었지만 내용이 맞는지 확인 표시가 없어요.", "근거 패널에서 원문을 보고 '내용 확인함'을 체크하세요.");

  const order = { fix: 0, confirm: 1, ok: 2 };
  return out.sort((a, b) => order[a.level] - order[b.level]);
}

function checkPayment(add, section, field, lab, pay, total, cur) {
  if (pay.mode === "mixed") return add("fix", section, field, `${lab} 일정`, "비율과 금액 혼용", "회차마다 비율과 금액을 섞어 적어 합계를 맞출 수 없어요.", "모든 회차를 비율(%)이나 금액 한 가지로 적으세요.");
  const bad = pay.rows.find((r) => (pay.mode === "pct" ? r.pctState : r.amountState) !== "ok");
  if (bad) return add("fix", section, `${field}.${bad.id}.${pay.mode === "pct" ? "pct" : "amount"}`, `${lab} 회차 ${bad.label || ""}`.trim(), "비어 있거나 숫자가 아님", "회차 값이 없어 합계를 확인할 수 없어요.", "비율이나 금액을 적으세요.");
  const neg = pay.rows.find((r) => Number(String(pay.mode === "pct" ? r.pct : r.amount).replace(/,/g, "")) < 0);
  if (neg) return add("fix", section, `${field}.${neg.id}.${pay.mode === "pct" ? "pct" : "amount"}`, `${lab} 회차`, "음수", "회차 금액은 음수일 수 없어요.", "고치세요.");
  if (pay.mode === "pct" && Math.abs(pay.pctSum - 100) > 1e-9) return add("fix", section, field, `${lab} 비율 합계`, `${Math.round(pay.pctSum * 1000) / 1000}%`, "회차 비율의 합이 100%가 아니에요.", "합계가 100%가 되게 고치세요.");
  if (pay.mode === "amount" && total !== null && pay.amountSum !== total) return add("fix", section, field, `${lab} 금액 합계`, `${fmtMoney(pay.amountSum, cur)} ≠ ${fmtMoney(total, cur)}`, "회차 금액의 합이 총액과 달라요.", "회차 금액을 고치세요.");
  if (total !== null) add("ok", section, field, `${lab} 일정`, pay.rows.map((r) => `${r.label || "회차"} ${fmtMoney(r.minor, cur)}`).join(" + "), pay.remainder ? `비율로 나눈 뒤 생긴 반올림 차이 ${fmtMoney(Math.abs(pay.remainder), cur)}를 마지막 회차에 반영해 합계가 총액과 같아요.` : "회차 합계가 총액과 같아요.", "");
}

export function summarize(list) {
  return { fix: list.filter((x) => x.level === "fix").length, confirm: list.filter((x) => x.level === "confirm").length, ok: list.filter((x) => x.level === "ok").length };
}
