import { useState } from "react";
import { ClipboardCopy, Download, Info, Plus, RotateCcw, Trash2 } from "lucide-react";
import { PARTS, SEED_LOG, clone, getLog, setLog } from "../lib/store.js";
import { Button, Callout, Select, Textarea, cx } from "../components/ui.jsx";
import { PageHeader, StepPager, useApp } from "../components/shell.jsx";

const COLS = [["part", "분야"], ["prompt", "AI에게 물은 것"], ["ai", "AI 답 요약"], ["source", "확인한 공식자료"], ["fix", "고친 내용"]];

export default function Log() {
  const { copy, toast } = useApp();
  const [rows, setRaw] = useState(getLog);
  const setRows = (r) => { setRaw(r); setLog(r); };
  const edit = (k, f, v) => setRows(rows.map((r, j) => (j === k ? { ...r, [f]: v } : r)));
  const count = (p) => rows.filter((r) => r.part === p).length;

  const copyTable = () => copy([COLS.map((c) => c[1]).join("\t"), ...rows.map((r) => COLS.map(([f]) => String(r[f] || "").replace(/\s+/g, " ")).join("\t"))].join("\n"), "표를 복사했어요. 엑셀·문서에 붙여 넣으세요");
  const csv = () => {
    const q = (s) => '"' + String(s || "").replace(/"/g, '""') + '"';
    const t = "﻿" + [COLS.map((c) => q(c[1])).join(","), ...rows.map((r) => COLS.map(([f]) => q(r[f])).join(","))].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([t], { type: "text/csv;charset=utf-8" }));
    a.download = "AI_답확인기록.csv";
    a.click();
    toast("CSV를 내려받았어요");
  };

  return (
    <>
      <PageHeader
        path="/log"
        desc="다른 페이지의 'AI에게 묻기'에서 기록을 남기면 여기로 모입니다. 칸을 눌러 바로 고칠 수 있어요. 분야마다 몇 건씩 쌓이면 사업계획서·지원사업 신청서의 근거로 쓸 수 있어요."
        guide={[["이 페이지에서", "AI 답을 공식자료로 확인한 기록을 모읍니다."], ["확인할 곳", "수입국 세관 관세율표, 인허가 기관 고시, KOTRA 해외시장뉴스"], ["다 하면", "표를 복사하거나 CSV로 내려받아요."]]}
        actions={<>
          <Button icon={Plus} onClick={() => setRows([...rows, { part: PARTS[0], prompt: "", ai: "", source: "", fix: "" }])}>행 추가</Button>
          <Button icon={ClipboardCopy} onClick={copyTable}>표 복사</Button>
          <Button variant="primary" icon={Download} onClick={csv}>CSV 내보내기</Button>
          <Button variant="ghost" icon={RotateCcw} onClick={() => confirm("직접 추가한 기록이 지워집니다. 처음 예시 2건으로 되돌릴까요?") && setRows(clone(SEED_LOG))}>처음 상태로</Button>
        </>}
      />

      <Callout tone="info" title="AI 답은 틀릴 수 있어요" className="mb-6">
        KOTRA도 AI가 답할 때 <b>근거 문서를 함께 보여 주도록</b> 만들고 있어요 (사례집 09). 여기에는 'AI에게 물은 것 → AI 답 → 공식자료로 확인 → 고친 내용'을 모아 둡니다. 처음 2건은 형식 예시예요.
      </Callout>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 mb-6">
        <div className="rounded-2xl bg-graphite text-white px-4 py-3"><p className="text-xs text-white/70">전체</p><p className="text-2xl font-semibold tabular-nums">{rows.length}<span className="text-sm font-medium ml-0.5">건</span></p></div>
        {PARTS.map((p) => {
          const c = count(p);
          return (
            <div key={p} className={cx("rounded-2xl px-4 py-3", c < 3 ? "bg-amber-50" : "bg-card")}>
              <p className="text-xs text-ink-2 truncate">{p}</p>
              <p className="text-2xl font-semibold tabular-nums">{c}<span className="text-sm font-medium ml-0.5">건</span></p>
              <div className="h-1.5 rounded-full bg-line mt-1.5 overflow-hidden"><i className={cx("block h-full rounded-full", c < 3 ? "bg-amber-500" : "bg-brand-600")} style={{ width: Math.min(100, c * 34) + "%" }} /></div>
            </div>
          );
        })}
      </div>

      <section className="rounded-2xl bg-card overflow-hidden">
        <div className="hidden md:grid grid-cols-[36px_140px_repeat(4,minmax(0,1fr))_44px] gap-2 px-4 py-3 bg-surface border-b border-line text-xs font-semibold text-ink-2">
          <span>#</span>{COLS.map(([, l]) => <span key={l}>{l}</span>)}<span />
        </div>
        {rows.length === 0 && <p className="px-5 py-8 text-center text-muted-foreground">기록이 없어요. '행 추가'를 누르거나 다른 페이지의 'AI에게 묻기'에서 남겨 보세요.</p>}
        {rows.map((r, k) => (
          <div key={k} className={cx("grid md:grid-cols-[36px_140px_repeat(4,minmax(0,1fr))_44px] gap-2 px-4 py-3 border-b border-line last:border-b-0 items-start", r.seed && "bg-brand-50/40")}>
            <span className="hidden md:block pt-2.5 text-muted-foreground tabular-nums">{k + 1}</span>
            <div className="flex items-center gap-2 md:block">
              <span className="md:hidden text-muted-foreground text-[13px] tabular-nums">#{k + 1}</span>
              <Select value={r.part} options={PARTS} onChange={(e) => edit(k, "part", e.target.value)} className="h-9 text-sm" aria-label="분야" />
            </div>
            {COLS.slice(1).map(([f, l]) => (
              <label key={f} className="block">
                <span className="md:hidden block text-xs font-semibold text-muted-foreground mb-1">{l}</span>
                <Textarea value={r[f] || ""} onChange={(e) => edit(k, f, e.target.value)} className="min-h-20 text-sm px-2.5 py-2" aria-label={l} />
              </label>
            ))}
            <Button size="sm" variant="ghost" icon={Trash2} className="justify-self-end md:mt-1" onClick={() => setRows(rows.filter((_, j) => j !== k))} aria-label="삭제"><span className="md:hidden">삭제</span></Button>
          </div>
        ))}
      </section>
      <p className="mt-3 text-[13px] text-muted-foreground flex gap-1.5 items-center"><Info size={14} /> 기록은 이 브라우저에만 저장돼요. 다른 컴퓨터로 옮기려면 CSV로 내보내세요.</p>

      <StepPager path="/log" />
    </>
  );
}
