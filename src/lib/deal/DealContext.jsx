/* 거래 상태: 불러오기·저장·변경 기록·검토 표시를 한곳에서 관리합니다 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { loadAll, saveAll, importDeal, exportDeal } from "./storage.js";
import { blankDeal, mockDeal, keyTerms, hashOf } from "./model.js";
import { getPath, setPath } from "./path.js";
import { runChecks } from "./checks.js";

const Ctx = createContext(null);
export const useDeal = () => useContext(Ctx);

// 바뀌면 변경 기록에 남기는 핵심 항목
const TRACK = /^(exp\.(items\.[^.]+\.(model|qty|unit|price)|extras\.[^.]+\.amount|incoterm|place|payment\.[^.]+\.(pct|amount)|nw|gw|packages|currency)|local\.(lines\.[^.]+\.(qty|price)|payment\.[^.]+\.(pct|amount)|vatPct)|parties\.[^.]+\.name)$/;

export function DealProvider({ children }) {
  const [{ store, notes }, setState] = useState(() => loadAll());
  const [status, setStatus] = useState({ kind: "saved", at: new Date() });
  const timer = useRef();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; saveAll(store); return; }
    setStatus({ kind: "saving" });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const r = saveAll(store);
      setStatus(r.ok ? { kind: "saved", at: new Date() } : { kind: "error", text: r.error });
    }, 350);
    return () => clearTimeout(timer.current);
  }, [store]);

  const deal = store.list[store.active];
  const setStore = useCallback((fn) => setState((s) => ({ ...s, store: fn(s.store) })), []);
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

  const addDeal = useCallback((d) => setStore((s) => ({ active: d.id, list: { ...s.list, [d.id]: d } })), [setStore]);
  const actions = useMemo(() => ({
    newBlank: () => addDeal(blankDeal()),
    openMock: () => addDeal(mockDeal()),
    importText: (text) => { const d = importDeal(text); addDeal(d); return d; },
    exportText: () => exportDeal(store.list[store.active]),
    switchTo: (id) => setStore((s) => ({ ...s, active: id })),
    deleteActive: () => setStore((s) => {
      const list = { ...s.list }; delete list[s.active];
      if (!Object.keys(list).length) { const m = mockDeal(); list[m.id] = m; }
      return { active: Object.keys(list)[0], list };
    }),
    markReviewed: () => mutate((d) => ({ ...d, review: { at: new Date().toISOString(), hash: hashOf(keyTerms(d)) } })),
    clearReview: () => mutate((d) => ({ ...d, review: { at: null, hash: null } })),
  }), [addDeal, setStore, mutate, store]);

  const findings = useMemo(() => runChecks(deal), [deal]);
  const value = { deal, deals: Object.values(store.list), update, add, remove, actions, status, notes, findings, dismissNotes: () => setState((s) => ({ ...s, notes: [] })) };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
