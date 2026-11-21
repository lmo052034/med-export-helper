// 계산·검사·이전 데이터 옮기기 단위 테스트 (node --test unit/)
import test from "node:test";
import assert from "node:assert/strict";
import { parseNum, toMinor, fmtMoney, schedule, parseDate, amountInWords } from "../src/lib/deal/money.js";
import { blankDeal, mockDeal, sanitize, migrateV1, logToEvidence } from "../src/lib/deal/model.js";
import { calcExport, calcLocal } from "../src/lib/deal/calc.js";
import { runChecks, summarize } from "../src/lib/deal/checks.js";
import { setPath } from "../src/lib/deal/path.js";

const find = (d, label) => runChecks(d).filter((f) => f.label.includes(label));
const setItem = (d, i, k, v) => setPath(d, `exp.items.${d.exp.items[i].id}.${k}`, v);

test("숫자: 빈칸과 0을 구분하고 쉼표·소수·잘못된 값 처리", () => {
  assert.equal(parseNum("").state, "blank");
  assert.deepEqual(parseNum("0"), { state: "ok", value: 0 });
  assert.equal(parseNum("1,234.5").value, 1234.5);
  assert.equal(parseNum("-3").value, -3);
  assert.equal(parseNum("12a").state, "invalid");
  assert.equal(parseNum("1.2.3").state, "invalid");
});

test("통화 소수 자릿수: USD 2자리, IDR 0자리", () => {
  assert.equal(toMinor(0.1 + 0.2, "USD"), 30);
  assert.equal(fmtMoney(1234500, "USD"), "USD 12,345.00");
  assert.equal(toMinor(475756757, "IDR"), 475756757);
  assert.equal(fmtMoney(528090000, "IDR"), "IDR 528,090,000");
  assert.match(amountInWords(1234500, "USD"), /TWELVE THOUSAND/);
});

test("날짜: 형식과 실제 날짜 검사", () => {
  assert.equal(parseDate("2026-11-21").state, "ok");
  assert.equal(parseDate("").state, "blank");
  assert.equal(parseDate("2026-02-30").state, "invalid");
  assert.equal(parseDate("21/11/2026").state, "invalid");
});

test("결제 일정: 비율 반올림 차이는 마지막 회차가 흡수", () => {
  const s = schedule([{ pct: "33.3333" }, { pct: "33.3333" }, { pct: "33.3334" }], 10000, "USD");
  assert.equal(s.rows.reduce((a, r) => a + r.minor, 0), 10000);
  const idr = schedule([{ pct: "30" }, { pct: "70" }], 52809000001, "IDR");
  assert.equal(idr.rows[0].minor + idr.rows[1].minor, 52809000001);
  assert.equal(schedule([{ pct: "30", amount: "" }, { pct: "", amount: "100" }], 1000, "USD").mode, "mixed");
});

test("수량·단가가 바뀌면 총액이 다시 계산됨", () => {
  let d = mockDeal();
  d = setItem(d, 1, "price", "500");
  assert.equal(calcExport(d).total, 1050000);
  d = setItem(d, 0, "qty", "2");
  assert.equal(calcExport(d).total, 2050000);
});

test("모의 거래: 중량·서명·핸드피스 가격 누락을 '수정 필요'로 찾음", () => {
  const f = runChecks(mockDeal()).filter((x) => x.level === "fix").map((x) => x.field);
  assert.ok(f.includes("exp.nw") && f.includes("exp.gw"));
  assert.ok(f.includes("email.senderName"));
  assert.ok(f.some((x) => /^exp\.items\..+\.price$/.test(x)));
  assert.equal(calcExport(mockDeal()).total, null, "가격 없는 구성품이 있으면 총액을 만들지 않음");
});

test("총중량 < 순중량, 단위 불일치", () => {
  let d = mockDeal();
  d = { ...d, exp: { ...d.exp, nw: "50", gw: "40" } };
  assert.ok(runChecks(d).some((x) => x.level === "fix" && x.field === "exp.gw"));
  d = { ...d, exp: { ...d.exp, gw: "60", gwUnit: "lb" } };
  assert.ok(runChecks(d).some((x) => x.level === "fix" && /단위/.test(x.label + x.why)));
});

test("수량 0·음수·소수, 단가 음수", () => {
  for (const [q, re] of [["0", /0/], ["-1", /음수/], ["1.5", /소수|정수/]]) {
    const d = setItem(mockDeal(), 0, "qty", q);
    assert.ok(runChecks(d).some((x) => x.level !== "ok" && /qty$/.test(x.field) && re.test(x.value + x.why)), q);
  }
  const d = setItem(mockDeal(), 0, "price", "-10");
  assert.ok(runChecks(d).some((x) => x.level === "fix" && /price$/.test(x.field)));
});

test("결제 비율 합계 100% 아님 → 수정 필요", () => {
  const d = mockDeal();
  const n = setPath(d, `exp.payment.${d.exp.payment[0].id}.pct`, "90");
  assert.ok(runChecks(n).some((x) => x.level === "fix" && /비율 합계/.test(x.label)));
});

test("현지 판매: 수출가를 환율로 바꾸지 않고 입력값으로만 계산", () => {
  const d = mockDeal();
  const L = calcLocal(d);
  assert.equal(L.cur, "IDR");
  assert.equal(L.net, 200000000);
  assert.equal(L.total, 222000000);
});

test("잘못된 저장값 정리: 형식이 아니면 예외, 빠진 칸은 채움", () => {
  assert.throws(() => sanitize("x"));
  const d = sanitize({ meta: { name: "a", stage: "zzz" }, exp: { items: "bad" } });
  assert.equal(d.meta.stage, "quote");
  assert.ok(Array.isArray(d.exp.items) && d.exp.items.length === 1);
});

test("이전 버전(mdk:deal) 옮기기", () => {
  const d = migrateV1({ seller: { co: "Maker Co" }, buyer: { co: "Buyer Co", email: "b@x.com" }, items: [{ model: "M1", qty: "2", unit: "100" }], inco: "FOB", place: "Busan", sender: "Kim" });
  assert.equal(d.parties.maker.name, "Maker Co");
  assert.equal(d.exp.items[0].price, "100");
  assert.equal(d.email.senderName, "Kim");
  assert.equal(calcExport(d).total, 20000);
  assert.equal(migrateV1(null), null);
  assert.equal(logToEvidence([{ seed: true, source: "x" }, { part: "HS", source: "UNI-PASS" }]).length, 1);
});

test("빈 거래: 요약 수치가 계산됨", () => {
  const s = summarize(runChecks(blankDeal()));
  assert.ok(s.fix > 0);
});
