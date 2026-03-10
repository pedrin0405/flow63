# Flow63 - Central de Inteligência Imobiliária

Flow63 is a high-performance SaaS platform designed for real estate intelligence and management. It serves as a centralized hub for brokers, managers, and directors to track properties, leads, sales, and performance indicators.

## 🚀 Tech Stack

- **Framework:** [Next.js 15+ (App Router)](https://nextjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Backend/Auth:** [Supabase](https://supabase.com/) (Auth, Database, Storage)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/), Custom components based on Shadcn UI patterns
- **Data Visualization:** [Recharts](https://recharts.org/), [Chart.js](https://www.chartjs.org/)
- **Forms & Validation:** [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/)
- **Utilities:** [Fabric.js](http://fabricjs.com/) (Visual Editor), [jspdf](https://parall.ax/products/jspdf) (PDF Generation), [xlsx](https://sheetjs.com/) (Spreadsheet processing)

## 📁 Project Structure

- `app/`: Main application routes and logic.
  - `(auth)/`: Authentication routes (login, forgot-password, callback).
  - `admin/`: Management interfaces for system resources.
  - `api/`: Backend API endpoints (e.g., Apple Wallet pass generation).
  - `brokers/`: Broker-specific pages and digital business cards.
  - `actions/`: Server actions for database operations and user management.
- `components/`:
  - `central63/`: Project-specific business components (dashboards, filters, cards).
  - `ui/`: Reusable core UI components (buttons, dialogs, inputs).
- `lib/`: Shared utility functions and Supabase client configuration.
- `hooks/`: Custom React hooks (e.g., `use-fabric-editor`, `use-mobile`).
- `public/`: Static assets like logos and placeholders.
- `styles/`: Global CSS and Tailwind configurations.

## 🔐 Architecture & Security

- **Authentication:** Managed via Supabase Auth with server-side session handling in `middleware.ts`.
- **Role-Based Access Control (RBAC):** Users are assigned roles (e.g., `Diretor`, `Gestor`, `Marketing`, `Admin`). The middleware restricts access to specific routes based on these roles.
- **Database:** Supabase (PostgreSQL) is the primary data store.
- **Middleware:** Implements route protection, role-based redirects, and cookie management for Supabase SSR.

## 🛠 Building and Running

### Prerequisites
- Node.js (Latest LTS recommended)
- Supabase Project (URL and Anon/Service Role keys)

### Commands
- **Install Dependencies:** `npm install` or `pnpm install`
- **Development Mode:** `npm run dev`
- **Build for Production:** `npm run build`
- **Start Production Server:** `npm run start`
- **Linting:** `npm run lint`

## 📏 Development Conventions

- **Component Patterns:** Use functional components with TypeScript interfaces. Prefer the `components/ui` library for basic elements and `components/central63` for feature-specific logic.
- **State Management:** Leverage React hooks (useState, useEffect) for local state and Supabase Realtime for live updates where necessary.
- **Server Actions:** Use Next.js Server Actions for data mutations (found in `app/actions/`).
- **Styling:** Adhere to Tailwind CSS v4 utility classes. Use `cn` utility from `lib/utils.ts` for conditional class merging.
- **Routing:** Follow the Next.js App Router directory-based routing convention.

## 🔑 Key Features

- **Intelligence Dashboard:** Real-time visualization of VGV (Valor Geral de Vendas), active leads, and property inventory.
- **Visual Editor:** A Fabric.js-powered editor for creating and filling templates.
- **Broker Cards:** Digital, interactive cards for brokers with Apple Wallet integration.
- **Lead Management:** Tracking interactions, status updates, and broker assignments across multiple sources (PMW, AUX).
- **Form Builder:** System for creating and managing custom public forms.
- **Spreadsheet Integration:** Capabilities to import/export and view data in spreadsheet formats.
