import { SignedXml } from 'xml-crypto';
import * as forge from 'node-forge';
import { readFileSync } from 'fs';

export class XmlSigner {
    private privateKey: string = '';
    private certificate: string = '';

    constructor(pfxPath: string, passphrase: string) {
        const pfxBuffer = readFileSync(pfxPath);
        const pfxDer = pfxBuffer.toString('binary');
        const p12Asn1 = forge.asn1.fromDer(pfxDer);
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, passphrase);

        // Get private key
        const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
        const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]![0];
        if (keyBag && keyBag.key) {
            this.privateKey = forge.pki.privateKeyToPem(keyBag.key);
        }

        // Get certificate
        const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
        const certBag = certBags[forge.pki.oids.certBag]![0];
        if (certBag && certBag.cert) {
            this.certificate = forge.pki.certificateToPem(certBag.cert);
        }
    }

    public getPem(): string {
        return this.certificate + '\n' + this.privateKey;
    }

    public sign(xml: string, xpathToSign: string): string {
        const sig = new SignedXml({
            privateKey: this.privateKey,
            publicCert: this.certificate,
            signatureAlgorithm: "http://www.w3.org/2000/09/xmldsig#rsa-sha1",
            canonicalizationAlgorithm: "http://www.w3.org/2001/10/xml-exc-c14n#"
        });

        // São Paulo requires specific Canonicalization and Transform
        sig.addReference({
            xpath: xpathToSign,
            transforms: [
                "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
                "http://www.w3.org/2001/10/xml-exc-c14n#"
            ],
            digestAlgorithm: "http://www.w3.org/2000/09/xmldsig#sha1"
        });

        sig.computeSignature(xml, {
            location: { reference: xpathToSign, action: 'append' }
        });

        return sig.getSignedXml();
    }
}
