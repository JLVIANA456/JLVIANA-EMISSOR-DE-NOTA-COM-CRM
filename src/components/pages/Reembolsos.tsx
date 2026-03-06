import { Receipt, DollarSign, Clock, CheckCircle2, CreditCard, TrendingDown, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useReimbursements } from "@/hooks/useReimbursements";
import { ReimbursementDashboard } from "@/components/reembolsos/ReimbursementDashboard";
import { ReimbursementPolicies } from "@/components/reembolsos/ReimbursementPolicies";

function fmt(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const Reembolsos = () => {
  const {
    totalSolicitado,
    totalAprovado,
    totalPendente,
    totalPago,
    totalProjetado,
    selectedClient
  } = useReimbursements();

  if (!selectedClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
          <Receipt className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-light tracking-tight">Selecione um Cliente BPO</h2>
          <p className="text-sm text-muted-foreground font-light max-w-xs mx-auto">
            Para gerenciar reembolsos, selecione um cliente BPO no cabeçalho.
          </p>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: "Total Solicitado", value: fmt(totalSolicitado), icon: DollarSign },
    { label: "Total Aprovado", value: fmt(totalAprovado), icon: CheckCircle2 },
    { label: "Total Pendente", value: fmt(totalPendente), icon: Clock },
    { label: "Total Pago", value: fmt(totalPago), icon: CreditCard },
    { label: "Projetado a Pagar", value: fmt(totalProjetado), icon: TrendingDown },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-light tracking-tight">Reembolsos Corporativos</h1>
            <p className="text-sm text-muted-foreground">Gerencie solicitações de reembolso com fluxo de aprovação integrado</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            const url = `${window.location.origin}/solicitar-reembolso`;
            navigator.clipboard.writeText(url);
            toast.success("Link copiado para a área de transferência!");
          }}
        >
          <Link2 className="h-4 w-4" />
          Copiar Link do Formulário
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                  <kpi.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-lg font-light">{kpi.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="solicitacoes">Solicitações</TabsTrigger>
          <TabsTrigger value="politicas">Políticas</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <ReimbursementDashboard />
        </TabsContent>

        <TabsContent value="solicitacoes">
          <ReimbursementDashboard />
        </TabsContent>

        <TabsContent value="politicas">
          <ReimbursementPolicies />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reembolsos;



