import { useState } from "react";
import { Search, Filter, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useReimbursements, STATUS_LABELS, STATUS_COLORS } from "@/hooks/useReimbursements";
import { ReimbursementDetailSheet } from "./ReimbursementDetailSheet";

export function ReimbursementDashboard() {
  const { requests, isLoading } = useReimbursements();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = requests.filter((r) => {
    const matchSearch =
      r.requester_name.toLowerCase().includes(search.toLowerCase()) ||
      r.protocol_number.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchDept = departmentFilter === "all" || r.department === departmentFilter;
    return matchSearch && matchStatus && matchDept;
  });

  const departments = [...new Set(requests.map((r) => r.department))];

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <CardTitle className="text-lg">Solicitações de Reembolso</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  className="pl-9 w-56"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma solicitação encontrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.protocol_number}</TableCell>
                      <TableCell className="font-light">{r.requester_name}</TableCell>
                      <TableCell className="text-sm">{r.department}</TableCell>
                      <TableCell className="text-sm">{r.category}</TableCell>
                      <TableCell className="text-right font-light">
                        R$ {Number(r.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(r.expense_date).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={STATUS_COLORS[r.status] || ""}>
                          {STATUS_LABELS[r.status] || r.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedId(r.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedId && (
        <ReimbursementDetailSheet
          requestId={selectedId}
          open={!!selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}



