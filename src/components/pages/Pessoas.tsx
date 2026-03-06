import { Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { usePeople } from "@/hooks/usePeople";
import { useContracts } from "@/hooks/useContracts";
import { useAbsences } from "@/hooks/useAbsences";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePayroll } from "@/hooks/usePayroll";
import { PeopleSummaryCards } from "@/components/pessoas/PeopleSummaryCards";
import { PeopleTable } from "@/components/pessoas/PeopleTable";

import { PeopleAlerts } from "@/components/pessoas/PeopleAlerts";
import { PeopleImpactChart } from "@/components/pessoas/PeopleImpactChart";
import { PersonFormDialog } from "@/components/pessoas/PersonFormDialog";
import { SalaryFormDialog } from "@/components/pessoas/SalaryFormDialog";
import { CommissionFormDialog } from "@/components/pessoas/CommissionFormDialog";
import { ContractsTab } from "@/components/pessoas/ContractsTab";
import { AbsencesTab } from "@/components/pessoas/AbsencesTab";
import { DPDashboardTab } from "@/components/pessoas/DPDashboardTab";
import { CreatePjAccessDialog } from "@/components/pessoas/CreatePjAccessDialog";
import { CreateBulkPjAccessDialog } from "@/components/pessoas/CreateBulkPjAccessDialog";
import { SalaryAdjustmentsTab } from "@/components/pessoas/SalaryAdjustmentsTab";
import { useUserRole } from "@/hooks/useUserRole";

const Pessoas = () => {
  const {
    people, salaryHistory, commissions, salaryAdjustments, activePeople, totalMonthlySalary,
    alerts, isLoading,
    addPerson, updatePerson, deletePerson,
    addSalary, updateSalary, deleteSalary,
    addCommission, updateCommission, deleteCommission,
    addSalaryAdjustment,
  } = usePeople();

  const { contracts, addContract, updateContract, deleteContract } = useContracts();
  const { isAdmin } = useUserRole();
  const { absences, addAbsence, updateAbsence, deleteAbsence, pendingCount } = useAbsences();
  const { sheets, items: payrollItems } = usePayroll();
  const { session } = useAuth();

  // Query main contracts table for aditivos linked to salary adjustments
  const { data: aditivoContracts = [] } = useQuery({
    queryKey: ["aditivo-contracts", session?.user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("id, salary_adjustment_id")
        .eq("contract_type", "aditivo_contratual")
        .not("salary_adjustment_id", "is", null);
      if (error) throw error;
      return data as { id: string; salary_adjustment_id: string | null }[];
    },
    enabled: !!session?.user?.id,
  });

  const inactivePeople = people.filter((p) => p.status !== "ativo");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-light tracking-tight">Pessoas & DP</h1>
            <p className="text-sm text-muted-foreground">Gestão de colaboradores, contratos, ausências e departamento pessoal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && <CreateBulkPjAccessDialog people={people} />}
          {isAdmin && <CreatePjAccessDialog people={people} />}
          <SalaryFormDialog people={people} onSubmit={(s) => addSalary.mutate(s)} />
          <CommissionFormDialog people={people} onSubmit={(c) => addCommission.mutate(c)} />
          <PersonFormDialog onSubmit={(p) => addPerson.mutate(p)} />
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
          <p>Carregando dados...</p>
        </div>
      ) : people.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-light">Nenhum colaborador cadastrado</p>
          <p className="text-sm mt-1">Clique em "Adicionar Colaborador" para começar.</p>
        </div>
      ) : (
        <>
          <PeopleSummaryCards
            totalPeople={people.length}
            activePeople={activePeople.length}
            inactivePeople={inactivePeople.length}
            totalMonthly={totalMonthlySalary}
            totalAnnual={totalMonthlySalary * 12}
          />

          <Tabs defaultValue="tabela" className="space-y-4">
            <TabsList className="flex-wrap">
              <TabsTrigger value="tabela">Colaboradores</TabsTrigger>
              <TabsTrigger value="contratos">Contratos</TabsTrigger>
              <TabsTrigger value="ausencias" className="flex items-center gap-1.5">
                Ausências
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 text-[10px] px-1">{pendingCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="dashboard-dp">Dashboard DP</TabsTrigger>
              <TabsTrigger value="reajustes">Reajustes</TabsTrigger>
              <TabsTrigger value="impacto">Análise de Impacto</TabsTrigger>
              <TabsTrigger value="alertas">Alertas</TabsTrigger>
            </TabsList>

            <TabsContent value="tabela">
              <PeopleTable
                people={people}
                salaryHistory={salaryHistory}
                commissions={commissions}
                totalMonthlySalary={totalMonthlySalary}
                onUpdate={(data) => updatePerson.mutate(data)}
                onDelete={(id) => deletePerson.mutate(id)}
                onUpdateCommission={(data) => updateCommission.mutate(data)}
                onDeleteCommission={(id) => deleteCommission.mutate(id)}
                onAddCommission={(c) => addCommission.mutate(c)}
                onUpdateSalary={(data) => updateSalary.mutate(data)}
                onDeleteSalary={(id) => deleteSalary.mutate(id)}
                salaryAdjustments={salaryAdjustments}
                onSalaryAdjustment={(adj) => addSalaryAdjustment.mutate(adj)}
                payrollSheets={sheets}
                payrollItems={payrollItems}
              />
            </TabsContent>

            <TabsContent value="contratos">
              <ContractsTab
                contracts={contracts}
                people={people}
                onAdd={(c) => addContract.mutate(c)}
                onUpdate={(c) => updateContract.mutate(c)}
                onDelete={(id) => deleteContract.mutate(id)}
              />
            </TabsContent>

            <TabsContent value="ausencias">
              <AbsencesTab
                absences={absences}
                people={people}
                onAdd={(a) => addAbsence.mutate(a)}
                onUpdate={(a) => updateAbsence.mutate(a)}
                onDelete={(id) => deleteAbsence.mutate(id)}
              />
            </TabsContent>

            <TabsContent value="dashboard-dp">
              <DPDashboardTab
                people={people}
                contracts={contracts}
                absences={absences}
                sheets={sheets}
                totalMonthlySalary={totalMonthlySalary}
              />
            </TabsContent>

            <TabsContent value="reajustes">
              <SalaryAdjustmentsTab
                adjustments={salaryAdjustments}
                people={people}
                contracts={aditivoContracts}
                onAddAdjustment={(adj) => addSalaryAdjustment.mutate(adj)}
              />
            </TabsContent>

            <TabsContent value="impacto">
              <PeopleImpactChart people={activePeople} totalMonthly={totalMonthlySalary} />
            </TabsContent>

            <TabsContent value="alertas">
              <PeopleAlerts alerts={alerts} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default Pessoas;



