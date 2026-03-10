import { PmspManualSoapClient, SoapVersion } from '../clients/SoapClientManual';
import { LoteRpsAsyncXmlBuilder, LoteAsyncData } from '../builders/LoteRpsAsyncXmlBuilder';
import { ConsultaXmlBuilder } from '../builders/ConsultaXmlBuilder';
import { PmspXmlParser } from '../utils/PmspXmlParser';
import { XmlSigner } from '../security/XmlSigner';
import * as fs from 'fs';
import * as path from 'path';

export type NfseStatus =
    | 'draft'
    | 'lote_enviado'
    | 'processando'
    | 'processado'
    | 'emitida'
    | 'erro';

export interface EnvioLoteResult {
    sucesso: boolean;
    protocolo?: string;
    numeroLote?: string;
    retornoXml: string;
    mensagem?: string;
}

export interface SituacaoLoteResult {
    sucesso: boolean;
    processado: boolean;
    rejeitado: boolean;
    numeroLote?: string;
    protocolo?: string;
    numeroNfe?: string;
    retornoXml: string;
    mensagem?: string;
    erros?: string[];
}

export interface ConsultaNfeResult {
    sucesso: boolean;
    emitida: boolean;
    numeroNfe?: string;
    codigoVerificacao?: string;
    retornoXml: string;
    mensagem?: string;
}

export class NfseService {
    private readonly soap: PmspManualSoapClient;
    private readonly loteBuilder = new LoteRpsAsyncXmlBuilder();
    private readonly consultaBuilder = new ConsultaXmlBuilder();
    private readonly xmlParser = new PmspXmlParser();
    private readonly signer: XmlSigner;

    constructor(config: { certPath: string; certPassword: string }) {
        this.soap = new PmspManualSoapClient({
            endpoint: 'https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx',
            certPath: config.certPath,
            certPassword: config.certPassword,
            rejectUnauthorized: true,
            timeoutMs: 60000,
            soapVersion: '1.1',
        });
        this.signer = new XmlSigner(config.certPath, config.certPassword);
    }

    /**
     * Prepara e sanitiza os dados do lote antes do envio.
     * Resolve falta de assinatura, campos de valores e escolhas mútuas (choice).
     */
    private prepararLoteParaEnvio(input: LoteAsyncData): LoteAsyncData {
        const asMoneyString = (value: unknown, fallback = '0.00'): string => {
            if (value === undefined || value === null) return fallback;
            const raw = String(value).trim();
            if (!raw) return fallback;

            // Se já estiver no formato "123.45"
            if (/^\d+\.\d{2}$/.test(raw)) return raw;

            // Caso contrário, normaliza (ex: "1.500,00" -> "1500.00")
            const normalized = raw.replace(/\./g, '').replace(',', '.');
            const num = Number(normalized);

            if (Number.isNaN(num)) return fallback;
            return num.toFixed(2);
        };

        const preparedRpsList = (input.rpsList || []).map((rpsOriginal: any) => {
            const rps = { ...rpsOriginal };

            const cLocPrestacao = String(rps.cLocPrestacao ?? '').trim();
            const cPaisPrestacaoOriginal = String(rps.cPaisPrestacao ?? '').trim();

            const valorServicosBase =
                rps.valorServicos ?? rps.valorInicialCobrado ?? rps.valorFinalCobrado ?? 0;

            const valorServicos = asMoneyString(valorServicosBase, '0.00');

            // 1. Garante valorInicialCobrado OU valorFinalCobrado
            const valorInicialCobrado =
                rps.valorInicialCobrado !== undefined &&
                    rps.valorInicialCobrado !== null &&
                    String(rps.valorInicialCobrado).trim() !== ''
                    ? asMoneyString(rps.valorInicialCobrado)
                    : (
                        rps.valorFinalCobrado === undefined ||
                        rps.valorFinalCobrado === null ||
                        String(rps.valorFinalCobrado).trim() === ''
                    )
                        ? valorServicos
                        : undefined;

            const valorFinalCobrado =
                rps.valorFinalCobrado !== undefined &&
                    rps.valorFinalCobrado !== null &&
                    String(rps.valorFinalCobrado).trim() !== ''
                    ? asMoneyString(rps.valorFinalCobrado)
                    : undefined;

            // 2. Garante valorIpi como STRING monetária
            const valorIpi =
                rps.valorIpi !== undefined &&
                    rps.valorIpi !== null &&
                    String(rps.valorIpi).trim() !== ''
                    ? asMoneyString(rps.valorIpi)
                    : '0.00';

            // 3. Monta um objeto base para assinatura
            const tempRpsForSig = {
                ...rps,
                valorServicos,
                valorInicialCobrado,
                valorFinalCobrado,
                valorIpi,
                dataEmissao: rps.dataEmissao || new Date().toISOString().split('T')[0],
            };

            // 4. Gera assinatura se não vier
            const assinaturaGerada = this.gerarAssinaturaRps(tempRpsForSig);
            const assinatura =
                rps.assinatura && String(rps.assinatura).trim() !== ''
                    ? String(rps.assinatura).trim()
                    : String(assinaturaGerada ?? '').trim();

            // 5. Se houver cidade, remove país (Regra de Choice)
            const prepared: any = {
                ...rps,
                assinatura,
                valorServicos,
                valorInicialCobrado,
                valorFinalCobrado,
                valorIpi,
                cLocPrestacao: cLocPrestacao || '',
            };

            if (cLocPrestacao) {
                delete prepared.cPaisPrestacao;
            } else {
                prepared.cPaisPrestacao = cPaisPrestacaoOriginal || '';
            }

            return prepared;
        });

        const preparedInput: LoteAsyncData = {
            ...input,
            versao: '2', // Retorna para V2 (necessário para IBS/CBS)
            cpfCnpjRemetente: this.onlyDigits(input.cpfCnpjRemetente),
            rpsList: preparedRpsList,
        };

        console.log('=== INPUT PREPARADO NO SERVICE ===');
        console.log(JSON.stringify(preparedInput, null, 2));
        console.log('=== RPS[0] PREPARADO ===');
        console.log(JSON.stringify(preparedInput.rpsList?.[0], null, 2));

        return preparedInput;
    }

    private onlyDigits(val: any): string {
        // Garante que o valor seja tratado como string antes da regex
        return String(val ?? '').replace(/\D+/g, '');
    }

    /**
     * Gera a assinatura SHA1 do RPS conforme especificação da Prefeitura de SP.
     * String: InscricaoPrestador (8) + SerieRPS (5) + NumeroRPS (12) + DataEmissao (8: YYYYMMDD) + 
     *         TipoRPS (1) + StatusRPS (1) + Tributação (1) + ValorServiços (15) + ValorDeduções (15) + 
     *         CódigoServiço (5) + IndicadorCPFCNPJ (1) + CPFCNPJTomador (14) + ISSRetido (1)
     */
    private gerarAssinaturaRps(rps: any): string {
        const im = this.onlyDigits(rps.imPrestador || rps.inscricaoPrestador).padStart(8, '0');
        const serie = (rps.serieRps || '1').padEnd(5, ' ');
        const numero = this.onlyDigits(rps.numeroRps).padStart(12, '0');

        // Data YYYYMMDD (trata formatos YYYY-MM-DD ou já numéricos)
        const dataObj = new Date(rps.dataEmissao);
        const yyyy = dataObj.getFullYear();
        const mm = String(dataObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dataObj.getDate()).padStart(2, '0');
        const dataFormatted = `${yyyy}${mm}${dd}`;

        const tipo = rps.tipoRps || '1';
        const status = rps.statusRps || '1';
        const tributacao = rps.tributacaoRps || '1';

        // Valores (15 dígitos, sem vírgula/ponto, representados em centavos)
        const vServicos = Math.round(Number(rps.valorServicos || 0) * 100).toString().padStart(15, '0');
        const vDeducoes = Math.round(Number(rps.valorDeducoes || 0) * 100).toString().padStart(15, '0');

        const codServico = this.onlyDigits(rps.codigoServico).padStart(5, '0');

        const docTomador = this.onlyDigits(rps.cpfCnpjTomador || rps.cnpjTomador || rps.cpfTomador);
        const indCpfCnpj = docTomador.length > 11 ? '2' : '1';
        const cpfCnpjTomador = docTomador.padStart(14, '0');

        const issRetido = (rps.issRetido === true || rps.issRetido === 'true' || rps.issRetido === '1' || rps.issRetido === 'S') ? 'S' : 'N';

        const rpsString =
            im + serie + numero + dataFormatted +
            tipo + status + tributacao + vServicos + vDeducoes +
            codServico + indCpfCnpj + cpfCnpjTomador + issRetido;

        console.log("RPS Signature String (Concatenada):", rpsString);

        // Chama o XmlSigner para gerar o Hash assinado (RSA-SHA1) em Base64
        return this.signer.signRpsString(rpsString);
    }

    /**
     * 1. Envia o lote
     */
    public async enviarLote(input: LoteAsyncData): Promise<EnvioLoteResult> {
        // Prepara os dados antes de montar o XML (Resolve erros de escolha, valores e assinatura)
        const preparedInput = this.prepararLoteParaEnvio(input);

        console.log('=== INPUT PREPARADO NO SERVICE ===');
        console.log(JSON.stringify(preparedInput, null, 2));

        const xml = this.loteBuilder.build(preparedInput);
        const signedXml = this.signer.sign(xml, "//*[local-name()='PedidoEnvioLoteRPS']");

        const retornoXml = await this.soap.envioLoteRps({
            VersaoSchema: '2' as any,
            MensagemXML: signedXml
        }, '1.1');

        this.saveXml('envio_lote_res', preparedInput.cpfCnpjRemetente, retornoXml);

        const parsed = this.parseEnvioLote(retornoXml);

        return {
            sucesso: parsed.sucesso,
            protocolo: parsed.protocolo,
            numeroLote: parsed.numeroLote,
            retornoXml,
            mensagem: parsed.mensagem,
        };
    }

    /**
     * Consulta situação do lote
     */
    public async consultarSituacaoLote(params: {
        cnpjPrestador: string;
        imPrestador: string;
        protocolo: string;
    }): Promise<SituacaoLoteResult> {
        const xmlConsulta = this.consultaBuilder.buildConsultaSituacaoLote({
            cnpjPrestador: params.cnpjPrestador,
            imPrestador: params.imPrestador,
            protocolo: params.protocolo,
        });

        // Consulta de lote normalmente não exige assinatura do documento, mas a PMSP pode exigir dependendo da operação.
        // Baseado no conhecimento prévio, PedidoConsultaLote não é assinado.

        const retornoXml = await this.soap.consultaLote({
            VersaoSchema: 2,
            MensagemXML: xmlConsulta
        }, '1.1');

        const parsed = this.parseSituacaoLote(retornoXml);

        return {
            sucesso: parsed.sucesso,
            processado: parsed.processado,
            rejeitado: parsed.rejeitado,
            numeroLote: parsed.numeroLote,
            protocolo: parsed.protocolo,
            numeroNfe: parsed.numeroNfe,
            retornoXml,
            mensagem: parsed.mensagem,
            erros: parsed.erros,
        };
    }

    /**
     * Consulta a NFS-e efetiva
     */
    public async consultarNfe(params: {
        cnpjPrestador: string;
        imPrestador: string;
        numeroNfe: string;
    }): Promise<ConsultaNfeResult> {
        const xmlConsulta = this.consultaBuilder.buildConsultaNfe({
            cnpjPrestador: params.cnpjPrestador,
            imPrestador: params.imPrestador,
            numeroNfe: params.numeroNfe,
        });

        const retornoXml = await this.soap.consultaNfe({
            VersaoSchema: 2,
            MensagemXML: xmlConsulta
        }, '1.1');

        const parsed = this.parseConsultaNfe(retornoXml);

        return {
            sucesso: parsed.sucesso,
            emitida: parsed.emitida,
            numeroNfe: parsed.numeroNfe,
            codigoVerificacao: parsed.codigoVerificacao,
            retornoXml,
            mensagem: parsed.mensagem,
        };
    }

    public async flowCancelar(cnpj: string, im: string, numeroNfe: string) {
        const xml = this.consultaBuilder.buildCancelamentoNfe({
            cnpjPrestador: cnpj,
            imPrestador: im,
            numeroNfe
        });

        const signedXml = this.signer.sign(xml, "//*[local-name()='PedidoCancelamentoNFe']");

        try {
            const responseXml = await this.soap.cancelamentoNfe({
                VersaoSchema: 1,
                MensagemXML: signedXml
            }, '1.1');
            this.saveXml('cancelamento', numeroNfe, responseXml);
            return responseXml;
        } catch (error) {
            console.warn("Falha no SOAP 1.1 com Cancelamento, tentando SOAP 1.2...");
            const responseXml = await this.soap.cancelamentoNfe({
                VersaoSchema: 1,
                MensagemXML: signedXml
            }, '1.2');
            this.saveXml('cancelamento', numeroNfe, responseXml);
            return responseXml;
        }
    }

    public async flowConsultar(cnpj: string, im: string, numeroNfe: string) {
        const xml = this.consultaBuilder.buildConsultaNfe({
            cnpjPrestador: cnpj,
            imPrestador: im,
            numeroNfe
        });

        const signedXml = this.signer.sign(xml, "//*[local-name()='PedidoConsultaNFe']");

        try {
            const responseXml = await this.soap.consultaNfe({
                VersaoSchema: 2,
                MensagemXML: signedXml
            }, '1.1');
            this.saveXml('consulta', numeroNfe, responseXml);
            return responseXml;
        } catch (error) {
            console.warn("Falha no SOAP 1.1 com Consulta, tentando SOAP 1.2...");
            const responseXml = await this.soap.consultaNfe({
                VersaoSchema: 2,
                MensagemXML: signedXml
            }, '1.2');
            this.saveXml('consulta', numeroNfe, responseXml);
            return responseXml;
        }
    }

    /**
     * Fluxo completo:
     * enviar → consultar situação → consultar NFS-e
     */
    public async emitirComAcompanhamento(input: LoteAsyncData): Promise<any> {
        console.log('=== INPUT RECEBIDO NO SERVICE ===');
        console.log(JSON.stringify(input, null, 2));

        // 1. enviar lote
        const envio = await this.enviarLote(input);

        if (!envio.sucesso || !envio.protocolo) {
            return {
                status: 'erro',
                etapa: 'envio_lote',
                mensagem: envio.mensagem || 'Falha ao enviar lote',
                retornoXml: envio.retornoXml,
            };
        }

        // 2. aguardar processamento com polling
        const situacao = await this.aguardarProcessamento({
            cnpjPrestador: input.cpfCnpjRemetente,
            imPrestador: (input.rpsList[0] as any).imPrestador || (input.rpsList[0] as any).inscricaoPrestador,
            protocolo: envio.protocolo,
            tentativas: 12,
            intervaloMs: 5000,
        });

        if (!situacao.sucesso) {
            return {
                status: 'erro',
                etapa: 'consulta_lote',
                mensagem: situacao.mensagem || 'Falha ao consultar lote',
                retornoXml: situacao.retornoXml,
                erros: situacao.erros,
            };
        }

        if (situacao.rejeitado) {
            return {
                status: 'erro',
                etapa: 'lote_rejeitado',
                mensagem: situacao.mensagem || 'Lote rejeitado',
                retornoXml: situacao.retornoXml,
                erros: situacao.erros,
            };
        }

        if (!situacao.processado) {
            return {
                status: 'processando',
                etapa: 'consulta_lote',
                mensagem: 'Lote ainda em processamento',
                retornoXml: situacao.retornoXml,
            };
        }

        const numeroNfe = situacao.numeroNfe;

        if (!numeroNfe) {
            return {
                status: 'processado',
                etapa: 'consulta_lote',
                mensagem: 'Lote processado, mas número da NFS-e não localizado',
                retornoXml: situacao.retornoXml,
            };
        }

        // 4. consultar a NFS-e
        const consultaNfe = await this.consultarNfe({
            cnpjPrestador: input.cpfCnpjRemetente,
            imPrestador: (input.rpsList[0] as any).imPrestador || (input.rpsList[0] as any).inscricaoPrestador,
            numeroNfe,
        });

        if (!consultaNfe.sucesso || !consultaNfe.emitida) {
            return {
                status: 'erro',
                etapa: 'consulta_nfe',
                mensagem: consultaNfe.mensagem || 'Falha ao consultar NFS-e',
                retornoXml: consultaNfe.retornoXml,
            };
        }

        // 5. só agora marque como emitida
        return {
            status: 'emitida',
            etapa: 'concluido',
            numeroNfe: consultaNfe.numeroNfe,
            codigoVerificacao: consultaNfe.codigoVerificacao,
            retornoXml: consultaNfe.retornoXml,
            mensagem: 'Nota emitida com sucesso',
        };
    }

    private async aguardarProcessamento(params: {
        cnpjPrestador: string;
        imPrestador: string;
        protocolo: string;
        tentativas: number;
        intervaloMs: number;
    }): Promise<SituacaoLoteResult> {
        let ultimaResposta: SituacaoLoteResult | null = null;

        for (let i = 0; i < params.tentativas; i++) {
            const resposta = await this.consultarSituacaoLote({
                cnpjPrestador: params.cnpjPrestador,
                imPrestador: params.imPrestador,
                protocolo: params.protocolo,
            });

            ultimaResposta = resposta;

            if (resposta.rejeitado || resposta.processado) {
                return resposta;
            }

            await this.sleep(params.intervaloMs);
        }

        return (
            ultimaResposta || {
                sucesso: false,
                processado: false,
                rejeitado: false,
                retornoXml: '',
                mensagem: 'Nenhuma resposta da consulta do lote',
            }
        );
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * ==========================
     * PARSERS COM XML REAL
     * ==========================
     */

    private parseEnvioLote(xml: string): {
        sucesso: boolean;
        protocolo?: string;
        numeroLote?: string;
        mensagem?: string;
    } {
        const parsed = this.xmlParser.parse(xml);

        const protocolo =
            this.xmlParser.findFirst(parsed, 'Protocolo') ||
            this.xmlParser.findFirst(parsed, 'NumeroProtocolo');

        const numeroLote =
            this.xmlParser.findFirst(parsed, 'NumeroLote') ||
            this.xmlParser.findFirst(parsed, 'Lote');

        const mensagemErro =
            this.xmlParser.findFirst(parsed, 'MensagemErro') ||
            this.xmlParser.findFirst(parsed, 'Mensagem') ||
            this.xmlParser.findFirst(parsed, 'Descricao');

        return {
            sucesso: !!protocolo || !!numeroLote,
            protocolo: protocolo ? String(protocolo) : undefined,
            numeroLote: numeroLote ? String(numeroLote) : undefined,
            mensagem: mensagemErro
                ? String(mensagemErro)
                : protocolo
                    ? 'Lote recebido com sucesso'
                    : 'Resposta sem protocolo',
        };
    }

    private parseSituacaoLote(xml: string): {
        sucesso: boolean;
        processado: boolean;
        rejeitado: boolean;
        numeroLote?: string;
        protocolo?: string;
        numeroNfe?: string;
        mensagem?: string;
        erros?: string[];
    } {
        const parsed = this.xmlParser.parse(xml);

        const protocolo =
            this.xmlParser.findFirst(parsed, 'Protocolo') ||
            this.xmlParser.findFirst(parsed, 'NumeroProtocolo');

        const numeroLote =
            this.xmlParser.findFirst(parsed, 'NumeroLote') ||
            this.xmlParser.findFirst(parsed, 'Lote');

        const numeroNfe =
            this.xmlParser.findFirst(parsed, 'NumeroNFe') ||
            this.xmlParser.findFirst(parsed, 'NumeroNota') ||
            this.xmlParser.findFirst(parsed, 'NFe');

        const mensagensErro = [
            ...this.xmlParser.findAll(parsed, 'MensagemErro'),
            ...this.xmlParser.findAll(parsed, 'Descricao'),
            ...this.xmlParser.findAll(parsed, 'Erro'),
        ]
            .flat()
            .map((item) => {
                if (typeof item === 'string') return item;
                if (typeof item === 'object' && item?.Descricao) return String(item.Descricao);
                return JSON.stringify(item);
            });

        const situacao =
            this.xmlParser.findFirst(parsed, 'Situacao') ||
            this.xmlParser.findFirst(parsed, 'Status') ||
            this.xmlParser.findFirst(parsed, 'SituacaoLote');

        const situacaoText = situacao ? String(situacao).toLowerCase() : '';

        const processado =
            !!numeroNfe ||
            situacaoText.includes('processado') ||
            situacaoText.includes('concluido') ||
            situacaoText.includes('sucesso');

        const rejeitado =
            mensagensErro.length > 0 ||
            situacaoText.includes('rejeitado') ||
            situacaoText.includes('erro');

        return {
            sucesso: true,
            processado,
            rejeitado,
            numeroLote: numeroLote ? String(numeroLote) : undefined,
            protocolo: protocolo ? String(protocolo) : undefined,
            numeroNfe: numeroNfe ? String(numeroNfe) : undefined,
            mensagem: rejeitado
                ? 'Lote rejeitado'
                : processado
                    ? 'Lote processado'
                    : 'Lote em processamento',
            erros: mensagensErro.length ? mensagensErro : undefined,
        };
    }

    private parseConsultaNfe(xml: string): {
        sucesso: boolean;
        emitida: boolean;
        numeroNfe?: string;
        codigoVerificacao?: string;
        mensagem?: string;
    } {
        const parsed = this.xmlParser.parse(xml);

        const numeroNfe =
            this.xmlParser.findFirst(parsed, 'NumeroNFe') ||
            this.xmlParser.findFirst(parsed, 'NumeroNota');

        const codigoVerificacao =
            this.xmlParser.findFirst(parsed, 'CodigoVerificacao') ||
            this.xmlParser.findFirst(parsed, 'Codigo');

        const mensagensErro = [
            ...this.xmlParser.findAll(parsed, 'MensagemErro'),
            ...this.xmlParser.findAll(parsed, 'Descricao'),
            ...this.xmlParser.findAll(parsed, 'Erro'),
        ]
            .flat()
            .map((item) => {
                if (typeof item === 'string') return item;
                if (typeof item === 'object' && item?.Descricao) return String(item.Descricao);
                return JSON.stringify(item);
            });

        return {
            sucesso: !!numeroNfe && mensagensErro.length === 0,
            emitida: !!numeroNfe,
            numeroNfe: numeroNfe ? String(numeroNfe) : undefined,
            codigoVerificacao: codigoVerificacao ? String(codigoVerificacao) : undefined,
            mensagem:
                mensagensErro[0] ||
                (numeroNfe ? 'NFS-e localizada' : 'NFS-e não localizada'),
        };
    }

    private saveXml(type: string, id: string, content: string) {
        const dir = path.join(__dirname, '../../storage', type);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, `${id.replace(/[^a-z0-9]/gi, '_')}.xml`), content);
    }
}
