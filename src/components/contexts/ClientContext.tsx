import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/components/integrations/supabase/client';

interface Client {
    id: string;
    razao_social: string;
    nome_fantasia: string;
    cnpj: string;
    municipio?: string;
    uf?: string;
    email?: string;
    telefone?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cep?: string;
    inscricao_estadual?: string;
    inscricao_municipal?: string;
    natureza_juridica?: string;
    cnae_principal?: string;
    regime_tributario?: string;
    status_bpo?: string;
    tenant_id?: string;
}

interface ClientContextType {
    selectedClient: Client | null;
    setSelectedClient: (client: Client | null) => void;
    clients: Client[];
    loading: boolean;
    refreshClients: () => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedClient, setSelectedClientState] = useState<Client | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshClients = async () => {
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('empresas_bpo')
                .select('*')
                .eq('ativo', true);

            if (error) throw error;
            setClients(data || []);

            // Auto-select first client if none selected and we have clients
            const savedClientId = localStorage.getItem('selected_bpo_client_id');
            if (savedClientId) {
                const found = data?.find(c => c.id === savedClientId);
                if (found) {
                    setSelectedClientState(found);
                } else if (data && data.length > 0) {
                    setSelectedClientState(data[0]);
                }
            } else if (data && data.length > 0) {
                setSelectedClientState(data[0]);
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const setSelectedClient = (client: Client | null) => {
        setSelectedClientState(client);
        if (client) {
            localStorage.setItem('selected_bpo_client_id', client.id);
        } else {
            localStorage.removeItem('selected_bpo_client_id');
        }
    };

    useEffect(() => {
        refreshClients();
    }, []);

    return (
        <ClientContext.Provider value={{ selectedClient, setSelectedClient, clients, loading, refreshClients }}>
            {children}
        </ClientContext.Provider>
    );
};

export const useClient = () => {
    const context = useContext(ClientContext);
    if (context === undefined) {
        throw new Error('useClient must be used within a ClientProvider');
    }
    return context;
};
