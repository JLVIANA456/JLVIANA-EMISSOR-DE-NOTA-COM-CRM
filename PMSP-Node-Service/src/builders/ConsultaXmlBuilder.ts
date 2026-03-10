import { create } from 'xmlbuilder2';

export class ConsultaXmlBuilder {
    public buildConsultaSituacaoLote(input: {
        cnpjPrestador: string;
        imPrestador: string;
        protocolo: string;
    }): string {
        const root = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('PedidoConsultaLote', {
                xmlns: 'http://www.prefeitura.sp.gov.br/nfe',
            });

        const cabecalho = root.ele('Cabecalho', { Versao: '2' });
        const remetente = cabecalho.ele('CPFCNPJRemetente');
        remetente.ele('CNPJ').txt(this.onlyDigits(input.cnpjPrestador)).up();
        remetente.up();
        cabecalho.up();

        const detalhe = root.ele('Detalhe');
        detalhe.ele('InscricaoPrestador').txt(this.onlyDigits(input.imPrestador)).up();
        detalhe.ele('Protocolo').txt(input.protocolo).up();
        detalhe.up();

        return root.end({ prettyPrint: true });
    }

    public buildConsultaNfe(input: {
        cnpjPrestador: string;
        imPrestador: string;
        numeroNfe: string;
    }): string {
        const root = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('PedidoConsultaNFe', {
                xmlns: 'http://www.prefeitura.sp.gov.br/nfe',
            });

        const cabecalho = root.ele('Cabecalho', { Versao: '2' });
        const remetente = cabecalho.ele('CPFCNPJRemetente');
        remetente.ele('CNPJ').txt(this.onlyDigits(input.cnpjPrestador)).up();
        remetente.up();
        cabecalho.up();

        const detalhe = root.ele('Detalhe');
        const chave = detalhe.ele('ChaveNFe');
        chave.ele('InscricaoPrestador').txt(this.onlyDigits(input.imPrestador)).up();
        chave.ele('NumeroNFe').txt(input.numeroNfe).up();
        chave.up();
        detalhe.up();

        return root.end({ prettyPrint: true });
    }

    public buildCancelamentoNfe(input: {
        cnpjPrestador: string;
        imPrestador: string;
        numeroNfe: string;
    }): string {
        const root = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('PedidoCancelamentoNFe', {
                xmlns: 'http://www.prefeitura.sp.gov.br/nfe',
            });

        const cabecalho = root.ele('Cabecalho', { Versao: '1' }); // Cancelamento costuma ser v1 na PMSP
        const remetente = cabecalho.ele('CPFCNPJRemetente');
        remetente.ele('CNPJ').txt(this.onlyDigits(input.cnpjPrestador)).up();
        remetente.up();
        cabecalho.up();

        const detalhe = root.ele('Detalhe');
        const chave = detalhe.ele('ChaveNFe');
        chave.ele('InscricaoPrestador').txt(this.onlyDigits(input.imPrestador)).up();
        chave.ele('NumeroNFe').txt(this.onlyDigits(input.numeroNfe)).up();
        chave.up();
        detalhe.up();

        return root.end({ prettyPrint: true });
    }

    private onlyDigits(value: unknown): string {
        return String(value ?? '').replace(/\D+/g, '');
    }
}
