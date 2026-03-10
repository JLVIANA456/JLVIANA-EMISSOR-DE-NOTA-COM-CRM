import { SignedXml } from 'xml-crypto';
import * as forge from 'node-forge';
import * as fs from 'fs';

export class XmlSigner {
    private privateKey: string = '';
    private certificate: string = '';

    constructor(pfx: string | Buffer, passphrase: string) {
        console.log("XmlSigner: Iniciando construtor...");
        let pfxBuffer: Buffer;

        if (Buffer.isBuffer(pfx)) {
            console.log("XmlSigner: Recebido Buffer direto.");
            pfxBuffer = pfx;
        } else if (typeof pfx === 'string') {
            // Verifica primeiro se o arquivo existe no disco
            if (fs.existsSync(pfx)) {
                console.log(`XmlSigner: Carregando certificado do arquivo: ${pfx}`);
                pfxBuffer = fs.readFileSync(pfx);
            } else {
                // Se não existe arquivo, verificamos se é um Base64
                // Certificados PFX em Base64 são geralmente grandes (> 1000 chars)
                // Caminhos de arquivo raramente excedem 260 chars (limite padrão Windows) ou 4096 (Linux)
                // Além disso, Base64 pode conter '/', o que confundia a verificação anterior.
                
                const isBase64Candidate = pfx.length > 500; // Heurística: se for grande, provavelmente é conteúdo

                if (isBase64Candidate) {
                    try {
                        // Remove headers de data URL se existirem e espaços em branco
                        const base64Clean = pfx.replace(/^data:.*,/, '').replace(/[\r\n\s]/g, '');
                                               
                        console.log(`XmlSigner: Tentando decodificar Base64 (Tamanho original: ${pfx.length}, Limpo: ${base64Clean.length})`);
                        
                        pfxBuffer = Buffer.from(base64Clean, 'base64');
                        console.log(`XmlSigner: Buffer criado com sucesso (Tamanho: ${pfxBuffer.length} bytes)`);
                        
                        if (pfxBuffer.length === 0) {
                             throw new Error('Buffer vazio após decodificação Base64.');
                        }
                    } catch (e) {
                        throw new Error('O certificado fornecido não é um caminho válido nem uma string Base64 válida. Detalhe: ' + (e as Error).message);
                    }
                } else {
                    // Se é curto e não existe, assumimos que era pra ser um caminho
                    throw new Error(`Arquivo de certificado não encontrado no caminho especificado: ${pfx}`);
                }
            }
        } else {
             throw new Error('Formato de certificado inválido.');
        }

        const pfxDer = pfxBuffer.toString('binary');
        console.log("XmlSigner: Convertido para binary. Iniciando forge.asn1.fromDer...");
        const p12Asn1 = forge.asn1.fromDer(pfxDer);
        console.log("XmlSigner: ASN1 parseado com sucesso.");
        
        // Tentativa de decodificar o P12/PFX
        try {
            const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, passphrase);
            
            // Tentativa robusta de extrair a chave privada
            let keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
            let keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
            
            if (!keyBag) {
                 keyBags = p12.getBags({ bagType: forge.pki.oids.keyBag });
                 keyBag = keyBags[forge.pki.oids.keyBag]?.[0];
            }
            
            if (!keyBag) {
                // Tenta iterar sobre todos os safeContents para encontrar a chave
                for (const safeContents of p12.safeContents) {
                    for (const safeBag of safeContents.safeBags) {
                        if (safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag || safeBag.type === forge.pki.oids.keyBag) {
                            keyBag = safeBag;
                            break;
                        }
                    }
                    if (keyBag) break;
                }
            }

            if (keyBag && keyBag.key) {
                // Converte a chave privada para PEM
                this.privateKey = forge.pki.privateKeyToPem(keyBag.key as forge.pki.PrivateKey);
            } else {
                throw new Error('Chave privada não encontrada no certificado PFX.');
            }

            // Obter certificado
            const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
            const certBag = certBags[forge.pki.oids.certBag]?.[0];

            if (certBag && certBag.cert) {
                this.certificate = forge.pki.certificateToPem(certBag.cert as forge.pki.Certificate);
            } else {
                throw new Error('Certificado público não encontrado no arquivo PFX.');
            }

        } catch (error: any) {
             throw new Error(`Erro ao ler o certificado PFX: ${error.message}`);
        }
    }

    /**
     * Assina digitalmente um XML no padrão da Prefeitura de SP.
     * @param xml O XML completo como string.
     * @param xpathToSign O XPath do elemento que será assinado (ex: "//*[local-name(.)='RPS']").
     * @returns O XML assinado.
     */
    public sign(xml: string, xpathToSign: string): string {
        const sig = new SignedXml({
             privateKey: this.privateKey,
             publicCert: this.certificate,
             signatureAlgorithm: "http://www.w3.org/2000/09/xmldsig#rsa-sha1",
             canonicalizationAlgorithm: "http://www.w3.org/2001/10/xml-exc-c14n#"
        });

        // Configuração específica para a Prefeitura de SP
        // A Prefeitura exige Transforms: Enveloped Signature + C14N
        // E Digest: SHA1
        sig.addReference({
            xpath: xpathToSign,
            transforms: [
                "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
                "http://www.w3.org/2001/10/xml-exc-c14n#"
            ],
            digestAlgorithm: "http://www.w3.org/2000/09/xmldsig#sha1"
        });

        sig.computeSignature(xml, {
            location: { reference: xpathToSign, action: 'append' }, // Adiciona a assinatura APÓS o elemento assinado
            prefix: '' // Remove prefixos de namespace na tag Signature (opcional, mas comum em SP)
        });

        return sig.getSignedXml();
    }
    
    /**
     * Assina o RPS individualmente (Tag <Assinatura> dentro do RPS).
     * Esta assinatura é um hash SHA1 de uma string concatenada específica, assinado com RSA.
     * NÃO é uma assinatura XMLDSig padrão.
     * 
     * @param rpsString A string concatenada dos dados do RPS conforme manual (InscricaoPrestador + SerieRPS + NumeroRPS + ...)
     */
    public signRpsString(rpsString: string): string {
        const md = forge.md.sha1.create();
        md.update(rpsString, 'utf8');
        
        const privateKey = forge.pki.privateKeyFromPem(this.privateKey);
        const signature = privateKey.sign(md);
        
        // Retorna em Base64
        return forge.util.encode64(signature);
    }

    public getPem(): string {
        return this.certificate + '\n' + this.privateKey;
    }
}
