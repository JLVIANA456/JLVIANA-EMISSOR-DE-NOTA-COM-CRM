import { useState } from "react";
import { Receipt, CheckCircle2, Upload, FileText } from "lucide-react";
// Logo removed
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/components/integrations/supabase/client";
import { toast } from "sonner";

const EnviarNota = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    supplier_name: '',
    supplier_document: '',
    supplier_email: '',
    description: '',
    gross_value: '',
    due_date: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const uploadPdf = async (): Promise<string | null> => {
    if (!pdfFile) return null;
    const filePath = `supplier-external/${Date.now()}_${pdfFile.name}`;
    const { error } = await supabase.storage
      .from('invoice-attachments')
      .upload(filePath, pdfFile);
    if (error) {
      toast.error("Erro ao enviar PDF.");
      return null;
    }
    const { data: urlData } = supabase.storage
      .from('invoice-attachments')
      .getPublicUrl(filePath);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const pdfUrl = await uploadPdf();

    const { error } = await supabase
      .from('supplier_invoices' as any)
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        supplier_name: form.supplier_name,
        supplier_document: form.supplier_document,
        supplier_email: form.supplier_email || null,
        description: form.description,
        gross_value: parseFloat(form.gross_value),
        due_date: form.due_date || null,
        competency_month: new Date().getMonth() + 1,
        competency_year: new Date().getFullYear(),
        submitted_via: 'link_compartilhado',
        invoice_pdf_url: pdfUrl,
      });

    setLoading(false);
    if (error) {
      toast.error("Erro ao enviar nota. Tente novamente.");
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 mx-auto text-success" />
          <h1 className="text-2xl font-light">Nota Enviada!</h1>
          <p className="text-muted-foreground">Sua nota fiscal foi recebida com sucesso. A equipe financeira irá analisá-la em breve.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-lg w-full">
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">


          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
            <h2 className="font-light text-sm text-foreground">Instruções para envio da Nota Fiscal</h2>
            <p className="text-sm text-muted-foreground">
              Por favor, preencha todas as informações solicitadas para que possamos realizar o pagamento corretamente.
            </p>
            <p className="text-sm text-muted-foreground">
              Solicitações enviadas sem o anexo da Nota Fiscal (PDF) <strong>não serão processadas</strong> para pagamento.
            </p>
            <p className="text-sm text-muted-foreground">
              Em caso de dúvidas, entre em contato com o financeiro pelo e-mail:{" "}
              <a href="mailto:financeiro@decodingp.com" className="text-primary font-light hover:underline">
                financeiro@decodingp.com
              </a>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Empresa *</Label>
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
              <Label>Descrição do Serviço *</Label>
              <Textarea required value={form.description} onChange={e => handleChange('description', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor (R$) *</Label>
                <Input required type="number" step="0.01" min="0" value={form.gross_value} onChange={e => handleChange('gross_value', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Vencimento (se combinado)</Label>
                <Input type="date" value={form.due_date} onChange={e => handleChange('due_date', e.target.value)} />
              </div>
            </div>

            {/* PDF Upload */}
            <div className="space-y-2">
              <Label>Nota Fiscal (PDF) *</Label>
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
                    <span className="text-sm text-muted-foreground">Clique para anexar PDF da nota</span>
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Nota'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnviarNota;



