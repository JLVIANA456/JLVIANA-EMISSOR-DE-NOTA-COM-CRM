import { useState, useMemo } from 'react';

export const useBPOFinancialCalculations = () => {
    const calculateRetentions = (
        baseValue: number,
        aliquots: { irrf: number; pis: number; cofins: number; csll: number },
        manualISS: number = 0,
        manualINSS: number = 0
    ) => {
        const irrf_valor = Number((baseValue * aliquots.irrf).toFixed(2));
        const pis_valor = Number((baseValue * aliquots.pis).toFixed(2));
        const cofins_valor = Number((baseValue * aliquots.cofins).toFixed(2));
        const csll_valor = Number((baseValue * aliquots.csll).toFixed(2));

        const total_retencoes = Number((irrf_valor + pis_valor + cofins_valor + csll_valor + manualISS + manualINSS).toFixed(2));

        return {
            irrf_valor,
            pis_valor,
            cofins_valor,
            csll_valor,
            total_retencoes
        };
    };

    const generateInstallments = (
        totalBruto: number,
        totalRetencoes: number,
        numParcelas: number,
        firstDueDate: string
    ) => {
        const installments = [];
        const baseValuePerParcel = Number((totalBruto / numParcelas).toFixed(2));
        let accumulatedBruto = 0;

        for (let i = 1; i <= numParcelas; i++) {
            let brutoParcela = baseValuePerParcel;

            // Last parcel adjustment
            if (i === numParcelas) {
                brutoParcela = Number((totalBruto - accumulatedBruto).toFixed(2));
            } else {
                accumulatedBruto += brutoParcela;
            }

            const retencoesAplicadas = i === 1 ? totalRetencoes : 0;
            const valorLiquido = Number((brutoParcela - retencoesAplicadas).toFixed(2));

            // Simple date addition (+30 days)
            const dueDate = new Date(firstDueDate);
            dueDate.setDate(dueDate.getDate() + (i - 1) * 30);

            installments.push({
                numero: i,
                vencimento: dueDate.toISOString().split('T')[0],
                valor_bruto: brutoParcela,
                total_retencoes_aplicadas: retencoesAplicadas,
                valor_liquido: valorLiquido,
                status: 'pendente' as const
            });
        }

        return installments;
    };

    return {
        calculateRetentions,
        generateInstallments
    };
};
