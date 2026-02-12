"use client"

import { useState, useMemo, useEffect, Suspense, useCallback } from "react"
import { Building2, Search, RefreshCw, Loader2, Menu, MapPin } from "lucide-react"
import { Sidebar } from "@/components/central63/sidebar"
import { StatCard } from "@/components/central63/stat-card"
import { PropertyFilters } from "@/components/central63/property-filters"
import { PropertyCard } from "@/components/central63/property-card"
import { Pagination } from "@/components/central63/pagination"
import { PropertyDetailsDrawer } from "@/components/central63/property-details-drawer"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import Loading from "@/app/loading"

// --- CONSTANTES ---
const CITIES = ["Palmas", "Araguaina"]
// Adapte os tipos conforme o que você tem no banco, adicionei os mais comuns
const PROPERTY_TYPES = ["Casa", "Apartamento", "Lote", "Comercial", "Rural"] 

export default function ImoveisPage() {
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("imoveis") // Nova tab ativa
  
  // Estados de Dados
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null)
  const [propertiesData, setPropertiesData] = useState<any[]>([]) 
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12 // Mostra mais imóveis por página (grid 4x3)

  // Filtros
  const [filters, setFilters] = useState({
    city: "Palmas",
    type: "Todos",
    minPrice: "",
    maxPrice: "",
    neighborhood: "", // Bairro
    status: "Vago/Disponível", // Default conforme seu pedido
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

  // --- BUSCA DE IMÓVEIS ---
  const fetchProperties = useCallback(async () => {
    setIsLoading(true)
    try {
      const isPmw = !filters.city || filters.city === "Palmas"
      const tableName = isPmw ? "imovel_pmw" : "imovel_aux"

      // Busca Otimizada (Loop para pegar tudo, igual ao Atendimentos)
      let allProperties: any[] = [];
      let hasMore = true;
      let from = 0;
      const batchSize = 1000;

      while (hasMore) {
        // Selecionando colunas específicas para performance
        let query = supabase
          .from(tableName)
          .select('codigo, urlfotoprincipal, valor, endereco, bairro, cidade, estado, situacao, areaprincipal, valor_m2, descricao, tipo, created_at')
          .range(from, from + batchSize - 1);

        if (filters.status && filters.status !== "Todos") {
             query = query.eq('situacao', filters.status)
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allProperties = [...allProperties, ...data];
          from += batchSize;
          if (data.length < batchSize) hasMore = false;
        } else {
          hasMore = false;
        }
      }

      // Mapeamento
      const mappedProps = allProperties.map((item: any) => ({
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
        description: item.descricao,
        type: item.tipo || "Imóvel",
        createdAt: item.created_at
      }))

      setPropertiesData(mappedProps)

    } catch (error: any) {
      console.error("Erro ao buscar imóveis:", error)
      toast({ title: "Erro", description: "Falha ao carregar imóveis.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [filters.city, filters.status, toast])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  // --- FILTROS (Client-Side) ---
  const filteredProperties = useMemo(() => {
    return propertiesData.filter(prop => {
      // 1. Busca Texto (Código ou Endereço)
      if (filters.search) {
        const s = filters.search.toLowerCase()
        const matchCode = prop.code.toString().toLowerCase().includes(s)
        const matchAddress = prop.address.toLowerCase().includes(s)
        const matchNeighborhood = prop.neighborhood.toLowerCase().includes(s)
        if (!matchCode && !matchAddress && !matchNeighborhood) return false
      }

      // 2. Tipo
      if (filters.type !== "Todos" && prop.type !== filters.type) return false

      // 3. Bairro (Texto exato ou parcial)
      if (filters.neighborhood && !prop.neighborhood.toLowerCase().includes(filters.neighborhood.toLowerCase())) return false

      // 4. Faixa de Preço
      if (filters.minPrice) {
          if (prop.value < parseFloat(filters.minPrice)) return false
      }
      if (filters.maxPrice) {
          if (prop.value > parseFloat(filters.maxPrice)) return false
      }

      return true
    })
  }, [filters, propertiesData])

  // Paginação
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage)
  const paginatedItems = filteredProperties.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  
  // Stats Calculados
  const stats = useMemo(() => {
    const totalVal = filteredProperties.reduce((acc, curr) => acc + (curr.value || 0), 0)
    return {
      count: filteredProperties.length,
      totalValue: totalVal,
      avgPrice: filteredProperties.length > 0 ? totalVal / filteredProperties.length : 0
    }
  }, [filteredProperties])

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
              <Building2 className="text-primary" />
              <h2 className="text-2xl font-bold text-foreground tracking-tight">Carteira de Imóveis</h2>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-background p-4 lg:p-8 space-y-6">
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Imóveis Listados" value={stats.count} icon={Building2} trend="Atual" color="bg-blue-500" />
              <StatCard title="VGV (Valor Geral)" value={formatCompact(stats.totalValue)} icon={RefreshCw} trend="Total" color="bg-emerald-500" />
              <StatCard title="Ticket Médio" value={formatCompact(stats.avgPrice)} icon={MapPin} trend="Média" color="bg-purple-500" />
            </div>

            {/* Barra de Filtros */}
            <PropertyFilters 
                filters={filters} 
                onFilterChange={handleFilterChange} 
                cities={CITIES}
                types={PROPERTY_TYPES}
            />

            {/* Grid de Resultados */}
            {isLoading ? (
               <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"/></div>
            ) : filteredProperties.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
                {paginatedItems.map(prop => (
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

            {filteredProperties.length > 0 && totalPages > 1 && (
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