import { cn } from "@/lib/utils";

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground h-11 w-full min-w-0 rounded-xl px-3.5 py-1 text-base bg-input border-0 placeholder:text-[rgba(60,60,67,0.3)] focus-visible:bg-card focus-visible:ring-primary/35 focus-visible:ring-[3px] transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-[15px]",
        
        className
      )}
      {...props}
    />
  );
}

export { Input };
