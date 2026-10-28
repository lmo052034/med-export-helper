/* 페이지에서 쓰는 부품. 모양은 모두 shadcn/ui(components/ui/)를 따릅니다 */
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
      className={cn(buttonVariants({ variant: VARIANT[variant], size: SIZE[size] }), variant === "amber" && "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-700", className)}
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
    <section data-slot="card" className={cn("rounded-xl border p-5 sm:p-6", tone === "soft" ? "bg-muted/40" : "bg-card text-card-foreground shadow-sm", className)} {...p}>
      {children}
    </section>
  );
}

export function CardHeader({ title, desc, action, icon: Icon }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div className="flex gap-3 items-start min-w-0">
        {Icon && (
          <span className="grid place-items-center size-8 rounded-md border bg-background text-primary shadow-xs shrink-0">
            <Icon size={16} />
          </span>
        )}
        <div className="min-w-0 grid gap-1">
          <h2 className="leading-none font-semibold pt-0.5">{title}</h2>
          {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

const BADGE = {
  teal: "border-transparent bg-primary/10 text-brand-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  gray: "border-transparent bg-secondary text-secondary-foreground",
  blue: "border-transparent bg-sky-50 text-sky-800",
  dark: "border-transparent bg-foreground text-background",
  outline: "text-foreground",
};
export function Badge({ tone = "gray", className, children }) {
  return <span className={cn(badgeVariants({ variant: "outline" }), BADGE[tone], "align-middle", className)}>{children}</span>;
}
// 예전 화면의 상태 이름(ok·warn·info·line·dark)을 배지 색으로
export const toneOf = (cls) => ({ ok: "teal", warn: "amber", info: "blue", line: "outline", dark: "dark", "": "gray" }[cls] || "gray");

/* shadcn Tabs 모양. 내용은 각 페이지가 value로 직접 바꿔 보여 줌 */
export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div className={cn("no-print max-w-full overflow-x-auto [scrollbar-width:none]", className)}>
      <div role="tablist" className="bg-muted text-muted-foreground inline-flex h-9 w-fit items-center rounded-lg p-[3px]">
        {tabs.map(([k, label, Icon]) => (
          <button
            key={k}
            role="tab"
            type="button"
            aria-selected={value === k}
            data-state={value === k ? "active" : "inactive"}
            onClick={() => onChange(k)}
            className="inline-flex h-[calc(100%-1px)] shrink-0 items-center justify-center gap-1.5 rounded-md border border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap text-foreground/70 transition-[color,box-shadow] hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm [&_svg]:size-4"
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
      <span className="text-sm leading-none font-medium">
        {label} {hint && <span className="font-normal text-muted-foreground">{hint}</span>}
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
      className={cn("inline-flex h-8 items-center rounded-md border px-3 text-sm font-medium shadow-xs transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-accent")}
    >
      {children}
    </button>
  );
}

/* shadcn Alert 모양 */
const CALLOUT = {
  info: ["bg-card text-card-foreground", Info, "text-muted-foreground"],
  warn: ["border-amber-200 bg-amber-50 text-amber-800", AlertTriangle, "text-amber-800/90"],
  ok: ["border-brand-200 bg-brand-50 text-brand-800", Check, "text-brand-800/90"],
};
export function Callout({ tone = "info", title, children, className }) {
  const [c, Icon, d] = CALLOUT[tone];
  return (
    <div role="alert" className={cn("relative w-full rounded-lg border px-4 py-3 text-sm grid grid-cols-[16px_1fr] gap-x-3 gap-y-0.5 items-start", c, className)}>
      <Icon className="size-4 translate-y-0.5" />
      {title && <div className="col-start-2 font-medium tracking-tight">{title}</div>}
      <div className={cn("col-start-2 text-sm leading-relaxed", d)}>{children}</div>
    </div>
  );
}

// 점검 목록: [["pass"|"warn"|"info", "문장"], ...]
export function CheckList({ items }) {
  return (
    <ul className="grid gap-2">
      {items.map(([k, t], i) => (
        <li key={i} className={cn("flex gap-2.5 items-start rounded-lg border px-3 py-2.5 text-sm", k === "warn" ? "border-amber-200 bg-amber-50 text-amber-800" : "bg-card")}>
          <span className={cn("grid place-items-center size-4.5 rounded-full shrink-0 mt-px", k === "pass" ? "bg-primary text-primary-foreground" : k === "warn" ? "bg-amber-600 text-white" : "bg-muted text-muted-foreground border")}>
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

// 표: shadcn Table 모양, 가로로 넘치면 표 안에서만 스크롤
export function Table({ head, children, className }) {
  return (
    <div className={cn("overflow-x-auto rounded-lg border", className)}>
      <table className="w-full caption-bottom text-sm">
        {head && (
          <thead className="bg-muted/50 [&_tr]:border-b">
            <tr>
              {head.map((h, i) => (
                <th key={i} className={cn("text-muted-foreground h-10 px-3 text-left align-middle font-medium whitespace-nowrap", h && h.num && "text-right")}>
                  {h && h.label !== undefined ? h.label : h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="[&_tr]:border-b [&_tr:last-child]:border-0 [&_tr]:transition-colors [&_tr:hover]:bg-muted/40 [&_td]:px-3 [&_td]:py-2.5 [&_td]:align-top">{children}</tbody>
      </table>
    </div>
  );
}

// 긴 글(영문 초안 등)을 보여 주는 상자
export function Doc({ children, className }) {
  return <div className={cn("rounded-lg border bg-muted/40 px-4 py-3.5 text-sm leading-relaxed whitespace-pre-wrap", className)}>{children}</div>;
}
export const SectionTitle = ({ children, className }) => <h3 className={cn("text-sm font-medium text-muted-foreground mt-6 mb-2.5 first:mt-0", className)}>{children}</h3>;
