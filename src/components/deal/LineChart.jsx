/* 작은 선 그래프 (SVG). 축 단위·0 기준선·현재 값 표시. 값은 계산 함수가 준 배열 그대로 그립니다 */
const nice = (v) => {
  if (v === 0) return 1;
  const e = 10 ** Math.floor(Math.log10(Math.abs(v)));
  const f = Math.abs(v) / e;
  return Math.sign(v) * (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e;
};

export function LineChart({ data, xLabel, yLabel, fmtY, fmtX = (x) => x, markers = [], label, base, height = 240 }) {
  const pts = data.filter((d) => d.y !== null && d.y !== undefined);
  if (pts.length < 2) return <p className="py-10 text-center text-[13px] text-[#6e6e73]">입력이 부족해 그래프를 그리지 않았어요.</p>;
  const W = 640, H = height, L = 64, R = 16, T = 16, B = 40;
  const xs = pts.map((p) => p.x), ys = [...pts.map((p) => p.y), ...(base || []).filter((p) => p.y !== null).map((p) => p.y), 0];
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  let y0 = Math.min(...ys), y1 = Math.max(...ys);
  const step = nice((y1 - y0) / 4 || 1);
  y0 = Math.floor(y0 / step) * step; y1 = Math.ceil(y1 / step) * step;
  if (y0 === y1) y1 = y0 + step;
  const sx = (x) => L + ((x - x0) / (x1 - x0 || 1)) * (W - L - R);
  const sy = (y) => T + (1 - (y - y0) / (y1 - y0)) * (H - T - B);
  const path = (arr) => arr.filter((p) => p.y !== null).map((p, i) => `${i ? "L" : "M"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" ");
  const ticks = []; for (let v = y0; v <= y1 + 1e-9; v += step) ticks.push(v);
  const xt = 5, xticks = Array.from({ length: xt + 1 }, (_, i) => Math.round(x0 + ((x1 - x0) * i) / xt));
  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={label}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={sy(v)} y2={sy(v)} stroke={v === 0 ? "#1d1d1f" : "rgba(0,0,0,0.08)"} strokeWidth={v === 0 ? 1 : 1} />
            <text x={L - 8} y={sy(v) + 4} textAnchor="end" fontSize="11" fill="#6e6e73">{fmtY(v)}</text>
          </g>
        ))}
        {xticks.map((x) => <text key={x} x={sx(x)} y={H - B + 18} textAnchor="middle" fontSize="11" fill="#6e6e73">{fmtX(x)}</text>)}
        <text x={W - R} y={H - 4} textAnchor="end" fontSize="11" fill="#6e6e73">{xLabel}</text>
        <text x={L} y={10} fontSize="11" fill="#6e6e73">{yLabel}</text>
        {base && <path d={path(base)} fill="none" stroke="#a1a1a6" strokeWidth="1.5" strokeDasharray="4 4" />}
        <path d={path(pts)} fill="none" stroke="var(--primary)" strokeWidth="2.5" />
        {markers.filter((m) => m.x >= x0 && m.x <= x1).map((m, i) => (
          <g key={i}>
            <line x1={sx(m.x)} x2={sx(m.x)} y1={T} y2={H - B} stroke={m.color || "#1d1d1f"} strokeDasharray="2 3" strokeWidth="1" />
            {m.y !== undefined && m.y !== null && <circle cx={sx(m.x)} cy={sy(m.y)} r="5" fill={m.color || "var(--primary)"} stroke="#fff" strokeWidth="2" />}
            <text x={sx(m.x) + (sx(m.x) > W - 140 ? -6 : 6)} y={T + 12 + i * 14} textAnchor={sx(m.x) > W - 140 ? "end" : "start"} fontSize="11" fill="#1d1d1f">{m.label}</text>
          </g>
        ))}
      </svg>
      {base && <figcaption className="mt-1 flex gap-4 text-[12px] text-[#6e6e73]"><span><span className="mr-1 inline-block h-[3px] w-4 align-middle bg-primary" />현재 조건</span><span><span className="mr-1 inline-block h-0 w-4 border-t-2 border-dashed border-[#a1a1a6] align-middle" />기준안</span></figcaption>}
    </figure>
  );
}
