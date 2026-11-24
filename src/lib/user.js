/* 시연용 고정 사용자. 로그인, 사용자 설정 화면 없이 이 이름으로 홈에 들어갑니다 */
import { PACK } from "@pack";

export const USER = { name: "김민영", team: "본사 해외영업팀", ...(PACK.user || {}) };

/* 시간대별 인사 (Linear, Notion, HubSpot 홈의 'Good afternoon, 이름' 방식) */
export function greeting(tz = "Asia/Seoul") {
  let h = new Date().getHours();
  try { h = Number(new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).format(new Date())) % 24; } catch { /* 기본 시각 */ }
  if (h >= 5 && h < 12) return "좋은 아침입니다";
  if (h >= 12 && h < 18) return "좋은 오후입니다";
  return "오늘도 수고 많으셨습니다";
}

export function today(tz = "Asia/Seoul") {
  try { return new Intl.DateTimeFormat("ko-KR", { timeZone: tz, month: "long", day: "numeric", weekday: "long" }).format(new Date()); }
  catch { return new Date().toLocaleDateString("ko-KR"); }
}
