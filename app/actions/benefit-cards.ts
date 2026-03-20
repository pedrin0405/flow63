'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

// Cliente administrativo para operações que exigem bypass de RLS ou acesso a auth.users
const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

async function getDefaultBenefitIdsByLevel(supabase: any, level: number) {
  const normalizedLevel = Number.isFinite(level) && level > 0 ? level : 1

  const { data, error } = await supabase
    .from('benefits')
    .select('id')
    .eq('ativo', true)
    .lte('nivel_minimo', normalizedLevel)

  if (error) {
    throw new Error(error.message)
  }

  return (data || []).map((benefit: { id: string }) => benefit.id)
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
        profiles:user_id (*)
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
        (card.card_display_name || card.profiles?.full_name || "").toLowerCase().includes(search) ||
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
    const isCreate = !card?.id

    // Limpeza de dados para a tabela benefit_cards
    const {
      benefitIds: _b,
      profiles,
      card_benefits,
      selected_user_ids: _selectedUserIds,
      ...cardData
    } = card

    if (isCreate && cardData.user_id) {
      const { data: existingCard, error: existingCardError } = await supabase
        .from('benefit_cards')
        .select('id')
        .eq('user_id', cardData.user_id)
        .limit(1)
        .maybeSingle()

      if (existingCardError && existingCardError.code !== 'PGRST116') {
        return { success: false, error: existingCardError.message }
      }

      if (existingCard) {
        return { success: false, error: 'Este colaborador já possui cartão.' }
      }
    }

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

    const providedBenefitIds = benefitIds ?? _b
    let finalBenefitIds = Array.isArray(providedBenefitIds) ? providedBenefitIds : []

    if (isCreate && finalBenefitIds.length === 0) {
      finalBenefitIds = await getDefaultBenefitIdsByLevel(supabase, Number(cardData.nivel_beneficio))
    }

    finalBenefitIds = [...new Set(finalBenefitIds)]

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

export async function createBenefitCardsInBulk(payload: {
  userIds: string[]
  template: any
  benefitIds?: string[]
}) {
  try {
    const supabase = await getSupabase()
    const uniqueUserIds = [...new Set((payload.userIds || []).filter(Boolean))]

    if (uniqueUserIds.length === 0) {
      return { success: false, error: 'Selecione ao menos um colaborador.' }
    }

    const { data: existingCards, error: existingCardsError } = await supabase
      .from('benefit_cards')
      .select('user_id')
      .in('user_id', uniqueUserIds)

    if (existingCardsError) {
      return { success: false, error: existingCardsError.message }
    }

    const existingUserIds = new Set((existingCards || []).map((item: { user_id: string }) => item.user_id))
    const usersToCreate = uniqueUserIds.filter(userId => !existingUserIds.has(userId))
    const skippedUserIds = uniqueUserIds.filter(userId => existingUserIds.has(userId))

    if (usersToCreate.length === 0) {
      return {
        success: true,
        data: {
          createdCount: 0,
          skippedCount: skippedUserIds.length,
          skippedUserIds,
          failed: [] as Array<{ userId: string; error: string }>
        }
      }
    }

    const {
      benefitIds: _ignoredBenefitIds,
      user_id: _ignoredUserId,
      id: _ignoredId,
      profiles: _ignoredProfiles,
      card_benefits: _ignoredCardBenefits,
      selected_user_ids: _ignoredSelectedUserIds,
      ...templateData
    } = payload.template || {}

    delete templateData.created_at
    delete templateData.updated_at
    delete templateData.apple_pass_serial

    const normalizedLevel = Number(templateData.nivel_beneficio) || 1

    let finalBenefitIds = Array.isArray(payload.benefitIds) ? payload.benefitIds : []
    if (finalBenefitIds.length === 0) {
      finalBenefitIds = await getDefaultBenefitIdsByLevel(supabase, normalizedLevel)
    }
    finalBenefitIds = [...new Set(finalBenefitIds)]

    const createdCards: Array<{ id: string; user_id: string }> = []
    const failed: Array<{ userId: string; error: string }> = []

    for (const userId of usersToCreate) {
      const serial = `BC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`

      const { data: createdCard, error: createCardError } = await supabase
        .from('benefit_cards')
        .insert({
          ...templateData,
          user_id: userId,
          nivel_beneficio: normalizedLevel,
          apple_pass_serial: serial
        })
        .select('id, user_id')
        .single()

      if (createCardError || !createdCard) {
        failed.push({ userId, error: createCardError?.message || 'Erro ao criar cartão.' })
        continue
      }

      createdCards.push(createdCard as { id: string; user_id: string })
    }

    if (createdCards.length > 0 && finalBenefitIds.length > 0) {
      const relationRows = createdCards.flatMap(card =>
        finalBenefitIds.map(benefitId => ({
          card_id: card.id,
          benefit_id: benefitId
        }))
      )

      const { error: relationError } = await supabase
        .from('card_benefits')
        .insert(relationRows)

      if (relationError) {
        return {
          success: false,
          error: 'Cartões criados, mas houve erro ao associar benefícios.',
          data: {
            createdCount: createdCards.length,
            skippedCount: skippedUserIds.length,
            skippedUserIds,
            failed
          }
        }
      }
    }

    revalidatePath('/admin/benefit-cards')

    return {
      success: true,
      data: {
        createdCount: createdCards.length,
        skippedCount: skippedUserIds.length,
        skippedUserIds,
        failed
      }
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro inesperado ao criar cartões em massa.' }
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
    
    // Primeiro pegamos os profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name')

    if (profileError) throw profileError

    // Se tivermos a service role, tentamos enriquecer com metadados do auth
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = getSupabaseAdmin()
      const { data: { users: authUsers }, error: authError } = await adminClient.auth.admin.listUsers()
      
      if (!authError && authUsers) {
        const enrichedProfiles = profiles.map(p => {
          const authUser = authUsers.find(au => au.id === p.id)
          // Tenta pegar o nome de várias fontes: profile, metadata do auth (full_name, name, display_name)
          const fallbackName = authUser?.user_metadata?.full_name || 
                               authUser?.user_metadata?.name || 
                               authUser?.user_metadata?.display_name || 
                               p.email?.split('@')[0] || 
                               "Usuário"

          return {
            ...p,
            // Prioridade: full_name (se não for nulo/"Pendente") > metadata do auth > fallback
            full_name: (p.full_name && p.full_name !== "Pendente") 
              ? p.full_name 
              : fallbackName
          }
        })
        return { success: true, data: enrichedProfiles }
      }
    }

    return { success: true, data: profiles }
  } catch (err: any) {
    console.error('Erro ao buscar usuários:', err)
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
