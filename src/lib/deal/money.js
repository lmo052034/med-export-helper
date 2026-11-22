/* 숫자, 금액 처리: 빈칸과 0을 구분하고, 통화별 자릿수를 정수(최소 단위)로 계산합니다 */

export const CURRENCIES = {
  USD: { digits: 2, label: "USD" },
  EUR: { digits: 2, label: "EUR" },
  KRW: { digits: 0, label: "KRW" },
  IDR: { digits: 0, label: "IDR" },
};
export const digitsOf = (cur) => (CURRENCIES[cur] ? CURRENCIES[cur].digits : 2);

/* 입력 문자열 → { state: "blank" | "invalid" | "ok", value } (쉼표 허용) */
export function parseNum(raw) {
  if (raw === null || raw === undefined) return { state: "blank", value: null };
  const s = String(raw).replace(/,/g, "").trim();
  if (s === "") return { state: "blank", value: null };
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return { state: "invalid", value: null };
  const n = Number(s);
  return Number.isFinite(n) ? { state: "ok", value: n } : { state: "invalid", value: null };
}
export const num = (raw) => { const p = parseNum(raw); return p.state === "ok" ? p.value : null; };

/* 금액을 통화 최소 단위 정수로 (USD 12.345 → 1235 센트). 부동소수 오차를 피하려 문자열 반올림 사용 */
export function toMinor(value, cur) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const d = digitsOf(cur);
  return Math.round(Number(value.toFixed(10)) * 10 ** d);
}
export const fromMinor = (minor, cur) => (minor === null ? null : minor / 10 ** digitsOf(cur));

/* 수량 × 단가 → 최소 단위 정수 (각 줄마다 반올림한 뒤 합계) */
export function lineMinor(qty, price, cur) {
  if (qty === null || price === null) return null;
  return toMinor(qty * price, cur);
}

export function fmtMoney(minor, cur, opts = {}) {
  if (minor === null || minor === undefined) return opts.empty ?? "—";
  const d = digitsOf(cur);
  const v = (minor / 10 ** d).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  return opts.bare ? v : `${cur} ${v}`;
}
export function fmtNum(n, maxDigits = 3) {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: maxDigits });
}

/* 결제 일정: 비율(%) 또는 금액으로 적은 회차를 총액에 맞춰 금액으로 바꿈.
   비율 방식의 마지막 회차는 반올림 차이를 흡수해 합계가 총액과 같게 합니다 */
export function schedule(rows, totalMinor, cur) {
  const out = [];
  if (!rows || !rows.length) return { rows: out, mode: "none", pctSum: null, amountSum: null, remainder: null };
  const mode = rows.every((r) => parseNum(r.amount).state === "blank") ? "pct" : rows.every((r) => parseNum(r.pct).state === "blank") ? "amount" : "mixed";
  let pctSum = 0, amountSum = 0, acc = 0, remainder = 0;
  rows.forEach((r, i) => {
    const p = parseNum(r.pct), a = parseNum(r.amount);
    let minor = null;
    if (mode === "pct" && p.state === "ok" && totalMinor !== null) {
      pctSum += p.value;
      const raw = Math.round((totalMinor * p.value) / 100);
      const last = i === rows.length - 1;
      minor = raw;
      if (last && Math.abs(pctSum - 100) < 1e-9) { minor = totalMinor - acc; remainder = minor - raw; }
    } else if (mode === "pct" && p.state === "ok") {
      pctSum += p.value;
    } else if (mode === "amount" && a.state === "ok") {
      minor = toMinor(a.value, cur);
      amountSum += minor;
    }
    if (minor !== null) acc += minor;
    out.push({ ...r, minor, pctState: p.state, amountState: a.state });
  });
  return { rows: out, mode, pctSum: mode === "pct" ? pctSum : null, amountSum: mode === "amount" ? amountSum : null, remainder };
}

/* 날짜: YYYY-MM-DD만 받음. 존재하지 않는 날짜(2026-02-30)도 잘못된 값으로 처리 */
export function parseDate(s) {
  if (!s) return { state: "blank", value: null };
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s).trim());
  if (!m) return { state: "invalid", value: null };
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) return { state: "invalid", value: null };
  return { state: "ok", value: d };
}
export const daysBetween = (a, b) => Math.round((b - a) / 864e5);
export function fmtDateEn(s) {
  const p = parseDate(s);
  if (p.state !== "ok") return null;
  return p.value.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

/* 영문 금액 표기 (상업송장 SAY …) */
export function words(n) {
  const a = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
  const b = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
  const h = (x) => (x >= 100 ? a[Math.floor(x / 100)] + " HUNDRED" + (x % 100 ? " " : "") : "") + (x % 100 < 20 ? a[x % 100] : b[Math.floor((x % 100) / 10)] + (x % 10 ? "-" + a[x % 10] : ""));
  n = Math.floor(n);
  if (!n) return "ZERO";
  const parts = [];
  [[1e12, "TRILLION"], [1e9, "BILLION"], [1e6, "MILLION"], [1e3, "THOUSAND"], [1, ""]].forEach(([u, w]) => { const q = Math.floor(n / u) % 1000; if (q) parts.push(h(q) + (w ? " " + w : "")); });
  return parts.join(" ").trim();
}
export function amountInWords(minor, cur) {
  if (minor === null) return null;
  const d = digitsOf(cur), whole = Math.floor(minor / 10 ** d), frac = minor % 10 ** d;
  const name = { USD: "US DOLLARS", EUR: "EUROS", KRW: "KOREAN WON", IDR: "INDONESIAN RUPIAH" }[cur] || cur;
  return `SAY ${name} ${words(whole)}${d && frac ? ` AND CENTS ${words(frac)}` : ""} ONLY`;
}
