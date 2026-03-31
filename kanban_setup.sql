-- Migration for Kanban System

-- 1. Create Kanban Tasks Table
CREATE TABLE IF NOT EXISTS public.kanban_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.kanban_tasks ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
CREATE POLICY "Users can view their own tasks" 
ON public.kanban_tasks FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks" 
ON public.kanban_tasks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" 
ON public.kanban_tasks FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" 
ON public.kanban_tasks FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Add route permission for Kanban
-- Based on role_permissions table logic
DO $$
DECLARE
    roles TEXT[] := ARRAY['Diretor', 'Gestor', 'Marketing', 'Secretária', 'Admin', 'Corretor'];
    r TEXT;
BEGIN
    FOREACH r IN ARRAY roles
    LOOP
        INSERT INTO public.role_permissions (role, route) 
        VALUES (r, '/kanban') 
        ON CONFLICT (role, route) DO NOTHING;
    END LOOP;
END $$;
