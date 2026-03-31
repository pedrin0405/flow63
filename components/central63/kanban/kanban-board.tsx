'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, ChevronRight, ChevronLeft, Loader2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  getTasksAction, 
  updateTaskAction, 
  deleteTaskAction 
} from '@/app/actions/kanban'
import { TaskDialog } from './task-dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from '@/lib/utils'

export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  position: number
  color: string
  created_at: string
}

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'A Fazer', color: 'bg-slate-500' },
  { id: 'in_progress', label: 'Em Andamento', color: 'bg-blue-600' },
  { id: 'done', label: 'Concluído', color: 'bg-emerald-600' },
]

const TASK_COLORS: Record<string, string> = {
  default: 'bg-card border-border border-l-muted',
  blue: 'bg-blue-500/10 border-blue-500/50 border-l-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.1)]',
  green: 'bg-emerald-500/10 border-emerald-500/50 border-l-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
  yellow: 'bg-amber-500/10 border-amber-500/50 border-l-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.1)]',
  red: 'bg-rose-500/10 border-rose-500/50 border-l-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.1)]',
  purple: 'bg-violet-500/10 border-violet-500/50 border-l-violet-600 shadow-[0_0_15px_rgba(139,92,246,0.1)]',
}

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const loadTasks = async () => {
    setLoading(true)
    const result = await getTasksAction()
    if (result.success) {
      setTasks(result.data || [])
    } else {
      toast.error('Erro ao carregar tarefas')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadTasks()
  }, [])

  const handleAddTask = (status: TaskStatus) => {
    setEditingTask({ status, color: 'default' } as any)
    setIsDialogOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    const result = await deleteTaskAction(deleteId)
    if (result.success) {
      setTasks(prev => prev.filter(t => t.id !== deleteId))
      toast.success('Tarefa excluída')
    } else {
      toast.error('Erro ao excluir')
    }
    setDeleteId(null)
  }

  const handleMoveTask = async (task: Task, direction: 'left' | 'right') => {
    const currentIndex = COLUMNS.findIndex(c => c.id === task.status)
    let nextIndex = currentIndex + (direction === 'right' ? 1 : -1)
    
    if (nextIndex < 0 || nextIndex >= COLUMNS.length) return

    const newStatus = COLUMNS[nextIndex].id
    const result = await updateTaskAction(task.id, { status: newStatus })
    
    if (result.success) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    }
  }

  const onDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId)
    e.dataTransfer.setData('taskId', taskId)
    e.dataTransfer.effectAllowed = 'move'
    
    // Pequeno atraso para o "fantasma" do drag não ficar invisível
    setTimeout(() => {
      const target = document.getElementById(`task-${taskId}`)
      if (target) target.style.opacity = '0.2'
    }, 0)
  }

  const onDragEnd = (e: React.DragEvent) => {
    const taskId = draggedTaskId
    setDraggedTaskId(null)
    setDropTarget(null)
    
    if (taskId) {
      const target = document.getElementById(`task-${taskId}`)
      if (target) target.style.opacity = '1'
    }
  }

  const onDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    if (dropTarget !== status) setDropTarget(status)
  }

  const onDrop = async (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    setDropTarget(null)
    const taskId = e.dataTransfer.getData('taskId')
    const task = tasks.find(t => t.id === taskId)
    
    if (task && task.status !== status) {
      // Força a remoção do estado de drag antes de mover
      setDraggedTaskId(null)
      
      // Atualização otimista
      const newTasks = tasks.map(t => t.id === taskId ? { ...t, status } : t)
      setTasks(newTasks)
      
      const result = await updateTaskAction(taskId, { status })
      if (!result.success) {
        toast.error('Erro ao mover tarefa')
        loadTasks()
      }
    }
  }

  if (loading && tasks.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-6 select-none">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[500px]">
        {COLUMNS.map(column => (
          <div 
            key={column.id} 
            className={cn(
              "flex flex-col rounded-2xl border-2 p-4 h-full transition-all duration-300",
              dropTarget === column.id 
                ? "bg-primary/5 border-primary border-dashed scale-[1.01] shadow-xl" 
                : "bg-slate-50/40 dark:bg-slate-900/40 border-border/50"
            )}
            onDragOver={(e) => onDragOver(e, column.id)}
            onDragLeave={() => setDropTarget(null)}
            onDrop={(e) => onDrop(e, column.id)}
          >
            <div className="flex items-center justify-between mb-5 px-1">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${column.color} shadow-lg animate-pulse`} />
                <h3 className="font-extrabold text-xs uppercase tracking-[0.2em] text-muted-foreground/80">{column.label}</h3>
                <Badge variant="secondary" className="ml-1 text-[10px] font-black h-5 px-2 bg-background/50 backdrop-blur-sm border-border">
                  {tasks.filter(t => t.status === column.id).length}
                </Badge>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all shadow-sm border border-border/50" onClick={() => handleAddTask(column.id)}>
                <Plus size={18} />
              </Button>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar min-h-[100px] pb-4">
              {tasks
                .filter(t => t.status === column.id)
                .map(task => (
                  <Card 
                    key={task.id} 
                    id={`task-${task.id}`}
                    className={cn(
                      "group cursor-grab active:cursor-grabbing transition-all duration-300 border-2 border-l-[6px] hover:scale-[1.02] hover:shadow-xl",
                      TASK_COLORS[task.color || 'default'],
                      draggedTaskId === task.id && "opacity-0 scale-90"
                    )}
                    draggable
                    onDragStart={(e) => onDragStart(e, task.id)}
                    onDragEnd={onDragEnd}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground/20 mt-0.5 shrink-0 group-hover:text-primary/50 transition-colors" />
                          <h4 className="font-bold text-[15px] leading-snug text-foreground/90">{task.title}</h4>
                        </div>
                      </div>
                      
                      {task.description && (
                        <p className="text-xs text-muted-foreground/80 line-clamp-3 mb-4 ml-6 font-medium leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-foreground/5">
                        <div className="flex gap-1.5">
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-7 w-7 rounded-lg bg-background/50 hover:bg-background border border-border/50" 
                            onClick={() => handleMoveTask(task, 'left')}
                            disabled={column.id === 'todo'}
                          >
                            <ChevronLeft size={14} />
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-7 w-7 rounded-lg bg-background/50 hover:bg-background border border-border/50" 
                            onClick={() => handleMoveTask(task, 'right')}
                            disabled={column.id === 'done'}
                          >
                            <ChevronRight size={14} />
                          </Button>
                        </div>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary" onClick={() => handleEditTask(task)}>
                            <Edit2 size={14} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-destructive/10 text-destructive" onClick={() => setDeleteId(task.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              
              {tasks.filter(t => t.status === column.id).length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border-2 border-dashed rounded-2xl border-muted/10 animate-in fade-in zoom-in duration-500 bg-slate-500/5">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">Vazio</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <TaskDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        task={editingTask} 
        onSuccess={loadTasks} 
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl border-2">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">Remover Tarefa?</AlertDialogTitle>
            <AlertDialogDescription className="text-base font-medium">
              Esta ação é permanente. A tarefa será removida do seu fluxo de trabalho.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="rounded-2xl border-2 font-bold px-6">Manter</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-2xl font-bold px-6 shadow-lg shadow-destructive/20"
            >
              Sim, remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
