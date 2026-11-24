/* 거래 상태: 변경 기록, 검토 표시를 한곳에서 관리합니다 (시연용, 브라우저 저장 없음) */
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { keyTerms, hashOf } from "./model.js";
import { sampleDeal } from "@pack";
import { getPath, setPath } from "./path.js";
import { runChecks } from "./checks.js";

const Ctx = createContext(null);
export const useDeal = () => useContext(Ctx);

// 바뀌면 변경 기록에 남기는 핵심 항목
const TRACK = /^(econ\.(fx\.rate|dutyPct|costs\.[^.]+\.(amount|included)|hospital\.(price|sessions|investCustom|investMode|(variable|fixed)\.[^.]+\.amount))|exp\.(items\.[^.]+\.(model|qty|unit|price)|extras\.[^.]+\.amount|incoterm|place|payment\.[^.]+\.(pct|amount)|nw|gw|packages|currency)|local\.(lines\.[^.]+\.(qty|price)|payment\.[^.]+\.(pct|amount)|vatPct)|parties\.[^.]+\.name)$/;

export function DealProvider({ children }) {
  /* 시연용: 열 때마다 진행 중 거래(콘텐츠 팩의 sampleDeal)로 시작. 브라우저에 저장하지 않음 */
  const [store, setState] = useState(() => { const d = sampleDeal(); return { active: d.id, list: { [d.id]: d } }; });

  const deal = store.list[store.active];
  const setStore = setState;
  const mutate = useCallback((fn) => setStore((s) => {
    const d = s.list[s.active];
    const r = fn(d);
    const n = { ...r, meta: { ...r.meta, updatedAt: new Date().toISOString() } };
    return { ...s, list: { ...s.list, [d.id]: n } };
  }), [setStore]);

  const update = useCallback((path, value) => mutate((d) => {
    const before = getPath(d, path);
    let n = setPath(d, path, value);
    if (TRACK.test(path) && String(before ?? "") !== String(value ?? "")) {
      const now = new Date().toISOString();
      const last = n.changes[n.changes.length - 1];
      const changes = last && last.field === path && Date.now() - Date.parse(last.at) < 60000
        ? [...n.changes.slice(0, -1), { ...last, at: now, to: String(value ?? "") }]
        : [...n.changes, { id: Math.random().toString(36).slice(2, 10), at: now, field: path, from: String(before ?? ""), to: String(value ?? "") }].slice(-50);
      n = { ...n, changes };
    }
    return n;
  }), [mutate]);

  const add = useCallback((listPath, row) => mutate((d) => setPath(d, listPath, [...getPath(d, listPath), { id: Math.random().toString(36).slice(2, 10), ...row }])), [mutate]);
  const remove = useCallback((listPath, id) => mutate((d) => setPath(d, listPath, getPath(d, listPath).filter((r) => r.id !== id))), [mutate]);

  const actions = useMemo(() => ({
    /* 기준값으로 되돌리기: 이 거래의 가격, 구성, 결제, 병원 운영 입력만 기준안으로 */
    resetToBaseline: (path) => mutate((d) => {
      if (!d.baseline) return d;
      if (path) return setPath(d, path, getPath(d.baseline, path));
      const b = JSON.parse(JSON.stringify(d.baseline));
      return { ...d, exp: { ...d.exp, ...b.exp }, local: { ...d.local, ...b.local }, econ: b.econ };
    }),
    markReviewed: () => mutate((d) => ({ ...d, review: { at: new Date().toISOString(), hash: hashOf(keyTerms(d)) } })),
    clearReview: () => mutate((d) => ({ ...d, review: { at: null, hash: null } })),
  }), [mutate]);

  const findings = useMemo(() => runChecks(deal), [deal]);
  const value = { deal, update, add, remove, actions, findings };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
