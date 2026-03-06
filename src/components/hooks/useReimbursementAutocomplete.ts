import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ReimbursementSuggestion {
  requester_name: string;
  requester_email: string;
  department: string;
  role_title: string;
  payment_method: string;
  bank_name: string | null;
  agency: string | null;
  account_number: string | null;
  cpf_holder: string | null;
  pix_key: string | null;
  count: number;
  source: "people" | "history";
}

// Cache
let cachedPeople: ReimbursementSuggestion[] = [];
let cachedHistory: ReimbursementSuggestion[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

export function useReimbursementAutocomplete() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ReimbursementSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (Date.now() - cacheTimestamp > CACHE_TTL) {
      loadCache();
    }
  }, []);

  const loadCache = async () => {
    // Load PJ collaborators and previous reimbursements in parallel
    const [peopleRes, historyRes] = await Promise.all([
      supabase
        .from("people")
        .select("name, email, role, contract_type, is_active")
        .eq("contract_type", "pj")
        .eq("is_active", true),
      supabase
        .from("reimbursement_requests" as any)
        .select("requester_name, requester_email, department, role_title, payment_method, bank_name, agency, account_number, cpf_holder, pix_key, created_at")
        .in("status", ["aprovado", "programado", "pago"])
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    // Process people
    if (peopleRes.data) {
      cachedPeople = (peopleRes.data as any[]).map((p) => ({
        requester_name: p.name,
        requester_email: p.email || "",
        department: "",
        role_title: p.role || "",
        payment_method: "pix",
        bank_name: null,
        agency: null,
        account_number: null,
        cpf_holder: null,
        pix_key: null,
        count: 0,
        source: "people" as const,
      }));
    }

    // Process history
    if (historyRes.data) {
      const grouped = new Map<string, ReimbursementSuggestion>();
      for (const row of historyRes.data as any[]) {
        const name = row.requester_name?.toLowerCase();
        if (!name) continue;
        const existing = grouped.get(name);
        if (existing) {
          existing.count++;
        } else {
          grouped.set(name, {
            requester_name: row.requester_name,
            requester_email: row.requester_email,
            department: row.department,
            role_title: row.role_title,
            payment_method: row.payment_method,
            bank_name: row.bank_name,
            agency: row.agency,
            account_number: row.account_number,
            cpf_holder: row.cpf_holder,
            pix_key: row.pix_key,
            count: 1,
            source: "history" as const,
          });
        }
      }
      cachedHistory = Array.from(grouped.values()).sort((a, b) => b.count - a.count);
    }

    cacheTimestamp = Date.now();
  };

  const mergeResults = (term: string): ReimbursementSuggestion[] => {
    const lower = term.toLowerCase();

    // Filter people matching the term
    const matchedPeople = cachedPeople.filter((p) =>
      p.requester_name.toLowerCase().includes(lower)
    );

    // Filter history matching the term
    const matchedHistory = cachedHistory.filter((h) =>
      h.requester_name.toLowerCase().includes(lower)
    );

    // Merge: for each person, enrich with bank data from history if available
    const merged: ReimbursementSuggestion[] = matchedPeople.map((person) => {
      const historyMatch = matchedHistory.find(
        (h) => h.requester_email?.toLowerCase() === person.requester_email?.toLowerCase()
      );
      if (historyMatch) {
        return {
          ...person,
          department: historyMatch.department || person.department,
          payment_method: historyMatch.payment_method || person.payment_method,
          bank_name: historyMatch.bank_name,
          agency: historyMatch.agency,
          account_number: historyMatch.account_number,
          cpf_holder: historyMatch.cpf_holder,
          pix_key: historyMatch.pix_key,
          count: historyMatch.count,
        };
      }
      return person;
    });

    // Add history entries that don't match any person (non-PJ or removed)
    const personEmails = new Set(matchedPeople.map((p) => p.requester_email?.toLowerCase()));
    for (const h of matchedHistory) {
      if (!personEmails.has(h.requester_email?.toLowerCase())) {
        merged.push(h);
      }
    }

    return merged.slice(0, 5);
  };

  const search = useCallback((term: string) => {
    setQuery(term);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (term.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      setLoading(true);
      const results = mergeResults(term);

      if (results.length > 0) {
        setSuggestions(results);
        setIsOpen(true);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
      setLoading(false);
    }, 200);
  }, []);

  const close = () => setIsOpen(false);

  return { query, suggestions, isOpen, loading, search, close };
}
