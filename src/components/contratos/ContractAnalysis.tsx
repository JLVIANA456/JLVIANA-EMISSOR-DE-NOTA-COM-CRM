import { useState } from "react";
import { useAuth } from "@/components/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Upload, FileSearch, CheckCircle2, XCircle, AlertTriangle,
  Loader2, Trash2, Eye, ShieldCheck, ShieldAlert, ShieldX, Info
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ChecklistItem = {
  id: string;
  found: boolean;
  status: "compliant" | "partial" | "missing" | "risk";
  details: string;
  recommendation?: string;
};

type AnalysisResult = {
  summary: string;
  contract_type_detected: string;
  parties: string[];
  checklist: ChecklistItem[];
  risks: string[];
  strengths: string[];
};

const CHECKLIST_LABELS: Record<string, string> = {
  objeto: "Objeto/Escopo",
  valor: "Valor e Pagamento",
  prazo: "Prazo/Vigência",
  rescisao: "Rescisão",
  confidencialidade: "Confidencialidade/NDA",
  propriedade_intelectual: "Propriedade Intelectual",
  lgpd: "LGPD/Proteção de Dados",
  nao_vinculo: "Não Vínculo Empregatício",
  multa: "Multa/Penalidade",
  foro: "Foro",
  exclusividade: "Exclusividade",
  anticorrupcao: "Anticorrupção",
};

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "compliant":
      return <CheckCircle2 className="h-4 w-4 text-primary" />;
    case "partial":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case "risk":
      return <ShieldAlert className="h-4 w-4 text-orange-500" />;
    case "missing":
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Info className="h-4 w-4 text-muted-foreground" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    compliant: { label: "Conforme", className: "bg-secondary text-primary dark:bg-primary dark:text-secondary" },
    partial: { label: "Parcial", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
    risk: { label: "Risco", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
    missing: { label: "Ausente", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  };
  const v = variants[status] || { label: status, className: "" };
  return <span className={`text-xs font-light px-2 py-0.5 rounded-full ${v.className}`}>{v.label}</span>;
}

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? "text-primary" : score >= 60 ? "text-yellow-500" : score >= 40 ? "text-orange-500" : "text-red-500";
  const bgColor = score >= 80 ? "bg-primary" : score >= 60 ? "bg-yellow-500" : score >= 40 ? "bg-orange-500" : "bg-red-500";
  const label = score >= 80 ? "Excelente" : score >= 60 ? "Bom" : score >= 40 ? "Atenção" : "Crítico";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`text-5xl font-light ${color}`}>{score}</div>
      <Progress value={score} className="w-32 h-2" />
      <Badge variant="outline" className={`${color}`}>{label}</Badge>
    </div>
  );
}

export function ContractAnalysis() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);

  const { data: analyses = [], isLoading } = useQuery({
    queryKey: ["contract-analyses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contract_analyses")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("Arquivo muito grande. Máximo 10MB.");
      return;
    }

    setUploading(true);
    try {
      // Upload file to storage
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("contract-documents")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("contract-documents")
        .getPublicUrl(filePath);

      // Create analysis record
      const { data: analysis, error: insertError } = await supabase
        .from("contract_analyses")
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_url: urlData.publicUrl,
          status: "pendente",
        })
        .select()
        .single();
      if (insertError) throw insertError;

      toast.success("Arquivo enviado! Iniciando análise...");
      queryClient.invalidateQueries({ queryKey: ["contract-analyses"] });

      // Trigger analysis
      const resp = await fetch(
        `${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/analyze-contract`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            analysisId: analysis.id,
            fileUrl: urlData.publicUrl,
            fileName: file.name,
          }),
        }
      );

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Erro ${resp.status}`);
      }

      toast.success("Análise concluída!");
      queryClient.invalidateQueries({ queryKey: ["contract-analyses"] });
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("contract_analyses").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir análise");
    } else {
      toast.success("Análise excluída");
      queryClient.invalidateQueries({ queryKey: ["contract-analyses"] });
    }
  };

  const selected = analyses.find((a: any) => a.id === selectedAnalysis);
  const analysisResult = selected?.analysis_result as AnalysisResult | null;

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FileSearch className="h-5 w-5 text-primary" /> Análise de Contratos
              </CardTitle>
              <CardDescription>
                Faça upload de contratos para análise automática de compliance com checklist e score
              </CardDescription>
            </div>
            <div>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleUpload}
                className="hidden"
                id="contract-upload"
                disabled={uploading}
              />
              <label htmlFor="contract-upload">
                <Button asChild variant="default" disabled={uploading}>
                  <span>
                    {uploading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analisando...</>
                    ) : (
                      <><Upload className="h-4 w-4 mr-2" /> Upload Contrato</>
                    )}
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Analyses list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : analyses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileSearch className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-light">Nenhuma análise realizada</p>
            <p className="text-muted-foreground/60 text-sm mt-1">
              Faça upload de um contrato PDF, DOC ou TXT para iniciar a análise automática
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {analyses.map((analysis: any) => {
            const result = analysis.analysis_result as AnalysisResult | null;
            const score = analysis.compliance_score;
            const statusMap: Record<string, { label: string; icon: React.ReactNode }> = {
              pendente: { label: "Pendente", icon: <Loader2 className="h-4 w-4 animate-spin" /> },
              processando: { label: "Processando...", icon: <Loader2 className="h-4 w-4 animate-spin" /> },
              concluido: {
                label: "Concluído",
                icon: score != null && score >= 70 ? <ShieldCheck className="h-4 w-4 text-primary" /> : <ShieldX className="h-4 w-4 text-orange-500" />,
              },
              erro: { label: "Erro", icon: <XCircle className="h-4 w-4 text-red-500" /> },
            };
            const s = statusMap[analysis.status] || statusMap.pendente;

            return (
              <Card key={analysis.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {s.icon}
                    <div className="min-w-0">
                      <p className="font-light text-sm truncate">{analysis.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(analysis.created_at).toLocaleDateString("pt-BR")}
                        {result?.contract_type_detected && ` • ${result.contract_type_detected}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {score != null && (
                      <div className="text-right">
                        <span className={`text-lg font-light ${score >= 80 ? "text-primary" : score >= 60 ? "text-yellow-500" : score >= 40 ? "text-orange-500" : "text-red-500"}`}>
                          {score}
                        </span>
                        <span className="text-xs text-muted-foreground">/100</span>
                      </div>
                    )}
                    {analysis.status === "concluido" && (
                      <Button variant="outline" size="sm" onClick={() => setSelectedAnalysis(analysis.id)}>
                        <Eye className="h-4 w-4 mr-1" /> Ver
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(analysis.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Analysis Detail Dialog */}
      <Dialog open={!!selectedAnalysis} onOpenChange={(open) => !open && setSelectedAnalysis(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSearch className="h-5 w-5" /> Resultado da Análise
            </DialogTitle>
          </DialogHeader>
          {selected && analysisResult && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Score */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-light">{selected.file_name}</h3>
                    <p className="text-sm text-muted-foreground">{analysisResult.contract_type_detected}</p>
                    {analysisResult.parties?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Partes: {analysisResult.parties.join(" • ")}
                      </p>
                    )}
                  </div>
                  <ScoreGauge score={selected.compliance_score ?? 0} />
                </div>

                {/* Summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Resumo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{analysisResult.summary}</p>
                  </CardContent>
                </Card>

                {/* Compliance Checklist */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Checklist de Compliance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {analysisResult.checklist?.map((item) => (
                      <div key={item.id} className="border rounded-lg p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <StatusIcon status={item.status} />
                            <span className="text-sm font-light">{CHECKLIST_LABELS[item.id] || item.id}</span>
                          </div>
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="text-xs text-muted-foreground pl-6">{item.details}</p>
                        {item.recommendation && (
                          <p className="text-xs text-primary pl-6">💡 {item.recommendation}</p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Risks & Strengths */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-1">
                        <ShieldAlert className="h-4 w-4 text-orange-500" /> Riscos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {analysisResult.risks?.map((risk, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex gap-1">
                            <span className="text-orange-500">•</span> {risk}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-1">
                        <ShieldCheck className="h-4 w-4 text-primary" /> Pontos Fortes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {analysisResult.strengths?.map((s, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex gap-1">
                            <span className="text-primary">•</span> {s}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}



