"use client"

import { useState, useMemo, useEffect, Suspense, useCallback } from "react"
import { 
  Menu, Users, DollarSign, Plus, Search, Briefcase
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/central63/sidebar"
import { StatCard } from "@/components/central63/stat-card"
import { Filters } from "@/components/central63/filters"
import { LeadCard } from "@/components/central63/lead-card"
import { Pagination } from "@/components/central63/pagination"
import { DetailsDrawer } from "@/components/central63/details-drawer"
import { EditLeadModal, type EditableLeadData } from "@/components/central63/edit-lead-modal"
import { useToast } from "@/hooks/use-toast"
import Loading from "./loading"
import { supabase } from "@/lib/supabase"

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

// Mock brokers (enquanto não houver tabela de corretores)
const MOCK_BROKERS = [
  { id: 1, name: "Mauricio Silva", avatar: "https://i.pravatar.cc/150?u=1" },
  { id: 2, name: "Mariana Costa", avatar: "https://i.pravatar.cc/150?u=2" },
]

export default function Central63App() {
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("atendimentos")
  
  // Estados de Dados
  const [selectedLead, setSelectedLead] = useState<any | null>(null)
  const [leadsData, setLeadsData] = useState<any[]>([]) 
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Controle do Modal (Edição vs Venda)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"edit" | "sale">("edit")
  
  // Filtros
  const [filters, setFilters] = useState({
    city: "Palmas", // Default
    team: "",
    purpose: "Todos",
    status: "",
    phase: "",
    search: "",
    brokerId: "",
    dateStart: "",
    dateEnd: ""
  })

  // --- FUNÇÃO DE BUSCA (SUPABASE + VERIFICAÇÃO DE VENDAS) ---
  const fetchLeads = useCallback(async () => {
    setIsLoading(true)
    try {
      // 1. Define contexto baseado na cidade
      const isPmw = !filters.city || filters.city === "Palmas"
      const currentPrefix = isPmw ? "pmw" : "aux"
      const tableName = isPmw ? "atendimento_pmw" : "atendimento_aux"
      const leadRelation = isPmw ? "lead_pmw" : "lead_aux"
      
      // 2. Query Principal na tabela de atendimentos
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

      // 3. VERIFICAÇÃO REVERSA: Checa quais cards já estão no Dashboard de Vendas
      let leadsInDashboard = new Set();
      
      // Busca apenas IDs na tabela vendas que começam com o prefixo atual (ex: 'pmw_%')
      const { data: vendasIds, error: vendasError } = await supabase
        .from('vendas')
        .select('id')
        .ilike('id', `${currentPrefix}_%`) 
      
      if (!vendasError && vendasIds) {
        vendasIds.forEach((item: any) => {
          // Desmonta o ID: "pmw_32464" -> ["pmw", "32464"] para achar o ID original
          const parts = item.id.split('_');
          if (parts.length === 2 && parts[0] === currentPrefix) {
             const originalId = parseInt(parts[1]);
             if (!isNaN(originalId)) {
               leadsInDashboard.add(originalId);
             }
          }
        })
      }

      // 4. Mapeamento (Banco -> Interface UI)
      const mappedLeads = data?.map((item: any, index: number) => {
        const linkedLead = item[leadRelation] || {}
        // Fallback seguro para ID se vier nulo
        const safeId = item.id || item.codigo || index;
        
        // Verifica se o ID deste card está na lista de vendas
        const isOnDash = leadsInDashboard.has(safeId);

        return {
          id: safeId, 
          sourceTable: tableName, 
          
          clientName: linkedLead.nome || "Cliente (Sem Nome)",
          clientAvatar: linkedLead.avatar_url || `https://i.pravatar.cc/150?u=${safeId}`,
          
          broker: MOCK_BROKERS[0],
          phase: PHASES[0], 
          
          team: "Vendas",
          city: filters.city || (isPmw ? "Palmas" : "Outra"),
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
          
          // Campos técnicos
          raw_codigo: item.codigo,
          raw_midia: item.midia,

          // Flag que ativa a etiqueta "No Dashboard"
          visibleOnDashboard: isOnDash 
        }
      }) || []

      setLeadsData(mappedLeads)

    } catch (error) {
      console.error("Erro ao buscar leads:", error)
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível buscar os atendimentos.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [filters.city, filters.status, filters.purpose, toast])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // --- FILTROS CLIENT-SIDE ---
  const filteredLeads = useMemo(() => {
    return leadsData.filter(lead => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesName = lead.clientName.toLowerCase().includes(searchLower)
        const matchesId = lead.id.toString().includes(searchLower)
        if (!matchesName && !matchesId) return false
      }
      return true
    })
  }, [filters, leadsData])

  // Paginação
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage)
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // KPIs
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
      city: "Palmas",
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

  // --- AÇÃO: BOTÃO "ADD/ATUALIZAR" NO CARD ---
  const handleAddToDashboard = (lead: any) => {
    // Define o modal para o modo de VENDA e abre
    setSelectedLead(lead)
    setModalMode("sale") 
    setEditModalOpen(true)
  }

  // --- SALVAMENTO (UPSERT NA TABELA VENDAS) ---
  const handleSaveData = async (leadId: number, data: EditableLeadData) => {
    
    // MODO VENDA: Inserir ou Atualizar na tabela 'vendas'
    if (modalMode === "sale") {
      try {
        const lead = leadsData.find(l => l.id === leadId)
        if (!lead) return

        // Cria o ID prefixado (ex: pmw_10)
        const prefix = lead.sourceTable.includes("pmw") ? "pmw" : "aux"
        const newId = `${prefix}_${lead.id}`

        const payload = {
          id: newId, // Chave primária
          id_origem: lead.id,
          tabela_origem: lead.sourceTable,
          
          // Dados Automáticos
          codigo: lead.raw_codigo,
          finalidade: lead.purpose,
          situacao: "Vendido", 
          midia: lead.raw_midia,

          // Dados Manuais do Modal
          nome_cliente: data.clientName,
          valor_venda: data.valor_venda,
          data_venda: data.data_venda,
          comissao: data.comissao,
          obs_venda: data.obs_venda,
          
          // Visibilidade
          status_dashboard: data.status_dashboard ? "Visível" : "Oculto",
          
          created_at: new Date().toISOString()
        }

        // UPSERT: Atualiza se existir, Insere se não
        const { error } = await supabase.from('vendas').upsert([payload])

        if (error) throw error

        // Sucesso: Atualiza UI Local
        setLeadsData(prev => prev.map(l => 
          l.id === leadId ? { ...l, visibleOnDashboard: true } : l
        ))
        
        toast({
          title: lead.visibleOnDashboard ? "Venda Atualizada!" : "Venda Lançada!",
          description: `Os dados de ${data.clientName} foram salvos com sucesso.`,
          className: "bg-emerald-500 text-white border-none"
        })

      } catch (error: any) {
        console.error("Erro venda:", error)
        toast({ 
          title: "Erro ao salvar", 
          description: error.message || "Verifique o console.", 
          variant: "destructive" 
        })
      }
    } 
    
    // MODO EDIÇÃO: Apenas atualiza dados locais
    else {
      console.log("Atualizando lead (modo edit):", data)
      setLeadsData(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, ...data } : lead
      ))
      toast({ title: "Lead Atualizado", description: "Alterações salvas localmente." })
    }
  }

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
            
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Total na Lista" value={stats.total} icon={Users} trend="Atual" color="bg-primary" />
              <StatCard title="Em Negociacao" value={stats.negotiation} icon={Briefcase} trend="Funil" color="bg-amber-500" />
              <StatCard title="Volume Potencial" value={formatCompact(stats.volume)} icon={DollarSign} trend="R$" color="bg-emerald-500" />
            </div>

            {/* Filtros */}
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

            {/* Grid de Cards */}
            {isLoading ? (
               <div className="flex justify-center items-center py-20">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
               </div>
            ) : filteredLeads.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
                {paginatedLeads.map(lead => (
                  <LeadCard 
                    key={`${lead.sourceTable}-${lead.id}`} // Chave única
                    lead={lead}
                    formatCurrency={formatCurrency}
                    
                    // Clique no card abre detalhes (Drawer)
                    onClick={() => {
                      setSelectedLead(lead)
                    }}
                    
                    // Ação do Botão "Add/Atualizar"
                    onAddToDashboard={(e) => handleAddToDashboard(lead)}
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

            {/* Paginação */}
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

        {/* Drawer de Detalhes */}
        <DetailsDrawer 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)} 
          formatCurrency={formatCurrency}
          onEditClick={() => {
             setModalMode("edit") // Edição comum
             setEditModalOpen(true)
          }}
        />

        {/* Modal Unificado (Edição ou Venda) */}
        <EditLeadModal
          lead={selectedLead}
          isOpen={editModalOpen}
          onClose={() => {
             setEditModalOpen(false)
             setModalMode("edit") 
          }}
          onSave={handleSaveData}
          mode={modalMode} // Passa o modo atual (edit/sale)
        />

      </div>
    </Suspense>
  )
}