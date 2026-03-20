"use client"

import { useState, useMemo, useEffect, Suspense, useCallback } from "react"
import { Building2, RefreshCw, Menu, MapPin, LayoutGrid, Map as MapIcon, ChevronLeft, Search, X } from "lucide-react"
import { Sidebar } from "@/components/central63/sidebar"
import { StatCard } from "@/components/central63/services/stat-card"
import { PropertyFilters } from "@/components/central63/property-filters"
import { PropertyCard } from "@/components/central63/property-card"
import { Pagination } from "@/components/central63/services/pagination"
import { FeaturedPropertiesTicker } from "@/components/central63/homes/featured-properties-ticker"
import { PropertyDetailsContent } from "@/components/central63/property-details-content"
import { PropertyMap } from "@/components/central63/property-map"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Loading from "@/app/loading"
import { cn } from "@/lib/utils"

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
  const [allPropertiesForMap, setAllPropertiesForMap] = useState<any[]>([])
  const [totalItems, setTotalItems] = useState(0) 
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [featuredCodes, setFeaturedCodes] = useState<string[]>([])
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
    onlyFeatured: false
  })

  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search)
    }, 500)
    return () => clearTimeout(timer)
  }, [filters.search])

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

  const fetchProperties = useCallback(async () => {
    setIsLoading(true)
    try {
      const isPmw = !filters.city || filters.city === "Palmas"
      const tableName = isPmw ? "imovel_pmw" : "imovel_aux"

      // Buscar códigos em destaque
      const { data: featuredData } = await supabase
        .from('featured_properties')
        .select('property_code')
        .eq('city', filters.city || 'Palmas')
      
      const currentFeaturedCodes = featuredData?.map(f => f.property_code) || []
      setFeaturedCodes(currentFeaturedCodes)

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from(tableName)
        .select('codigo, urlfotoprincipal, valor, endereco, bairro, cidade, estado, situacao, areaprincipal, valor_m2, descricao, tipo, created_at, latitude, longitude', { count: 'exact' })

      if (debouncedSearch) {
        query = query.or(`codigo.ilike.%${debouncedSearch}%,endereco.ilike.%${debouncedSearch}%,bairro.ilike.%${debouncedSearch}%`);
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
      
      // FILTRO CORRIGIDO: Se o switch estiver ativo, filtramos pelos códigos.
      // Se não houver códigos destacados, forçamos um resultado vazio.
      if (filters.onlyFeatured) {
        if (currentFeaturedCodes.length > 0) {
          query = query.in('codigo', currentFeaturedCodes);
        } else {
          // Garante que não retorne nada se não houver destaques marcados
          query = query.eq('codigo', '00000000-0000-0000-0000-000000000000'); 
        }
      }
      
      const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const mapItem = (item: any) => ({
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
        createdAt: item.created_at,
        latitude: item.latitude ? parseFloat(item.latitude) : null,
        longitude: item.longitude ? parseFloat(item.longitude) : null
      })

      setPropertiesData((data || []).map(mapItem))
      if (count !== null) setTotalItems(count)

      // Busca para o mapa (Carteira Completa sob filtros)
      let mapQuery = supabase
        .from(tableName)
        .select('codigo, urlfotoprincipal, valor, endereco, bairro, cidade, estado, situacao, areaprincipal, valor_m2, descricao, tipo, created_at, latitude, longitude')
        .limit(300)

      if (debouncedSearch) mapQuery = mapQuery.or(`codigo.ilike.%${debouncedSearch}%,endereco.ilike.%${debouncedSearch}%,bairro.ilike.%${debouncedSearch}%`);
      if (filters.status !== "Todos") mapQuery = mapQuery.eq('situacao', filters.status);
      if (filters.type !== "Todos") mapQuery = mapQuery.eq('tipo', filters.type);
      if (filters.neighborhood) mapQuery = mapQuery.ilike('bairro', `%${filters.neighborhood}%`);

      const { data: mapData } = await mapQuery.order('created_at', { ascending: false });
      setAllPropertiesForMap((mapData || []).map(mapItem))

    } catch (error: any) {
      console.error("Erro ao buscar imóveis:", error)
      toast({ title: "Erro", description: "Falha ao carregar imóveis.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [filters.city, filters.status, filters.type, filters.neighborhood, filters.onlyFeatured, debouncedSearch, currentPage, itemsPerPage, toast])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  const formatCompact = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(value)
  
  const handleFilterChange = (key: string, value: any) => { 
    setFilters(prev => ({ ...prev, [key]: value })); 
    setCurrentPage(1); 
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <header className="w-full bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-sm flex-shrink-0 z-20">
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 text-muted-foreground hover:bg-accent rounded-lg" onClick={() => setSidebarOpen(true)}><Menu /></button>
              <Building2 className="text-primary hidden lg:block" />
              <h2 className="text-2xl font-bold text-foreground tracking-tight">
                {selectedProperty ? "Detalhes do Imóvel" : "Carteira de Imóveis"}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {selectedProperty && (
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl h-9 gap-2 font-bold hover:bg-accent transition-all"
                    onClick={() => setSelectedProperty(null)}
                >
                    <ChevronLeft size={16} /> Voltar para Lista
                </Button>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-hidden relative flex flex-col bg-background">
            {selectedProperty ? (
                /* VIEW: DETALHES COM MAPA LATERAL ESQUERDO */
                <div className="flex-1 flex overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="hidden lg:block flex-1 border-r relative bg-muted h-full">
                        <PropertyMap 
                            properties={[selectedProperty]}
                            selectedProperty={selectedProperty}
                            center={[selectedProperty.latitude || -10.18, selectedProperty.longitude || -48.33]}
                            zoom={16}
                            formatCurrency={formatCurrency}
                            showPopups={false}
                            className="w-full h-full"
                            featuredCodes={featuredCodes}
                        />
                        <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur shadow-xl p-4 rounded-2xl border flex items-center gap-3">
                             <div className="p-2 bg-primary/10 rounded-lg"><MapPin className="text-primary" size={16}/></div>
                             <div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Localização Exata</p>
                                <p className="text-xs font-bold">{selectedProperty.neighborhood}, {selectedProperty.city}</p>
                             </div>
                        </div>
                    </div>
                    <div className="w-full lg:w-[500px] xl:w-[600px] h-full shadow-2xl z-10 border-l border-border/50">
                        <PropertyDetailsContent 
                            property={selectedProperty} 
                            formatCurrency={formatCurrency}
                            onClose={() => setSelectedProperty(null)}
                            isInline={true}
                        />
                    </div>
                </div>
            ) : (
                /* VIEW: LISTA + MAPA AO FUNDO */
                <div className="flex-1 overflow-y-auto bg-background custom-scrollbar">
                    <div className="p-4 lg:p-8 space-y-12 max-w-[1600px] mx-auto">
                        {/* Estatísticas */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatCard title="Imóveis Listados" value={totalItems} icon={Building2} trend="Atual" color="bg-blue-500" />
                            <StatCard title="VGV (Valor Geral da Tela)" value={formatCompact(propertiesData.reduce((acc, curr) => acc + curr.value, 0))} icon={RefreshCw} trend="Total" color="bg-emerald-500" />
                            <StatCard title="Ticket Médio (Tela)" value={formatCompact(propertiesData.length > 0 ? (propertiesData.reduce((acc, curr) => acc + curr.value, 0) / propertiesData.length) : 0)} icon={MapPin} trend="Média" color="bg-purple-500" />
                        </div>

                        {/* Letreiro de Destaques */}
                        <FeaturedPropertiesTicker 
                            onPropertyClick={setSelectedProperty}
                            formatCurrency={formatCurrency}
                        />

                        {/* Filtros */}
                        <PropertyFilters 
                            filters={filters} 
                            onFilterChange={handleFilterChange} 
                            cities={CITIES}
                            types={PROPERTY_TYPES}
                        />

                        {/* Grade de Imóveis */}
                        <div className="space-y-6">
                            {isLoading ? (
                                <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"/></div>
                            ) : propertiesData.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {propertiesData.map(prop => (
                                            <PropertyCard 
                                                key={`${prop.code}`}
                                                property={prop}
                                                formatCurrency={formatCurrency}
                                                onClick={() => setSelectedProperty(prop)}
                                                isFeatured={featuredCodes.includes(prop.code)}
                                            />
                                        ))}
                                    </div>
                                    {totalItems > 0 && Math.ceil(totalItems / itemsPerPage) > 1 && (
                                        <div className="pt-4">
                                            <Pagination currentPage={currentPage} totalPages={Math.ceil(totalItems / itemsPerPage)} onPageChange={setCurrentPage} />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-3xl">Nenhum imóvel encontrado.</div>
                            )}
                        </div>

                        {/* SEÇÃO DO MAPA (NO FIM DA PÁGINA) */}
                        <div className="pt-12 border-t border-border/50">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-primary/10 rounded-xl">
                                        <MapIcon className="text-primary" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold tracking-tight">Mapa de Localização</h3>
                                        <p className="text-xs text-muted-foreground">Visualize a distribuição geográfica de {allPropertiesForMap.length} imóveis</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="h-8 px-4 rounded-xl border-primary/20 text-primary font-black uppercase text-[10px] tracking-widest">
                                    Carteira Ativa
                                </Badge>
                            </div>

                            <div className="h-[350px] lg:h-[450px] rounded-[2.5rem] overflow-hidden border border-border/50 shadow-2xl relative group">
                                <PropertyMap 
                                    properties={allPropertiesForMap}
                                    formatCurrency={formatCurrency}
                                    onPropertyClick={setSelectedProperty}
                                    className="w-full h-full"
                                    featuredCodes={featuredCodes}
                                />
                                
                                {/* Legenda Flutuante (dentro do mapa) */}
                                <div className="absolute bottom-6 left-6 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl p-5 rounded-3xl shadow-2xl border border-white/20 z-[1000] hidden md:block">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-4">Classificação por Cores</h5>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                        <div className="flex items-center gap-3 text-xs font-bold text-foreground/80">
                                            <div className="w-3.5 h-3.5 rounded-full bg-blue-500 ring-4 ring-blue-500/10" /> Casas
                                        </div>
                                        <div className="flex items-center gap-3 text-xs font-bold text-foreground/80">
                                            <div className="w-3.5 h-3.5 rounded-full bg-red-500 ring-4 ring-red-500/10" /> Prédios
                                        </div>
                                        <div className="flex items-center gap-3 text-xs font-bold text-foreground/80">
                                            <div className="w-3.5 h-3.5 rounded-full bg-green-500 ring-4 ring-green-500/10" /> Lotes
                                        </div>
                                        <div className="flex items-center gap-3 text-xs font-bold text-foreground/80">
                                            <div className="w-3.5 h-3.5 rounded-full bg-orange-500 ring-4 ring-orange-500/10" /> Comercial
                                        </div>
                                        <div className="flex items-center gap-3 text-xs font-bold text-foreground/80">
                                            <div className="w-3.5 h-3.5 rounded-full bg-[#8B4513] ring-4 ring-[#8B4513]/10" /> Rural
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
          </div>
        </main>
      </div>
    </Suspense>
  )
}
