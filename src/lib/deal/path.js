/* "exp.items.<id>.price" 같은 경로로 값 읽기·쓰기. 배열은 id로 찾습니다 */
export function getPath(obj, path) {
  return path.split(".").reduce((o, k) => {
    if (o == null) return undefined;
    if (Array.isArray(o)) return o.find((r) => r && r.id === k);
    return o[k];
  }, obj);
}
export function setPath(obj, path, value) {
  const ks = path.split(".");
  const rec = (o, i) => {
    const k = ks[i];
    if (Array.isArray(o)) return o.map((r) => (r && r.id === k ? (i === ks.length - 1 ? value : rec(r, i + 1)) : r));
    const next = { ...o };
    next[k] = i === ks.length - 1 ? value : rec(o[k], i + 1);
    return next;
  };
  return rec(obj, 0);
}
export const fieldId = (path) => "f-" + path.replace(/\./g, "-");
/* 검토 결과의 field가 속한 입력 구역 */
export function sectionOf(path) {
  if (/^meta|^evidence/.test(path)) return "basic";
  if (/^parties|^roles|^counterpart/.test(path)) return "parties";
  if (/^exp\.(items|extras|currency)/.test(path)) return "items";
  if (/^exp\.(incoterm|place|incotermVersion|transport|exportClearance|payment|leadTime|validityDays)/.test(path)) return "terms";
  if (/^exp\.(packages|packageUnit|packing|nw|gw|nwUnit|gwUnit|weightBasis)/.test(path)) return "packing";
  if (/^service/.test(path)) return "service";
  if (/^local/.test(path)) return "local";
  return "docs";
}
