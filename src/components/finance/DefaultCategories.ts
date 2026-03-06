export const defaultCategoriesRaw = [
    {
        name: "1. RECEITAS (ENTRADAS)",
        type: "receber",
        sub: [
            {
                name: "1.1 Receita Bruta de Serviços",
                sub: ["Prestação de Serviços (Mercado Interno)", "Prestação de Serviços (Exportação)", "Venda de Mercadorias/Produtos"]
            },
            {
                name: "1.2 Receitas Financeiras",
                sub: ["Rendimentos de Aplicações Financeiras", "Juros Recebidos (Atraso de Clientes)", "Variação Cambial Ativa"]
            },
            {
                name: "1.3 Outras Receitas",
                sub: ["Recuperação de Despesas / Reembolsos", "Venda de Ativos (Equipamentos usados)", "Aportes de Capital / Empréstimos Recebidos"]
            }
        ]
    },
    {
        name: "2. DEDUÇÕES DA RECEITA (IMPOSTOS SOBRE VENDAS)",
        type: "pagar",
        sub: [
            {
                name: "2.1 Simples Nacional",
                sub: ["DAS - Simples Nacional"]
            },
            {
                name: "2.2 Lucro Presumido (Impostos Mensais)",
                sub: ["ISS - Imposto Sobre Serviços", "PIS Faturamento", "COFINS Faturamento"]
            },
            {
                name: "2.3 Lucro Presumido (Impostos Trimestrais)",
                sub: ["IRPJ - Imposto de Renda Pessoa Jurídica", "CSLL - Contribuição Social sobre Lucro Líquido"]
            },
            {
                name: "2.4 Retenções na Fonte (Créditos de Imposto)",
                sub: ["IRRF Retido por Clientes", "CSRF (PIS/COFINS/CSLL) Retido por Clientes", "ISS Retido por Clientes"]
            }
        ]
    },
    {
        name: "3. CUSTOS DOS SERVIÇOS PRESTADOS (CSP)",
        type: "pagar",
        sub: [
            {
                name: "3.1 Mão de Obra Direta",
                sub: ["Salários de Técnicos/Operacionais", "Freelancers e Terceirizados (PJ)"]
            },
            {
                name: "3.2 Ferramentas Operacionais",
                sub: ["Softwares Específicos (SaaS Operacional)", "Hospedagem de Sites / Servidores (Cloud)", "Insumos Diretos do Serviço"]
            }
        ]
    },
    {
        name: "4. DESPESAS ADMINISTRATIVAS E FIXAS",
        type: "pagar",
        sub: [
            {
                name: "4.1 Pessoal Administrativo",
                sub: ["Salários e Ordenados (Administrativo)", "Pró-labore (Sócios)", "FGTS / INSS (Parte Empresa)", "Vale Refeição / Alimentação", "Vale Transporte", "Plano de Saúde e Odontológico", "Seguro de Vida", "Treinamentos e Cursos"]
            },
            {
                name: "4.2 Ocupação e Infraestrutura",
                sub: ["Aluguel de Escritório / Coworking", "Condomínio e IPTU", "Energia Elétrica", "Água e Esgoto", "Internet e Telefonia", "Limpeza e Conservação", "Segurança e Monitoramento"]
            },
            {
                name: "4.3 Expediente e Manutenção",
                sub: ["Material de Escritório e Papelaria", "Copa e Cozinha (Café, insumos)", "Manutenção de Equipamentos (TI)", "Correios e Entregas (Motoboy)"]
            }
        ]
    },
    {
        name: "5. DESPESAS DE VENDAS E MARKETING",
        type: "pagar",
        sub: [
            {
                name: "5.1 Marketing e Publicidade",
                sub: ["Anúncios (Google Ads / Meta Ads)", "Agência de Marketing / Social Media", "Eventos e Feiras", "Brindes e Materials Promocionais"]
            },
            {
                name: "5.2 Comercial",
                sub: ["Comissões de Vendedores", "Viagens e Hospedagens de Vendas", "Alimentação e Representação com Clientes (Comercial)"]
            }
        ]
    },
    {
        name: "6. DESPESAS FINANCEIRAS E TRIBUTÁRIAS",
        type: "pagar",
        sub: [
            {
                name: "6.1 Taxas Bancárias",
                sub: ["Tarifas de Conta Corrente", "Taxas de Emissão de Boletos", "Anuidades de Cartão de Crédito PJ", "Taxas de Antecipação de Recebíveis"]
            },
            {
                name: "6.2 Juros e Multas",
                sub: ["Juros de Mora / Multas Pagas", "Juros de Empréstimos e Financiamentos"]
            },
            {
                name: "6.3 Outros Impostos e Taxas",
                sub: ["Anuidade de Conselhos Regionais (CRC, OAB, CREA, etc.)", "Taxa de Fiscalização e Funcionamento (TFE/TFA)", "Certificado Digital (Renovação)"]
            }
        ]
    },
    {
        name: "7. INVESTIMENTOS E MOVIMENTAÇÕES DE CAPITAL",
        type: "pagar",
        sub: [
            {
                name: "7.1 Ativo Imobilizado (Capex)",
                sub: ["Compra de Computadores e Periféricos", "Móveis e Utensílios", "Software (Licenças perpétuas)"]
            },
            {
                name: "7.2 Fluxos de Sócios",
                sub: ["Distribuição de Lucros (Isentos)", "Mútuos (Empréstimos entre Sócio e Empresa)", "Reembolso de Despesas de Sócios"]
            }
        ]
    },
    {
        name: "8. OUTROS (NÃO OPERACIONAIS)",
        type: "pagar",
        sub: [
            {
                name: "8.1 Ajustes e Transferências",
                sub: ["Transferência entre Contas Próprias", "Ajuste de Saldo / Erros de Conciliação", "Saques em Espécie"]
            }
        ]
    }
];
