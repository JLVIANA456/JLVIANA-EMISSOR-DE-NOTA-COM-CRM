# Módulo de Emissão NFS-e - Prefeitura de São Paulo (PMSP)

Este guia explica como integrar e utilizar o módulo de emissão de Notas Fiscais de Serviço eletrônicas (NFS-e) para a Prefeitura de São Paulo em qualquer sistema PHP ou Frontend moderno.

## 1. Requisitos do Sistema (Servidor PHP)

Para que o módulo funcione, o seu servidor PHP deve ter as seguintes extensões instaladas e habilitadas:

*   **PHP 7.4 ou superior**
*   **Extensão SOAP**: Necessária para comunicação com os WebServices da PMSP.
*   **Extensão OpenSSL**: Necessária para criptografia e leitura do certificado digital.
*   **Extensão SimpleXML**: Para manipulação dos arquivos de retorno.
*   **Composer**: Para gerenciamento de dependências.

### Instalação das Dependências
No diretório do módulo, execute:
```bash
composer install
```

---

## 2. Requisitos Fiscais (Empresa)

Para emitir notas via API/WebService, a empresa precisa:
1.  **Certificado Digital A1**: Arquivo (.pfx ou .p12). O modelo A3 (cartão/token) não é compatível com automação via servidor.
2.  **Autorização na PMSP**: No portal da [Nota do Milhão](https://nfe.prefeitura.sp.gov.br/), a empresa deve estar configurada para "Emissão por Sistema Próprio".
3.  **CCM (Inscrição Municipal)**: Deve estar ativo e vinculado ao CNPJ.

---

## 3. Estrutura do Módulo

O módulo é composto por:
*   `src/`: Núcleo da biblioteca que gera o XML, assina digitalmente e envia via SOAP.
*   `server.php`: Um "Bridge API" pronto para uso que recebe comandos JSON e retorna a resposta da prefeitura.
*   `vendor/`: Dependências externas (gerado pelo Composer).

---

## 4. Como Integrar (Exemplo PHP)

Se você estiver usando PHP puro, pode instanciar a classe diretamente:

```php
use NotaFiscalSP\NotaFiscalSP;
use NotaFiscalSP\Entities\Requests\NF\Rps;

$nfSP = new NotaFiscalSP([
    'cnpj' => '00000000000000',
    'certificate' => '/caminho/para/seu/certificado.pfx',
    'certificatePass' => 'sua_senha',
    'im' => '12345678' // Inscrição Municipal
]);

$rps = new Rps();
$rps->setNumeroRps('1');
$rps->setValorServicos(100.00);
$rps->setCodigoServico('02881'); // Código de serviço municipal
$rps->setAliquotaServicos(0.02); // 2%
$rps->setDiscriminacao('Descrição do serviço prestado');

// Dados do Tomador (Cliente)
$rps->setCnpj('11111111111111');
$rps->setRazaoSocialTomador('Cliente Teste');
$rps->setLogradouro('Rua Exemplo');
$rps->setNumeroEndereco('123');
$rps->setBairro('Centro');
$rps->setCidade('3550308'); // Código IBGE de São Paulo
$rps->setUf('SP');
$rps->setCep('01001000');

$response = $nfSP->enviarNota($rps);

if ($response->getSuccess() === 'true') {
    echo "Sucesso! NF-e: " . $response->getResponse()['NumeroNFe'];
} else {
    echo "Erro: " . $response->getMessage();
}
```

---

## 5. Integração via API (JSON)

Se o seu sistema principal for em **React, Vue, Node.js ou Python**, você pode usar o `server.php` como um microserviço:

**URL**: `http://seu-servidor/server.php`  
**Método**: `POST`  
**Body (JSON)**:
```json
{
  "action": "emitir",
  "config": {
    "cnpj": "00...00",
    "certificate": "C:/certificados/cert.pfx",
    "password": "senha",
    "im": "12345"
  },
  "data": {
    "valorServicos": 150.00,
    "codigoServico": "02881",
    "aliquotaServicos": 0.02,
    "cnpjTomador": "11...11",
    "razaoSocialTomador": "Nome do Cliente",
    "logradouro": "Av Paulista",
    "numeroEndereco": "1000",
    "bairro": "Bela Vista",
    "cidade": "3550308",
    "cep": "01310100",
    "discriminacao": "Serviços de Consultoria"
  }
}
```

---

## 6. Solução de Problemas Comuns

### Erro de Certificado
*   Verifique se a senha do PFX está correta.
*   Certifique-se de que o caminho do arquivo no servidor está correto e o PHP tem permissão de leitura.
*   O módulo converte automaticamente PFX para PEM para o SOAP Client. Certifique-se de que a pasta `sys_get_temp_dir()` do seu servidor permite escrita.

### Erro "Inscrição Municipal inválida"
*   A Inscrição Municipal em São Paulo (CCM) tem 8 dígitos. O sistema completa com zeros à esquerda se necessário, mas verifique se o número está correto no portal da prefeitura.

### Erro de Schema (XML)
*   A PMSP é rigorosa com caracteres especiais. O módulo já limpa a maioria, mas evite usar `&`, `<`, `>` na disciminação.

---

## 7. Comandos de Diagnóstico

O arquivo `server.php` incluído possui uma ação de teste para validar o ambiente:
*   `action: "testCert"`: Tenta ler o certificado e retorna a data de validade e o nome da empresa assinado no arquivo. Use isso para garantir que o servidor PHP está "conversando" com o arquivo PFX.

---
*Desenvolvido para integração simplificada com a Prefeitura de São Paulo.*
