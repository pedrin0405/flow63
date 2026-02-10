"use client"

import { useState } from "react"
import { Search, Plus, FileText, ExternalLink, Download, Clock, CheckCircle2, MoreVertical, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Estes componentes devem existir na sua estrutura de pastas
import { NewFormModal } from "@/components/central63/forms/new-form-modal"
import { Sidebar } from "@/components/central63/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@radix-ui/react-select"

// Mock data for forms
const MOCK_FORMS = [
  {
    id: "form_1",
    clientName: "João Silva",
    clientEmail: "joao.silva@email.com",
    clientPhoto: "https://ui-avatars.com/api/?name=Joao+Silva&background=0D8ABC&color=fff",
    brokerName: "Pedro Augusto",
    status: "completed",
    date: "12/02/2026",
    link: "www.central63.vercel/forms/js-8822"
  },
  {
    id: "form_2",
    clientName: "Maria Santos",
    clientEmail: "maria.santos@email.com",
    clientPhoto: "https://ui-avatars.com/api/?name=Maria+Santos&background=F59E0B&color=fff",
    brokerName: "Ana Clara",
    status: "pending",
    date: "13/02/2026",
    link: "www.central63.vercel/forms/ms-9911"
  },
  {
    id: "form_3",
    clientName: "Carlos Oliveira",
    clientEmail: "carlos.o@email.com",
    clientPhoto: "https://ui-avatars.com/api/?name=Carlos+Oliveira&background=10B981&color=fff",
    brokerName: "Pedro Augusto",
    status: "completed",
    date: "10/02/2026",
    link: "www.central63.vercel/forms/co-4455"
  }
]

export default function FormList() {
  const [search, setSearch] = useState("")
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [forms, setForms] = useState(MOCK_FORMS)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")

  const filteredForms = forms.filter(f => 
    f.clientName.toLowerCase().includes(search.toLowerCase()) ||
    f.brokerName.toLowerCase().includes(search.toLowerCase()) ||
    f.clientEmail.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreateForm = (newForm: any) => {
    const uniqueId = Math.random().toString(36).substring(2, 9).toUpperCase()
    const formEntry = {
      id: `FORM-${uniqueId}`,
      clientName: newForm.clientName,
      clientEmail: `${newForm.clientName.toLowerCase().replace(/\s+/g, '.')}@email.com`,
      clientPhoto: `https://ui-avatars.com/api/?name=${encodeURIComponent(newForm.clientName)}&background=random`,
      brokerName: newForm.brokerName,
      status: "pending",
      date: new Date().toLocaleDateString('pt-BR'),
      link: `www.central63.vercel.com/forms/${uniqueId}`
    }
    setForms([formEntry, ...forms])
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
      {/* Sidebar Original */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        activeTab={activeTab} 
        onTabChange={(tab: string) => {
          setActiveTab(tab);
          setSidebarOpen(false);
        }} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Mobile Header (Apenas visível no mobile para abrir sidebar) */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b bg-card">
          <div className="font-black text-xl uppercase tracking-tighter">
            Central<span className="text-primary">63</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </Button>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-[1600px] mx-auto space-y-8">
            
            {/* Page Header Logic */}
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <FileText className="text-primary" />
                Documentos
              </h1>
            </header>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  placeholder="Pesquisar formulários, clientes ou corretores..." 
                  className="pl-10 h-12 rounded-xl bg-card border-border shadow-sm focus-visible:ring-primary transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button 
                onClick={() => setIsNewModalOpen(true)}
                className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold gap-2 shadow-lg shadow-primary/20 transition-transform active:scale-95"
              >
                <Plus size={20} />
                <span className="uppercase">Novo Formulário</span>
              </Button>
            </div>

            {/* Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
              {filteredForms.map((form) => (
                <Card key={form.id} className="group hover:shadow-2xl transition-all duration-500 border-2 border-border/50 rounded-[2.5rem] overflow-hidden bg-card flex flex-col border-none shadow-sm">
                  <CardContent className="p-6 flex flex-col h-full space-y-5">
                    
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-14 w-14 border-4 border-background shadow-xl">
                          <AvatarImage src={form.clientPhoto} alt={form.clientName} />
                          <AvatarFallback className="font-bold bg-primary/10 text-primary uppercase">
                            {form.clientName.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <h3 className="font-black text-sm text-foreground truncate uppercase leading-tight tracking-tighter">
                            {form.clientName}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] text-muted-foreground truncate font-bold">{form.clientEmail}</p>
                            <span className="text-[9px] bg-accent/80 text-muted-foreground px-1.5 py-0.5 rounded font-black tracking-widest">
                              {form.id}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-accent transition-colors flex-shrink-0">
                            <MoreVertical size={18} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl border-none p-2 shadow-2xl min-w-[140px]">
                          <DropdownMenuItem className="gap-2 text-xs font-black py-2.5 cursor-pointer uppercase tracking-tight">
                            <ExternalLink size={14} /> Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-xs font-black py-2.5 cursor-pointer text-primary uppercase tracking-tight">
                            <Download size={14} /> Baixar PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Preview Area */}
                    <div className="bg-accent/40 rounded-[2rem] p-5 flex-1 flex flex-col items-center justify-center space-y-3 min-h-[160px] border border-border/50 group-hover:bg-primary/5 transition-all duration-500">
                      <div className="bg-white/50 dark:bg-zinc-900/50 p-4 rounded-2xl">
                        <FileText size={42} className="text-primary/40 group-hover:text-primary transition-colors duration-500" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] text-center">
                          Formulário de Atendimento
                        </span>
                        <Badge variant="outline" className="bg-background/90 border-border/50 text-[10px] py-1.5 px-4 rounded-xl font-bold text-muted-foreground shadow-sm truncate max-w-[180px]">
                          {form.link}
                        </Badge>
                      </div>
                    </div>

                    {/* Bottom Info */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter opacity-70">Corretor</span>
                          <span className="text-xs font-black text-foreground uppercase truncate max-w-[100px]">{form.brokerName}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter opacity-70 block">Data</span>
                          <span className="text-xs font-black text-foreground">{form.date}</span>
                        </div>
                      </div>

                      <div className={`flex items-center justify-center gap-2 py-3 rounded-2xl border transition-all duration-500 font-black text-[10px] uppercase tracking-widest ${
                        form.status === 'completed' 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                      }`}>
                        {form.status === 'completed' ? <CheckCircle2 size={16} strokeWidth={3} /> : <Clock size={16} strokeWidth={3} />}
                        <span>
                          {form.status === 'completed' ? 'Preenchido' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredForms.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-50">
                <div className="bg-accent p-6 rounded-full">
                   <Search size={40} />
                </div>
                <p className="font-bold text-lg uppercase tracking-tight">Nenhum formulário encontrado</p>
              </div>
            )}

          </div>
        </main>
      </div>

      <NewFormModal 
        isOpen={isNewModalOpen} 
        onClose={() => setIsNewModalOpen(false)}
        onSubmit={handleCreateForm}
      />
    </div>
  )
}