"use client"

import { useState, useMemo, useEffect, Suspense, useCallback, useRef } from "react"
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
const CITY_MAP_CENTERS: Record<string, [number, number]> = {
  palmas: [-10.184, -48.333],
  araguaina: [-7.192, -48.207],
  'araguaína': [-7.192, -48.207],
}

export default function ImoveisPage() {
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("imoveis")
  
  // Estados de Dados
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null)
  const [mapPreviewProperty, setMapPreviewProperty] = useState<any | null>(null)
  const [propertiesData, setPropertiesData] = useState<any[]>([]) 
  const [allPropertiesForMap, setAllPropertiesForMap] = useState<any[]>([])
  const [selectedPropertyCode, setSelectedPropertyCode] = useState<string | null>(null)
  const [highlightedPropertyCode, setHighlightedPropertyCode] = useState<string | null>(null)
  const listScrollRef = useRef<HTMLDivElement | null>(null)
  const lastListScrollTopRef = useRef(0)
  const shouldRestoreScrollRef = useRef(false)

  const handleSelectProperty = (prop: any) => {
    if (listScrollRef.current) {
      lastListScrollTopRef.current = listScrollRef.current.scrollTop
    }
    setMapPreviewProperty(null)
    setSelectedPropertyCode(String(prop.code))
    setSelectedProperty(prop)
  }

  const handleMapPropertyPreview = (prop: any) => {
    const code = String(prop.code)
    setMapPreviewProperty(prop)
    setSelectedPropertyCode(code)
    setHighlightedPropertyCode(code)

    const listContainer = listScrollRef.current
    if (listContainer) {
      requestAnimationFrame(() => {
        const safeCode = CSS?.escape ? CSS.escape(code) : code
        const selectedCard = listContainer.querySelector(`[data-property-code="${safeCode}"]`) as HTMLElement | null
        if (selectedCard) {
          selectedCard.scrollIntoView({ behavior: "smooth", block: "nearest" })
        }
      })
    }

    setTimeout(() => {
      setHighlightedPropertyCode((prev) => (prev === code ? null : prev))
    }, 1800)
  }

  const handleCloseProperty = () => {
    shouldRestoreScrollRef.current = true
    setSelectedProperty(null)
  }
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

  const selectedCityCenter = useMemo<[number, number]>(() => {
    const cityKey = String(filters.city || "Palmas").toLowerCase()
    return CITY_MAP_CENTERS[cityKey] || CITY_MAP_CENTERS.palmas
  }, [filters.city])

  const selectedCityZoom = useMemo(() => {
    const cityKey = String(filters.city || "Palmas").toLowerCase()
    return cityKey.includes("aragua") ? 12 : 13
  }, [filters.city])

  const featuredCodeSet = useMemo(() => new Set((featuredCodes || []).map((code: any) => String(code))), [featuredCodes])

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

  const normalizeCoordinate = (value: any): number | null => {
    if (value === null || value === undefined || value === "") return null
    if (typeof value === "number") return Number.isFinite(value) ? value : null

    const normalized = String(value).trim().replace(/\s+/g, "").replace(",", ".")
    const parsed = Number.parseFloat(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }

  const selectedPropertyCenter = useMemo<[number, number]>(() => {
    if (!selectedProperty) return selectedCityCenter

    return [
      normalizeCoordinate(selectedProperty.latitude) ?? -10.1837,
      normalizeCoordinate(selectedProperty.longitude) ?? -48.3337,
    ]
  }, [selectedProperty, selectedCityCenter])

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
      
      const currentFeaturedCodes = featuredData?.map(f => String(f.property_code)) || []
      setFeaturedCodes(currentFeaturedCodes)

      const featuredCodesAsNumber = currentFeaturedCodes
        .map((code: any) => Number(code))
        .filter((code: number) => Number.isFinite(code))

      if (filters.onlyFeatured && featuredCodesAsNumber.length === 0) {
        setPropertiesData([])
        setAllPropertiesForMap([])
        setTotalItems(0)
        setMapPreviewProperty(null)
        return
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from(tableName)
        .select('codigo, urlfotoprincipal, valor, endereco, bairro, cidade, estado, situacao, areaprincipal, valor_m2, descricao, tipo, created_at, latitude, longitude', { count: 'exact' })

      if (debouncedSearch) {
        const search = debouncedSearch.trim()
        const searchAsNumber = Number(search)
        const isNumericSearch = Number.isFinite(searchAsNumber)

        if (isNumericSearch) {
          query = query.eq('codigo', searchAsNumber)
        } else {
          query = query.or(`endereco.ilike.%${search}%,bairro.ilike.%${search}%`)
        }
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
        query = query.in('codigo', featuredCodesAsNumber);
      }
      
      const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const mapItem = (item: any) => ({
        code: String(item.codigo) || "S/C",
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
        latitude: normalizeCoordinate(item.latitude),
        longitude: normalizeCoordinate(item.longitude)
      })

      setPropertiesData((data || []).map(mapItem))
      if (count !== null) setTotalItems(count)

      // Busca para o mapa (Carteira Completa sob filtros)
      let mapQuery = supabase
        .from(tableName)
        .select('codigo, urlfotoprincipal, valor, endereco, bairro, cidade, estado, situacao, areaprincipal, valor_m2, descricao, tipo, created_at, latitude, longitude')
        .limit(300)

      if (debouncedSearch) {
        const search = debouncedSearch.trim()
        const searchAsNumber = Number(search)
        const isNumericSearch = Number.isFinite(searchAsNumber)

        if (isNumericSearch) {
          mapQuery = mapQuery.eq('codigo', searchAsNumber)
        } else {
          mapQuery = mapQuery.or(`endereco.ilike.%${search}%,bairro.ilike.%${search}%`)
        }
      }
      if (filters.status !== "Todos") mapQuery = mapQuery.eq('situacao', filters.status);
      if (filters.type !== "Todos") mapQuery = mapQuery.eq('tipo', filters.type);
      if (filters.neighborhood) mapQuery = mapQuery.ilike('bairro', `%${filters.neighborhood}%`);
      if (filters.onlyFeatured) mapQuery = mapQuery.in('codigo', featuredCodesAsNumber);

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

  useEffect(() => {
    if (selectedProperty || !shouldRestoreScrollRef.current) return

    requestAnimationFrame(() => {
      const listContainer = listScrollRef.current
      if (!listContainer) return

      listContainer.scrollTop = lastListScrollTopRef.current

      if (selectedPropertyCode) {
        const safeCode = CSS?.escape ? CSS.escape(selectedPropertyCode) : selectedPropertyCode
        const selectedCard = listContainer.querySelector(`[data-property-code="${safeCode}"]`) as HTMLElement | null
        if (selectedCard) {
          selectedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      }

      shouldRestoreScrollRef.current = false
    })
  }, [selectedProperty, selectedPropertyCode, currentPage, propertiesData.length])

  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  const formatCompact = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(value)
  
  const handleFilterChange = (key: string, value: any) => { 
    setFilters(prev => ({ ...prev, [key]: value })); 
    setCurrentPage(1); 
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans text-foreground relative">
        <div className="pointer-events-none absolute -top-32 right-[-120px] h-[340px] w-[340px] rounded-full bg-sky-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-[-120px] h-[320px] w-[320px] rounded-full bg-emerald-400/15 blur-3xl" />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 flex flex-col h-full overflow-hidden relative animate-in fade-in duration-700">
          <header className="h-20 shrink-0 px-6 lg:px-8 flex items-center justify-between z-20">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="lg:hidden rounded-xl bg-white/50 dark:bg-white/[0.02] border border-white/20" onClick={() => setSidebarOpen(true)}>
                <Menu size={22} />
              </Button>
              <div className="relative flex items-center gap-4 bg-white/60 dark:bg-white/[0.02] backdrop-blur-2xl border border-white/20 dark:border-white/[0.06] px-5 py-2.5 rounded-2xl shadow-sm">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
                <div className="h-10 w-10 bg-gradient-to-br from-primary/90 to-primary/60 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <Building2 className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-tight text-foreground uppercase">
                    {selectedProperty ? "Detalhes do Imovel" : "Carteira de Imoveis"}
                  </h2>
                  <p className="text-[9px] text-muted-foreground/60 font-black uppercase tracking-widest mt-0.5">
                    Inteligencia Comercial em Tempo Real
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedProperty && (
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl h-10 px-4 gap-2 font-black uppercase text-[10px] tracking-widest bg-white/60 dark:bg-white/[0.02] border-white/30 dark:border-white/[0.08] backdrop-blur-xl hover:bg-white dark:hover:bg-white/[0.05] transition-all"
                  onClick={handleCloseProperty}
                >
                    <ChevronLeft size={16} /> Voltar para Lista
                </Button>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-hidden relative flex flex-col">
            {selectedProperty ? (
                /* VIEW: DETALHES COM MAPA LATERAL ESQUERDO */
                <div className="flex-1 flex overflow-hidden p-6 lg:p-8 gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="hidden lg:block flex-1 relative rounded-[2rem] overflow-hidden border border-white/20 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-3xl shadow-2xl h-full">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent z-[1000]" />
                        <PropertyMap 
                            properties={[selectedProperty]}
                            selectedProperty={selectedProperty}
                            center={selectedPropertyCenter}
                            zoom={16}
                            formatCurrency={formatCurrency}
                            showPopups={false}
                            className="w-full h-full"
                            featuredCodes={featuredCodes}
                        />
                          <div className="absolute top-4 left-4 z-[1000] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-xl p-4 rounded-2xl border border-white/30 dark:border-white/[0.08] flex items-center gap-3">
                             <div className="p-2 bg-primary/10 rounded-lg"><MapPin className="text-primary" size={16}/></div>
                             <div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Localização Exata</p>
                                <p className="text-xs font-bold">{selectedProperty.neighborhood}, {selectedProperty.city}</p>
                             </div>
                        </div>
                    </div>
                        <div className="w-full lg:w-[500px] xl:w-[600px] h-full rounded-[2rem] overflow-hidden border border-white/20 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-3xl shadow-2xl z-10 relative">
                          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent z-[1000]" />
                        <PropertyDetailsContent 
                            property={selectedProperty} 
                            formatCurrency={formatCurrency}
                          onClose={handleCloseProperty}
                            isInline={true}
                        />
                    </div>
                </div>
            ) : (
                /* VIEW: LISTA + MAPA AO FUNDO */
              <div
                ref={listScrollRef}
                className="flex-1 overflow-y-auto custom-scrollbar"
                onScroll={(e) => {
                  lastListScrollTopRef.current = e.currentTarget.scrollTop
                }}
              >
                <div className="p-6 lg:p-8 space-y-8 max-w-[1650px] mx-auto">
                        {/* Estatísticas */}
                  <div className="relative rounded-[2rem] overflow-hidden border border-white/20 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-3xl shadow-2xl p-4 lg:p-5">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatCard title="Imóveis Listados" value={totalItems} icon={Building2} trend="Atual" color="bg-blue-500" />
                            <StatCard title="VGV (Valor Geral da Tela)" value={formatCompact(propertiesData.reduce((acc, curr) => acc + curr.value, 0))} icon={RefreshCw} trend="Total" color="bg-emerald-500" />
                            <StatCard title="Ticket Médio (Tela)" value={formatCompact(propertiesData.length > 0 ? (propertiesData.reduce((acc, curr) => acc + curr.value, 0) / propertiesData.length) : 0)} icon={MapPin} trend="Média" color="bg-purple-500" />
                    </div>
                        </div>

                        {/* Letreiro de Destaques */}
                  <div className="relative rounded-[2rem] overflow-hidden border border-white/20 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-3xl shadow-2xl p-4">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
                    <FeaturedPropertiesTicker 
                        onPropertyClick={handleSelectProperty}
                      formatCurrency={formatCurrency}
                    />
                  </div>

                        {/* Filtros */}
                  <div className="relative rounded-[2rem] overflow-hidden border border-white/20 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-3xl shadow-2xl p-4 lg:p-5">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
                    <PropertyFilters 
                      filters={filters} 
                      onFilterChange={handleFilterChange} 
                      cities={CITIES}
                      types={PROPERTY_TYPES}
                    />
                  </div>

                        {/* Grade de Imóveis */}
                  <div className="space-y-6 relative rounded-[2rem] overflow-hidden border border-white/20 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-3xl shadow-2xl p-4 lg:p-6">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
                            {isLoading ? (
                                <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"/></div>
                            ) : propertiesData.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {propertiesData.map(prop => (
                                            <div
                                              key={`${prop.code}`}
                                              data-property-code={prop.code}
                                              className={cn(
                                                "transition-all duration-300 rounded-2xl",
                                                highlightedPropertyCode === String(prop.code) && "ring-2 ring-primary/40"
                                              )}
                                            >
                                              <PropertyCard 
                                                property={prop}
                                                formatCurrency={formatCurrency}
                                                onClick={() => handleSelectProperty(prop)}
                                                isFeatured={featuredCodeSet.has(String(prop.code))}
                                              />
                                            </div>
                                        ))}
                                    </div>
                                    {totalItems > 0 && Math.ceil(totalItems / itemsPerPage) > 1 && (
                                        <div className="pt-4">
                                            <Pagination currentPage={currentPage} totalPages={Math.ceil(totalItems / itemsPerPage)} onPageChange={setCurrentPage} />
                                        </div>
                                    )}
                                </>
                            ) : (
                                  <div className="text-center py-20 text-muted-foreground border-2 border-dashed border-white/40 dark:border-white/[0.12] rounded-3xl bg-black/[0.02] dark:bg-white/[0.01]">Nenhum imóvel encontrado.</div>
                            )}
                        </div>

                        {/* SEÇÃO DO MAPA (NO FIM DA PÁGINA) */}
                              <div className="relative rounded-[2rem] overflow-hidden border border-white/20 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-3xl shadow-2xl p-5 lg:p-6">
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
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

                              <div className="h-[350px] lg:h-[450px] rounded-[2rem] overflow-hidden border border-white/30 dark:border-white/[0.08] shadow-2xl relative group bg-black/[0.02] dark:bg-white/[0.01]">
                                <PropertyMap 
                                    properties={allPropertiesForMap}
                                    formatCurrency={formatCurrency}
                                  onPropertyClick={handleMapPropertyPreview}
                                    center={selectedCityCenter}
                                    zoom={selectedCityZoom}
                                    className="w-full h-full"
                                  showPopups={false}
                                    featuredCodes={featuredCodes}
                                />

                                {mapPreviewProperty && (
                                  <>
                                    <div className="hidden lg:block absolute top-4 right-4 z-[1001] w-full max-w-[350px]">
                                      <div className="rounded-2xl shadow-2xl overflow-hidden relative h-[335px] group cursor-pointer border border-white/25 dark:border-white/10">
                                        <img
                                          src={mapPreviewProperty.image || "https://app.imoview.com.br//Front/img/house1.png"}
                                          alt={`Preview ${mapPreviewProperty.code}`}
                                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/55 to-transparent" />

                                        <Badge className="absolute top-4 left-4 text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-lg bg-blue-500 border-0">
                                          {mapPreviewProperty.status || "Disponível"}
                                        </Badge>

                                        <button
                                          onClick={() => setMapPreviewProperty(null)}
                                          className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-2 rounded-full transition-colors border border-white/30"
                                        >
                                          <X size={16} strokeWidth={2.5} />
                                        </button>

                                        <div className="absolute bottom-0 left-0 w-full p-6">
                                          <div className="translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                            <p className="text-gray-300 text-xs font-semibold tracking-widest mb-1">IMÓVEL #{mapPreviewProperty.code}</p>
                                            <h3 className="text-white font-bold text-xl leading-tight mb-1 line-clamp-1">
                                              {mapPreviewProperty.neighborhood}, {mapPreviewProperty.city}
                                            </h3>
                                            <p className="text-gray-300 text-sm mb-5 opacity-90 line-clamp-2">{mapPreviewProperty.address}</p>

                                            <div className="flex justify-between items-center border-t border-white/20 pt-4 gap-3">
                                              <span className="text-blue-400 font-bold text-2xl tracking-tight leading-none">
                                                {formatCurrency(Number(mapPreviewProperty.value || 0))}
                                              </span>
                                              <Button
                                                className="bg-white text-gray-900 hover:bg-gray-100 text-sm font-bold py-2 px-4 rounded-full transition-colors shadow-lg h-9"
                                                onClick={() => handleSelectProperty(mapPreviewProperty)}
                                              >
                                                Detalhes
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="lg:hidden absolute inset-x-2 bottom-2 z-[1001] rounded-2xl overflow-hidden shadow-2xl border border-white/25 dark:border-white/10">
                                      <div className="relative min-h-[220px] group">
                                        <img
                                          src={mapPreviewProperty.image || "https://app.imoview.com.br//Front/img/house1.png"}
                                          alt={`Preview ${mapPreviewProperty.code}`}
                                          className="absolute inset-0 w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/55 to-transparent" />

                                        <Badge className="absolute top-3 left-3 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-lg bg-blue-500 border-0">
                                          {mapPreviewProperty.status || "Disponível"}
                                        </Badge>

                                        <button
                                          onClick={() => setMapPreviewProperty(null)}
                                          className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-1.5 rounded-full transition-colors border border-white/30"
                                        >
                                          <X size={14} strokeWidth={2.5} />
                                        </button>

                                        <div className="absolute bottom-0 left-0 w-full p-4">
                                          <p className="text-gray-300 text-[10px] font-semibold tracking-widest mb-1">IMÓVEL #{mapPreviewProperty.code}</p>
                                          <h3 className="text-white font-bold text-base leading-tight mb-1 line-clamp-1">
                                            {mapPreviewProperty.neighborhood}, {mapPreviewProperty.city}
                                          </h3>
                                          <p className="text-gray-300 text-xs mb-4 opacity-90 line-clamp-2">{mapPreviewProperty.address}</p>

                                          <div className="flex justify-between items-center border-t border-white/20 pt-3 gap-2">
                                            <span className="text-blue-400 font-bold text-lg tracking-tight leading-none">
                                              {formatCurrency(Number(mapPreviewProperty.value || 0))}
                                            </span>
                                            <Button
                                              className="bg-white text-gray-900 hover:bg-gray-100 text-xs font-bold py-1.5 px-3 rounded-full transition-colors shadow-lg h-8"
                                              onClick={() => handleSelectProperty(mapPreviewProperty)}
                                            >
                                              Detalhes
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                )}
                                
                                {/* Legenda Flutuante (dentro do mapa) */}
                                <div className="absolute bottom-6 left-6 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl p-5 rounded-3xl shadow-2xl border border-white/30 dark:border-white/[0.08] z-[1000] hidden md:block">
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
