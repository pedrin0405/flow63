"use client"

import { useState, useEffect, Suspense, useCallback } from "react"
import { UserCog, Menu } from "lucide-react"
import { Sidebar } from "@/components/central63/sidebar"
import { BrokerList, Broker } from "@/components/central63/broker/broker-list"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import Loading from "@/app/loading"

export default function CorretoresPage() {
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("corretores")
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Estados de Dados e Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [allCities, setAllCities] = useState<string[]>([]) // Estado para armazenar as cidades
  const itemsPerPage = 8

  const [filters, setFilters] = useState({
    search: "",
    city: "all",
    status: "all"
  })

  // --- BUSCA LISTA DE CIDADES (Para alimentar o filtro) ---
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const [pmwRes, auxRes] = await Promise.all([
          supabase.from('corretores_pmw').select('cidade_origem'),
          supabase.from('corretores_aux').select('cidade_origem')
        ])
        
        const citiesSet = new Set([
          ...(pmwRes.data || []).map(b => b.cidade_origem),
          ...(auxRes.data || []).map(b => b.cidade_origem)
        ].filter(Boolean))
        
        setAllCities(Array.from(citiesSet).sort())
      } catch (error) {
        console.error("Erro ao carregar cidades:", error)
      }
    }
    fetchCities()
  }, [])

  // --- BUSCA DE CORRETORES COM FILTROS E PAGINAÇÃO ---
  const fetchBrokers = useCallback(async () => {
    setIsLoading(true)
    try {
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      const colunas = 'id, nome, cidade_origem, desativado, imagem_url, unidade, departamento, data_nascimento'

      const applyFilters = (tableName: string) => {
        let query = supabase.from(tableName).select(colunas, { count: 'exact' })
        
        // Pesquisa direta no banco para economizar Egress
        if (filters.search) {
          query = query.or(`nome.ilike.%${filters.search}%,unidade.ilike.%${filters.search}%`)
        }
        if (filters.city !== "all") {
          query = query.eq('cidade_origem', filters.city)
        }
        if (filters.status !== "all") {
          query = query.eq('desativado', filters.status === "inactive")
        }
        
        return query.order('nome').range(from, to)
      }

      const [pmwRes, auxRes] = await Promise.all([
        applyFilters('corretores_pmw'),
        applyFilters('corretores_aux')
      ])

      if (pmwRes.error) throw pmwRes.error
      if (auxRes.error) throw auxRes.error

      // Combina e garante que apenas 8 registros sejam processados por página
      const combined = [...(pmwRes.data || []), ...(auxRes.data || [])].slice(0, 8)
      
      setBrokers(combined as Broker[])
      setTotalCount((pmwRes.count || 0) + (auxRes.count || 0))

    } catch (error: any) {
      toast({ 
        title: "Erro", 
        description: "Falha ao carregar corretores.", 
        variant: "destructive" 
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, filters, itemsPerPage, toast])

  useEffect(() => {
    fetchBrokers()
  }, [fetchBrokers])

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <header className="w-full bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-sm z-20">
            <div className="flex items-center gap-4">
              <button 
                className="lg:hidden p-2 text-muted-foreground hover:bg-accent rounded-lg" 
                onClick={() => setSidebarOpen(true)}
              >
                <Menu />
              </button>
              <UserCog className="text-primary hidden sm:block" />
              <h2 className="text-2xl font-bold text-foreground tracking-tight">Gestão de Corretores</h2>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-background p-4 lg:p-8">
            <BrokerList 
              brokers={brokers} 
              onUpdate={fetchBrokers}
              isLoading={isLoading}
              currentPage={currentPage}
              totalItems={totalCount}
              onPageChange={setCurrentPage}
              filters={filters}
              setFilters={setFilters}
              cities={allCities} // Propriedade cities enviada corretamente agora
            />
          </div>
        </main>
      </div>
    </Suspense>
  )
}