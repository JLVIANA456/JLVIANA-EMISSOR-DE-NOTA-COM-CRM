
import { Transaction, MovementType, TransactionStatus } from "./types";

const OPENAI_API_KEY = (import.meta as any).env?.VITE_OPENAI_API_KEY;

export const analyzeTransactions = async (
  fileContent: string,
  fileName: string,
  bankContext: string,
  formatContext: string
): Promise<Transaction[]> => {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key is missing. Please check your .env file.");
  }

  try {
    const systemPrompt = `Você é um especialista em conciliação contábil (CCI) para o sistema JLVIANA HUB PRO.
    Sua tarefa é converter o conteúdo de um arquivo ${formatContext.toUpperCase()} do banco ${bankContext} em um JSON estruturado.

    REGRAS CRÍTICAS:
    1. VALORES: Débitos (pagamentos, tarifas, saídas) devem ser NEGATIVOS. Créditos (recebimentos, estornos, entradas) devem ser POSITIVOS.
    2. ENTIDADE: Identifique o favorecido ou pagador.
    3. LIMPEZA: No campo 'description', resuma a transação (ex: "Tarifa Mensal" em vez de "TAR MENS 01/24").
    4. CATEGORIZAÇÃO: Use as seguintes categorias em 'movementType': Receita, Despesa, Tarifa/Taxa, Imposto, Transferência, Aplicação, Outros.
    5. PLANO DE CONTAS: Sugira contas no formato X.X.XX.XX.XXX (ex: 4.1.02.01.001 para Tarifas).

    FORMATO DE RESPOSTA (JSON APENAS):
    [
      {
        "date": "YYYY-MM-DD",
        "originalDescription": "...",
        "amount": -150.00,
        "type": "DEBIT" | "CREDIT",
        "description": "...",
        "entity": "...",
        "movementType": "...",
        "accountingAccount": "...",
        "reasoning": "..."
      }
    ]`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analise este extrato (${fileName}):\n\n${fileContent}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Erro na API da OpenAI");
    }

    const result = await response.json();
    const content = JSON.parse(result.choices[0].message.content);

    // OpenAI with response_format: json_object expects a root key or returns a structured object.
    // If it returns an object with a key like 'transactions', use that. Otherwise try to find the array.
    let transactionsRaw: any[] = [];
    if (Array.isArray(content)) {
      transactionsRaw = content;
    } else if (content.transactions && Array.isArray(content.transactions)) {
      transactionsRaw = content.transactions;
    } else {
      // Try to find any array in the object
      const keys = Object.keys(content);
      const arrayKey = keys.find(k => Array.isArray(content[k]));
      if (arrayKey) transactionsRaw = content[arrayKey];
    }

    const processItem = (item: any): Transaction => ({
      id: Math.random().toString(36).substring(2, 11),
      date: item.date,
      originalDescription: item.originalDescription,
      amount: typeof item.amount === 'string' ? parseFloat(item.amount.replace(',', '.')) : item.amount,
      type: item.type as any,
      description: item.description,
      entity: item.entity || "N/A",
      movementType: item.movementType as MovementType,
      accountingAccount: item.accountingAccount,
      suggestedAccount: item.accountingAccount,
      reasoning: item.reasoning,
      status: TransactionStatus.PENDING
    });

    return transactionsRaw.map(processItem);

  } catch (error) {
    console.error("Erro no processamento do extrato (OpenAI):", error);
    throw error;
  }
};
