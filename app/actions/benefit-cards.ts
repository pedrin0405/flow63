'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// Função auxiliar para obter o cliente Supabase no servidor
async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // Se chamado de um Server Component, o setAll pode falhar
          }
        },
      },
    }
  )
}

export type Benefit = {
  id: string
  nome: string
  descricao: string
  nivel_minimo: number
  ativo: boolean
  image_url?: string
}

export type BenefitCard = {
  id: string
  user_id: string
  corretor_id: string
  nivel_beneficio: number
  data_validade: string
  status: 'ativo' | 'inativo' | 'expirado'
  apple_pass_serial: string
  card_image_url?: string
  created_at: string
  updated_at: string
}

export async function getBenefits() {
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from('benefits')
      .select('*')
      .order('nivel_minimo', { ascending: true })

    if (error) return { success: false, error: error.message }
    return { success: true, data: data as Benefit[] }
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro inesperado' }
  }
}

export async function saveBenefit(benefit: Partial<Benefit>) {
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from('benefits')
      .upsert(benefit)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/admin/benefit-cards')
    return { success: true, data: data as Benefit }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function getBenefitCards(filters?: { status?: string; search?: string }) {
  try {
    const supabase = await getSupabase()
    let query = supabase
      .from('benefit_cards')
      .select(`
        *,
        profiles:user_id (full_name, email)
      `)

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }

    let result = data as any[]
    if (filters?.search) {
      const search = filters.search.toLowerCase()
      result = result.filter(card => 
        card.profiles?.full_name?.toLowerCase().includes(search) ||
        card.profiles?.email?.toLowerCase().includes(search)
      )
    }

    return { success: true, data: result }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function saveBenefitCard(card: any, benefitIds?: string[]) {
  try {
    const supabase = await getSupabase()

    // Limpeza de dados para a tabela benefit_cards
    const { benefitIds: _b, profiles, card_benefits, ...cardData } = card

    // Remove ID vazio para evitar erro de UUID malformatado no upsert
    if (!cardData.id) delete cardData.id

    // Remove campos que não pertencem à tabela mas podem vir de joins anteriores
    delete cardData.created_at
    delete cardData.updated_at

    const { data: savedData, error: cardError } = await supabase
      .from('benefit_cards')
      .upsert(cardData)
      .select()

    if (cardError) {
      console.error('Erro no upsert:', cardError)
      return { success: false, error: cardError.message }
    }

    const savedCard = savedData?.[0]
    if (!savedCard) {
      return { success: false, error: 'Não foi possível recuperar o cartão salvo.' }
    }

    const finalBenefitIds = benefitIds || _b

    if (finalBenefitIds && Array.isArray(finalBenefitIds)) {
      // Deleta vínculos antigos
      await supabase.from('card_benefits').delete().eq('card_id', savedCard.id)

      // Insere novos vínculos si houver
      if (finalBenefitIds.length > 0) {
        const { error: relError } = await supabase
          .from('card_benefits')
          .insert(finalBenefitIds.map(id => ({
            card_id: savedCard.id,
            benefit_id: id
          })))
        if (relError) {
          console.error('Erro nos benefícios:', relError)
          return { success: false, error: 'Cartão salvo, mas houve erro ao associar benefícios.' }
        }
      }
    }

    revalidatePath('/admin/benefit-cards')
    return { success: true, data: savedCard }
  } catch (err: any) {
    console.error('Erro inesperado:', err)
    return { success: false, error: err.message || 'Erro interno no servidor' }
  }
}


export async function getCardWithBenefits(userId: string) {
  try {
    const supabase = await getSupabase()
    const { data: card, error: cardError } = await supabase
      .from('benefit_cards')
      .select(`
        *,
        card_benefits (
          benefits (*)
        )
      `)
      .eq('user_id', userId)
      .maybeSingle()

    if (cardError) return { success: false, error: cardError.message }
    return { success: true, data: card }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function getAllUsers() {
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .order('full_name')

    if (error) return { success: false, error: error.message }
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function deleteBenefitCard(id: string) {
  try {
    const supabase = await getSupabase()
    const { error } = await supabase.from('benefit_cards').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/admin/benefit-cards')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function deleteBenefit(id: string) {
  try {
    const supabase = await getSupabase()
    const { error } = await supabase.from('benefits').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/admin/benefit-cards')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function getCardBenefitsIds(cardId: string) {
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from('card_benefits')
      .select('benefit_id')
      .eq('card_id', cardId)
    
    if (error) return { success: false, error: error.message }
    return { success: true, data: data.map(d => d.benefit_id) }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function updateCardSettings(cardId: string, settings: {
  card_image_url?: string,
  card_image_pos_x?: number,
  card_image_pos_y?: number,
  card_image_zoom?: number,
  card_image_opacity?: number,
  card_display_name?: string
}) {
  try {
    const supabase = await getSupabase()
    const { error } = await supabase
      .from('benefit_cards')
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq('id', cardId)

    if (error) throw error
    revalidatePath('/brokers/my-card')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
