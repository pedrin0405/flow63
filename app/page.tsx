"use client"

import { useState, useEffect } from "react"
import { 
  Building2, Users, DollarSign, 
  MapPin, Trophy, Menu, LayoutDashboard, CheckCircle2
} from "lucide-react"
import { Sidebar } from "@/components/central63/sidebar"
import { StatCard } from "@/components/central63/stat-card"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Tooltip, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, XAxis, CartesianGrid
} from 'recharts'
import Loading from "./loading"

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")
  
  const [stats, setStats] = useState({
    totalImoveis: 0,
    leadsAtivos: 0,
    vgvRealizado: 0,
    vendasTotais: 0
  })

  const [leadTrendData, setLeadTrendData] = useState<any[]>([])
  const [neighborhoodDensity, setNeighborhoodDensity] = useState<any[]>([])
  const [brokerRanking, setBrokerRanking] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(val)

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const [resPmw, resAux, resLeads, resVendas, resInteracoes] = await Promise.all([
        supabase.from('imovel_pmw').select('bairro'),
        supabase.from('imovel_aux').select('bairro'),
        supabase.from('atendimento_pmw').select('situacao, corretor, created_at'),
        supabase.from('vendas').select('valor_venda'),
        supabase.from('interacao_pmw').select('*').order('datahora', { ascending: false }).limit(5)
      ])

      const vgv = (resVendas.data || []).reduce((acc, curr) => acc + (Number(curr.valor_venda) || 0), 0)
      setStats({
        totalImoveis: (resPmw.data?.length || 0) + (resAux.data?.length || 0),
        leadsAtivos: (resLeads.data || []).filter(l => l.situacao !== "Descartado").length,
        vgvRealizado: vgv,
        vendasTotais: resVendas.data?.length || 0
      })

      const trend = (resLeads.data || []).slice(-10).map((l, i) => ({
        day: i + 1,
        quantidade: Math.floor(Math.random() * 10) + 5
      }))
      setLeadTrendData(trend)

      const neighborhoodMap: Record<string, number> = {}
      const allProps = [...(resPmw.data || []), ...(resAux.data || [])]
      allProps.forEach(p => { if (p.bairro) neighborhoodMap[p.bairro] = (neighborhoodMap[p.bairro] || 0) + 1 })
      
      const densityData = Object.entries(neighborhoodMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)
      setNeighborhoodDensity(densityData)

      const brokerMap: Record<string, number> = {}
      resLeads.data?.forEach(lead => {
        if (lead.situacao === "Negócio realizado" && lead.corretor) {
          brokerMap[lead.corretor] = (brokerMap[lead.corretor] || 0) + 1
        }
      })
      setBrokerRanking(Object.entries(brokerMap).map(([name, sales]) => ({ name, sales })).sort((a, b) => b.sales - a.sales).slice(0, 5))

      setRecentActivities((resInteracoes.data || []).map(int => ({
        id: int.id,
        user: int.usuario || "Sistema",
        description: int.descricao || "Interação no lead",
        time: new Date(int.datahora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      })))

    } catch (error) { console.error(error) } finally { setIsLoading(false) }
  }

  useEffect(() => { fetchDashboardData() }, [])

  if (isLoading) return <Loading />

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        activeTab={activeTab} 
        onTabChange={(tab: string) => {
          setActiveTab(tab);
          setSidebarOpen(false);
        }} 
      />
      
      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* Header Responsivo */}
        <header className="sticky top-0 z-20 w-full bg-card/80 backdrop-blur-md border-b border-border px-4 lg:px-8 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors" 
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>
            <LayoutDashboard className="text-primary hidden sm:block" />
            <h2 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">Dashboard</h2>
          </div>
        </header>

        <div className="p-4 lg:p-8 space-y-6">
          {/* KPIs: 1 col mobile, 2 col tablet, 4 col desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <StatCard title="VGV Realizado" value={formatCurrency(stats.vgvRealizado)} icon={DollarSign} color="bg-emerald-500" trend="" />
            <StatCard title="Leads Ativos" value={stats.leadsAtivos} icon={Users} color="bg-purple-500" trend="" />
            <StatCard title="Imóveis" value={stats.totalImoveis} icon={Building2} color="bg-gray-500" trend="" />
            <StatCard title="Vendas no Dash" value={stats.vendasTotais} icon={CheckCircle2} color="bg-blue-500" trend="" />
          </div>

          {/* Grid Principal: 1 col mobile/tablet, 3 col desktop XL */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Fluxo de Leads - Ocupa 2 colunas em telas grandes */}
            <Card className="xl:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Fluxo de Novos Leads</CardTitle>
                <CardDescription>Volume de entrada recente</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px] sm:h-[300px] pl-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={leadTrendData} margin={{ left: 10, right: 10 }}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis dataKey="day" hide />
                    <Tooltip />
                    <Area type="monotone" dataKey="quantidade" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLeads)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Corretores */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy size={18} className="text-amber-500"/> Top Corretores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {brokerRanking.map((broker, i) => (
                  <div key={broker.name} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
                    <span className="text-sm font-medium truncate max-w-[150px]">{i + 1}º {broker.name}</span>
                    <span className="text-sm font-bold text-primary">{broker.sales}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Atividades - Reordenado para melhor fluxo visual em mobile */}
            <Card className="order-last xl:order-none">
              <CardHeader><CardTitle className="text-lg">Atividades</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {recentActivities.map((act) => (
                  <div key={act.id} className="border-l-4 border-primary/20 pl-3 py-1 hover:bg-accent/50 transition-colors rounded-r-md">
                    <p className="text-xs font-bold flex justify-between">
                      {act.user} <span className="text-[10px] font-normal opacity-70">{act.time}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{act.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Densidade por Região */}
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin size={18}/> Densidade de Carteira
                </CardTitle>
                <CardDescription>Principais bairros</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] sm:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={neighborhoodDensity}>
                    <PolarGrid strokeOpacity={0.1} />
                    <PolarAngleAxis dataKey="name" fontSize={10} />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} fontSize={10} />
                    <Radar
                      name="Imóveis"
                      dataKey="value"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.5}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  )
}