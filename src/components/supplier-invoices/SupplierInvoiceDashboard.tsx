import { Clock, CalendarDays, CalendarRange, AlertTriangle, CheckCircle2, DollarSign, XCircle, Inbox } from "lucide-react";
import { SupplierInvoice } from "@/types/supplier-invoice";

interface Props {
  invoices: SupplierInvoice[];
}

export function SupplierInvoiceDashboard({ invoices }: Props) {
  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  const endOf2Weeks = new Date(now);
  endOf2Weeks.setDate(endOf2Weeks.getDate() + 14);
  const endOfMonth = new Date(now);
  endOfMonth.setDate(endOfMonth.getDate() + 30);

  const unpaidStatuses = ['recebida', 'aguardando_aprovacao', 'aprovada'] as const;

  const overdue = invoices.filter(i =>
    unpaidStatuses.includes(i.status as any) && new Date(i.due_date) < now
  );
  const dueThisWeek = invoices.filter(i =>
    unpaidStatuses.includes(i.status as any) &&
    new Date(i.due_date) >= now && new Date(i.due_date) <= endOfWeek
  );
  const due2Weeks = invoices.filter(i =>
    unpaidStatuses.includes(i.status as any) &&
    new Date(i.due_date) >= now && new Date(i.due_date) <= endOf2Weeks
  );
  const dueMonth = invoices.filter(i =>
    unpaidStatuses.includes(i.status as any) &&
    new Date(i.due_date) >= now && new Date(i.due_date) <= endOfMonth
  );
  const paid = invoices.filter(i => i.status === 'paga');
  const contested = invoices.filter(i => i.status === 'contestada');
  const pending = invoices.filter(i => i.status === 'aguardando_aprovacao');
  const total = invoices;

  const sumValue = (arr: SupplierInvoice[]) =>
    arr.reduce((s, r) => s + Number(r.gross_value), 0);

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const cards = [
    {
      label: 'Vencidas',
      value: fmt(sumValue(overdue)),
      count: overdue.length,
      icon: AlertTriangle,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    },
    {
      label: 'Vencendo esta semana',
      value: fmt(sumValue(dueThisWeek)),
      count: dueThisWeek.length,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
    {
      label: 'Próximas 2 semanas',
      value: fmt(sumValue(due2Weeks)),
      count: due2Weeks.length,
      icon: CalendarDays,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Próximo mês',
      value: fmt(sumValue(dueMonth)),
      count: dueMonth.length,
      icon: CalendarRange,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Aguardando Aprovação',
      value: String(pending.length),
      count: pending.length,
      icon: Inbox,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
    },
    {
      label: 'Pagas',
      value: fmt(sumValue(paid)),
      count: paid.length,
      icon: CheckCircle2,
      color: 'text-primary',
      bg: 'bg-secondary',
    },
    {
      label: 'Contestadas',
      value: String(contested.length),
      count: contested.length,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
    {
      label: 'Total de Notas',
      value: fmt(sumValue(total)),
      count: total.length,
      icon: DollarSign,
      color: 'text-foreground',
      bg: 'bg-muted',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className={`h-11 w-11 rounded-xl ${c.bg} flex items-center justify-center`}>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </div>
            <span className="text-xs font-light text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {c.count} nota(s)
            </span>
          </div>
          <p className="text-2xl font-light tracking-tight mb-0.5">{c.value}</p>
          <p className="text-sm text-muted-foreground">{c.label}</p>
        </div>
      ))}
    </div>
  );
}



