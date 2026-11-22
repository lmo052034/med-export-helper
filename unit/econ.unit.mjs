// 가격·수익성 계산과 대표 모의 거래 저장 테스트
import test from "node:test";
import assert from "node:assert/strict";
import { mockDeal, snapshot, sanitize, blankDeal, newId } from "../src/lib/deal/model.js";
import { calcLocal } from "../src/lib/deal/calc.js";
import { hospitalCalc, partnerCalc, cashFlow, changedFrom, withBaseline, surplusCurve } from "../src/lib/deal/econ.js";
import { setPath } from "../src/lib/deal/path.js";

const hv = (label, amount) => ({ id: newId(), label, amount, basis: "team", note: "" });
function hospDeal() {
  const d = mockDeal();
  d.econ.hospital = { ...d.econ.hospital, investMode: "custom", investCustom: "528090000", price: "509000", sessions: "48", workDays: "24", horizon: "60",
    variable: [hv("a", "35000"), hv("b", "4500"), hv("c", "159")], fixed: [hv("x", "7000000"), hv("y", "2472667"), hv("z", "1800000")] };
  return sanitize(d);
}

test("병원: 공헌액, 월 현금잉여, 손익분기(올림), 단순 회수", () => {
  const H = hospitalCalc(hospDeal());
  assert.equal(H.contribution, 469341);
  assert.equal(H.fixed, 11272667);
  assert.equal(H.surplus, 48 * 469341 - 11272667);
  assert.equal(H.bep, 25); // 11,272,667 / 469,341 = 24.02 → 25
  assert.ok(Math.abs(H.payback - 528090000 / 11255701) < 1e-9);
  assert.equal(H.cumulative.length, 61);
  assert.equal(H.cumulative[0].v, -528090000);
  assert.equal(H.perDay, 2);
  assert.ok(H.complete);
});

test("병원: 손익분기가 정수로 나눠떨어지면 그대로", () => {
  const d = hospDeal();
  d.econ.hospital.fixed = [hv("x", "938682")]; // 469,341 × 2
  assert.equal(hospitalCalc(d).bep, 2);
});

test("병원: 잉여 0 이하이면 회수 산출 불가, 공헌액 0 이하이면 손익분기 산출 불가", () => {
  const d = hospDeal();
  d.econ.hospital.sessions = "10";
  let H = hospitalCalc(d);
  assert.ok(H.surplus < 0);
  assert.equal(H.payback, null);
  assert.match(H.paybackNote, /산출할 수 없어요/);
  assert.equal(H.bep, 25);
  d.econ.hospital.price = "39659"; // 변동비와 같음
  H = hospitalCalc(d);
  assert.equal(H.contribution, 0);
  assert.equal(H.bep, null);
  assert.match(H.bepNote, /0 이하/);
  d.econ.hospital.price = "1000";
  assert.equal(hospitalCalc(d).bep, null);
});

test("병원: 빈칸, 잘못된 값, 음수는 계산하지 않고 이유를 알림", () => {
  const d = hospDeal();
  d.econ.hospital.sessions = "";
  let H = hospitalCalc(d);
  assert.equal(H.surplus, null);
  assert.ok(H.issues.some((i) => i.field === "econ.hospital.sessions"));
  d.econ.hospital.sessions = "48";
  d.econ.hospital.price = "-5";
  H = hospitalCalc(d);
  assert.equal(H.contribution, null);
  d.econ.hospital.price = "abc";
  assert.equal(hospitalCalc(d).surplus, null);
  d.econ.hospital.price = "509000";
  d.econ.hospital.fixed[0].amount = "";
  assert.equal(hospitalCalc(d).fixed, null);
  assert.equal(hospitalCalc(d).cumulative.length, 0);
});

test("병원: 0회 시술은 고정비만큼 손실 (빈칸과 다름)", () => {
  const d = hospDeal();
  d.econ.hospital.sessions = "0";
  assert.equal(hospitalCalc(d).surplus, -11272667);
});

test("병원: 도입비 '현지 견적 사용'은 현지 견적 총액(부가세 포함)과 같고, 시술량은 견적에 영향 없음", () => {
  const d = hospDeal();
  d.econ.hospital.investMode = "local";
  const before = calcLocal(d).total;
  assert.equal(hospitalCalc(d).invest, before);
  d.econ.hospital.sessions = "70";
  assert.equal(calcLocal(d).total, before);
  const d2 = setPath(d, `local.lines.${d.local.lines[0].id}.price`, "500000000");
  assert.equal(calcLocal(d2).total, 555000000);
  assert.equal(hospitalCalc(d2).invest, 555000000);
});

test("그래프 값은 같은 계산 함수에서 나옴", () => {
  const d = hospDeal();
  const c = surplusCurve(d, 60, 4);
  assert.equal(c.find((p) => p.n === 48).v, hospitalCalc(d).surplus);
  assert.equal(c[0].v, -11272667);
});

test("파트너: 환율이 없으면 빠진 범위로 알리고, 있으면 관세는 CIF 기준", () => {
  const d = hospDeal();
  d.econ.costs = [{ id: newId(), label: "운임", amount: "500", currency: d.exp.currency, basis: "team", included: true, inCif: true, when: "before-ship", note: "" },
    { id: newId(), label: "설치", amount: "1000000", currency: d.local.currency, basis: "team", included: false, inCif: false, when: "install", note: "" }];
  d.exp.items.forEach((it) => { it.price = "1000"; });
  d.econ.fx.rate = "";
  d.econ.dutyPct = "5";
  let P = partnerCalc(d);
  assert.ok(!P.complete);
  assert.ok(P.missing.includes("환율"));
  assert.deepEqual(P.excluded, ["설치"]);
  d.econ.fx.rate = "16000";
  P = partnerCalc(d);
  const L = calcLocal(d);
  const exportUsd = P.exportLocal / 16000;
  assert.equal(P.dutyLocal, Math.round((exportUsd + 500) * 16000 * 0.05));
  assert.equal(P.revenue, L.net);
  assert.equal(P.profit, L.net - Math.round(P.exportLocal + 500 * 16000 + P.dutyLocal));
});

test("결제 흐름: 누적 최저점이 일시 필요 자금, 처음 현금 0", () => {
  const d = hospDeal();
  d.exp.items.forEach((it) => { it.price = "1000"; });
  d.econ.fx.rate = "16000"; d.econ.dutyPct = "5"; d.econ.importVatPct = "11"; d.econ.pph22Pct = "2.5";
  const C = cashFlow(d);
  const accs = C.rows.map((r) => r.acc);
  assert.equal(C.need, Math.max(0, -Math.min(0, ...accs)));
  assert.equal(C.rows[C.rows.length - 1].acc, C.rows.reduce((s, r) => s + r.amount, 0));
});

test("기준안 비교: 바뀐 값 표시, 기준안 계산", () => {
  const d = hospDeal();
  d.baseline = snapshot(d);
  assert.equal(changedFrom(d, "econ.hospital.sessions"), false);
  d.econ.hospital.sessions = "60";
  assert.equal(changedFrom(d, "econ.hospital.sessions"), true);
  assert.equal(hospitalCalc(withBaseline(d)).sessions, 48);
  assert.equal(hospitalCalc(d).sessions, 60);
  const s = sanitize(JSON.parse(JSON.stringify(d)));
  assert.equal(s.baseline.econ.hospital.sessions, "48");
});

test("저장: 기존 거래가 있으면 대표 모의 거래만 추가하고 기존 거래·활성 거래는 그대로", async () => {
  const mem = new Map();
  globalThis.window = { localStorage: { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), key: (i) => [...mem.keys()][i] ?? null, get length() { return mem.size; } } };
  const { loadAll, saveAll } = await import("../src/lib/deal/storage.js");
  const mine = blankDeal(); mine.kind = "user"; mine.name = "내 거래"; mine.exp.items[0].price = "777";
  saveAll({ active: mine.id, list: { [mine.id]: mine } });
  const makeSample = () => { const s = mockDeal(); s.kind = "sample"; s.sampleKey = "t1"; return sanitize(s); };
  const r = loadAll(makeSample);
  const store = r.store || r;
  const list = Object.values(store.list);
  assert.equal(store.active, mine.id);
  assert.equal(list.find((x) => x.id === mine.id).exp.items[0].price, "777");
  assert.equal(list.filter((x) => x.sampleKey === "t1").length, 1);
  saveAll(store);
  const r2 = loadAll(makeSample);
  assert.equal(Object.values((r2.store || r2).list).filter((x) => x.sampleKey === "t1").length, 1);
  delete globalThis.window;
});
