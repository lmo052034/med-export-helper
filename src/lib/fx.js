/* 오늘 환율 (키 없는 공개 API). 버튼을 눌렀을 때만 호출. 실패하면 null → 화면은 PPT 기준 환율 유지
   1순위 Frankfurter (유럽중앙은행 기준 환율), 2순위 ExchangeRate-API 공개 엔드포인트 */
const withTimeout = (ms) => { const c = new AbortController(); const t = setTimeout(() => c.abort(), ms); return { signal: c.signal, done: () => clearTimeout(t) }; };

async function getJson(url) {
  const t = withTimeout(7000);
  try {
    const r = await fetch(url, { signal: t.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally { t.done(); }
}

const ok = (v) => Number.isFinite(v) && v > 0;

export async function fetchLiveFx() {
  try {
    const j = await getJson("https://api.frankfurter.dev/v1/latest?base=USD&symbols=IDR,KRW");
    const idr = Number(j?.rates?.IDR), krw = Number(j?.rates?.KRW);
    if (ok(idr) && ok(krw)) return { idr, krw, date: j.date || "", source: "Frankfurter (유럽중앙은행 기준 환율)" };
  } catch { /* 다음 출처 */ }
  try {
    const j = await getJson("https://open.er-api.com/v6/latest/USD");
    const idr = Number(j?.rates?.IDR), krw = Number(j?.rates?.KRW);
    const date = j?.time_last_update_unix ? new Date(j.time_last_update_unix * 1000).toISOString().slice(0, 10) : "";
    if (j?.result === "success" && ok(idr) && ok(krw)) return { idr, krw, date, source: "ExchangeRate-API 공개 환율" };
  } catch { /* 실패 */ }
  return null;
}
