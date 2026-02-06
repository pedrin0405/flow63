"use client"

import { useState, useMemo, useEffect, Suspense, useCallback } from "react"
import { 
  Menu, Users, DollarSign, Plus, Search, Briefcase, RefreshCw, Loader2
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
import Loading from "../loading"
import { supabase } from "@/lib/supabase"

// --- CONSTANTES ---
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

const MOCK_BROKERS = [
  { id: 0, name: "Carregando...", avatar: "" },
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
  const [isUpdating, setIsUpdating] = useState(false)
  const itemsPerPage = 16

  // Estado para Equipes Dinâmicas (Departamentos dos Corretores)
  const [teams, setTeams] = useState<string[]>([])

  // Controle do Modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"edit" | "sale">("edit")
  const [listaCorretores, setListaCorretores] = useState<any[]>(MOCK_BROKERS)
  
  // Filtros
  const [filters, setFilters] = useState({
    city: "Palmas",
    team: "",
    purpose: "Todos",
    status: "Negócio realizado",
    phase: "",
    search: "",
    brokerId: "",
    dateStart: "",
    dateEnd: ""
  })

  // Função para lidar com o click no botão Atualizar [!code ++]
  const handleUpdateSupabase = async () => {
    setIsUpdating(true)
    try {
      // Faz a requisição em background ("aciona" o link)
      // mode: 'no-cors' permite disparar a requisição mesmo se o servidor não retornar headers CORS
      await fetch("https://n8n.srv1207506.hstgr.cloud/webhook/f9908aaf-229a-4df3-a95c-0dba6546305e", { method: "GET", mode: "no-cors" })

      toast({
        title: "Atualização Disparada",
        description: "O comando foi enviado para o Supabase com sucesso.",
        className: "bg-emerald-500 text-white border-none"
      })
    } catch (error) {
      console.error("Erro ao atualizar:", error)
      toast({
        title: "Erro",
        description: "Falha ao acionar a atualização.",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

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
  const compareIds = (id1: any, id2: any) => {
    if (id1 === id2) return 0;
    if (!id1) return -1;
    if (!id2) return 1;
    
    const s1 = String(id1);
    const s2 = String(id2);
    
    const parts1 = s1.split('_');
    const parts2 = s2.split('_');
    
    if (parts1.length === 2 && parts2.length === 2) {
        const num1 = parseInt(parts1[1]);
        const num2 = parseInt(parts2[1]);
        if (!isNaN(num1) && !isNaN(num2)) return num1 - num2;
    }
    return s1 > s2 ? 1 : -1;
  }

  // --- HELPER: Parse Date (dd/mm/yyyy para Date object) ---
  const parseDateBr = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return null;
  }

  // --- EFEITO: Buscar Lista de Corretores e DEPARTAMENTOS ---
  useEffect(() => {
    const fetchBrokersAndTeams = async () => {
      try {
        // Busca corretores e seus departamentos em ambas as tabelas
        const [resPmw, resAux] = await Promise.all([
          supabase.from('corretores_pmw').select('*'),
          supabase.from('corretores_aux').select('*')
        ]);

        const corretoresPmw = resPmw.data || [];
        const corretoresAux = resAux.data || [];
        
        const mapNomes = new Map();
        const departamentosSet = new Set<string>();

        [...corretoresPmw, ...corretoresAux].forEach(c => {
            if (c.nome && !mapNomes.has(c.nome)) {
                mapNomes.set(c.nome, c.imagem_url || "");
            }
            // Coleta departamentos válidos para o filtro de equipes
            if (c.departamento && c.departamento.trim() !== "") {
              departamentosSet.add(c.departamento.trim());
            }
        });

        const corretoresFormatados = Array.from(mapNomes.keys())
          .sort()
          .map((nome, index) => ({
            id: index + 100,
            name: nome,
            avatar: mapNomes.get(nome)
          }));

        setListaCorretores(corretoresFormatados);
        setTeams(Array.from(departamentosSet).sort()); // Define as opções do filtro de equipe

      } catch (error) {
        console.error("Erro ao carregar lista de corretores e equipes:", error);
      }
    };
    fetchBrokersAndTeams();
  }, []);

  // --- FUNÇÃO DE BUSCA COMPLEXA ---
  const fetchLeads = useCallback(async () => {
    setIsLoading(true)
    try {
      // 1. Configuração do Contexto
      const isPmw = !filters.city || filters.city === "Palmas"
      const currentPrefix = isPmw ? "pmw" : "aux"

      const tableInteracao = isPmw ? "interacao_pmw" : "interacao_aux"
      const tableAtendimento = isPmw ? "atendimento_pmw" : "atendimento_aux"
      const tableLead = isPmw ? "lead_pmw" : "lead_aux"
      const tableCarrinho = isPmw ? "imovel_carrinho_pmw" : "imovel_carrinho_aux"
      const tableImovel = isPmw ? "imovel_pmw" : "imovel_aux"
      const tableCorretores = isPmw ? "corretores_pmw" : "corretores_aux" 
      
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
        
        if (error) {
            console.error("Erro na query Supabase:", error);
            throw error;
        }
        
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
      // ETAPA 1.5: Busca Dados dos Corretores (Avatar e Departamento)
      // ---------------------------------------------------------
      const uniqueBrokerNames = Array.from(new Set(
        allAtendimentos
          .map((a: any) => a.corretor)
          .filter((name: any) => name && typeof name === 'string')
      )) as string[];

      let brokerAvatarMap: Record<string, string> = {} 
      let brokerDeptMap: Record<string, string> = {} // Mapa para armazenar departamento por nome

      if (uniqueBrokerNames.length > 0) {
        const { data: brokersData, error: errBrokers } = await supabase
          .from(tableCorretores)
          .select('nome, imagem_url, departamento')
          .in('nome', uniqueBrokerNames)

        if (!errBrokers && brokersData) {
          brokersData.forEach((broker: any) => {
            if (broker.nome) {
                if (broker.imagem_url) brokerAvatarMap[broker.nome] = broker.imagem_url
                // Armazena o departamento limpo (trim) para facilitar comparação
                if (broker.departamento) brokerDeptMap[broker.nome] = broker.departamento.trim()
            }
          })
        }
      }

      // ---------------------------------------------------------
      // ETAPA 2: Busca Imóvel no Carrinho
      // ---------------------------------------------------------
      const loadedCodigos = itemsWithSafeIds.map(a => a.codigo).filter(Boolean)
      let imovelDetailsMap: Record<string, { codeImovel: string, url: string, valor: number, address: string }> = {}

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
               const dadosPorImovel: Record<string, { codeImovel: string, url: string, valor: number, address: string }> = {}
               
               imoveisData.forEach((im: any) => {
                 const valorLimpo = normalizeCurrency(im.valor);
                 const partesEndereco = [
                    im.endereco,
                    im.cidade ? `${im.cidade}/${im.estado || ''}` : null
                 ].filter(Boolean);
                 const enderecoCompleto = partesEndereco.join(" - ") || "Endereço não informado";

                 dadosPorImovel[im.codigo] = {
                   codeImovel: im.codigo,
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
      let salesDataMap = new Map<string, { visible: boolean, valorVenda: number }>();

      if (itemsWithSafeIds.length > 0) {
        const idsToVerify = itemsWithSafeIds.map(item => `${currentPrefix}_${item.safeId}`)

        const verifyBatchSize = 1000;
        for (let i = 0; i < idsToVerify.length; i += verifyBatchSize) {
            const chunk = idsToVerify.slice(i, i + verifyBatchSize);
            const { data: vendasMatches, error: errVendas } = await supabase
                .from('vendas')
                .select('id, valor_venda') // Buscamos o valor lançado
                .in('id', chunk)
            
            if (!errVendas && vendasMatches) {
                vendasMatches.forEach((match: any) => {
                    salesDataMap.set(match.id, {
                      visible: true,
                      valorVenda: match.valor_venda || 0
                    });
                })
            }
        }
      }

      // ---------------------------------------------------------
      // ETAPA 4: Busca TIMELINE
      // ---------------------------------------------------------
      let interactionsMap: Record<string, any[]> = {}

      const codigosParaBuscar = itemsWithSafeIds
        .map(i => i.codigo)
        .filter(c => c !== null && c !== undefined && c !== "");

      if (codigosParaBuscar.length > 0) {
        const interBatchSize = 1000;
        for (let i = 0; i < codigosParaBuscar.length; i += interBatchSize) {
           const chunk = codigosParaBuscar.slice(i, i + interBatchSize);
           const { data: interacoes, error: errInter } = await supabase
             .from(tableInteracao)
             .select('*') 
             .in('atendimento_codigo', chunk) 
             .order('datahora', { ascending: false }) 

           if (!errInter && interacoes) {
             interacoes.forEach((int: any) => {
               const key = int.atendimento_codigo;
               if (!interactionsMap[key]) interactionsMap[key] = []
               
               let dataFormatada = "Data N/A";
               if (int.datahora) {
                   const dateObj = new Date(int.datahora);
                   if (!isNaN(dateObj.getTime())) {
                       dataFormatada = dateObj.toLocaleDateString('pt-BR');
                   } else {
                       dataFormatada = int.datahora;
                   }
               }

               interactionsMap[key].push({
                 date: dataFormatada,
                 action: int.tipo || "Interação",
                 user: int.usuario || int.responsavel || "Sistema",
                 desc: int.descricao || int.texto || int.obs || int.mensagem || "", 
                 type: "action" 
               })
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
        const saleInfo = salesDataMap.get(fullIdToCheck); // Obtém os dados da venda
        const isOnDash = salesDataMap.has(fullIdToCheck);
        
        const details = imovelDetailsMap[item.codigo] || { url: null, valor: 0, address: "Endereço Pendente" }
        const resolvedImage = details.url || "https://app.imoview.com.br//Front/img/house1.png"
        const resolvedValue = details.valor || 0
        const resolvedAddress = details.address
        const resolvedCodeImovel = details.codeImovel || "----"

        const brokerName = item.corretor || "Corretor Desconhecido";
        const brokerAvatar = brokerAvatarMap[brokerName] 
          || `https://static.vecteezy.com/ti/vetor-gratis/p1/15934676-icone-de-perfil-de-imagem-icone-masculino-humanos-ou-pessoas-assinam-e-simbolizam-vetor.jpg`;
        
        // Define a equipe com base no departamento do corretor mapeado
        // Prioridade: Mapa (tabela corretores) -> Item direto (tabela atendimento) -> Fallback
        const teamName = brokerDeptMap[brokerName] || (item.equipe ? item.equipe.trim() : "Sem Equipe");

        const resolvedHistory = interactionsMap[item.codigo] || [
          { 
            date: new Date().toLocaleDateString("pt-BR"), 
            action: "Importado", 
            user: "Sistema", 
            desc: "Sem interações registradas no momento.", 
            type: "system" 
          }
        ];

        const rawPhase = item.etapa || item.fase || item.situacao;
        const matchedPhase = PHASES.find(p => p.label === rawPhase) || PHASES[0];

        const rawDate = item.created_at || item.data_cadastro || new Date().toISOString();
        const formattedDate = new Date(rawDate).toLocaleDateString("pt-BR");


        return {
          id: item.safeId, 
          sourceTable: isPmw ? "atendimento_pmw" : "atendimento_aux",
          
          clientName: clientName,
          clientAvatar: linkedLead.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(clientName)}&background=0D8ABC&color=fff&bold=true`,

          history: resolvedHistory,
          
          broker: {
            id: 0, 
            name: brokerName,
            avatar: brokerAvatar
          },

          phase: matchedPhase, 
          team: teamName, // Agora contém o departamento correto
          city: filters.city || (isPmw ? "Palmas" : "Outra"),
          purpose: item.finalidade || "Indefinido",
          status: item.situacao || "Novo",
          
          propertyTitle: item.codigo ? `Atendimento: ${item.codigo}` : "Imóvel sem código",
          propertyAddress: resolvedAddress,
          propertyLocation: resolvedCodeImovel || "----", 
          value: resolvedValue, 
          image: resolvedImage, 
          
          updatedAt: new Date().toLocaleDateString("pt-BR"),
          lastUpdateISO: new Date().toISOString(),
          
          leadData: {
            email: linkedLead.email || "",
            phone: linkedLead.telefone1 || "",
            origin: item.midia || "Desconhecido",
            createdAt: formattedDate
          },
          
          raw_codigo: item.codigo,
          raw_midia: item.midia,
          
          visibleOnDashboard: !!saleInfo, 
          valueLaunched: saleInfo?.valorVenda || 0, // Novo campo com o valor do dash
        }
      })

      setLeadsData(mappedLeads)

    } catch (error: any) {
      console.error("Erro ao buscar leads:", error.message || error)
      toast({ title: "Erro", description: "Falha ao carregar atendimentos: " + (error.message || "Erro desconhecido"), variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [filters.city, filters.status, filters.purpose, toast])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // --- FILTROS (Lógica Client-Side) ---
  const filteredLeads = useMemo(() => {
    return leadsData.filter(lead => {
      // 1. Busca por Texto
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesName = lead.clientName.toLowerCase().includes(searchLower)
        const matchesId = lead.id.toString().includes(searchLower)
        const matchesBroker = lead.broker.name.toLowerCase().includes(searchLower)
        if (!matchesName && !matchesId && !matchesBroker) return false
      }

      // 2. Filtro por Corretor
      if (filters.brokerId) {
        const selectedBroker = listaCorretores.find(b => b.id.toString() === filters.brokerId.toString())
        if (selectedBroker && lead.broker.name !== selectedBroker.name) return false
      }

      // 3. Filtro por Equipe (Departamento)
      if (filters.team) {
         // Compara o departamento do lead (obtido do corretor) com o filtro selecionado
         if (lead.team !== filters.team) return false;
      }

      // 4. Filtro por Fase
      if (filters.phase) {
         if (lead.phase.id.toString() !== filters.phase.toString()) return false;
      }

      // 5. Filtro por Data
      if (filters.dateStart || filters.dateEnd) {
        const leadDate = parseDateBr(lead.leadData.createdAt);
        if (leadDate) {
           if (filters.dateStart) {
             const startDate = new Date(filters.dateStart);
             startDate.setHours(0,0,0,0);
             if (leadDate < startDate) return false;
           }
           if (filters.dateEnd) {
             const endDate = new Date(filters.dateEnd);
             endDate.setHours(23,59,59,999);
             if (leadDate > endDate) return false;
           }
        }
      }

      return true
    })
  }, [filters, leadsData, listaCorretores])

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage)
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  
  const stats = useMemo(() => {
    return {
      total: filteredLeads.length,
      negotiation: filteredLeads.filter(l => l.status === "Negócio realizado").length,
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
          codigo_imovel: lead.propertyLocation,
          finalidade: lead.purpose,
          situacao: lead.status, 
          midia: lead.raw_midia,
          nome_cliente: data.clientName,
          valor_venda: data.valor_venda,
          data_venda: data.data_venda,
          comissao: data.comissao,
          obs_venda: data.obs_venda,
          status_dashboard: data.status_dashboard ? "Visível" : "Oculto",
          imagem_corretor: lead.broker.avatar,
          lista_imoveis: data.lista_imoveis,
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

  // console.log("Rederizando leads:", leadsData)

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
            {/* Botão Modificado para Atualizar Supabase */}
            <button 
              onClick={handleUpdateSupabase}
              disabled={isUpdating}
              className={`bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition shadow-sm shadow-primary/20 ${isUpdating ? "opacity-80 cursor-wait" : ""}`}
            >
              {isUpdating ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <RefreshCw size={18} />
              )}
              <span className="hidden sm:inline">
                {isUpdating ? "Atualizando..." : "Atualizar Supabase"} 
              </span>
            </button>
          </header>

          <div className="flex-1 overflow-y-auto bg-background p-4 lg:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Total na Lista" value={stats.total} icon={Users} trend="Atual" color="bg-primary" />
              <StatCard title="Em Negociacao" value={stats.negotiation} icon={Briefcase} trend="Funil" color="bg-amber-500" />
              <StatCard title="Valor Potencial" value={formatCompact(stats.volume)} icon={DollarSign} trend="R$" color="bg-emerald-500" />
            </div>

            <Filters 
              filters={filters} 
              onFilterChange={handleFilterChange} 
              onClearFilters={handleClearFilters} 
              teams={teams} 
              cities={CITIES} 
              brokers={listaCorretores}
              phases={PHASES} 
              statuses={STATUS_OPTIONS} 
              purposes={PURPOSES} 
            />
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
                    // Se o LeadCard for um componente customizado que você criou,
                    // ele agora terá acesso a lead.valueLaunched
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Search size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">Nenhum atendimento encontrado.</p>
                <p className="text-sm">Tente mudar a Cidade ou limpar os filtros.</p>
                <Button variant="outline" className="mt-4 bg-transparent" onClick={handleClearFilters}>Limpar filtros</Button>
              </div>
            )}

            {filteredLeads.length > 0 && totalPages > 1 && (
              <div className="py-8"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /></div>
            )}
            <footer className="border-t border-border pt-6 pb-8 text-center"><p className="text-sm text-muted-foreground">2026 - <span className="font-semibold text-foreground">Central63</span></p></footer>
          </div>
        </main>

        <DetailsDrawer 
          // Exibe o lead apenas se o modal de edição estiver fechado
          lead={!editModalOpen ? selectedLead : null} 
          onClose={() => setSelectedLead(null)} 
          // Use a função formatCurrency que já está definida no seu componente (linha 548)
          formatCurrency={formatCurrency} 
          // Use a lógica para abrir o modal de edição corretamente
          onEditClick={() => { 
            setModalMode("edit"); 
            setEditModalOpen(true); 
          }} 
        />

        <EditLeadModal 
          lead={selectedLead} 
          isOpen={editModalOpen} 
          onClose={() => { 
            setEditModalOpen(false); 
            setModalMode("edit");
            setSelectedLead(null); // Limpa o lead ao fechar para garantir que o Drawer não "brote" depois
          }} 
          onSave={handleSaveData} 
          mode={modalMode} 
        />
      </div>
    </Suspense>
  )
}