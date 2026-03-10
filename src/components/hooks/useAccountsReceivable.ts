import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClient } from '@/components/contexts/ClientContext';
import { useAuth } from '@/components/contexts/AuthContext';
import { toast } from 'sonner';

export const useAccountsReceivable = () => {
    const { selectedClient } = useClient();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [records, setRecords] = useState<any[]>([]);

    const fetchRecords = useCallback(async () => {
        if (!selectedClient) {
            setRecords([]);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('ar_bills')
                .select(`
                    *,
                    clientes_sacados (nome),
                    ar_installments (*)
                `)
                .eq('empresa_id', selectedClient.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRecords(data || []);
        } catch (error: any) {
            console.error('Error fetching AR records:', error.message);
            // Don't toast if table doesn't exist yet, just log
            if (!error.message.includes('relation "public.ar_bills" does not exist')) {
                toast.error('Erro ao carregar contas a receber');
            }
        } finally {
            setLoading(false);
        }
    }, [selectedClient]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const createRecord = async (data: any, installments: any[]) => {
        if (!selectedClient) {
            toast.error('Selecione um cliente primeiro');
            return;
        }

        setLoading(true);
        try {
            const { data: bill, error: billError } = await (supabase as any)
                .from('ar_bills')
                .insert([{
                    ...data,
                    tenant_id: user?.id,
                    empresa_id: selectedClient.id,
                    status: 'pendente'
                }])
                .select()
                .single();

            if (billError) throw billError;

            const installmentsToInsert = installments.map(inst => ({
                ...inst,
                ar_bill_id: bill.id,
                tenant_id: user?.id,
                empresa_id: selectedClient.id
            }));

            const { error: instError } = await (supabase as any)
                .from('ar_installments')
                .insert(installmentsToInsert);

            if (instError) throw instError;

            toast.success('Receita criada com sucesso!');
            await fetchRecords();
            return bill;
        } catch (error: any) {
            console.error('Error creating AR record:', error.message);
            toast.error('Erro ao criar receita');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateRecordStatus = async (id: string, status: string) => {
        setLoading(true);
        try {
            const { error } = await (supabase as any)
                .from('ar_bills')
                .update({ status })
                .eq('id', id);

            if (error) throw error;
            toast.success(`Status atualizado para ${status}`);
            await fetchRecords();
        } catch (error: any) {
            console.error('Error updating AR status:', error.message);
            toast.error('Erro ao atualizar status');
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        records,
        fetchRecords,
        createRecord,
        updateRecordStatus,
        selectedClient
    };
};
