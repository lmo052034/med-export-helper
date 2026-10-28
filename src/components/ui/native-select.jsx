import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function NativeSelect({ className, ...props }) {
  return (
    <div className="group/native-select relative w-full has-[select:disabled]:opacity-50" data-slot="native-select-wrapper">
      <select
        data-slot="native-select"
        className={cn(
          "h-11 w-full min-w-0 appearance-none rounded-xl px-3.5 py-2 pr-9 text-base md:text-[15px] bg-input border-0 placeholder:text-[rgba(60,60,67,0.3)] focus-visible:bg-card focus-visible:ring-primary/35 focus-visible:ring-[3px] transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed",
          
          className
        )}
        {...props}
      />
      <ChevronDownIcon className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 opacity-50 select-none" aria-hidden="true" />
    </div>
  );
}

export { NativeSelect };
