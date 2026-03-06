import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_COLORS, InvoiceRequestStatus } from "@/types/invoice";

export function InvoiceStatusBadge({ status }: { status: InvoiceRequestStatus }) {
  return (
    <Badge variant="secondary" className={`${STATUS_COLORS[status]} text-[11px] font-light`}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}



