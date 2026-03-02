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
  const [allCities, setAllCities] = useState<string[]>([])
  
  // Alterado para 10 para coincidir com o "itemsPerPage = 10" do broker-list.tsx
  const itemsPerPage = 10

  const [filters, setFilters] = useState({
    search: "",
    city: "all",
    status: "all"
  })

  // --- BUSCA LISTA DE CIDADES (Para alimentar o filtro) ---
  useEffect(() => {
    const fetchCities = async () => {
      try {
        // Agora busca diretamente da view unificada
        const { data, error } = await supabase
          .from('todos_corretores')
          .select('cidade_origem')
        
        if (error) throw error

        const citiesSet = new Set((data || []).map(b => b.cidade_origem).filter(Boolean))
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
      const colunas = 'id, nome, cidade_origem, desativado, imagem_url, unidade, departamento, data_nascimento, origem'

      // Consulta a View que une as tabelas PMW e AUX
      let query = supabase
        .from('todos_corretores')
        .select(colunas, { count: 'exact' })
      
      // Aplica os filtros
      if (filters.search) {
        query = query.or(`nome.ilike.%${filters.search}%,unidade.ilike.%${filters.search}%`)
      }
      if (filters.city !== "all") {
        query = query.eq('cidade_origem', filters.city)
      }
      if (filters.status !== "all") {
        // A view converte o campo para boolean, então essa validação funcionará perfeitamente
        query = query.eq('desativado', filters.status === "inactive")
      }
      
      // Aplica a ordem e a paginação unificada diretamente no banco
      const { data, count, error } = await query.order('nome').range(from, to)

      if (error) throw error

      setBrokers(data as Broker[])
      setTotalCount(count || 0)

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
              cities={allCities}
            />
          </div>
        </main>
      </div>
    </Suspense>
  )
}