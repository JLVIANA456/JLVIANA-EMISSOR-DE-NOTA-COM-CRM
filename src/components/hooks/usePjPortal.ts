import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/contexts/AuthContext";

export interface PjProfile {
  id: string;
  auth_user_id: string;
  person_id: string;
}

export interface PjPersonData {
  id: string;
  name: string;
  email: string | null;
  role: string;
  cnpj: string | null;
  phone: string | null;
  contract_type: string;
  base_salary: number;
  is_active: boolean;
  razao_social: string | null;
  nome_fantasia: string | null;
  address: string | null;
  tax_regime: string | null;
  admission_date: string | null;
}

export function usePjPortal() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["pj-portal-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pj_portal_profiles" as any)
        .select("*")
        .eq("auth_user_id", userId)
        .single();
      if (error) throw error;
      return data as unknown as PjProfile;
    },
    enabled: !!userId,
  });

  const personId = profile?.person_id;

  const { data: person, isLoading: loadingPerson } = useQuery({
    queryKey: ["pj-portal-person", personId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("people")
        .select("id, name, email, role, cnpj, phone, contract_type, base_salary, is_active, razao_social, nome_fantasia, address, tax_regime, admission_date")
        .eq("id", personId!)
        .single();
      if (error) throw error;
      return data as PjPersonData;
    },
    enabled: !!personId,
  });

  const { data: payrollItems = [], isLoading: loadingPayroll } = useQuery({
    queryKey: ["pj-portal-payroll", personId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll_items")
        .select("*, payroll_sheets!payroll_items_payroll_id_fkey(month, year, status, paid_at)")
        .eq("person_id", personId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!personId,
  });

  const { data: reimbursements = [], isLoading: loadingReimbursements } = useQuery({
    queryKey: ["pj-portal-reimbursements", person?.email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reimbursement_requests" as any)
        .select("*")
        .eq("requester_email", person!.email)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!person?.email,
  });

  const { data: absences = [], isLoading: loadingAbsences } = useQuery({
    queryKey: ["pj-portal-absences", personId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pj_absences")
        .select("*")
        .eq("person_id", personId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!personId,
  });

  const { data: contracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: ["pj-portal-contracts", personId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pj_contracts")
        .select("*")
        .eq("person_id", personId!)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!personId,
  });

  return {
    profile,
    person,
    payrollItems,
    reimbursements,
    absences,
    contracts,
    isLoading: loadingProfile || loadingPerson || loadingPayroll || loadingReimbursements || loadingAbsences || loadingContracts,
    personId,
  };
}
