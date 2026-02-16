'use server'

import { createClient } from '@supabase/supabase-js'

export async function adminUpdateUserPassword(userId: string, newPassword: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Erro de configuração no servidor: Chaves do Supabase ausentes.')
  }

  // Cliente com permissões de admin (Service Role)
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