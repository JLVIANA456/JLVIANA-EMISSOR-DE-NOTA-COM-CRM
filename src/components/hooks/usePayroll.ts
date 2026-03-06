import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PayrollSheet {
  id: string;
  user_id: string;
  month: number;
  year: number;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  paid_at: string | null;
  total_value: number;
  notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollItem {
  id: string;
  payroll_id: string;
  person_id: string;
  user_id: string;
  base_value: number;
  adjustments: number;
  adjustment_reason: string | null;
  reimbursements: number;
  bonus: number;
  bonus_reason: string | null;
  debit_note: boolean;
  debit_note_reason: string | null;
  nf_status: string;
  nf_url: string | null;
  total_value: number;
  holerite_emitido: boolean;
  created_at: string;
}

export interface PayrollStatusHistory {
  id: string;
  payroll_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string;
  justification: string | null;
  created_at: string;
}

export interface NfValidation {
  id: string;
  payroll_item_id: string;
  user_id: string;
  file_url: string | null;
  extracted_cnpj: string | null;
  extracted_value: number | null;
  extracted_date: string | null;
  expected_value: number | null;
  validation_status: string;
  validation_notes: string | null;
  created_at: string;
}

export function usePayroll() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const userId = session?.user?.id;

  const { data: sheets = [], isLoading: loadingSheets } = useQuery({
    queryKey: ["payroll-sheets", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll_sheets")
        .select("*")
        .order("year", { ascending: false })
        .order("month", { ascending: false });
      if (error) throw error;
      return data as PayrollSheet[];
    },
    enabled: !!userId,
  });

  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ["payroll-items", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll_items")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return data as PayrollItem[];
    },
    enabled: !!userId,
  });

  const { data: statusHistory = [] } = useQuery({
    queryKey: ["payroll-status-history", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll_status_history")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PayrollStatusHistory[];
    },
    enabled: !!userId,
  });

  const { data: nfValidations = [] } = useQuery({
    queryKey: ["payroll-nf-validations", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll_nf_validations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as NfValidation[];
    },
    enabled: !!userId,
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["payroll-sheets"] });
    qc.invalidateQueries({ queryKey: ["payroll-items"] });
    qc.invalidateQueries({ queryKey: ["payroll-status-history"] });
    qc.invalidateQueries({ queryKey: ["payroll-nf-validations"] });
  };

  const createSheet = useMutation({
    mutationFn: async (data: { month: number; year: number; items: Array<{ person_id: string; base_value: number; email?: string | null }> }) => {
      if (!userId) throw new Error("Not authenticated");

      // Check for existing sheet for this month
      const existing = sheets.find(s => s.month === data.month && s.year === data.year);

      // If individual mode (1 item) and sheet exists, add to it
      if (data.items.length === 1 && existing) {
        // Check if person already in sheet
        const existingItems = items.filter(i => i.payroll_id === existing.id);
        const alreadyIn = existingItems.find(i => i.person_id === data.items[0].person_id);
        if (alreadyIn) throw new Error("Este PJ já está incluído na folha deste mês.");

        // Fetch reimbursements for this person
        const reimbTotal = await fetchReimbursements(data.month, data.year, data.items);
        const item = data.items[0];
        const reimbValue = item.email ? (reimbTotal[item.email.toLowerCase()] || 0) : 0;
        const totalValue = item.base_value + reimbValue;

        const { error: itemError } = await supabase.from("payroll_items").insert({
          payroll_id: existing.id,
          person_id: item.person_id,
          user_id: userId,
          base_value: item.base_value,
          reimbursements: reimbValue,
          total_value: totalValue,
        } as any);
        if (itemError) throw itemError;

        // Update sheet total
        const newTotal = Number(existing.total_value) + totalValue;
        await supabase.from("payroll_sheets").update({ total_value: newTotal } as any).eq("id", existing.id);

        return { reimbursementCount: reimbValue > 0 ? 1 : 0, addedToExisting: true };
      }

      // General mode: don't allow duplicate
      if (existing) throw new Error(`Já existe uma folha para ${data.month}/${data.year}`);

      const reimbursementsByEmail = await fetchReimbursements(data.month, data.year, data.items);

      const itemsWithReimbursements = data.items.map(item => {
        const reimbursementTotal = item.email
          ? (reimbursementsByEmail[item.email.toLowerCase()] || 0)
          : 0;
        return {
          ...item,
          reimbursements: reimbursementTotal,
          total_value: item.base_value + reimbursementTotal,
        };
      });

      const total = itemsWithReimbursements.reduce((s, i) => s + i.total_value, 0);
      const { data: sheet, error } = await supabase
        .from("payroll_sheets")
        .insert({ user_id: userId, month: data.month, year: data.year, total_value: total } as any)
        .select()
        .single();
      if (error) throw error;

      const itemsToInsert = itemsWithReimbursements.map(item => ({
        payroll_id: (sheet as any).id,
        person_id: item.person_id,
        user_id: userId,
        base_value: item.base_value,
        reimbursements: item.reimbursements,
        total_value: item.total_value,
      }));
      const { error: itemsError } = await supabase.from("payroll_items").insert(itemsToInsert as any);
      if (itemsError) throw itemsError;

      await supabase.from("payroll_status_history").insert({
        payroll_id: (sheet as any).id,
        old_status: null,
        new_status: "rascunho",
        changed_by: userId,
      } as any);

      const reimbursementCount = Object.values(reimbursementsByEmail).filter(v => v > 0).length;
      return { reimbursementCount, addedToExisting: false };
    },
    onSuccess: (result) => {
      invalidateAll();
      if (result?.addedToExisting) {
        toast.success("PJ adicionado à folha existente!");
      } else if (result?.reimbursementCount && result.reimbursementCount > 0) {
        toast.success(`Folha criada! ${result.reimbursementCount} PJ(s) com reembolsos importados automaticamente.`);
      } else {
        toast.success("Folha criada!");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const addItemToSheet = useMutation({
    mutationFn: async ({ sheetId, person_id, base_value, email }: { sheetId: string; person_id: string; base_value: number; email?: string | null }) => {
      if (!userId) throw new Error("Not authenticated");
      const sheet = sheets.find(s => s.id === sheetId);
      if (!sheet) throw new Error("Folha não encontrada");

      const existingItems = items.filter(i => i.payroll_id === sheetId);
      if (existingItems.find(i => i.person_id === person_id)) {
        throw new Error("Este PJ já está na folha.");
      }

      const reimbTotal = await fetchReimbursements(sheet.month, sheet.year, [{ person_id, base_value, email }]);
      const reimbValue = email ? (reimbTotal[email.toLowerCase()] || 0) : 0;
      const totalValue = base_value + reimbValue;

      const { error } = await supabase.from("payroll_items").insert({
        payroll_id: sheetId,
        person_id,
        user_id: userId,
        base_value,
        reimbursements: reimbValue,
        total_value: totalValue,
      } as any);
      if (error) throw error;

      const newSheetTotal = Number(sheet.total_value) + totalValue;
      await supabase.from("payroll_sheets").update({ total_value: newSheetTotal } as any).eq("id", sheetId);
    },
    onSuccess: () => { invalidateAll(); toast.success("PJ adicionado à folha!"); },
    onError: (e) => toast.error(e.message),
  });

  const emitPayslip = useMutation({
    mutationFn: async ({ itemIds }: { itemIds: string[] }) => {
      if (!userId) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("payroll_items")
        .update({ holerite_emitido: true } as any)
        .in("id", itemIds);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success("Holerite(s) emitido(s)!"); },
    onError: (e) => toast.error(e.message),
  });

  const changeStatus = useMutation({
    mutationFn: async ({ id, newStatus, justification }: { id: string; newStatus: string; justification?: string }) => {
      if (!userId) throw new Error("Not authenticated");
      const sheet = sheets.find(s => s.id === id);
      if (!sheet) throw new Error("Folha não encontrada");

      const updates: any = { status: newStatus };
      if (newStatus === "aprovada") {
        updates.approved_at = new Date().toISOString();
        updates.approved_by = session?.user?.email || userId;
      }
      if (newStatus === "paga") updates.paid_at = new Date().toISOString();
      if (newStatus === "rascunho" && justification) updates.rejection_reason = justification;

      const { error } = await supabase.from("payroll_sheets").update(updates).eq("id", id);
      if (error) throw error;

      await supabase.from("payroll_status_history").insert({
        payroll_id: id,
        old_status: sheet.status,
        new_status: newStatus,
        changed_by: userId,
        justification,
      } as any);

      if (newStatus === "paga") {
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-payslip`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${currentSession?.access_token}`,
            },
            body: JSON.stringify({ payroll_id: id }),
          });
          const result = await res.json();
          if (res.ok && result.sent > 0) {
            toast.success(`${result.sent} holerite(s) enviado(s) por e-mail!`);
          }
          if (result.skipped > 0) {
            toast.info(`${result.skipped} PJ(s) sem e-mail cadastrado.`);
          }
          if (result.errors > 0) {
            toast.warning(`${result.errors} erro(s) no envio de holerites.`);
          }
        } catch (e) {
          console.error("Error sending payslips:", e);
          toast.warning("Folha paga, mas houve erro ao enviar holerites por e-mail.");
        }
      }
    },
    onSuccess: () => { invalidateAll(); toast.success("Status atualizado!"); },
    onError: (e) => toast.error(e.message),
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PayrollItem> & { id: string }) => {
      const total = (Number(updates.base_value) || 0) + (Number(updates.adjustments) || 0) + (Number(updates.reimbursements) || 0) + (Number(updates.bonus) || 0);
      const { error } = await supabase.from("payroll_items").update({ ...updates, total_value: total } as any).eq("id", id);
      if (error) throw error;

      if (updates.base_value !== undefined || updates.adjustments !== undefined || updates.reimbursements !== undefined || updates.bonus !== undefined) {
        const item = items.find(i => i.id === id);
        if (item) {
          const sheetItems = items.filter(i => i.payroll_id === item.payroll_id);
          const sheetTotal = sheetItems.reduce((sum, si) => {
            if (si.id === id) return sum + total;
            return sum + Number(si.total_value);
          }, 0);
          await supabase.from("payroll_sheets").update({ total_value: sheetTotal } as any).eq("id", item.payroll_id);
        }
      }
    },
    onSuccess: () => { invalidateAll(); },
    onError: () => toast.error("Erro ao atualizar item"),
  });

  const deleteSheet = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payroll_sheets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success("Folha removida!"); },
    onError: () => toast.error("Erro ao remover folha"),
  });

  const validateNf = useMutation({
    mutationFn: async ({ file, payrollItemId, expectedValue, expectedCnpj }: { file: File; payrollItemId: string; expectedValue: number; expectedCnpj?: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("payroll_item_id", payrollItemId);
      formData.append("expected_value", expectedValue.toString());
      if (expectedCnpj) formData.append("expected_cnpj", expectedCnpj);

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-nf`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentSession?.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Erro ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      invalidateAll();
      if (data.validation_status === "valida") {
        toast.success("NF validada com sucesso!");
      } else if (data.validation_status === "alerta") {
        toast.warning("NF validada com alertas: " + (data.notes?.join("; ") || ""));
      } else {
        toast.error("NF inválida: " + (data.notes?.join("; ") || "Verifique o arquivo"));
      }
    },
    onError: (e) => toast.error("Erro ao validar NF: " + e.message),
  });

  return {
    sheets,
    items,
    statusHistory,
    nfValidations,
    isLoading: loadingSheets || loadingItems,
    createSheet,
    changeStatus,
    updateItem,
    deleteSheet,
    validateNf,
    addItemToSheet,
    emitPayslip,
  };
}

// Helper to fetch reimbursements for a given period
async function fetchReimbursements(month: number, year: number, items: Array<{ person_id: string; base_value: number; email?: string | null }>) {
  const emails = items.map(i => i.email).filter(Boolean) as string[];
  const reimbursementsByEmail: Record<string, number> = {};

  if (emails.length > 0) {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`;

    const { data: reimbursements } = await supabase
      .from("reimbursement_requests")
      .select("requester_email, amount")
      .in("requester_email", emails)
      .in("status", ["aprovado", "programado"])
      .gte("expense_date", startDate)
      .lt("expense_date", endDate);

    if (reimbursements) {
      for (const r of reimbursements) {
        const email = (r as any).requester_email?.toLowerCase();
        if (email) {
          reimbursementsByEmail[email] = (reimbursementsByEmail[email] || 0) + Number((r as any).amount);
        }
      }
    }
  }

  return reimbursementsByEmail;
}
