import { cn } from "@/lib/utils";

function Textarea({ className, ...props }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-[rgba(60,60,67,0.3)] flex field-sizing-content min-h-16 w-full rounded-xl px-3.5 py-2.5 text-base bg-input border-0 placeholder:text-[rgba(60,60,67,0.3)] focus-visible:bg-card focus-visible:ring-primary/35 focus-visible:ring-[3px] transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-[15px] leading-relaxed",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
