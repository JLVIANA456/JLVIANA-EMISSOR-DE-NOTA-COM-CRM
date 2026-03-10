import { useState } from "react";
import {
  Bell, AlertTriangle, AlertCircle, Info, ExternalLink, X,
  BellOff, CheckCheck, Filter, RefreshCw, ShieldAlert,
  CheckCircle2, Clock, Landmark, Search
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useUnifiedAlerts, UnifiedAlert } from "@/hooks/useUnifiedAlerts";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// ─── Configuração visual por severidade ───────────────────────────────────────
const SEVERITY_CONFIG = {
  critical: {
    label: "Crítico",
    icon: AlertTriangle,
    cardBg: "bg-rose-50 border-rose-200",
    iconBg: "bg-rose-100 text-rose-600",
    dot: "bg-rose-500",
    badge: "bg-rose-100 text-rose-700 border-rose-200",
    glow: "shadow-rose-100",
  },
  warning: {
    label: "Aviso",
    icon: AlertCircle,
    cardBg: "bg-amber-50 border-amber-200",
    iconBg: "bg-amber-100 text-amber-600",
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    glow: "shadow-amber-100",
  },
  info: {
    label: "Info",
    icon: Info,
    cardBg: "bg-blue-50 border-blue-200",
    iconBg: "bg-blue-100 text-blue-600",
    dot: "bg-blue-400",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    glow: "shadow-blue-100",
  },
};

// ─── Componente principal ─────────────────────────────────────────────────────
const Alertas = () => {
  const { alerts, counts, modules, dismissAlert, clearDismissed } = useUnifiedAlerts();
  const navigate = useNavigate();
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = alerts.filter(a => {
    if (severityFilter !== "all" && a.severity !== severityFilter) return false;
    if (moduleFilter !== "all" && a.module !== moduleFilter) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) &&
      !a.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDismiss = (id: string) => {
    dismissAlert(id);
  };

  const handleDismissAll = () => {
    filtered.forEach(a => dismissAlert(a.id));
  };

  const handleClearDismissed = () => {
    clearDismissed();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between flex-wrap gap-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20 relative">
            <Bell className="h-6 w-6" />
            {counts.total > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-rose-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow">
                {counts.total > 99 ? "99+" : counts.total}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-light tracking-tight text-foreground">Alertas & Notificações</h1>
            <div className="flex items-center gap-2 mt-1">
              <ShieldAlert className="h-3 w-3 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em]">
                Central de monitoramento — {counts.total} alerta{counts.total !== 1 ? "s" : ""} ativo{counts.total !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-light text-muted-foreground hover:text-primary gap-2"
            onClick={handleClearDismissed}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Restaurar dispensados
          </Button>
          {filtered.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-medium text-muted-foreground hover:text-primary gap-2"
              onClick={handleDismissAll}
            >
              <CheckCheck className="h-4 w-4" />
              Dispensar todos visíveis
            </Button>
          )}
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", count: counts.total, value: "all", color: "text-foreground", bg: "bg-primary/5", border: "border-primary/20" },
          { label: "Críticos", count: counts.critical, value: "critical", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
          { label: "Avisos", count: counts.warning, value: "warning", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
          { label: "Informações", count: counts.info, value: "info", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
        ].map(card => (
          <button
            key={card.value}
            onClick={() => setSeverityFilter(card.value)}
            className={cn(
              "rounded-2xl border p-5 text-left transition-all duration-200 hover:shadow-md group",
              card.bg, card.border,
              severityFilter === card.value ? "ring-2 ring-primary shadow-sm scale-[1.02]" : "hover:scale-[1.01]"
            )}
          >
            <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/70 mb-2">{card.label}</p>
            <p className={cn("text-3xl font-light tracking-tight", card.color)}>{card.count}</p>
            {severityFilter === card.value && (
              <div className="mt-2 h-0.5 w-full bg-primary/30 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* ── Filtros ────────────────────────────────────────────────────── */}
      <Card className="bg-card/50 backdrop-blur-md border-border/60 shadow-sm rounded-2xl">
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="text-[10px] uppercase font-bold tracking-widest">Filtrar</span>
          </div>

          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder="Buscar alerta..."
              className="pl-10 bg-muted/30 border-border/50 font-light text-xs h-9 rounded-xl"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-52 h-9 text-xs font-light rounded-xl border-border/50 bg-muted/30">
              <SelectValue placeholder="Todos os módulos" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Todos os módulos</SelectItem>
              {modules.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(severityFilter !== "all" || moduleFilter !== "all" || search) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground gap-1.5 h-9"
              onClick={() => { setSeverityFilter("all"); setModuleFilter("all"); setSearch(""); }}
            >
              <X className="h-3 w-3" /> Limpar filtros
            </Button>
          )}

          <span className="ml-auto text-[10px] text-muted-foreground font-light">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </span>
        </CardContent>
      </Card>

      {/* ── Lista de Alertas ───────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <Card className="bg-card/50 border-border/40 rounded-3xl shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-5">
              <BellOff className="h-8 w-8" />
            </div>
            <p className="text-base font-light text-foreground">Nenhum alerta encontrado</p>
            <p className="text-xs text-muted-foreground font-light mt-1 max-w-xs">
              {alerts.length === 0
                ? "Todos os módulos estão em ordem. Nenhuma ação necessária."
                : "Nenhum alerta corresponde aos filtros selecionados."}
            </p>
            {(severityFilter !== "all" || moduleFilter !== "all" || search) && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 text-xs rounded-xl"
                onClick={() => { setSeverityFilter("all"); setModuleFilter("all"); setSearch(""); }}
              >
                Limpar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Agrupado por módulo */}
          {(() => {
            const byModule: Record<string, UnifiedAlert[]> = {};
            for (const alert of filtered) {
              if (!byModule[alert.module]) byModule[alert.module] = [];
              byModule[alert.module].push(alert);
            }
            return Object.entries(byModule).map(([module, moduleAlerts]) => (
              <div key={module} className="space-y-2">
                {/* Cabeçalho do grupo */}
                <div className="flex items-center gap-3 px-1">
                  <div className="h-px flex-1 bg-border/40" />
                  <div className="flex items-center gap-2">
                    <Landmark className="h-3 w-3 text-muted-foreground/60" />
                    <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">
                      {module}
                    </span>
                    <Badge variant="outline" className="text-[8px] h-4 px-1.5 font-bold border-border/40">
                      {moduleAlerts.length}
                    </Badge>
                  </div>
                  <div className="h-px flex-1 bg-border/40" />
                </div>
                {/* Cards do grupo */}
                {moduleAlerts.map(alert => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onNavigate={link => navigate(link)}
                    onDismiss={() => handleDismiss(alert.id)}
                  />
                ))}
              </div>
            ));
          })()}
        </div>
      )}
    </div>
  );
};

// ─── Card individual de alerta ────────────────────────────────────────────────
function AlertCard({
  alert,
  onNavigate,
  onDismiss,
}: {
  alert: UnifiedAlert;
  onNavigate: (link: string) => void;
  onDismiss: () => void;
}) {
  const config = SEVERITY_CONFIG[alert.severity];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 group/alert animate-in fade-in slide-in-from-left-2 shadow-sm",
        config.cardBg,
        config.glow
      )}
    >
      {/* Ícone */}
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", config.iconBg)}>
        <Icon className="h-5 w-5" />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dot)} />
          <p className="text-sm font-medium text-foreground tracking-tight">{alert.title}</p>
          <Badge className={cn("text-[8px] h-4 px-1.5 font-bold border ml-auto rounded-full", config.badge)}>
            {config.label}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground font-light leading-relaxed ml-3.5">
          {alert.description}
        </p>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-1 shrink-0">
        {alert.link && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl opacity-0 group-hover/alert:opacity-100 transition-all hover:bg-white/60"
            onClick={() => onNavigate(alert.link!)}
            title="Ir para módulo"
          >
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-xl opacity-0 group-hover/alert:opacity-100 transition-all hover:bg-white/60"
          onClick={onDismiss}
          title="Marcar como lido"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}

export default Alertas;
