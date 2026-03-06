import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { APBill, APInstallment, BillStatus } from '@/types/accountsPayable';
import { toast } from 'sonner';
import { useClient } from '@/components/contexts/ClientContext';
import { useAuth } from '@/components/contexts/AuthContext';

export const useAccountsPayable = () => {
    const { selectedClient } = useClient();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [bills, setBills] = useState<any[]>([]);

    const fetchBills = useCallback(async () => {
        if (!selectedClient) {
            setBills([]);
            return;
        }

        setLoading(true);
        try {
            let query = (supabase as any)
                .from('ap_bills')
                .select(`
          *,
          fornecedores (nome),
          ap_installments (*)
        `)
                .eq('empresa_id', selectedClient.id)
                .order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;
            setBills(data || []);
        } catch (error: any) {
            console.error('Error fetching bills:', error.message);
            toast.error('Erro ao carregar contas a pagar');
        } finally {
            setLoading(false);
        }
    }, [selectedClient]);

    useEffect(() => {
        fetchBills();
    }, [fetchBills]);

    const createBill = async (billData: Partial<APBill>, installments: Partial<APInstallment>[]) => {
        if (!selectedClient) {
            toast.error('Selecione um cliente primeiro');
            return;
        }

        setLoading(true);
        try {
            // 1. Create the Bill Header
            const { data: bill, error: billError } = await (supabase as any)
                .from('ap_bills')
                .insert([{
                    ...billData,
                    tenant_id: user?.id,
                    empresa_id: selectedClient.id,
                    status: 'rascunho'
                }])
                .select()
                .single();

            if (billError) throw billError;

            // 2. Create the installments
            const installmentsToInsert = installments.map(inst => ({
                ...inst,
                ap_bill_id: bill.id,
                tenant_id: user?.id,
                empresa_id: selectedClient.id
            }));

            const { error: instError } = await (supabase as any)
                .from('ap_installments')
                .insert(installmentsToInsert);

            if (instError) throw instError;

            toast.success('Lançamento criado com sucesso!');
            await fetchBills();
            return bill;
        } catch (error: any) {
            console.error('Error creating bill:', error.message);
            toast.error('Erro ao criar lançamento');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateBillStatus = async (billId: string, status: BillStatus) => {
        try {
            const { error } = await (supabase as any)
                .from('ap_bills')
                .update({ status })
                .eq('id', billId);

            if (error) throw error;

            toast.success(`Status atualizado para ${status}`);
            await fetchBills();
        } catch (error: any) {
            console.error('Error updating status:', error.message);
            toast.error('Erro ao atualizar status');
        }
    };

    return {
        loading,
        bills,
        fetchBills,
        createBill,
        updateBillStatus,
        selectedClient
    };
};
