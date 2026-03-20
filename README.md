# 🚀 Flow63 - Central de Inteligência Imobiliária

O **Flow63** é uma plataforma SaaS de alta performance projetada para a gestão e inteligência do mercado imobiliário. Atua como um hub centralizado para corretores, gestores e diretores, permitindo o acompanhamento em tempo real de propriedades, leads, vendas e indicadores estratégicos.

## 🛠️ Tecnologias Core

*   **Framework:** [Next.js 15+](https://nextjs.org/) (App Router)
*   **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
*   **Backend & Auth:** [Supabase](https://supabase.com/) (PostgreSQL, Realtime, Storage)
*   **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
*   **Componentes UI:** [Radix UI](https://www.radix-ui.com/), Shadcn/UI Patterns
*   **Editor Visual:** [Fabric.js](http://fabricjs.com/)
*   **Gráficos:** [Recharts](https://recharts.org/), [Chart.js](https://www.chartjs.org/)

## ✨ Funcionalidades Principais

*   **Intelligence Dashboard:** Visualização em tempo real de VGV (Valor Geral de Vendas), leads ativos e inventário.
*   **Editor Visual (Fabric.js):** Ferramenta poderosa para criação e preenchimento de templates de marketing.
*   **Bio Link Personalizável:** Sistema de "Link na Bio" para corretores com múltiplos temas (Glass, Modern, Minimalist) e otimização para conversão.
*   **Cartões Digitais:** Integração com Apple Wallet para cartões de visita digitais interativos.
*   **Gestão de Leads (CRM):** Rastreamento de interações, status e atribuição automática de corretores.
*   **Construtor de Formulários:** Criação de formulários públicos para captura de dados e integração direta com o banco.
*   **Relatórios e Planilhas:** Importação/Exportação de dados em formatos `xlsx` e `PDF`.

## 📁 Estrutura do Projeto

```bash
├── app/                  # Rotas principais (App Router)
│   ├── (auth)/           # Fluxos de autenticação
│   ├── actions/          # Next.js Server Actions para mutações
│   ├── admin/            # Dashboards e gestão administrativa
│   ├── api/              # Endpoints de API (Wallet, Trackers)
│   └── bio/              # Páginas públicas de Bio Links
├── components/           
│   ├── central63/        # Componentes de negócio (específicos do Flow63)
│   │   ├── bio-themes/   # Temas do Bio Link (Modern, Glass, Minimalist)
│   │   ├── editor/       # Componentes do Editor Visual (Canvas, Artboard)
│   │   └── settings/     # Abas de configuração e equipe
│   └── ui/               # Componentes base (Botões, Inputs, Dialogs)
├── hooks/                # Hooks customizados (use-fabric-editor, etc)
├── lib/                  # Utilitários e configurações (Supabase, Utils)
└── public/               # Ativos estáticos e logos
```

## 🚀 Começando

### Pré-requisitos

*   Node.js (LTS recomendado)
*   Projeto no Supabase configurado (URL e Anon Key)

### Instalação

1.  Clone o repositório:
    ```bash
    git clone https://github.com/pedrin0405/flow63.git
    ```
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Configure as variáveis de ambiente no `.env.local`:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
    NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
    SUPABASE_SERVICE_ROLE_KEY=sua_chave_supabase
    ```
4.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```

## 📐 Convenções de Desenvolvimento

*   **Estilização:** Utilize exclusivamente classes utilitárias do Tailwind CSS v4. Para variações dinâmicas de cores, utilize variáveis CSS (ex: `--theme-primary`).
*   **Componentes:** Prefira componentes funcionais com interfaces TypeScript bem definidas.
*   **Segurança:** Nunca exponha chaves de serviço do Supabase no lado do cliente. Use `Server Actions` para operações sensíveis.
*   **Editor Visual:** O Canvas é gerenciado via `useFabricEditor`. Sempre verifique o estado `isDisposed` antes de operações assíncronas no canvas.

## 📄 Licença

Este projeto é de uso restrito da **Casa63**. Todos os direitos reservados.
