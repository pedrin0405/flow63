"use client"

import { useState, useMemo, useEffect, Suspense, useCallback } from "react"
import { Building2, Search, RefreshCw, Loader2, Menu, MapPin } from "lucide-react"
import { Sidebar } from "@/components/central63/sidebar"
import { StatCard } from "@/components/central63/services/stat-card"
import { PropertyFilters } from "@/components/central63/property-filters"
import { PropertyCard } from "@/components/central63/property-card"
import { Pagination } from "@/components/central63/pagination"
import { PropertyDetailsDrawer } from "@/components/central63/property-details-drawer"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import Loading from "@/app/loading"

// --- CONSTANTES ---
const CITIES = ["Palmas", "Araguaina"]
const PROPERTY_TYPES = ["Casa", "Apartamento", "Lote", "Comercial", "Rural"] 

export default function ImoveisPage() {
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("imoveis")
  
  // Estados de Dados
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null)
  const [propertiesData, setPropertiesData] = useState<any[]>([]) 
  const [totalItems, setTotalItems] = useState(0) // NOVO: Armazena o total real de imóveis no banco
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12 

  // Filtros
  const [filters, setFilters] = useState({
    city: "Palmas",
    type: "Todos",
    minPrice: "",
    maxPrice: "",
    neighborhood: "", 
    status: "Vago/Disponível", 
    search: "",
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

  // --- BUSCA DE IMÓVEIS (AGORA OTIMIZADA NO SERVIDOR) ---
  const fetchProperties = useCallback(async () => {
    setIsLoading(true)
    try {
      const isPmw = !filters.city || filters.city === "Palmas"
      const tableName = isPmw ? "imovel_pmw" : "imovel_aux"

      // Calcula a paginação exata para o Supabase
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      // Inicia a query pedindo apenas as colunas necessárias e a contagem total (exact)
      let query = supabase
        .from(tableName)
        .select('codigo, urlfotoprincipal, valor, endereco, bairro, cidade, estado, situacao, areaprincipal, valor_m2, descricao, tipo, created_at', { count: 'exact' })

      // Aplica os filtros DIRETAMENTE no banco de dados (Server-side)
      if (filters.search) {
        query = query.or(`endereco.ilike.%${filters.search}%,bairro.ilike.%${filters.search}%`);
      }
      if (filters.status !== "Todos") {
        query = query.eq('situacao', filters.status);
      }
      if (filters.type !== "Todos") {
        query = query.eq('tipo', filters.type);
      }
      if (filters.neighborhood) {
        query = query.ilike('bairro', `%${filters.neighborhood}%`);
      }
      
      // Executa a query limitando a apenas 12 resultados
      const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Mapeamento dos 12 resultados retornados
      const mappedProps = (data || []).map((item: any) => ({
        code: item.codigo || "S/C",
        image: item.urlfotoprincipal || "https://app.imoview.com.br//Front/img/house1.png",
        value: normalizeCurrency(item.valor),
        address: item.endereco || "Endereço não informado",
        neighborhood: item.bairro || "Bairro não inf.",
        city: item.cidade,
        state: item.estado,
        status: item.situacao || "Indefinido",
        area: item.areaprincipal,
        pricePerM2: item.valor_m2,
        description: item.descricao, // Mantido para não quebrar o seu Drawer
        type: item.tipo || "Imóvel",
        createdAt: item.created_at
      }))

      setPropertiesData(mappedProps)
      if (count !== null) setTotalItems(count)

    } catch (error: any) {
      console.error("Erro ao buscar imóveis:", error)
      toast({ title: "Erro", description: "Falha ao carregar imóveis.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [filters, currentPage, itemsPerPage, toast]) // currentPage adicionado nas dependências

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  // --- CÁLCULOS GERAIS ---
  // A paginação agora é baseada no Total Real do banco, não no array baixado
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  
  // Stats Calculados
  const stats = useMemo(() => {
    // Como agora só baixamos 12 imóveis, o VGV exibido será o da página atual. 
    // Isso economiza 100% da sua banda de Egress.
    const totalVal = propertiesData.reduce((acc, curr) => acc + (curr.value || 0), 0)
    return {
      count: totalItems, // Mostra o número real de imóveis do banco
      totalValue: totalVal, 
      avgPrice: propertiesData.length > 0 ? totalVal / propertiesData.length : 0
    }
  }, [propertiesData, totalItems])

  // Formatadores
  const handleFilterChange = (key: string, value: string) => { setFilters(prev => ({ ...prev, [key]: value })); setCurrentPage(1) }
  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  const formatCompact = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(value)

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <header className="w-full bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-sm flex-shrink-0 z-20">
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 text-muted-foreground hover:bg-accent rounded-lg" onClick={() => setSidebarOpen(true)}><Menu /></button>
              <Building2 className="text-primary hidden lg:block" />
              <h2 className="text-2xl font-bold text-foreground tracking-tight">Carteira de Imóveis</h2>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-background p-4 lg:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Imóveis Listados" value={stats.count} icon={Building2} trend="Atual" color="bg-blue-500" />
              <StatCard title="VGV (Valor Geral da Tela)" value={formatCompact(stats.totalValue)} icon={RefreshCw} trend="Total" color="bg-emerald-500" />
              <StatCard title="Ticket Médio (Tela)" value={formatCompact(stats.avgPrice)} icon={MapPin} trend="Média" color="bg-purple-500" />
            </div>

            <PropertyFilters 
                filters={filters} 
                onFilterChange={handleFilterChange} 
                cities={CITIES}
                types={PROPERTY_TYPES}
            />

            {isLoading ? (
               <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"/></div>
            ) : propertiesData.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
                {/* Repare que não usamos mais paginatedItems, pois o array propertiesData já tem apenas os 12 da página */}
                {propertiesData.map(prop => (
                  <PropertyCard 
                    key={`${prop.code}`}
                    property={prop}
                    formatCurrency={formatCurrency}
                    onClick={() => setSelectedProperty(prop)}
                  />
                ))}
              </div>
            ) : (
               <div className="text-center py-20 text-muted-foreground">Nenhum imóvel encontrado.</div>
            )}

            {totalItems > 0 && totalPages > 1 && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            )}
          </div>
        </main>

        <PropertyDetailsDrawer 
            property={selectedProperty} 
            onClose={() => setSelectedProperty(null)} 
            formatCurrency={formatCurrency} 
        />
      </div>
    </Suspense>
  )
}