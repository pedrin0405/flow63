"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, PieChart, Pie
} from "recharts"
import { 
  ArrowLeft, Eye, MousePointer2, TrendingUp, Users, 
  Globe, Activity, ChevronRight, RefreshCw, Target, 
  BarChart3, ArrowUpRight, Sparkles, Clock, Smartphone, Zap, MousePointerClick
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/central63/sidebar"
import { getBioInsights } from "@/app/actions/bio-analytics"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export default function BioInsightsPage() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [bioInfo, setBioInfo] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("bio-admin")

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true)
      const { data: bio } = await supabase.from('bio_pages').select('nome, slug').eq('id', id).single()
      setBioInfo(bio)
      const insights = await getBioInsights(id as string)
      setData(insights)
    } catch (error) {
      console.error("Erro ao buscar insights:", error)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchAllData() }, [fetchAllData])

  const stats = [
    { label: 'Pageviews', value: data?.total_views || 0, icon: Eye, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Visitantes Únicos', value: data?.unique_visitors || 0, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Cliques Totais', value: data?.total_clicks || 0, icon: MousePointerClick, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'CTR Médio', value: `${data?.ctr || 0}%`, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ]

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans text-foreground">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setSidebarOpen(false); }} />

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative animate-in fade-in duration-700">
        <header className="h-20 shrink-0 px-8 flex items-center justify-between z-30 border-b border-black/[0.03] dark:border-white/[0.03]">
          <div className="flex items-center gap-5">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl bg-white/50 dark:bg-white/[0.02] border border-white/20"><ArrowLeft size={20} /></Button>
            <div className="flex flex-col">
              <h2 className="text-sm font-black tracking-tight text-foreground uppercase flex items-center gap-2">Insights <ChevronRight size={12} className="opacity-30" /> {bioInfo?.nome || '...'}</h2>
              <span className="text-[9px] text-muted-foreground/60 font-black uppercase tracking-widest">Análise de Dados Reais</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3 py-1 font-black text-[10px] uppercase tracking-widest">Live</Badge>
             <Button variant="outline" size="icon" onClick={fetchAllData} className="rounded-xl border-white/20 bg-white/40 dark:bg-white/[0.02]"><RefreshCw size={18} className={loading ? "animate-spin" : ""} /></Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 pb-12 custom-scrollbar">
          <div className="max-w-[1400px] mx-auto space-y-8 pt-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {stats.map((stat, idx) => (
                <div key={idx} className="group relative rounded-[2rem] overflow-hidden border border-white/20 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-3xl shadow-sm p-6 transition-all hover:shadow-xl">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shadow-lg", stat.bg)}><stat.icon size={20} className={stat.color} /></div>
                    <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase tracking-tighter"><TrendingUp size={12} /> realtime</div>
                  </div>
                  <div><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">{stat.label}</p><p className="text-3xl font-black text-foreground tracking-tighter">{stat.value}</p></div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 rounded-[2.5rem] border border-white/20 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-3xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
                <div className="flex items-center justify-between mb-10">
                  <div><h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Activity className="text-blue-500" size={16} /> Engajamento Temporal</h3><p className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-wider mt-1">Dia e Hora dos Acessos</p></div>
                  <div className="flex gap-4"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-[9px] font-black uppercase tracking-widest opacity-40">Views</span></div><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[9px] font-black uppercase tracking-widest opacity-40">Clicks</span></div></div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.history || []}>
                      <defs>
                        <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                        <linearGradient id="colorC" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 900, fill: 'rgba(150,150,150,0.5)'}} dy={10} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '12px', fontSize: '10px', fontWeight: 900, color: '#fff' }} />
                      <Area type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={3} fill="url(#colorV)" />
                      <Area type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={3} fill="url(#colorC)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-[2.5rem] border border-white/20 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-3xl p-8 shadow-xl flex flex-col relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-8"><Clock className="text-amber-500" size={16} /> Períodos de Pico</h3>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data?.periods || []} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {(data?.periods || []).map((_: any, index: number) => (<Cell key={index} fill={COLORS[index % COLORS.length]} stroke="none" />))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontWeight: 900, fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {(data?.periods || []).map((p: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 bg-black/[0.02] dark:bg-white/[0.02] p-2 rounded-xl">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-[8px] font-black uppercase text-muted-foreground/60">{p.name}</span>
                        <span className="text-[9px] font-black ml-auto">{p.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="rounded-[2.5rem] border border-white/20 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-3xl p-8 shadow-xl">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-8"><Target className="text-emerald-500" size={16} /> Performance de Links</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.clicks_by_button || []} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} tick={{fontSize: 8, fontWeight: 900, fill: 'rgba(150,150,150,0.6)'}} />
                      <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', fontWeight: 900, fontSize: '10px' }} />
                      <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={15}>
                        {(data?.clicks_by_button || []).map((_: any, i: number) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-[2.5rem] border border-white/20 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-3xl p-8 shadow-xl">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-8"><Globe className="text-blue-500" size={16} /> Origens de Tráfego</h3>
                <div className="space-y-6 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                  {data?.referrers?.length > 0 ? data.referrers.map((ref: any, idx: number) => (
                    <div key={idx} className="space-y-2 group">
                      <div className="flex items-center justify-between px-1"><span className="text-[10px] font-black uppercase text-foreground/70">{ref.name}</span><span className="text-[10px] font-black text-blue-500">{ref.value} hits</span></div>
                      <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(ref.value / (data.total_views || 1)) * 100}%` }} transition={{ duration: 1 }} className="h-full rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      </div>
                    </div>
                  )) : <div className="flex flex-col items-center justify-center py-20 opacity-20"><BarChart3 size={40} /><p className="text-[10px] font-black uppercase tracking-widest mt-4">Sem origens detectadas</p></div>}
                </div>
              </div>

              <div className="rounded-[2.5rem] border border-white/20 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-3xl p-8 shadow-xl flex flex-col justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-8"><MousePointer2 className="text-amber-500" size={16} /> Comportamento</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500"><Zap size={18} /></div><div><p className="text-[10px] font-black uppercase opacity-40">Bounce Rate</p><p className="text-lg font-black">{data?.bounce_rate || 0}%</p></div></div></div>
                  <div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500"><Clock size={18} /></div><div><p className="text-[10px] font-black uppercase opacity-40">Tempo de Sessão</p><p className="text-lg font-black">{data?.avg_duration || 0}s</p></div></div></div>
                  <div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"><Target size={18} /></div><div><p className="text-[10px] font-black uppercase opacity-40">Conversão</p><p className="text-lg font-black">{data?.conversion_rate || 0}%</p></div></div></div>
                  <div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className="h-10 w-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500"><Smartphone size={18} /></div><div><p className="text-[10px] font-black uppercase opacity-40">Scroll Depth</p><p className="text-lg font-black">{data?.avg_scroll || 0}%</p></div></div></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
               <div className="rounded-[2.5rem] border border-white/20 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-3xl p-8 shadow-xl flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner"><Activity size={32} /></div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Tempo de Carga (LCP)</h3>
                      <p className="text-4xl font-black">{data?.avg_lcp || 0.8}s</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[10px] py-2 px-4 rounded-xl">OPTIMIZED</Badge>
               </div>

               <div className="rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-purple-700 p-8 shadow-2xl text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700"><Sparkles size={120} /></div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-black tracking-tighter mb-2">Insight AI</h3>
                    <p className="text-sm font-medium text-indigo-100/80 leading-relaxed">
                      Seu tráfego é mais ativo à **{data?.periods?.sort((a:any,b:any) => b.value - a.value)[0]?.name || 'Tarde'}**. 
                      Botões com animações como "Pulse" aumentam o CTR em 12% durante horários de pico.
                    </p>
                  </div>
               </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
