import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";

const CATEGORIES = [
  "Vendas", "Marketing", "Operacao", "Produto", "Financeiro",
  "Infraestrutura", "RH", "Pessoas", "Outros",
];

interface Props {
  onAdd: (cost: any) => void;
}

export function CostsAddDialog({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    descricao: "",
    "categori-id": "",
    valor: "",
    dia_vencimento: "",
    frequencia: "Mensal",
    ativo: true,
    gerar_ap: false,
  });

  const handleSubmit = () => {
    if (!form.descricao || !form.valor) return;
    onAdd({
      descricao: form.descricao,
      "categori-id": form["categori-id"],
      valor: parseFloat(form.valor),
      dia_vencimento: form.dia_vencimento ? parseInt(form.dia_vencimento, 10) : null,
      frequencia: form.frequencia,
      ativo: form.ativo,
      gerar_ap: form.gerar_ap,
    });
    setForm({ 
      descricao: "", 
      "categori-id": "", 
      valor: "", 
      dia_vencimento: "", 
      frequencia: "Mensal", 
      ativo: true, 
      gerar_ap: false 
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Custo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Custo Fixo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Descrição do Custo</Label>
            <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Aluguel, Internet" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Categoria</Label>
              <Select value={form["categori-id"]} onValueChange={(v) => setForm({ ...form, "categori-id": v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor Mensal (R$)</Label>
              <Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0,00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Dia do Vencimento</Label>
              <Input type="number" min="1" max="31" value={form.dia_vencimento} onChange={(e) => setForm({ ...form, dia_vencimento: e.target.value })} placeholder="Ex: 5" />
            </div>
            <div>
              <Label>Frequência</Label>
              <Select value={form.frequencia} onValueChange={(v) => setForm({ ...form, frequencia: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mensal">Mensal</SelectItem>
                  <SelectItem value="Trimestral">Trimestral</SelectItem>
                  <SelectItem value="Anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="add-ativo-switch" checked={form.ativo} onCheckedChange={(checked) => setForm({ ...form, ativo: checked })} />
            <Label htmlFor="add-ativo-switch">Custo Ativo</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="add-ap-switch" checked={form.gerar_ap} onCheckedChange={(checked) => setForm({ ...form, gerar_ap: checked })} />
            <Label htmlFor="add-ap-switch">Gerar no Contas a Pagar</Label>
          </div>
          <Button onClick={handleSubmit} className="w-full">Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
