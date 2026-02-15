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
  AreaChart, Area, XAxis, CartesianGrid, TooltipProps
} from 'recharts'
import Loading from "./loading"

// Componente Customizado para o Tooltip do Gráfico
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    // payload[0].payload contém os dados completos do dia (day, quantidade, pmw, aux, total)
    const { pmw, aux, total } = payload[0].payload as any;
    
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border p-3 rounded-lg shadow-xl text-xs min-w-[140px]">
        <p className="font-semibold mb-2 text-foreground text-center border-b border-border pb-1">{label}</p>
        <div className="flex flex-col gap-2">
           <div className="flex items-center justify-between gap-4">
              <span className="bg-orange-50 border border-orange-200 text-orange-700 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase w-12 text-center">AUX</span>
              <span className="font-bold text-foreground">{aux}</span>
           </div>
           <div className="flex items-center justify-between gap-4">
              <span className="bg-blue-50 border border-blue-200 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase w-12 text-center">PMW</span>
              <span className="font-bold text-foreground">{pmw}</span>
           </div>
           <div className="border-t border-border pt-1 mt-0.5 flex items-center justify-between gap-4">
              <span className="bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase w-12 text-center">Total</span>
              <span className="font-bold text-foreground">{total}</span>
           </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")
  
  const [stats, setStats] = useState({
    totalImoveis: 0,
    leadsAtivos: 0,
    vgvRealizado: 0,
    vendasTotais: 0,
    trends: {
      vgv: "0%",
      leads: "0%",
      imoveis: "0%",
      vendas: "0%"
    }
  })

  const [leadTrendData, setLeadTrendData] = useState<any[]>([])
  const [neighborhoodDensity, setNeighborhoodDensity] = useState<any[]>([])
  const [brokerRanking, setBrokerRanking] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(val)

  

  // Função auxiliar para converter datas no formato "DD/MM/YYYY HH:mm" ou ISO
  const parseDate = (dateStr: string | null) => {
    if (!dateStr) return null
    
    // Tenta formato DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
      const [datePart, timePart] = dateStr.split(' ')
      const [day, month, year] = datePart.split('/').map(Number)
      const [hour, minute] = timePart ? timePart.split(':').map(Number) : [0, 0]
      return new Date(year, month - 1, day, hour, minute)
    }

    // Tenta formato ISO padrão
    const parsed = new Date(dateStr)
    return isNaN(parsed.getTime()) ? null : parsed
  }

  // Função auxiliar para remover tags HTML da descrição
  const stripHtml = (html: string | null) => {
    if (!html) return ""
    // Remove tags HTML
    let text = html.replace(/<[^>]*>?/gm, ' ')
    // Decodifica entidades HTML básicas se necessário ou remove espaços extras
    text = text.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
    return text
  }

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      // Busca paralela em todas as tabelas (PMW e AUX)
      // Adicionado 'created_at' em todas as consultas para cálculo de tendências
      const [
        resImovelPmw, resImovelAux, 
        resLeadsPmw, resLeadsAux, 
        resVendas, 
        resInteracoesPmw, resInteracoesAux
      ] = await Promise.all([
        supabase.from('imovel_pmw').select('bairro, created_at'),
        supabase.from('imovel_aux').select('bairro, created_at'),
        
        // Leads: buscando codigo (para join) e datahoraultimaalteracao
        supabase.from('atendimento_pmw').select('codigo, situacao, corretor, datahoraultimaalteracao, created_at'),
        supabase.from('atendimento_aux').select('codigo, situacao, corretor, datahoraultimaalteracao, created_at'),
        
        // Vendas: buscando valor_venda, id_origem (referencia ao codigo do atendimento) e tabela_origem
        supabase.from('vendas').select('valor_venda, id_origem, tabela_origem, created_at'),
        
        // Interações: buscando tudo para ordenar no front
        supabase.from('interacao_pmw').select('*').limit(50), 
        supabase.from('interacao_aux').select('*').limit(50)
      ])

      // --- Consolidação dos Dados ---
      
      const allProperties = [...(resImovelPmw.data || []), ...(resImovelAux.data || [])]
      
      // Combinando leads e marcando a origem
      const allLeads = [
        ...(resLeadsPmw.data || []).map(l => ({ ...l, source: 'PMW' })),
        ...(resLeadsAux.data || []).map(l => ({ ...l, source: 'AUX' }))
      ]
      
      // Adicionando tag de origem nas interações
      const allInteractions = [
        ...(resInteracoesPmw.data || []).map(i => ({ ...i, sourceTag: 'PMW' })), 
        ...(resInteracoesAux.data || []).map(i => ({ ...i, sourceTag: 'AUX' }))
      ]
      
      const allSales = resVendas.data || []

      // --- Cálculo de Estatísticas e Tendências ---
      
      // Datas para comparação (Mês Atual vs Mês Anterior)
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      
      const prevDate = new Date()
      prevDate.setMonth(prevDate.getMonth() - 1)
      const prevMonth = prevDate.getMonth()
      const prevYear = prevDate.getFullYear()

      // Helpers de filtro
      const filterByMonth = (data: any[], dateField: string, month: number, year: number) => {
        return data.filter(item => {
          const d = parseDate(item[dateField])
          return d && d.getMonth() === month && d.getFullYear() === year
        })
      }

      // 1. VGV Trend
      const salesCurr = filterByMonth(allSales, 'created_at', currentMonth, currentYear)
      const salesPrev = filterByMonth(allSales, 'created_at', prevMonth, prevYear)
      const vgvCurrSum = salesCurr.reduce((acc, curr) => acc + (Number(curr.valor_venda) || 0), 0)
      const vgvPrevSum = salesPrev.reduce((acc, curr) => acc + (Number(curr.valor_venda) || 0), 0)

      // 2. Leads Trend (Novos Leads criados)
      const leadsCurr = filterByMonth(allLeads, 'created_at', currentMonth, currentYear)
      const leadsPrev = filterByMonth(allLeads, 'created_at', prevMonth, prevYear)

      // 3. Properties Trend (Novos Imóveis)
      const propsCurr = filterByMonth(allProperties, 'created_at', currentMonth, currentYear)
      const propsPrev = filterByMonth(allProperties, 'created_at', prevMonth, prevYear)

      // 4. Sales Count Trend
      const salesCountCurr = salesCurr.length
      const salesCountPrev = salesPrev.length

      // Função de cálculo percentual
      const calcTrend = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? "+100%" : "0%"
        const diff = ((curr - prev) / prev) * 100
        return `${diff > 0 ? "+" : ""}${diff.toFixed(0)}%`
      }

      // Totais Gerais
      const vgvTotal = allSales.reduce((acc, curr) => acc + (Number(curr.valor_venda) || 0), 0)
      const activeLeads = allLeads.filter(l => 
        l.situacao !== "Descartado" && l.situacao !== "Negócio realizado"
      ).length

      setStats({
        totalImoveis: allProperties.length,
        leadsAtivos: activeLeads,
        vgvRealizado: vgvTotal,
        vendasTotais: allSales.length,
        trends: {
          vgv: calcTrend(vgvCurrSum, vgvPrevSum),
          leads: calcTrend(leadsCurr.length, leadsPrev.length),
          imoveis: calcTrend(propsCurr.length, propsPrev.length),
          vendas: calcTrend(salesCountCurr, salesCountPrev)
        }
      })

      // 2. Tendência de Leads (Últimos 14 dias - Gráfico)
      const last14Days = Array.from({ length: 14 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (13 - i))
        return d.toISOString().split('T')[0]
      })

      // Agrupamento por data e origem
      const leadsByDate = allLeads.reduce((acc: Record<string, { total: number, pmw: number, aux: number }>, curr) => {
        const dateObj = parseDate(curr.datahoraultimaalteracao)
        if (dateObj) {
          const dateStr = dateObj.toISOString().split('T')[0]
          
          if (last14Days.includes(dateStr)) {
            if (!acc[dateStr]) acc[dateStr] = { total: 0, pmw: 0, aux: 0 }
            
            acc[dateStr].total += 1
            if (curr.source === 'PMW') acc[dateStr].pmw += 1
            if (curr.source === 'AUX') acc[dateStr].aux += 1
          }
        }
        return acc
      }, {})

      const trend = last14Days.map(date => {
        const dayStats = leadsByDate[date] || { total: 0, pmw: 0, aux: 0 }
        return {
          day: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          quantidade: dayStats.total, // Usado para o gráfico
          pmw: dayStats.pmw,
          aux: dayStats.aux,
          total: dayStats.total
        }
      })
      
      setLeadTrendData(trend)

      // 3. Densidade por Bairro
      const neighborhoodMap: Record<string, number> = {}
      
      allProperties.forEach(p => { 
        if (p.bairro) {
           const normBairro = p.bairro.trim().charAt(0).toUpperCase() + p.bairro.trim().slice(1).toLowerCase();
           neighborhoodMap[normBairro] = (neighborhoodMap[normBairro] || 0) + 1 
        }
      })
      
      const densityData = Object.entries(neighborhoodMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)
      setNeighborhoodDensity(densityData)

      // 4. Ranking de Corretores (Relacionando Vendas com Atendimentos)
      const pmwBrokersMap = new Map(resLeadsPmw.data?.map(l => [l.codigo, l.corretor]) || [])
      const auxBrokersMap = new Map(resLeadsAux.data?.map(l => [l.codigo, l.corretor]) || [])
      
      const brokerSalesMap: Record<string, { name: string, value: number, source: string }> = {}

      allSales.forEach((sale: any) => {
        const valor = Number(sale.valor_venda) || 0
        const codigoAtendimento = sale.id_origem
        const origem = sale.tabela_origem?.toLowerCase() || ''
        
        let corretorNome = null
        let tagOrigem = ''

        if (origem.includes('pmw')) {
          corretorNome = pmwBrokersMap.get(codigoAtendimento)
          tagOrigem = 'PMW'
        } else if (origem.includes('aux')) {
          corretorNome = auxBrokersMap.get(codigoAtendimento)
          tagOrigem = 'AUX'
        } else {
          const fromPmw = pmwBrokersMap.get(codigoAtendimento)
          if (fromPmw) {
            corretorNome = fromPmw
            tagOrigem = 'PMW'
          } else {
            const fromAux = auxBrokersMap.get(codigoAtendimento)
            if (fromAux) {
              corretorNome = fromAux
              tagOrigem = 'AUX'
            }
          }
        }

        if (corretorNome) {
          const nomeLimpo = corretorNome.trim();
          const uniqueKey = `${tagOrigem}-${nomeLimpo}`;

          if (!brokerSalesMap[uniqueKey]) {
            brokerSalesMap[uniqueKey] = { name: nomeLimpo, value: 0, source: tagOrigem }
          }
          brokerSalesMap[uniqueKey].value += valor;
        }
      })
      
      setBrokerRanking(
        Object.values(brokerSalesMap)
          .sort((a, b) => b.value - a.value)
          .slice(0, 5)
      )

      // 5. Atividades Recentes
      const sortedActivities = allInteractions
        .map(int => ({
          ...int,
          parsedDate: parseDate(int.datahora)
        }))
        .filter(int => int.parsedDate !== null)
        .sort((a, b) => (b.parsedDate!.getTime() - a.parsedDate!.getTime()))
        .slice(0, 5)

      setRecentActivities(sortedActivities.map(int => ({
        id: int.id,
        user: int.usuario || "Sistema",
        source: int.sourceTag,
        description: stripHtml(int.descricao) || "Interação registrada", // Usando a função stripHtml aqui
        time: int.parsedDate 
          ? int.parsedDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          : '--:--'
      })))

    } catch (error) { 
      console.error("Erro ao carregar dados do dashboard:", error) 
    } finally { 
      setIsLoading(false) 
    }
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <StatCard title="VGV Realizado" value={formatCurrency(stats.vgvRealizado)} icon={DollarSign} color="bg-emerald-500" trend={stats.trends.vgv} />
            <StatCard title="Leads Ativos" value={stats.leadsAtivos} icon={Users} color="bg-purple-500" trend={stats.trends.leads} />
            <StatCard title="Imóveis" value={stats.totalImoveis} icon={Building2} color="bg-gray-500" trend={stats.trends.imoveis} />
            <StatCard title="Vendas Totais" value={stats.vendasTotais} icon={CheckCircle2} color="bg-blue-500" trend={stats.trends.vendas} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            <Card className="xl:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">Fluxo de Novos Leads</CardTitle>
                    <CardDescription>Movimentação recente (Últimos 14 dias)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-[250px] sm:h-[300px] pl-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={leadTrendData} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis 
                      dataKey="day" 
                      tick={{fontSize: 12}} 
                      tickLine={false} 
                      axisLine={false}
                      minTickGap={30}
                    />
                    {/* Tooltip Customizado */}
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="quantidade" 
                      name="Leads"
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorLeads)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy size={18} className="text-amber-500"/> Top Corretores
                </CardTitle>
                <CardDescription>Por volume de vendas (VGV)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 flex-1 overflow-y-auto">
                {brokerRanking.length > 0 ? (
                  brokerRanking.map((broker, i) => (
                    <div key={broker.name + i} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`
                          flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                          ${i === 0 ? 'bg-amber-100 text-amber-700' : 
                            i === 1 ? 'bg-slate-200 text-slate-700' : 
                            i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-secondary text-muted-foreground'}
                        `}>
                          {i + 1}
                        </div>
                        <div className="flex items-center min-w-0">
                          {/* Tag de Origem Estilizada */}
                          {broker.source && (
                            <span className={`
                              text-[9px] font-bold px-1.5 py-0.5 rounded mr-2 border shadow-sm
                              ${broker.source === 'PMW' 
                                ? 'bg-blue-100 text-blue-700 border-blue-200' 
                                : 'bg-orange-100 text-orange-700 border-orange-200'}
                            `}>
                              {broker.source}
                            </span>
                          )}
                          <span className="text-sm font-medium truncate" title={broker.name}>
                            {broker.name}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-primary whitespace-nowrap ml-2">{formatCurrency(broker.value)}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                    <Trophy className="opacity-20 mb-2" size={32} />
                    Nenhuma venda registrada
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="order-last xl:order-none flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">Atividades Recentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 overflow-y-auto max-h-[300px]">
                {recentActivities.length > 0 ? (
                  recentActivities.map((act) => (
                    <div key={act.id} className="border-l-4 border-primary/20 pl-3 py-1 hover:bg-accent/50 transition-colors rounded-r-md">
                      <div className="flex justify-between items-start mb-0.5">
                        <div className="flex items-center min-w-0 pr-2">
                           {/* Tag de Origem Estilizada */}
                           {act.source && (
                            <span className={`
                              text-[9px] font-bold px-1.5 py-0.5 rounded mr-2 border flex-shrink-0
                              ${act.source === 'PMW' 
                                ? 'bg-blue-100 text-blue-700 border-blue-200' 
                                : 'bg-orange-100 text-orange-700 border-orange-200'}
                            `}>
                              {act.source}
                            </span>
                          )}
                          <span className="text-xs font-bold truncate">{act.user}</span>
                        </div>
                        <span className="text-[10px] font-normal opacity-70 whitespace-nowrap flex-shrink-0">{act.time}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{act.description}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-xs text-muted-foreground">
                    Nenhuma atividade recente
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin size={18}/> Densidade de Carteira
                </CardTitle>
                <CardDescription>Concentração de imóveis por bairro</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] sm:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={neighborhoodDensity}>
                    <PolarGrid strokeOpacity={0.2} />
                    <PolarAngleAxis dataKey="name" fontSize={11} tick={{ fill: 'currentColor', opacity: 0.7 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} fontSize={10} strokeOpacity={0} />
                    <Radar
                      name="Imóveis"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="#3b82f6"
                      fillOpacity={0.4}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
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