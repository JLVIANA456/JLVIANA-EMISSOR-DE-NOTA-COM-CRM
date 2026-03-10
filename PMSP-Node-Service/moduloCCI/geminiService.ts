
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, MovementType, TransactionStatus } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      date: { type: Type.STRING, description: 'Data no formato YYYY-MM-DD' },
      originalDescription: { type: Type.STRING, description: 'Descrição bruta do extrato' },
      amount: { type: Type.NUMBER, description: 'Valor numérico. Saídas negativas, Entradas positivas.' },
      type: { type: Type.STRING, description: 'CREDIT ou DEBIT' },
      description: { type: Type.STRING, description: 'Descrição limpa' },
      entity: { type: Type.STRING, description: 'Nome do favorecido ou pagador' },
      movementType: { type: Type.STRING, description: 'Categoria (Receita, Despesa, Tarifa/Taxa, Imposto, Transferência, Aplicação/Resgate)' },
      accountingAccount: { type: Type.STRING, description: 'Sugestão de conta no formato X.X.XX.XX.XXX' },
      reasoning: { type: Type.STRING, description: 'Justificativa da classificação' }
    },
    required: ['date', 'originalDescription', 'amount', 'type', 'description', 'movementType', 'accountingAccount']
  }
};

export const analyzeTransactions = async (
  fileContent: string, 
  fileName: string, 
  bankContext: string,
  formatContext: string
): Promise<Transaction[]> => {
  try {
    const modelName = "gemini-3-flash-preview";
    
    const systemInstruction = `Você é um especialista em conciliação contábil.
    Sua tarefa é converter o conteúdo textual de um arquivo ${formatContext.toUpperCase()} do banco ${bankContext} para um formato JSON estruturado.

    REGRAS DE NEGÓCIO:
    1. VALORES: Todo débito (pagamento, transferência enviada, tarifa) deve ser um número NEGATIVO. Todo crédito (recebimento, estorno) deve ser POSITIVO.
    2. ENTIDADE: Extraia o nome da empresa ou pessoa envolvida na transação quando possível.
    3. LIMPEZA: No campo 'description', remova códigos bancários inúteis e mantenha o que a transação representa (ex: "Pagamento de Boleto").
    4. CONTABILIDADE: 
       - Ativo: 1.x, Passivo: 2.x, Receitas: 3.x, Despesas: 4.x.
       - Tarifas bancárias geralmente são 4.1.02.01.001.

    O conteúdo que você receberá pode ser um CSV com delimitadores ou a estrutura de um arquivo OFX.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ text: `Analise este extrato (${fileName}):\n\n${fileContent}` }],
      config: { 
        systemInstruction, 
        responseMimeType: "application/json", 
        responseSchema,
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    const processItem = (item: any) => ({
      ...item,
      id: Math.random().toString(36).substring(2, 11),
      status: TransactionStatus.PENDING,
      suggestedAccount: item.accountingAccount,
      accountingAccount: item.accountingAccount,
      amount: typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount
    });

    const text = response.text || '[]';
    const data = JSON.parse(text);
    return Array.isArray(data) ? data.map(processItem) : [];

  } catch (error) {
    console.error("Erro no processamento do extrato:", error);
    throw error;
  }
};
