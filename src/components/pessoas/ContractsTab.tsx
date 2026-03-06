import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Upload, FileText } from "lucide-react";
import { differenceInDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PJContract, ContractInsert } from "@/hooks/useContracts";
import type { Person } from "@/hooks/usePeople";

interface Props {
  contracts: PJContract[];
  people: Person[];
  onAdd: (c: ContractInsert) => void;
  onUpdate: (c: Partial<PJContract> & { id: string }) => void;
  onDelete: (id: string) => void;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ativo: { label: "Ativo", variant: "default" },
  vencido: { label: "Vencido", variant: "destructive" },
  renovado: { label: "Renovado", variant: "secondary" },
};

export function ContractsTab({ contracts, people, onAdd, onUpdate, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [personId, setPersonId] = useState("");
  const [contractType, setContractType] = useState("original");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthlyValue, setMonthlyValue] = useState("");
  const [status, setStatus] = useState("ativo");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const reset = () => {
    setPersonId(""); setContractType("original"); setStartDate(""); setEndDate("");
    setMonthlyValue(""); setStatus("ativo"); setNotes(""); setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let fileUrl: string | null = null;
      if (file) {
        const safeName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `contracts/${personId}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from("pj-documents").upload(path, file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("pj-documents").getPublicUrl(path);
        fileUrl = publicUrl;
      }
      onAdd({
        person_id: personId,
        contract_type: contractType,
        start_date: startDate,
        end_date: endDate || null,
        monthly_value: parseFloat(monthlyValue) || 0,
        file_url: fileUrl,
        status,
        notes: notes || null,
      });
      setOpen(false);
      reset();
    } catch (err: any) {
      toast.error("Erro ao enviar arquivo: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (contractId: string, file: File) => {
    setUploading(true);
    try {
      const safeName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `contracts/${contractId}/${safeName}`;
      const { error: uploadError } = await supabase.storage.from("pj-documents").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("pj-documents").getPublicUrl(path);
      onUpdate({ id: contractId, file_url: publicUrl });
      toast.success("Arquivo enviado!");
    } catch {
      toast.error("Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  };

  const getExpiryBadge = (endDate: string | null) => {
    if (!endDate) return null;
    const days = differenceInDays(new Date(endDate), new Date());
    if (days < 0) return <Badge variant="destructive" className="text-[10px]">Vencido</Badge>;
    if (days <= 7) return <Badge variant="destructive" className="text-[10px]">{days}d</Badge>;
    if (days <= 15) return <Badge variant="secondary" className="text-[10px]">{days}d</Badge>;
    if (days <= 30) return <Badge variant="outline" className="text-[10px]">{days}d</Badge>;
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{contracts.length} contrato(s)</p>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Contrato</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Novo Contrato</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>PJ *</Label>
                <Select value={personId} onValueChange={setPersonId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o PJ" /></SelectTrigger>
                  <SelectContent>
                    {people.filter(p => p.status === "ativo").map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={contractType} onValueChange={setContractType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="original">Original</SelectItem>
                      <SelectItem value="aditivo">Aditivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="vencido">Vencido</SelectItem>
                      <SelectItem value="renovado">Renovado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Início *</Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Vencimento</Label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Valor Mensal (R$)</Label>
                <Input type="number" step="0.01" value={monthlyValue} onChange={e => setMonthlyValue(e.target.value)} placeholder="0,00" />
              </div>
              <div className="space-y-2">
                <Label>Contrato (PDF/Word)</Label>
                <Input type="file" accept=".pdf,.doc,.docx" onChange={e => setFile(e.target.files?.[0] || null)} />
                {file && <p className="text-xs text-muted-foreground">{file.name}</p>}
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
              </div>
              <Button type="submit" className="w-full" disabled={!personId || !startDate || uploading}>
                {uploading ? "Enviando..." : "Adicionar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-card overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PJ</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor Mensal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Arquivo</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum contrato cadastrado.</TableCell></TableRow>
            ) : contracts.map(c => {
              const person = people.find(p => p.id === c.person_id);
              const st = STATUS_MAP[c.status] || STATUS_MAP.ativo;
              return (
                <TableRow key={c.id} className="group">
                  <TableCell className="font-light">{person?.name || "—"}</TableCell>
                  <TableCell className="capitalize">{c.contract_type}</TableCell>
                  <TableCell className="text-sm">{new Date(c.start_date + "T12:00:00").toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2">
                      {c.end_date ? new Date(c.end_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                      {getExpiryBadge(c.end_date)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">{fmt(Number(c.monthly_value))}</TableCell>
                  <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                  <TableCell>
                    {c.file_url ? (
                      <a href={c.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Ver
                      </a>
                    ) : (
                      <label className="cursor-pointer text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                        <Upload className="h-3 w-3" /> Upload
                        <input type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && handleFileUpload(c.id, e.target.files[0])} disabled={uploading} />
                      </label>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100" onClick={() => onDelete(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}



