import * as soap from 'soap';
import * as winston from 'winston';
import { readFileSync } from 'fs';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'soap-requests.log' })
    ]
});

export class SoapClient {
    private client: any;
    private readonly wsdl: string = 'https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx?WSDL';
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY = 2000;

    public async init(certPath: string, keyPath: string, passphrase: string) {
        return new Promise((resolve, reject) => {
            const options = {
                wsdl_options: {
                    cert: readFileSync(certPath),
                    key: readFileSync(keyPath),
                    passphrase: passphrase,
                    rejectUnauthorized: false
                }
            };

            soap.createClient(this.wsdl, options, (err, client) => {
                if (err) return reject(err);

                client.setSecurity(new soap.ClientSSLSecurity(
                    certPath,
                    certPath,
                    { passphrase }
                ));

                this.client = client;
                resolve(true);
            });
        });
    }

    public async call(method: string, xml: string, retryCount = 0): Promise<any> {
        try {
            return await this.executeCall(method, xml);
        } catch (error: any) {
            const isNetworkError = error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.socket;
            if (isNetworkError && retryCount < this.MAX_RETRIES) {
                const delay = this.RETRY_DELAY * Math.pow(2, retryCount);
                logger.warn(`Network error detected. Retrying ${method} in ${delay}ms... (Attempt ${retryCount + 1}/${this.MAX_RETRIES})`);
                await new Promise(res => setTimeout(res, delay));
                return this.call(method, xml, retryCount + 1);
            }
            throw error;
        }
    }

    private async executeCall(method: string, xml: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.client) return reject(new Error('Soap Client not initialized'));

            const args = {
                VersaoSchema: 1,
                MensagemXML: xml
            };

            const maskedXml = this.maskSensitiveData(xml);
            logger.info(`Calling PMSP method: ${method} | Body: ${maskedXml}`);

            this.client[method](args, (err: any, result: any) => {
                if (err) {
                    logger.error(`SOAP Error in ${method}: ${err.message}`);
                    return reject(err);
                }

                logger.info(`Response received for ${method}`);
                resolve(result.RetornoXML);
            });
        });
    }

    private maskSensitiveData(xml: string): string {
        // Simple masking for CNPJ/CPF and Passwords in logs
        return xml
            .replace(/<(CNPJ|CPF|InscricaoPrestador)>.*?<\/\1>/g, '<$1>***MASKED***</$1>')
            .replace(/<(Senha|Password)>.*?<\/\1>/g, '<$1>***MASKED***</$1>');
    }
}
