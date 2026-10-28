/* 저장(이 브라우저에만), 단계 목록, 회사 정보, AI 답 확인 기록 */
import { useEffect, useState } from "react";

// 저장 키 앞머리를 바꿔 예전 버전 값이 섞이지 않게 합니다
const PREFIX = "mdk:";
export function load(key, fallback) {
  try {
    const v = localStorage.getItem(PREFIX + key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) {
    return fallback;
  }
}
export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {}
}
export const clone = (o) => JSON.parse(JSON.stringify(o));

// 화면 상태를 localStorage와 함께 들고 다니는 훅
export function useStored(key, fallback) {
  const [v, setV] = useState(() => load(key, typeof fallback === "function" ? fallback() : fallback));
  useEffect(() => save(key, v), [key, v]);
  return [v, setV];
}

// 메뉴 순서 = 수출 순서. kc는 2025 KOTRA AI 활용 우수사례집에서 같은 방식을 쓴 사례
export const STEPS = [
  { n: "01", path: "/readiness", name: "수출 준비 진단", short: "준비 진단", kc: "사례 01 · AI 수출비서", what: "8단계 수출 여정으로 지금 준비 상태를 점검하고, 먼저 할 일을 뽑아 줍니다." },
  { n: "02", path: "/programs", name: "지원사업 캘린더", short: "지원사업", kc: "사례 02-1 · 무역투자24 AI 큐레이션", what: "정부·KOTRA·협동조합 공고를 매일 모아 달력에 놓고, 우리 목표에 맞는 공고를 추천합니다." },
  { n: "03", path: "/market", name: "수출할 나라 고르기", short: "나라 고르기", kc: "사례 02-3 · TriBIG, 06 · 시장정보 조사", what: "후보국 2–3곳을 같은 기준으로 비교해 첫 수출국을 고릅니다." },
  { n: "04", path: "/compliance", name: "HS·관세·인증 확인", short: "HS·인증", kc: "사례 05 · 규제정보 전파", what: "HS 코드, 수입국 관세, 의료기기 인허가 일정을 확인합니다." },
  { n: "05", path: "/promo", name: "홍보자료 만들기", short: "홍보자료", kc: "사례 02-2 · buyKOREA, 03 · AI무역지원센터", what: "바이코리아 등록문, SNS 글, 1분 영상 대본을 만듭니다." },
  { n: "06", path: "/buyer", name: "바이어 찾기·상담", short: "바이어·상담", kc: "사례 08 · 바이어 매칭, 07 · 상담일지", what: "매칭용 제품 설명, 바이어 고르는 표, 상담 대본과 상담일지를 만듭니다." },
  { n: "07", path: "/deal", name: "견적서·인보이스", short: "견적·서류", kc: "AI 수출비서 6·7단계 (계약·수출 실행)", what: "제안 메일, 견적서, 인보이스를 한 번에 만들고 조건이 맞는지 검사합니다." },
  { n: "08", path: "/log", name: "AI 답 확인 기록", short: "AI 답 확인", kc: "사례 09 · 근거를 함께 보여 주는 AI", what: "AI에게 물은 것과 공식자료로 확인한 결과를 모아 둡니다." },
];
// 예전 파일 이름(market.html 등)을 화면 주소로
export const toPath = (file) => "/" + String(file).replace(/\.html$/, "").replace(/^index$/, "");

/* ---------- 회사·제품 정보 (모든 페이지가 함께 씀) ---------- */
export const SAMPLE_PROFILE = {
  company: "(가상) 한결메디칼", companyEn: "Hangyeol Medical Co., Ltd. (sample)",
  product: "저주파 전기자극 치료기", productEn: "HG-200 TENS Electrotherapy Device",
  hs: "9018.90", grade: "2", region: "경기", countries: "인도네시아, 일본, 홍콩", exp: "none", sample: true,
};
export const REGIONS = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
export const profile = () => load("profile", SAMPLE_PROFILE);
export const setProfile = (p) => save("profile", p);

/* ---------- AI 답 확인 기록: 물은 것 / AI 답 / 확인 자료 / 고친 내용 ---------- */
export const PARTS = ["나라 고르기", "HS·관세", "인증·규제", "영문자료·홍보", "바이어·상담", "거래조건", "회사·제품"];
export const SEED_LOG = [
  {
    part: "HS·관세",
    prompt: "일본에 HS 9018.90 의료기기를 수출하면 관세가 몇 %야?",
    ai: "(형식 예시) 한국 관세율표의 세율을 일본 관세처럼 답함",
    source: "일본 세관 실행관세율표 제90류 (Free)",
    fix: "수입국(일본) 관세율표 기준으로 무세(Free)로 고침. 한국 관세율표는 한국으로 들여올 때의 세율",
    seed: true,
  },
  {
    part: "거래조건",
    prompt: "항공으로 보내는 첫 주문 견적서를 FOB 인천 조건으로 써 줘",
    ai: "(형식 예시) FOB Incheon Airport로 견적서 작성",
    source: "ICC Incoterms 2020: FOB는 해상·내수로 운송 전용",
    fix: "항공 운송이므로 FCA Incheon Airport로 바꿈",
    seed: true,
  },
];
export const getLog = () => load("log", SEED_LOG);
export const setLog = (rows) => save("log", rows);
export function addLog(row) {
  const rows = getLog();
  rows.push({ at: new Date().toISOString().slice(0, 10), ...row });
  setLog(rows);
  return rows.length;
}

export function fmtUSD(n, digits) {
  if (n == null || n === "" || isNaN(n)) return "–";
  return "USD " + Number(n).toLocaleString("en-US", { minimumFractionDigits: digits || 0, maximumFractionDigits: digits || 0 });
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.append(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}
