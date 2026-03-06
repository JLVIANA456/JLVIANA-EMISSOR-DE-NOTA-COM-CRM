<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Configuration
$clicksignBaseUrl = 'https://app.clicksign.com'; // or https://sandbox.clicksign.com
$accessToken = '7164df80-1948-4b9c-a14b-b7de6fd411b0'; // Using the key provided by user

// Helper function to make requests to Clicksign
function callClicksign($endpoint, $method = 'GET', $data = null) {
    global $clicksignBaseUrl, $accessToken;
    
    $url = $clicksignBaseUrl . $endpoint . '?access_token=' . $accessToken;
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    
    if ($data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        throw new Exception("Curl error: $error");
    }
    
    return ['code' => $httpCode, 'body' => json_decode($response, true)];
}

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

try {
    if ($action === 'upload_document') {
        // Frontend sends base64 PDF now
        $pdfBase64 = $input['pdfBase64'] ?? '';
        $title = $input['title'] ?? 'Contrato';
        $deadline = $input['deadline'] ?? date('Y-m-d', strtotime('+30 days'));
        
        if (empty($pdfBase64)) throw new Exception('PDF content missing');

        $safeName = preg_replace('/[^a-zA-Z0-9\s]/', '', $title);
        $safeName = substr($safeName, 0, 60);

        $body = [
            'document' => [
                'path' => "/Contratos/{$safeName}.pdf",
                'content_base64' => $pdfBase64,
                'deadline_at' => $deadline,
                'auto_close' => true,
                'locale' => 'pt-BR',
                'sequence_enabled' => false
            ]
        ];

        $result = callClicksign('/api/v1/documents', 'POST', $body);
        
        if ($result['code'] >= 400) {
            throw new Exception("Clicksign error: " . json_encode($result['body']));
        }

        echo json_encode([
            'success' => true, 
            'documentKey' => $result['body']['document']['key']
        ]);

    } elseif ($action === 'create_signer') {
        $signers = $input['signers'] ?? [];
        $documentKey = $input['documentKey'] ?? '';
        
        if (empty($signers) || empty($documentKey)) throw new Exception('Signers or Document Key missing');

        $results = [];

        foreach ($signers as $signer) {
            // 1. Create Signer
            $signerBody = [
                'signer' => [
                    'email' => $signer['email'],
                    'auths' => ['email'],
                    'name' => $signer['name'],
                    'documentation' => $signer['cpf'] ?? null
                ]
            ];
            
            $signerRes = callClicksign('/api/v1/signers', 'POST', $signerBody);
            if ($signerRes['code'] >= 400) throw new Exception("Error creating signer {$signer['name']}");
            
            $signerKey = $signerRes['body']['signer']['key'];

            // 2. Add to List
            $listBody = [
                'list' => [
                    'document_key' => $documentKey,
                    'signer_key' => $signerKey,
                    'sign_as' => ($signer['role'] === 'testemunha') ? 'witness' : 'sign',
                    'refusable' => true
                ]
            ];

            $listRes = callClicksign('/api/v1/lists', 'POST', $listBody);
            if ($listRes['code'] >= 400) throw new Exception("Error adding signer {$signer['name']} to list");
            
            $results[] = [
                'name' => $signer['name'],
                'signerKey' => $signerKey,
                'requestSignatureKey' => $listRes['body']['list']['request_signature_key']
            ];
        }

        echo json_encode(['success' => true, 'results' => $results]);

    } elseif ($action === 'check_status') {
        $documentKey = $input['documentKey'] ?? '';
        if (empty($documentKey)) throw new Exception('Document Key missing');

        $result = callClicksign("/api/v1/documents/{$documentKey}", 'GET');
        
        if ($result['code'] >= 400) throw new Exception("Error checking status");

        echo json_encode([
            'success' => true,
            'status' => $result['body']['document']['status'],
            'document' => $result['body']['document']
        ]);

    } elseif ($action === 'notify_signers') {
        $requestSignatureKeys = $input['requestSignatureKeys'] ?? [];
        if (empty($requestSignatureKeys)) throw new Exception('No signature keys provided');

        $results = [];
        foreach ($requestSignatureKeys as $key) {
            $body = [
                'request_signature_key' => $key,
                'message' => 'Por favor, assine o contrato.'
            ];
            $res = callClicksign('/api/v1/notifications', 'POST', $body);
            $results[] = ['key' => $key, 'success' => $res['code'] < 400];
        }

        echo json_encode(['success' => true, 'results' => $results]);

    } else {
        throw new Exception("Unknown action: $action");
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
