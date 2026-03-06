import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SupplierInvoice, supplierInvoiceStatusLabels, supplierInvoiceStatusColors, SupplierInvoiceStatus } from "@/types/supplier-invoice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Search, Filter } from "lucide-react";

interface Props {
  invoices: SupplierInvoice[];
  onRefresh: () => void;
}

const statusFlow: Record<string, SupplierInvoiceStatus[]> = {
  recebida: ['aguardando_aprovacao', 'contestada'],
  aguardando_aprovacao: ['aprovada', 'contestada'],
  aprovada: ['paga', 'contestada'],
  paga: [],
  contestada: ['recebida'],
};

export function SupplierInvoiceList({ invoices, onRefresh }: Props) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = invoices.filter(inv => {
    const matchesSearch = inv.supplier_name.toLowerCase().includes(search.toLowerCase()) ||
      inv.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (invoice: SupplierInvoice, newStatus: SupplierInvoiceStatus) => {
    if (!user) return;

    const updates: Record<string, any> = { status: newStatus };
    if (newStatus === 'paga') updates.paid_at = new Date().toISOString();
    if (newStatus === 'aprovada') updates.approved_at = new Date().toISOString();
    if (newStatus === 'contestada') updates.contested_at = new Date().toISOString();

    const { error } = await supabase
      .from('supplier_invoices' as any)
      .update(updates)
      .eq('id', invoice.id);

    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }

    // Record history
    await supabase.from('supplier_invoice_status_history' as any).insert({
      supplier_invoice_id: invoice.id,
      old_status: invoice.status,
      new_status: newStatus,
      changed_by: user.id,
    });

    toast.success(`Status alterado para "${supplierInvoiceStatusLabels[newStatus]}"`);
    onRefresh();
  };

  const getDueDateBadge = (dueDate: string, status: string) => {
    if (status === 'paga') return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diff = differenceInDays(due, now);

    if (diff < 0) {
      return <Badge variant="destructive" className="text-[10px]">{Math.abs(diff)}d atrasada</Badge>;
    }
    if (diff === 0) {
      return <Badge variant="destructive" className="text-[10px]">Vence hoje</Badge>;
    }
    if (diff <= 7) {
      return <Badge className="bg-amber-100 text-amber-700 text-[10px]">{diff}d restantes</Badge>;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por fornecedor ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(supplierInvoiceStatusLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Via</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhuma nota encontrada
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((inv) => {
                const statusColor = supplierInvoiceStatusColors[inv.status];
                const nextStatuses = statusFlow[inv.status] || [];
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-light">{inv.supplier_name}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{inv.description}</TableCell>
                    <TableCell className="text-right font-light">
                      R$ {Number(inv.gross_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{format(new Date(inv.due_date), 'dd/MM/yyyy')}</span>
                        {getDueDateBadge(inv.due_date, inv.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-light px-2 py-1 rounded-full ${statusColor.bg} ${statusColor.text}`}>
                        {supplierInvoiceStatusLabels[inv.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {inv.submitted_via === 'link_compartilhado' ? 'Link' : 'Manual'}
                    </TableCell>
                    <TableCell>
                      {nextStatuses.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {nextStatuses.map((ns) => (
                            <Button
                              key={ns}
                              size="sm"
                              variant="outline"
                              className="text-[11px] h-7 px-2"
                              onClick={() => handleStatusChange(inv, ns)}
                            >
                              {supplierInvoiceStatusLabels[ns]}
                            </Button>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}



