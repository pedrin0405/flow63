'use server'

import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
          } catch (error) {}
        },
      },
    }
  )
}

// Cliente administrativo
const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function adminUpdateUserPassword(userId: string, newPassword: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Erro de configuração no servidor: Chaves do Supabase ausentes.')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword
  })

  if (error) {
    console.error('Erro ao atualizar senha:', error)
    throw new Error(error.message)
  }

  return { success: true }
}

export async function getEnrichedUsersAction() {
  try {
    const supabase = await getSupabase()
    
    // Pegamos os profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false })

    if (profileError) throw profileError

    // Enriquecemos com metadados do auth usando service role
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = getSupabaseAdmin()
      const { data: { users: authUsers }, error: authError } = await adminClient.auth.admin.listUsers()
      
      if (!authError && authUsers) {
        const enrichedProfiles = profiles.map(p => {
          const authUser = authUsers.find(au => au.id === p.id)
          const fallbackName = authUser?.user_metadata?.full_name || 
                               authUser?.user_metadata?.name || 
                               authUser?.user_metadata?.display_name || 
                               p.email?.split('@')[0] || 
                               "Usuário"

          return {
            ...p,
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
    console.error('Erro ao buscar usuários enriquecidos:', err)
    return { success: false, error: err.message }
  }
}