/* 사용자 설정: 이름, 직함, 소속, 역할, 기본값, 최근 연 화면.
   이 브라우저(localStorage)에만 저장합니다. 서버로 보내지 않아요 */
import { useSyncExternalStore } from "react";
import { PACK } from "@pack";

const KEY = "mdk:profile";
const ls = () => { try { return window.localStorage; } catch { return null; } };

const DEFAULT_PEOPLE = {
  orgs: [
    { id: "hq", label: "본사", desc: "한국 제조사. 해외영업, 인허가와 품질, 경영 검토" },
    { id: "partner", label: "현지 파트너", desc: "인도네시아 수입, 판매사. 병원 영업, 설치, A/S" },
  ],
  roles: [
    { id: "hq-sales", label: "해외영업", desc: "견적, 수출 서류, 선적, 대금", org: "hq", owner: "본사 해외영업", kinds: ["doc", "ship", "follow"] },
    { id: "hq-ra", label: "인허가와 품질", desc: "현지 등록, 원산지증명, 인증 서류", org: "hq", owner: "", kinds: ["doc"] },
    { id: "hq-mgmt", label: "경영 검토", desc: "전체 현황, 수익성, 근거자료 확인", org: "hq", owner: "", kinds: [] },
    { id: "local-sales", label: "현지 영업", desc: "병원 방문, 시연, 견적 회신", org: "partner", owner: "현지 영업", kinds: ["quote", "demo", "follow"] },
    { id: "tech", label: "기술 지원", desc: "시연 장비, 설치, 교육, A/S", org: "partner", owner: "현지 기술팀", kinds: ["demo", "as"] },
    { id: "local-mgmt", label: "현지 관리", desc: "병원 계약, 계약금과 잔금, 수입 통관", org: "partner", owner: "", kinds: ["quote", "ship"] },
  ],
};
export const PEOPLE = { ...DEFAULT_PEOPLE, ...(PACK.people || {}) };

export const TIMEZONES = [
  ["Asia/Jakarta", "자카르타 (WIB, UTC+7)"],
  ["Asia/Seoul", "서울 (KST, UTC+9)"],
  ["Asia/Makassar", "발리, 마카사르 (WITA, UTC+8)"],
];
export const DOC_LANGS = [["ko", "한국어"], ["id", "인도네시아어"]];
export const START_PAGES = [["/", "홈"], ["/desk", "업무 현황"], ["/overview", "거래 요약"], ["/price", "수익성"], ["/hospital", "병원 제안"], ["/deal", "거래와 서류"]];
export const PAGE_NAMES = { "/desk": "업무 현황", "/overview": "거래 요약", "/price": "수익성", "/hospital": "병원 제안", "/deal": "거래조건 입력", "/review": "검토 결과", "/docs": "서류 미리보기", "/evidence": "자료실", "/settings": "내 설정" };

export const blankProfile = () => ({
  name: "", title: "", org: "", role: "",
  tz: "Asia/Jakarta", docLang: "ko", start: "/",
  checklist: true, done: [], recent: [], createdAt: null,
});

function read() {
  const s = ls();
  if (!s) return null;
  try {
    const v = JSON.parse(s.getItem(KEY) || "null");
    if (!v || typeof v !== "object" || !v.name) return null;
    return { ...blankProfile(), ...v };
  } catch { return null; }
}

let cache = read();
const subs = new Set();
const emit = () => subs.forEach((f) => f());

export function saveProfile(next) {
  cache = next ? { ...blankProfile(), ...next } : null;
  const s = ls();
  try { if (s) { if (cache) s.setItem(KEY, JSON.stringify(cache)); else s.removeItem(KEY); } } catch { /* 저장 못 해도 화면은 계속 */ }
  emit();
  return cache;
}
export const patchProfile = (p) => cache && saveProfile({ ...cache, ...(typeof p === "function" ? p(cache) : p) });

export function useProfile() {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => cache, () => cache);
}

/* 최근 연 화면: 같은 화면은 맨 앞으로, 5개까지 */
export function touchRecent(path) {
  if (!cache || !PAGE_NAMES[path] || path === "/settings") return;
  const at = new Date().toISOString();
  const recent = [{ path, at }, ...(cache.recent || []).filter((r) => r.path !== path)].slice(0, 5);
  const done = cache.done?.includes(path) ? cache.done : [...(cache.done || []), path];
  saveProfile({ ...cache, recent, done });
}

export const roleOf = (p) => PEOPLE.roles.find((r) => r.id === p?.role) || null;
export const orgOf = (p) => PEOPLE.orgs.find((o) => o.id === p?.org) || null;

/* 시간대 기준 날짜와 시각 */
export function nowIn(tz) {
  const d = new Date();
  try {
    const date = new Intl.DateTimeFormat("ko-KR", { timeZone: tz, month: "long", day: "numeric", weekday: "long" }).format(d);
    const time = new Intl.DateTimeFormat("ko-KR", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
    return { date, time };
  } catch { return { date: d.toLocaleDateString("ko-KR"), time: d.toTimeString().slice(0, 5) }; }
}

export function ago(iso) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.round(h / 24)}일 전`;
}
export const currentProfile = () => cache;
