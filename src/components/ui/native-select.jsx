import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function NativeSelect({ className, ...props }) {
  return (
    <div className="group/native-select relative w-full has-[select:disabled]:opacity-50" data-slot="native-select-wrapper">
      <select
        data-slot="native-select"
        className={cn(
          "border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground h-9 w-full min-w-0 appearance-none rounded-md border bg-transparent px-3 py-2 pr-9 text-sm shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          className
        )}
        {...props}
      />
      <ChevronDownIcon className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 opacity-50 select-none" aria-hidden="true" />
    </div>
  );
}

export { NativeSelect };
