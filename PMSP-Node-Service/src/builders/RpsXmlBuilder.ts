import { create } from 'xmlbuilder2';

/**
 * =========================================
 * Tipos
 * =========================================
 */

type YesNoFlag = '0' | '1';
type TomadorDocType = 'CPF' | 'CNPJ';

export interface RpsData {
  numeroRps: string;
  serieRps?: string;
  tipoRps: string;
  dataEmissao: string; // YYYY-MM-DD ou ISO date
  statusRps: string;
  tributacaoRps: string;

  valorServicos: string;
  valorDeducoes?: string;
  valorPis?: string;
  valorCofins?: string;
  valorInss?: string;
  valorIr?: string;
  valorCsll?: string;
  valorIpi?: string;

  codigoServico: string;
  aliquotaServicos: string;
  issRetido?: string;

  cnpjPrestador: string;
  imPrestador: string;

  cpfCnpjTomador: string;
  razaoSocialTomador: string;
  emailTomador?: string;

  tipoLogradouro?: string;
  logradouro?: string;
  numeroEndereco?: string;
  complementoEndereco?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;

  discriminacao: string;

  nbs?: string;
  cLocPrestacao?: string;
  cPaisPrestacao?: string;

  exigibilidadeSuspensa?: YesNoFlag;
  pagamentoParceladoAntecipado?: YesNoFlag;

  /**
   * Reforma Tributária / layout novo
   * Ajuste os nomes/estrutura final exatamente ao XSD oficial.
   */
  ibsCbs?: {
    finNFSe: string;
    indFinal: YesNoFlag;
    cIndOp: string;
    indDest: YesNoFlag;
    cClassTrib?: string;
    cClassTribReg?: string;
    tpOper?: string;
  };

  /**
   * Campo "Assinatura" do layout.
   * Não confundir com XML Signature do documento SOAP/XML.
   */
  assinatura?: string;
}

export interface ConsultaNfeData {
  cnpjPrestador: string;
  imPrestador: string;
  numeroNfe: string;
}

export interface CancelamentoNfeData {
  cnpjPrestador: string;
  imPrestador: string;
  numeroNfe: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * =========================================
 * Utilitários
 * =========================================
 */

class XmlSanitizer {
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

  static normalizeUF(value?: unknown): string {
    return this.normalizeText(value, 2).toUpperCase();
  }

  static normalizeCep(value?: unknown): string {
    return this.onlyDigits(value).slice(0, 8);
  }

  static normalizeMoney(value?: unknown, defaultValue = '0.00'): string {
    const raw = String(value ?? '').trim();
    if (!raw) return defaultValue;

    const normalized = raw
      .replace(/\./g, '')
      .replace(',', '.');

    const num = Number(normalized);
    if (Number.isNaN(num)) return defaultValue;

    return num.toFixed(2);
  }

  static normalizeDate(value?: unknown): string {
    const strValue = String(value ?? '');
    if (!strValue) return '';

    // Se já vier YYYY-MM-DD, mantém
    if (/^\d{4}-\d{2}-\d{2}$/.test(strValue)) return strValue;

    const date = new Date(strValue);
    if (Number.isNaN(date.getTime())) return '';

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
  }

  static detectTomadorDocType(documento?: unknown): TomadorDocType | null {
    const digits = this.onlyDigits(documento);
    if (digits.length === 11) return 'CPF';
    if (digits.length === 14) return 'CNPJ';
    return null;
  }

  static normalizeBooleanFlag(value?: unknown, defaultValue: YesNoFlag = '0'): YesNoFlag {
    if (value === undefined || value === null) return defaultValue;

    const v = value.toString().trim().toLowerCase();

    if (['1', 'true', 's', 'sim', 'y', 'yes'].includes(v)) return '1';
    if (['0', 'false', 'n', 'nao', 'não', 'no'].includes(v)) return '0';

    return defaultValue;
  }
}

/**
 * =========================================
 * Regras de validação
 * =========================================
 */

export class RpsBusinessValidator {
  public validate(data: RpsData): ValidationResult {
    const errors: string[] = [];

    const cnpjPrestador = XmlSanitizer.onlyDigits(data.cnpjPrestador);
    const imPrestador = XmlSanitizer.normalizeText(data.imPrestador);
    const docTomador = XmlSanitizer.onlyDigits(data.cpfCnpjTomador);
    const docTypeTomador = XmlSanitizer.detectTomadorDocType(data.cpfCnpjTomador);

    if (cnpjPrestador.length !== 14) {
      errors.push('CNPJ do prestador deve conter 14 dígitos.');
    }

    if (!imPrestador) {
      errors.push('Inscrição municipal do prestador é obrigatória.');
    }

    if (!XmlSanitizer.normalizeText(data.numeroRps)) {
      errors.push('Número do RPS é obrigatório.');
    }

    if (!XmlSanitizer.normalizeText(data.tipoRps)) {
      errors.push('Tipo do RPS é obrigatório.');
    }

    if (!XmlSanitizer.normalizeDate(data.dataEmissao)) {
      errors.push('Data de emissão inválida. Use YYYY-MM-DD ou uma data ISO válida.');
    }

    if (!XmlSanitizer.normalizeText(data.statusRps)) {
      errors.push('Status do RPS é obrigatório.');
    }

    if (!XmlSanitizer.normalizeText(data.tributacaoRps)) {
      errors.push('Tributação do RPS é obrigatória.');
    }

    if (Number(XmlSanitizer.normalizeMoney(data.valorServicos)) <= 0) {
      errors.push('Valor dos serviços deve ser maior que zero.');
    }

    if (!XmlSanitizer.normalizeText(data.codigoServico)) {
      errors.push('Código do serviço é obrigatório.');
    }

    if (!XmlSanitizer.normalizeText(data.aliquotaServicos)) {
      errors.push('Alíquota de serviços é obrigatória.');
    }

    if (!docTypeTomador) {
      errors.push('CPF/CNPJ do tomador deve conter 11 ou 14 dígitos.');
    }

    if (!XmlSanitizer.normalizeText(data.razaoSocialTomador)) {
      errors.push('Razão social/nome do tomador é obrigatória.');
    }

    if (!XmlSanitizer.normalizeText(data.discriminacao)) {
      errors.push('Discriminação do serviço é obrigatória.');
    }

    if (!data.cLocPrestacao && !data.cPaisPrestacao) {
      errors.push('Informe cLocPrestacao ou cPaisPrestacao.');
    }

    /**
     * Se seu layout exigir NBS sempre, troque esta validação para obrigatória.
     * UPDATE: Tornando opcional para evitar "wrong tag" se não for exigido.
     */
    if (data.nbs && !XmlSanitizer.normalizeText(data.nbs)) {
      errors.push('NBS informado mas vazio.');
    }

    /**
     * Se seu layout exigir IBSCBS sempre, mantenha obrigatoriedade.
     * Caso dependa do tipo de operação, ajuste aqui.
     * UPDATE: Tornando opcional para evitar "wrong tag" em emissoes padrao v1.
     */
    if (data.ibsCbs) {
      if (!XmlSanitizer.normalizeText(data.ibsCbs.finNFSe)) {
        errors.push('IBSCBS.finNFSe é obrigatório quando IBSCBS é informado.');
      }
      if (!XmlSanitizer.normalizeText(data.ibsCbs.cIndOp)) {
        errors.push('IBSCBS.cIndOp é obrigatório quando IBSCBS é informado.');
      }
    }

    /**
     * Validação básica de endereço.
     * Você pode relaxar ou endurecer conforme a operação.
     */
    if (docTypeTomador === 'CNPJ') {
      if (!XmlSanitizer.normalizeText(data.logradouro)) {
        errors.push('Logradouro do tomador é recomendado para tomador PJ.');
      }
      if (!XmlSanitizer.normalizeText(data.cidade)) {
        errors.push('Cidade do tomador é recomendada para tomador PJ.');
      }
      if (!XmlSanitizer.normalizeText(data.uf)) {
        errors.push('UF do tomador é recomendada para tomador PJ.');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * =========================================
 * Normalização de entrada
 * =========================================
 */

export class RpsNormalizer {
  public normalize(input: RpsData): RpsData {
    return {
      ...input,
      numeroRps: XmlSanitizer.normalizeText(input.numeroRps, 12),
      serieRps: XmlSanitizer.normalizeText(input.serieRps || '1', 5),
      tipoRps: XmlSanitizer.normalizeText(input.tipoRps, 1),
      dataEmissao: XmlSanitizer.normalizeDate(input.dataEmissao),
      statusRps: XmlSanitizer.normalizeText(input.statusRps, 1),
      tributacaoRps: XmlSanitizer.normalizeText(input.tributacaoRps, 1),

      valorServicos: XmlSanitizer.normalizeMoney(input.valorServicos),
      valorDeducoes: XmlSanitizer.normalizeMoney(input.valorDeducoes),
      valorPis: XmlSanitizer.normalizeMoney(input.valorPis),
      valorCofins: XmlSanitizer.normalizeMoney(input.valorCofins),
      valorInss: XmlSanitizer.normalizeMoney(input.valorInss),
      valorIr: XmlSanitizer.normalizeMoney(input.valorIr),
      valorCsll: XmlSanitizer.normalizeMoney(input.valorCsll),
      valorIpi: XmlSanitizer.normalizeMoney(input.valorIpi),

      codigoServico: XmlSanitizer.normalizeText(input.codigoServico, 10),
      aliquotaServicos: XmlSanitizer.normalizeText(input.aliquotaServicos, 10),
      issRetido: XmlSanitizer.normalizeBooleanFlag(input.issRetido),

      cnpjPrestador: XmlSanitizer.onlyDigits(input.cnpjPrestador),
      imPrestador: XmlSanitizer.normalizeText(input.imPrestador, 20),

      cpfCnpjTomador: XmlSanitizer.onlyDigits(input.cpfCnpjTomador),
      razaoSocialTomador: XmlSanitizer.normalizeText(input.razaoSocialTomador, 115),
      emailTomador: XmlSanitizer.normalizeText(input.emailTomador, 80),

      tipoLogradouro: XmlSanitizer.normalizeText(input.tipoLogradouro, 20),
      logradouro: XmlSanitizer.normalizeText(input.logradouro, 125),
      numeroEndereco: XmlSanitizer.normalizeText(input.numeroEndereco, 10),
      complementoEndereco: XmlSanitizer.normalizeText(input.complementoEndereco, 60),
      bairro: XmlSanitizer.normalizeText(input.bairro, 60),
      cidade: XmlSanitizer.normalizeText(input.cidade, 60),
      uf: XmlSanitizer.normalizeUF(input.uf),
      cep: XmlSanitizer.normalizeCep(input.cep),

      discriminacao: XmlSanitizer.normalizeText(input.discriminacao, 2000),

      nbs: XmlSanitizer.normalizeText(input.nbs, 20),
      cLocPrestacao: XmlSanitizer.normalizeText(input.cLocPrestacao, 10),
      cPaisPrestacao: XmlSanitizer.normalizeText(input.cPaisPrestacao, 10),

      exigibilidadeSuspensa: XmlSanitizer.normalizeBooleanFlag(input.exigibilidadeSuspensa),
      pagamentoParceladoAntecipado: XmlSanitizer.normalizeBooleanFlag(input.pagamentoParceladoAntecipado),

      assinatura: XmlSanitizer.normalizeText(input.assinatura, 255),

      ibsCbs: input.ibsCbs
        ? {
          finNFSe: XmlSanitizer.normalizeText(input.ibsCbs.finNFSe, 2),
          indFinal: XmlSanitizer.normalizeBooleanFlag(input.ibsCbs.indFinal),
          cIndOp: XmlSanitizer.normalizeText(input.ibsCbs.cIndOp, 20),
          indDest: XmlSanitizer.normalizeBooleanFlag(input.ibsCbs.indDest),
          cClassTrib: XmlSanitizer.normalizeText(input.ibsCbs.cClassTrib, 20),
          cClassTribReg: XmlSanitizer.normalizeText(input.ibsCbs.cClassTribReg, 20),
          tpOper: XmlSanitizer.normalizeText(input.ibsCbs.tpOper, 10),
        }
        : undefined,
    };
  }
}

/**
 * =========================================
 * Builder XML
 * =========================================
 */

export class RpsXmlBuilder {
  private readonly normalizer = new RpsNormalizer();
  private readonly validator = new RpsBusinessValidator();

  public buildEnvioRps(input: RpsData, version: string = '2'): string {
    const data = this.normalizer.normalize(input);
    const result = this.validator.validate(data);

    if (!result.valid) {
      throw new Error(`Falha de validação do RPS:\n- ${result.errors.join('\n- ')}`);
    }

    const tomadorDocType = XmlSanitizer.detectTomadorDocType(data.cpfCnpjTomador);
    if (!tomadorDocType) {
      throw new Error('Documento do tomador inválido.');
    }

    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('p1:PedidoEnvioRPS', { 'xmlns:p1': 'http://www.prefeitura.sp.gov.br/nfe' });

    const cabecalho = root
      .ele('Cabecalho', { Versao: version })
      .ele('CPFCNPJRemetente');

    cabecalho.ele('CNPJ').txt(data.cnpjPrestador).up();
    cabecalho.up().up();

    const rps = root.ele('RPS');

    rps.ele('Assinatura').txt(data.assinatura || '').up();

    const chaveRps = rps.ele('ChaveRPS');
    chaveRps.ele('InscricaoPrestador').txt(data.imPrestador).up();
    if (data.serieRps) {
      chaveRps.ele('SerieRPS').txt(data.serieRps).up();
    }
    chaveRps.ele('NumeroRPS').txt(data.numeroRps).up();
    chaveRps.up();

    rps.ele('TipoRPS').txt(data.tipoRps).up();
    rps.ele('DataEmissao').txt(data.dataEmissao).up();
    rps.ele('StatusRPS').txt(data.statusRps).up();
    rps.ele('TributacaoRPS').txt(data.tributacaoRps).up();

    rps.ele('ValorServicos').txt(data.valorServicos).up();
    rps.ele('ValorDeducoes').txt(data.valorDeducoes || '0.00').up();
    rps.ele('ValorPIS').txt(data.valorPis || '0.00').up();
    rps.ele('ValorCOFINS').txt(data.valorCofins || '0.00').up();
    rps.ele('ValorINSS').txt(data.valorInss || '0.00').up();
    rps.ele('ValorIR').txt(data.valorIr || '0.00').up();
    rps.ele('ValorCSLL').txt(data.valorCsll || '0.00').up();

    rps.ele('CodigoServico').txt(data.codigoServico).up();
    rps.ele('AliquotaServicos').txt(data.aliquotaServicos).up();
    rps.ele('ISSRetido').txt(data.issRetido || '0').up();

    const cpfCnpjTomador = rps.ele('CPFCNPJTomador');
    cpfCnpjTomador.ele(tomadorDocType).txt(data.cpfCnpjTomador).up();
    cpfCnpjTomador.up();

    rps.ele('RazaoSocialTomador').txt(data.razaoSocialTomador).up();

    const hasEndereco =
      data.tipoLogradouro ||
      data.logradouro ||
      data.numeroEndereco ||
      data.bairro ||
      data.cidade ||
      data.uf ||
      data.cep;

    if (hasEndereco) {
      const endereco = rps.ele('EnderecoTomador');

      if (data.tipoLogradouro) endereco.ele('TipoLogradouro').txt(data.tipoLogradouro).up();
      if (data.logradouro) endereco.ele('Logradouro').txt(data.logradouro).up();
      if (data.numeroEndereco) endereco.ele('NumeroEndereco').txt(data.numeroEndereco).up();
      if (data.complementoEndereco) endereco.ele('ComplementoEndereco').txt(data.complementoEndereco).up();
      if (data.bairro) endereco.ele('Bairro').txt(data.bairro).up();
      if (data.cidade) endereco.ele('Cidade').txt(data.cidade).up();
      if (data.uf) endereco.ele('UF').txt(data.uf).up();
      if (data.cep) endereco.ele('CEP').txt(data.cep).up();

      endereco.up();
    }

    if (data.emailTomador) {
      rps.ele('EmailTomador').txt(data.emailTomador).up();
    }

    rps.ele('Discriminacao').txt(data.discriminacao).up();

    if (data.valorIpi) {
      rps.ele('ValorIPI').txt(data.valorIpi).up();
    }

    if (data.exigibilidadeSuspensa) {
      rps.ele('ExigibilidadeSuspensa').txt(data.exigibilidadeSuspensa).up();
    }

    if (data.pagamentoParceladoAntecipado) {
      rps.ele('PagamentoParceladoAntecipado').txt(data.pagamentoParceladoAntecipado).up();
    }

    if (data.ibsCbs && data.nbs) {
      rps.ele('NBS').txt(data.nbs).up();
    }

    if (data.ibsCbs) {
      if (data.cLocPrestacao) {
        rps.ele('cLocPrestacao').txt(data.cLocPrestacao).up();
      } else if (data.cPaisPrestacao) {
        rps.ele('cPaisPrestacao').txt(data.cPaisPrestacao).up();
      }
    }

    /**
     * IMPORTANTE:
     * O bloco abaixo é apenas uma estrutura-base.
     * Ajuste a árvore EXATAMENTE conforme o XSD oficial.
     */
    if (data.ibsCbs) {
      const ibsCbs = rps.ele('IBSCBS');

      ibsCbs.ele('finNFSe').txt(data.ibsCbs.finNFSe).up();
      ibsCbs.ele('indFinal').txt(data.ibsCbs.indFinal).up();
      ibsCbs.ele('cIndOp').txt(data.ibsCbs.cIndOp).up();

      if (data.ibsCbs.tpOper) {
        ibsCbs.ele('tpOper').txt(data.ibsCbs.tpOper).up();
      }

      ibsCbs.ele('indDest').txt(data.ibsCbs.indDest).up();

      const valores = ibsCbs.ele('valores');
      const trib = valores.ele('trib');

      if (data.ibsCbs.cClassTrib) {
        trib.ele('cClassTrib').txt(data.ibsCbs.cClassTrib).up();
      }

      if (data.ibsCbs.cClassTribReg) {
        trib.ele('cClassTribReg').txt(data.ibsCbs.cClassTribReg).up();
      }

      trib.up();
      valores.up();
      ibsCbs.up();
    }

    return root.end({ prettyPrint: true });
  }

  public buildConsultaNfe(input: ConsultaNfeData): string {
    const cnpj = XmlSanitizer.onlyDigits(input.cnpjPrestador);
    const im = XmlSanitizer.normalizeText(input.imPrestador, 20);
    const numeroNfe = XmlSanitizer.normalizeText(input.numeroNfe, 20);

    if (cnpj.length !== 14) {
      throw new Error('CNPJ do prestador inválido para consulta.');
    }
    if (!im) {
      throw new Error('Inscrição municipal do prestador é obrigatória para consulta.');
    }
    if (!numeroNfe) {
      throw new Error('Número da NFS-e é obrigatório para consulta.');
    }

    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('p1:PedidoConsultaNFe', { 'xmlns:p1': 'http://www.prefeitura.sp.gov.br/nfe' });

    const cabecalho = root
      .ele('Cabecalho', { Versao: '1' })
      .ele('CPFCNPJRemetente');

    cabecalho.ele('CNPJ').txt(cnpj).up();
    cabecalho.up().up();

    const detalhe = root.ele('Detalhe');
    const chaveNFe = detalhe.ele('ChaveNFe');

    chaveNFe.ele('InscricaoPrestador').txt(im).up();
    chaveNFe.ele('NumeroNFe').txt(numeroNfe).up();
    chaveNFe.up();
    detalhe.up();

    return root.end({ prettyPrint: true });
  }

  public buildCancelamentoNfe(input: CancelamentoNfeData): string {
    const cnpj = XmlSanitizer.onlyDigits(input.cnpjPrestador);
    const im = XmlSanitizer.normalizeText(input.imPrestador, 20);
    const numeroNfe = XmlSanitizer.normalizeText(input.numeroNfe, 20);

    if (cnpj.length !== 14) {
      throw new Error('CNPJ do prestador inválido para cancelamento.');
    }
    if (!im) {
      throw new Error('Inscrição municipal do prestador é obrigatória para cancelamento.');
    }
    if (!numeroNfe) {
      throw new Error('Número da NFS-e é obrigatório para cancelamento.');
    }

    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('p1:PedidoCancelamentoNFe', { 'xmlns:p1': 'http://www.prefeitura.sp.gov.br/nfe' });

    const cabecalho = root
      .ele('Cabecalho', { Versao: '1' })
      .ele('CPFCNPJRemetente');

    cabecalho.ele('CNPJ').txt(cnpj).up();
    cabecalho.up().up();

    const detalhe = root.ele('Detalhe');
    const chaveNFe = detalhe.ele('ChaveNFe');

    chaveNFe.ele('InscricaoPrestador').txt(im).up();
    chaveNFe.ele('NumeroNFe').txt(numeroNfe).up();
    chaveNFe.up();
    detalhe.up();

    return root.end({ prettyPrint: true });
  }
}

export class XmlSchemaValidator {
  /**
   * Implementação placeholder.
   * Aqui você pode plugar uma lib de validação XSD.
   */
  public validate(_xml: string, _xsdPath: string): ValidationResult {
    return {
      valid: true,
      errors: [],
    };
  }
}
