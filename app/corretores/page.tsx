"use client"

import { useState, useEffect, Suspense } from "react"
import { Users } from "lucide-react"
import { Sidebar } from "@/components/central63/sidebar"
import { BrokerList, Broker } from "@/components/central63/broker-list"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import Loading from "@/app/loading"

export default function CorretoresPage() {
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("corretores")
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchBrokers = async () => {
    setIsLoading(true)
    try {
      // Busca dados de Palmas e Filiais (Aux) em paralelo
      const [pmwRes, auxRes] = await Promise.all([
        supabase.from('corretores_pmw').select('*').order('nome'),
        supabase.from('corretores_aux').select('*').order('nome')
      ])

      if (pmwRes.error) throw pmwRes.error
      if (auxRes.error) throw auxRes.error

      const pmwData = pmwRes.data || []
      const auxData = auxRes.data || []

      // Combina os arrays
      const allBrokers = [...pmwData, ...auxData]

      setBrokers(allBrokers as Broker[])
    } catch (error: any) {
      console.error("Erro ao buscar corretores:", error)
      toast({ 
        title: "Erro", 
        description: "Falha ao carregar lista de corretores.", 
        variant: "destructive" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBrokers()
  }, [])

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
        
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-sm flex-shrink-0">
             <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                <Users className="text-primary" /> Gestão de Corretores
             </h2>
          </header>

          <div className="flex-1 overflow-y-auto bg-background p-4 lg:p-8">
            {isLoading ? (
               <div className="flex justify-center items-center py-20">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"/>
               </div>
            ) : (
              <BrokerList brokers={brokers} onUpdate={fetchBrokers} />
            )}
          </div>
        </main>
      </div>
    </Suspense>
  )
}