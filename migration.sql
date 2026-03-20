-- Migration for Benefit Cards System

-- 1. Create Benefits Table
CREATE TABLE IF NOT EXISTS public.benefits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    nivel_minimo INTEGER DEFAULT 1,
    ativo BOOLEAN DEFAULT true,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Benefit Cards Table
CREATE TABLE IF NOT EXISTS public.benefit_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    corretor_id TEXT,
    nivel_beneficio INTEGER DEFAULT 1,
    data_validade DATE NOT NULL,
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'expirado')),
    apple_pass_serial TEXT UNIQUE,
    card_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Junction Table for Multiple Benefits per Card
CREATE TABLE IF NOT EXISTS public.card_benefits (
    card_id UUID REFERENCES public.benefit_cards(id) ON DELETE CASCADE,
    benefit_id UUID REFERENCES public.benefits(id) ON DELETE CASCADE,
    PRIMARY KEY (card_id, benefit_id)
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_benefits ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies

-- Benefits Policies
CREATE POLICY "Benefits are viewable by all authenticated users" 
ON public.benefits FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Full access for Admins on benefits" 
ON public.benefits FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('Admin', 'Gestor', 'Diretor')
    )
);

-- Benefit Cards Policies
CREATE POLICY "Users can view their own cards" 
ON public.benefit_cards FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Full access for Admins on benefit_cards" 
ON public.benefit_cards FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('Admin', 'Gestor', 'Diretor')
    )
);

-- Card Benefits Policies
CREATE POLICY "Users can view their own card benefits" 
ON public.card_benefits FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.benefit_cards 
        WHERE id = card_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Full access for Admins on card_benefits" 
ON public.card_benefits FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('Admin', 'Gestor', 'Diretor')
    )
);

-- 6. Insert Initial Benefits (Optional)
INSERT INTO public.benefits (nome, descricao, nivel_minimo) VALUES
('Acesso Lounge', 'Acesso ilimitado ao lounge corporativo.', 1),
('Estacionamento VIP', 'Vaga reservada em todas as unidades.', 2),
('Comissão Turbo', 'Bônus de 0.5% em vendas selecionadas.', 3);

-- 7. Create Template Folders Table
CREATE TABLE IF NOT EXISTS public.template_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3b82f6',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Create Design Templates Table (com referência a pastas)
CREATE TABLE IF NOT EXISTS public.design_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    folder_id UUID REFERENCES public.template_folders(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    data JSONB NOT NULL,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Create Design Models Table (salvos por usuário)
CREATE TABLE IF NOT EXISTS public.design_models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    data JSONB NOT NULL,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Enable RLS for Template Tables
ALTER TABLE public.template_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_models ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS Policies for Template Folders
DROP POLICY IF EXISTS "Users can view their own template folders" ON public.template_folders;
DROP POLICY IF EXISTS "Users can create their own template folders" ON public.template_folders;
DROP POLICY IF EXISTS "Users can update their own template folders" ON public.template_folders;
DROP POLICY IF EXISTS "Users can delete their own template folders" ON public.template_folders;

CREATE POLICY "Users can view their own template folders" 
ON public.template_folders FOR SELECT 
USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create their own template folders" 
ON public.template_folders FOR INSERT 
WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('Marketing', 'Gestor', 'Secretária', 'Secretaria', 'Diretor', 'Diretores')
    )
);

CREATE POLICY "Users can update their own template folders" 
ON public.template_folders FOR UPDATE 
USING (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('Marketing', 'Gestor', 'Secretária', 'Secretaria', 'Diretor', 'Diretores')
    )
)
WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('Marketing', 'Gestor', 'Secretária', 'Secretaria', 'Diretor', 'Diretores')
    )
);

CREATE POLICY "Users can delete their own template folders" 
ON public.template_folders FOR DELETE 
USING (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('Marketing', 'Gestor', 'Secretária', 'Secretaria', 'Diretor', 'Diretores')
    )
);

-- 12. Create RLS Policies for Design Templates
CREATE POLICY "Users can view their own templates" 
ON public.design_templates FOR SELECT 
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.template_folders f WHERE f.id = folder_id AND f.is_public = true));

CREATE POLICY "Users can create their own templates" 
ON public.design_templates FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" 
ON public.design_templates FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" 
ON public.design_templates FOR DELETE 
USING (auth.uid() = user_id);

-- 13. Create RLS Policies for Design Models
CREATE POLICY "Users can view their own models" 
ON public.design_models FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own models" 
ON public.design_models FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own models" 
ON public.design_models FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own models" 
ON public.design_models FOR DELETE 
USING (auth.uid() = user_id);

-- 14. Create Bio Property Folders Table (para organizar imóveis em pastas)
CREATE TABLE IF NOT EXISTS public.bio_property_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    bio_page_id UUID REFERENCES public.bio_pages(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    icon TEXT DEFAULT '📁',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 15. Enable RLS for Bio Property Folders
ALTER TABLE public.bio_property_folders ENABLE ROW LEVEL SECURITY;

-- 16. Create RLS Policies for Bio Property Folders
CREATE POLICY "Users can view their own bio property folders" 
ON public.bio_property_folders FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bio property folders" 
ON public.bio_property_folders FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bio property folders" 
ON public.bio_property_folders FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bio property folders" 
ON public.bio_property_folders FOR DELETE 
USING (auth.uid() = user_id);
