/* 페이지에서 쓰는 부품. shadcn/ui(components/ui/) 위에 Apple(iOS) 모양을 입힘 (.claude/skills/apple-design) */
import { Check, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./ui/button.jsx";
import { badgeVariants } from "./ui/badge.jsx";
import { Input as SInput } from "./ui/input.jsx";
import { Textarea as STextarea } from "./ui/textarea.jsx";
import { NativeSelect } from "./ui/native-select.jsx";
import { Progress as SProgress } from "./ui/progress.jsx";

export const cx = cn;

const VARIANT = { primary: "default", outline: "outline", soft: "secondary", ghost: "ghost", amber: "outline", link: "link" };
const SIZE = { sm: "sm", md: "default", lg: "lg" };

export function Button({ variant = "outline", size = "md", icon: Icon, className, as: As = "button", children, ...p }) {
  return (
    <As
      className={cn(buttonVariants({ variant: VARIANT[variant], size: SIZE[size] }), variant === "amber" && "bg-amber-100/70 text-amber-700 hover:bg-amber-100", className)}
      {...(As === "button" ? { type: "button" } : {})}
      {...p}
    >
      {Icon && <Icon />}
      {children}
    </As>
  );
}

export function Card({ className, children, tone, ...p }) {
  return (
    <section data-slot="card" className={cn("rounded-2xl p-5 sm:p-6", tone === "soft" ? "bg-[rgba(120,120,128,0.08)]" : "bg-card text-card-foreground", className)} {...p}>
      {children}
    </section>
  );
}

export function CardHeader({ title, desc, action, icon: Icon }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div className="flex gap-3 items-start min-w-0">
        {Icon && (
          <span className="grid place-items-center size-8 rounded-[9px] bg-primary text-primary-foreground shrink-0">
            <Icon size={17} strokeWidth={2} />
          </span>
        )}
        <div className="min-w-0 grid gap-1">
          <h2 className="text-[17px] leading-[22px] font-semibold">{title}</h2>
          {desc && <p className="text-[15px] leading-5 text-muted-foreground">{desc}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

const BADGE = {
  teal: "border-transparent bg-primary/12 text-brand-700",
  amber: "border-transparent bg-amber-100/80 text-amber-700",
  gray: "border-transparent bg-secondary text-secondary-foreground",
  blue: "border-transparent bg-sky-100/70 text-sky-800",
  dark: "border-transparent bg-foreground text-background",
  outline: "border-transparent bg-secondary text-muted-foreground",
};
export function Badge({ tone = "gray", className, children }) {
  return <span className={cn(badgeVariants({ variant: "outline" }), BADGE[tone], "align-middle", className)}>{children}</span>;
}
// 예전 화면의 상태 이름(ok·warn·info·line·dark)을 배지 색으로
export const toneOf = (cls) => ({ ok: "teal", warn: "amber", info: "blue", line: "outline", dark: "dark", "": "gray" }[cls] || "gray");

/* iOS 세그먼트 컨트롤. 내용은 각 페이지가 value로 직접 바꿔 보여 줌 */
export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div className={cn("no-print max-w-full overflow-x-auto [scrollbar-width:none]", className)}>
      <div role="tablist" className="bg-secondary inline-flex h-9 w-fit items-center rounded-[10px] p-[2px]">
        {tabs.map(([k, label, Icon]) => (
          <button
            key={k}
            role="tab"
            type="button"
            aria-selected={value === k}
            data-state={value === k ? "active" : "inactive"}
            onClick={() => onChange(k)}
            className="inline-flex h-full shrink-0 items-center justify-center gap-1.5 rounded-[8px] px-3.5 text-[13px] font-medium whitespace-nowrap text-foreground transition-all duration-200 data-[state=active]:bg-card data-[state=active]:font-semibold data-[state=active]:shadow-[0_3px_8px_rgba(0,0,0,0.12),0_3px_1px_rgba(0,0,0,0.04)] [&_svg]:size-4"
          >
            {Icon && <Icon />}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export const Input = ({ className, ...p }) => <SInput className={className} {...p} />;
export const Textarea = ({ className, ...p }) => <STextarea className={cn("min-h-24", className)} {...p} />;
export function Select({ className, options, children, ...p }) {
  return (
    <NativeSelect className={className} {...p}>
      {options ? options.map((o) => (Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o}>{o}</option>)) : children}
    </NativeSelect>
  );
}
export function Field({ label, hint, className, children }) {
  return (
    <label className={cn("grid gap-2 mb-4", className)}>
      <span className="text-[13px] leading-none font-medium text-muted-foreground px-1">
        {label} {hint && <span className="font-normal opacity-70">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function Chip({ on, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn("press inline-flex h-9 items-center rounded-full px-4 text-sm font-medium", on ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-[rgba(120,120,128,0.18)]")}
    >
      {children}
    </button>
  );
}

/* 알림 상자: 테두리 없이 옅은 배경색으로 구분 */
const CALLOUT = {
  info: ["bg-card text-card-foreground", Info, "text-ink-2"],
  warn: ["bg-amber-50 text-amber-800", AlertTriangle, "text-amber-800/90"],
  ok: ["bg-brand-50 text-brand-800", Check, "text-brand-800/90"],
};
export function Callout({ tone = "info", title, children, className }) {
  const [c, Icon, d] = CALLOUT[tone];
  return (
    <div role="alert" className={cn("relative w-full rounded-2xl px-4 py-3.5 text-[15px] grid grid-cols-[18px_1fr] gap-x-3 gap-y-0.5 items-start", c, className)}>
      <Icon className="size-[18px] translate-y-px" />
      {title && <div className="col-start-2 font-semibold">{title}</div>}
      <div className={cn("col-start-2 text-[15px] leading-relaxed", d)}>{children}</div>
    </div>
  );
}

// 점검 목록: [["pass"|"warn"|"info", "문장"], ...]
export function CheckList({ items }) {
  return (
    <ul className="rounded-2xl bg-card overflow-hidden">
      {items.map(([k, t], i) => (
        <li key={i} className={cn("relative flex gap-3 items-start px-4 py-3 text-[15px] [&+li]:before:absolute [&+li]:before:top-0 [&+li]:before:left-11 [&+li]:before:right-0 [&+li]:before:h-px [&+li]:before:bg-border", k === "warn" && "bg-amber-50 text-amber-800")}>
          <span className={cn("grid place-items-center size-5 rounded-full shrink-0 mt-px", k === "pass" ? "bg-primary text-primary-foreground" : k === "warn" ? "bg-amber-500 text-white" : "bg-secondary text-muted-foreground")}>
            {k === "pass" ? <Check size={11} strokeWidth={3} /> : k === "warn" ? <span className="text-[10px] font-bold">!</span> : <span className="text-[10px] font-bold">i</span>}
          </span>
          <span className="leading-relaxed">{t}</span>
        </li>
      ))}
    </ul>
  );
}

export function Progress({ value, tone = "brand", className }) {
  return <SProgress value={Math.max(0, Math.min(100, value))} className={cn("h-1.5", tone === "amber" && "bg-amber-100", className)} indicatorClassName={tone === "amber" ? "bg-amber-500" : undefined} />;
}

// 표: 흰 카드 안 표, 가로로 넘치면 표 안에서만 스크롤
export function Table({ head, children, className }) {
  return (
    <div className={cn("overflow-x-auto rounded-2xl bg-card", className)}>
      <table className="w-full caption-bottom text-[15px]">
        {head && (
          <thead className="[&_tr]:border-b">
            <tr>
              {head.map((h, i) => (
                <th key={i} className={cn("text-muted-foreground h-10 px-4 text-left align-middle text-[13px] font-medium whitespace-nowrap", h && h.num && "text-right")}>
                  {h && h.label !== undefined ? h.label : h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="[&_tr]:border-b [&_tr:last-child]:border-0 [&_tr]:transition-colors [&_tr:hover]:bg-muted [&_td]:px-4 [&_td]:py-3 [&_td]:align-top">{children}</tbody>
      </table>
    </div>
  );
}

// 긴 글(영문 초안 등)을 보여 주는 상자
export function Doc({ children, className }) {
  return <div className={cn("rounded-2xl bg-[rgba(120,120,128,0.08)] px-4 py-3.5 text-[15px] leading-relaxed whitespace-pre-wrap", className)}>{children}</div>;
}
export const SectionTitle = ({ children, className }) => <h3 className={cn("text-[13px] font-medium text-muted-foreground px-1 mt-6 mb-2 first:mt-0", className)}>{children}</h3>;
