import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CashFlowProject, ProjectInsert } from "@/hooks/useProjects";

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProjectInsert) => void;
  editingProject?: CashFlowProject | null;
}

export function ProjectFormDialog({ open, onOpenChange, onSubmit, editingProject }: ProjectFormDialogProps) {
  const [form, setForm] = useState<ProjectInsert>({
    name: "",
    client_name: "",
    project_type: "recorrente",
    monthly_value: 0,
    start_date: new Date().toISOString().split("T")[0],
    end_date: null,
    status: "ativo",
    notes: null,
  });

  useEffect(() => {
    if (editingProject) {
      setForm({
        name: editingProject.name,
        client_name: editingProject.client_name,
        project_type: editingProject.project_type,
        monthly_value: editingProject.monthly_value,
        start_date: editingProject.start_date,
        end_date: editingProject.end_date,
        status: editingProject.status,
        notes: editingProject.notes,
      });
    } else {
      setForm({
        name: "",
        client_name: "",
        project_type: "recorrente",
        monthly_value: 0,
        start_date: new Date().toISOString().split("T")[0],
        end_date: null,
        status: "ativo",
        notes: null,
      });
    }
  }, [editingProject, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingProject ? "Editar Projeto" : "Novo Projeto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Projeto</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Input value={form.client_name || ""} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.project_type} onValueChange={(v) => setForm({ ...form, project_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recorrente">Recorrente</SelectItem>
                  <SelectItem value="pontual">Pontual</SelectItem>
                  <SelectItem value="consultoria">Consultoria</SelectItem>
                  <SelectItem value="treinamento">Treinamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor Mensal (R$)</Label>
              <Input type="number" step="0.01" min="0" value={form.monthly_value} onChange={(e) => setForm({ ...form, monthly_value: Number(e.target.value) })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Data Término</Label>
              <Input type="date" value={form.end_date || ""} onChange={(e) => setForm({ ...form, end_date: e.target.value || null })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="pausado">Pausado</SelectItem>
                  <SelectItem value="negociacao">Em Negociação</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value || null })} rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{editingProject ? "Salvar" : "Adicionar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}



