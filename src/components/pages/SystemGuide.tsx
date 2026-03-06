import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BookOpen, 
  CheckCircle2, 
  Users, 
  Landmark, 
  FileText, 
  Wallet, 
  TrendingUp, 
  FileSignature, 
  ArrowRight,
  Lightbulb,
  AlertTriangle
} from "lucide-react";

export default function SystemGuide() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-light tracking-tight text-foreground">Guia do Sistema</h1>
        <p className="text-muted-foreground font-light">Manual completo de operação e BPO Financeiro.</p>
      </div>

      <Tabs defaultValue="bpo" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px] h-12 bg-muted/20 p-1 rounded-xl">
          <TabsTrigger value="bpo" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">BPO Passo a Passo</TabsTrigger>
          <TabsTrigger value="modulos" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Módulos</TabsTrigger>
          <TabsTrigger value="dicas" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Dicas & Truques</TabsTrigger>
          <TabsTrigger value="faq" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">FAQ</TabsTrigger>
        </TabsList>

        {/* ── BPO Workflow ──────────────────────────────────────────────── */}
        <TabsContent value="bpo" className="space-y-6 mt-6">
          <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Fluxo de Trabalho BPO Financeiro
              </CardTitle>
              <CardDescription>Roteiro prático para execução do BPO de um cliente, do início ao fechamento mensal.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                
                <AccordionItem value="item-1">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">1</div>
                      <div>
                        <div className="font-medium">Onboarding do Cliente</div>
                        <div className="text-xs text-muted-foreground font-light">Configuração inicial obrigatória</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-11 space-y-3 text-sm text-muted-foreground">
                    <p>Antes de iniciar os lançamentos, é crucial configurar o ambiente do cliente:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong>Cadastro de Pessoas:</strong> Vá em <em>Pessoas & DP</em> e cadastre o cliente como "Cliente" (PJ). Cadastre também os sócios.</li>
                      <li><strong>Contas Bancárias:</strong> Em <em>Financeiro > Contas Bancárias</em>, cadastre todas as contas correntes e cartões de crédito. Defina o saldo inicial correto.</li>
                      <li><strong>Centro de Custos & Categorias:</strong> Revise o plano de contas em <em>Geral > Categorias</em>. Adapte conforme a necessidade do cliente.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">2</div>
                      <div>
                        <div className="font-medium">Rotina Diária (Operacional)</div>
                        <div className="text-xs text-muted-foreground font-light">Processamento de contas a pagar e receber</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-11 space-y-3 text-sm text-muted-foreground">
                    <p>O coração do BPO. Deve ser feito diariamente ou conforme contrato:</p>
                    <ol className="list-decimal pl-4 space-y-2">
                      <li><strong>Verificar Extratos:</strong> Acesse o banco do cliente (ou use a integração automática se ativa).</li>
                      <li><strong>Conciliação Bancária:</strong> Vá em <em>Financeiro > Conciliação</em>. O sistema tentará casar lançamentos com o extrato.
                        <ul className="list-disc pl-4 mt-1 text-xs">
                          <li>Se o lançamento existe: <strong>Concilie</strong>.</li>
                          <li>Se não existe: Crie o lançamento diretamente na tela de conciliação.</li>
                        </ul>
                      </li>
                      <li><strong>Agendamento de Pagamentos:</strong> Em <em>Contas a Pagar</em>, lance as contas futuras (boletos, impostos). Envie o comprovante ou arquivo de remessa ao banco se aplicável.</li>
                      <li><strong>Baixa de Recebimentos:</strong> Em <em>Contas a Receber</em>, dê baixa no que entrou. Use a conciliação para facilitar.</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <div className="h-8 w-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-xs">3</div>
                      <div>
                        <div className="font-medium">Emissão Fiscal</div>
                        <div className="text-xs text-muted-foreground font-light">Notas fiscais de serviço</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-11 space-y-3 text-sm text-muted-foreground">
                    <p>Para clientes de serviço:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Acesse <em>Fiscal > Emissão de Notas</em>.</li>
                      <li>Selecione o cliente tomador (verifique se o cadastro está completo: CNPJ, Endereço).</li>
                      <li>Descreva o serviço e valores. O sistema calculará os impostos se configurado.</li>
                      <li>Clique em <strong>Emitir</strong>. A nota será enviada à prefeitura (integração via e-Notas ou manual).</li>
                      <li>O sistema gera automaticamente o <em>Conta a Receber</em> vinculado.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <div className="h-8 w-8 rounded-full bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center font-bold text-xs">4</div>
                      <div>
                        <div className="font-medium">Fechamento Mensal</div>
                        <div className="text-xs text-muted-foreground font-light">Relatórios e entrega de valor</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-11 space-y-3 text-sm text-muted-foreground">
                    <p>Ao final do mês, após conciliar todas as contas:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong>Auditoria de Saldos:</strong> Verifique se o saldo final de cada conta no sistema bate exatamente com o extrato bancário.</li>
                      <li><strong>Categorização:</strong> Revise lançamentos "Sem Categoria" ou "Outros". Classifique corretamente para garantir relatórios precisos.</li>
                      <li><strong>Relatórios CFO:</strong> Vá em <em>Financeiro > CFO Digital</em>.
                        <ul className="list-disc pl-4 mt-1 text-xs">
                           <li>Gere o DRE (Demonstrativo de Resultado).</li>
                           <li>Analise o Fluxo de Caixa.</li>
                           <li>Exporte os relatórios em PDF e envie ao cliente com seus comentários.</li>
                        </ul>
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Modules Guide ─────────────────────────────────────────────── */}
        <TabsContent value="modulos" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="hover:shadow-md transition-all cursor-default">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-blue-500"/> Geral & Cadastros</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Gestão da base de dados. Mantenha <strong>Clientes</strong> e <strong>Fornecedores</strong> sempre atualizados com CNPJ e dados bancários para agilizar os pagamentos.
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all cursor-default">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Wallet className="h-4 w-4 text-green-500"/> Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Módulo principal. 
                <br/><strong>Contas a Pagar/Receber:</strong> Lançamentos futuros.
                <br/><strong>Conciliação:</strong> Conferência com o banco.
                <br/><strong>Custos Fixos:</strong> Controle de recorrentes (Aluguel, Luz).
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all cursor-default">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-orange-500"/> Fiscal</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Emissão de NFS-e. O sistema armazena o XML e PDF. Use a aba <strong>Recebimentos</strong> para importar notas de compra contra o CNPJ do cliente.
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all cursor-default">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><FileSignature className="h-4 w-4 text-purple-500"/> Contratos</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Gerador de contratos inteligente.
                <br/>1. Escolha o modelo.
                <br/>2. Preencha os dados (CNPJ busca automático).
                <br/>3. Edite o texto livremente no editor.
                <br/>4. Envie para assinatura digital (Clicksign).
              </CardContent>
            </Card>

             <Card className="hover:shadow-md transition-all cursor-default">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-red-500"/> CFO Digital</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Inteligência de dados. Gráficos de receita, despesa, lucro e projeções futuras. Use para reuniões estratégicas com o cliente.
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tips ────────────────────────────────────────────────────── */}
        <TabsContent value="dicas" className="mt-6">
           <Card className="bg-yellow-50/50 border-yellow-100">
             <CardHeader>
               <CardTitle className="flex items-center gap-2 text-amber-700">
                 <Lightbulb className="h-5 w-5" /> Dicas de Produtividade
               </CardTitle>
             </CardHeader>
             <CardContent className="grid gap-4">
               <div className="flex gap-3 items-start">
                 <div className="h-6 w-6 rounded-full bg-white border border-yellow-200 flex items-center justify-center shrink-0 text-xs font-bold text-amber-600">1</div>
                 <p className="text-sm text-amber-900/80"><strong>Use a tecla TAB:</strong> Ao preencher formulários, use TAB para pular para o próximo campo rapidamente.</p>
               </div>
               <div className="flex gap-3 items-start">
                 <div className="h-6 w-6 rounded-full bg-white border border-yellow-200 flex items-center justify-center shrink-0 text-xs font-bold text-amber-600">2</div>
                 <p className="text-sm text-amber-900/80"><strong>Filtros Avançados:</strong> Nas telas de listagem (Contas a Pagar, Notas), use os filtros de data e status para encontrar lançamentos específicos.</p>
               </div>
               <div className="flex gap-3 items-start">
                 <div className="h-6 w-6 rounded-full bg-white border border-yellow-200 flex items-center justify-center shrink-0 text-xs font-bold text-amber-600">3</div>
                 <p className="text-sm text-amber-900/80"><strong>Busca de CNPJ:</strong> Ao cadastrar um cliente ou fornecedor, digite apenas o CNPJ e clique na lupa. O sistema preenche o resto.</p>
               </div>
               <div className="flex gap-3 items-start">
                 <div className="h-6 w-6 rounded-full bg-white border border-yellow-200 flex items-center justify-center shrink-0 text-xs font-bold text-amber-600">4</div>
                 <p className="text-sm text-amber-900/80"><strong>Editor de Contratos:</strong> Você pode colar texto do Word direto no editor, ele manterá a maior parte da formatação.</p>
               </div>
             </CardContent>
           </Card>
        </TabsContent>

         {/* ── FAQ ────────────────────────────────────────────────────── */}
         <TabsContent value="faq" className="mt-6">
           <Card>
             <CardHeader>
               <CardTitle>Perguntas Frequentes</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="space-y-2">
                 <h4 className="font-medium text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-400"/> O sistema está lento ou travando.</h4>
                 <p className="text-sm text-muted-foreground pl-6">Verifique sua conexão com a internet. Tente recarregar a página (F5). Se persistir, limpe o cache do navegador.</p>
               </div>
               <div className="space-y-2">
                 <h4 className="font-medium text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-400"/> Não consigo emitir nota fiscal.</h4>
                 <p className="text-sm text-muted-foreground pl-6">Verifique se o certificado digital do cliente está válido e configurado no painel do e-Notas. Confirme se todos os campos obrigatórios (endereço, CNPJ) do tomador estão preenchidos.</p>
               </div>
             </CardContent>
           </Card>
         </TabsContent>

      </Tabs>
    </div>
  );
}