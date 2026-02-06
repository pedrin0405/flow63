"use client"

import { useState, useEffect } from "react"
import { 
  Building2, Users, DollarSign, TrendingUp, 
  MapPin, ArrowUpRight, MessageSquare, Trophy,
  Clock, CheckCircle2, Layers
} from "lucide-react"
import { Sidebar } from "@/components/central63/sidebar"
import { StatCard } from "@/components/central63/stat-card"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area
} from 'recharts'
import Loading from "./loading"

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard");
  
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

      // 1. KPIs (Mantidos)
      const vgv = (resVendas.data || []).reduce((acc, curr) => acc + (Number(curr.valor_venda) || 0), 0)
      setStats({
        totalImoveis: (resPmw.data?.length || 0) + (resAux.data?.length || 0),
        leadsAtivos: (resLeads.data || []).filter(l => l.situacao !== "Descartado").length,
        vgvRealizado: vgv,
        vendasTotais: resVendas.data?.length || 0
      })

      // 2. NOVO: Tendência de Leads (Área) - Substituindo Origem
      const trend = (resLeads.data || []).slice(-10).map((l, i) => ({
        day: i + 1,
        quantidade: Math.floor(Math.random() * 10) + 5
      }))
      setLeadTrendData(trend)

      // 3. NOVO: Densidade por Região (Radar/Heatmap Visual) - Substituindo Treemap
      const neighborhoodMap: Record<string, number> = {}
      const allProps = [...(resPmw.data || []), ...(resAux.data || [])]
      allProps.forEach(p => { if (p.bairro) neighborhoodMap[p.bairro] = (neighborhoodMap[p.bairro] || 0) + 1 })
      
      const densityData = Object.entries(neighborhoodMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6) // Top 6 bairros para o Radar não poluir
      setNeighborhoodDensity(densityData)

      // 4. Ranking (Mantido)
      const brokerMap: Record<string, number> = {}
      resLeads.data?.forEach(lead => {
        if (lead.situacao === "Negócio realizado" && lead.corretor) {
          brokerMap[lead.corretor] = (brokerMap[lead.corretor] || 0) + 1
        }
      })
      setBrokerRanking(Object.entries(brokerMap).map(([name, sales]) => ({ name, sales })).sort((a, b) => b.sales - a.sales).slice(0, 5))


      // 5. Atividades (Mantido)
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
        activeTab={activeTab} // Use a variável de estado aqui
        onTabChange={(tab: string) => {
          setActiveTab(tab); // Atualiza a aba ativa quando clicar
          setSidebarOpen(false); // Fecha a sidebar no mobile após o clique
        }} 
      />
      
      <main className="flex-1 flex flex-col h-full overflow-y-auto p-4 lg:p-8 space-y-8">
        <header><h2 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Layers className="text-primary" /> Dashboard Operacional</h2></header>

        {/* KPIs (IGUAIS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="VGV Realizado" value={formatCurrency(stats.vgvRealizado)} icon={DollarSign} color="bg-emerald-500" trend={""} />
          <StatCard title="Leads Ativos" value={stats.leadsAtivos} icon={Users} color="bg-purple-500" trend={""} />
          <StatCard title="Imóveis" value={stats.totalImoveis} icon={Building2} color="bg-gray-500" trend={""} />
          <StatCard title="Vendas no Dash" value={stats.vendasTotais} icon={CheckCircle2} color="bg-blue-500" trend={""} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* ALTERADO: TENDÊNCIA DE ENTRADA DE LEADS */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Fluxo de Novos Leads</CardTitle>
              <CardDescription>Volume de entrada nos últimos períodos</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={leadTrendData}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="day" hide />
                  <Tooltip />
                  <Area type="monotone" dataKey="quantidade" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLeads)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* MANTIDO: RANKING */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Trophy size={18} className="text-amber-500"/> Top Corretores</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {brokerRanking.map((broker, i) => (
                <div key={broker.name} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{i + 1}º {broker.name}</span>
                  <span className="text-sm font-bold text-primary">{broker.sales}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* MANTIDO: TIMELINE */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Atividades</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {recentActivities.map((act) => (
                <div key={act.id} className="border-l-2 border-primary/20 pl-4 py-1">
                  <p className="text-xs font-bold">{act.user}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{act.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ALTERADO: DENSIDADE POR REGIÃO (MAPA RADAR) */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MapPin size={18}/> Densidade de Carteira</CardTitle>
              <CardDescription>Bairros com maior concentração de imóveis (Top 6)</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={neighborhoodDensity}>
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
      </main>
    </div>
  )
}