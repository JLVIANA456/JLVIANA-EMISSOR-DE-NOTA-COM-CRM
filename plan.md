

# Corrigir Upload de Contratos para Clicksign

## Problema
O conteudo gerado pelo contrato e texto puro (markdown/texto juridico). Ao enviar para a Clicksign, o sistema codifica esse texto como base64 e o envia como `.docx`, mas sem a estrutura real de um arquivo Word. Isso faz a pagina de assinatura travar porque o viewer da Clicksign nao consegue renderizar o arquivo.

## Solucao
Gerar um PDF valido usando a biblioteca **jsPDF** dentro da Edge Function antes de enviar para a Clicksign. O conteudo textual sera formatado em paginas A4 com quebras de linha e margem adequadas.

## Etapas

### 1. Atualizar a Edge Function `clicksign-integration`

Na acao `upload_document`, substituir a logica atual de codificacao de texto puro por:

- Importar `jsPDF` via `npm:jspdf`
- Criar um documento PDF A4 com margens
- Processar o texto do contrato (`generated_content`) linha por linha, tratando:
  - Quebras de pagina automaticas quando o texto exceder a area util
  - Linhas de titulo/clausula em negrito
  - Texto normal com fonte serifada
  - Remocao de caracteres markdown (**, ##, etc.)
- Gerar o PDF como base64
- Enviar para a Clicksign com extensao `.pdf` e mime type `application/pdf`

### 2. Mudancas especificas no codigo

```text
ANTES (texto puro como .docx):
  const encoder = new TextEncoder();
  const contentBytes = encoder.encode(contract.generated_content);
  const base64Content = btoa(String.fromCharCode(...contentBytes));
  // path: .docx, content_base64: data:application/...wordprocessingml...

DEPOIS (PDF real):
  import { jsPDF } from "npm:jspdf";
  const doc = new jsPDF({ format: "a4" });
  // processar texto linha por linha com doc.text()
  // doc.addPage() quando necessario
  const pdfBase64 = doc.output("datauristring").split(",")[1];
  // path: .pdf, content_base64: data:application/pdf;base64,...
```

### 3. Detalhes tecnicos

- **Biblioteca**: `npm:jspdf` (compativel com Deno via npm specifier)
- **Formato**: PDF A4, margens de 20mm, fonte Helvetica 11pt
- **Tratamento de texto**: 
  - `doc.splitTextToSize()` para quebrar linhas longas na largura da pagina
  - Deteccao de titulos (linhas com `**` ou `##`) para aplicar negrito
  - Paginacao automatica quando Y exceder limite da pagina
- **Extensao no Clicksign**: `.pdf` em vez de `.docx`
- **Content type**: `data:application/pdf;base64,...`

### 4. Nenhuma mudanca no frontend

O frontend nao precisa de alteracao. A correcao e inteiramente na Edge Function.

