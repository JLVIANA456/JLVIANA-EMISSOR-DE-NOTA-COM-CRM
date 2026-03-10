import { Check } from "lucide-react";
import { WORKFLOW_ORDER, STATUS_LABELS, InvoiceRequestStatus } from "@/types/invoice";
import { cn } from "@/lib/utils";

export function InvoiceWorkflow({ currentStatus }: { currentStatus: InvoiceRequestStatus }) {
  const currentIdx = WORKFLOW_ORDER.indexOf(currentStatus);
  const isCancelled = currentStatus === 'cancelada';

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {WORKFLOW_ORDER.map((step, idx) => {
        const isCompleted = !isCancelled && idx < currentIdx;
        const isCurrent = !isCancelled && idx === currentIdx;
        return (
          <div key={step} className="flex items-center gap-1 shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center text-xs font-light border-2 transition-all",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isCurrent && "border-primary bg-primary/10 text-primary",
                  !isCompleted && !isCurrent && "border-muted bg-muted/50 text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : idx + 1}
              </div>
              <span className={cn(
                "text-[9px] text-center max-w-[70px] leading-tight",
                isCurrent ? "font-light text-foreground" : "text-muted-foreground"
              )}>
                {STATUS_LABELS[step]}
              </span>
            </div>
            {idx < WORKFLOW_ORDER.length - 1 && (
              <div className={cn(
                "h-0.5 w-6 mt-[-16px]",
                isCompleted ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        );
      })}
      {isCancelled && (
        <div className="flex flex-col items-center gap-1 shrink-0 ml-2">
          <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-light border-2 border-destructive bg-destructive/10 text-destructive">
            ✕
          </div>
          <span className="text-[9px] font-light text-destructive">Cancelada</span>
        </div>
      )}
    </div>
  );
}



