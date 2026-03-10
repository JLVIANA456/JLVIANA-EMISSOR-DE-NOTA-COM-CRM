import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/contexts/AuthContext";
import { useClient } from "@/components/contexts/ClientContext";
import { toast } from "sonner";

export interface ReimbursementRequest {
  id: string;
  empresa_id: string;
  protocol_number: string;
  requester_name: string;
  requester_email: string;
  department: string;
  role_title: string;
  expense_date: string;
  category: string;
  description: string;
  amount: number;
  payment_method: string;
  bank_name: string | null;
  agency: string | null;
  account_number: string | null;
  cpf_holder: string | null;
  pix_key: string | null;
  receipt_url: string | null;
  status: string;
  approver_name: string | null;
  approval_notes: string | null;
  rejection_reason: string | null;
  scheduled_payment_date: string | null;
  paid_at: string | null;
  paid_by: string | null;
  cost_center: string;
  created_at: string;
  updated_at: string;
}

export interface ReimbursementStatusHistory {
  id: string;
  reimbursement_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string;
  justification: string | null;
  created_at: string;
}

export const REIMBURSEMENT_CATEGORIES = [
  { group: "Viagens Corporativas", items: ["Passagens Aéreas", "Passagens Rodoviárias", "Hospedagem", "Aluguel de Veículos", "Táxi/App de Transporte"] },
  { group: "Alimentação", items: ["Almoço", "Jantar", "Lanches"] },
  { group: "Transporte", items: ["Reembolso por KM (veículo próprio)", "Combustível", "Estacionamento"] },
  { group: "Capacitação", items: ["Cursos", "Treinamentos", "Workshops", "Conferências", "Inscrições em Eventos"] },
  { group: "Home Office", items: ["Internet", "Energia Elétrica", "Material de Escritório"] },
  { group: "Saúde e Bem-estar", items: ["Consultas", "Exames", "Medicamentos"] },
  { group: "Outras Despesas", items: ["Outras Despesas"] },
];

export const DEPARTMENTS = [
  "Financeiro Admin",
  "Comercial",
  "Marketing",
  "Operações",
  "RH as a Service",
  "TI",
  "Consultor Externo",
  "Workshops e Treinamentos",
  "Consultoria Interna",
  "Outros",
];

export const STATUS_LABELS: Record<string, string> = {
  aguardando_aprovacao: "Aguardando Aprovação",
  aprovado: "Aprovado",
  recusado: "Recusado",
  programado: "Programado",
  pago: "Pago",
};

export const STATUS_COLORS: Record<string, string> = {
  aguardando_aprovacao: "bg-yellow-100 text-yellow-800",
  aprovado: "bg-green-100 text-green-800",
  recusado: "bg-red-100 text-red-800",
  programado: "bg-blue-100 text-blue-800",
  pago: "bg-emerald-100 text-emerald-800",
};

export function useReimbursements() {
  const { session } = useAuth();
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["reimbursement-requests", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await supabase
        .from("reimbursement_requests" as any)
        .select("*")
        .eq("empresa_id", selectedClient.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ReimbursementRequest[];
    },
    enabled: !!session && !!selectedClient,
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      newStatus,
      justification,
      scheduledDate,
    }: {
      id: string;
      newStatus: string;
      justification?: string;
      scheduledDate?: string;
    }) => {
      const request = requests.find((r) => r.id === id);
      if (!request) throw new Error("Request not found");

      const updateData: any = { status: newStatus };
      if (newStatus === "programado" && scheduledDate) {
        updateData.scheduled_payment_date = scheduledDate;
      }
      if (newStatus === "pago") {
        updateData.paid_at = new Date().toISOString();
        updateData.paid_by = session?.user?.email || "Sistema";
      }
      if (newStatus === "recusado" && justification) {
        updateData.rejection_reason = justification;
      }
      if (justification) {
        updateData.approval_notes = justification;
      }

      const { error: updateError } = await supabase
        .from("reimbursement_requests" as any)
        .update(updateData)
        .eq("id", id);
      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from("reimbursement_status_history" as any)
        .insert({
          reimbursement_id: id,
          old_status: request.status,
          new_status: newStatus,
          changed_by: session?.user?.email || "Sistema",
          justification,
        });
      if (historyError) throw historyError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reimbursement-requests"] });
      toast.success("Status atualizado com sucesso!");
    },
    onError: (err) => {
      toast.error("Erro ao atualizar status: " + String(err));
    },
  });

  const fetchHistory = async (reimbursementId: string) => {
    const { data, error } = await supabase
      .from("reimbursement_status_history" as any)
      .select("*")
      .eq("reimbursement_id", reimbursementId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data as unknown as ReimbursementStatusHistory[];
  };

  // Computed
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthRequests = requests.filter((r) => {
    const d = new Date(r.created_at);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });

  const totalSolicitado = monthRequests.reduce((s, r) => s + Number(r.amount), 0);
  const totalAprovado = monthRequests.filter((r) => ["aprovado", "programado", "pago"].includes(r.status)).reduce((s, r) => s + Number(r.amount), 0);
  const totalPendente = monthRequests.filter((r) => r.status === "aguardando_aprovacao").reduce((s, r) => s + Number(r.amount), 0);
  const totalPago = monthRequests.filter((r) => r.status === "pago").reduce((s, r) => s + Number(r.amount), 0);
  const totalProjetado = monthRequests.filter((r) => r.status === "programado").reduce((s, r) => s + Number(r.amount), 0);

  return {
    requests,
    isLoading: isLoading && !!selectedClient,
    updateStatus,
    fetchHistory,
    totalSolicitado,
    totalAprovado,
    totalPendente,
    totalPago,
    totalProjetado,
    monthRequests,
    selectedClient
  };
}
