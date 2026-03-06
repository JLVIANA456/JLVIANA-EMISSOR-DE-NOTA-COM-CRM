import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { UsersRound, Copy, Check, AlertCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

interface Person {
  id: string;
  name: string;
  email: string | null;
  contract_type: string;
  is_active: boolean;
}

interface Props {
  people: Person[];
}

type ResultStatus = "success" | "error" | "already_exists";

interface PersonResult {
  person: Person;
  status: ResultStatus;
  message: string;
}

export function CreateBulkPjAccessDialog({ people }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tempPassword, setTempPassword] = useState("Portal2025!");
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<PersonResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const { session } = useAuth();

  // Fetch existing portal profiles to exclude
  const { data: existingProfiles = [], refetch: refetchProfiles } = useQuery({
    queryKey: ["pj_portal_profiles_bulk"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pj_portal_profiles")
        .select("person_id");
      if (error) throw error;
      return data.map((p) => p.person_id);
    },
    enabled: open,
  });

  const pjPeople = people.filter(
    (p) =>
      ["pj", "prestacao_servicos_pj"].includes(p.contract_type) &&
      p.is_active &&
      !existingProfiles.includes(p.id)
  );

  const eligiblePeople = pjPeople.filter((p) => !!p.email);
  const noEmailPeople = pjPeople.filter((p) => !p.email);

  const togglePerson = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === eligiblePeople.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(eligiblePeople.map((p) => p.id)));
    }
  };

  const handleProcess = async () => {
    if (selectedIds.size === 0 || !tempPassword) return;
    setProcessing(true);
    setResults([]);
    setCurrentIndex(0);

    const selected = eligiblePeople.filter((p) => selectedIds.has(p.id));
    const newResults: PersonResult[] = [];

    for (let i = 0; i < selected.length; i++) {
      const person = selected[i];
      setCurrentIndex(i + 1);

      try {
        const response = await supabase.functions.invoke("create-pj-account", {
          body: {
            person_id: person.id,
            email: person.email,
            temp_password: tempPassword,
          },
        });

        if (response.error) {
          newResults.push({ person, status: "error", message: response.error.message || "Erro" });
        } else if (response.data?.error) {
          const isExisting = response.data.error.includes("já possui");
          newResults.push({
            person,
            status: isExisting ? "already_exists" : "error",
            message: response.data.error,
          });
        } else {
          newResults.push({ person, status: "success", message: response.data.message || "Criado" });
        }
      } catch {
        newResults.push({ person, status: "error", message: "Erro inesperado" });
      }

      setResults([...newResults]);
    }

    setProcessing(false);
    refetchProfiles();
    const successCount = newResults.filter((r) => r.status === "success").length;
    if (successCount > 0) {
      toast.success(`${successCount} acesso(s) criado(s) com sucesso!`);
    }
  };

  const copyAllCredentials = () => {
    const successResults = results.filter((r) => r.status === "success");
    if (successResults.length === 0) return;

    const today = new Date().toLocaleDateString("pt-BR");
    const lines = successResults.map(
      (r) => `Nome: ${r.person.name}\nE-mail: ${r.person.email}\nSenha: ${tempPassword}`
    );

    const text = `Portal PJ - Decoding\nAcessos criados em ${today}\n\n---\n${lines.join("\n\n")}\n---\n\nLink: ${window.location.origin}/portal-pj\nPor favor, alterem a senha no primeiro acesso.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Credenciais copiadas!");
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (processing) return;
    setOpen(isOpen);
    if (!isOpen) {
      setSelectedIds(new Set());
      setTempPassword("Portal2025!");
      setResults([]);
      setCurrentIndex(0);
      setCopied(false);
    }
  };

  const totalSelected = selectedIds.size;
  const progressPercent = totalSelected > 0 ? (currentIndex / totalSelected) * 100 : 0;
  const done = results.length > 0 && !processing;
  const successCount = results.filter((r) => r.status === "success").length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UsersRound className="h-4 w-4" />
          Acessos em Massa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Criar Acessos em Massa</DialogTitle>
          <DialogDescription>
            Selecione os prestadores PJ para criar acesso ao portal de uma vez.
          </DialogDescription>
        </DialogHeader>

        {!done ? (
          <div className="space-y-4 flex-1 min-h-0 flex flex-col">
            {/* Password */}
            <div className="space-y-2">
              <Label>Senha temporária (para todos)</Label>
              <Input
                type="text"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                disabled={processing}
              />
            </div>

            {/* Select all */}
            {eligiblePeople.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedIds.size === eligiblePeople.length && eligiblePeople.length > 0}
                  onCheckedChange={toggleAll}
                  disabled={processing}
                  id="select-all-pj"
                />
                <Label className="cursor-pointer text-sm" htmlFor="select-all-pj">
                  Selecionar todos ({eligiblePeople.length})
                </Label>
              </div>
            )}

            {/* People list */}
            <ScrollArea className="flex-1 min-h-0 border rounded-md">
              <div className="p-2 space-y-1">
                {eligiblePeople.length === 0 && noEmailPeople.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Todos os prestadores PJ já possuem acesso ao portal.
                  </p>
                )}
                {eligiblePeople.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent cursor-pointer"
                    onClick={(e) => {
                      // Prevent double-toggle when clicking directly on checkbox
                      if ((e.target as HTMLElement).closest('button')) return;
                      if (!processing) togglePerson(p.id);
                    }}
                  >
                    <Checkbox
                      checked={selectedIds.has(p.id)}
                      onCheckedChange={() => togglePerson(p.id)}
                      disabled={processing}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-light truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                    </div>
                  </div>
                ))}
                {noEmailPeople.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-md px-2 py-1.5 opacity-50"
                  >
                    <Checkbox disabled checked={false} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-light truncate">{p.name}</p>
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Sem e-mail cadastrado
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Progress */}
            {processing && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando {currentIndex} de {totalSelected}...
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            )}

            <Button
              onClick={handleProcess}
              disabled={processing || totalSelected === 0 || !tempPassword}
              className="w-full"
            >
              {processing ? "Processando..." : `Criar ${totalSelected} Acesso(s)`}
            </Button>
          </div>
        ) : (
          /* Results */
          <div className="space-y-4 flex-1 min-h-0 flex flex-col">
            <div className="flex items-center gap-2">
              <Badge variant={successCount > 0 ? "default" : "destructive"}>
                {successCount} criado(s)
              </Badge>
              {results.filter((r) => r.status === "error").length > 0 && (
                <Badge variant="destructive">
                  {results.filter((r) => r.status === "error").length} erro(s)
                </Badge>
              )}
              {results.filter((r) => r.status === "already_exists").length > 0 && (
                <Badge variant="secondary">
                  {results.filter((r) => r.status === "already_exists").length} já existente(s)
                </Badge>
              )}
            </div>

            <ScrollArea className="flex-1 min-h-0 max-h-[300px] border rounded-md">
              <div className="p-2 space-y-1">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-md px-2 py-1.5">
                    {r.status === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    ) : r.status === "already_exists" ? (
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-light truncate">{r.person.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {successCount > 0 && (
              <Button onClick={copyAllCredentials} variant="outline" className="w-full gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado!" : "Copiar Todas as Credenciais"}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}



