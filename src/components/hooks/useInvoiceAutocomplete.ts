import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface InvoiceSuggestion {
  client_name: string;
  client_document: string;
  client_type: 'F' | 'J' | 'E';
  client_inscricao_municipal: string | null;
  client_email: string;
  client_address: string;
  client_address_number: string | null;
  client_address_complement: string | null;
  client_neighborhood: string | null;
  client_zip_code: string | null;
  client_city: string | null;
  client_state: string | null;
  client_phone: string | null;
  service_code: string | null;
  service_code_municipal: string | null;
  iss_aliq: number | null;
  revenue_type: string;
  description: string;
  payment_method: string;
  show_bank_details: boolean;
  count: number;
}

let cachedSuggestions: InvoiceSuggestion[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

export function useInvoiceAutocomplete() {
  const [suggestions, setSuggestions] = useState<InvoiceSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (Date.now() - cacheTimestamp > CACHE_TTL) {
      loadCache();
    }
  }, []);

  const loadCache = async () => {
    const { data } = await supabase
      .from("invoice_requests")
      .select(`
        client_name, client_document, client_type, client_inscricao_municipal, client_email, 
        client_address, client_address_number, client_address_complement, client_neighborhood, 
        client_zip_code, client_city, client_state, client_phone, 
        service_code, service_code_municipal, iss_aliq, 
        revenue_type, description, payment_method, show_bank_details, created_at
      `)
      .not("status", "eq", "cancelada")
      .order("created_at", { ascending: false })
      .limit(100);

    if (data) {
      const grouped = new Map<string, InvoiceSuggestion>();
      for (const row of data as any[]) {
        const key = row.client_name?.toLowerCase();
        if (!key) continue;
        const existing = grouped.get(key);
        if (existing) {
          existing.count++;
        } else {
          grouped.set(key, {
            client_name: row.client_name,
            client_document: row.client_document,
            client_type: row.client_type,
            client_inscricao_municipal: row.client_inscricao_municipal,
            client_email: row.client_email,
            client_address: row.client_address,
            client_address_number: row.client_address_number,
            client_address_complement: row.client_address_complement,
            client_neighborhood: row.client_neighborhood,
            client_zip_code: row.client_zip_code,
            client_city: row.client_city,
            client_state: row.client_state,
            client_phone: row.client_phone,
            service_code: row.service_code,
            service_code_municipal: row.service_code_municipal,
            iss_aliq: row.iss_aliq,
            revenue_type: row.revenue_type,
            description: row.description,
            payment_method: row.payment_method,
            show_bank_details: row.show_bank_details,
            count: 1,
          });
        }
      }
      cachedSuggestions = Array.from(grouped.values()).sort((a, b) => b.count - a.count);
      cacheTimestamp = Date.now();
    }
  };

  const search = useCallback((term: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (term.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const lower = term.toLowerCase();
      const results = cachedSuggestions
        .filter((s) => s.client_name.toLowerCase().includes(lower))
        .slice(0, 5);

      if (results.length > 0) {
        setSuggestions(results);
        setIsOpen(true);
      } else {
        // Fallback DB search
        const { data } = await supabase
          .from("invoice_requests")
          .select(`
            client_name, client_document, client_type, client_inscricao_municipal, client_email, 
            client_address, client_address_number, client_address_complement, client_neighborhood, 
            client_zip_code, client_city, client_state, client_phone, 
            service_code, service_code_municipal, iss_aliq, 
            revenue_type, description, payment_method, show_bank_details
          `)
          .not("status", "eq", "cancelada")
          .ilike("client_name", `%${term}%`)
          .order("created_at", { ascending: false })
          .limit(5);

        if (data && data.length > 0) {
          const unique = new Map<string, InvoiceSuggestion>();
          for (const row of data as any[]) {
            const k = row.client_name?.toLowerCase();
            if (k && !unique.has(k)) {
              unique.set(k, { ...row, count: 1 });
            }
          }
          setSuggestions(Array.from(unique.values()));
          setIsOpen(true);
        } else {
          setSuggestions([]);
          setIsOpen(false);
        }
      }
      setLoading(false);
    }, 200);
  }, []);

  const close = () => setIsOpen(false);

  return { suggestions, isOpen, loading, search, close };
}
