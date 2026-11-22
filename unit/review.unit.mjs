// 병원 도입 검토 계산 테스트: 덱 기준(48회, +Rp469,341)과 금융 계산
import test from "node:test";
import assert from "node:assert/strict";
import { review, annuity, flatPayment, effectiveRate, sensitivity } from "../src/lib/review/calc.js";

const base = () => ({
  device: { price: "480000000", lifeMonths: "48" },
  pay: { mode: "cash", depositPct: "30", downPct: "20", months: "36", rate: "8.76", rateType: "efektif", adminPct: "0" },
  rev: { price: "509000", discountPct: "0", feePct: "0" },
  demand: { mode: "sessions", sessions: "48", newPatients: "16", course: "3", completionPct: "100", rampMonths: "0" },
  ops: { slotMin: "30", hours: "8", workDays: "24" },
  vc: { docFee: "35000", docPct: "0", consumable: "4500", va: "220", powerMin: "30", tariff: "1444.70", hpCost: "", hpLife: "", shots: "2000" },
  fixed: [{ id: "a", label: "t", amount: "7000000" }, { id: "b", label: "m", amount: "2472667" }, { id: "c", label: "s", amount: "1800000" }],
  horizon: "60",
});

test("회당 공헌 +469,341 (전력 159 반올림), 장비비 48개월 배분 손익분기 46회", () => {
  const r = review(base());
  assert.equal(Math.round(r.ps.power), 159);
  assert.equal(Math.round(r.ps.contribution), 469341);
  assert.equal(r.bepAccounting, 46); // (11,272,667 + 10,000,000) ÷ 469,341 = 45.3
  assert.equal(r.bepOperating, 25);
  assert.ok(r.missing.some((m) => m.includes("핸드피스")), "핸드피스 빈칸은 빠진 항목으로 알림");
});

test("일시불: 누적 현금 회수 약 43개월", () => {
  const r = review(base());
  assert.ok(r.payback > 42 && r.payback < 43, String(r.payback)); // 480,000,000 ÷ 11,255,701
});

test("금융: 원리금 균등, 플랫 금리, 실효 금리 역산", () => {
  assert.equal(Math.round(annuity(1200, 0, 12)), 100);
  const pay = flatPayment(100000000, 8, 36);
  assert.equal(Math.round(pay), Math.round((100000000 * 1.24) / 36));
  const eff = effectiveRate(100000000, pay, 36);
  assert.ok(eff > 14 && eff < 15.5, String(eff)); // 플랫 8%는 실효 약 14.6%
  assert.ok(Math.abs(effectiveRate(100000000, annuity(100000000, 10, 36), 36) - 10) < 0.01);
});

test("할부: 할부 기간 손익분기에 월 납입금 포함, 다 갚은 뒤는 운영 손익분기", () => {
  const c = base(); c.pay.mode = "loan";
  const r = review(c);
  assert.ok(r.fin.payment > 0);
  assert.equal(r.bepFinancing, Math.ceil((r.fixed + r.fin.payment) / r.ps.contribution));
  assert.ok(r.bepFinancing > r.bepOperating);
});

test("환자 수 모드: 신규 16명 × 3회 = 48회", () => {
  const c = base(); c.demand.mode = "patients";
  assert.equal(review(c).S, 48);
});

test("민감도: 시술가 −20%면 월 손익이 줄어듦", () => {
  const s = sensitivity(base());
  assert.ok(s.find((x) => x.key === "price").delta < 0);
  assert.ok(s.find((x) => x.key === "volumeUp").delta > 0);
});

test("빈칸은 0으로 치지 않음: 시술가가 비면 결과 미완성", () => {
  const c = base(); c.rev.price = "";
  const r = review(c);
  assert.equal(r.complete, false);
  assert.equal(r.ps.contribution, null);
});
