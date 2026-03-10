"use server";

import { supabase } from "@/lib/supabase";

export async function trackBioView(bioId: string) {
  const { data, error } = await supabase.rpc('increment_bio_views', { bio_id: bioId });
  if (error) {
    // Se a RPC falhar, tentamos update direto (menos eficiente mas estável)
    await supabase
      .from('bio_pages')
      .update({ views_count: supabase.rpc('increment') as any })
      .eq('id', bioId);
  }
}

export async function trackBioClick(bioId: string, linkIndex: number) {
  // Em um cenário real, poderíamos ter uma tabela de cliques.
  // Por simplicidade, vamos apenas registrar no console ou 
  // poderíamos incrementar um contador JSONB se a estrutura permitir.
  console.log(`Click tracked for bio ${bioId}, link ${linkIndex}`);
  
  // Exemplo de como incrementar visualizações totais (chamado no carregamento da página)
  // await supabase.rpc('increment_bio_views', { row_id: bioId });
}

export async function saveBioLead(bioId: string, leadData: { nome: string, email: string, telefone?: string }) {
  const { data, error } = await supabase
    .from("bio_leads")
    .insert([{
      bio_id: bioId,
      ...leadData,
      created_at: new Date().toISOString()
    }]);

  if (error) {
    console.error("Erro ao salvar lead da bio:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
