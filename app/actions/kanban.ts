'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

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

export async function getTasksAction() {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Não autenticado')

    const { data, error } = await supabase
      .from('kanban_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('position', { ascending: true })

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    console.error('Erro ao buscar tarefas:', error)
    return { success: false, error: error.message }
  }
}

export async function createTaskAction(task: { title: string, description?: string, status: string, position: number, color?: string }) {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Não autenticado')

    const { data, error } = await supabase
      .from('kanban_tasks')
      .insert([{ ...task, user_id: user.id }])
      .select()
      .single()

    if (error) throw error
    revalidatePath('/kanban')
    return { success: true, data }
  } catch (error: any) {
    console.error('Erro ao criar tarefa:', error)
    return { success: false, error: error.message }
  }
}

export async function updateTaskAction(id: string, updates: any) {
  try {
    const supabase = await getSupabase()
    const { error } = await supabase
      .from('kanban_tasks')
      .update(updates)
      .eq('id', id)

    if (error) throw error
    revalidatePath('/kanban')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao atualizar tarefa:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteTaskAction(id: string) {
  try {
    const supabase = await getSupabase()
    const { error } = await supabase
      .from('kanban_tasks')
      .delete()
      .eq('id', id)

    if (error) throw error
    revalidatePath('/kanban')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao deletar tarefa:', error)
    return { success: false, error: error.message }
  }
}

export async function updateTaskPositionsAction(tasks: { id: string, position: number, status: string }[]) {
  try {
    const supabase = await getSupabase()
    
    // Perform bulk update if possible, or individual updates
    for (const task of tasks) {
      await supabase
        .from('kanban_tasks')
        .update({ position: task.position, status: task.status })
        .eq('id', task.id)
    }

    revalidatePath('/kanban')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao atualizar posições:', error)
    return { success: false, error: error.message }
  }
}
