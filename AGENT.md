# Central63 - Documentação Técnica Detalhada

Central63 é uma plataforma SaaS de Gestão Imobiliária de alta performance, integrando CRM, Business Intelligence (BI) e ferramentas de Marketing Digital.

## 🚀 Stack Tecnológica

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript.
- **Estilização:** Tailwind CSS 4, Radix UI (Primitivos), Framer Motion (Animações).
- **Backend & Database:** Supabase (PostgreSQL, Auth, Real-time, Edge Functions).
- **Visualização de Dados:** Recharts, Chart.js.
- **Edição Visual:** Fabric.js (Canvas), html-to-image.
- **Integrações:** Apple Wallet (passkit-generator), n8n (Webhooks de automação).

---

## 🏗️ Arquitetura de Dados (Objetos)

A estrutura de dados é gerenciada no Supabase. Principais tabelas e modelos:

### 👤 Perfis e Acesso (`profiles`)
- **Campos:** `id`, `full_name`, `email`, `avatar_url`, `role` (Admin, Diretor, Gestor, Marketing, Corretor), `departamento`.
- **Lógica:** Gerencia permissões de acesso via RLS (Row Level Security).

### 🤝 Atendimentos (`atendimento_pmw` / `atendimento_aux`)
- **Descrição:** Registros de leads e interações comerciais vindos do Imoview.
- **Campos Chave:** `codigo`, `situacao`, `finalidade`, `corretor`, `equipe`, `datahoraultimainteracao`.

### 🏠 Imóveis (`imovel_pmw` / `imovel_aux`)
- **Descrição:** Catálogo detalhado de propriedades.
- **Campos Chave:** `codigo`, `valor`, `endereco`, `cidade`, `urlfotoprincipal`, `status`.

### 💳 Cartões de Benefícios (`benefit_cards`)
- **Descrição:** Gerenciamento de níveis e acessos VIP para corretores.
- **Campos Chave:** `user_id`, `nivel_beneficio`, `data_validade`, `status`, `apple_pass_serial`.
- **Relacionados:** `benefits` (Catálogo de vantagens), `card_benefits` (Vínculo card-vantagem).

### 📊 Vendas (`vendas`)
- **Descrição:** Dados consolidados para o Dashboard de BI.
- **Campos Chave:** `id_origem`, `valor_venda`, `comissao`, `data_venda`, `status_dashboard` (Visível/Oculto).

---

## 📂 Estrutura de Páginas (`app/`)

### 🏠 Dashboard Principal (`/`)
- **Função:** Visão geral de métricas, funil de vendas e acessos rápidos.
- **Componentes:** `StatCard`, `FunnelChart`.

### 👥 Atendimentos (`/services`)
- **Função:** CRM completo com filtros avançados por cidade, equipe e corretor.
- **Funcionalidades:** Sincronização manual com Supabase, lançamento de vendas para o Dashboard, histórico de interações.

### 🎨 Flow Design (`/editor`)
- **Função:** Editor gráfico estilo Canva para criação de artes de imóveis.
- **Tecnologia:** Canvas interativo via `Fabric.js`.
- **Sub-rotas:** `/editor/fill/[templateId]` (Preenchimento automático de dados do imóvel na arte).

### 📈 Indicadores (`/indicators`)
- **Função:** Dashboards analíticos extraídos via Web Scraping da API do Imoview.
- **Métricas:** Termômetro de vendas, mídia de origem, motivos de descarte.

### 💳 Gestão de Cartões (`/admin/benefit-cards` & `/brokers/my-card`)
- **Admin:** Emissão e gerenciamento de cartões e benefícios.
- **Corretor:** Visualização do cartão e integração com Apple Wallet.

### 📋 Formulários & Planilhas (`/forms`, `/spreadsheets`)
- **Função:** Criação dinâmica de formulários de captura e visualização de dados em formato tabular (estilo Excel).

---

## 🛠️ Componentes Core (`components/central63/`)

### 🛰️ Navegação & Layout
- **`Sidebar`:** Menu lateral inteligente com estados colapsáveis, badges de notificação em tempo real (Supabase Channels) e controle de perfil.

### 📁 Módulo de Serviços
- **`LeadCard`:** Card interativo que exibe status do lead, foto do imóvel e progresso no funil.
- **`DetailsDrawer`:** Painel lateral (Sheet) com linha do tempo (Timeline) completa de interações.
- **`EditLeadModal`:** Interface para lançamento de vendas e atualização de dados cadastrais.

### 🎨 Módulo Editor
- **`VisualEditor`:** Componente principal do Canvas.
- **`MagicFill`:** Automação que injeta dados do imóvel (preço, endereço, fotos) diretamente nos elementos do canvas.

---

## 🔌 APIs e Server Actions (`app/api/` & `app/actions/`)

### 🍏 Apple Wallet (`api/apple-wallet/pass`)
- **Método:** `GET`
- **Função:** Gera dinamicamente um arquivo `.pkpass` assinado digitalmente para a Apple Wallet do corretor.
- **Segurança:** Requer certificados `.p12` e WWDR configurados no servidor.

### 🔍 Imoview Scraper (`api/imoview/indicators`)
- **Método:** `POST`
- **Função:** Autentica no sistema Imoview, extrai HTML de indicadores e faz o parsing dos gráficos via motor de extração Regex/DOM.
- **Performance:** Possui cache inteligente de 10 minutos para reduzir carga no parceiro.

### ⚡ Server Actions
- **`benefit-cards.ts`:** CRUD de cartões, upload de imagens e revalidação de cache.
- **`users.ts`:** Gerenciamento administrativo de senhas via Supabase Admin API.
- **`invite.ts`:** Lógica de convite de novos membros para a organização.

---

## 🛡️ Convenções de Desenvolvimento

1.  **Sincronização:** Alterações em dados críticos devem chamar `revalidatePath` para manter o cache do Next.js atualizado.
2.  **Segurança:** Nunca exponha a `SERVICE_ROLE_KEY` no cliente. Operações administrativas devem ser via Server Actions ou API Routes protegidas.
3.  **UI/UX:** Siga o padrão de cores `primary` (#e91c74) para ações principais e use `sonner` para feedbacks imediatos.
4.  **Performance:** Prefira `Suspense` para carregamento de listas pesadas e utilize o motor de busca otimizado no Supabase (filtros via query string em vez de filtro em memória).
