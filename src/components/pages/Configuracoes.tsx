import { Settings, RefreshCw, CheckCircle2, XCircle, Clock, Database, Users, Building2, Tag, Landmark, FileDown, Eye, EyeOff, Key } from "lucide-react";
import { generateTechDoc } from "@/lib/generateTechDoc";
import { useGranatum } from "@/hooks/useGranatum";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

const Configuracoes = () => {
  const {
    contas,
    lancamentos,
    categorias,
    centrosCusto,
    clientes,
    fornecedores,
    syncLogs,
    lastSync,
    isSyncing,
    sync,
  } = useGranatum();

  const { settings, updateSettings, isLoading: isLoadingSettings } = useSettings();
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (settings?.openai_api_key) {
      setApiKey(settings.openai_api_key);
    }
  }, [settings]);

  const handleSaveApiKey = () => {
    updateSettings.mutate({ openai_api_key: apiKey });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Nunca";
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const stats = [
    { icon: Landmark, label: "Contas Bancárias", count: contas.length },
    { icon: Database, label: "Lançamentos", count: lancamentos.length },
    { icon: Tag, label: "Categorias", count: categorias.length },
    { icon: Building2, label: "Centros de Custo", count: centrosCusto.length },
    { icon: Users, label: "Clientes", count: clientes.length },
    { icon: Users, label: "Fornecedores", count: fornecedores.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-light tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground">Integrações, permissões e preferências do sistema</p>
        </div>
      </div>

      {/* OpenAI Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Key className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Configuração OpenAI</CardTitle>
              <CardDescription>
                Personalize sua chave de API para as funcionalidades de Inteligência Artificial
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-light text-muted-foreground">OpenAI API Key</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button 
                onClick={handleSaveApiKey} 
                disabled={updateSettings.isPending}
              >
                {updateSettings.isPending ? "Salvando..." : "Salvar Chave"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground font-light">
              Sua chave é armazenada de forma segura e usada apenas para as requisições de IA deste painel. 
              Caso não seja informada, o sistema usará a chave padrão.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tech Doc Export */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-lg">Documentação Técnica</CardTitle>
            <p className="text-sm text-muted-foreground">Baixe um documento Word com toda a composição técnica do sistema</p>
          </div>
          <Button onClick={generateTechDoc} variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" />
            Baixar .docx
          </Button>
        </CardHeader>
      </Card>

      {/* Granatum Integration */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              Integração Granatum
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Sincronização de dados financeiros via API REST
            </p>
          </div>
          <Badge variant="outline" className="border-primary/30 text-primary">
            Conectado
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Última sincronização:</span>
              <span className="font-light">{formatDate(lastSync)}</span>
            </div>
            <Button onClick={sync} disabled={isSyncing} size="sm" variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Sincronizando..." : "Sincronizar Agora"}
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg border p-3 text-center space-y-1">
                <stat.icon className="h-4 w-4 mx-auto text-muted-foreground" />
                <p className="text-2xl font-light">{stat.count}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Sync History */}
          {syncLogs.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-light text-muted-foreground">Histórico de sincronizações</h4>
              <div className="space-y-1">
                {syncLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      {log.status === "success" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-destructive" />
                      )}
                      <span>{log.endpoint}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>{log.records_synced} registros</span>
                      <span>
                        {new Date(log.started_at).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Configuracoes;



