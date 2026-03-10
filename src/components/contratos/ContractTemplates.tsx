import { useState } from "react";
import { useAuth } from "@/components/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, FileUp, Trash2 } from "lucide-react";
import { CATEGORY_LABELS, CONTRACT_TYPE_OPTIONS } from "@/components/lib/contract-constants";

export function ContractTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "" as string,
    contract_type: "" as string,
    file: null as File | null,
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["contract-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contract_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contract_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract-templates"] });
      toast.success("Template removido");
    },
  });

  const handleSubmit = async () => {
    if (!user || !form.file || !form.name || !form.category || !form.contract_type) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setUploading(true);
    try {
      const filePath = `${user.id}/${Date.now()}-${form.file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("contract-documents")
        .upload(filePath, form.file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("contract-documents")
        .getPublicUrl(filePath);

      const { error } = await supabase.from("contract_templates").insert({
        user_id: user.id,
        name: form.name,
        description: form.description || null,
        category: form.category as any,
        contract_type: form.contract_type as any,
        file_url: publicUrl,
        file_name: form.file.name,
      });
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["contract-templates"] });
      toast.success("Template adicionado com sucesso");
      setOpen(false);
      setForm({ name: "", description: "", category: "", contract_type: "", file: null });
    } catch (err: any) {
      toast.error("Erro ao salvar template: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const typeOptions = form.category
    ? CONTRACT_TYPE_OPTIONS.filter((t) => t.category === form.category)
    : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Templates Jurídicos</CardTitle>
            <CardDescription>Faça upload dos seus modelos de contrato para a IA utilizar</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Template</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload de Template</DialogTitle>
                <DialogDescription>Adicione um modelo de contrato jurídico</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome do Template *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Contrato RH as a Service" />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Breve descrição do template" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Categoria *</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v, contract_type: "" })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tipo *</Label>
                    <Select value={form.contract_type} onValueChange={(v) => setForm({ ...form, contract_type: v })} disabled={!form.category}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {typeOptions.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Arquivo (Word/PDF) *</Label>
                  <Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSubmit} disabled={uploading}>
                  {uploading ? "Enviando..." : <><FileUp className="h-4 w-4 mr-1" /> Salvar Template</>}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Carregando...</p>
        ) : templates.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">Nenhum template cadastrado. Faça upload do primeiro modelo.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Arquivo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="font-light">{t.name}</TableCell>
                  <TableCell><Badge variant="outline">{CATEGORY_LABELS[t.category as keyof typeof CATEGORY_LABELS] || t.category}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{CONTRACT_TYPE_OPTIONS.find((o) => o.value === t.contract_type)?.label || t.contract_type}</TableCell>
                  <TableCell><a href={t.file_url} target="_blank" className="text-sm text-primary underline">{t.file_name}</a></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(t.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}



