import { useState, useMemo, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ChevronsLeftRight, ChevronsRightLeft, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useRevenueProjections, CellColor } from "@/hooks/useRevenueProjections";
import { toast } from "sonner";

const COLOR_BG: Record<string, string> = {
  green: "bg-secondary dark:bg-primary/40",
  yellow: "bg-amber-100 dark:bg-amber-900/40",
  red: "bg-red-100 dark:bg-red-900/40",
};

const COLOR_OPTIONS: { value: CellColor; label: string; dot: string }[] = [
  { value: "green", label: "Verde", dot: "bg-primary" },
  { value: "yellow", label: "Amarelo", dot: "bg-amber-500" },
  { value: "red", label: "Vermelho", dot: "bg-red-500" },
  { value: null, label: "Limpar", dot: "bg-gray-300" },
];

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function fmt(v: number) {
  if (v === 0) return "R$ -";
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function AnnualProjectionGrid() {
  const [year, setYear] = useState(2026);
  const { projections, clientNames, isLoading, upsertProjection, addClient, deleteClient, toggleMrr, renameClient, updateColor } = useRevenueProjections(year);
  const [newClientName, setNewClientName] = useState("");
  const [editingCell, setEditingCell] = useState<{ client: string; month: number } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [nameValue, setNameValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [colorMenu, setColorMenu] = useState<{ client: string; month: number; x: number; y: number } | null>(null);

  const getValue = (client: string, month: number) => {
    const entry = projections.find((p) => p.client_name === client && p.month === month);
    return entry ? Number(entry.value) : 0;
  };

  const getColor = (client: string, month: number): string | null => {
    const entry = projections.find((p) => p.client_name === client && p.month === month);
    return entry?.color || null;
  };

  const getClientMrr = (client: string) => {
    const entry = projections.find((p) => p.client_name === client);
    return entry?.is_mrr ?? false;
  };

  const { clientRows, monthTotals, grandTotal, mrrMonthTotals, nonMrrMonthTotals, mrrTotal, nonMrrTotal } = useMemo(() => {
    const clientRows = clientNames.map((name) => {
      const months = Array.from({ length: 12 }, (_, i) => getValue(name, i + 1));
      const total = months.reduce((s, v) => s + v, 0);
      const isMrr = getClientMrr(name);
      return { name, months, total, isMrr };
    });

    // Group MRR clients first, then sort by total within each group
    clientRows.sort((a, b) => {
      if (a.isMrr !== b.isMrr) return a.isMrr ? -1 : 1;
      return b.total - a.total;
    });

    const monthTotals = Array.from({ length: 12 }, (_, i) =>
      clientRows.reduce((sum, r) => sum + r.months[i], 0)
    );
    const grandTotal = monthTotals.reduce((s, v) => s + v, 0);

    const mrrRows = clientRows.filter((r) => r.isMrr);
    const nonMrrRows = clientRows.filter((r) => !r.isMrr);
    const mrrMonthTotals = Array.from({ length: 12 }, (_, i) =>
      mrrRows.reduce((sum, r) => sum + r.months[i], 0)
    );
    const nonMrrMonthTotals = Array.from({ length: 12 }, (_, i) =>
      nonMrrRows.reduce((sum, r) => sum + r.months[i], 0)
    );
    const mrrTotal = mrrMonthTotals.reduce((s, v) => s + v, 0);
    const nonMrrTotal = nonMrrMonthTotals.reduce((s, v) => s + v, 0);

    return { clientRows, monthTotals, grandTotal, mrrMonthTotals, nonMrrMonthTotals, mrrTotal, nonMrrTotal };
  }, [clientNames, projections]);

  const handleCellClick = (client: string, month: number) => {
    const val = getValue(client, month);
    setEditingCell({ client, month });
    setEditValue(val > 0 ? String(val) : "");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCellSave = () => {
    if (!editingCell) return;
    const numVal = parseFloat(editValue.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
    upsertProjection.mutate({
      client_name: editingCell.client,
      month: editingCell.month,
      year,
      value: numVal,
    });
    setEditingCell(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCellSave();
    if (e.key === "Escape") {
      setEditingCell(null);
      setEditValue("");
    }
  };

  const handleAddClient = () => {
    const name = newClientName.trim();
    if (!name) return;
    if (clientNames.includes(name)) {
      toast.error("Cliente já existe");
      return;
    }
    addClient.mutate(name);
    setNewClientName("");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">Carregando...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span>Projeção de Faturamento</span>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-[90px] h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027].map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCollapsed(!collapsed)}
                className="gap-1 text-xs"
              >
                {collapsed ? <ChevronsLeftRight className="h-3.5 w-3.5" /> : <ChevronsRightLeft className="h-3.5 w-3.5" />}
                {collapsed ? "Expandir Meses" : "Colapsar Meses"}
              </Button>
              <span className="text-lg font-light text-primary">{fmt(grandTotal)}</span>
            </div>
        </CardTitle>
        {/* Summary cards */}
        {clientRows.length > 0 && (
          <div className="flex flex-wrap gap-4 mt-3">
            <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-light">Projeção</span>
              <span className="text-sm font-light text-primary">{fmt(grandTotal)}</span>
            </div>
            {mrrTotal > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-secondary dark:border-primary bg-secondary/50 dark:bg-primary/20 px-3 py-1.5">
                <span className="text-[10px] uppercase tracking-wider text-primary dark:text-primary font-light">MRR</span>
                <span className="text-sm font-light text-primary dark:text-primary">{fmt(mrrTotal)}</span>
              </div>
            )}
            {nonMrrTotal > 0 && (
              <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-light">Avulso</span>
                <span className="text-sm font-light">{fmt(nonMrrTotal)}</span>
              </div>
            )}
          </div>
        )}
        {/* Add client row */}
        <div className="flex gap-2 mt-2">
          <Input
            placeholder="Nome do cliente / projeto..."
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddClient()}
            className="max-w-xs text-sm"
          />
          <Button size="sm" variant="outline" onClick={handleAddClient} className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            Adicionar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-auto">
          <table className={`w-full text-xs border-collapse ${collapsed ? "" : "min-w-[1000px]"}`}>
            <thead>
              <tr className="border-b bg-muted/60">
              <th className="text-left p-2 pl-4 font-light sticky left-0 bg-muted/60 z-10 min-w-[240px] text-[11px] uppercase tracking-wider">
                  Cliente
                </th>
                {!collapsed && MONTH_LABELS.map((m) => (
                  <th key={m} className="text-right p-2 font-light min-w-[95px] text-[11px] uppercase tracking-wider">
                    {m}
                  </th>
                ))}
                <th className="text-right p-2 pr-4 font-light min-w-[110px] bg-muted/40 text-[11px] uppercase tracking-wider">
                  Total
                </th>
                <th className="w-[40px]"></th>
              </tr>
              {clientRows.length > 0 && (
                <>
                  <tr className="border-b-2 border-primary/30 bg-muted/30 font-light">
                    <td className="p-2 pl-4 sticky left-0 bg-muted/30 z-10 uppercase text-[10px] tracking-widest text-primary font-light">
                      Projeção
                    </td>
                    {!collapsed && monthTotals.map((val, i) => (
                      <td key={i} className="text-right p-2 font-mono tabular-nums text-xs font-light text-primary">
                        {fmt(val)}
                      </td>
                    ))}
                    <td className="text-right p-2 pr-4 font-mono text-sm bg-primary/10 text-primary tabular-nums font-light">
                      {fmt(grandTotal)}
                    </td>
                    <td></td>
                  </tr>
                  {mrrTotal > 0 && (
                    <tr className="border-b border-border/40 bg-secondary/30 dark:bg-primary/10">
                      <td className="p-1.5 pl-4 sticky left-0 bg-secondary/30 dark:bg-primary/10 z-10 text-[10px] uppercase tracking-widest text-primary dark:text-primary font-light">
                        MRR
                      </td>
                      {!collapsed && mrrMonthTotals.map((val, i) => (
                        <td key={i} className="text-right p-1.5 font-mono tabular-nums text-xs text-primary dark:text-primary">
                          {fmt(val)}
                        </td>
                      ))}
                      <td className="text-right p-1.5 pr-4 font-mono text-xs font-light text-primary dark:text-primary tabular-nums">
                        {fmt(mrrTotal)}
                      </td>
                      <td></td>
                    </tr>
                  )}
                  {nonMrrTotal > 0 && (
                    <tr className="border-b border-border/40">
                      <td className="p-1.5 pl-4 sticky left-0 bg-card z-10 text-[10px] uppercase tracking-widest text-muted-foreground font-light">
                        Avulso
                      </td>
                      {!collapsed && nonMrrMonthTotals.map((val, i) => (
                        <td key={i} className="text-right p-1.5 font-mono tabular-nums text-xs text-muted-foreground">
                          {fmt(val)}
                        </td>
                      ))}
                      <td className="text-right p-1.5 pr-4 font-mono text-xs font-light text-muted-foreground tabular-nums">
                        {fmt(nonMrrTotal)}
                      </td>
                      <td></td>
                    </tr>
                  )}
                </>
              )}
            </thead>
            <tbody>
              {clientRows.length === 0 ? (
                <tr>
                  <td colSpan={collapsed ? 3 : 15} className="p-8 text-center text-muted-foreground">
                    Adicione clientes/projetos acima para começar a projeção.
                  </td>
                </tr>
              ) : (
                clientRows.map((row) => {
                  return (
                  <tr
                    key={row.name}
                    className={`group border-b border-border/30 hover:bg-muted/20 transition-colors ${row.isMrr ? "bg-secondary/50 dark:bg-primary/20" : ""}`}
                  >
                    <td
                      className="p-2 pl-4 font-light sticky left-0 z-10 max-w-[240px] bg-card"
                      title={row.name}
                      onDoubleClick={() => {
                        setEditingName(row.name);
                        setNameValue(row.name);
                        setTimeout(() => nameInputRef.current?.focus(), 50);
                      }}
                    >
                      {editingName === row.name ? (
                        <input
                          ref={nameInputRef}
                          type="text"
                          value={nameValue}
                          onChange={(e) => setNameValue(e.target.value)}
                          onBlur={() => {
                            const trimmed = nameValue.trim();
                            if (trimmed && trimmed !== row.name) {
                              renameClient.mutate({ oldName: row.name, newName: trimmed });
                            }
                            setEditingName(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              (e.target as HTMLInputElement).blur();
                            }
                            if (e.key === "Escape") {
                              setEditingName(null);
                            }
                          }}
                          className="w-full p-0.5 text-xs font-light bg-primary/10 border border-primary outline-none rounded"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="truncate cursor-text">{row.name}</span>
                          {row.isMrr && <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary text-primary dark:text-primary shrink-0">MRR</Badge>}
                        </div>
                      )}
                    </td>
                    {!collapsed && row.months.map((val, i) => {
                      const isEditing = editingCell?.client === row.name && editingCell?.month === i + 1;
                      const cellColor = getColor(row.name, i + 1);
                      const colorClass = cellColor ? COLOR_BG[cellColor] || "" : "";
                      return (
                        <td
                          key={i}
                          className={`text-right p-0 font-mono tabular-nums cursor-pointer hover:bg-primary/5 transition-colors ${val > 0 ? "font-light" : "text-muted-foreground/40"} ${colorClass}`}
                          onClick={() => handleCellClick(row.name, i + 1)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setColorMenu({ client: row.name, month: i + 1, x: e.clientX, y: e.clientY });
                          }}
                        >
                          {isEditing ? (
                            <input
                              ref={inputRef}
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleCellSave}
                              onKeyDown={handleKeyDown}
                              className="w-full h-full p-2 text-right text-xs font-mono bg-primary/10 border-2 border-primary outline-none"
                            />
                          ) : (
                            <div className="p-2">
                              {val > 0 ? fmt(val) : "R$ -"}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="text-right p-2 pr-4 font-mono font-light bg-muted/20 tabular-nums">
                      {row.total > 0 ? fmt(row.total) : "R$ -"}
                    </td>
                    <td className="p-1 flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-6 w-6 text-xs ${row.isMrr ? "text-primary opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                        title={row.isMrr ? "Remover MRR" : "Marcar como MRR"}
                        onClick={() => toggleMrr.mutate({ clientName: row.name, isMrr: !row.isMrr })}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100 text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Todos os valores de "{row.name}" em {year} serão removidos. Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteClient.mutate(row.name)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Color picker context menu */}
      {colorMenu && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setColorMenu(null)} onContextMenu={(e) => { e.preventDefault(); setColorMenu(null); }} />
          <div
            className="fixed z-50 bg-card border rounded-lg shadow-lg p-1.5 flex gap-1"
            style={{ left: colorMenu.x, top: colorMenu.y }}
          >
            {COLOR_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                title={opt.label}
                className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors"
                onClick={() => {
                  updateColor.mutate({ clientName: colorMenu.client, month: colorMenu.month, color: opt.value });
                  setColorMenu(null);
                }}
              >
                <span className={`h-4 w-4 rounded-full ${opt.dot}`} />
              </button>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}



