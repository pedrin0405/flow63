'use client'

import { useState } from 'react'
import { Sidebar } from "@/components/central63/sidebar"
import { KanbanBoard } from "@/components/central63/kanban/kanban-board"
import { LayoutPanelLeft, Menu, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function KanbanPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("kanban")

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        activeTab={activeTab} 
        onTabChange={(tab: string) => {
          setActiveTab(tab)
          setSidebarOpen(false)
        }}
      />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="w-full bg-card border-b px-6 py-4 flex items-center justify-between shadow-sm z-20">
          <div className="flex items-center gap-4 text-foreground">
            <button 
              className="lg:hidden p-2 text-muted-foreground hover:bg-accent rounded-lg" 
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <LayoutPanelLeft className="text-primary hidden lg:block" size={24} />
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Quadro Kanban</h2>
              <p className="text-xs text-muted-foreground hidden sm:block">Gerencie suas tarefas e planos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Adicione botões de ação global aqui se necessário */}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto h-full">
            <KanbanBoard />
          </div>
        </div>
      </main>
    </div>
  )
}
