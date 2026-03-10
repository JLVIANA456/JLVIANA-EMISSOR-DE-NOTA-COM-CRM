import { create } from 'xmlbuilder2';

/**
 * =========================================================
 * Tipos auxiliares
 * =========================================================
 */

type YesNoFlag = '0' | '1';
type BooleanString = 'true' | 'false';
type TomadorDocType = 'CPF' | 'CNPJ';

export interface RpsLoteItem {
  assinatura: string; // base64 da assinatura do RPS (não é a ds:Signature do XML)

  inscricaoPrestador?: string; // Adicionado para uso interno, não faz parte do XSD original do item, mas da chave

  numeroRps: string;
  serieRps?: string;
  tipoRps: string;
  dataEmissao: string; // YYYY-MM-DD
  statusRps: string;
  tributacaoRps: string;

  valorDeducoes?: string;
  valorPis?: string;
  valorCofins?: string;
  valorInss?: string;
  valorIr?: string;
  valorCsll?: string;

  codigoServico: string;
  aliquotaServicos: string;
  issRetido: BooleanString;

  cpfCnpjTomador?: string;
  inscricaoMunicipalTomador?: string;
  inscricaoEstadualTomador?: string;
  razaoSocialTomador?: string;

  tipoLogradouro?: string;
  logradouro?: string;
  numeroEndereco?: string;
  complementoEndereco?: string;
  bairro?: string;
  cidade?: string; // código IBGE com 7 dígitos no endereço nacional do schema atual
  uf?: string;
  cep?: string;
  emailTomador?: string;

  discriminacao: string;

  valorCargaTributaria?: string;
  percentualCargaTributaria?: string;
  fonteCargaTributaria?: string;

  codigoCei?: string;
  matriculaObra?: string;
  municipioPrestacao?: string;
  numeroEncapsulamento?: string;
  valorTotalRecebido?: string;

  valorInicialCobrado?: string;
  valorFinalCobrado?: string;

  valorMulta?: string;
  valorJuros?: string;
  valorIpi: string;

  exigibilidadeSuspensa: YesNoFlag;
  pagamentoParceladoAntecipado: YesNoFlag;

  ncm?: string;
  nbs?: string;

  cLocPrestacao?: string;   // município IBGE 7 dígitos
  cPaisPrestacao?: string;  // país ISO 2 letras

  ibsCbs?: {
    finNFSe: '0';
    indFinal: YesNoFlag;
    cIndOp: string; // 6 dígitos
    tpOper?: '1' | '2' | '3' | '4' | '5';
    indDest: '0' | '1';

    cClassTrib: string;     // 3 ou 4 dígitos
    cClassTribReg?: string; // 3 ou 4 dígitos
  };
}

export interface LoteAsyncData {
  versao?: string; // default: "1"
  cpfCnpjRemetente: string;
  transacao?: boolean;
  dtInicio?: string;
  dtFim?: string;
  rpsList: RpsLoteItem[];

  /**
   * Assinatura XML do documento inteiro (ds:Signature).
   * Deve ser gerada após montar o XML final ou em fluxo de assinatura XML.
   */
  documentSignatureXml?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * =========================================================
 * Sanitização / normalização
 * =========================================================
 */

class XmlValue {
  static onlyDigits(value?: unknown): string {
    return String(value ?? '').replace(/\D+/g, '');
  }

  static normalizeText(value?: unknown, maxLength?: number): string {
    const result = String(value ?? '')
      .replace(/\r/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\t/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return typeof maxLength === 'number' ? result.slice(0, maxLength) : result;
  }

  static normalizeMoney(value?: unknown, defaultValue = '0.00'): string {
    if (value === undefined || value === null) return defaultValue;
    const raw = String(value).trim();
    if (!raw) return defaultValue;

    // Se já estiver no formato "123.45" (ponto como decimal e sem vírgula)
    if (/^\d+\.\d{2}$/.test(raw)) {
      return raw;
    }

    // Caso contrário, tenta normalizar (lidando com formato brasileiro "1.500,00" ou similar)
    const normalized = raw
      .replace(/\./g, '') // Remove separador de milhar (ponto)
      .replace(',', '.'); // Troca vírgula por ponto decimal

    const num = Number(normalized);
    if (Number.isNaN(num)) return defaultValue;

    return num.toFixed(2);
  }

  static normalizeDate(value?: unknown): string {
    const strValue = String(value ?? '');
    if (!strValue) return '';

    if (/^\d{4}-\d{2}-\d{2}$/.test(strValue)) {
      return strValue;
    }

    const date = new Date(strValue);
    if (Number.isNaN(date.getTime())) return '';

    const yyyy = String(date.getFullYear());
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
  }

  static normalizeUf(value?: unknown): string {
    return this.normalizeText(value, 2).toUpperCase();
  }

  static normalizeCep(value?: unknown): string {
    return this.onlyDigits(value).slice(0, 8);
  }

  static detectTomadorDocType(documento?: unknown): TomadorDocType | null {
    const digits = this.onlyDigits(documento);
    if (digits.length === 11) return 'CPF';
    if (digits.length === 14) return 'CNPJ';
    return null;
  }

  static normalizeBooleanString(value?: unknown, defaultValue: BooleanString = 'false'): BooleanString {
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (value === undefined || value === null) return defaultValue;

    const v = String(value).trim().toLowerCase();

    if (['true', '1', 's', 'sim', 'y', 'yes'].includes(v)) return 'true';
    if (['false', '0', 'n', 'nao', 'não', 'no'].includes(v)) return 'false';

    return defaultValue;
  }

  static normalizeYesNoFlag(value?: unknown, defaultValue: YesNoFlag = '0'): YesNoFlag {
    if (value === undefined || value === null) return defaultValue;
    const v = String(value).trim();
    return v === '1' ? '1' : '0';
  }
}

/**
 * =========================================================
 * Validação de negócio / estrutura-base
 * =========================================================
 */

export class LoteRpsAsyncValidator {
  public validate(input: LoteAsyncData): ValidationResult {
    const errors: string[] = [];

    console.log('=== VALIDATOR: RPS[0] BEFORE LOOP ===');
    console.log(JSON.stringify(input.rpsList?.[0], null, 2));

    const remetente = XmlValue.onlyDigits(input.cpfCnpjRemetente);

    if (![11, 14].includes(remetente.length)) {
      errors.push('cpfCnpjRemetente deve conter 11 ou 14 dígitos.');
    }

    if (!input.rpsList || input.rpsList.length === 0) {
      errors.push('O lote deve conter ao menos 1 RPS.');
      return { valid: false, errors };
    }

    input.rpsList.forEach((rps, index) => {
      const prefix = `RPS[${index}]`;

      if (!XmlValue.normalizeText(rps.assinatura)) {
        errors.push(`${prefix}: assinatura do RPS é obrigatória.`);
      }

      if (!XmlValue.normalizeText(rps.numeroRps)) {
        errors.push(`${prefix}: numeroRps é obrigatório.`);
      }

      if (!XmlValue.normalizeDate(rps.dataEmissao)) {
        errors.push(`${prefix}: dataEmissao inválida.`);
      }

      if (!XmlValue.normalizeText(rps.tipoRps)) {
        errors.push(`${prefix}: tipoRps é obrigatório.`);
      }

      if (!XmlValue.normalizeText(rps.statusRps)) {
        errors.push(`${prefix}: statusRps é obrigatório.`);
      }

      if (!XmlValue.normalizeText(rps.tributacaoRps)) {
        errors.push(`${prefix}: tributacaoRps é obrigatório.`);
      }

      if (!XmlValue.normalizeText(rps.codigoServico)) {
        errors.push(`${prefix}: codigoServico é obrigatório.`);
      }

      if (!XmlValue.normalizeText(rps.aliquotaServicos)) {
        errors.push(`${prefix}: aliquotaServicos é obrigatória.`);
      }

      if (!XmlValue.normalizeText(rps.discriminacao)) {
        errors.push(`${prefix}: discriminacao é obrigatória.`);
      }

      if (rps.nbs && !XmlValue.normalizeText(rps.nbs)) {
        errors.push(`${prefix}: nbs informado mas vazio.`);
      }

      const valInit = XmlValue.normalizeText(rps.valorInicialCobrado);
      const valFin = XmlValue.normalizeText(rps.valorFinalCobrado);

      if (!valInit && !valFin) {
        errors.push(`${prefix}: informe valorInicialCobrado ou valorFinalCobrado.`);
      }

      if (valInit && valFin) {
        errors.push(`${prefix}: informe apenas um entre valorInicialCobrado e valorFinalCobrado.`);
      }

      if (rps.ibsCbs) {
        if (!XmlValue.normalizeText(rps.cLocPrestacao) && !XmlValue.normalizeText(rps.cPaisPrestacao)) {
          errors.push(`${prefix}: Para layout V2 (com IBSCBS), é obrigatório informar cLocPrestacao ou cPaisPrestacao.`);
        }
      } else {
        if (!XmlValue.normalizeText(rps.cLocPrestacao) && !XmlValue.normalizeText(rps.cPaisPrestacao) && !XmlValue.normalizeText(rps.municipioPrestacao)) {
          errors.push(`${prefix}: informe cLocPrestacao, cPaisPrestacao ou municipioPrestacao.`);
        }
      }

      if (XmlValue.normalizeText(rps.cLocPrestacao) && XmlValue.normalizeText(rps.cPaisPrestacao)) {
        errors.push(`${prefix}: informe apenas um entre cLocPrestacao e cPaisPrestacao.`);
      }

      const valIpi = XmlValue.normalizeText(rps.valorIpi);
      if (!valIpi) {
        errors.push(`${prefix}: valorIpi é obrigatório.`);
      }

      if (rps.ibsCbs) {
        if (!XmlValue.normalizeText(rps.ibsCbs.finNFSe)) {
          errors.push(`${prefix}: ibsCbs.finNFSe é obrigatório quando IBSCBS é informado.`);
        }
        if (!XmlValue.normalizeText(rps.ibsCbs.cIndOp)) {
          errors.push(`${prefix}: ibsCbs.cIndOp é obrigatório quando IBSCBS é informado.`);
        }
        if (!XmlValue.normalizeText(rps.ibsCbs.cClassTrib)) {
          errors.push(`${prefix}: ibsCbs.cClassTrib é obrigatório quando IBSCBS é informado.`);
        }
      }

      if (rps.cpfCnpjTomador) {
        const docType = XmlValue.detectTomadorDocType(rps.cpfCnpjTomador);
        if (!docType) {
          errors.push(`${prefix}: cpfCnpjTomador deve ter 11 ou 14 dígitos.`);
        }
      }

      if (rps.cpfCnpjTomador) {
        const docType = XmlValue.detectTomadorDocType(rps.cpfCnpjTomador);
        if (docType === 'CNPJ' && !XmlValue.normalizeText(rps.razaoSocialTomador)) {
          errors.push(`${prefix}: razaoSocialTomador é recomendada/esperada para tomador PJ.`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * =========================================================
 * Builder do lote assíncrono
 * =========================================================
 */

export class LoteRpsAsyncXmlBuilder {
  private readonly validator = new LoteRpsAsyncValidator();

  public build(input: LoteAsyncData): string {
    console.log('=== INPUT RECEBIDO NO BUILDER ===');
    console.log(JSON.stringify(input, null, 2));

    const validation = this.validator.validate(input);

    if (!validation.valid) {
      throw new Error(`Falha de validação do lote:\n- ${validation.errors.join('\n- ')}`);
    }

    const normalized = this.normalizeInput(input);
    console.log('=== INPUT NORMALIZADO NO BUILDER ===');
    console.log(JSON.stringify(normalized, null, 2));

    const dtInicio = normalized.dtInicio || this.getMinDate(normalized.rpsList);
    const dtFim = normalized.dtFim || this.getMaxDate(normalized.rpsList);

    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('p1:PedidoEnvioLoteRPS', {
        'xmlns:p1': 'http://www.prefeitura.sp.gov.br/nfe',
        'xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
      });

    // Cabecalho
    const cabecalho = root.ele('Cabecalho', {
      Versao: normalized.versao || '1',
    });

    const remetente = cabecalho.ele('CPFCNPJRemetente');
    const remetenteDigits = XmlValue.onlyDigits(normalized.cpfCnpjRemetente);
    if (remetenteDigits.length === 11) {
      remetente.ele('CPF').txt(remetenteDigits).up();
    } else {
      remetente.ele('CNPJ').txt(remetenteDigits).up();
    }
    remetente.up();

    if (typeof normalized.transacao === 'boolean') {
      cabecalho.ele('transacao').txt(normalized.transacao ? 'true' : 'false').up();
    }

    cabecalho.ele('dtInicio').txt(dtInicio).up();
    cabecalho.ele('dtFim').txt(dtFim).up();
    cabecalho.ele('QtdRPS').txt(String(normalized.rpsList.length)).up();
    cabecalho.up();

    // RPS list
    for (const rpsItem of normalized.rpsList) {
      this.appendRps(root, rpsItem);
    }

    // Signature do documento inteiro
    if (normalized.documentSignatureXml) {
      this.importDocumentSignature(root, normalized.documentSignatureXml);
    }

    return root.end({ prettyPrint: true });
  }

  private appendRps(root: any, rpsItem: RpsLoteItem): void {
    const rps = root.ele('RPS');

    rps.ele('Assinatura').txt(rpsItem.assinatura).up();

    const chave = rps.ele('ChaveRPS');
    chave.ele('InscricaoPrestador').txt(rpsItem.inscricaoPrestador).up();
    if (rpsItem.serieRps) {
      chave.ele('SerieRPS').txt(rpsItem.serieRps).up();
    }
    chave.ele('NumeroRPS').txt(rpsItem.numeroRps).up();
    chave.up();

    rps.ele('TipoRPS').txt(rpsItem.tipoRps).up();
    rps.ele('DataEmissao').txt(rpsItem.dataEmissao).up();
    rps.ele('StatusRPS').txt(rpsItem.statusRps).up();
    rps.ele('TributacaoRPS').txt(rpsItem.tributacaoRps).up();
    rps.ele('ValorDeducoes').txt(rpsItem.valorDeducoes || '0.00').up();
    rps.ele('ValorPIS').txt(rpsItem.valorPis || '0.00').up();
    rps.ele('ValorCOFINS').txt(rpsItem.valorCofins || '0.00').up();
    rps.ele('ValorINSS').txt(rpsItem.valorInss || '0.00').up();
    rps.ele('ValorIR').txt(rpsItem.valorIr || '0.00').up();
    rps.ele('ValorCSLL').txt(rpsItem.valorCsll || '0.00').up();
    rps.ele('CodigoServico').txt(rpsItem.codigoServico).up();
    rps.ele('AliquotaServicos').txt(rpsItem.aliquotaServicos).up();
    rps.ele('ISSRetido').txt(rpsItem.issRetido).up();

    if (rpsItem.cpfCnpjTomador) {
      const docType = XmlValue.detectTomadorDocType(rpsItem.cpfCnpjTomador);
      if (docType) {
        const tomador = rps.ele('CPFCNPJTomador');
        tomador.ele(docType).txt(XmlValue.onlyDigits(rpsItem.cpfCnpjTomador)).up();
        tomador.up();
      }
    }

    if (rpsItem.inscricaoMunicipalTomador) {
      rps.ele('InscricaoMunicipalTomador').txt(rpsItem.inscricaoMunicipalTomador).up();
    }

    if (rpsItem.inscricaoEstadualTomador) {
      rps.ele('InscricaoEstadualTomador').txt(rpsItem.inscricaoEstadualTomador).up();
    }

    if (rpsItem.razaoSocialTomador) {
      rps.ele('RazaoSocialTomador').txt(rpsItem.razaoSocialTomador).up();
    }

    const hasEndereco =
      rpsItem.tipoLogradouro ||
      rpsItem.logradouro ||
      rpsItem.numeroEndereco ||
      rpsItem.complementoEndereco ||
      rpsItem.bairro ||
      rpsItem.cidade ||
      rpsItem.uf ||
      rpsItem.cep;

    if (hasEndereco) {
      const endereco = rps.ele('EnderecoTomador');

      if (rpsItem.tipoLogradouro) endereco.ele('TipoLogradouro').txt(rpsItem.tipoLogradouro).up();
      if (rpsItem.logradouro) endereco.ele('Logradouro').txt(rpsItem.logradouro).up();
      if (rpsItem.numeroEndereco) endereco.ele('NumeroEndereco').txt(rpsItem.numeroEndereco).up();
      if (rpsItem.complementoEndereco) endereco.ele('ComplementoEndereco').txt(rpsItem.complementoEndereco).up();
      if (rpsItem.bairro) endereco.ele('Bairro').txt(rpsItem.bairro).up();
      if (rpsItem.cidade) endereco.ele('Cidade').txt(rpsItem.cidade).up();
      if (rpsItem.uf) endereco.ele('UF').txt(rpsItem.uf).up();
      if (rpsItem.cep) endereco.ele('CEP').txt(rpsItem.cep).up();

      endereco.up();
    }

    if (rpsItem.emailTomador) {
      rps.ele('EmailTomador').txt(rpsItem.emailTomador).up();
    }

    rps.ele('Discriminacao').txt(rpsItem.discriminacao).up();

    if (rpsItem.valorCargaTributaria) {
      rps.ele('ValorCargaTributaria').txt(rpsItem.valorCargaTributaria).up();
    }

    if (rpsItem.percentualCargaTributaria) {
      rps.ele('PercentualCargaTributaria').txt(rpsItem.percentualCargaTributaria).up();
    }

    if (rpsItem.fonteCargaTributaria) {
      rps.ele('FonteCargaTributaria').txt(rpsItem.fonteCargaTributaria).up();
    }

    if (rpsItem.codigoCei) {
      rps.ele('CodigoCEI').txt(rpsItem.codigoCei).up();
    }

    if (rpsItem.matriculaObra) {
      rps.ele('MatriculaObra').txt(rpsItem.matriculaObra).up();
    }

    if (rpsItem.municipioPrestacao) {
      rps.ele('MunicipioPrestacao').txt(rpsItem.municipioPrestacao).up();
    } else if (!rpsItem.ibsCbs && rpsItem.cLocPrestacao) {
      // Fallback v1: mapeia cLocPrestacao para MunicipioPrestacao se não houver IBSCBS (indica v1)
      rps.ele('MunicipioPrestacao').txt(rpsItem.cLocPrestacao).up();
    }

    if (rpsItem.numeroEncapsulamento) {
      rps.ele('NumeroEncapsulamento').txt(rpsItem.numeroEncapsulamento).up();
    }

    if (rpsItem.valorTotalRecebido) {
      rps.ele('ValorTotalRecebido').txt(rpsItem.valorTotalRecebido).up();
    }

    // choice obrigatório: ValorInicialCobrado OU ValorFinalCobrado
    if (rpsItem.valorInicialCobrado) {
      rps.ele('ValorInicialCobrado').txt(rpsItem.valorInicialCobrado).up();
    } else if (rpsItem.valorFinalCobrado) {
      rps.ele('ValorFinalCobrado').txt(rpsItem.valorFinalCobrado).up();
    }

    if (rpsItem.valorMulta) {
      rps.ele('ValorMulta').txt(rpsItem.valorMulta).up();
    }

    if (rpsItem.valorJuros) {
      rps.ele('ValorJuros').txt(rpsItem.valorJuros).up();
    }

    rps.ele('ValorIPI').txt(rpsItem.valorIpi).up();
    rps.ele('ExigibilidadeSuspensa').txt(rpsItem.exigibilidadeSuspensa).up();
    rps.ele('PagamentoParceladoAntecipado').txt(rpsItem.pagamentoParceladoAntecipado).up();

    if (rpsItem.ncm) {
      rps.ele('NCM').txt(rpsItem.ncm).up();
    }

    // NBS geralmente só existe no layout novo ou casos específicos
    if (rpsItem.ibsCbs && rpsItem.nbs) {
      rps.ele('NBS').txt(rpsItem.nbs).up();
    }

    // choice obrigatório: cLocPrestacao OU cPaisPrestacao (APENAS SE IBSCBS / VERSÃO 2)
    if (rpsItem.ibsCbs) {
      if (rpsItem.cLocPrestacao) {
        rps.ele('cLocPrestacao').txt(rpsItem.cLocPrestacao).up();
      } else if (rpsItem.cPaisPrestacao) {
        rps.ele('cPaisPrestacao').txt(rpsItem.cPaisPrestacao).up();
      }
    }

    // IBSCBS opcional
    if (rpsItem.ibsCbs) {
      const ibsCbs = rps.ele('IBSCBS');
      ibsCbs.ele('finNFSe').txt(rpsItem.ibsCbs.finNFSe).up();
      ibsCbs.ele('indFinal').txt(rpsItem.ibsCbs.indFinal).up();
      ibsCbs.ele('cIndOp').txt(rpsItem.ibsCbs.cIndOp).up();

      if (rpsItem.ibsCbs.tpOper) {
        ibsCbs.ele('tpOper').txt(rpsItem.ibsCbs.tpOper).up();
      }

      ibsCbs.ele('indDest').txt(rpsItem.ibsCbs.indDest).up();

      const valores = ibsCbs.ele('valores');
      const trib = valores.ele('trib');
      const gIBSCBS = trib.ele('gIBSCBS');

      gIBSCBS.ele('cClassTrib').txt(rpsItem.ibsCbs.cClassTrib).up();

      if (rpsItem.ibsCbs.cClassTribReg) {
        const gTribRegular = gIBSCBS.ele('gTribRegular');
        gTribRegular.ele('cClassTribReg').txt(rpsItem.ibsCbs.cClassTribReg).up();
        gTribRegular.up();
      }

      gIBSCBS.up();
      trib.up();
      valores.up();
      ibsCbs.up();
    }

    rps.up();
  }

  private importDocumentSignature(root: any, signatureXml: string): void {
    try {
      const signatureDoc = create(signatureXml);
      root.import(signatureDoc.root());
    } catch {
      throw new Error('documentSignatureXml inválido. Informe um XML ds:Signature válido.');
    }
  }

  private getMinDate(rpsList: RpsLoteItem[]): string {
    const dates = rpsList.map((r) => r.dataEmissao).sort();
    return dates[0];
  }

  private getMaxDate(rpsList: RpsLoteItem[]): string {
    const dates = rpsList.map((r) => r.dataEmissao).sort();
    return dates[dates.length - 1];
  }

  private normalizeInput(input: LoteAsyncData): LoteAsyncData & { rpsList: (RpsLoteItem & { inscricaoPrestador: string })[] } {
    const rpsList = input.rpsList.map((rps) => ({
      ...rps,
      assinatura: XmlValue.normalizeText(rps.assinatura),
      numeroRps: XmlValue.normalizeText(rps.numeroRps, 12),
      serieRps: XmlValue.normalizeText(rps.serieRps, 5),
      tipoRps: XmlValue.normalizeText(rps.tipoRps, 1),
      dataEmissao: XmlValue.normalizeDate(rps.dataEmissao),
      statusRps: XmlValue.normalizeText(rps.statusRps, 1),
      tributacaoRps: XmlValue.normalizeText(rps.tributacaoRps, 1),

      valorDeducoes: XmlValue.normalizeMoney(rps.valorDeducoes),
      valorPis: XmlValue.normalizeMoney(rps.valorPis),
      valorCofins: XmlValue.normalizeMoney(rps.valorCofins),
      valorInss: XmlValue.normalizeMoney(rps.valorInss),
      valorIr: XmlValue.normalizeMoney(rps.valorIr),
      valorCsll: XmlValue.normalizeMoney(rps.valorCsll),

      codigoServico: XmlValue.normalizeText(rps.codigoServico, 5),
      aliquotaServicos: XmlValue.normalizeMoney(rps.aliquotaServicos),
      issRetido: XmlValue.normalizeBooleanString(rps.issRetido),

      cpfCnpjTomador: XmlValue.onlyDigits(rps.cpfCnpjTomador),
      inscricaoMunicipalTomador: XmlValue.onlyDigits(rps.inscricaoMunicipalTomador),
      inscricaoEstadualTomador: XmlValue.onlyDigits(rps.inscricaoEstadualTomador),
      razaoSocialTomador: XmlValue.normalizeText(rps.razaoSocialTomador, 75),

      tipoLogradouro: XmlValue.normalizeText(rps.tipoLogradouro, 50),
      logradouro: XmlValue.normalizeText(rps.logradouro, 125),
      numeroEndereco: XmlValue.normalizeText(rps.numeroEndereco, 10),
      complementoEndereco: XmlValue.normalizeText(rps.complementoEndereco, 60),
      bairro: XmlValue.normalizeText(rps.bairro, 30),
      cidade: XmlValue.onlyDigits(rps.cidade).slice(0, 7),
      uf: XmlValue.normalizeUf(rps.uf),
      cep: XmlValue.normalizeCep(rps.cep),
      emailTomador: XmlValue.normalizeText(rps.emailTomador, 75),

      discriminacao: XmlValue.normalizeText(rps.discriminacao, 2000),

      valorCargaTributaria: XmlValue.normalizeMoney(rps.valorCargaTributaria),
      percentualCargaTributaria: XmlValue.normalizeMoney(rps.percentualCargaTributaria),
      fonteCargaTributaria: XmlValue.normalizeText(rps.fonteCargaTributaria, 10),

      codigoCei: XmlValue.onlyDigits(rps.codigoCei),
      matriculaObra: XmlValue.onlyDigits(rps.matriculaObra),
      municipioPrestacao: XmlValue.onlyDigits(rps.municipioPrestacao).slice(0, 7),
      numeroEncapsulamento: XmlValue.onlyDigits(rps.numeroEncapsulamento),
      valorTotalRecebido: XmlValue.normalizeMoney(rps.valorTotalRecebido),

      valorInicialCobrado: rps.valorInicialCobrado !== undefined && rps.valorInicialCobrado !== null && String(rps.valorInicialCobrado).trim() !== ''
        ? XmlValue.normalizeMoney(rps.valorInicialCobrado)
        : undefined,

      valorFinalCobrado: rps.valorFinalCobrado !== undefined && rps.valorFinalCobrado !== null && String(rps.valorFinalCobrado).trim() !== ''
        ? XmlValue.normalizeMoney(rps.valorFinalCobrado)
        : undefined,

      valorMulta: rps.valorMulta ? XmlValue.normalizeMoney(rps.valorMulta) : undefined,
      valorJuros: rps.valorJuros ? XmlValue.normalizeMoney(rps.valorJuros) : undefined,
      valorIpi: XmlValue.normalizeMoney(rps.valorIpi, '0.00'),

      exigibilidadeSuspensa: XmlValue.normalizeYesNoFlag(rps.exigibilidadeSuspensa),
      pagamentoParceladoAntecipado: XmlValue.normalizeYesNoFlag(rps.pagamentoParceladoAntecipado),

      ncm: XmlValue.onlyDigits(rps.ncm).slice(0, 8),
      nbs: rps.nbs ? XmlValue.onlyDigits(rps.nbs).slice(0, 9) : undefined,

      cLocPrestacao: XmlValue.onlyDigits(rps.cLocPrestacao).slice(0, 7),
      cPaisPrestacao: XmlValue.onlyDigits(rps.cLocPrestacao) ? '' : XmlValue.normalizeText(rps.cPaisPrestacao, 2).toUpperCase(),

      ibsCbs: rps.ibsCbs ? {
        finNFSe: '0' as const,
        indFinal: XmlValue.normalizeYesNoFlag(rps.ibsCbs.indFinal),
        cIndOp: XmlValue.onlyDigits(rps.ibsCbs.cIndOp).slice(0, 6),
        tpOper: rps.ibsCbs.tpOper,
        indDest: (rps.ibsCbs.indDest === '1' ? '1' : '0') as '0' | '1',
        cClassTrib: XmlValue.onlyDigits(rps.ibsCbs.cClassTrib).slice(0, 4),
        cClassTribReg: XmlValue.onlyDigits(rps.ibsCbs.cClassTribReg).slice(0, 4),
      } : undefined,

      inscricaoPrestador: this.resolveInscricaoPrestador(rps),
    }));

    // Cast para ignorar a tipagem estrita do retorno que espera exatamente RpsLoteItem sem extras
    return {
      ...input,
      versao: XmlValue.normalizeText(input.versao || '1', 10),
      cpfCnpjRemetente: XmlValue.onlyDigits(input.cpfCnpjRemetente),
      dtInicio: XmlValue.normalizeDate(input.dtInicio),
      dtFim: XmlValue.normalizeDate(input.dtFim),
      rpsList: rpsList as any,
    };
  }

  private resolveInscricaoPrestador(rps: RpsLoteItem): string {
    /**
     * Se preferir, mova `imPrestador` para o nível do lote
     * e propague para todos os RPS.
     */
    const anyRps = rps as any;
    const imPrestador = XmlValue.onlyDigits(anyRps.imPrestador);

    if (!imPrestador) {
      throw new Error(
        `RPS ${rps.numeroRps}: imPrestador é obrigatório para compor ChaveRPS/InscricaoPrestador.`,
      );
    }

    return imPrestador;
  }
}
