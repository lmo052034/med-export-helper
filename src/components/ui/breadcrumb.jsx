import { Slot } from "radix-ui";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const Breadcrumb = (props) => <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
const BreadcrumbList = ({ className, ...props }) => <ol data-slot="breadcrumb-list" className={cn("text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5", className)} {...props} />;
const BreadcrumbItem = ({ className, ...props }) => <li data-slot="breadcrumb-item" className={cn("inline-flex items-center gap-1.5", className)} {...props} />;
function BreadcrumbLink({ asChild, className, ...props }) {
  const Comp = asChild ? Slot.Root : "a";
  return <Comp data-slot="breadcrumb-link" className={cn("hover:text-foreground transition-colors", className)} {...props} />;
}
const BreadcrumbPage = ({ className, ...props }) => <span data-slot="breadcrumb-page" role="link" aria-disabled="true" aria-current="page" className={cn("text-foreground font-normal", className)} {...props} />;
const BreadcrumbSeparator = ({ children, className, ...props }) => (
  <li data-slot="breadcrumb-separator" role="presentation" aria-hidden="true" className={cn("[&>svg]:size-3.5", className)} {...props}>{children ?? <ChevronRight />}</li>
);

export { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator };
