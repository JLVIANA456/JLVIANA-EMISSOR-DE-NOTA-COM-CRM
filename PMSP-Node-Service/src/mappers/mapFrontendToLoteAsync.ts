/**
 * Mapper para transformar o payload vindo do Frontend no formato esperado pelo Lote RPS Assíncrono da PMSP.
 * Resolve conversões de tipos (string/number/boolean) e garante valores padrão.
 */

export type FrontendPayload = {
    numeroRps?: string | number;
    serieRps?: string | number;
    tipoRps?: string | number;
    dataEmissao?: string;
    statusRps?: string | number;
    tributacaoRps?: string | number;

    cnpjPrestador?: string | number;
    imPrestador?: string | number;

    valorServicos?: string | number;
    valorDeducoes?: string | number;
    codigoServico?: string | number;
    aliquotaServicos?: string | number;
    issRetido?: boolean | string | number;

    cpfCnpjTomador?: string | number;
    razaoSocialTomador?: string;
    emailTomador?: string;

    tipoLogradouro?: string;
    logradouro?: string;
    numeroEndereco?: string | number;
    complementoEndereco?: string;
    bairro?: string;
    cidade?: string | number;
    uf?: string;
    cep?: string | number;

    discriminacao?: string;

    nbs?: string | number;
    cLocPrestacao?: string | number;
    cPaisPrestacao?: string;

    valorIpi?: string | number;
    valorInicialCobrado?: string | number;
    valorFinalCobrado?: string | number;

    exigibilidadeSuspensa?: string | number;
    pagamentoParceladoAntecipado?: string | number;

    assinatura?: string;

    ibsCbs?: {
        finNFSe?: string | number;
        indFinal?: string | number;
        cIndOp?: string | number;
        indDest?: string | number;
        cClassTrib?: string | number;
        cClassTribReg?: string | number;
        tpOper?: string | number;
    };
};

export type LoteAsyncDataMapped = {
    versao: string;
    cpfCnpjRemetente: string;
    transacao: boolean;
    rpsList: any[];
};

function onlyDigits(value: unknown): string {
    return String(value ?? '').replace(/\D+/g, '');
}

function asText(value: unknown): string {
    return String(value ?? '').trim();
}

function asMoneyString(value: unknown, fallback = '0.00'): string {
    const raw = String(value ?? '').trim();

    if (!raw) return fallback;

    const normalized = raw.replace(/\./g, '').replace(',', '.');
    const num = Number(normalized);

    if (Number.isNaN(num)) return fallback;

    return num.toFixed(2);
}

function asBoolString(value: unknown): 'true' | 'false' {
    if (typeof value === 'boolean') return value ? 'true' : 'false';

    const v = String(value ?? '').trim().toLowerCase();

    if (['true', '1', 'sim', 's', 'yes', 'y', 'true'].includes(v)) return 'true';
    return 'false';
}

function asFlag01(value: unknown, fallback: '0' | '1' = '0'): '0' | '1' {
    const v = String(value ?? '').trim();
    return v === '1' ? '1' : fallback;
}

export function mapFrontendToLoteAsync(input: FrontendPayload): LoteAsyncDataMapped {
    const cLocPrestacao = onlyDigits(input.cLocPrestacao);
    const cPaisPrestacao = cLocPrestacao ? '' : asText(input.cPaisPrestacao).toUpperCase();

    const valorServicos = asMoneyString(input.valorServicos);

    // Lógica de choice para valores do RPS
    const valorInicialCobrado =
        input.valorInicialCobrado !== undefined &&
            input.valorInicialCobrado !== null &&
            String(input.valorInicialCobrado).trim() !== ''
            ? asMoneyString(input.valorInicialCobrado)
            : valorServicos;

    const valorFinalCobrado =
        input.valorFinalCobrado !== undefined &&
            input.valorFinalCobrado !== null &&
            String(input.valorFinalCobrado).trim() !== ''
            ? asMoneyString(input.valorFinalCobrado)
            : '';

    const rps = {
        assinatura: asText(input.assinatura), // Será gerada/sobrescrita no NfseService se vazia

        numeroRps: asText(input.numeroRps),
        serieRps: asText(input.serieRps || '1'),
        tipoRps: asText(input.tipoRps || '1'),
        dataEmissao: asText(input.dataEmissao),
        statusRps: asText(input.statusRps || '1'),
        tributacaoRps: asText(input.tributacaoRps || '1'),

        imPrestador: onlyDigits(input.imPrestador),

        valorServicos,
        valorDeducoes: asMoneyString(input.valorDeducoes, '0.00'),
        valorPis: '0.00',
        valorCofins: '0.00',
        valorInss: '0.00',
        valorIr: '0.00',
        valorCsll: '0.00',

        codigoServico: asText(input.codigoServico),
        aliquotaServicos: asMoneyString(input.aliquotaServicos, '0.02'), // default 2%
        issRetido: asBoolString(input.issRetido),

        cpfCnpjTomador: onlyDigits(input.cpfCnpjTomador),
        razaoSocialTomador: asText(input.razaoSocialTomador),
        emailTomador: asText(input.emailTomador),

        tipoLogradouro: asText(input.tipoLogradouro),
        logradouro: asText(input.logradouro),
        numeroEndereco: asText(input.numeroEndereco),
        complementoEndereco: asText(input.complementoEndereco),
        bairro: asText(input.bairro),
        cidade: onlyDigits(input.cidade),
        uf: asText(input.uf).toUpperCase(),
        cep: onlyDigits(input.cep),

        discriminacao: asText(input.discriminacao),

        valorInicialCobrado: valorFinalCobrado ? '' : valorInicialCobrado,
        valorFinalCobrado: valorFinalCobrado || '',
        valorIpi: asMoneyString(input.valorIpi, '0.00'),

        exigibilidadeSuspensa: asFlag01(input.exigibilidadeSuspensa, '0'),
        pagamentoParceladoAntecipado: asFlag01(input.pagamentoParceladoAntecipado, '0'),

        nbs: onlyDigits(input.nbs),
        cLocPrestacao,
        cPaisPrestacao,

        ibsCbs: {
            finNFSe: asText(input.ibsCbs?.finNFSe || '0'),
            indFinal: asFlag01(input.ibsCbs?.indFinal, '0'),
            cIndOp: onlyDigits(input.ibsCbs?.cIndOp),
            indDest: asFlag01(input.ibsCbs?.indDest, '0'),
            cClassTrib: onlyDigits(input.ibsCbs?.cClassTrib),
            cClassTribReg: onlyDigits(input.ibsCbs?.cClassTribReg),
            tpOper: asText(input.ibsCbs?.tpOper),
        },
    };

    return {
        versao: '2',
        cpfCnpjRemetente: onlyDigits(input.cnpjPrestador),
        transacao: true,
        rpsList: [rps],
    };
}
