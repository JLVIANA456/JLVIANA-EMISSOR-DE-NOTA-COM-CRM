import fs from 'fs';
import path from 'path';
import https from 'https';
import axios from 'axios';

export type SoapVersion = '1.1' | '1.2';

export interface PmspManualSoapConfig {
  endpoint?: string;
  certPath: string;
  certPassword: string;
  rejectUnauthorized?: boolean;
  timeoutMs?: number;
  soapVersion?: SoapVersion;
}

export class PmspManualSoapClient {
  private readonly config: Required<PmspManualSoapConfig>;

  constructor(config: PmspManualSoapConfig) {
    this.config = {
      endpoint: config.endpoint || 'https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx',
      certPath: config.certPath,
      certPassword: config.certPassword,
      rejectUnauthorized: config.rejectUnauthorized ?? true,
      timeoutMs: config.timeoutMs ?? 60000,
      soapVersion: config.soapVersion || '1.1',
    };
  }

  public async testConnection(): Promise<void> {
    console.log('=== TESTE DE CONEXÃO HTTPS SIMPLES ===');
    console.log('ENDPOINT:', this.config.endpoint);

    let pfx: Buffer;
    try {
      if (fs.existsSync(this.config.certPath)) {
        pfx = fs.readFileSync(this.config.certPath);
      } else {
        pfx = Buffer.from(this.config.certPath, 'base64');
      }
    } catch (e) {
      console.error('Falha ao carregar certificado para o teste:', e);
      return;
    }

    return new Promise((resolve, reject) => {
      const req = https.request(
        this.config.endpoint,
        {
          method: 'GET',
          pfx,
          passphrase: this.config.certPassword,
          rejectUnauthorized: true,
          minVersion: 'TLSv1.2',
          maxVersion: 'TLSv1.2', // Fixado TLS 1.2
        },
        (res) => {
          console.log('STATUS HTTPS TEST:', res.statusCode);
          let body = '';
          res.on('data', (chunk) => body += chunk.toString());
          res.on('end', () => {
            console.log('RESPOSTA DO TESTE HTTPS RECEBIDA (Tamanho:', body.length, ')');
            resolve();
          });
        }
      );

      req.on('error', (err: any) => {
        console.error('HTTPS TEST ERROR (ECONNRESET AQUI INDICA PROBLEMA TLS/CERTIFICADO):', err);
        console.error('ENDPOINT:', this.config.endpoint);
        reject(err);
      });

      req.end();
    });
  }

  public async envioLoteRps(args: {
    VersaoSchema: number;
    MensagemXML: string;
  }, soapVersion?: SoapVersion): Promise<string> {
    return this.callSoap('EnvioLoteRPS', args, soapVersion);
  }

  public async consultaLote(args: {
    VersaoSchema: number;
    MensagemXML: string;
  }, soapVersion?: SoapVersion): Promise<string> {
    return this.callSoap('ConsultaLote', args, soapVersion);
  }

  public async consultaNfe(args: {
    VersaoSchema: number;
    MensagemXML: string;
  }, soapVersion?: SoapVersion): Promise<string> {
    return this.callSoap('ConsultaNFe', args, soapVersion);
  }

  public async cancelamentoNfe(args: {
    VersaoSchema: number;
    MensagemXML: string;
  }, soapVersion?: SoapVersion): Promise<string> {
    return this.callSoap('CancelamentoNFe', args, soapVersion);
  }

  public async call(method: string, xml: string, version: number = 1, soapVersion?: SoapVersion): Promise<string> {
    return this.callSoap(method, { VersaoSchema: version, MensagemXML: xml }, soapVersion);
  }

  public async init(certPath?: string, keyPath?: string, passphrase?: string): Promise<void> {
    if (certPath) this.config.certPath = certPath;
    if (passphrase) this.config.certPassword = passphrase;
    return Promise.resolve();
  }

  private async callSoap(
    method: string,
    args: { VersaoSchema: number; MensagemXML: string },
    soapVersionOverride?: SoapVersion
  ): Promise<string> {
    if (!args?.MensagemXML?.trim()) {
      throw new Error('MensagemXML é obrigatória.');
    }

    const soapVersion = soapVersionOverride || this.config.soapVersion;

    // Ajuste do endpoint para Versão 2 (IBS/CBS) da Prefeitura de SP
    const currentEndpoint = args.VersaoSchema === 2
      ? this.config.endpoint.replace('lotenfe.asmx', 'lotenfev2.asmx')
      : this.config.endpoint;

    let pfx: Buffer;
    try {
      if (fs.existsSync(this.config.certPath)) {
        pfx = fs.readFileSync(this.config.certPath);
      } else {
        pfx = Buffer.from(this.config.certPath, 'base64');
      }

      if (pfx.length < 100) {
        throw new Error(`Buffer PFX suspeitamente pequeno (${pfx.length} bytes).`);
      }
    } catch (e) {
      throw new Error(`Erro ao carregar certificado: ${e}`);
    }

    // Agent HTTPS: TLSv1.2, rejectUnauthorized: true, keepAlive: false
    // Removido secureOptions e fixado maxVersion conforme recomendações
    const httpsAgent = new https.Agent({
      pfx,
      passphrase: this.config.certPassword,
      rejectUnauthorized: true,
      keepAlive: false,
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.2',
    });

    const envelope = soapVersion === '1.1'
      ? this.buildSoap11(method, args.VersaoSchema.toString(), args.MensagemXML)
      : this.buildSoap12(method, args.VersaoSchema.toString(), args.MensagemXML);

    const headers = soapVersion === '1.1'
      ? {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"http://www.prefeitura.sp.gov.br/nfe/${method}"`,
        'Connection': 'close',
        'Accept': 'text/xml, application/xml, */*',
      }
      : {
        'Content-Type': `application/soap+xml; charset=utf-8; action="http://www.prefeitura.sp.gov.br/nfe/${method}"`,
        'Connection': 'close',
        'Accept': 'text/xml, application/xml, */*',
      };

    console.log(`=== SOAP MANUAL CALL (${soapVersion}) ===`);
    console.log('METHOD:', method);
    console.log('ENDPOINT:', currentEndpoint);
    console.log('=== SOAP ENVELOPE ENVIADO ===');
    console.log(envelope);
    console.log('=============================');

    try {
      const response = await axios.post(currentEndpoint, envelope, {
        httpsAgent,
        timeout: this.config.timeoutMs,
        headers,
        responseType: 'text',
        validateStatus: () => true,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      console.log('=== SOAP RESPONSE STATUS ===');
      console.log(response.status);

      if (response.status >= 400) {
        console.error('=== SOAP RESPONSE ERROR BODY ===');
        console.error(response.data);
        throw new Error(`Erro HTTP ${response.status} ao chamar PMSP: ${response.data}`);
      }

      const match = response.data.match(/<RetornoXML>([\s\S]*?)<\/RetornoXML>/);
      if (match && match[1]) {
        const xmlResult = match[1]
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'");

        // Validação de Sucesso no XML
        if (xmlResult.includes('<Sucesso>false</Sucesso>')) {
          const errorMatch = xmlResult.match(/<Descricao>([\s\S]*?)<\/Descricao>/);
          const errorCodeMatch = xmlResult.match(/<Codigo>([\s\S]*?)<\/Codigo>/);
          const errorMessage = errorMatch ? errorMatch[1] : 'Erro desconhecido no retorno da prefeitura';
          const errorCode = errorCodeMatch ? errorCodeMatch[1] : '';
          console.error(`ERRO NEGÓCIO PMSP [${errorCode}]: ${errorMessage}`);
          throw new Error(`Prefeitura recusou: ${errorMessage} (${errorCode})`);
        }

        return xmlResult;
      }

      return response.data;
    } catch (error: any) {
      console.error('=== AXIOS ERROR DIAGNOSTICS ===');
      console.error('MESSAGE:', error.message);
      console.error('CODE:', error.code);
      console.error('ERRNO:', error.errno);
      console.error('SYSCALL:', error.syscall);
      console.error('ENDPOINT:', this.config.endpoint);
      console.error('HEADERS:', JSON.stringify(headers, null, 2));
      console.error('ENVELOPE PREVIEW:', envelope.slice(0, 1500));

      if (error.response) {
        console.error('STATUS:', error.response.status);
        console.error('DATA:', error.response.data);
      }

      if (error.request) {
        console.error('REQUEST ENVIADA, SEM RESPOSTA COMPLETA');
      }
      console.error('================================');

      // Se der ECONNRESET, tenta o teste HTTPS puro para isolar a causa
      if (error.code === 'ECONNRESET') {
        try {
          await this.testConnection();
        } catch (testErr) {
          // Erro já logado pelo testConnection
        }
      }

      throw error;
    }
  }

  private buildSoap11(method: string, versaoSchema: string, mensagemXml: string): string {
    // Conforme WSDL, o elemento de entrada deve ter o sufixo 'Request'
    const requestElement = `${method}Request`;
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${requestElement} xmlns="http://www.prefeitura.sp.gov.br/nfe">
      <VersaoSchema>${versaoSchema}</VersaoSchema>
      <MensagemXML><![CDATA[${mensagemXml}]]></MensagemXML>
    </${requestElement}>
  </soap:Body>
</soap:Envelope>`;
  }

  private buildSoap12(method: string, versaoSchema: string, mensagemXml: string): string {
    // Conforme WSDL, o elemento de entrada deve ter o sufixo 'Request'
    const requestElement = `${method}Request`;
    return `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <${requestElement} xmlns="http://www.prefeitura.sp.gov.br/nfe">
      <VersaoSchema>${versaoSchema}</VersaoSchema>
      <MensagemXML><![CDATA[${mensagemXml}]]></MensagemXML>
    </${requestElement}>
  </soap12:Body>
</soap12:Envelope>`;
  }
}
