import { create } from 'xmlbuilder2';

export interface RpsData {
    numeroRps: string;
    serieRps: string;
    tipoRps: string;
    dataEmissao: string;
    statusRps: string;
    tributacaoRps: string;
    valorServicos: string;
    codigoServico: string;
    aliquotaServicos: string;
    cnpjPrestador: string;
    imPrestador: string;
    cpfCnpjTomador: string;
    razaoSocialTomador: string;
    tipoLogradouro: string;
    logradouro: string;
    numeroEndereco: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
    emailTomador: string;
    discriminacao: string;
}

export class RpsXmlBuilder {
    public build(data: RpsData): string {
        const root = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('p1:PedidoEnvioRPS', { 'xmlns:p1': 'http://www.prefeitura.sp.gov.br/nfe' })
            .ele('Cabecalho', { Versao: '1' })
            .ele('CPFCNPJRemetente')
            .ele('CNPJ').txt(data.cnpjPrestador).up()
            .up()
            .up()
            .ele('RPS')
            .ele('ChaveRPS')
            .ele('InscricaoPrestador').txt(data.imPrestador).up()
            .ele('SerieRPS').txt(data.serieRps).up()
            .ele('NumeroRPS').txt(data.numeroRps).up()
            .up()
            .ele('TipoRPS').txt(data.tipoRps).up()
            .ele('DataEmissao').txt(data.dataEmissao).up()
            .ele('StatusRPS').txt(data.statusRps).up()
            .ele('TributacaoRPS').txt(data.tributacaoRps).up()
            .ele('ValorServicos').txt(data.valorServicos).up()
            .ele('ValorDeducoes').txt('0.00').up()
            .ele('CodigoServico').txt(data.codigoServico).up()
            .ele('AliquotaServicos').txt(data.aliquotaServicos).up()
            .ele('ISSRetido').txt('false').up()
            .ele('CPFCNPJTomador')
            .ele(data.cpfCnpjTomador.length > 11 ? 'CNPJ' : 'CPF').txt(data.cpfCnpjTomador).up()
            .up()
            .ele('RazaoSocialTomador').txt(data.razaoSocialTomador).up()
            .ele('EnderecoTomador')
            .ele('TipoLogradouro').txt(data.tipoLogradouro).up()
            .ele('Logradouro').txt(data.logradouro).up()
            .ele('NumeroEndereco').txt(data.numeroEndereco).up()
            .ele('Bairro').txt(data.bairro).up()
            .ele('Cidade').txt(data.cidade).up()
            .ele('UF').txt(data.uf).up()
            .ele('CEP').txt(data.cep).up()
            .up()
            .ele('EmailTomador').txt(data.emailTomador).up()
            .ele('Discriminacao').txt(data.discriminacao).up()
            .up()
            .up();

        return root.end({ prettyPrint: true });
    }

    public buildCancelamento(cnpj: string, im: string, numeroNfe: string): string {
        const root = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('p1:PedidoCancelamentoNFe', { 'xmlns:p1': 'http://www.prefeitura.sp.gov.br/nfe' })
            .ele('Cabecalho', { Versao: '1' })
            .ele('CPFCNPJRemetente')
            .ele('CNPJ').txt(cnpj).up()
            .up()
            .up()
            .ele('Detalhe')
            .ele('ChaveNFe')
            .ele('InscricaoPrestador').txt(im).up()
            .ele('NumeroNFe').txt(numeroNfe).up()
            .up()
            .up()
            .up();

        return root.end({ prettyPrint: true });
    }

    public buildConsulta(cnpj: string, im: string, numeroNfe: string): string {
        const root = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('p1:PedidoConsultaNFe', { 'xmlns:p1': 'http://www.prefeitura.sp.gov.br/nfe' })
            .ele('Cabecalho', { Versao: '1' })
            .ele('CPFCNPJRemetente')
            .ele('CNPJ').txt(cnpj).up()
            .up()
            .up()
            .ele('Detalhe')
            .ele('ChaveNFe')
            .ele('InscricaoPrestador').txt(im).up()
            .ele('NumeroNFe').txt(numeroNfe).up()
            .up()
            .up()
            .up();

        return root.end({ prettyPrint: true });
    }
}
