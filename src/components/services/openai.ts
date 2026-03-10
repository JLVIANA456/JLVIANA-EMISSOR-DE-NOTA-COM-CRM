const DEFAULT_OPENAI_API_KEY = (import.meta as any).env.VITE_OPENAI_API_KEY;

/**
 * Obtém a chave de API da OpenAI. 
 * Prioriza a chave fornecida pelo usuário nas configurações do sistema.
 * Se não houver, usa a chave padrão do arquivo .env.
 */
export const getOpenAIKey = async (companyId?: string): Promise<string> => {
    if (!companyId) return DEFAULT_OPENAI_API_KEY;

    try {
        const { data, error } = await (supabase as any)
            .from("configuracoes_sistema")
            .select("openai_api_key")
            .eq("company_id", companyId)
            .maybeSingle();

        if (error) throw error;
        return data?.openai_api_key || DEFAULT_OPENAI_API_KEY;
    } catch (err) {
        console.warn("Erro ao buscar chave customizada da OpenAI, usando padrão:", err);
        return DEFAULT_OPENAI_API_KEY;
    }
};

const getHeaders = (apiKey: string) => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
});

import { supabase } from "@/integrations/supabase/client";

export interface AIAnalysisResult {
    descricao: string;
    valor: number;
    data: string;
    tipo: 'entrada' | 'saida' | 'transferencia';
    categoria_sugerida: string;
}

export interface APBillAnalysisResult {
    fornecedor: string;
    valor_total: number;
    data_vencimento: string;
    codigo_barras: string;
    categoria: string;
    alerta: string;
}

export const analyzeReceiptWithAI = async (file: File, companyId?: string): Promise<AIAnalysisResult> => {
    if (file.type === "application/pdf") {
        throw new Error("O formato PDF ainda não é suportado via IA direta. Por favor, utilize uma imagem (PNG, JPG) ou tire uma foto da nota.");
    }

    const apiKey = await getOpenAIKey(companyId);

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64Image = reader.result as string;

            try {
                const response = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: getHeaders(apiKey),
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        messages: [
                            {
                                role: "system",
                                content: "Você é um assistente de BPO Financeiro. Extraia dados de notas fiscais, recibos e comprovantes. Retorne os dados estritamente em formato JSON."
                            },
                            {
                                role: "user",
                                content: [
                                    {
                                        type: "text",
                                        text: "Extraia os dados desta imagem: descricao (resumo do que é), valor (apenas o número), data (no formato YYYY-MM-DD), tipo (identifique se é 'entrada' ou 'saida'), categoria_sugerida (ex: Pessoal, Marketing, Infraestrutura, Impostos). JSON APENAS."
                                    },
                                    {
                                        type: "image_url",
                                        image_url: { url: base64Image, detail: "high" }
                                    }
                                ]
                            }
                        ],
                        response_format: { type: "json_object" }
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    if (error.error?.message?.includes("Invalid MIME type")) {
                        throw new Error("Arquivo inválido. A IA só aceita imagens (JPG, PNG, WEBP). PDFs precisam ser convertidos em imagem.");
                    }
                    throw new Error(error.error?.message || "Erro na API da OpenAI");
                }

                const result = await response.json();
                const analysis = JSON.parse(result.choices[0].message.content);

                resolve({
                    descricao: analysis.descricao || "Sem título",
                    valor: parseFloat(analysis.valor) || 0,
                    data: analysis.data || new Date().toISOString().split('T')[0],
                    tipo: analysis.tipo || 'saida',
                    categoria_sugerida: analysis.categoria_sugerida || "Outros"
                });
            } catch (err) {
                console.error("OpenAI Analysis Error:", err);
                reject(err);
            }
        };
        reader.onerror = error => reject(error);
    });
};

export const analyzeAPBillWithAI = async (file: File, companyId?: string): Promise<APBillAnalysisResult> => {
    if (file.type === "application/pdf") {
        throw new Error("O formato PDF ainda não é suportado via IA direta. Por favor, utilize uma imagem (PNG, JPG) ou tire uma foto da nota.");
    }

    const apiKey = await getOpenAIKey(companyId);

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64Image = reader.result as string;

            try {
                const response = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: getHeaders(apiKey),
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        messages: [
                            {
                                role: "system",
                                content: "Você é um especialista em contas a pagar. Analise o texto da nota/boleto e retorne um JSON estritamente com os campos solicitados."
                            },
                            {
                                role: "user",
                                content: [
                                    {
                                        type: "text",
                                        text: "Extraia os dados desta imagem: fornecedor, valor_total (numérico), data_vencimento (formato YYYY-MM-DD), codigo_barras (se houver), categoria (sugira uma entre [Fixo, Variável, Imposto, Investimento]), alerta (se a data de vencimento já passou, avise). JSON APENAS."
                                    },
                                    {
                                        type: "image_url",
                                        image_url: { url: base64Image, detail: "high" }
                                    }
                                ]
                            }
                        ],
                        response_format: { type: "json_object" }
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error?.message || "Erro na API da OpenAI");
                }

                const result = await response.json();
                const analysis = JSON.parse(result.choices[0].message.content);

                resolve({
                    fornecedor: analysis.fornecedor || "N/A",
                    valor_total: parseFloat(analysis.valor_total) || 0,
                    data_vencimento: analysis.data_vencimento || new Date().toISOString().split('T')[0],
                    codigo_barras: analysis.codigo_barras || "",
                    categoria: analysis.categoria || "Variável",
                    alerta: analysis.alerta || ""
                });
            } catch (err) {
                console.error("OpenAI AP Analysis Error:", err);
                reject(err);
            }
        };
        reader.onerror = error => reject(error);
    });
};

export interface ARProofAnalysisResult {
    pagador: string;
    valor: number;
    data_pagamento: string;
    autenticacao?: string;
    alerta?: string;
}

export const analyzeARProofWithAI = async (file: File, companyId?: string): Promise<ARProofAnalysisResult> => {
    if (file.type === "application/pdf") {
        throw new Error("O formato PDF ainda não é suportado via IA direta. Por favor, utilize uma imagem (PNG, JPG).");
    }

    const apiKey = await getOpenAIKey(companyId);

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64Image = reader.result as string;

            try {
                const response = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: getHeaders(apiKey),
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        messages: [
                            {
                                role: "system",
                                content: "Você é um assistente de conciliação bancária. Analise o comprovante de pagamento (PIX, Transferência, Depósito) e extraia os dados solicitados em JSON."
                            },
                            {
                                role: "user",
                                content: [
                                    {
                                        type: "text",
                                        text: "Extraia: pagador (nome de quem pagou), valor (numérico), data_pagamento (YYYY-MM-DD), autenticacao (código de autenticação ou ID transação), alerta (se o valor parecer divergente ou se for um comprovante de agendamento e não de pagamento). JSON APENAS."
                                    },
                                    {
                                        type: "image_url",
                                        image_url: { url: base64Image, detail: "high" }
                                    }
                                ]
                            }
                        ],
                        response_format: { type: "json_object" }
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error?.message || "Erro na API da OpenAI");
                }

                const result = await response.json();
                const analysis = JSON.parse(result.choices[0].message.content);

                resolve({
                    pagador: analysis.pagador || "N/A",
                    valor: parseFloat(analysis.valor) || 0,
                    data_pagamento: analysis.data_pagamento || new Date().toISOString().split('T')[0],
                    autenticacao: analysis.autenticacao || "",
                    alerta: analysis.alerta || ""
                });
            } catch (err) {
                console.error("OpenAI AR Proof Analysis Error:", err);
                reject(err);
            }
        };
        reader.onerror = error => reject(error);
    });
};

export const generateCollectionMessage = async (clientName: string, amount: number, dueDate: string, companyId?: string): Promise<string> => {
    try {
        const apiKey = await getOpenAIKey(companyId);
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: getHeaders(apiKey),
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "Você é um assistente de BPO financeiro especializado em cobrança humanizada. Gere uma mensagem curta para WhatsApp/Email."
                    },
                    {
                        role: "user",
                        content: `Gere uma mensagem de cobrança amigável mas profissional para o cliente ${clientName}, referente a uma fatura de R$ ${amount.toFixed(2)} que venceu/vence em ${dueDate}. O tom deve ser de ajuda e não de ameaça.`
                    }
                ],
                max_tokens: 200
            })
        });

        const result = await response.json();
        return result.choices[0].message.content;
    } catch (err) {
        console.error("Collection Message Error:", err);
        return "Olá! Notamos uma pendência em sua fatura. Por favor, entre em contato para regularizarmos.";
    }
};

export interface CostCenterAnalysisResult {
    centro_sugerido: string;
    justificativa: string;
    rateio_sugerido?: { centro: string; percentual: number }[];
}

export const analyzeCostCenterWithAI = async (file: File, existingCenters: string[], companyId?: string): Promise<CostCenterAnalysisResult> => {
    if (file.type === "application/pdf") {
        throw new Error("O formato PDF ainda não é suportado via IA direta. Por favor, utilize uma imagem (PNG, JPG).");
    }

    const apiKey = await getOpenAIKey(companyId);

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64Image = reader.result as string;

            try {
                const response = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: getHeaders(apiKey),
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        messages: [
                            {
                                role: "system",
                                content: "Você é um consultor financeiro. Analise a nota fiscal/recibo e sugira o enquadramento nos centros de custo da empresa."
                            },
                            {
                                role: "user",
                                content: [
                                    {
                                        type: "text",
                                        text: `Analise esta imagem e sugira qual destes centros de custo é o mais adequado: [${existingCenters.join(", ")}]. Se a conta for mista (ex: Luz, Internet em local compartilhado), sugira um rateio percentual. Retorne em JSON com: centro_sugerido, justificativa, rateio_sugerido (array de objetos {centro, percentual}). JSON APENAS.`
                                    },
                                    {
                                        type: "image_url",
                                        image_url: { url: base64Image, detail: "high" }
                                    }
                                ]
                            }
                        ],
                        response_format: { type: "json_object" }
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error?.message || "Erro na API da OpenAI");
                }

                const result = await response.json();
                const analysis = JSON.parse(result.choices[0].message.content);

                resolve({
                    centro_sugerido: analysis.centro_sugerido || "N/A",
                    justificativa: analysis.justificativa || "",
                    rateio_sugerido: analysis.rateio_sugerido || []
                });
            } catch (err) {
                console.error("OpenAI Cost Center Analysis Error:", err);
                reject(err);
            }
        };
        reader.onerror = error => reject(error);
    });
};

export interface CashFlowPrediction {
    status: 'ok' | 'warning' | 'danger';
    alerta: string;
    recomendacao: string;
}

export const analyzeCashFlowWithAI = async (
    currentBalance: number,
    pendingPayments: { valor: number, data: string }[],
    pendingReceivables: { valor: number, data: string }[],
    companyId?: string
): Promise<CashFlowPrediction> => {
    try {
        const apiKey = await getOpenAIKey(companyId);
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: getHeaders(apiKey),
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "Você é um analista de tesouraria. Analise o saldo e as contas a pagar/receber da próxima semana e dê um veredito de fluxo de caixa."
                    },
                    {
                        role: "user",
                        content: `Saldo atual: R$ ${currentBalance}. 
                        Próximos Pagamentos: ${JSON.stringify(pendingPayments)}. 
                        Próximos Recebimentos: ${JSON.stringify(pendingReceivables)}.
                        Retorne em JSON: { status: 'ok' | 'warning' | 'danger', alerta: 'string curta', recomendacao: 'string curta' }. JSON APENAS.`
                    }
                ],
                response_format: { type: "json_object" }
            })
        });

        const result = await response.json();
        return JSON.parse(result.choices[0].message.content);
    } catch (err) {
        console.error("Cash Flow AI Error:", err);
        return { status: 'ok', alerta: "IA indisponível", recomendacao: "Confira seus vencimentos manualmente." };
    }
};

export interface ConciliationAnomalies {
    divergencias: { descricao: string; valor: number; data: string; motivo: string }[];
}

export const analyzeBankConciliationWithAI = async (
    bankStatementText: string,
    systemRecords: { descricao: string; valor: number; data: string }[],
    companyId?: string
): Promise<ConciliationAnomalies> => {
    try {
        const apiKey = await getOpenAIKey(companyId);
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: getHeaders(apiKey),
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "Você é um auditor financeiro. Compare o extrato bancário com os registros do sistema e aponte o que não bate."
                    },
                    {
                        role: "user",
                        content: `Extrato Bancário: ${bankStatementText}. 
                        Registros no Sistema: ${JSON.stringify(systemRecords)}.
                        Retorne em JSON: { divergencias: [{ descricao, valor, data, motivo }] }. JSON APENAS.`
                    }
                ],
                response_format: { type: "json_object" }
            })
        });

        const result = await response.json();
        return JSON.parse(result.choices[0].message.content);
    } catch (err) {
        console.error("Conciliation AI Error:", err);
        return { divergencias: [] };
    }
};
export interface AICategorySuggestion {
    categories: {
        name: string;
        type: 'receber' | 'pagar';
        sub?: {
            name: string;
            sub?: string[];
        }[];
    }[];
}

export const generateNicheCategoriesWithAI = async (niche: string, companyId?: string): Promise<AICategorySuggestion> => {
    try {
        const apiKey = await getOpenAIKey(companyId);
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: getHeaders(apiKey),
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "Você é um consultor financeiro sênior. Sua tarefa é sugerir um plano de contas completo e profissional para um nicho de mercado específico. Retorne os dados estritamente em formato JSON."
                    },
                    {
                        role: "user",
                        content: `Gere um plano de contas financeiro detalhado para o nicho: "${niche}". 
                        O plano deve ser dividido em 'Receitas' (tipo: receber) e 'Despesas' (tipo: pagar).
                        Organize em até 3 níveis hierárquicos (Pai > Filho > Neto).
                        
                        Estrutura JSON esperada:
                        {
                          "categories": [
                            {
                              "name": "Nome Categoria Pai",
                              "type": "receber" ou "pagar",
                              "sub": [
                                {
                                  "name": "Nome Categoria Filho",
                                  "sub": ["Neto 1", "Neto 2"]
                                }
                              ]
                            }
                          ]
                        }
                        JSON APENAS.`
                    }
                ],
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "Erro na API da OpenAI");
        }

        const result = await response.json();
        return JSON.parse(result.choices[0].message.content);
    } catch (err) {
        console.error("Generate Niche Categories AI Error:", err);
        throw err;
    }
};
