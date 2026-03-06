import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Upload, FileText } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function SupplierInvoiceFormDialog({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    supplier_name: '',
    supplier_document: '',
    supplier_email: '',
    supplier_contact: '',
    description: '',
    gross_value: '',
    due_date: '',
    competency_month: String(new Date().getMonth() + 1),
    competency_year: String(new Date().getFullYear()),
    category: 'servicos',
    cost_center: 'operacoes',
    payment_method: 'pix',
    notes: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const uploadPdf = async (): Promise<string | null> => {
    if (!pdfFile) return null;
    const filePath = `supplier/${Date.now()}_${pdfFile.name}`;
    const { error } = await supabase.storage
      .from('invoice-attachments')
      .upload(filePath, pdfFile);
    if (error) {
      toast.error("Erro ao enviar PDF: " + error.message);
      return null;
    }
    const { data: urlData } = supabase.storage
      .from('invoice-attachments')
      .getPublicUrl(filePath);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const pdfUrl = await uploadPdf();

    const { error } = await supabase
      .from('supplier_invoices' as any)
      .insert({
        user_id: user.id,
        supplier_name: form.supplier_name,
        supplier_document: form.supplier_document,
        supplier_email: form.supplier_email || null,
        supplier_contact: form.supplier_contact || null,
        description: form.description,
        gross_value: parseFloat(form.gross_value),
        due_date: form.due_date || null,
        competency_month: parseInt(form.competency_month),
        competency_year: parseInt(form.competency_year),
        category: form.category,
        cost_center: form.cost_center,
        payment_method: form.payment_method,
        notes: form.notes || null,
        invoice_pdf_url: pdfUrl,
        submitted_via: 'manual',
      });

    setLoading(false);
    if (error) {
      toast.error("Erro ao cadastrar nota: " + error.message);
      return;
    }

    toast.success("Nota cadastrada com sucesso!");
    onOpenChange(false);
    onCreated();
    setPdfFile(null);
    setForm({
      supplier_name: '', supplier_document: '', supplier_email: '', supplier_contact: '',
      description: '', gross_value: '', due_date: '',
      competency_month: String(new Date().getMonth() + 1),
      competency_year: String(new Date().getFullYear()),
      category: 'servicos', cost_center: 'operacoes', payment_method: 'pix', notes: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Nota de Fornecedor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fornecedor *</Label>
              <Input required value={form.supplier_name} onChange={e => handleChange('supplier_name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>CNPJ/CPF *</Label>
              <Input required value={form.supplier_document} onChange={e => handleChange('supplier_document', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={form.supplier_email} onChange={e => handleChange('supplier_email', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Contato</Label>
              <Input value={form.supplier_contact} onChange={e => handleChange('supplier_contact', e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição *</Label>
            <Textarea required value={form.description} onChange={e => handleChange('description', e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Valor Bruto (R$) *</Label>
              <Input required type="number" step="0.01" min="0" value={form.gross_value} onChange={e => handleChange('gross_value', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Vencimento (se combinado)</Label>
              <Input type="date" value={form.due_date} onChange={e => handleChange('due_date', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={form.payment_method} onValueChange={v => handleChange('payment_method', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Competência (Mês)</Label>
              <Input type="number" min="1" max="12" value={form.competency_month} onChange={e => handleChange('competency_month', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Competência (Ano)</Label>
              <Input type="number" min="2020" max="2030" value={form.competency_year} onChange={e => handleChange('competency_year', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Centro de Custo</Label>
              <Select value={form.cost_center} onValueChange={v => handleChange('cost_center', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="operacoes">Operações</SelectItem>
                  <SelectItem value="comercial">Comercial</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* PDF Upload */}
          <div className="space-y-2">
            <Label>Nota Fiscal (PDF)</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
              {pdfFile ? (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-light">{pdfFile.name}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setPdfFile(null)} className="text-xs text-muted-foreground">
                    Remover
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-1.5">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Clique para anexar PDF</span>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={e => setPdfFile(e.target.files?.[0] || null)}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={form.notes} onChange={e => handleChange('notes', e.target.value)} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Cadastrando...' : 'Cadastrar Nota'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}



