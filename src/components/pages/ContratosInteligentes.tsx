import { useState } from "react";
import {
  FileSignature, Bot, Search, Send, Zap,
  CheckCircle2, ChevronRight
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContractGenerator } from "@/components/contratos/ContractGenerator";
import { ContractTemplates } from "@/components/contratos/ContractTemplates";
import { LegalAssistant } from "@/components/contratos/LegalAssistant";
import { ContractAnalysis } from "@/components/contratos/ContractAnalysis";
import { ContractSignature } from "@/components/contratos/ContractSignature";

const TABS = [
  {
    value: "gerador",
    icon: Zap,
    label: "Gerador",
    desc: "Crie contratos com IA",
  },
  {
    value: "assistente",
    icon: Bot,
    label: "Assistente Jurídico",
    desc: "Analise e revise cláusulas",
  },
  {
    value: "analise",
    icon: Search,
    label: "Análise",
    desc: "Score de compliance",
  },
  {
    value: "assinatura",
    icon: Send,
    label: "Assinatura Digital",
    desc: "Via Clicksign",
  },
];

export default function ContratosInteligentes() {
  const [activeTab, setActiveTab] = useState("gerador");

  return (
    <div className="space-y-6 pb-16">

      {/* ── Header compacto ──────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
            <FileSignature className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-light tracking-tight text-foreground">
              Contratos Inteligentes
            </h1>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em] mt-0.5">
              Geração · Análise · Revisão jurídica · Assinatura digital
            </p>
          </div>
        </div>

        {/* Badge Clicksign — discreto */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-700">
            Clicksign integrado
          </span>
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
        </div>
      </div>

      {/* ── Tabs de navegação ─────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>

        {/* Nav de cards clicáveis */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`
                  text-left p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3 group
                  ${isActive
                    ? "bg-white border-primary/30 shadow-sm ring-1 ring-primary/20"
                    : "bg-card/50 border-border/40 hover:bg-white hover:shadow-sm hover:border-border/70"
                  }
                `}
              >
                <div className={`
                  h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors
                  ${isActive ? "bg-primary/10 text-primary" : "bg-muted/60 text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary/70"}
                `}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold truncate transition-colors ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                    {tab.label}
                  </p>
                  <p className="text-[9px] text-muted-foreground/70 font-light mt-0.5 truncate">
                    {tab.desc}
                  </p>
                </div>
                {isActive && <ChevronRight className="h-3.5 w-3.5 text-primary/50 shrink-0 mt-0.5" />}
              </button>
            );
          })}
        </div>

        {/* Linha separadora sutil */}
        <div className="h-px bg-border/40" />

        {/* Conteúdo das tabs */}
        <TabsContent value="gerador" className="mt-0 animate-in fade-in duration-300">
          <ContractGenerator />
        </TabsContent>

        <TabsContent value="assistente" className="mt-0 animate-in fade-in duration-300">
          <LegalAssistant />
        </TabsContent>

        <TabsContent value="analise" className="mt-0 animate-in fade-in duration-300">
          <ContractAnalysis />
        </TabsContent>

        <TabsContent value="assinatura" className="mt-0 animate-in fade-in duration-300">
          <ContractSignature />
        </TabsContent>
      </Tabs>

      {/* ── Templates — isolado em seção própria ─────────────────────────── */}
      <div className="pt-4 border-t border-border/30">
        <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/50 mb-4">
          Modelos de Contrato
        </p>
        <ContractTemplates />
      </div>

    </div>
  );
}
