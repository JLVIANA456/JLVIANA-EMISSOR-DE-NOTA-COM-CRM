# 🏢 JLVIANA HUB PRO — Gestão Financeira, NFS-e e CRM com Inteligência Artificial

<div align="center">
  <img src="https://img.shields.io/badge/Versão-2.0-blue.svg" alt="Versão" />
  <img src="https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-Database-3ECF8E.svg?logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/OpenAI-GPT_4o-412991.svg?logo=openai&logoColor=white" alt="OpenAI" />
  <img src="https://img.shields.io/badge/Vite-Build-646CFF.svg?logo=vite&logoColor=white" alt="Vite" />
  <br/><br/>
  <i>Sistema completo de BPO Financeiro, emissão de Notas Fiscais (Prefeitura de SP - Nota do Milhão), Gestão de Contratos com IA Jurídica e Assistente Operacional autônomo.</i>
</div>

---

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [A Inteligência Artificial no HUB](#-a-inteligência-artificial-no-hub-openai)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação e Configuração](#-instalação-e-configuração)
- [Emissor de NFS-e (Nota do Milhão)](#-emissor-de-nfs-e-nota-do-milhão)
- [Estrutura do Banco de Dados](#-estrutura-do-banco-de-dados-supabase)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Como Contribuir](#-como-contribuir)

---

## 🎯 Visão Geral

O **JLVIANA HUB PRO** é uma plataforma all-in-one desenvolvida em React + Vite com backend no Supabase. Permite que empresas prestadoras de serviço (com foco em escritórios contábeis e BPO Financeiro) gerenciem toda a sua operação — desde a captação do cliente até a emissão automática da Nota Fiscal na Prefeitura de São Paulo, agora potencializada pela **OpenAI (GPT-4o)** para automação de tarefas cognitivas.

### ✨ Destaques da Versão 2.0
- 🤖 **Assistente Jurídico IA**: Análise de riscos de vínculo, revisão de cláusulas e adequação à LGPD.
- 📄 **Contratos Inteligentes**: Geração automatizada de contratos contábeis com auto-preenchimento de valores por extenso e exportação para `.docx` e `.pdf`.
- 🧠 **Conciliação Bancária IA**: Comparação automática de extratos OFX com movimentações do sistema para detecção de anomalias.
- 🧾 **Leitura de Comprovantes via OCR/IA**: Extração automática de dados de recibos e boletos via upload de imagem.
- 🚀 **Novo Sistema de Alertas**: Gestão unificada de notificações em tempo real.

---

## 🚀 Funcionalidades Principais

### 💼 Gestão Financeira e Conciliação
- Emissão e controle de Notas Fiscais (NFS-e Municipal SP).
- Contas a Pagar e a Receber inteligente com upload de boletos.
- **Centro de Custos & Projetos** com rateio automático.
- Projeção de caixa futura baseada em histórico de comportamento financeiro.

### 🧾 Nota do Milhão (NFS-e SP)
- Integração direta com o WebService da Prefeitura de São Paulo.
- Suporte a todos os 62+ códigos de serviço municipais de SP.
- Preenchimento automático de alíquotas e itens da LC 116.
- Emissão via certificado digital A1 (`.pfx`).

### 📄 Contratos Inteligentes
- **Gerador Dinâmico**: Formulário inteligente que estrutura contratos completos baseando-se em mapeadores de dados (Partes, Parâmetros Operacionais, Regime Tributário, Honorários).
- Auto-conversão de valores numéricos para extenso (ex: *dois mil reais*).
- **Templates**: Modelos oficiais JL Viana (Prestação de Serviços Contábeis, Assessoria Mensal, etc).
- Assinatura digital via exportação protegida.

### 👥 CRM, Pessoas e Departamento Pessoal
- Gestão do ciclo de vida de clientes (Leads, Ativos, Inativos).
- Cadastro de colaboradores PJ e CLT.
- Controle de escalas e Folha de Pagamento de Parceiros.
- Portal exclusivo do prestador PJ.

---

## 🧠 A Inteligência Artificial no HUB (OpenAI)

O JLVIANA HUB integra a API da OpenAI (`gpt-4o`) de forma nativa e distribuída em vários módulos:

| Módulo | Capacidade da IA |
|--------|------------------|
| **CFO Digital** | Analisa o DRE, custos e receita, gerando relatórios textuais sobre a saúde do negócio e sugerindo onde cortar gastos. |
| **Assistente Jurídico** | Chatbot contextualizado projetado para analisar minutas, detectar riscos trabalhistas (vínculo PJ), sugerir parágrafos de conformidade e explicar cláusulas obscuras. |
| **Leitor de Notas/Boletos** | Identifica fornecedor, valor, data de vencimento e linha digitável a partir de uma foto do documento (Contas a Pagar). |
| **Conciliação CCI** | Lê PDFs ou textos de extratos bancários e cruza com as saídas registradas no sistema apontando divergências exatas. |
| **Sugestão de Cobrança** | Gera textos amigáveis de cobrança via WhatsApp (Régua de Cobrança Humanizada). |

---

## 🛠 Tecnologias Utilizadas

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React 18 + TypeScript |
| **Build/Bundler** | Vite |
| **Estilização** | Tailwind CSS + shadcn/ui |
| **Roteamento** | React Router DOM |
| **Backend/BaaS** | Supabase (PostgreSQL + Auth + Storage) |
| **Inteligência Artificial** | OpenAI API (gpt-4o / gpt-4o-mini) |
| **Emissão NF-e (Bridge)** | PHP 8.3 + SOAP + Extensão OpenSSL |
| **Exportação DOC/PDF** | `docx`, `jspdf`, `file-saver` |
| **Ícones** | Lucide React |

---

## 📦 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) `>= 18.x`
- [npm](https://www.npmjs.com/) `>= 9.x`
- [PHP](https://www.php.net/) `>= 8.1` *(com extensões `soap` e `openssl` habilitadas, necessário apenas para emissão de NF)*
- Uma conta no [Supabase](https://supabase.com/)
- Uma chave de API da [OpenAI](https://platform.openai.com/api-keys)
- Um **Certificado Digital A1** (`.pfx`) para homologação/produção de notas

---

## ⚙️ Instalação e Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/JLVIANA456/JLVIANA-EMISSOR-DE-NOTA-COM-CRM.git
cd JLVIANA-EMISSOR-DE-NOTA-COM-CRM
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Variáveis de Ambiente

Copie o arquivo de exemplo e preencha com suas credenciais (Crie um arquivo `.env` na raiz do projeto):

```env
VITE_SUPABASE_URL=https://[SEU_PROJETO].supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
VITE_OPENAI_API_KEY=sk-proj-sua_chave_da_openai_aqui
```
*(Importante: Não comite este arquivo. O `.gitignore` já está configurado para evitá-lo).*

### 4. Configuração do Banco de Dados

1. Acesse o painel do seu projeto no **Supabase**.
2. Vá até o **SQL Editor**.
3. Copie o conteúdo dos arquivos dentro de `src/components/supabase/migrations/` e execute-os em ordem cronológica. Isso criará todas as tabelas, Storage buckets, RPCs e Views necessárias.

### 5. Inicie o sistema

```bash
npm run dev
```

O sistema estará disponível em: `http://localhost:5173`

---

## 🔌 Emissor de NFS-e (Nota do Milhão)

A comunicação com a Prefeitura de São Paulo em React puro enfrenta problemas de CORS e manipulação pesada de XMLDSig e certificados digitais. Por isso, utilizamos uma base **PHP** local para assinar e transmitir o pacote SOAP de forma segura e transparente.

1. Navegue até a pasta do bridge:
   ```bash
   cd NotaFiscallEMissor
   ```
2. Inicie o servidor embutido do PHP:
   ```bash
   php -S localhost:8001
   ```
3. No sistema (Frontend > Aba Configurações de NF), preencha o caminho local do seu arquivo `.pfx` e a senha, selecione o CNPJ da sua empresa e o sistema estará pronto para se comunicar via `http://localhost:8001/server.php`.

---

## 🗄 Estrutura do Banco de Dados (Supabase)

O JLVIANA HUB mapeia todas as interações. Destaque para as principais tabelas:

| Tabela | Função | Notas Técnicas |
|--------|--------|----------------|
| `invoice_requests` | Emissor Fiscal | Possui histórico de RPS, Código Único MS, link de cancelamento, retenção ISS. |
| `contracts` | Gestão de Contratos | Salva os JSONs dos parâmetros geradores e a string completa formatada do contrato (`generated_content`). Integrado a tabela `contract_ai_logs`. |
| `alerts` | Sistema de Alertas | Registra KPIs e pendências de conciliação. Hook React mapeia tempo real via subscrição local. |
| `cost_centers` | Operacional | Permite rateio e análise da IA sobre ofensores do orçamento. |
| `user_roles` | Segurança | Tabela de RLS (Row Level Security) que dita (admin, analista, colaborador). |

---

## 🤝 Como Contribuir

1. **Faça o Fork** deste repositório
2. Crie sua branch (`git checkout -b feature/minha-feature`)
3. Faça o commit (`git commit -m 'feat: Adicionando novo recurso X'`)
4. Faça o push (`git push origin feature/minha-feature`)
5. Abra um Pull Request detalhando suas implementações.

---

## 📄 Licença & Propriedade

Este ecossistema foi projetado e desenvolvido exclusivamente como um ativo estratégico para a **JLVIANA Consultoria Contábil e BPO Financeiro**. 

<div align="center">
  <br/>
  <strong>Desenvolvido com excelência por JLVIANA Serviço Digital</strong><br/>
  <sub>São Paulo — SP | Inovação em Contabilidade e Software</sub>
</div>