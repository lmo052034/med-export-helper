/* 영문 제품 정보 입력 (05 홍보자료 · 06 바이어·상담이 함께 씀) */
import { Field, Input } from "./ui.jsx";

export default function ProductForm({ PROD, S, setS, keys }) {
  const fields = PROD.FIELDS.filter(([k]) => !keys || keys.includes(k));
  return (
    <div>
      {fields.map(([k, l]) => (
        <Field key={k} label={l}><Input value={S[k] || ""} onChange={(e) => setS({ ...S, [k]: e.target.value })} /></Field>
      ))}
      {(!keys || keys.includes("usps")) && (
        <div className="mb-3">
          <p className="text-[13.5px] font-semibold text-ink-2 mb-1.5">강점 3개와 근거 자료</p>
          <div className="grid gap-2">
            {S.usps.map((u, k) => (
              <div key={k} className="grid gap-1.5 rounded-xl bg-surface p-2">
                <Input value={u.t} placeholder={`강점 ${k + 1} (영문)`} onChange={(e) => setS({ ...S, usps: S.usps.map((x, j) => (j === k ? { ...x, t: e.target.value } : x)) })} />
                <Input value={u.ev} placeholder="근거 자료 (예: 시험성적서)" className="h-8 text-[13px]" onChange={(e) => setS({ ...S, usps: S.usps.map((x, j) => (j === k ? { ...x, ev: e.target.value } : x)) })} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
