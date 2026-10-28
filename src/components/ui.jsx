/* 화면 부품: 버튼·카드·배지·탭·입력·안내 상자. 모든 페이지가 같은 부품을 씁니다 */
import { Check, Info, AlertTriangle } from "lucide-react";

export const cx = (...a) => a.filter(Boolean).join(" ");

const BTN = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
  outline: "bg-white text-ink border border-line-2 hover:border-brand-500 hover:text-brand-700",
  soft: "bg-brand-50 text-brand-700 hover:bg-brand-100",
  ghost: "text-ink-2 hover:bg-surface",
  amber: "bg-amber-50 text-amber-700 hover:bg-amber-100",
};
const BTN_SIZE = { sm: "h-8 px-3 text-[13.5px] gap-1.5 rounded-lg", md: "h-10 px-4 text-[15px] gap-2 rounded-xl", lg: "h-12 px-5 text-base gap-2 rounded-xl" };

export function Button({ variant = "outline", size = "md", icon: Icon, className, as: As = "button", children, ...p }) {
  return (
    <As
      className={cx("inline-flex items-center justify-center font-semibold whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-brand-500", BTN[variant], BTN_SIZE[size], className)}
      {...(As === "button" ? { type: "button" } : {})}
      {...p}
    >
      {Icon && <Icon size={size === "sm" ? 15 : 17} strokeWidth={2.2} />}
      {children}
    </As>
  );
}

export function Card({ className, children, tone, ...p }) {
  return (
    <section className={cx("rounded-2xl p-5 sm:p-6", tone === "soft" ? "bg-brand-50/60 border border-brand-100" : "bg-white border border-line shadow-[0_1px_2px_rgba(20,30,30,.04)]", className)} {...p}>
      {children}
    </section>
  );
}

export function CardHeader({ title, desc, action, icon: Icon }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
      <div className="flex gap-3 items-start min-w-0">
        {Icon && (
          <span className="grid place-items-center size-9 rounded-xl bg-brand-50 text-brand-700 shrink-0">
            <Icon size={18} strokeWidth={2.2} />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold">{title}</h2>
          {desc && <p className="text-sm text-muted mt-0.5">{desc}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

const BADGE = {
  teal: "bg-brand-50 text-brand-700",
  amber: "bg-amber-50 text-amber-700",
  gray: "bg-surface text-ink-2",
  blue: "bg-[#eaf1f7] text-[#2f6690]",
  dark: "bg-graphite text-white",
  outline: "bg-white text-ink-2 ring-1 ring-inset ring-line-2",
};
export function Badge({ tone = "gray", className, children }) {
  return <span className={cx("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[12.5px] font-semibold whitespace-nowrap align-middle", BADGE[tone], className)}>{children}</span>;
}
// 예전 화면의 상태 이름(ok·warn·info·line·dark)을 배지 색으로
export const toneOf = (cls) => ({ ok: "teal", warn: "amber", info: "blue", line: "outline", dark: "dark", "": "gray" }[cls] || "gray");

export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div role="tablist" className={cx("flex gap-1 overflow-x-auto rounded-xl bg-white border border-line p-1 no-print [scrollbar-width:none]", className)}>
      {tabs.map(([k, label, Icon]) => (
        <button
          key={k}
          role="tab"
          type="button"
          aria-selected={value === k}
          onClick={() => onChange(k)}
          className={cx(
            "flex items-center gap-1.5 shrink-0 rounded-lg px-3.5 h-9 text-[14.5px] font-semibold transition-colors cursor-pointer",
            value === k ? "bg-brand-600 text-white shadow-sm" : "text-ink-2 hover:bg-surface"
          )}
        >
          {Icon && <Icon size={16} />}
          {label}
        </button>
      ))}
    </div>
  );
}

const CTRL = "w-full rounded-xl border border-line-2 bg-white px-3 text-[15px] text-ink placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 transition";
export const Input = ({ className, ...p }) => <input className={cx(CTRL, "h-10", className)} {...p} />;
export const Textarea = ({ className, ...p }) => <textarea className={cx(CTRL, "py-2.5 min-h-24 resize-y", className)} {...p} />;
export function Select({ className, options, children, ...p }) {
  return (
    <select className={cx(CTRL, "h-10 pr-8", className)} {...p}>
      {options ? options.map((o) => (Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o}>{o}</option>)) : children}
    </select>
  );
}
export function Field({ label, hint, className, children }) {
  return (
    <label className={cx("block mb-3", className)}>
      <span className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">
        {label} {hint && <span className="font-normal text-muted">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function Chip({ on, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx("h-9 px-3.5 rounded-full text-[14px] font-semibold border transition-colors cursor-pointer", on ? "bg-brand-600 border-brand-600 text-white" : "bg-white border-line-2 text-ink-2 hover:border-brand-500")}
    >
      {children}
    </button>
  );
}

const CALLOUT = {
  info: ["bg-[#eef4f9] text-[#24577d]", Info],
  warn: ["bg-amber-50 text-amber-700", AlertTriangle],
  ok: ["bg-brand-50 text-brand-700", Check],
};
export function Callout({ tone = "info", title, children, className }) {
  const [c, Icon] = CALLOUT[tone];
  return (
    <div className={cx("flex gap-3 rounded-2xl px-4 py-3.5 text-[14.5px] leading-relaxed", c, className)}>
      <Icon size={18} className="shrink-0 mt-0.5" />
      <div>
        {title && <b className="block font-bold mb-0.5">{title}</b>}
        {children}
      </div>
    </div>
  );
}

// 점검 목록: [["pass"|"warn"|"info", "문장"], ...]
export function CheckList({ items }) {
  return (
    <ul className="grid gap-2">
      {items.map(([k, t], i) => (
        <li key={i} className={cx("flex gap-2.5 items-start rounded-xl px-3 py-2.5 text-[14.5px]", k === "warn" ? "bg-amber-50 text-amber-700" : "bg-surface text-ink-2")}>
          <span className={cx("grid place-items-center size-5 rounded-full text-white shrink-0 mt-0.5", k === "pass" ? "bg-brand-600" : k === "warn" ? "bg-amber-600" : "bg-[#2f6690]")}>
            {k === "pass" ? <Check size={12} strokeWidth={3} /> : k === "warn" ? <span className="text-[11px] font-black">!</span> : <span className="text-[11px] font-black">i</span>}
          </span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export function Progress({ value, tone = "brand", className }) {
  return (
    <div className={cx("h-1.5 rounded-full bg-line overflow-hidden", className)}>
      <div className={cx("h-full rounded-full transition-all", tone === "amber" ? "bg-amber-500" : "bg-brand-600")} style={{ width: Math.max(0, Math.min(100, value)) + "%" }} />
    </div>
  );
}

// 표: 가로로 넘치면 표 안에서만 스크롤
export function Table({ head, children, className }) {
  return (
    <div className={cx("overflow-x-auto rounded-xl border border-line", className)}>
      <table className="w-full border-collapse text-[14px]">
        {head && (
          <thead>
            <tr>
              {head.map((h, i) => (
                <th key={i} className={cx("bg-surface text-left text-[12.5px] font-semibold text-muted px-3 py-2.5 border-b border-line whitespace-nowrap", h && h.num && "text-right")}>
                  {h && h.label !== undefined ? h.label : h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="[&_td]:px-3 [&_td]:py-2.5 [&_td]:border-b [&_td]:border-line [&_td]:align-top [&_tr:last-child_td]:border-b-0">{children}</tbody>
      </table>
    </div>
  );
}

// 긴 글(영문 초안 등)을 보여 주는 상자
export function Doc({ children, className }) {
  return <div className={cx("rounded-xl bg-surface px-4 py-3.5 text-[14.5px] leading-relaxed whitespace-pre-wrap", className)}>{children}</div>;
}
export const SectionTitle = ({ children, className }) => <h3 className={cx("text-[12.5px] font-bold text-brand-700 mt-5 mb-2 first:mt-0", className)}>{children}</h3>;
