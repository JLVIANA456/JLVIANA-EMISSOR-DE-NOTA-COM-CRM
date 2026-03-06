import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/components/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bot, Send, Loader2, User, Zap, AlertTriangle, RotateCcw, Link2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

const OPENAI_API_KEY = (import.meta as any).env.VITE_OPENAI_API_KEY;

type Message = { role: "user" | "assistant"; content: string };

const QUICK_ACTIONS = [
  { label: "Explicar cláusula", prompt: "Explique de forma clara e acessível a seguinte cláusula contratual:" },
  { label: "Revisar trecho", prompt: "Faça uma revisão técnica do seguinte trecho contratual, identificando riscos e sugerindo melhorias:" },
  { label: "Riscos do contrato", prompt: "Analise os riscos jurídicos do seguinte contrato/cláusula:" },
  { label: "Sugerir redação", prompt: "Sugira uma redação jurídica profissional para a seguinte cláusula:" },
  { label: "Risco de vínculo", prompt: "Analise se o seguinte trecho contratual pode gerar risco de vínculo empregatício:" },
  { label: "Cláusula LGPD", prompt: "Gere uma cláusula de proteção de dados pessoais (LGPD) adequada para o seguinte contexto:" },
];

const SYSTEM_PROMPT = `Você é o Assistente Jurídico IA da JLVIANA Consultoria Contábil, especialista em:
- Direito contratual empresarial brasileiro
- Análise e redação de contratos de prestação de serviços contábeis, BPO financeiro e assessoria empresarial
- Riscos de vínculo empregatício (CLT art. 428, Lei 6.019/74, presunção de subordinação)
- LGPD (Lei 13.709/2018) aplicada a contratos e cláusulas de proteção de dados
- Propriedade intelectual e confidencialidade em contratos de serviços
- Contratos PJ, CLT, estágio, jovem aprendiz e suas particularidades legais

Contexto da empresa contratada (JLVIANA):
- JLVIANA CONSULTORIA CONTÁBIL, CNPJ 07.203.780/0001-16, CRC 2SP023539/O-4
- Representante: Jefferson Lopes Viana, CPF: 166.962.568-06, CRC: 1SP217513/0-O
- Especialidade: BPO Contábil, Fiscal, Trabalhista, Previdenciário e Societário

Ao responder:
1. Seja preciso e use linguagem técnica-jurídica quando necessário, mas explique em termos acessíveis
2. Sempre cite a base legal relevante (artigo de lei, norma, resolução)
3. Aponte riscos específicos de forma clara e objetiva
4. Sugira alternativas de redação quando identificar problemas
5. Responda em português do Brasil`;

export function LegalAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContract, setSelectedContract] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts-for-assistant"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("id, title, generated_content")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const contractContext = selectedContract && selectedContract !== "none"
    ? contracts.find((c: any) => c.id === selectedContract)?.generated_content || ""
    : "";

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || !user) return;

    if (!OPENAI_API_KEY) {
      toast.error("Chave VITE_OPENAI_API_KEY não configurada no .env");
      return;
    }

    const userMsg: Message = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const systemContent = contractContext
      ? `${SYSTEM_PROMPT}\n\n--- CONTRATO VINCULADO (use como contexto) ---\n${contractContext.slice(0, 8000)}`
      : SYSTEM_PROMPT;

    let assistantSoFar = "";

    try {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          stream: true,
          messages: [
            { role: "system", content: systemContent },
            ...messages,
            userMsg,
          ],
          max_tokens: 2048,
          temperature: 0.3,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error?.message || `Erro ${resp.status} na API OpenAI`);
      }

      if (!resp.body) throw new Error("Sem resposta da OpenAI");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Log AI interaction
      if (assistantSoFar) {
        supabase.from("contract_ai_logs").insert({
          user_id: user.id,
          contract_id: (selectedContract && selectedContract !== "none") ? selectedContract : null,
          action: "assistente_juridico",
          prompt: messageText,
          response: assistantSoFar.slice(0, 5000),
        }).then(() => { });
      }
    } catch (err: any) {
      toast.error("Erro: " + err.message);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `❌ Erro ao processar sua solicitação: ${err.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt + " ");
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="space-y-4">
      {/* Header do assistente + seletor de contrato */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Assistente Jurídico IA</p>
            <p className="text-[10px] text-muted-foreground font-light">
              Especialista em direito contratual brasileiro, LGPD e risco de vínculo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link2 className="h-3.5 w-3.5 text-muted-foreground/60" />
          <Select value={selectedContract} onValueChange={setSelectedContract}>
            <SelectTrigger className="w-56 h-8 text-xs font-light rounded-xl border-border/50 bg-muted/30">
              <SelectValue placeholder="Vincular contrato (opcional)" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="none">Sem contrato vinculado</SelectItem>
              {contracts.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground gap-1.5 rounded-xl"
              onClick={clearChat}
            >
              <RotateCcw className="h-3 w-3" /> Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2 px-1">
        {QUICK_ACTIONS.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            size="sm"
            className="text-[10px] h-7 px-3 rounded-xl font-bold uppercase tracking-wider border-border/50 hover:bg-primary/5 hover:border-primary/30 gap-1.5"
            onClick={() => handleQuickAction(action.prompt)}
          >
            <Zap className="h-3 w-3 text-primary" />
            {action.label}
          </Button>
        ))}
      </div>

      {/* Chat area */}
      <div className="rounded-2xl border border-border/50 bg-card/50 shadow-sm overflow-hidden" style={{ height: "60vh" }}>
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-16">
                <div className="h-16 w-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                  <Bot className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Como posso ajudar?</p>
                  <p className="text-xs text-muted-foreground font-light mt-1 max-w-sm leading-relaxed">
                    Posso explicar cláusulas, revisar trechos, identificar riscos de vínculo empregatício,
                    sugerir redação jurídica e analisar compliance com LGPD.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                  {QUICK_ACTIONS.slice(0, 3).map(a => (
                    <button
                      key={a.label}
                      onClick={() => handleQuickAction(a.prompt)}
                      className="text-[10px] px-3 py-1.5 rounded-xl bg-muted/50 border border-border/40 text-muted-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all font-medium"
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-white border border-border/40 rounded-bl-md"
                      }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert text-foreground">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap font-light">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))
            )}

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-white border border-border/40 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5 items-center">
                    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Disclaimer + Input */}
        <div className="border-t border-border/40 bg-white/80">
          <div className="px-4 py-1.5 border-b border-border/20">
            <p className="text-[9px] text-muted-foreground/70 flex items-center gap-1 font-light">
              <AlertTriangle className="h-2.5 w-2.5 text-amber-400" />
              O assistente não substitui aconselhamento jurídico profissional. Revise com um advogado antes de formalizar contratos.
            </p>
          </div>
          <div className="p-3 flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Faça sua pergunta jurídica ou cole o trecho do contrato para análise…"
              className="min-h-[44px] max-h-[120px] resize-none rounded-xl border-border/50 bg-muted/20 text-sm font-light focus-visible:ring-primary/20"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="h-11 w-11 rounded-xl shrink-0 bg-slate-900 hover:bg-black shadow-md"
            >
              {isLoading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />
              }
            </Button>
          </div>
        </div>
      </div>

      {/* Badge de status */}
      {!OPENAI_API_KEY && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700 font-light">
            <strong>VITE_OPENAI_API_KEY</strong> não configurada. Adicione ao arquivo <strong>.env</strong> para usar o assistente.
          </p>
        </div>
      )}
    </div>
  );
}
