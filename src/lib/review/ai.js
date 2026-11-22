/* AI 문안 작성: 사용자가 넣은 Anthropic API 키로 이 브라우저에서 바로 Claude API를 부릅니다.
   키는 이 브라우저에만 저장하고(선택), 다른 서버로 보내지 않습니다. */
/* SDK는 AI를 처음 쓸 때만 불러옵니다 (첫 화면을 가볍게) */
let SDK = null;
const sdk = async () => (SDK ??= (await import("@anthropic-ai/sdk")).default);

const KEY = "mdk:anthropic-key";
export const MODEL = "claude-opus-5-5";

export function getKey() {
  try { return sessionStorage.getItem(KEY) || localStorage.getItem(KEY) || ""; } catch { return ""; }
}
export function setKey(k, remember) {
  try {
    sessionStorage.removeItem(KEY); localStorage.removeItem(KEY);
    if (k) (remember ? localStorage : sessionStorage).setItem(KEY, k);
  } catch { /* 저장 불가 브라우저 */ }
}

const SYSTEM = `You help the sales staff of an Indonesian medical device distributor talk with a private hospital director about buying one piece of equipment.
Rules:
- Use only the numbers in the JSON context. Never invent prices, patient numbers, clinical outcomes, market sizes, or approvals. If a number is null or listed under not_included_missing_data, say it still needs confirmation.
- Call every assumption an assumption ("asumsi") and say which numbers the hospital should replace with its own.
- Do not promise revenue or treatment results. Clinical use follows the product registration and the doctor's judgment.
- BPJS: do not claim BPJS pays separately for this procedure; the calculation counts self-pay and private-insurance patients only.
- Write Rupiah as Rp1.234.567 in Indonesian text and Rp1,234,567 in Korean text. Be concise and concrete, in a polite business tone suitable for a hospital director.
- Korean text: plain, polite business Korean. Never use the middle dot character as a separator; use commas, parentheses or line breaks.`;

export async function generate({ apiKey, task, context, question, lang = "ko", onText, signal }) {
  const Anthropic = await sdk();
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const ask = task === "proposal"
    ? `Write a one-page proposal letter ${lang === "id" ? "in Bahasa Indonesia" : "in Korean"} from the distributor to the hospital director: title, greeting, the result in 3-4 bullet points, the payment scheme, the assumptions to confirm, and next steps (demo, official quotation, contract terms).`
    : `The hospital director asks: "${question}". Answer in Korean in 3-6 sentences using the context numbers, then add one line "인도네시아어:" followed by the same answer in Bahasa Indonesia. If the context cannot answer it, say what data is needed and who can provide it.`;
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 4000,
    output_config: { effort: "medium" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    messages: [{ role: "user", content: `Context (JSON):\n${JSON.stringify(context)}\n\nTask: ${ask}` }],
  }, { signal });
  stream.on("text", (t) => onText?.(t));
  const msg = await stream.finalMessage();
  if (msg.stop_reason === "refusal") throw new Error("AI가 이 요청에 답하지 않았어요. 질문을 바꿔 다시 시도해 주세요.");
  return msg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
}

export function errorText(e) {
  const A = SDK;
  if (e?.name === "AbortError" || (A && e instanceof A.APIUserAbortError)) return "작성을 멈췄어요.";
  if (A && e instanceof A.AuthenticationError) return "API 키가 맞지 않아요. 키를 다시 확인해 주세요.";
  if (A && e instanceof A.PermissionDeniedError) return "이 키로는 요청할 권한이 없어요.";
  if (A && e instanceof A.RateLimitError) return "요청이 많아 잠시 막혔어요. 조금 뒤 다시 시도해 주세요.";
  if (A && e instanceof A.APIConnectionError) return "Claude API에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.";
  if (A && e instanceof A.APIError) return `Claude API 오류 (${e.status ?? "알 수 없음"}): ${e.message}`;
  return e?.message || "알 수 없는 오류가 났어요.";
}
