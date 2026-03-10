import fs from 'fs';
import path from 'path';
import * as soap from 'soap';
import * as winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'soap-requests.log' })
    ]
});

type SoapMethodName =
  | 'EnvioLoteRPS'
  | 'ConsultaLote'
  | 'ConsultaNFe'
  | 'CancelamentoNFe';

export interface SoapClientConfig {
  wsdlPath?: string;
  endpoint?: string;
  certPath: string;
  certPassword: string;
  rejectUnauthorized?: boolean;
  timeoutMs?: number;
}

export interface EnvioLoteArgs {
  VersaoSchema: number;
  MensagemXML: string;
}

export interface ConsultaLoteArgs {
  VersaoSchema: number;
  MensagemXML: string;
}

export interface ConsultaNfeArgs {
  VersaoSchema: number;
  MensagemXML: string;
}

export interface CancelamentoNfeArgs {
  VersaoSchema: number;
  MensagemXML: string;
}

export class SoapClient {
  private client: any | null = null;
  private readonly config: Required<SoapClientConfig>;

  constructor(config: SoapClientConfig) {
    // Tenta resolver o WSDL em vários locais possíveis
    const possibleWsdlPaths = [
        config.wsdlPath,
        path.resolve(process.cwd(), 'src', 'wsdl', 'lotenfe.wsdl'),
        path.resolve(__dirname, '../../src/wsdl/lotenfe.wsdl'),
        path.resolve(process.cwd(), 'dist', 'wsdl', 'lotenfe.wsdl')
    ].filter(Boolean) as string[];

    let resolvedWsdl = '';
    for (const p of possibleWsdlPaths) {
        if (fs.existsSync(p)) {
            resolvedWsdl = p;
            break;
        }
    }

    this.config = {
      wsdlPath: resolvedWsdl || path.resolve(process.cwd(), 'src', 'wsdl', 'lotenfe.wsdl'),
      endpoint: config.endpoint || 'https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx',
      certPath: config.certPath,
      certPassword: config.certPassword,
      rejectUnauthorized: config.rejectUnauthorized ?? false,
      timeoutMs: config.timeoutMs ?? 30000,
    };
  }

  /**
   * =========================================================
   * Inicialização
   * =========================================================
   */
  public async init(certPath?: string, keyPath?: string, passphrase?: string): Promise<void> {
    if (this.client) return;

    // Suporte para a assinatura antiga do init, se necessário
    if (certPath && passphrase) {
        this.config.certPath = certPath;
        this.config.certPassword = passphrase;
    }

    const wsdlPath = this.config.wsdlPath;
    
    // Tratamento para certificado vindo em base64 (memória) ou arquivo
    let pfx: Buffer;
    try {
        if (fs.existsSync(this.config.certPath)) {
            pfx = fs.readFileSync(this.config.certPath);
        } else {
            // Assume que é base64 se não for arquivo
            pfx = Buffer.from(this.config.certPath, 'base64');
        }
    } catch (e) {
        console.error('Erro ao carregar certificado:', e);
        throw new Error(`Certificado inválido ou não encontrado: ${this.config.certPath.slice(0, 50)}...`);
    }

    console.log('=== PMSP SOAP INIT ===');
    console.log('WSDL PATH:', wsdlPath);
    console.log('ENDPOINT:', this.config.endpoint);
    console.log('======================');

    const options: any = {
      endpoint: this.config.endpoint,
      wsdl_options: {
        pfx,
        passphrase: this.config.certPassword,
        rejectUnauthorized: this.config.rejectUnauthorized,
        timeout: this.config.timeoutMs,
        secureOptions: 0x40000000 // SSL_OP_NO_RENEGOTIATION
      },
    };

    this.client = await new Promise<any>((resolve, reject) => {
      soap.createClient(wsdlPath, options, (err, client) => {
        if (err) {
          console.error('Erro ao criar cliente SOAP (WSDL Local):', err);
          return reject(err);
        }

        try {
          client.setEndpoint(this.config.endpoint);

          client.setSecurity(
            new soap.ClientSSLSecurityPFX(pfx, this.config.certPassword, {
              rejectUnauthorized: this.config.rejectUnauthorized,
              timeout: this.config.timeoutMs,
              secureOptions: 0x40000000 
            }),
          );

          // client.addHttpHeader('Connection', 'keep-alive');

          console.log('=== DESCRIBE CLIENT ===');
          console.log(JSON.stringify(client.describe(), null, 2));
          console.log('=======================');

          resolve(client);
        } catch (securityErr) {
          console.error('Erro ao configurar segurança SSL/PFX:', securityErr);
          reject(securityErr);
        }
      });
    });
  }

  /**
   * =========================================================
   * Método genérico de compatibilidade com código existente
   * =========================================================
   */
  public async call(method: string, xml: string, version: number = 1, retryCount = 0): Promise<any> {
      // Garante inicialização se não foi feita
      if (!this.client) {
          throw new Error('SoapClient não inicializado. Chame init() primeiro.');
      }
      
      return this.callMethod(method, {
          VersaoSchema: version,
          MensagemXML: xml
      });
  }

  /**
   * =========================================================
   * Método genérico robusto
   * =========================================================
   */
  public async callMethod(
    method: string,
    args: { VersaoSchema: number; MensagemXML: string },
  ): Promise<string> {
    
    if (!this.client) {
      throw new Error('Cliente SOAP PMSP não inicializado.');
    }

    if (!method || typeof method !== 'string') {
      throw new Error('Nome do método SOAP inválido.');
    }

    if (typeof args.MensagemXML !== 'string' || !args.MensagemXML.trim()) {
      throw new Error('MensagemXML é obrigatória e deve ser string.');
    }

    console.log('=== SOAP CALL ===');
    console.log('METHOD:', method);
    console.log('ARGS KEYS:', Object.keys(args));
    console.log('=================');

    this.ensureMethodExists(method);
    
    const maskedXml = this.maskSensitiveData(args.MensagemXML);
    logger.info(`Calling PMSP method: ${method} (v${args.VersaoSchema}) | Body: ${maskedXml}`);

    console.log('--- XML ENVIADO PARA PMSP ---');
    console.log(args.MensagemXML);
    console.log('-----------------------------');

    return new Promise<string>((resolve, reject) => {
      this.client[method](args, (err: any, result: any, rawResponse: any) => {
        if (err) {
          console.error(`SOAP Error in ${method}:`, err);
          logger.error(`SOAP Error in ${method}: ${JSON.stringify(err)}`);

          if (err?.body) {
            console.error(`SOAP Error Body in ${method}:`);
            console.error(err.body);
            logger.error(`SOAP Error Body: ${err.body}`);
          }

          if (rawResponse) {
             // console.error(`SOAP Raw Response in ${method}:`, rawResponse);
          }

          return reject(err);
        }

        console.log(`Response received for ${method}`);
        logger.info(`Response received for ${method}`);

        /**
         * A PMSP normalmente devolve RetornoXML.
         * Mantive fallback para inspecionar outras estruturas.
         */
        const retornoXml =
          result?.RetornoXML ??
          result?.retornoXML ??
          result?.return ??
          result;

        if (!retornoXml) {
          console.error('Resposta SOAP sem RetornoXML:', result);
          return reject(
            new Error(`Resposta SOAP vazia ou sem RetornoXML para ${method}`),
          );
        }

        resolve(typeof retornoXml === 'string' ? retornoXml : JSON.stringify(retornoXml));
      });
    });
  }

  /**
   * =========================================================
   * Utilitários internos
   * =========================================================
   */
  private ensureMethodExists(method: string): void {
    if (!this.client) {
      throw new Error('Cliente SOAP não inicializado.');
    }

    if (typeof this.client[method] !== 'function') {
      const describe = this.safeDescribe();
      console.error('Método não encontrado no client SOAP:', method);
      console.error('Describe do client:', JSON.stringify(describe, null, 2));
      throw new Error(`Método SOAP inexistente no WSDL: ${method}`);
    }
  }

  private safeDescribe(): any {
    try {
      return this.client?.describe?.() ?? {};
    } catch {
      return {};
    }
  }

  private maskSensitiveData(xml: string): string {
      // Simple masking for CNPJ/CPF and Passwords in logs
      return xml
          .replace(/<(CNPJ|CPF|InscricaoPrestador)>.*?<\/\1>/g, '<$1>***MASKED***</$1>')
          .replace(/<(Senha|Password)>.*?<\/\1>/g, '<$1>***MASKED***</$1>');
  }
}
