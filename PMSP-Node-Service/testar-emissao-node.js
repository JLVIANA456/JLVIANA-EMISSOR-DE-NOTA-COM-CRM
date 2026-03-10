
const { NfseService } = require('./src/services/NfseService');
const path = require('path');
require('dotenv').config();

// MOCK DE DADOS PARA TESTE
// IMPORTANTE: Substitua pelos dados reais do seu certificado e CNPJ para testar de verdade
const MOCK_DATA = {
    // Caminho para o seu certificado .pfx (Coloque o arquivo na pasta 'certs')
    pfxPath: path.join(__dirname, 'certs/seu_certificado.pfx'),
    pfxPass: '123456', // Senha do certificado

    // Dados do Prestador (Sua empresa)
    cnpjPrestador: '00000000000000',
    imPrestador: '00000000',

    // Dados do Tomador (Cliente)
    cpfCnpjTomador: '00000000000000',
    razaoSocialTomador: 'TOMADOR TESTE NODEJS',
    emailTomador: 'teste@email.com',
    
    // Endereço Tomador
    tipoLogradouro: 'R',
    logradouro: 'RUA DE TESTE',
    numeroEndereco: '100',
    bairro: 'CENTRO',
    cidade: '3550308', // Código IBGE SP
    uf: 'SP',
    cep: '01001000',

    // Dados do Serviço
    valorServicos: '1.00', // R$ 1,00
    codigoServico: '02881', // Consultoria
    aliquotaServicos: '0.02', // 2%
    discriminacao: 'TESTE DE EMISSAO VIA NODE.JS - LAYOUT 2026',
    
    // Novos Campos 2026 (Opcionais por enquanto)
    cClassTrib: '000000', // Exemplo
    indFinal: '1',
    cIndOp: '000000',
    indDest: '0'
};

async function runTest() {
    console.log('🚀 Iniciando teste de emissão via Node.js...');

    if (!require('fs').existsSync(MOCK_DATA.pfxPath)) {
        console.error(`❌ Erro: Certificado não encontrado em ${MOCK_DATA.pfxPath}`);
        console.log('👉 Por favor, coloque um arquivo .pfx válido na pasta certs/ e atualize este script.');
        return;
    }

    try {
        // 1. Inicializa o Serviço
        const nfseService = new NfseService(MOCK_DATA.pfxPath, MOCK_DATA.pfxPass);

        // 2. Prepara os dados do RPS
        const rpsData = {
            numeroRps: '999' + Math.floor(Math.random() * 1000), // Número aleatório para não duplicar
            serieRps: 'AAAAA',
            tipoRps: 'RPS',
            dataEmissao: new Date().toISOString().split('T')[0], // Hoje (AAAA-MM-DD)
            statusRps: 'N', // Normal
            tributacaoRps: 'T', // Tributado em SP
            
            // Espalha os dados do mock
            cnpjPrestador: MOCK_DATA.cnpjPrestador,
            imPrestador: MOCK_DATA.imPrestador,
            cpfCnpjTomador: MOCK_DATA.cpfCnpjTomador,
            razaoSocialTomador: MOCK_DATA.razaoSocialTomador,
            tipoLogradouro: MOCK_DATA.tipoLogradouro,
            logradouro: MOCK_DATA.logradouro,
            numeroEndereco: MOCK_DATA.numeroEndereco,
            bairro: MOCK_DATA.bairro,
            cidade: MOCK_DATA.cidade,
            uf: MOCK_DATA.uf,
            cep: MOCK_DATA.cep,
            emailTomador: MOCK_DATA.emailTomador,
            discriminacao: MOCK_DATA.discriminacao,
            valorServicos: MOCK_DATA.valorServicos,
            codigoServico: MOCK_DATA.codigoServico,
            aliquotaServicos: MOCK_DATA.aliquotaServicos,
            
            // Campos 2026
            cClassTrib: MOCK_DATA.cClassTrib,
            indFinal: MOCK_DATA.indFinal,
            cIndOp: MOCK_DATA.cIndOp,
            indDest: MOCK_DATA.indDest
        };

        console.log(`📦 Gerando RPS Nº ${rpsData.numeroRps}...`);

        // 3. Executa o fluxo de emissão
        // Isso vai: Calcular Hash -> Assinar Hash -> Gerar XML -> Assinar XML -> Enviar SOAP
        const responseXml = await nfseService.flowEmitir(rpsData);

        console.log('✅ Resposta Recebida da Prefeitura!');
        console.log('-----------------------------------');
        console.log(responseXml);
        console.log('-----------------------------------');
        console.log('📂 Verifique a pasta storage/retorno/ para ver o XML completo.');

    } catch (error) {
        console.error('❌ Erro durante o teste:');
        console.error(error.message);
        if (error.response) {
            console.error('Dados da resposta:', error.response.data);
        }
    }
}

runTest();
