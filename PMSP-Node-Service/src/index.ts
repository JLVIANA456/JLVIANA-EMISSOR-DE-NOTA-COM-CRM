import express from 'express';
import * as dotenv from 'dotenv';
import { NfseService } from './services/NfseService';
import * as path from 'path';
import cors from 'cors';
import { mapFrontendToLoteAsync } from './mappers/mapFrontendToLoteAsync';

dotenv.config();

const app = express();

// CORS mais explícito
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware de Log para depuração
app.use((req, res, next) => {
    console.log(`>>> [${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.method === 'POST') {
        console.log('Payload headers:', req.headers['content-type']);
    }
    next();
});

// Aumentar o limite do body para aceitar Base64 grandes de certificados
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const PORT = process.env.PORT || 3000;

const envConfig = {
    pfxPath: process.env.CERT_PFX_PATH || '',
    pfxPass: process.env.CERT_PASS || ''
};

// Health Check
app.get('/nfse/health', (req, res) => {
    res.status(200).send({ status: 'ok', service: 'PMSP-Node-Service' });
});

app.post('/nfse/emitir', async (req, res) => {
    try {
        console.log("Recebendo requisição de emissão...");
        // O frontend envia { config: { certificate, password, ... }, data: { ... } }
        const { config, data } = req.body;

        console.log("Config recebida:", config ? "SIM" : "NÃO");
        if (config?.certificate) console.log("Certificado recebido (tamanho):", config.certificate.length);

        // Prioriza a configuração que vem do request, fallback para env
        const pfxPath = config?.certificate || envConfig.pfxPath;
        const pfxPass = config?.password || envConfig.pfxPass;

        if (!pfxPath) {
            throw new Error('Caminho do certificado não informado (config.certificate ou env CERT_PFX_PATH)');
        }

        // Instancia o serviço
        const service = new NfseService({
            certPath: pfxPath,
            certPassword: pfxPass
        });

        // Mapeamento e Normalização usando o Mapper especializado
        const loteData = mapFrontendToLoteAsync({
            ...data,
            cnpjPrestador: data.cnpjPrestador || data.cpfCnpjRemetente,
        });

        console.log('=== LOTE MAPEADO NA ROTA ===');
        console.log(JSON.stringify(loteData, null, 2));

        const result = await service.emitirComAcompanhamento(loteData);
        res.status(200).send({
            success: result.status === 'emitida' || result.status === 'processando',
            data: result.retornoXml,
            status: result.status,
            message: result.mensagem,
            numeroNfe: result.numeroNfe,
            codigoVerificacao: result.codigoVerificacao
        });
    } catch (error: any) {
        console.error('ERRO EMISSÃO:', error);
        res.status(500).send({ success: false, error: error.message });
    }
});

app.post('/nfse/cancelar', async (req, res) => {
    try {
        const { config, cnpj, im, numeroNfe } = req.body;

        const pfxPath = config?.certificate || envConfig.pfxPath;
        const pfxPass = config?.password || envConfig.pfxPass;

        const service = new NfseService({
            certPath: pfxPath,
            certPassword: pfxPass
        });
        const result = await service.flowCancelar(cnpj, im, numeroNfe);
        res.status(200).send({ success: true, data: result });
    } catch (error: any) {
        console.error('ERRO CANCELAR:', error);
        res.status(500).send({ success: false, error: error.message });
    }
});

app.post('/nfse/consultar', async (req, res) => {
    try {
        const { config, cnpj, im, numeroNfe } = req.body;

        const pfxPath = config?.certificate || envConfig.pfxPath;
        const pfxPass = config?.password || envConfig.pfxPass;

        const service = new NfseService({
            certPath: pfxPath,
            certPassword: pfxPass
        });
        const result = await service.flowConsultar(cnpj, im, numeroNfe);
        res.status(200).send({ success: true, data: result });
    } catch (error: any) {
        console.error('ERRO CONSULTAR:', error);
        res.status(500).send({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`PMSP NFSe Service running on port ${PORT}`);
});
