import { RpsXmlBuilder, RpsData } from '../builders/RpsXmlBuilder';
import { XmlSigner } from '../security/XmlSigner';
import { SoapClient } from '../clients/SoapClient';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import * as path from 'path';

export class NfseService {
    private builder: RpsXmlBuilder;
    private signer: XmlSigner;
    private soap: SoapClient;

    constructor(pfxPath: string, pfxPass: string) {
        this.builder = new RpsXmlBuilder();
        this.signer = new XmlSigner(pfxPath, pfxPass);
        this.soap = new SoapClient();
    }

    public async flowEmitir(data: RpsData) {
        const xml = this.builder.build(data);
        const signedXml = this.signer.sign(xml, "//*[local-name()='PedidoEnvioRPS']");
        this.saveXml('envio', data.numeroRps, signedXml);

        const tmpPemPath = await this.setupAuth();
        try {
            const responseXml = await this.soap.call('EnvioRPS', signedXml);
            this.saveXml('retorno', data.numeroRps, responseXml);
            return responseXml;
        } finally {
            // Clean up could be done here or in a centralized way
        }
    }

    public async flowCancelar(cnpj: string, im: string, numeroNfe: string) {
        const xml = this.builder.buildCancelamento(cnpj, im, numeroNfe);
        const signedXml = this.signer.sign(xml, "//*[local-name()='PedidoCancelamentoNFe']");

        await this.setupAuth();
        const responseXml = await this.soap.call('CancelamentoNFe', signedXml);
        this.saveXml('cancelamento', numeroNfe, responseXml);
        return responseXml;
    }

    public async flowConsultar(cnpj: string, im: string, numeroNfe: string) {
        const xml = this.builder.buildConsulta(cnpj, im, numeroNfe);
        const signedXml = this.signer.sign(xml, "//*[local-name()='PedidoConsultaNFe']");

        await this.setupAuth();
        const responseXml = await this.soap.call('ConsultaNFe', signedXml);
        this.saveXml('consulta', numeroNfe, responseXml);
        return responseXml;
    }

    private async setupAuth() {
        const pemContent = this.signer.getPem();
        const tmpPemPath = path.join(__dirname, '../../certs/temp_auth.pem');
        if (!existsSync(path.join(__dirname, '../../certs'))) mkdirSync(path.join(__dirname, '../../certs'), { recursive: true });
        writeFileSync(tmpPemPath, pemContent);
        await this.soap.init(tmpPemPath, tmpPemPath, process.env.CERT_PASS!);
        return tmpPemPath;
    }

    private saveXml(type: string, id: string, content: string) {
        const dir = path.join(__dirname, '../../storage', type);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        writeFileSync(path.join(dir, `${id}.xml`), content);
    }
}
