const http = require('http');

const data = JSON.stringify({
    "numeroRps": "200",
    "serieRps": "AAAA",
    "tipoRps": "RPS",
    "dataEmissao": "2026-03-04",
    "statusRps": "N",
    "tributacaoRps": "T",
    "valorServicos": "1.00",
    "codigoServico": "02881",
    "aliquotaServicos": "0.02",
    "cnpjPrestador": "53497516000150",
    "imPrestador": "79512291",
    "cpfCnpjTomador": "00000000000",
    "razaoSocialTomador": "CLIENTE TESTE",
    "tipoLogradouro": "R",
    "logradouro": "PRACA DA SE",
    "numeroEndereco": "1",
    "bairro": "CENTRO",
    "cidade": "3550308",
    "uf": "SP",
    "cep": "01001000",
    "emailTomador": "teste@email.com",
    "discriminacao": "TESTE DE EMISSAO DIRETO PELO SCRIPT"
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/nfse/emitir',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('--- Iniciando Teste de Emissão ---');

const req = http.request(options, (res) => {
    let responseBody = '';
    res.on('data', (chunk) => responseBody += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Resposta da Prefeitura:');
        console.log(JSON.parse(responseBody));
    });
});

req.on('error', (error) => {
    console.error('Erro ao conectar no servidor:', error.message);
    console.log('Certifique-se de que o servidor está rodando (npm run dev)');
});

req.write(data);
req.end();
