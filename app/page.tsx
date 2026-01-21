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

// --- CONSTANTES ---
const TEAMS = ["Vendas A", "Vendas B", "Locacao Alpha", "Locacao Beta"]
const CITIES = ["Palmas", "Araguaina"]
const PURPOSES = ["Venda", "Locacao"]
const STATUS_OPTIONS = ["Em atendimento", "Negócio realizado", "Descartado"]
const PHASES = [
  { id: 1, label: "Pre-atendimento", percent: 10 },
  { id: 2, label: "Qualificacao", percent: 30 },
  { id: 3, label: "Visita", percent: 50 },
  { id: 4, label: "Proposta", percent: 70 },
  { id: 5, label: "Negociacao", percent: 90 },
  { id: 6, label: "Fechamento", percent: 100 },
]

// Removido MOCK_BROKERS pois agora é dinâmico
const MOCK_BROKERS = [
  { id: 1, name: "Carregando...", avatar: "" },
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

  // Controle do Modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"edit" | "sale">("edit")
  
  // Filtros
  const [filters, setFilters] = useState({
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

  // --- HELPER: Normalizar Moeda ---
  const normalizeCurrency = (value: any): number => {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    try {
      let str = value.toString().replace(/[^\d,.-]/g, '');
      if (str.includes(',')) {
        str = str.replace(/\./g, '').replace(',', '.');
      }
      const parsed = parseFloat(str);
      return isNaN(parsed) ? 0 : parsed;
    } catch (e) { return 0; }
  }

  // --- HELPER: Comparar IDs ---
  const compareIds = (id1: string, id2: string) => {
    if (id1 === id2) return 0;
    const parts1 = id1.toString().split('_');
    const parts2 = id2.toString().split('_');
    if (parts1.length === 2 && parts2.length === 2) {
        const num1 = parseInt(parts1[1]);
        const num2 = parseInt(parts2[1]);
        if (!isNaN(num1) && !isNaN(num2)) return num1 - num2;
    }
    return id1 > id2 ? 1 : -1;
  }

  // --- FUNÇÃO DE BUSCA COMPLEXA (ATUALIZADA) ---
  const fetchLeads = useCallback(async () => {
    setIsLoading(true)
    try {
      // 1. Configuração do Contexto
      const isPmw = !filters.city || filters.city === "Palmas"
      const currentPrefix = isPmw ? "pmw" : "aux"
      
      const tableAtendimento = isPmw ? "atendimento_pmw" : "atendimento_aux"
      const tableLead = isPmw ? "lead_pmw" : "lead_aux"
      const tableCarrinho = isPmw ? "imovel_carrinho_pmw" : "imovel_carrinho_aux"
      const tableImovel = isPmw ? "imovel_pmw" : "imovel_aux"
      const tableCorretores = isPmw ? "corretores_pmw" : "corretores_aux" // <--- NOVA TABELA
      
      // ---------------------------------------------------------
      // ETAPA 1: Busca Atendimentos (Paginação Automática)
      // ---------------------------------------------------------
      let allAtendimentos: any[] = [];
      let hasMore = true;
      let from = 0;
      const batchSize = 1000;

      while (hasMore) {
        let query = supabase
          .from(tableAtendimento)
          .select(`*, ${tableLead} (*)`)
          .range(from, from + batchSize - 1);

        if (filters.status) query = query.eq('situacao', filters.status)
        if (filters.purpose !== "Todos") query = query.eq('finalidade', filters.purpose)
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allAtendimentos = [...allAtendimentos, ...data];
          from += batchSize;
          if (data.length < batchSize) hasMore = false;
        } else {
          hasMore = false;
        }
      }

      if (allAtendimentos.length === 0) {
        setLeadsData([]);
        setIsLoading(false);
        return;
      }

      // Prepara IDs Seguros
      const itemsWithSafeIds = allAtendimentos.map((item: any, index: number) => {
         const safeId = item.id || item.codigo || index;
         return { ...item, safeId };
      });

      // ---------------------------------------------------------
      // ETAPA 1.5: Busca Dados dos Corretores (NOVO)
      // ---------------------------------------------------------
      // Extrai nomes únicos de corretores dos atendimentos
      const uniqueBrokerNames = Array.from(new Set(
        allAtendimentos
          .map((a: any) => a.corretor)
          .filter((name: any) => name && typeof name === 'string')
      )) as string[];

      let brokerMap: Record<string, string> = {} // Nome -> URL Avatar

      if (uniqueBrokerNames.length > 0) {
        const { data: brokersData, error: errBrokers } = await supabase
          .from(tableCorretores)
          .select('nome, imagem_url')
          .in('nome', uniqueBrokerNames)

        if (!errBrokers && brokersData) {
          brokersData.forEach((broker: any) => {
            if (broker.imagem_url) {
              brokerMap[broker.nome] = broker.imagem_url
            }
          })
        }
      }

      // ---------------------------------------------------------
      // ETAPA 2: Busca Imóvel no Carrinho
      // ---------------------------------------------------------
      const loadedCodigos = itemsWithSafeIds.map(a => a.codigo).filter(Boolean)
      let imovelDetailsMap: Record<string, { url: string, valor: number, address: string }> = {}

      if (loadedCodigos.length > 0) {
        const { data: itensCarrinho, error: errCarrinho } = await supabase
          .from(tableCarrinho)
          .select('id, atendimento_codigo, imovel_codigo')
          .in('atendimento_codigo', loadedCodigos)

        if (!errCarrinho && itensCarrinho) {
          const bestImovelPorAtendimento: Record<string, string> = {}
          const itemMaisRecente: Record<string, string> = {} 

          itensCarrinho.forEach((item: any) => {
             const atCod = item.atendimento_codigo
             const currentId = item.id 
             if (!itemMaisRecente[atCod] || compareIds(currentId, itemMaisRecente[atCod]) > 0) {
                itemMaisRecente[atCod] = currentId
                bestImovelPorAtendimento[atCod] = item.imovel_codigo
             }
          })

          const imoveisParaBuscar = Object.values(bestImovelPorAtendimento)
          
          if (imoveisParaBuscar.length > 0) {
             const { data: imoveisData, error: errImovel } = await supabase
               .from(tableImovel)
               .select('codigo, urlfotoprincipal, valor, endereco, cidade, estado') 
               .in('codigo', imoveisParaBuscar)
             
             if (!errImovel && imoveisData) {
               const dadosPorImovel: Record<string, { url: string, valor: number, address: string }> = {}
               
               imoveisData.forEach((im: any) => {
                 const valorLimpo = normalizeCurrency(im.valor);
                 const partesEndereco = [
                    im.endereco,
                    im.cidade ? `${im.cidade}/${im.estado || ''}` : null
                 ].filter(Boolean);
                 const enderecoCompleto = partesEndereco.join(" - ") || "Endereço não informado";

                 dadosPorImovel[im.codigo] = {
                   url: im.urlfotoprincipal,
                   valor: valorLimpo,
                   address: enderecoCompleto 
                 }
               })

               Object.keys(bestImovelPorAtendimento).forEach(atCod => {
                 const imCod = bestImovelPorAtendimento[atCod]
                 if (dadosPorImovel[imCod]) {
                   imovelDetailsMap[atCod] = dadosPorImovel[imCod]
                 }
               })
             }
          }
        }
      }

      // ---------------------------------------------------------
      // ETAPA 3: Verificação de Dashboard
      // ---------------------------------------------------------
      let leadsInDashboard = new Set<string>();
      
      if (itemsWithSafeIds.length > 0) {
        const idsToVerify = itemsWithSafeIds.map(item => `${currentPrefix}_${item.safeId}`)

        const verifyBatchSize = 1000;
        for (let i = 0; i < idsToVerify.length; i += verifyBatchSize) {
            const chunk = idsToVerify.slice(i, i + verifyBatchSize);
            const { data: vendasMatches, error: errVendas } = await supabase
                .from('vendas')
                .select('id')
                .in('id', chunk)
            
            if (!errVendas && vendasMatches) {
                vendasMatches.forEach((match: any) => {
                    leadsInDashboard.add(match.id);
                })
            }
        }
      }

      // ---------------------------------------------------------
      // Mapeamento Final
      // ---------------------------------------------------------
      const mappedLeads = itemsWithSafeIds.map((item: any, index: number) => {
        const linkedLead = item.lead_pmw || item.lead_aux || {}
        
        const clientName = linkedLead.nome || "Cliente";
        const fullIdToCheck = `${currentPrefix}_${item.safeId}`;
        const isOnDash = leadsInDashboard.has(fullIdToCheck);
        
        const details = imovelDetailsMap[item.codigo] || { url: null, valor: 0, address: "Endereço Pendente" }
        const resolvedImage = details.url || "https://app.imoview.com.br//Front/img/house1.png"
        const resolvedValue = details.valor || 0
        const resolvedAddress = details.address

        // --- RESOLUÇÃO DO CORRETOR ---
        const brokerName = item.corretor || "Corretor Desconhecido";
        // Tenta pegar a foto do banco, senão gera um avatar com iniciais
        const brokerAvatar = brokerMap[brokerName] 
          || `https://ui-avatars.com/api/?name=${encodeURIComponent(brokerName)}&background=0D8ABC&color=fff&bold=true`;

        return {
          id: item.safeId, 
          sourceTable: isPmw ? "atendimento_pmw" : "atendimento_aux",
          
          clientName: clientName,
          clientAvatar: linkedLead.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(clientName)}&background=random&color=fff&bold=true`,
          
          // Dados Reais do Corretor
          broker: {
            id: 0, // ID não é crítico para exibição
            name: brokerName,
            avatar: brokerAvatar
          },

          phase: PHASES[0], 
          team: "Vendas",
          city: filters.city || (isPmw ? "Palmas" : "Outra"),
          purpose: item.finalidade || "Indefinido",
          status: item.situacao || "Novo",
          
          propertyTitle: item.codigo ? `Imóvel #${item.codigo}` : "Imóvel sem código",
          propertyAddress: resolvedAddress,
          propertyLocation: item.codigo || "----", 
          value: resolvedValue, 
          image: resolvedImage, 
          
          updatedAt: new Date().toLocaleDateString("pt-BR"),
          lastUpdateISO: new Date().toISOString(),
          
          leadData: {
            email: linkedLead.email || "",
            phone: linkedLead.telefone || "",
            origin: item.midia || "Desconhecido",
            createdAt: new Date().toLocaleDateString("pt-BR")
          },
          history: [{ date: new Date().toLocaleDateString("pt-BR"), action: "Importado", user: "Sistema", desc: "Lead carregado", type: "system" }],
          
          raw_codigo: item.codigo,
          raw_midia: item.midia,
          
          visibleOnDashboard: isOnDash 
        }
      })

      setLeadsData(mappedLeads)

    } catch (error) {
      console.error("Erro ao buscar leads:", error)
      toast({ title: "Erro", description: "Falha ao carregar atendimentos.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [filters.city, filters.status, filters.purpose, toast])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // --- FILTROS ---
  const filteredLeads = useMemo(() => {
    return leadsData.filter(lead => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesName = lead.clientName.toLowerCase().includes(searchLower)
        const matchesId = lead.id.toString().includes(searchLower)
        const matchesBroker = lead.broker.name.toLowerCase().includes(searchLower) // Busca também por corretor
        if (!matchesName && !matchesId && !matchesBroker) return false
      }
      return true
    })
  }, [filters, leadsData])

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage)
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  
  const stats = useMemo(() => {
    return {
      total: filteredLeads.length,
      negotiation: filteredLeads.filter(l => l.status === "Em Negociacao").length,
      volume: filteredLeads.reduce((acc, curr) => acc + (curr.value || 0), 0)
    }
  }, [filteredLeads])

  const handleFilterChange = (key: string, value: string) => { setFilters(prev => ({ ...prev, [key]: value })); setCurrentPage(1) }
  const handleClearFilters = () => { setFilters({ city: "Palmas", team: "", purpose: "Todos", status: "", phase: "", search: "", brokerId: "", dateStart: "", dateEnd: "" }) }
  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  const formatCompact = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(value)

  const handleAddToDashboard = (lead: any) => {
    setSelectedLead(lead)
    setModalMode("sale") 
    setEditModalOpen(true)
  }

  const handleSaveData = async (leadId: number, data: EditableLeadData) => {
    if (modalMode === "sale") {
      try {
        const lead = leadsData.find(l => l.id === leadId)
        if (!lead) return
        const prefix = lead.sourceTable.includes("pmw") ? "pmw" : "aux"
        const newId = `${prefix}_${lead.id}`
        
        const payload = {
          id: newId, 
          id_origem: lead.id,
          tabela_origem: lead.sourceTable,
          codigo: lead.raw_codigo,
          finalidade: lead.purpose,
          situacao: lead.phase.label, 
          midia: lead.raw_midia,
          nome_cliente: data.clientName,
          valor_venda: data.valor_venda,
          data_venda: data.data_venda,
          comissao: data.comissao,
          obs_venda: data.obs_venda,
          status_dashboard: data.status_dashboard ? "Visível" : "Oculto",
          created_at: new Date().toISOString()
        }
        
        const { error } = await supabase.from('vendas').upsert([payload])
        if (error) throw error
        
        setLeadsData(prev => prev.map(l => l.id === leadId ? { ...l, visibleOnDashboard: true } : l))
        toast({ title: lead.visibleOnDashboard ? "Venda Atualizada!" : "Venda Lançada!", description: `Sucesso para ${data.clientName}`, className: "bg-emerald-500 text-white border-none" })
      } catch (error: any) {
        console.error("Erro venda:", error)
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" })
      }
    } else {
      setLeadsData(prev => prev.map(lead => lead.id === leadId ? { ...lead, ...data } : lead))
      toast({ title: "Lead Atualizado", description: "Salvo localmente." })
    }
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground selection:bg-primary/10 selection:text-primary">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activeTab={activeTab} onTabChange={setActiveTab} />
        {sidebarOpen && <div className="fixed inset-0 bg-foreground/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-sm flex-shrink-0 z-20">
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 text-muted-foreground hover:bg-accent rounded-lg" onClick={() => setSidebarOpen(true)}><Menu /></button>
              <h2 className="text-2xl font-bold text-foreground tracking-tight">Gestao de Atendimentos</h2>
            </div>
            <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition shadow-sm shadow-primary/20">
              <Plus size={18} /><span className="hidden sm:inline">Novo Atendimento</span>
            </button>
          </header>

          <div className="flex-1 overflow-y-auto bg-background p-4 lg:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Total na Lista" value={stats.total} icon={Users} trend="Atual" color="bg-primary" />
              <StatCard title="Em Negociacao" value={stats.negotiation} icon={Briefcase} trend="Funil" color="bg-amber-500" />
              <StatCard title="Volume Potencial" value={formatCompact(stats.volume)} icon={DollarSign} trend="R$" color="bg-emerald-500" />
            </div>

            <Filters filters={filters} onFilterChange={handleFilterChange} onClearFilters={handleClearFilters} teams={TEAMS} cities={CITIES} brokers={MOCK_BROKERS} phases={PHASES} statuses={STATUS_OPTIONS} purposes={PURPOSES} />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-muted-foreground font-medium"><span className="text-foreground font-bold">{filteredLeads.length}</span> resultados encontrados</h3>
            </div>

            {isLoading ? (
               <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
            ) : filteredLeads.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
                {paginatedLeads.map(lead => (
                  <LeadCard 
                    key={`${lead.sourceTable}-${lead.id}`} 
                    lead={lead}
                    formatCurrency={formatCurrency}
                    onClick={() => setSelectedLead(lead)}
                    onAddToDashboard={(e) => handleAddToDashboard(lead)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Search size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">Nenhum atendimento encontrado.</p>
                <p className="text-sm">Tente mudar a Cidade no filtro.</p>
                <Button variant="outline" className="mt-4 bg-transparent" onClick={handleClearFilters}>Limpar filtros</Button>
              </div>
            )}

            {filteredLeads.length > 0 && totalPages > 1 && (
              <div className="py-8"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /></div>
            )}
            <footer className="border-t border-border pt-6 pb-8 text-center"><p className="text-sm text-muted-foreground">2026 - <span className="font-semibold text-foreground">Central63</span></p></footer>
          </div>
        </main>

        <DetailsDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} formatCurrency={formatCurrency} onEditClick={() => { setModalMode("edit"); setEditModalOpen(true) }} />
        <EditLeadModal lead={selectedLead} isOpen={editModalOpen} onClose={() => { setEditModalOpen(false); setModalMode("edit") }} onSave={handleSaveData} mode={modalMode} />
      </div>
    </Suspense>
  )
}