import express from 'express';
import * as dotenv from 'dotenv';
import { NfseService } from './services/NfseService';
import * as path from 'path';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const config = {
    pfxPath: process.env.CERT_PFX_PATH || '',
    pfxPass: process.env.CERT_PASS || ''
};

app.post('/nfse/emitir', async (req, res) => {
    try {
        const service = new NfseService(config.pfxPath, config.pfxPass);
        const result = await service.flowEmitir(req.body);
        res.status(200).send({ success: true, data: result });
    } catch (error: any) {
        res.status(500).send({ success: false, error: error.message });
    }
});

app.post('/nfse/cancelar', async (req, res) => {
    try {
        const { cnpj, im, numeroNfe } = req.body;
        const service = new NfseService(config.pfxPath, config.pfxPass);
        const result = await service.flowCancelar(cnpj, im, numeroNfe);
        res.status(200).send({ success: true, data: result });
    } catch (error: any) {
        res.status(500).send({ success: false, error: error.message });
    }
});

app.post('/nfse/consultar', async (req, res) => {
    try {
        const { cnpj, im, numeroNfe } = req.body;
        const service = new NfseService(config.pfxPath, config.pfxPass);
        const result = await service.flowConsultar(cnpj, im, numeroNfe);
        res.status(200).send({ success: true, data: result });
    } catch (error: any) {
        res.status(500).send({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`PMSP NFSe Service running on port ${PORT}`);
});
