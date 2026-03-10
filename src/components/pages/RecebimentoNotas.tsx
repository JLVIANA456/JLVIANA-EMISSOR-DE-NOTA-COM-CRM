import { useState, useEffect, useCallback } from "react";
import { Receipt, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupplierInvoiceDashboard } from "@/components/supplier-invoices/SupplierInvoiceDashboard";
import { SupplierInvoiceList } from "@/components/supplier-invoices/SupplierInvoiceList";
import { SupplierInvoiceFormDialog } from "@/components/supplier-invoices/SupplierInvoiceFormDialog";
import { ShareLinkGenerator } from "@/components/supplier-invoices/ShareLinkGenerator";
import { supabase } from "@/integrations/supabase/client";
import { SupplierInvoice } from "@/types/supplier-invoice";

const RecebimentoNotas = () => {
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('supplier_invoices' as any)
      .select('*')
      .order('due_date', { ascending: true });

    if (!error && data) {
      setInvoices(data as unknown as SupplierInvoice[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-light tracking-tight">Recebimento de Notas e Contas por Pagar</h1>
            <p className="text-sm text-muted-foreground">
              Centralize, gerencie e acompanhe notas fiscais de fornecedores e contas por pagar
            </p>
          </div>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Nota
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="list">Notas</TabsTrigger>
          <TabsTrigger value="link">Link Compartilhado</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <SupplierInvoiceDashboard invoices={invoices} />
        </TabsContent>

        <TabsContent value="list">
          <SupplierInvoiceList invoices={invoices} onRefresh={fetchInvoices} />
        </TabsContent>

        <TabsContent value="link">
          <ShareLinkGenerator />
        </TabsContent>
      </Tabs>

      <SupplierInvoiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onCreated={fetchInvoices}
      />
    </div>
  );
};

export default RecebimentoNotas;



