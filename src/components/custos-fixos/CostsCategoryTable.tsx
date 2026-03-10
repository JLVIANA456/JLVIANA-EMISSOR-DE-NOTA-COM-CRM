import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useState, useMemo } from "react";
import type { FixedCost } from "@/components/hooks/useFixedCosts";

const CATEGORIES = [
  "Vendas", "Marketing", "Operacao", "Produto", "Financeiro",
  "Infraestrutura", "RH", "Pessoas", "Outros",
];

interface Props {
  costs: FixedCost[];
  totalMonthly: number;
  onUpdate: (data: Partial<FixedCost> & { id: string }) => void;
  onDelete: (id: string) => void;
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getStatusBadge(ativo: boolean) {
  if (!ativo) return <Badge variant="outline" className="text-muted-foreground">Inativo</Badge>;
  return <Badge variant="secondary">Ativo</Badge>;
}

type SortKey = "descricao" | "valor" | "dia_vencimento" | "frequencia";
type SortDir = "asc" | "desc";

export function CostsCategoryTable({ costs, totalMonthly, onUpdate, onDelete }: Props) {
  const [editItem, setEditItem] = useState<FixedCost | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ 
    descricao: "", 
    "categori-id": "", 
    valor: "", 
    dia_vencimento: "", 
    frequencia: "Mensal" as const,
    ativo: true,
    gerar_ap: false
  });

  // Filters
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>("descricao");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  // Unique values for filters
  const uniqueCategories = useMemo(() => {
    const cats = costs.map(c => c.categoria?.nome).filter(Boolean) as string[];
    return [...new Set(cats)].sort();
  }, [costs]);

  // Filtered + sorted
  const filteredCosts = useMemo(() => {
    let result = [...costs];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.descricao.toLowerCase().includes(q) ||
        (c.categoria?.nome || "").toLowerCase().includes(q)
      );
    }
    if (filterCategory !== "all") {
      result = result.filter(c => c.categoria?.nome === filterCategory);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "valor" || sortKey === "dia_vencimento") {
        cmp = Number(a[sortKey]) - Number(b[sortKey]);
      } else {
        const valA = String(a[sortKey] || "");
        const valB = String(b[sortKey] || "");
        cmp = valA.localeCompare(valB);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [costs, search, filterCategory, sortKey, sortDir]);

  const filteredTotal = filteredCosts.reduce((s, c) => s + Number(c.valor), 0);

  const openEdit = (item: FixedCost) => {
    setEditItem(item);
    setEditForm({
      descricao: item.descricao,
      "categori-id": item["categori-id"],
      valor: String(item.valor),
      dia_vencimento: String(item.dia_vencimento || ""),
      frequencia: item.frequencia,
      ativo: item.ativo,
      gerar_ap: item.gerar_ap
    });
  };

  const handleSaveEdit = () => {
    if (!editItem) return;
    onUpdate({
      id: editItem.id,
      descricao: editForm.descricao,
      "categori-id": editForm["categori-id"],
      valor: parseFloat(editForm.valor),
      dia_vencimento: editForm.dia_vencimento ? parseInt(editForm.dia_vencimento, 10) : null,
      frequencia: editForm.frequencia,
      ativo: editForm.ativo,
      gerar_ap: editForm.gerar_ap
    });
    setEditItem(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-lg">Tabela de Custos Fixos</CardTitle>
            <div className="text-sm text-muted-foreground">
              {filteredCosts.length} itens · Total: <span className="font-light text-foreground">{formatBRL(filteredTotal)}</span>
            </div>
          </div>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mt-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar item, categoria..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {uniqueCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5 cursor-pointer select-none" onClick={() => toggleSort("descricao")}>
                  <span className="flex items-center">Descrição <SortIcon column="descricao" /></span>
                </TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort("valor")}>
                  <span className="flex items-center justify-end">Valor <SortIcon column="valor" /></span>
                </TableHead>
                <TableHead className="text-center cursor-pointer select-none" onClick={() => toggleSort("dia_vencimento")}>
                  <span className="flex items-center justify-center">Vencimento <SortIcon column="dia_vencimento" /></span>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("frequencia")}>
                  <span className="flex items-center">Frequência <SortIcon column="frequencia" /></span>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum item encontrado com os filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCosts.map((item) => (
                  <TableRow key={item.id} className="text-sm group">
                    <TableCell className="pl-5 font-light">{item.descricao}</TableCell>
                    <TableCell>{item.categoria?.nome || "Sem Categoria"}</TableCell>
                    <TableCell className="text-right">{formatBRL(Number(item.valor))}</TableCell>
                    <TableCell className="text-center">{item.dia_vencimento ? `Dia ${item.dia_vencimento}` : '-'}</TableCell>
                    <TableCell>{item.frequencia}</TableCell>
                    <TableCell>{getStatusBadge(item.ativo)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Custo Fixo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Descrição</Label>
              <Input value={editForm.descricao} onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria</Label>
                <Select value={editForm["categori-id"]} onValueChange={(v) => setEditForm({ ...editForm, "categori-id": v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor Mensal (R$)</Label>
                <Input type="number" step="0.01" value={editForm.valor} onChange={(e) => setEditForm({ ...editForm, valor: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Dia do Vencimento</Label>
                <Input type="number" min="1" max="31" value={editForm.dia_vencimento} onChange={(e) => setEditForm({ ...editForm, dia_vencimento: e.target.value })} />
              </div>
              <div>
                <Label>Frequência</Label>
                <Select value={editForm.frequencia} onValueChange={(v) => setEditForm({ ...editForm, frequencia: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mensal">Mensal</SelectItem>
                    <SelectItem value="Trimestral">Trimestral</SelectItem>
                    <SelectItem value="Anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="ativo-switch" checked={editForm.ativo} onCheckedChange={(checked) => setEditForm({ ...editForm, ativo: checked })} />
              <Label htmlFor="ativo-switch">Custo Ativo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="ap-switch" checked={editForm.gerar_ap} onCheckedChange={(checked) => setEditForm({ ...editForm, gerar_ap: checked })} />
              <Label htmlFor="ap-switch">Gerar no Contas a Pagar</Label>
            </div>
            <Button onClick={handleSaveEdit} className="w-full">Salvar Alterações</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir custo fixo?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { onDelete(deleteId); setDeleteId(null); } }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
