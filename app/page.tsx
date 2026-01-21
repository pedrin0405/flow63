"use client"

import { useState, useMemo, useEffect, Suspense, useCallback } from "react"
import { 
  Menu, Users, DollarSign, Download, Plus, FileSpreadsheet, Search, Briefcase
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
import { supabase } from "@/lib/supabase" // <--- Importando Supabase

// --- DADOS CONSTANTES ---
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
// Mock brokers para evitar erro se não vier do banco ainda
const MOCK_BROKERS = [
  { id: 1, name: "Mauricio Silva", avatar: "https://i.pravatar.cc/150?u=1" },
  { id: 2, name: "Mariana Costa", avatar: "https://i.pravatar.cc/150?u=2" },
]

export default function Central63App() {
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("atendimentos")
  const [selectedLead, setSelectedLead] = useState<any | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [leadsData, setLeadsData] = useState<any[]>([]) // Começa vazio
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<number>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8
  
  // Estados dos Filtros
  const [filters, setFilters] = useState({
    city: "Palmas", // Default para Palmas para carregar PMW de inicio
    team: "",
    purpose: "Todos",
    status: "",
    phase: "",
    search: "",
    brokerId: "",
    dateStart: "",
    dateEnd: ""
  })

  // --- FUNÇÃO DE BUSCA (COM VERIFICAÇÃO "REVERSA" DE STRING) ---
  const fetchLeads = useCallback(async () => {
    setIsLoading(true)
    try {
      // 1. Define qual tabela consultar baseada na cidade
      const isPmw = !filters.city || filters.city === "Palmas"
      const currentPrefix = isPmw ? "pmw" : "aux" // Prefixo esperado
      const tableName = isPmw ? "atendimento_pmw" : "atendimento_aux"
      const leadRelation = isPmw ? "lead_pmw" : "lead_aux"
      
      // 2. Busca os dados da tabela de Atendimento
      let query = supabase
        .from(tableName)
        .select(`
          *,
          ${leadRelation} (*) 
        `) 

      if (filters.status) query = query.eq('situacao', filters.status)
      if (filters.purpose !== "Todos") query = query.eq('finalidade', filters.purpose)
      
      const { data, error } = await query
      if (error) throw error

      // 3. VERIFICAÇÃO REVERSA (Desmontando o ID da tabela vendas)
      let leadsInDashboard = new Set();
      
      // Buscamos na tabela 'vendas' todos os IDs que começam com o prefixo da tabela atual (ex: 'pmw_%')
      const { data: vendasIds, error: vendasError } = await supabase
        .from('vendas')
        .select('id')
        .ilike('id', `${currentPrefix}_%`) // Otimização: Traz apenas o que interessa
      
      if (!vendasError && vendasIds) {
        vendasIds.forEach((item: any) => {
          // "Desmonta" o ID: pmw_32464 -> ["pmw", "32464"]
          const parts = item.id.split('_');
          
          if (parts.length === 2 && parts[0] === currentPrefix) {
             // O segundo pedaço é o ID original numérico
             const originalId = parseInt(parts[1]);
             if (!isNaN(originalId)) {
               leadsInDashboard.add(originalId);
             }
          }
        })
      }

      // 4. Mapeamento dos dados
      const mappedLeads = data?.map((item: any, index: number) => {
        const linkedLead = item[leadRelation] || {}
        const safeId = item.id || item.codigo || index;
        
        // Verifica se o ID deste item foi encontrado na lista desmontada
        const isOnDash = leadsInDashboard.has(safeId);

        return {
          id: safeId, 
          sourceTable: tableName, 
          
          clientName: linkedLead.nome || "Cliente (Sem Nome)",
          clientAvatar: linkedLead.avatar_url || `https://i.pravatar.cc/150?u=${safeId}`,
          
          broker: { 
            id: 1, 
            name: "Corretor", 
            avatar: "https://i.pravatar.cc/150?u=99" 
          },
          phase: PHASES[0], 
          
          team: "Vendas",
          city: filters.city || (isPmw ? "Palmas" : "Auxiliar"),
          purpose: item.finalidade || "Indefinido",
          status: item.situacao || "Novo",
          
          propertyTitle: item.codigo ? `Imóvel #${item.codigo}` : "Imóvel sem código",
          propertyLocation: "----",
          propertyAddress: "----",
          value: 0, 
          image: "/placeholder.jpg",
          updatedAt: new Date().toLocaleDateString("pt-BR"),
          lastUpdateISO: new Date().toISOString(),
          
          leadData: {
            email: linkedLead.email || "",
            phone: linkedLead.telefone || "",
            origin: item.midia || "Desconhecido",
            createdAt: new Date().toLocaleDateString("pt-BR")
          },

          history: [
             { 
               date: new Date().toLocaleDateString("pt-BR"), 
               action: "Importado", 
               user: "Sistema", 
               desc: "Lead carregado do Supabase", 
               type: "system" 
             }
          ],
          
          raw_codigo: item.codigo,
          raw_midia: item.midia,

          // Flag baseada na verificação reversa
          visibleOnDashboard: isOnDash 
        }
      }) || []

      setLeadsData(mappedLeads)

    } catch (error) {
      console.error("Erro ao buscar leads:", error)
      toast({
        title: "Erro ao carregar",
        description: "Falha ao verificar dados.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [filters.city, filters.status, filters.purpose, toast])

  // Dispara a busca quando mudar a cidade ou filtros principais
  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])


  // --- LÓGICA DE FILTRAGEM CLIENT-SIDE (Mantida para busca textual rápida) ---
  const filteredLeads = useMemo(() => {
    return leadsData.filter(lead => {
      // Filtros já aplicados no banco podem ser removidos daqui se quiser
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

  // KPI calculations
  const stats = useMemo(() => {
    return {
      total: filteredLeads.length,
      negotiation: filteredLeads.filter(l => l.status === "Em Negociacao").length,
      volume: filteredLeads.reduce((acc, curr) => acc + (curr.value || 0), 0)
    }
  }, [filteredLeads])

  // --- HANDLERS ---
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setFilters({
      city: "Palmas", // Reseta para padrão
      team: "",
      purpose: "Todos",
      status: "",
      phase: "",
      search: "",
      brokerId: "",
      dateStart: "",
      dateEnd: ""
    })
  }

  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  const formatCompact = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(value)

  const handleSaveLead = (leadId: number, data: EditableLeadData) => {
    // TODO: Implementar update no Supabase aqui
    console.log("Salvar lead no banco:", leadId, data)
  }

  // --- INTEGRACAO: ADD AO DASHBOARD (TABELA VENDAS) ---
  const handleBulkAddToDashboard = async () => {
    const leadsToAdd = leadsData.filter(l => selectedLeadIds.has(l.id))
    
    if (leadsToAdd.length === 0) return

    try {
      // 1. Prepara os dados para inserir na tabela Vendas
      const payload = leadsToAdd.map(lead => {
        // Define prefixo do ID para evitar colisão (pmw_10, aux_10)
        const prefix = lead.sourceTable.includes("pmw") ? "pmw" : "aux"
        const newId = `${prefix}_${lead.id}`

        return {
          id: newId, // Coluna ID na tabela vendas deve ser texto/varchar
          id_origem: lead.id,
          tabela_origem: lead.sourceTable,
          
          // Campos Solicitados Explicitamente
          codigo: lead.raw_codigo,
          finalidade: lead.purpose,
          situacao: lead.status,
          midia: lead.raw_midia,

          // --- AREA PARA ADICIONAR OUTROS CAMPOS MANUALMENTE ---
          // Exemplo: nome_cliente: lead.clientName,
          // Exemplo: telefone: lead.leadData.phone,
          // Exemplo: valor: lead.value,
          // -----------------------------------------------------

          created_at: new Date().toISOString()
        }
      })

      // 2. Envia para o Supabase
      const { error } = await supabase
        .from('vendas')
        .insert(payload) // insert aceita array para bulk insert

      if (error) {
        // Se der erro de chave duplicada (já adicionado), avisa
        if (error.code === '23505') { 
            throw new Error("Alguns itens já foram adicionados ao dashboard.")
        }
        throw error
      }

      // 3. Sucesso: Atualiza UI Local
      setLeadsData(prev => prev.map(lead => 
        selectedLeadIds.has(lead.id) 
          ? { ...lead, visibleOnDashboard: true }
          : lead
      ))
      
      setSelectedLeadIds(new Set())
      
      toast({
        title: "Sucesso!",
        description: `${leadsToAdd.length} leads enviados para o Dashboard de Vendas.`,
        variant: "default", 
        className: "bg-emerald-500 text-white border-none"
      })

    } catch (error: any) {
      console.error("Erro ao add dashboard:", error)
      toast({
        title: "Erro ao processar",
        description: error.message || "Falha ao conectar com Supabase.",
        variant: "destructive"
      })
    }
  }

  const handleBulkRemoveFromDashboard = () => {
      // Implementar logica de delete da tabela vendas se necessario
      toast({ title: "Funcionalidade em breve" })
  }
  const handleBulkMarkAsVerified = () => {} // Implementar se necessario

  // Handlers de seleção
  const handleSelectLead = (id: number, selected: boolean) => {
    setSelectedLeadIds(prev => {
      const newSet = new Set(prev)
      if (selected) newSet.add(id)
      else newSet.delete(id)
      return newSet
    })
  }

  const handleSelectAll = () => {
    const allIds = filteredLeads.map(l => l.id)
    setSelectedLeadIds(new Set(allIds))
  }

  const handleDeselectAll = () => setSelectedLeadIds(new Set())

  const selectionMode = selectedLeadIds.size > 0
  const allFilteredSelected = filteredLeads.length > 0 && filteredLeads.every(l => selectedLeadIds.has(l.id))

  // Renderização condicional para loading inicial
  // ...

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground selection:bg-primary/10 selection:text-primary">
        
        <Sidebar 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {sidebarOpen && (
          <div className="fixed inset-0 bg-foreground/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Total na Lista" value={stats.total} icon={Users} trend="Atual" color="bg-primary" />
              <StatCard title="Em Negociacao" value={stats.negotiation} icon={Briefcase} trend="Funil" color="bg-amber-500" />
              <StatCard title="Volume Potencial" value={formatCompact(stats.volume)} icon={DollarSign} trend="R$" color="bg-emerald-500" />
            </div>

            <Filters 
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              teams={TEAMS}
              cities={CITIES}
              brokers={MOCK_BROKERS}
              phases={PHASES}
              statuses={STATUS_OPTIONS}
              purposes={PURPOSES}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-muted-foreground font-medium">
                <span className="text-foreground font-bold">{filteredLeads.length}</span> resultados encontrados
              </h3>
            </div>

            {/* LOADING STATE */}
            {isLoading ? (
               <div className="flex justify-center items-center py-20">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
               </div>
            ) : filteredLeads.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
                {paginatedLeads.map(lead => (
                  <LeadCard 
                    key={`${lead.sourceTable}-${lead.id}`} // Chave única composta
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
                <p className="text-sm">Tente mudar a Cidade no filtro.</p>
                <Button variant="outline" className="mt-4 bg-transparent" onClick={handleClearFilters}>
                  Limpar filtros
                </Button>
              </div>
            )}

            {filteredLeads.length > 0 && totalPages > 1 && (
              <div className="py-8">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </div>
            )}

            <footer className="border-t border-border pt-6 pb-8 text-center">
              <p className="text-sm text-muted-foreground">
                2026 - <span className="font-semibold text-foreground">Central63</span>
              </p>
            </footer>
          </div>
        </main>

        <DetailsDrawer 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)} 
          formatCurrency={formatCurrency}
          onEditClick={() => setEditModalOpen(true)}
        />

        <EditLeadModal
          lead={selectedLead}
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSaveLead}
        />

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