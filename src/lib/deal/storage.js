/* 거래 저장: 이 브라우저(localStorage)에만 저장합니다. 서버로 보내지 않아요.
   mdk:deals = { active, list: { id: 거래 } }. 이전 버전 키(mdk:deal, mdk:log)는 지우지 않고 읽기만 합니다 */
import { blankDeal, mockDeal, sanitize, migrateV1, logToEvidence } from "./model.js";

const KEY = "mdk:deals";
const ls = () => { try { return window.localStorage; } catch { return null; } };

function readRaw(k) {
  const s = ls();
  if (!s) return { ok: false, value: null, raw: null };
  const raw = s.getItem(k);
  if (raw === null) return { ok: true, value: null, raw };
  try { return { ok: true, value: JSON.parse(raw), raw }; } catch { return { ok: false, value: null, raw }; }
}

/* 처음 열 때: 새 저장값 → 없으면 이전 버전 값 옮기기 → 없으면 모의 거래.
   읽을 수 없는 값은 지우지 않고 백업 키로 옮긴 뒤 알려 줍니다 */
export function loadAll(makeSample = mockDeal) {
  const notes = [];
  const cur = readRaw(KEY);
  let store = null;
  if (cur.value && typeof cur.value === "object" && cur.value.list && typeof cur.value.list === "object") {
    const list = {};
    let broken = 0;
    for (const [id, d] of Object.entries(cur.value.list)) {
      try { const s = sanitize(d); list[s.id] = s; } catch { broken++; }
    }
    if (broken) notes.push({ type: "recovered", text: `저장된 거래 ${broken}건을 읽지 못해 제외했어요. 원본은 백업해 두었어요.` });
    if (broken) backup(cur.raw);
    if (Object.keys(list).length) {
      store = { active: list[cur.value.active] ? cur.value.active : Object.keys(list)[0], list };
      // 대표 모의 거래가 없으면 추가만 하고, 지금 보던 거래는 그대로 둡니다
      const sample = makeSample();
      if (!Object.values(list).some((d) => d.sampleKey && d.sampleKey === sample.sampleKey)) {
        list[sample.id] = sample;
        notes.push({ type: "sample", text: "진행 중 거래를 목록에 추가했어요. 기존 거래는 그대로예요." });
      }
    }
  } else if (cur.raw !== null) {
    backup(cur.raw);
    notes.push({ type: "recovered", text: "저장된 거래 데이터를 읽지 못했어요. 원본은 백업하고 새로 시작했어요." });
  }
  if (!store) {
    const list = {};
    const old = readRaw("mdk:deal");
    if (old.ok && old.value) {
      const m = migrateV1(old.value);
      if (m) { list[m.id] = m; notes.push({ type: "migrated", text: "이전 버전의 견적서, 인보이스 입력값을 새 거래로 옮겼어요. 이전 값도 그대로 남아 있어요." }); }
    }
    const log = readRaw("mdk:log");
    const ev = log.ok ? logToEvidence(log.value) : [];
    const mock = makeSample();
    list[mock.id] = mock;
    const first = Object.values(list).find((d) => d.kind === "user") || mock;
    if (ev.length) { first.evidence = [...first.evidence, ...ev]; notes.push({ type: "migrated", text: `이전 AI 답 확인 기록 ${ev.length}건을 근거자료로 옮겼어요.` }); }
    store = { active: first.id, list };
  }
  return { store, notes };
}

export function saveAll(store) {
  const s = ls();
  if (!s) return { ok: false, error: "이 브라우저는 저장을 막아 두었어요." };
  try { s.setItem(KEY, JSON.stringify(store)); return { ok: true }; } catch (e) { return { ok: false, error: "저장 공간이 부족하거나 저장이 막혀 있어요." }; }
}

function backup(raw) {
  const s = ls();
  if (!s || raw === null) return;
  try { s.setItem(`${KEY}.backup-${new Date().toISOString().slice(0, 19)}`, raw); } catch {}
}

export function listBackups() {
  const s = ls();
  if (!s) return [];
  return Object.keys(s).filter((k) => k.startsWith(KEY + ".backup-"));
}

/* 파일 불러오기(사례 JSON): 한 거래 또는 { deal } 형태 */
export function importDeal(text) {
  const obj = JSON.parse(text);
  const raw = obj && obj.deal ? obj.deal : obj;
  const d = sanitize(raw);
  d.id = Math.random().toString(36).slice(2, 10); // 기존 거래를 덮어쓰지 않게 항상 새 id
  if (d.kind === "sample") { d.kind = "case"; d.sampleKey = ""; } // 파일로 불러온 대표 사례는 사본으로
  if (d.kind !== "case" && d.kind !== "mock") d.kind = "user";
  return d;
}

export function exportDeal(d) {
  return JSON.stringify({ app: "med-export-helper", schema: d.schema, exportedAt: new Date().toISOString(), deal: d }, null, 2);
}

export { blankDeal, mockDeal };
