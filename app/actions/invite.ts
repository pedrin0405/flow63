'use server'

import { createClient } from '@supabase/supabase-js'

export async function inviteUserAction(email: string, role: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('SERVER ACTION ERROR: Chaves ausentes.', { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!serviceRoleKey 
    })
    return { 
      success: false, 
      error: `Configuração do servidor incompleta (SERVICE_ROLE_KEY ausente). Verifique o arquivo .env no servidor.` 
    }
  }

  // Cria um cliente com privilégios de administrador
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { role },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
  })

  if (error) {
    let errorMessage = error.message
    
    // Verifica se o erro é de limite de taxa e define a mensagem personalizada
    if (errorMessage.toLowerCase().includes('rate limit exceeded')) {
      errorMessage = 'Limite de convites enviados pelo supabase atingido, aguarde um momento'
    }

    // Retorna o erro traduzido em vez de lançar exceção, permitindo que o frontend exiba o popup
    return { success: false, error: errorMessage }
  }

  // Se o convite foi enviado com sucesso, cria o registro na tabela profiles
  if (data?.user) {
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([
        { 
          id: data.user.id, 
          email: email, 
          role: role,
          full_name: null, // Marcar como pendente
          updated_at: new Date().toISOString()
        }
      ])

    if (profileError) {
      console.error('Erro ao criar perfil para usuário convidado:', profileError)
      // Retornamos sucesso pois o convite auth foi enviado, mas avisamos o erro se necessário
      // return { success: true, warning: 'Convite enviado, mas houve erro ao criar perfil na base de dados.' }
    }
  }

  return { success: true }
}