"use server";

import { createClient } from "@supabase/supabase-js";

// Cliente administrativo para bypassar RLS em ações de sistema
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Incrementa o contador de visualizações de uma Bio
 * Esta função roda no servidor para garantir permissões e evitar race conditions
 */
export async function trackBioView(bioId: string) {
  if (!bioId) return;

  try {
    // Chamada à função SQL que criamos no passo 1
    const { error } = await supabaseAdmin.rpc('increment_bio_views', { bio_id: bioId });
    
    if (error) {
      console.error("Erro RPC increment_bio_views:", error);
      
      // Fallback: Tentativa de update direto via admin client (caso a RPC ainda não exista)
      await supabaseAdmin
        .from('bio_pages')
        .select('views_count')
        .eq('id', bioId)
        .single()
        .then(async ({ data }) => {
          if (data) {
            await supabaseAdmin
              .from('bio_pages')
              .update({ views_count: (data.views_count || 0) + 1 })
              .eq('id', bioId);
          }
        });
    }
  } catch (error) {
    console.error("Erro crítico ao rastrear visualização:", error);
  }
}

export async function trackBioClick(bioId: string, linkIndex: number) {
  // Log de cliques (pode ser expandido para uma tabela de analytics futuramente)
  console.log(`Link index ${linkIndex} clicado na bio ${bioId}`);
}

export async function saveBioLead(bioId: string, leadData: { nome: string, email: string, telefone?: string }) {
  const { error } = await supabaseAdmin
    .from("bio_leads")
    .insert([{
      bio_id: bioId,
      ...leadData,
      created_at: new Date().toISOString()
    }]);

  if (error) {
    console.error("Erro ao salvar lead:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
