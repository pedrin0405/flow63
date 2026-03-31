'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { createTaskAction, updateTaskAction } from '@/app/actions/kanban'
import { toast } from 'sonner'
import { Task } from './kanban-board'

const taskSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório'),
  description: z.string().optional(),
  color: z.string().default('default'),
  status: z.any().optional(), // Tornamos flexível para evitar erros de validação no formulário oculto
})

type TaskFormValues = z.infer<typeof taskSchema>

const COLORS = [
  { label: 'Padrão', value: 'default', class: 'bg-card border-border' },
  { label: 'Azul', value: 'blue', class: 'bg-blue-600 border-blue-700' },
  { label: 'Verde', value: 'green', class: 'bg-emerald-600 border-emerald-700' },
  { label: 'Amarelo', value: 'yellow', class: 'bg-amber-500 border-amber-600' },
  { label: 'Vermelho', value: 'red', class: 'bg-rose-600 border-rose-700' },
  { label: 'Roxo', value: 'purple', class: 'bg-violet-600 border-violet-700' },
]

interface TaskDialogProps {
  isOpen: boolean
  onClose: () => void
  task?: Task
  onSuccess: () => void
}

export function TaskDialog({ isOpen, onClose, task, onSuccess }: TaskDialogProps) {
  const isEditing = !!task?.id

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      color: 'default',
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (task) {
        form.reset({
          title: task.title || '',
          description: task.description || '',
          color: task.color || 'default',
        })
      } else {
        form.reset({
          title: '',
          description: '',
          color: 'default',
        })
      }
    }
  }, [isOpen, task, form])

  const onSubmit = async (values: TaskFormValues) => {
    try {
      if (isEditing && task?.id) {
        const result = await updateTaskAction(task.id, {
          ...values,
          status: task.status // Mantém o status original na edição
        })
        if (result.success) {
          toast.success('Tarefa atualizada')
          onSuccess()
          onClose()
        } else {
          toast.error('Erro ao atualizar: ' + result.error)
        }
      } else {
        // Na criação, usa o status que o KanbanBoard passou no objeto task
        const result = await createTaskAction({ 
          title: values.title,
          description: values.description,
          color: values.color,
          status: task?.status || 'todo',
          position: 0 
        })
        
        if (result.success) {
          toast.success('Tarefa criada')
          onSuccess()
          onClose()
        } else {
          toast.error('Erro ao criar: ' + result.error)
        }
      }
    } catch (error) {
      console.error(error)
      toast.error('Ocorreu um erro inesperado')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight">{isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-sm uppercase tracking-wider text-muted-foreground">O que fazer?</FormLabel>
                  <FormControl>
                    <Input placeholder="Título da tarefa..." {...field} className="rounded-xl border-2 h-12 focus-visible:ring-primary/20 transition-all font-medium" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detalhes opcionais..." 
                      className="resize-none rounded-xl border-2 min-h-[100px] focus-visible:ring-primary/20 transition-all font-medium" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Destaque Visual</FormLabel>
                  <div className="flex flex-wrap gap-4 pt-2">
                    {COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={`w-10 h-10 rounded-full border-4 transition-all ${
                          color.class.split(' ')[0]
                        } ${
                          field.value === color.value 
                            ? 'border-primary scale-125 shadow-xl ring-4 ring-primary/10' 
                            : 'border-background dark:border-slate-800 hover:scale-110 shadow-md'
                        }`}
                        onClick={() => field.onChange(color.value)}
                        title={color.label}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-6 gap-3">
              <Button type="button" variant="ghost" onClick={onClose} className="rounded-2xl font-bold h-12 px-6">
                Cancelar
              </Button>
              <Button type="submit" className="rounded-2xl font-bold h-12 px-10 shadow-xl shadow-primary/20 transform active:scale-95 transition-all">
                {isEditing ? 'Salvar Alterações' : 'Criar Agora'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
