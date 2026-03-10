import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/contexts/AuthContext";
import { ClientProvider } from "@/components/contexts/ClientContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { RoleGuard } from "@/components/layout/RoleGuard";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import CfoDigital from "./pages/CfoDigital";
import EmissaoNotas from "./pages/EmissaoNotas";
import RecebimentoNotas from "./pages/RecebimentoNotas";
import EnviarNota from "./pages/EnviarNota";
import EnviarNfPj from "./pages/EnviarNfPj";
import CustosFixos from "./pages/CustosFixos";
import Pessoas from "./pages/Pessoas";
import FolhaPagamento from "./pages/FolhaPagamento";
import ProjecaoCaixa from "./pages/ProjecaoCaixa";
import Reembolsos from "./pages/Reembolsos";
import SolicitarReembolso from "./pages/SolicitarReembolso";
import DashboardOperacional from "./pages/DashboardOperacional";
import DashboardEstrategico from "./pages/DashboardEstrategico";
import Alertas from "./pages/Alertas";
import Configuracoes from "./pages/Configuracoes";
import PortalPjAuth from "./pages/PortalPjAuth";
import PortalPjDashboard from "./pages/PortalPjDashboard";
import PortalPjResetPassword from "./pages/PortalPjResetPassword";
import ContratosInteligentes from "./pages/ContratosInteligentes";
import ConciliacaoBancaria from "./pages/ConciliacaoBancaria";
import Rpa from "./pages/Rpa";
import ContasPagar from "./pages/ContasPagar";
import ContasReceber from "./pages/ContasReceber";
import Clientes from "./pages/Clientes";
import ConfiguracaoWhiteLabel from "./pages/ConfiguracaoWhiteLabel";
import Fornecedores from "./pages/Fornecedores";
import Lancamentos from "./pages/Lancamentos";
import CentroCustos from "./pages/CentroCustos";
import Categorias from "./pages/Categorias";
import Planejamentos from "./pages/Planejamentos";
import ClientesContabilidade from "./pages/ClientesContabilidade";
import ContasBancarias from "./pages/ContasBancarias";
import Overview from "./pages/Overview";
import SystemGuide from "./pages/SystemGuide";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-navy">
        <div className="text-white/60 text-sm">Carregando...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <AppLayout />;
}

function ProtectedPjRoute() {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="text-muted-foreground text-sm">Carregando...</div></div>;
  if (!session) return <Navigate to="/portal-pj" replace />;
  return <PortalPjDashboard />;
}

const App = () => {
  return (

    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ClientProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* ... routes ... */}
                <Route path="/auth" element={<AuthRedirect />} />
                <Route path="/enviar-nota" element={<EnviarNota />} />
                <Route path="/enviar-nf-pj" element={<EnviarNfPj />} />
                <Route path="/solicitar-reembolso" element={<SolicitarReembolso />} />
                <Route path="/portal-pj" element={<PortalPjAuth />} />
                <Route path="/portal-pj/reset-password" element={<PortalPjResetPassword />} />
                <Route path="/portal-pj/dashboard" element={<ProtectedPjRoute />} />
                <Route element={<ProtectedRoutes />}>
                  <Route path="/overview" element={<Overview />} />
                  <Route path="/guia" element={<SystemGuide />} />
                  <Route path="/" element={<Index />} />
                  <Route path="/cfo-digital" element={<RoleGuard path="/cfo-digital"><CfoDigital /></RoleGuard>} />
                  <Route path="/emissao-notas" element={<EmissaoNotas />} />
                  <Route path="/recebimento-notas" element={<RecebimentoNotas />} />
                  <Route path="/custos-fixos" element={<CustosFixos />} />
                  <Route path="/pessoas" element={<Pessoas />} />
                  <Route path="/folha-pagamento" element={<FolhaPagamento />} />
                  <Route path="/projecao-caixa" element={<RoleGuard path="/projecao-caixa"><ProjecaoCaixa /></RoleGuard>} />
                  <Route path="/reembolsos" element={<Reembolsos />} />
                  <Route path="/dashboard/operacional" element={<DashboardOperacional />} />
                  <Route path="/dashboard/estrategico" element={<RoleGuard path="/dashboard/estrategico"><DashboardEstrategico /></RoleGuard>} />
                  <Route path="/contratos" element={<ContratosInteligentes />} />
                  <Route path="/financeiro/contas-pagar" element={<ContasPagar />} />
                  <Route path="/financeiro/contas-receber" element={<ContasReceber />} />
                  <Route path="/financeiro/rpa" element={<Rpa />} />
                  <Route path="/financeiro/conciliacao" element={<ConciliacaoBancaria />} />
                  <Route path="/financeiro/lancamentos" element={<Lancamentos />} />
                  <Route path="/financeiro/categorias" element={<Categorias />} />
                  <Route path="/financeiro/centro-custos" element={<CentroCustos />} />
                  <Route path="/financeiro/planejamentos" element={<Planejamentos />} />
                  <Route path="/financeiro/faturados" element={<ClientesContabilidade />} />
                  <Route path="/financeiro/contas-bancarias" element={<ContasBancarias />} />
                  <Route path="/geral/clientes" element={<Clientes />} />
                  <Route path="/geral/fornecedores" element={<Fornecedores />} />
                  <Route path="/configuracao-whitelabel" element={<ConfiguracaoWhiteLabel />} />
                  <Route path="/alertas" element={<Alertas />} />
                  <Route path="/configuracoes" element={<RoleGuard path="/configuracoes"><Configuracoes /></RoleGuard>} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ClientProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

function AuthRedirect() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/" replace />;
  return <Auth />;
}

export default App;
