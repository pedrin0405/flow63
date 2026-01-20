"use client"

import { useState, useMemo, Suspense } from "react"
import { 
  Menu, 
  Users,
  DollarSign,
  Download,
  Plus,
  FileSpreadsheet,
  Search,
  Briefcase
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/central63/sidebar"
import { StatCard } from "@/components/central63/stat-card"
import { Filters } from "@/components/central63/filters"
import { LeadCard } from "@/components/central63/lead-card"
import { Pagination } from "@/components/central63/pagination"
import { DetailsDrawer } from "@/components/central63/details-drawer"
import { EditLeadModal, type EditableLeadData } from "@/components/central63/edit-lead-modal"
import { BulkActionsBar } from "@/components/central63/bulk-actions-bar"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import Loading from "./loading"

// --- DADOS MOCK ---
const TEAMS = ["Vendas A", "Vendas B", "Locacao Alpha", "Locacao Beta"]
const CITIES = ["Palmas", "Araguaina", "Gurupi"]
const PURPOSES = ["Venda", "Locacao"]
const STATUS_OPTIONS = ["Em Atendimento", "Negócio Realizado", "Descartado", "Visita Agendada", "Proposta Enviada"]
const PHASES = [
  { id: 1, label: "Pre-atendimento", percent: 10 },
  { id: 2, label: "Qualificacao", percent: 30 },
  { id: 3, label: "Visita", percent: 50 },
  { id: 4, label: "Proposta", percent: 70 },
  { id: 5, label: "Negociacao", percent: 90 },
  { id: 6, label: "Fechamento", percent: 100 },
]

const BROKERS = [
  { id: 1, name: "Mauricio Silva", avatar: "https://i.pravatar.cc/150?u=1" },
  { id: 2, name: "Mariana Costa", avatar: "https://i.pravatar.cc/150?u=2" },
  { id: 3, name: "Murilo Souza", avatar: "https://i.pravatar.cc/150?u=3" },
  { id: 4, name: "Igor Santos", avatar: "https://i.pravatar.cc/150?u=4" },
  { id: 5, name: "Fernando Lima", avatar: "https://i.pravatar.cc/150?u=5" }
]

const PROPERTY_IMAGES = [
  "https://images.unsplash.com/photo-1600596542815-2250c38ae921?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
  "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60"
]

const generateHistory = () => [
  { date: "20/01/2026 14:30", action: "Proposta Enviada", user: "Corretor", desc: "Enviada proposta de R$ 850.000 via WhatsApp.", type: "action" as const },
  { date: "18/01/2026 09:15", action: "Visita Realizada", user: "Corretor", desc: "Cliente gostou da area de lazer.", status: "Realizado", type: "visit" as const },
  { date: "15/01/2026 10:00", action: "Lead Criado", user: "Sistema", desc: "Lead importado via Prospeccao Site.", type: "system" as const }
]

const generateLeads = () => {
  return Array.from({ length: 24 }).map((_, i) => {
    const isSale = Math.random() > 0.4
    const broker = BROKERS[i % BROKERS.length]
    const status = STATUS_OPTIONS[i % STATUS_OPTIONS.length]
    const phaseIndex = Math.floor(Math.random() * 6)
    
    return {
      id: 202400 + i,
      clientName: `Cliente Exemplo ${i + 1}`,
      clientAvatar: `https://i.pravatar.cc/150?u=${20 + i}`,
      broker: broker,
      team: TEAMS[i % TEAMS.length],
      city: i % 3 === 0 ? "Araguaina" : "Palmas",
      purpose: isSale ? "Venda" : "Locacao",
      status: status,
      phase: PHASES[phaseIndex],
      propertyTitle: isSale ? "Casa Alto Padrao" : "Apartamento Mobiliado",
      propertyLocation: "Plano Diretor Sul - Palmas/TO",
      propertyAddress: "ARSO 41 (403 Sul), Alameda 12, Lote 05",
      value: isSale ? 450000 + (i * 50000) : 2500 + (i * 200),
      image: PROPERTY_IMAGES[i % PROPERTY_IMAGES.length],
      updatedAt: new Date(2026, 0, 20 - i).toLocaleDateString("pt-BR"),
      lastUpdateISO: new Date(2026, 0, 20 - i).toISOString(),
      leadData: {
        email: `cliente${i}@email.com`,
        phone: "(63) 99999-8888",
        origin: i % 2 === 0 ? "Instagram" : "Google Ads",
        createdAt: "05/01/2026"
      },
      history: generateHistory()
    }
  })
}

const MOCK_LEADS = generateLeads()

export default function Central63App() {
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("atendimentos")
  const [selectedLead, setSelectedLead] = useState<typeof MOCK_LEADS[0] | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [leadsData, setLeadsData] = useState(MOCK_LEADS)
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<number>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8
  
  // Estados dos Filtros
  const [filters, setFilters] = useState({
    city: "",
    team: "",
    purpose: "Todos",
    status: "",
    phase: "",
    search: "",
    brokerId: "",
    dateStart: "",
    dateEnd: ""
  })

  // Logica de Filtragem com useMemo
  const filteredLeads = useMemo(() => {
    return leadsData.filter(lead => {
      if (filters.city && lead.city !== filters.city) return false
      if (filters.team && lead.team !== filters.team) return false
      if (filters.purpose !== "Todos" && lead.purpose !== filters.purpose) return false
      if (filters.status && lead.status !== filters.status) return false
      if (filters.brokerId && lead.broker.id.toString() !== filters.brokerId) return false
      if (filters.phase && lead.phase.id.toString() !== filters.phase) return false
      
      // Filtro de Data
      if (filters.dateStart) {
        const leadDate = new Date(lead.lastUpdateISO)
        const filterDate = new Date(filters.dateStart)
        if (leadDate < filterDate) return false
      }

      // Busca textual (Nome ou ID)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesName = lead.clientName.toLowerCase().includes(searchLower)
        const matchesId = lead.id.toString().includes(searchLower)
        if (!matchesName && !matchesId) return false
      }
      return true
    })
  }, [filters, leadsData])

  // Paginacao
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage)
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Calculos de KPI em tempo real
  const stats = useMemo(() => {
    return {
      total: filteredLeads.length,
      negotiation: filteredLeads.filter(l => l.phase.id >= 4 && l.phase.id < 6).length,
      volume: filteredLeads.reduce((acc, curr) => acc + curr.value, 0)
    }
  }, [filteredLeads])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setFilters({
      city: "",
      team: "",
      purpose: "Todos",
      status: "",
      phase: "",
      search: "",
      brokerId: "",
      dateStart: "",
      dateEnd: ""
    })
    setCurrentPage(1)
  }

  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  const formatCompact = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(value)

  const handleSaveLead = (leadId: number, data: EditableLeadData) => {
    setLeadsData(prev => prev.map(lead => 
      lead.id === leadId 
        ? { ...lead, ...data }
        : lead
    ))
    // Atualiza o lead selecionado se estiver aberto
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(prev => prev ? { ...prev, ...data } : null)
    }
  }

  // Handlers de selecao em massa
  const handleSelectLead = (id: number, selected: boolean) => {
    setSelectedLeadIds(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    const allIds = filteredLeads.map(l => l.id)
    setSelectedLeadIds(new Set(allIds))
  }

  const handleDeselectAll = () => {
    setSelectedLeadIds(new Set())
  }

  const handleBulkAddToDashboard = () => {
    const count = selectedLeadIds.size
    setLeadsData(prev => prev.map(lead => 
      selectedLeadIds.has(lead.id) 
        ? { ...lead, visibleOnDashboard: true }
        : lead
    ))
    setSelectedLeadIds(new Set())
    toast({
      title: "Adicionados ao Dashboard",
      description: `${count} lead${count > 1 ? 's' : ''} ${count > 1 ? 'foram adicionados' : 'foi adicionado'} ao dashboard com sucesso.`,
    })
  }

  const handleBulkRemoveFromDashboard = () => {
    const count = selectedLeadIds.size
    setLeadsData(prev => prev.map(lead => 
      selectedLeadIds.has(lead.id) 
        ? { ...lead, visibleOnDashboard: false }
        : lead
    ))
    setSelectedLeadIds(new Set())
    toast({
      title: "Removidos do Dashboard",
      description: `${count} lead${count > 1 ? 's' : ''} ${count > 1 ? 'foram ocultados' : 'foi ocultado'} do dashboard.`,
    })
  }

  const handleBulkMarkAsVerified = () => {
    const count = selectedLeadIds.size
    setLeadsData(prev => prev.map(lead => 
      selectedLeadIds.has(lead.id) 
        ? { ...lead, verified: true }
        : lead
    ))
    setSelectedLeadIds(new Set())
    toast({
      title: "Leads Verificados",
      description: `${count} lead${count > 1 ? 's' : ''} ${count > 1 ? 'foram marcados' : 'foi marcado'} como verificado${count > 1 ? 's' : ''}.`,
    })
  }

  const selectionMode = selectedLeadIds.size > 0
  const allFilteredSelected = filteredLeads.length > 0 && filteredLeads.every(l => selectedLeadIds.has(l.id))

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground selection:bg-primary/10 selection:text-primary">
        
        <Sidebar 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Overlay Mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-foreground/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {/* Header */}
          <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-sm flex-shrink-0 z-20">
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 text-muted-foreground hover:bg-accent rounded-lg" onClick={() => setSidebarOpen(true)}>
                <Menu />
              </button>
              <h2 className="text-2xl font-bold text-foreground tracking-tight">Gestao de Atendimentos</h2>
            </div>
            <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition shadow-sm shadow-primary/20">
              <Plus size={18} />
              <span className="hidden sm:inline">Novo Atendimento</span>
            </button>
          </header>

          <div className="flex-1 overflow-y-auto bg-background p-4 lg:p-8 space-y-6">
            
            {/* KPIs Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard 
                title="Total de Leads" 
                value={stats.total} 
                icon={Users} 
                trend="+12%" 
                color="bg-primary" 
              />
              <StatCard 
                title="Em Negociacao" 
                value={stats.negotiation} 
                icon={Briefcase} 
                trend="+5%" 
                color="bg-amber-500" 
              />
              <StatCard 
                title="Volume Potencial" 
                value={formatCompact(stats.volume)} 
                icon={DollarSign} 
                trend="+18%" 
                color="bg-emerald-500" 
              />
            </div>

            {/* Filters */}
            <Filters 
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              teams={TEAMS}
              cities={CITIES}
              brokers={BROKERS}
              phases={PHASES}
              statuses={STATUS_OPTIONS}
              purposes={PURPOSES}
            />

            {/* Export & Results Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-muted-foreground font-medium">
                <span className="text-foreground font-bold">{filteredLeads.length}</span> resultados encontrados
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-card border border-border rounded-lg p-1">
                  <button className="p-1.5 hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600 rounded transition" title="Enviar Pagina p/ Sheets">
                    <FileSpreadsheet size={18} />
                  </button>
                  <div className="w-px h-4 bg-border mx-1" />
                  <select className="bg-transparent text-sm text-muted-foreground outline-none px-2 py-1">
                    <option>CSV</option>
                    <option>PDF</option>
                    <option>Excel</option>
                  </select>
                  <button className="flex items-center gap-1 bg-accent hover:bg-accent/80 text-foreground px-3 py-1.5 rounded text-sm font-medium transition">
                    <Download size={14} /> Exportar
                  </button>
                </div>
              </div>
            </div>

            {/* Grid de Cards (Instagram Style) */}
            {filteredLeads.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
                {paginatedLeads.map(lead => (
                  <LeadCard 
                    key={lead.id}
                    lead={lead}
                    formatCurrency={formatCurrency}
                    onClick={() => setSelectedLead(lead)}
                    isSelected={selectedLeadIds.has(lead.id)}
                    onSelect={handleSelectLead}
                    selectionMode={selectionMode}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Search size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">Nenhum atendimento encontrado.</p>
                <p className="text-sm">Tente ajustar os filtros de busca.</p>
                <Button variant="outline" className="mt-4 bg-transparent" onClick={handleClearFilters}>
                  Limpar todos os filtros
                </Button>
              </div>
            )}

            {/* Paginacao */}
            {filteredLeads.length > 0 && totalPages > 1 && (
              <div className="py-8">
                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}

            {/* Footer */}
            <footer className="border-t border-border pt-6 pb-8 text-center">
              <p className="text-sm text-muted-foreground">
                2026 - <span className="font-semibold text-foreground">Central63</span> | Imobiliaria Casa63 - by Pedro Augusto
              </p>
            </footer>
          </div>
        </main>

        {/* Details Drawer */}
        <DetailsDrawer 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)} 
          formatCurrency={formatCurrency}
          onEditClick={() => setEditModalOpen(true)}
        />

        {/* Edit Lead Modal */}
        <EditLeadModal
          lead={selectedLead}
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSaveLead}
        />

        {/* Bulk Actions Bar */}
        <BulkActionsBar
          selectedCount={selectedLeadIds.size}
          totalCount={filteredLeads.length}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onAddToDashboard={handleBulkAddToDashboard}
          onRemoveFromDashboard={handleBulkRemoveFromDashboard}
          onMarkAsVerified={handleBulkMarkAsVerified}
          allSelected={allFilteredSelected}
        />

      </div>
    </Suspense>
  )
}
