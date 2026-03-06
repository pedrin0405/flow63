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
