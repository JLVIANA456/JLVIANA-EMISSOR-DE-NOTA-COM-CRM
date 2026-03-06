import { useState } from "react";
import {
  FileSignature, Bot, Search, Send, Zap,
  CheckCircle2, FileStack
} from "lucide-react";
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
    value: "templates",
    icon: FileStack,
    label: "Modelos",
    desc: "Gerencie seus templates",
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
    <div className="flex flex-col lg:flex-row min-h-screen bg-muted/5 gap-6 p-6">
      
      {/* ── Sidebar de Navegação ─────────────────────────────────────────── */}
      <aside className="w-full lg:w-64 flex-shrink-0 space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
            <FileSignature className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Contratos
            </h1>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
              Inteligentes
            </p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`
                  text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 group relative overflow-hidden
                  ${isActive
                    ? "bg-white text-primary shadow-sm ring-1 ring-primary/10 font-medium"
                    : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                  }
                `}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />}
                <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary/70"}`} />
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Badge Clicksign */}
        <div className="mx-2 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-emerald-700 font-medium text-xs uppercase tracking-wider">
            <CheckCircle2 className="h-3 w-3" />
            Integração Ativa
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Seus contratos são assinados digitalmente via Clicksign com validade jurídica.
          </p>
        </div>
      </aside>

      {/* ── Área de Conteúdo ─────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0">
        <div className="animate-in fade-in duration-300 slide-in-from-bottom-4 h-full">
          {activeTab === "gerador" && <ContractGenerator onNavigate={setActiveTab} />}
          {activeTab === "templates" && <ContractTemplates />}
          {activeTab === "assistente" && <LegalAssistant />}
          {activeTab === "analise" && <ContractAnalysis />}
          {activeTab === "assinatura" && <ContractSignature />}
        </div>
      </main>

    </div>
  );
}
