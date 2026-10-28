import { useMemo, useState } from "react";
import { BarChart3, Copy, Eraser, MessageCircleQuestion, SlidersHorizontal, Sparkles, Trophy, ListOrdered, ShieldCheck } from "lucide-react";
import { profile, useStored } from "../lib/store.js";
import { Badge, Button, Callout, Card, CardHeader, CheckList, Input, Progress, cx } from "../components/ui.jsx";
import { PageHeader, StepPager, useApp } from "../components/shell.jsx";

// dir: 1 = 높을수록 좋음, -1 = 낮을수록 좋음
const IND = [
  { id: "imp", label: "수입 규모", unit: "USD 백만", desc: "그 나라가 이 HS 코드를 1년에 얼마나 수입하나", dir: 1, w: 20 },
  { id: "growth", label: "성장", unit: "%", desc: "수입액이 늘고 있나 (연 증가율)", dir: 1, w: 15 },
  { id: "kr", label: "한국산 비중", unit: "%", desc: "수입 중 한국 제품 비율", dir: 1, w: 15 },
  { id: "tariff", label: "관세", unit: "%", desc: "우리가 받을 수 있는 가장 낮은 세율", dir: -1, w: 10 },
  { id: "cert", label: "인증 난이도", unit: "1–5", desc: "1 쉬움 · 5 어려움", dir: -1, w: 20 },
  { id: "comp", label: "경쟁", unit: "1–5", desc: "1 약함 · 5 치열", dir: -1, w: 10 },
  { id: "track", label: "거래해 본 적", unit: "1=예", desc: "이미 거래한 바이어·대리점이 있나", dir: 1, w: 10 },
];

// 예시 값: HS 9018.90 공식 통계(WITS/UN Comtrade, 2026.10.25 조회)와 공개 제도에 따른 판단. 나라 이름이 같을 때만 채웁니다
const W = "WITS HS901890";
const EXAMPLE = {
  인도네시아: { imp: [410.9, W], growth: [-1.8, W + " 전년 대비"], kr: [5.28, W + " 한국산"], cert: [2, "판단: AKL은 현지 유통사가 신청, CE 필수 아님"], comp: [3, "판단: 중국 23.4% · 미·독 31% (WITS)"] },
  일본: { imp: [2932.6, W], growth: [5.9, W + " 전년 대비"], kr: [4.59, W + " 한국산"], tariff: [0, "일본 세관 실행관세율표 90류 Free"], cert: [5, "판단: 현지 MAH 필요, PMDA·인증기관 심사"], comp: [5, "판단: 미 34.1% · 멕시코 17.4%, 현지 브랜드"] },
  홍콩: { imp: [670.4, W], growth: [1.0, W + " 전년 대비"], kr: [5.64, W + " 한국산"], tariff: [0, "홍콩 자유항, 일반 수입관세 없음"], cert: [3, "판단: MDACS 자율 등재·현지 책임자(LRP) 필요"], comp: [3, "판단: 중국 29.5% · 미 23.7%"] },
};
const IDS = ["c1", "c2", "c3"];
const key = (i, c) => i + ":" + c;

function withExample(S, names) {
  const cells = { ...S.cells };
  let n = 0;
  IDS.forEach((c) => Object.entries(EXAMPLE[names[c]] || {}).forEach(([i, [v, src]]) => { cells[key(i, c)] = { v, src, yr: "2025" }; n++; }));
  return [{ ...S, cells }, n];
}

export default function Market() {
  const { ask, copy, toast } = useApp();
  const P = profile();
  const names0 = (P.countries || "").split(/[,·]/).map((s) => s.trim()).filter(Boolean);
  const [S, setS] = useStored("market", () => {
    const base = { cells: {}, w: Object.fromEntries(IND.map((i) => [i.id, i.w])), names: {} };
    if (!P.sample) return base;
    return withExample(base, Object.fromEntries(IDS.map((c, k) => [c, names0[k] || ""])))[0];
  });
  const [showW, setShowW] = useState(false);
  const name = (c) => S.names[c] || names0[IDS.indexOf(c)] || ["후보 1", "후보 2", "후보 3"][IDS.indexOf(c)];
  const names = Object.fromEntries(IDS.map((c) => [c, name(c)]));
  const w = (i) => (S.w[i] != null ? S.w[i] : IND.find((x) => x.id === i).w);
  const cell = (i, c) => S.cells[key(i, c)] || { v: "", src: "", yr: "" };
  const setCell = (i, c, f, v) => setS({ ...S, cells: { ...S.cells, [key(i, c)]: { ...cell(i, c), [f]: v } } });
  const setName = (c, v) => setS({ ...S, names: { ...S.names, [c]: v } });
  const num = (i, c) => { const x = cell(i, c); return x.v === "" || x.v == null || isNaN(+x.v) ? null : +x.v; };

  // 최소–최대 정규화. 값이 2개 미만인 기준은 계산에서 뺍니다
  const score = (drop) => {
    const res = {}; IDS.forEach((c) => (res[c] = { s: 0, parts: {} }));
    let wsum = 0;
    IND.forEach((i) => {
      if (i.id === drop || !w(i.id)) return;
      const vals = IDS.map((c) => num(i.id, c)).filter((v) => v != null);
      if (vals.length < 2) return;
      const mn = Math.min(...vals), mx = Math.max(...vals);
      wsum += w(i.id);
      IDS.forEach((c) => {
        const v = num(i.id, c);
        const n = v == null ? 0 : mx === mn ? 1 : i.dir > 0 ? (v - mn) / (mx - mn) : (mx - v) / (mx - mn);
        res[c].parts[i.id] = n; res[c].s += w(i.id) * n;
      });
    });
    IDS.forEach((c) => (res[c].s = wsum ? (res[c].s / wsum) * 100 : 0));
    return res;
  };
  const fmtV = (i, v) => {
    if (v == null) return "미입력";
    if (i.id === "track") return v ? "거래 경험 있음" : "거래 경험 없음";
    if (i.unit === "1–5") return v + "/5";
    if (i.unit === "USD 백만") return "USD " + v.toLocaleString() + "M";
    return v + i.unit;
  };

  const R = useMemo(() => {
    const r = score();
    const ranked = IDS.slice().sort((a, b) => r[b].s - r[a].s), win = ranked[0];
    const active = IND.filter((i) => w(i.id) && IDS.filter((c) => num(i.id, c) != null).length >= 2);
    let keep = 0;
    active.forEach((i) => { const rr = score(i.id); if (IDS.slice().sort((a, b) => rr[b].s - rr[a].s)[0] === win) keep++; });
    const all = IND.length * IDS.length;
    const filled = IND.reduce((a, i) => a + IDS.filter((c) => num(i.id, c) != null).length, 0);
    const sourced = IND.reduce((a, i) => a + IDS.filter((c) => num(i.id, c) != null && cell(i.id, c).src && cell(i.id, c).yr).length, 0);
    const gap = r[ranked[0]].s - r[ranked[1]].s;
    const others = IDS.filter((c) => c !== win);
    const reasons = active
      .map((i) => ({ i, d: w(i.id) * ((r[win].parts[i.id] || 0) - others.reduce((a, o) => a + (r[o].parts[i.id] || 0), 0) / others.length) }))
      .filter((x) => x.d > 0).sort((a, b) => b.d - a.d).slice(0, 3)
      .map(({ i }) => { const x = cell(i.id, win); return `${i.label}: ${names[win]} ${fmtV(i, num(i.id, win))} (비교: ${others.map((o) => `${names[o]} ${fmtV(i, num(i.id, o))}`).join(", ")}) · 출처 ${x.src || "없음"}${x.yr ? ", " + x.yr : ""}`; });
    const ck = [];
    ck.push(filled < all ? ["warn", `빈 칸 ${all - filled}개. 모든 칸에 숫자를 넣어야 비교가 공정해요.`] : ["pass", "모든 칸을 채웠어요."]);
    ck.push(filled - sourced > 0 ? ["warn", `숫자는 있는데 출처나 연도가 없는 칸 ${filled - sourced}개`] : ["pass", "넣은 숫자 모두 출처·연도가 있어요."]);
    ck.push(active.length && keep === active.length ? ["pass", "기준 하나를 빼도 1위가 같아요. 결론이 튼튼해요."] : ["info", "기준 하나만 빼도 1위가 바뀌어요. 그 기준의 근거를 더 단단히 준비하세요."]);
    ck.push(["info", "'판단'으로 적은 칸(인증 난이도·경쟁)은 근거 문장을 함께 남기세요."]);
    return { r, ranked, win, active, keep, all, sourced, gap, reasons, ck };
  }, [S]); // eslint-disable-line

  const copyTable = () => {
    const rows = [["기준", "중요도", ...IDS.map(name)].join("\t"), ...IND.map((i) => [i.label + " (" + i.unit + ")", w(i.id), ...IDS.map((c) => { const x = cell(i.id, c); return `${x.v === "" ? "입력" : x.v}${x.src ? " [" + x.src + (x.yr ? ", " + x.yr : "") + "]" : ""}`; })].join("\t")), ["종합 점수", "", ...IDS.map((c) => R.r[c].s.toFixed(0))].join("\t")];
    copy(rows.join("\n"), "표를 복사했어요. 엑셀·슬라이드에 붙여 넣으세요");
  };
  const prompt = `너는 무역 통계 조사를 돕는 담당자다. 아래 표를 채울 "찾을 곳"과 "후보 숫자"를 알려 줘.
제품: ${P.product || "(제품)"} · HS ${P.hs || "(HS 6자리)"}
후보 나라: ${IDS.map(name).join(", ")}
기준: 1) 연간 수입액(USD) 최근 3년 2) 연 증가율 3) 한국산 수입액과 비중 4) 우리가 받을 수 있는 관세(MFN·FTA) 5) 의료기기 인허가 제도와 난이도 6) 주요 경쟁 브랜드·수입국
규칙:
- 숫자마다 출처 이름, 표 이름, 기준연도를 붙여라. 모르면 "모름"이라고 써라.
- UN Comtrade, ITC Trade Map, K-stat, KOTRA 해외시장뉴스, 수입국 관세청 중 어디서 어떤 메뉴로 보는지 알려 줘.
- HS 6자리가 우리 제품보다 넓은 범위라는 한계와 좁히는 방법도 알려 줘.
- 한국 관세율표(한국으로 들여올 때 세율)와 수입국 세율을 섞지 마라.`;

  return (
    <>
      <PageHeader
        path="/market"
        desc="후보 나라 2–3곳을 같은 기준(수입 규모, 성장, 한국산 비중, 관세, 인증 난이도, 경쟁)으로 나란히 놓고 첫 수출국을 골라요. 기준 하나를 빼도 결론이 같은지도 확인해 줘요."
        guide={[["이 페이지에서", "후보 나라를 숫자로 비교하고 1곳을 고릅니다."], ["준비물", "HS 코드, UN Comtrade·ITC Trade Map 같은 통계 사이트"], ["다 하면", "04 HS·관세·인증 확인에서 그 나라를 자세히 봅니다."]]}
        actions={<>
          <Button icon={Sparkles} onClick={() => { const [s, n] = withExample(S, names); setS(s); toast(n ? `예시 값 ${n}칸을 채웠어요 (인도네시아·일본·홍콩만 있어요)` : "예시 값은 인도네시아·일본·홍콩만 있어요. 나라 이름을 확인하세요"); }}>예시 값 넣기</Button>
          <Button variant="ghost" icon={Eraser} onClick={() => confirm("표의 숫자를 모두 비울까요?") && setS({ ...S, cells: {} })}>숫자 비우기</Button>
          <Button variant="soft" icon={MessageCircleQuestion} onClick={() => ask("숫자 조사 질문", prompt, "나라 고르기")}>AI에게 숫자 묻기</Button>
          <Button variant="primary" icon={Copy} onClick={copyTable}>표 복사</Button>
        </>}
      />

      <Callout className="mb-6">HS 6자리 코드는 범위가 넓어요. 예를 들어 9018.90은 '그 밖의 의료기기' 전체라서, 이 수입액을 우리 제품 시장 규모라고 말하면 안 돼요. 한계를 함께 적어 두세요.</Callout>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <Card className="min-w-0">
          <CardHeader icon={BarChart3} title="비교표" desc="칸마다 숫자 · 출처 · 연도를 넣어요. 나라 이름은 맨 위에서 바꿀 수 있어요." />
          <div className="grid grid-cols-3 md:grid-cols-[200px_repeat(3,minmax(0,1fr))] gap-2 md:gap-3 pb-3 border-b border-line">
            <span className="hidden md:block text-xs font-semibold text-muted-foreground self-end">기준 · 나라 이름</span>
            {IDS.map((c) => <Input key={c} value={names[c]} onChange={(e) => setName(c, e.target.value)} className="font-semibold px-2.5" aria-label="나라 이름" />)}
          </div>
          {IND.map((i) => (
            <div key={i.id} className="grid grid-cols-1 md:grid-cols-[200px_repeat(3,minmax(0,1fr))] gap-3 py-4 border-b border-line last:border-b-0">
              <div>
                <p className="font-semibold">{i.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{i.desc} · {i.unit}</p>
                <Badge tone={i.dir > 0 ? "teal" : "amber"} className="mt-1.5">{i.dir > 0 ? "높을수록 좋음" : "낮을수록 좋음"}</Badge>
              </div>
              <div className="grid grid-cols-3 md:contents gap-2">
                {IDS.map((c) => {
                  const x = cell(i.id, c);
                  return (
                    <div key={c} className="grid gap-1.5 content-start min-w-0">
                      <span className="md:hidden text-[11.5px] font-semibold text-muted-foreground truncate">{names[c]}</span>
                      <Input type="number" step="any" placeholder={i.unit} value={x.v} onChange={(e) => setCell(i.id, c, "v", e.target.value)} className="font-semibold tabular-nums px-2.5" />
                      <Input placeholder="출처" value={x.src} onChange={(e) => setCell(i.id, c, "src", e.target.value)} className="h-8 text-xs px-2.5 bg-surface border-transparent" />
                      <Input placeholder="연도" value={x.yr} onChange={(e) => setCell(i.id, c, "yr", e.target.value)} className="h-8 text-xs px-2.5 bg-surface border-transparent" />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="mt-4 pt-4 border-t border-line">
            <Button size="sm" variant="ghost" icon={SlidersHorizontal} onClick={() => setShowW(!showW)}>기준별 중요도 바꾸기 (선택)</Button>
            {showW && (
              <div className="mt-3">
                <p className="text-sm text-muted-foreground mb-3">중요한 기준일수록 크게. 왜 그렇게 정했는지 한 줄로 설명할 수 있어야 해요.</p>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                  {IND.map((i) => (
                    <label key={i.id} className="flex items-center gap-3 text-sm">
                      <span className="w-24 shrink-0">{i.label}</span>
                      <input type="range" min="0" max="40" step="5" value={w(i.id)} onChange={(e) => setS({ ...S, w: { ...S.w, [i.id]: +e.target.value } })} className="flex-1 accent-brand-600" />
                      <output className="w-6 text-right tabular-nums font-semibold">{w(i.id)}</output>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        <aside className="grid gap-6 xl:sticky xl:top-8">
          <Card>
            <CardHeader icon={Trophy} title={R.r[R.win].s ? `1위 ${names[R.win]}` : "숫자를 넣어 주세요"} desc="비교 결과" />
            <div className="grid gap-3">
              {R.ranked.map((c, k) => (
                <div key={c}>
                  <div className="flex justify-between text-sm font-semibold mb-1"><span>{k + 1}. {names[c]}</span><span className="tabular-nums">{R.r[c].s.toFixed(0)}점</span></div>
                  <Progress value={R.r[c].s} className={cx("h-2", k > 0 && "opacity-40")} />
                </div>
              ))}
            </div>
            <dl className="grid grid-cols-3 gap-2 mt-5">
              {[[`${R.keep}/${R.active.length}`, "기준 하나 빼도 1위"], [`${R.gap.toFixed(0)}점`, "1·2위 차이"], [`${R.sourced}/${R.all}`, "출처 있는 칸"]].map(([a, b]) => (
                <div key={b} className="rounded-lg bg-surface px-2 py-2.5 text-center"><dt className="text-base font-semibold tabular-nums">{a}</dt><dd className="text-[11.5px] text-muted-foreground leading-tight mt-0.5">{b}</dd></div>
              ))}
            </dl>
          </Card>
          <Card>
            <CardHeader icon={ListOrdered} title="고른 이유 3가지 (초안)" desc="1위 나라가 크게 앞선 기준 순서예요." />
            {R.reasons.length ? (
              <ol className="grid gap-2 text-sm text-ink-2 list-decimal pl-5">{R.reasons.map((l) => <li key={l}>{l}</li>)}</ol>
            ) : <p className="text-sm text-muted-foreground">두 나라 이상 숫자를 넣으면 이유가 만들어져요.</p>}
            <Button size="sm" className="mt-4" icon={Copy} onClick={() => copy(R.reasons.map((l, k) => k + 1 + ". " + l).join("\n"), "이유를 복사했어요")}>이유 복사</Button>
          </Card>
          <Card>
            <CardHeader icon={ShieldCheck} title="점검" />
            <CheckList items={R.ck} />
          </Card>
        </aside>
      </div>

      <StepPager path="/market" />
    </>
  );
}
