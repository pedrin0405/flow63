-- Tabela de permissões por cargo
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role TEXT NOT NULL,
    route TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(role, route)
);

-- Habilitar RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Permissões de RLS
CREATE POLICY "Apenas Diretor e Admin podem gerenciar permissões" 
ON public.role_permissions FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('Diretor', 'Admin')
    )
);

CREATE POLICY "Usuários autenticados podem visualizar permissões" 
ON public.role_permissions FOR SELECT 
USING (auth.role() = 'authenticated');

-- Seed inicial (Baseado na lógica atual do middleware)
-- 1. Cargos de alta gestão (Acesso Total)
DO $$
DECLARE
    roles TEXT[] := ARRAY['Diretor', 'Gestor', 'Marketing', 'Secretária', 'Admin'];
    routes TEXT[] := ARRAY['/', '/services', '/homes', '/brokers', '/units', '/admin/benefit-cards', '/brokers/my-card', '/admin/bio', '/editor', '/campaigns', '/indicators', '/forms', '/spreadsheets', '/custom-dashboard', '/chat-support', '/support', '/settings'];
    r TEXT;
    rt TEXT;
BEGIN
    FOREACH r IN ARRAY roles
    LOOP
        FOREACH rt IN ARRAY routes
        LOOP
            INSERT INTO public.role_permissions (role, route) 
            VALUES (r, rt) 
            ON CONFLICT (role, route) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- 2. Cargo Corretor (Acesso Restrito)
DO $$
DECLARE
    routes TEXT[] := ARRAY['/brokers/my-card', '/admin/bio', '/editor', '/settings'];
    rt TEXT;
BEGIN
    FOREACH rt IN ARRAY routes
    LOOP
        INSERT INTO public.role_permissions (role, route) 
        VALUES ('Corretor', rt) 
        ON CONFLICT (role, route) DO NOTHING;
    END LOOP;
END $$;
