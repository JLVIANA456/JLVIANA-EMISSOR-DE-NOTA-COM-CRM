import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  REVENUE_TYPE_LABELS, PAYMENT_METHOD_LABELS, FINANCIAL_CATEGORY_LABELS,
  COST_CENTER_LABELS, BANK_DETAILS, RevenueType, PaymentMethod, FinancialCategory, CostCenter,
  InvoiceRequest
} from "@/types/invoice";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImagePlus, X, Clipboard } from "lucide-react";
import { useInvoiceAutocomplete } from "@/hooks/useInvoiceAutocomplete";

const LC116_ITEMS = [
  { value: "1.01", label: "01.01 - Análise e desenvolvimento de sistemas" },
  { value: "1.02", label: "01.02 - Programação" },
  { value: "1.03", label: "01.03 - Processamento de dados" },
  { value: "1.04", label: "01.04 - Elaboração de programas de computador" },
  { value: "1.05", label: "01.05 - Licenciamento ou cessão de direito de uso de software" },
  { value: "1.06", label: "01.06 - Assessoria e consultoria em informática" },
  { value: "1.07", label: "01.07 - Suporte técnico em informática" },
  { value: "1.08", label: "01.08 - Planejamento e manutenção de sistemas" },
  { value: "2.01", label: "02.01 - Pesquisa e desenvolvimento" },
  { value: "3.01", label: "03.01 - Cessão de direito de uso de marcas" },
  { value: "3.02", label: "03.02 - Exploração de salões de festas" },
  { value: "4.01", label: "04.01 - Medicina e biomedicina" },
  { value: "4.02", label: "04.02 - Análises clínicas" },
  { value: "4.03", label: "04.03 - Hospitais e clínicas" },
  { value: "4.04", label: "04.04 - Instrumentação cirúrgica" },
  { value: "4.05", label: "04.05 - Acupuntura" },
  { value: "5.01", label: "05.01 - Medicina veterinária" },
  { value: "5.02", label: "05.02 - Hospitais veterinários" },
  { value: "6.01", label: "06.01 - Barbearia, cabeleireiros e estética" },
  { value: "6.02", label: "06.02 - Banhos e tosa de animais" },
  { value: "7.01", label: "07.01 - Engenharia, arquitetura e urbanismo" },
  { value: "7.02", label: "07.02 - Execução de obras de construção civil" },
  { value: "7.03", label: "07.03 - Demolição" },
  { value: "7.04", label: "07.04 - Reparação e conservação de edifícios" },
  { value: "7.05", label: "07.05 - Limpeza e conservação de imóveis" },
  { value: "7.06", label: "07.06 - Varrição, coleta e tratamento de resíduos" },
  { value: "8.01", label: "08.01 - Ensino regular" },
  { value: "8.02", label: "08.02 - Instrução e treinamento" },
  { value: "8.03", label: "08.03 - Ensino profissionalizante" },
  { value: "8.04", label: "08.04 - Ensino de idiomas" },
  { value: "8.05", label: "08.05 - Ensino de informática" },
  { value: "9.01", label: "09.01 - Hospedagem" },
  { value: "9.02", label: "09.02 - Agenciamento de turismo" },
  { value: "10.01", label: "10.01 - Intermediação de negócios" },
  { value: "10.02", label: "10.02 - Representação comercial" },
  { value: "11.01", label: "11.01 - Guarda e estacionamento de veículos" },
  { value: "12.01", label: "12.01 - Espetáculos teatrais" },
  { value: "12.02", label: "12.02 - Exibições cinematográficas" },
  { value: "13.01", label: "13.01 - Fonografia e gravação de sons" },
  { value: "14.01", label: "14.01 - Funilaria e lanternagem" },
  { value: "14.02", label: "14.02 - Mecânica" },
  { value: "14.03", label: "14.03 - Reparação de veículos" },
  { value: "15.01", label: "15.01 - Administração de fundos" },
  { value: "15.02", label: "15.02 - Cartões de crédito" },
  { value: "16.01", label: "16.01 - Transporte municipal" },
  { value: "17.01", label: "17.01 - Assessoria ou consultoria" },
  { value: "17.02", label: "17.02 - Contabilidade e auditoria" },
  { value: "17.03", label: "17.03 - Advocacia" },
  { value: "17.04", label: "17.04 - Engenharia consultiva" },
  { value: "17.05", label: "17.05 - Publicidade e propaganda" },
  { value: "17.06", label: "17.06 - Organização de eventos" },
  { value: "17.07", label: "17.07 - Planejamento e organização empresarial" },
  { value: "18.01", label: "18.01 - Regulação de sinistros" },
  { value: "19.01", label: "19.01 - Distribuição de bens de terceiros" },
  { value: "20.01", label: "20.01 - Serviços portuários" },
  { value: "21.01", label: "21.01 - Serviços de registros públicos" },
  { value: "22.01", label: "22.01 - Exploração de rodovia" },
  { value: "23.01", label: "23.01 - Programação visual" },
  { value: "24.01", label: "24.01 - Chaveiros" },
  { value: "25.01", label: "25.01 - Serviços funerários" },
  { value: "26.01", label: "26.01 - Coleta de lixo" },
  { value: "27.01", label: "27.01 - Serviços de assistência social" },
];

const SP_TO_LC116_MAP: Record<string, string> = {
  "01015": "1.01", "01023": "1.02", "01031": "1.03", "01040": "1.04", "01058": "1.05",
  "01066": "1.06", "01074": "1.07", "01082": "1.08", "02010": "2.01", "03012": "3.01",
  "03020": "3.02", "04014": "4.01", "04022": "4.02", "04030": "4.03", "04049": "4.04",
  "04057": "4.05", "05010": "5.01", "05029": "5.02", "06018": "6.01", "06026": "6.02",
  "07015": "7.01", "07023": "7.02", "07031": "7.03", "07040": "7.04", "07058": "7.05",
  "07066": "7.06", "08011": "8.01", "05762": "8.02", "08038": "8.03", "08046": "8.04",
  "08054": "8.05", "09010": "9.01", "09028": "9.02", "10014": "10.01", "10022": "10.02",
  "11010": "11.01", "12017": "12.01", "12025": "12.02", "13013": "13.01", "14010": "14.01",
  "14029": "14.02", "14037": "14.03", "15018": "15.01", "15026": "15.02", "16015": "16.01",
  "17010": "17.01", "17029": "17.02", "17037": "17.03", "17045": "17.04", "17053": "17.05",
  "17061": "17.06", "17070": "17.07", "18017": "18.01", "19013": "19.01", "20010": "20.01",
  "21016": "21.01", "22012": "22.01", "23019": "23.01", "24015": "24.01", "25011": "25.01",
  "26018": "26.01", "27014": "27.01",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  editingRequest?: InvoiceRequest | null;
}

export function InvoiceFormDialog({ open, onOpenChange, onCreated, editingRequest }: Props) {
  const isEditing = !!editingRequest;
  const [loading, setLoading] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [attachedImages, setAttachedImages] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const { suggestions, isOpen, search: searchClients, close: closeSuggestions } = useInvoiceAutocomplete();

  const [municipalCode, setMunicipalCode] = useState("");
  const [selectedServiceCode, setSelectedServiceCode] = useState("1.01");

  // Track form field refs for autofill
  const formRef = useRef<HTMLFormElement>(null);

  // Pre-fill state when editing
  useEffect(() => {
    if (editingRequest && open) {
      setShowBankDetails(editingRequest.show_bank_details);
      setIsRecurring(editingRequest.is_recurring);
      setMunicipalCode(editingRequest.service_code_municipal || "");
      setSelectedServiceCode(editingRequest.service_code || "1.01");
    } else if (!open) {
      setShowBankDetails(false);
      setIsRecurring(false);
      setAttachedImages([]);
      setMunicipalCode("");
      setSelectedServiceCode("1.01");
    }
  }, [editingRequest, open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        closeSuggestions();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [closeSuggestions]);

  const handleImagePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) addImage(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(addImage);
    }
    e.target.value = '';
  };

  const addImage = (file: File) => {
    if (attachedImages.length >= 5) {
      toast.error("Máximo de 5 imagens por solicitação");
      return;
    }
    const preview = URL.createObjectURL(file);
    setAttachedImages(prev => [...prev, { file, preview }]);
  };

  const removeImage = (idx: number) => {
    setAttachedImages(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const get = (k: string) => form.get(k) as string;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Você precisa estar logado para criar uma solicitação.");
      setLoading(false);
      return;
    }

    const payload = {
      user_id: user.id,
      client_name: get('client_name'),
      client_document: get('client_document'),
      client_type: get('client_type') as 'F' | 'J' | 'E',
      client_inscricao_municipal: get('client_inscricao_municipal') || null,
      client_address: get('client_address'),
      client_address_number: get('client_address_number') || null,
      client_address_complement: get('client_address_complement') || null,
      client_neighborhood: get('client_neighborhood') || null,
      client_zip_code: get('client_zip_code') || null,
      client_city: get('client_city') || null,
      client_state: get('client_state') || null,
      client_country: get('client_country') || 'Brasil',
      client_email: get('client_email') || '',
      client_contact: null,
      client_phone: get('client_phone') || null,
      revenue_type: (get('revenue_type') || 'outro') as RevenueType,
      description: get('description'),
      service_code: get('service_code') || null,
      service_code_municipal: get('service_code_municipal') || null,
      iss_retained: get('iss_retained') === 'true',
      iss_aliq: parseFloat(get('iss_aliq') || '0') || null,
      nature_operation: get('nature_operation') || '1',
      competency_month: parseInt(get('competency_month')),
      competency_year: parseInt(get('competency_year')),
      desired_issue_date: get('desired_issue_date'),
      due_date: get('due_date') || get('desired_issue_date'),
      gross_value: parseFloat(get('gross_value').replace(/[^\d.,]/g, '').replace(',', '.')),
      deductions_value: parseFloat(get('deductions_value')?.replace(',', '.') || '0') || null,
      discount_value: parseFloat(get('discount_value')?.replace(',', '.') || '0') || null,
      payment_method: get('payment_method') as PaymentMethod,
      show_bank_details: showBankDetails,
      financial_category: 'receita_servico' as FinancialCategory,
      cost_center: 'operacoes' as CostCenter,
      tags: null,
      is_recurring: isRecurring,
      recurring_day: isRecurring ? parseInt(get('recurring_day') || '0') || null : null,
      recurring_end_date: isRecurring ? get('recurring_end_date') || null : null,
      analyst_notes: get('analyst_notes') || null,
      status: 'rascunho' as const,
    };

    // Upload images first
    const imageUrls: string[] = [];
    for (const img of attachedImages) {
      const ext = img.file.name.split('.').pop() || 'png';
      const path = `observations/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('invoice-attachments')
        .upload(path, img.file);
      if (uploadErr) {
        toast.error("Erro ao enviar imagem: " + uploadErr.message);
        setLoading(false);
        return;
      }
      const { data: urlData } = supabase.storage
        .from('invoice-attachments')
        .getPublicUrl(path);
      imageUrls.push(urlData.publicUrl);
    }

    // Append image references to analyst notes
    if (imageUrls.length > 0) {
      const imgRefs = imageUrls.map((url, i) => `[Imagem ${i + 1}](${url})`).join('\n');
      payload.analyst_notes = (payload.analyst_notes || '') + '\n\n' + imgRefs;
    }

    if (isEditing) {
      const { error } = await supabase
        .from('invoice_requests' as any)
        .update(payload as any)
        .eq('id', editingRequest.id);

      if (error) {
        toast.error("Erro ao atualizar solicitação: " + error.message);
      } else {
        toast.success("Solicitação atualizada com sucesso!");
        setAttachedImages([]);
        onCreated();
        onOpenChange(false);
      }
    } else {
      const { error } = await supabase.from('invoice_requests' as any).insert(payload as any);

      if (error) {
        toast.error("Erro ao criar solicitação: " + error.message);
      } else {
        toast.success("Solicitação criada com sucesso!");
        setAttachedImages([]);
        onCreated();
        onOpenChange(false);
      }
    }
    setLoading(false);
  };

  const currentYear = new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Solicitação' : 'Nova Solicitação de Emissão de Nota'}</DialogTitle>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Tomador de Serviços */}
          <div>
            <h3 className="text-sm font-light text-primary mb-3">1. Tomador de Serviços (Cliente)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-1 space-y-1.5">
                <Label>Tipo de Documento</Label>
                <Select name="client_type" defaultValue={editingRequest?.client_type || 'J'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="J">Pessoa Jurídica (CNPJ)</SelectItem>
                    <SelectItem value="F">Pessoa Física (CPF)</SelectItem>
                    <SelectItem value="E">Exterior (ID Estrangeiro)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client_document">CPF/CNPJ *</Label>
                <Input name="client_document" required placeholder="00.000.000/0001-00" defaultValue={editingRequest?.client_document || ''} key={`doc-${editingRequest?.id || 'new'}`} />
              </div>

              <div className="col-span-2 space-y-1.5 relative" ref={autocompleteRef}>
                <Label htmlFor="client_name">Nome/Razão Social *</Label>
                <Input
                  name="client_name"
                  required
                  placeholder="Ex: SIAC TECNOLOGIA EIRELI"
                  autoComplete="off"
                  defaultValue={editingRequest?.client_name || ''}
                  key={editingRequest?.id || 'new'}
                  onChange={(e) => searchClients(e.target.value)}
                />
                {isOpen && suggestions.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2 text-xs text-muted-foreground border-b">
                      Encontramos solicitações anteriores. Deseja reutilizar?
                    </div>
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-accent/50 transition-colors text-sm border-b last:border-0"
                        onClick={() => {
                          if (!formRef.current) return;
                          const form = formRef.current;
                          const setVal = (name: string, val: string) => {
                            const el = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
                            if (el) {
                              const nativeSetter = Object.getOwnPropertyDescriptor(
                                window.HTMLInputElement.prototype, 'value'
                              )?.set || Object.getOwnPropertyDescriptor(
                                window.HTMLTextAreaElement.prototype, 'value'
                              )?.set;
                              nativeSetter?.call(el, val);
                              el.dispatchEvent(new Event('input', { bubbles: true }));
                              el.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                          };

                          setVal('client_name', s.client_name);
                          setVal('client_document', s.client_document);
                          setVal('client_inscricao_municipal', s.client_inscricao_municipal || '');
                          setVal('client_email', s.client_email || '');
                          setVal('client_address', s.client_address);
                          setVal('client_address_number', s.client_address_number || '');
                          setVal('client_address_complement', s.client_address_complement || '');
                          setVal('client_neighborhood', s.client_neighborhood || '');
                          setVal('client_zip_code', s.client_zip_code || '');
                          setVal('client_city', s.client_city || '');
                          setVal('client_phone', s.client_phone || '');
                          setVal('service_code', s.service_code || '');
                          setVal('service_code_municipal', s.service_code_municipal || '');
                          setVal('iss_aliq', s.iss_aliq ? String(s.iss_aliq).replace('.', ',') : '');

                          setShowBankDetails(s.show_bank_details);
                          closeSuggestions();
                          toast.success("Dados preenchidos automaticamente!");
                        }}
                      >
                        <p className="font-light">{s.client_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.client_document} • {s.count} solicitação(ões)
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="client_inscricao_municipal">Inscrição Municipal</Label>
                <Input name="client_inscricao_municipal" placeholder="---" defaultValue={editingRequest?.client_inscricao_municipal || ''} key={`im-${editingRequest?.id || 'new'}`} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client_email">E-mail *</Label>
                <Input name="client_email" type="email" required placeholder="financeiro@cliente.com" defaultValue={editingRequest?.client_email || ''} key={`email-${editingRequest?.id || 'new'}`} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client_phone">Telefone</Label>
                <Input name="client_phone" placeholder="(00) 00000-0000" defaultValue={editingRequest?.client_phone || ''} key={`phone-${editingRequest?.id || 'new'}`} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client_zip_code">CEP</Label>
                <Input name="client_zip_code" placeholder="00000-000" defaultValue={editingRequest?.client_zip_code || ''} key={`zip-${editingRequest?.id || 'new'}`} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="client_address">Logradouro *</Label>
                <Input name="client_address" required placeholder="Rua / Avenida" defaultValue={editingRequest?.client_address || ''} key={`addr-${editingRequest?.id || 'new'}`} />
              </div>
              <div className="grid grid-cols-3 gap-3 col-span-2">
                <div className="space-y-1.5">
                  <Label>Número *</Label>
                  <Input name="client_address_number" required placeholder="123" defaultValue={editingRequest?.client_address_number || ''} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Complemento</Label>
                  <Input name="client_address_complement" placeholder="Sala 1, Bloco A" defaultValue={editingRequest?.client_address_complement || ''} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Bairro</Label>
                <Input name="client_neighborhood" placeholder="Centro" defaultValue={editingRequest?.client_neighborhood || ''} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client_city">Município *</Label>
                <Input name="client_city" required placeholder="Ex: São Paulo" defaultValue={editingRequest?.client_city || ''} key={`city-${editingRequest?.id || 'new'}`} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client_state">UF *</Label>
                <Select name="client_state" required defaultValue={editingRequest?.client_state || undefined} key={`state-${editingRequest?.id || 'new'}`}>
                  <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>
                    {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>País</Label>
                <Input name="client_country" defaultValue={editingRequest?.client_country || 'Brasil'} />
              </div>
            </div>
          </div>

          <Separator />

          {/* 2. Informações da Nota e Serviços */}
          <div>
            <h3 className="text-sm font-light text-primary mb-3">2. Detalhes do Serviço (NF-e Municipal SP)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cód. Serviço Municipal (SP) *</Label>
                <Input
                  name="service_code_municipal"
                  required
                  placeholder="Ex: 02881"
                  value={municipalCode}
                  onChange={(e) => {
                    const val = (e.target.value || "").replace(/\D/g, "");
                    setMunicipalCode(val);
                    if (SP_TO_LC116_MAP[val]) {
                      setSelectedServiceCode(SP_TO_LC116_MAP[val]);
                    }
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Item da Lista (LC 116) *</Label>
                <Select
                  name="service_code"
                  required
                  value={selectedServiceCode}
                  onValueChange={setSelectedServiceCode}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione o item" /></SelectTrigger>
                  <SelectContent>
                    {LC116_ITEMS.map(item => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Discriminação de Serviços *</Label>
                <Textarea name="description" required rows={3} placeholder="Descrição detalhada para a nota fiscal" defaultValue={editingRequest?.description || ''} key={`desc-${editingRequest?.id || 'new'}`} />
              </div>
              <div className="space-y-1.5">
                <Label>Valor do Serviço (R$) *</Label>
                <Input name="gross_value" required placeholder="0,00" defaultValue={editingRequest ? String(editingRequest.gross_value).replace('.', ',') : ''} key={`gv-${editingRequest?.id || 'new'}`} />
              </div>
              <div className="space-y-1.5">
                <Label>Deduções / Materiais (R$)</Label>
                <Input name="deductions_value" placeholder="0,00" defaultValue={editingRequest?.deductions_value ? String(editingRequest.deductions_value).replace('.', ',') : ''} />
              </div>
              <div className="space-y-1.5">
                <Label>ISS Retido?</Label>
                <Select name="iss_retained" defaultValue={editingRequest?.iss_retained ? 'true' : 'false'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Não</SelectItem>
                    <SelectItem value="true">Sim (Retido)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Alíquota ISS (%)</Label>
                <Input name="iss_aliq" placeholder="2,00" defaultValue={editingRequest?.iss_aliq ? String(editingRequest.iss_aliq).replace('.', ',') : ''} />
              </div>
              <div className="space-y-1.5">
                <Label>Exigibilidade ISS</Label>
                <Select name="nature_operation" defaultValue={editingRequest?.nature_operation || '1'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Exigível (Normal)</SelectItem>
                    <SelectItem value="2">Não Incidência</SelectItem>
                    <SelectItem value="3">Isenção</SelectItem>
                    <SelectItem value="4">Exportação</SelectItem>
                    <SelectItem value="5">Imunidade</SelectItem>
                    <SelectItem value="6">Exigibilidade Suspensa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Data de Competência</Label>
                <div className="flex gap-2">
                  <Select name="competency_month" required defaultValue={editingRequest ? String(editingRequest.competency_month) : String(new Date().getMonth() + 1)}>
                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>{months.map(m => (<SelectItem key={m} value={String(m)}>{m.toString().padStart(2, '0')}</SelectItem>))}</SelectContent>
                  </Select>
                  <Select name="competency_year" required defaultValue={editingRequest ? String(editingRequest.competency_year) : String(currentYear)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{[currentYear - 1, currentYear, currentYear + 1].map(y => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Data de emissão desejada *</Label>
                <Input name="desired_issue_date" type="date" required defaultValue={editingRequest?.desired_issue_date || ''} key={`did-${editingRequest?.id || 'new'}`} />
              </div>
              <div className="space-y-1.5">
                <Label>Data de vencimento</Label>
                <Input name="due_date" type="date" defaultValue={editingRequest?.due_date || ''} key={`dd-${editingRequest?.id || 'new'}`} />
              </div>
            </div>
          </div>

          <Separator />

          {/* 3. Condições de Pagamento */}
          <div>
            <h3 className="text-sm font-light text-primary mb-3">3. Condições de Pagamento</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Forma de pagamento *</Label>
                <Select name="payment_method" required defaultValue={editingRequest?.payment_method || undefined} key={`pm-${editingRequest?.id || 'new'}`}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-5">
                <Switch checked={showBankDetails} onCheckedChange={setShowBankDetails} />
                <Label>Solicitar transferência? (exibir dados bancários)</Label>
              </div>
            </div>
            {showBankDetails && (
              <div className="mt-3 rounded-lg bg-muted/50 border p-3 text-sm space-y-1">
                <p className="font-light text-xs text-primary mb-1">Dados Bancários Padrão:</p>
                <p><span className="text-muted-foreground">Banco:</span> {BANK_DETAILS.banco}</p>
                <p><span className="text-muted-foreground">Agência:</span> {BANK_DETAILS.agencia}</p>
                <p><span className="text-muted-foreground">Conta:</span> {BANK_DETAILS.conta}</p>
                <p><span className="text-muted-foreground">CNPJ:</span> {BANK_DETAILS.cnpj}</p>
                <p><span className="text-muted-foreground">PIX:</span> {BANK_DETAILS.pix}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* 5. Controle Operacional */}
          <div>
            <h3 className="text-sm font-light text-primary mb-3">5. Controle Operacional</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                <Label>Nota recorrente?</Label>
              </div>
              {isRecurring && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Dia fixo do mês</Label>
                    <Input name="recurring_day" type="number" min={1} max={31} placeholder="Ex: 15" defaultValue={editingRequest?.recurring_day ?? ''} key={`rd-${editingRequest?.id || 'new'}`} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data de término (opcional)</Label>
                    <Input name="recurring_end_date" type="date" defaultValue={editingRequest?.recurring_end_date || ''} key={`red-${editingRequest?.id || 'new'}`} />
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Observações para analista</Label>
                <Textarea
                  name="analyst_notes"
                  rows={3}
                  placeholder="Instruções ou observações adicionais. Cole imagens (Ctrl+V) aqui."
                  onPaste={handleImagePaste}
                  defaultValue={editingRequest?.analyst_notes || ''}
                  key={`an-${editingRequest?.id || 'new'}`}
                />
              </div>

              {/* Image attachments */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                    Anexar imagem
                  </Button>
                  <span className="text-[10px] text-muted-foreground">
                    ou cole (Ctrl+V) no campo acima • máx. 5 imagens
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
                {attachedImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachedImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img.preview}
                          alt={`Anexo ${idx + 1}`}
                          className="h-20 w-20 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (isEditing ? "Salvando..." : "Criando...") : (isEditing ? "Salvar Alterações" : "Criar Solicitação")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}



