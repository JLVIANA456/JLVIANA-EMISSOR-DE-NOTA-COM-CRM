import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Save, Upload, FileText } from "lucide-react";

export function ReimbursementPolicies() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policyId, setPolicyId] = useState<string | null>(null);
  const [form, setForm] = useState({
    max_request_days: 30,
    avg_payment_days: 15,
    non_reimbursable_items: "",
    policy_document_url: "",
  });

  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data } = await supabase
        .from("reimbursement_policies" as any)
        .select("*")
        .limit(1)
        .maybeSingle();
      if (data) {
        const d = data as any;
        setPolicyId(d.id);
        setForm({
          max_request_days: d.max_request_days,
          avg_payment_days: d.avg_payment_days,
          non_reimbursable_items: (d.non_reimbursable_items || []).join("\n"),
          policy_document_url: d.policy_document_url || "",
        });
      }
      setLoading(false);
    })();
  }, [session]);

  const handleSave = async () => {
    if (!session) return;
    setSaving(true);
    const payload: any = {
      user_id: session.user.id,
      max_request_days: form.max_request_days,
      avg_payment_days: form.avg_payment_days,
      non_reimbursable_items: form.non_reimbursable_items.split("\n").map((s) => s.trim()).filter(Boolean),
      policy_document_url: form.policy_document_url || null,
    };

    if (policyId) {
      const { error } = await supabase
        .from("reimbursement_policies" as any)
        .update(payload)
        .eq("id", policyId);
      if (error) toast.error("Erro ao salvar políticas");
      else toast.success("Políticas atualizadas!");
    } else {
      const { data, error } = await supabase
        .from("reimbursement_policies" as any)
        .insert(payload)
        .select()
        .single();
      if (error) toast.error("Erro ao salvar políticas");
      else {
        setPolicyId((data as any).id);
        toast.success("Políticas criadas!");
      }
    }
    setSaving(false);
  };

  const handlePdfUpload = async (file: File) => {
    const filePath = `policies/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("reimbursement-attachments").upload(filePath, file);
    if (error) {
      toast.error("Erro ao enviar arquivo");
      return;
    }
    const { data } = supabase.storage.from("reimbursement-attachments").getPublicUrl(filePath);
    setForm((prev) => ({ ...prev, policy_document_url: data.publicUrl }));
    toast.success("Documento enviado!");
  };

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Carregando...</p>;

  return (
    <div className="max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Documento da Política Oficial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Política Oficial (PDF)</Label>
            {form.policy_document_url ? (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-primary" />
                <a href={form.policy_document_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Ver documento
                </a>
                <Button variant="ghost" size="sm" onClick={() => setForm((prev) => ({ ...prev, policy_document_url: "" }))}>
                  Remover
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer border-2 border-dashed rounded-lg p-4 flex flex-col items-center gap-1.5 hover:border-primary/50 transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Clique para enviar PDF</span>
                <input type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handlePdfUpload(e.target.files[0])} />
              </label>
            )}
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}



