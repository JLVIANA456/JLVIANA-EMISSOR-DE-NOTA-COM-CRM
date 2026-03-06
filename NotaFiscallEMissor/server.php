<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once __DIR__ . '/autoload.php';

use NotaFiscalSP\NotaFiscalSP;
use NotaFiscalSP\Entities\Requests\NF\Rps;
use NotaFiscalSP\Constants\Requests\RPSType;

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';
$config = $input['config'] ?? [];

if (empty($config['cnpj']) || empty($config['certificate']) || empty($config['password'])) {
    echo json_encode(['success' => false, 'error' => 'Configuração incompleta (CNPJ, Certificado ou Senha ausente)']);
    exit;
}

try {
    $nfSP = new NotaFiscalSP([
        'cnpj' => $config['cnpj'],
        'certificate' => $config['certificate'],
        'certificatePass' => $config['password'],
        'im' => $config['im'] ?? null
    ]);

    switch ($action) {
        case 'checkCNPJ':
            $response = $nfSP->cnpjInfo();
            echo json_encode(['success' => true, 'data' => $response->getResponse()]);
            break;

        case 'emitir':
            $data = $input['data'] ?? [];
            if (empty($data)) {
                throw new Exception('Dados da nota ausentes');
            }

            $rps = new Rps();
            $rps->setNumeroRps($data['numeroRps'] ?? '00000001');
            $rps->setTipoRps(RPSType::RECIBO_PROVENIENTE_DE_NOTA_CONJUGADA);
            $rps->setValorServicos($data['valorServicos']);
            $rps->setValorDeducoes($data['valorDeducoes'] ?? 0);
            $rps->setCodigoServico($data['codigoServico']);
            $rps->setAliquotaServicos($data['aliquotaServicos']);
            $rps->setIssRetido($data['issRetido'] ? 'true' : 'false');

            // Handle CPF vs CNPJ
            if (strlen($data['cnpjTomador']) <= 11) {
                $rps->setCpf($data['cnpjTomador']);
            } else {
                $rps->setCnpj($data['cnpjTomador']);
            }

            $rps->setRazaoSocialTomador($data['razaoSocialTomador']);
            $rps->setInscricaoMunicipalTomador($data['inscricaoMunicipalTomador'] ?? null);
            $rps->setLogradouro($data['logradouro']);
            $rps->setNumeroEndereco($data['numeroEndereco']);
            $rps->setComplementoEndereco($data['complemento'] ?? '');
            $rps->setBairro($data['bairro']);
            $rps->setCidade($data['cidade'] ?? '3550308'); // São Paulo
            $rps->setUf($data['uf'] ?? 'SP');
            $rps->setCep($data['cep']);
            $rps->setEmailTomador($data['emailTomador']);
            $rps->setDiscriminacao($data['discriminacao']);

            $response = $nfSP->enviarNota($rps);
            echo json_encode([
                'success' => $response->getSuccess() === 'true',
                'data' => $response->getResponse(),
                'xmlInput' => $response->getXmlInput(),
                'xmlOutput' => $response->getXmlOutput()
            ]);
            break;

        case 'consultar':
            $numero = $input['numero'] ?? '';
            if (empty($numero))
                throw new Exception('Número da nota ausente');
            $response = $nfSP->consultarNf($numero);
            echo json_encode(['success' => true, 'data' => $response->getResponse()]);
            break;

        default:
            echo json_encode(['success' => false, 'error' => 'Ação não suportada']);
            break;
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
