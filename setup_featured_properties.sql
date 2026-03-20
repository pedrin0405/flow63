-- Tabela para armazenar os imóveis em destaque
CREATE TABLE IF NOT EXISTS public.featured_properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_code TEXT NOT NULL,
    city TEXT NOT NULL, -- Para saber se é 'Palmas' (imovel_pmw) ou 'Araguaina' (imovel_aux)
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(property_code, city)
);

-- Habilitar RLS
ALTER TABLE public.featured_properties ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Qualquer usuário autenticado pode ver destaques" 
ON public.featured_properties FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Diretores e Gestores podem gerenciar destaques" 
ON public.featured_properties FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('Diretor', 'Gestor', 'Admin')
    )
);
