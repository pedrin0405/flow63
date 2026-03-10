"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  BarChart3, TrendingUp, Users, DollarSign, Settings, Plus, 
  Search, MoreHorizontal, LayoutDashboard, Megaphone, Globe, 
  Facebook, Instagram, Zap, CheckCircle2, XCircle, Clock, 
  ExternalLink, ChevronRight, Menu, Pencil, Trash2, Lock, 
  Eye, EyeOff, Database, ImageIcon, Activity, Check, Loader2, X,
  PieChart as PieChartIcon, MousePointer2, Target, Calendar,
  Filter, ArrowUpRight, ArrowDownRight, Info, ShieldCheck,
  Layers, CheckSquare, Square, AlertCircle, Laptop, Smartphone, Tablet,
  MousePointerClick, Landmark, BarChart, PlusCircle, Link2,
  TrendingDown, Navigation2, MousePointer, ActivitySquare, CopyPlus, Key, Link as LinkIcon,
  Copy, Trophy, Award, Flame
} from "lucide-react"
import { Sidebar } from "@/components/central63/sidebar"
import { StatCard } from "@/components/central63/services/stat-card"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart as ReBarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend, ComposedChart
} from 'recharts'
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Loading from "../loading"

interface AdChannel {
  id: string
  name: string
  platform: string
  status: 'active' | 'inactive' | 'error'
  spent: number
  conversions: number
  cpc: number
  roas: number
  logo_url?: string
  history?: any[]
  campaignsList?: any[]
  extra?: any
  error?: string
}

interface DynamicField {
  id: string
  key: string
  value: string
  isSecret: boolean
  isVisible?: boolean
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const CAMPAIGN_KEYWORDS = ['facebook', 'google', 'analytics', 'ads', 'meta', 'tiktok', 'instagram'];

export default function CampaignsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [integrations, setIntegrations] = useState<any[]>([])
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  
  const [instanceName, setInstanceName] = useState("")
  const [urlSite, setUrlSite] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([])
  
  const [realChannels, setRealChannels] = useState<AdChannel[]>([])
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [period, setPeriod] = useState("30")
  const [selectedSourceIds, setSelectedSources] = useState<string[]>([])
  const [campaignSearch, setCampaignSearch] = useState("")

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: (val || 0) > 1000000 ? 'compact' : 'standard' }).format(val || 0)
  }

  const fetchRealData = async (days = period) => {
    setIsDataLoading(true)
    try {
      const res = await fetch(`/api/campaigns/metrics?days=${days}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setRealChannels(data)
        if (selectedSourceIds.length === 0) setSelectedSources(data.map(c => c.id))
      }
    } catch (err) { console.error(err) } finally { setIsDataLoading(false) }
  }

  const fetchIntegrations = async () => {
    try {
      const { data, error } = await supabase.from('company_settings').select('*').order('created_at', { ascending: false })
      if (!error) {
        const campaignOnly = (data || []).filter(item => 
          CAMPAIGN_KEYWORDS.some(kw => item.instance_name?.toLowerCase().includes(kw))
        )
        setIntegrations(campaignOnly)
      }
    } catch (err) { toast.error("Erro integrações") } finally { setIsLoading(false) }
  }

  useEffect(() => { fetchIntegrations(); fetchRealData(); }, [])

  const filteredIntegrations = useMemo(() => {
    return integrations.filter(item => 
      item.instance_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.url_site?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [integrations, searchTerm])

  const filteredChannels = useMemo(() => realChannels.filter(c => selectedSourceIds.includes(c.id)), [realChannels, selectedSourceIds])

  const analytics = useMemo(() => {
    const historyMap: Record<string, any> = {}
    const allCampaigns: any[] = []
    const deviceBreakdown: Record<string, number> = { mobile: 0, desktop: 0, tablet: 0 }
    const channelTrafficData: any[] = []
    const cpcByChannel: Record<string, { spent: number, clicks: number }> = {}
    
    filteredChannels.forEach(channel => {
      if (channel.status !== 'active') return;

      channel.history?.forEach(h => {
        if (!historyMap[h.date]) {
          historyMap[h.date] = { date: h.date, spend: 0, conversions: 0, ctr: 0, impressions: 0, clicks: 0, newUsers: 0, views: 0, bounceRate: 0, engagedSessions: 0, activeUsers: 0, count: 0 }
        }
        historyMap[h.date].spend += (h.spend || 0)
        historyMap[h.date].conversions += (h.conversions || 0)
        historyMap[h.date].impressions += (h.impressions || 0)
        historyMap[h.date].clicks += (h.clicks || 0)
        historyMap[h.date].newUsers += (h.newUsers || 0)
        historyMap[h.date].views += (h.views || 0)
        historyMap[h.date].bounceRate += (h.bounceRate || 0)
        historyMap[h.date].engagedSessions += (h.engagedSessions || 0)
        historyMap[h.date].activeUsers += (h.activeUsers || 0)
        historyMap[h.date].count += 1

        if (!cpcByChannel[channel.name]) cpcByChannel[channel.name] = { spent: 0, clicks: 0 }
        cpcByChannel[channel.name].spent += (h.spend || 0)
        cpcByChannel[channel.name].clicks += (h.clicks || 0)
      })
      
      if (channel.campaignsList) {
        allCampaigns.push(...channel.campaignsList.map(camp => ({ ...camp, platform: channel.platform })))
      }
      
      if (channel.extra?.breakdownChannels) {
        Object.entries(channel.extra.breakdownChannels).forEach(([k, v]: [string, any]) => {
          channelTrafficData.push({ name: k, value: v })
        })
      }
      if (channel.extra?.breakdownDevices) {
        Object.entries(channel.extra.breakdownDevices).forEach(([k, v]: [string, any]) => {
          const deviceKey = k.toLowerCase();
          if (deviceBreakdown.hasOwnProperty(deviceKey)) deviceBreakdown[deviceKey] += v
        })
      }
    })

    const historyArray = Object.values(historyMap).map((h: any) => ({
      ...h,
      avgBounce: h.bounceRate / (h.count || 1),
      cpc: h.spend > 0 ? h.spend / (h.clicks || 1) : 0,
      cpm: h.impressions > 0 ? (h.spend / h.impressions) * 1000 : 0
    })).sort((a, b) => {
      const [d1, m1] = a.date.split('/').map(Number); const [d2, m2] = b.date.split('/').map(Number);
      return m1 !== m2 ? m1 - m2 : d1 - d2
    })

    const distributionData = filteredChannels.map(c => ({ 
      name: c.name, 
      value: c.spent > 0 ? c.spent : (c.history?.reduce((acc, h) => acc + (h.clicks || 0), 0) / 10 || 0)
    }))

    const deviceData = Object.entries(deviceBreakdown).filter(([_, v]) => v > 0).map(([n, v]) => ({ name: n.toUpperCase(), value: v }))

    const cpcChartData = Object.entries(cpcByChannel).map(([name, data]) => ({
      name,
      cpc: data.clicks > 0 ? data.spent / data.clicks : 0
    }))

    // Raking de Performance
    const topLeads = [...allCampaigns].sort((a, b) => b.conversions - a.conversions).slice(0, 5)
    const topViews = [...allCampaigns].sort((a, b) => (b.impressions || b.clicks) - (a.impressions || a.clicks)).slice(0, 5)

    return { historyArray, distributionData, allCampaigns, deviceData, channelTrafficData, cpcChartData, topLeads, topViews }
  }, [filteredChannels])

  const finalCampaigns = useMemo(() => {
    return (analytics.allCampaigns || [])
      .filter(c => c.name.toLowerCase().includes(campaignSearch.toLowerCase()))
      .sort((a, b) => b.spend - a.spend)
  }, [analytics.allCampaigns, campaignSearch])

  const addField = () => {
    setDynamicFields([...dynamicFields, { id: crypto.randomUUID(), key: "", value: "", isSecret: false, isVisible: false }])
  }

  const removeField = (id: string) => setDynamicFields(dynamicFields.filter(f => f.id !== id))
  const updateField = (id: string, updates: Partial<DynamicField>) => setDynamicFields(dynamicFields.map(f => f.id === id ? { ...f, ...updates } : f))

  const openNewIntegration = (platform?: string) => {
    setEditingId(null); setInstanceName(platform ? `${platform}` : ""); setUrlSite(""); setLogoUrl(""); setIsActive(true);
    const initialFields: DynamicField[] = []
    if (platform?.includes('Google') && !platform.includes('Analytics')) {
      ['developer_token', 'client_id', 'client_secret', 'refresh_token', 'customer_id'].forEach(k => initialFields.push({ id: crypto.randomUUID(), key: k, value: "", isSecret: true, isVisible: false }))
    } else if (platform?.includes('Analytics')) {
      ['property_id', 'client_id', 'client_secret', 'refresh_token'].forEach(k => initialFields.push({ id: crypto.randomUUID(), key: k, value: "", isSecret: true, isVisible: false }))
    } else if (platform?.includes('Facebook')) {
      initialFields.push({ id: crypto.randomUUID(), key: 'access_token', value: "", isSecret: true, isVisible: false })
      initialFields.push({ id: crypto.randomUUID(), key: 'ad_account_id', value: "", isSecret: false, isVisible: false })
    } else {
      initialFields.push({ id: crypto.randomUUID(), key: "", value: "", isSecret: false, isVisible: false })
    }
    setDynamicFields(initialFields); setIsConfigDialogOpen(true);
  }

  const openEditIntegration = (item: any) => {
    setEditingId(item.id); setInstanceName(item.instance_name); setUrlSite(item.url_site || ""); setLogoUrl(item.logo_url || "");
    const config = typeof item.api_config === 'string' ? JSON.parse(item.api_config) : item.api_config
    setIsActive(config.active !== false);
    const fields = Object.entries(config).filter(([k]) => k !== 'active' && k !== 'updatedAt').map(([key, data]: [string, any]) => ({
      id: crypto.randomUUID(), key, value: typeof data === 'object' ? (data.value || "") : (data || ""), isSecret: typeof data === 'object' ? (data.isSecret || false) : false, isVisible: false
    }))
    setDynamicFields(fields); setIsConfigDialogOpen(true);
  }

  const handleDuplicateIntegration = (item: any) => {
    setEditingId(null); setInstanceName(`${item.instance_name} (Cópia)`); setUrlSite(item.url_site || ""); setLogoUrl(item.logo_url || "");
    const config = typeof item.api_config === 'string' ? JSON.parse(item.api_config) : item.api_config
    const fields = Object.entries(config).filter(([k]) => k !== 'active' && k !== 'updatedAt').map(([key, data]: [string, any]) => ({
      id: crypto.randomUUID(), key, value: typeof data === 'object' ? (data.value || "") : (data || ""), isSecret: typeof data === 'object' ? (data.isSecret || false) : false, isVisible: false
    }))
    setDynamicFields(fields); setIsConfigDialogOpen(true);
    toast.info("Configuração clonada.");
  }

  const handleSaveConfig = async () => {
    if (!instanceName) return toast.error("Dê um nome para esta integração")
    setIsSaving(true)
    try {
      const apiConfig: Record<string, any> = { active: isActive, updatedAt: new Date().toISOString() }
      dynamicFields.forEach(f => { if (f.key) apiConfig[f.key] = { value: f.value, isSecret: f.isSecret } })
      const payload = { instance_name: instanceName, url_site: urlSite, logo_url: logoUrl, api_config: apiConfig, updated_at: new Date() }
      const { error } = editingId ? await supabase.from('company_settings').update(payload).eq('id', editingId) : await supabase.from('company_settings').insert([payload])
      if (!error) { toast.success("Integração salva!"); setIsConfigDialogOpen(false); fetchIntegrations(); fetchRealData(); }
    } catch (error: any) { toast.error("Erro: " + error.message) } finally { setIsSaving(false) }
  }

  const handleRemoveIntegration = async (id: string) => {
    if (!confirm("Remover esta conexão permanentemente?")) return
    try {
      const { error } = await supabase.from('company_settings').delete().eq('id', id)
      if (!error) { toast.success("Removido!"); fetchIntegrations(); fetchRealData(); }
    } catch (err) { toast.error("Erro ao remover") }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value; setUrlSite(url);
    if (url && url.length > 3 && !logoUrl) {
      try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
        setLogoUrl(`https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`)
      } catch (error) {}
    }
  }

  const toggleSource = (id: string) => setSelectedSources(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

  if (isLoading) return <Loading />

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activeTab="campaigns" onTabChange={(t) => { setActiveTab(t); setSidebarOpen(false); }} />
      
      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        <header className="sticky top-0 z-20 w-full bg-card/80 backdrop-blur-md border-b border-border px-4 lg:px-8 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 text-muted-foreground" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center"><Megaphone className="text-primary h-5 w-5" /></div>
            <div><h2 className="text-xl font-black">Camapanhas</h2><p className="text-[10px] uppercase font-bold opacity-60 tracking-widest">Gestão de Dados</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex bg-muted/50 p-1 rounded-xl border border-border/50">
              {["7", "14", "30"].map((d) => (
                <button key={d} onClick={() => { setPeriod(d); fetchRealData(d); }} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${period === d ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}>{d} Dias</button>
              ))}
            </div>
            <Button variant="ghost" size="icon" className={`rounded-full ${isDataLoading ? 'animate-spin' : ''}`} onClick={() => fetchRealData()}><Activity size={18} /></Button>
          </div>
        </header>

        <div className="p-4 lg:p-8 space-y-8 max-w-[1800px] mx-auto w-full">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground"><Layers size={14} className="text-primary" /> Visualizar Fontes Ativas</div>
              <button onClick={() => setSelectedSources(selectedSourceIds.length === realChannels.length ? [] : realChannels.map(c => c.id))} className="text-[9px] font-black uppercase hover:text-primary tracking-widest opacity-40 hover:opacity-100">[ Inverter Filtros ]</button>
            </div>
            <div className="flex flex-wrap gap-3">
              {realChannels.map((source) => (
                <button 
                  key={source.id} 
                  onClick={() => toggleSource(source.id)}
                  className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all duration-300 ${selectedSourceIds.includes(source.id) ? 'bg-primary/10 border-primary text-primary shadow-lg' : 'bg-card border-border/50 text-muted-foreground opacity-50'}`}
                >
                  <div className="h-6 w-6 flex items-center justify-center overflow-hidden rounded-md bg-white/50">{source.logo_url ? <img src={source.logo_url} className="h-full w-full object-contain" /> : <Globe size={16} />}</div>
                  <span className="text-[10px] font-black uppercase">{source.name}</span>
                  {selectedSourceIds.includes(source.id) ? <CheckSquare size={14} /> : <Square size={14} />}
                </button>
              ))}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-card p-1 rounded-2xl border border-border/50 h-14 mb-8 shadow-sm">
              <TabsTrigger value="dashboard" className="rounded-xl px-8 h-full font-black text-[11px] uppercase tracking-widest transition-all">Geral</TabsTrigger>
              <TabsTrigger value="behavior" className="rounded-xl px-8 h-full font-black text-[11px] uppercase tracking-widest transition-all">Comportamento</TabsTrigger>
              <TabsTrigger value="charts" className="rounded-xl px-8 h-full font-black text-[11px] uppercase tracking-widest transition-all">Detalhados</TabsTrigger>
              <TabsTrigger value="config" className="rounded-xl px-8 h-full font-black text-[11px] uppercase tracking-widest transition-all">Configurações</TabsTrigger>
            </TabsList>

            {/* ABA GERAL */}
            <TabsContent value="dashboard" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Investimento" value={formatCurrency(filteredChannels.reduce((acc, c) => acc + (c.spent || 0), 0))} icon={DollarSign} color="bg-blue-600" />
                <StatCard title="Resultados" value={filteredChannels.reduce((acc, c) => acc + (c.conversions || 0), 0).toFixed(0)} icon={Target} color="bg-emerald-600" />
                <StatCard title="Novos Usuários" value={analytics.historyArray.reduce((acc, h) => acc + h.newUsers, 0).toLocaleString()} icon={Users} color="bg-indigo-600" />
                <StatCard title="ROAS Médio" value={`${((filteredChannels.reduce((acc, c) => acc + (c.roas || 0), 0) / (filteredChannels.length || 1)) || 0).toFixed(1)}x`} icon={BarChart3} color="bg-purple-600" />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <Card className="xl:col-span-2 rounded-[2.5rem] border-border/40 shadow-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="p-8 border-b border-border/40 flex justify-between items-center">
                    <div><CardTitle className="text-xl font-black">Performance Cronológica</CardTitle><CardDescription>Soma de todas as fontes selecionadas</CardDescription></div>
                  </CardHeader>
                  <CardContent className="h-[400px] p-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={analytics.historyArray}>
                        <defs><linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                        <XAxis dataKey="date" tick={{fontSize: 10, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" tick={{fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                        <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Area yAxisId="left" type="monotone" dataKey="spend" name="Investimento" stroke="#3b82f6" strokeWidth={4} fill="url(#colorArea)" />
                        <Line yAxisId="right" type="monotone" dataKey="newUsers" name="Novos Usuários" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4}} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-border/40 shadow-2xl bg-card/50">
                  <CardHeader className="p-8"><CardTitle className="text-xl font-black flex items-center gap-3"><PieChartIcon className="text-emerald-500" /> Share de Wallet (Gasto/Tráfego)</CardTitle></CardHeader>
                  <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={analytics.distributionData} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                          {analytics.distributionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" align="center" iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* NOVA SEÇÃO: RANKING DE PERFORMANCE */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* TOP LEADS */}
                <Card className="rounded-[2.5rem] border-border/40 shadow-2xl bg-card/50 backdrop-blur-md overflow-hidden">
                  <CardHeader className="p-8 border-b border-border/40 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-black flex items-center gap-3"><Trophy className="text-yellow-500" /> Top Anúncios: Leads</CardTitle>
                      <CardDescription>Campanhas que mais geraram conversões</CardDescription>
                    </div>
                    <Badge className="bg-yellow-500/10 text-yellow-600 border-none font-black text-[9px] uppercase">RANKING #1</Badge>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/20">
                      {analytics.topLeads.map((camp, idx) => (
                        <div key={idx} className="flex items-center justify-between p-6 hover:bg-accent/20 transition-all group">
                          <div className="flex items-center gap-5">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-yellow-500 text-white shadow-lg' : 'bg-muted/50 text-muted-foreground'}`}>
                              {idx + 1}º
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black text-sm text-foreground truncate max-w-[200px]">{camp.name}</span>
                              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">{camp.platform}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-8">
                            <div className="text-right">
                              <p className="text-[9px] font-black text-muted-foreground uppercase opacity-50">Conversões</p>
                              <p className="font-black text-lg text-emerald-600">{camp.conversions.toFixed(0)}</p>
                            </div>
                            <ArrowUpRight className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-all" size={20} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* TOP VISUALIZAÇÕES */}
                <Card className="rounded-[2.5rem] border-border/40 shadow-2xl bg-card/50 backdrop-blur-md overflow-hidden">
                  <CardHeader className="p-8 border-b border-border/40 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-black flex items-center gap-3"><Award className="text-blue-500" /> Top Anúncios: Alcance</CardTitle>
                      <CardDescription>Maior volume de impressões e visualizações</CardDescription>
                    </div>
                    <Badge className="bg-blue-500/10 text-blue-600 border-none font-black text-[9px] uppercase">VISIBILIDADE</Badge>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/20">
                      {analytics.topViews.map((camp, idx) => (
                        <div key={idx} className="flex items-center justify-between p-6 hover:bg-accent/20 transition-all group">
                          <div className="flex items-center gap-5">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-blue-500 text-white shadow-lg' : 'bg-muted/50 text-muted-foreground'}`}>
                              {idx + 1}º
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black text-sm text-foreground truncate max-w-[200px]">{camp.name}</span>
                              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">{camp.platform}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-8">
                            <div className="text-right">
                              <p className="text-[9px] font-black text-muted-foreground uppercase opacity-50">Visualizações</p>
                              <p className="font-black text-lg text-blue-600">{(camp.impressions || camp.clicks).toLocaleString()}</p>
                            </div>
                            <Flame className="text-orange-500 opacity-0 group-hover:opacity-100 transition-all" size={20} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="behavior" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard title="Engajamento" value={`${(analytics.historyArray.reduce((acc, h) => acc + h.avgBounce, 0) / (analytics.historyArray.length || 1)).toFixed(1)}%`} icon={Zap} color="bg-orange-500" trend="Bounce Rate" />
                  <StatCard title="Active Users" value={analytics.historyArray.reduce((acc, h) => acc + h.activeUsers, 0).toLocaleString()} icon={Users} color="bg-blue-500" trend="Diários" />
                  <StatCard title="Engaged Sessions" value={analytics.historyArray.reduce((acc, h) => acc + h.engagedSessions, 0).toLocaleString()} icon={ActivitySquare} color="bg-emerald-500" trend="GA4" />
                  <StatCard title="PageViews" value={analytics.historyArray.reduce((acc, h) => acc + h.views, 0).toLocaleString()} icon={Eye} color="bg-pink-500" trend="Total" />
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card className="lg:col-span-2 rounded-[2.5rem] border-border/40 shadow-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="p-8"><CardTitle className="text-xl font-black flex items-center gap-3"><TrendingDown className="text-red-500" /> Taxa de Rejeição Diária (%)</CardTitle></CardHeader>
                    <CardContent className="h-[300px] p-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analytics.historyArray}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                          <XAxis dataKey="date" tick={{fontSize: 10}} axisLine={false} />
                          <YAxis tick={{fontSize: 10}} axisLine={false} unit="%" />
                          <Tooltip />
                          <Line type="monotone" dataKey="avgBounce" name="Rejeição" stroke="#ef4444" strokeWidth={3} dot={{r: 4}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[2.5rem] border-border/40 shadow-2xl bg-card/50">
                    <CardHeader className="p-8"><CardTitle className="text-xl font-black flex items-center gap-3"><Smartphone className="text-emerald-500" /> Device Segments</CardTitle></CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={analytics.deviceData} innerRadius={60} outerRadius={80} paddingAngle={10} dataKey="value">
                            {analytics.deviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[2.5rem] border-border/40 shadow-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="p-8"><CardTitle className="text-xl font-black flex items-center gap-3"><Eye className="text-pink-500" /> Volume Diário de PageViews</CardTitle></CardHeader>
                    <CardContent className="h-[250px] p-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.historyArray}>
                          <defs><linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/><stop offset="95%" stopColor="#ec4899" stopOpacity={0}/></linearGradient></defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                          <XAxis dataKey="date" tick={{fontSize: 10}} axisLine={false} />
                          <Tooltip />
                          <Area type="monotone" dataKey="views" name="PageViews" stroke="#ec4899" strokeWidth={4} fill="url(#colorViews)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2 rounded-[2.5rem] border-border/40 shadow-2xl bg-card/50">
                    <CardHeader className="p-8"><CardTitle className="text-xl font-black flex items-center gap-3"><Users className="text-indigo-500" /> Atividade de Usuários (Daily Active)</CardTitle></CardHeader>
                    <CardContent className="h-[250px] p-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.historyArray}>
                          <defs><linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.05} />
                          <XAxis dataKey="date" tick={{fontSize: 10}} axisLine={false} />
                          <Tooltip />
                          <Area type="monotone" dataKey="activeUsers" name="Usuários Ativos" stroke="#8b5cf6" fill="url(#colorUsers)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
               </div>
            </TabsContent>

            <TabsContent value="charts" className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="rounded-[2.5rem] border-border/40 shadow-2xl bg-card/50">
                    <CardHeader className="p-8"><CardTitle className="text-xl font-black flex items-center gap-3"><TrendingUp className="text-pink-500" /> Evolução de CPM (Custo por Mil)</CardTitle></CardHeader>
                    <CardContent className="h-[300px] p-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analytics.historyArray}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.05} />
                          <XAxis dataKey="date" tick={{fontSize: 10}} axisLine={false} />
                          <YAxis tick={{fontSize: 10}} axisLine={false} tickFormatter={(v) => `R$${v.toFixed(2)}`} />
                          <Tooltip />
                          <Line type="monotone" dataKey="cpm" name="CPM Médio" stroke="#ec4899" strokeWidth={3} dot={{r: 4}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[2.5rem] border-border/40 shadow-2xl overflow-hidden bg-card/50 backdrop-blur-sm">
                    <CardHeader className="p-8 border-b border-border/40">
                      <CardTitle className="text-lg font-black flex items-center gap-2"><MousePointerClick className="text-orange-500" /> Evolução de CPC Médio Diário</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] p-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analytics.historyArray}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                          <XAxis dataKey="date" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                          <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v.toFixed(2)}`} />
                          <Tooltip />
                          <Line type="monotone" dataKey="cpc" name="CPC Médio" stroke="#f59e0b" strokeWidth={4} dot={{r: 4, fill: '#fff', strokeWidth: 2}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[2.5rem] border-border/40 shadow-2xl bg-card/50">
                    <CardHeader className="p-8"><CardTitle className="text-xl font-black flex items-center gap-3"><MousePointer className="text-orange-500" /> Conversões por Origem (GA4)</CardTitle></CardHeader>
                    <CardContent className="h-[300px] p-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <ReBarChart data={analytics.channelTrafficData.slice(0, 6)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.05} />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" tick={{fontSize: 9, fontWeight: 'bold'}} width={100} axisLine={false} />
                          <Tooltip />
                          <Bar dataKey="value" name="Conversões" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                        </ReBarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[2.5rem] border-border/40 shadow-2xl overflow-hidden bg-card/50 backdrop-blur-sm">
                    <CardHeader className="p-8 border-b border-border/40">
                      <CardTitle className="text-lg font-black flex items-center gap-2"><BarChart3 className="text-blue-500" /> CPC por Conta de Integração</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] p-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <ReBarChart data={analytics.cpcChartData} layout="vertical" margin={{ left: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.05} />
                          <XAxis type="number" tickFormatter={(v) => `R$${v.toFixed(2)}`} tick={{fontSize: 10}} />
                          <YAxis dataKey="name" type="category" tick={{fontSize: 10, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                          <Tooltip />
                          <Bar dataKey="cpc" name="CPC Médio (R$)" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                        </ReBarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
               </div>

               <Card className="rounded-[2.5rem] border-border/40 shadow-2xl overflow-hidden bg-card/50">
                  <CardHeader className="p-8 border-b border-border/40 bg-muted/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div><CardTitle className="text-xl font-black">Performance por Campanha</CardTitle><CardDescription>Dados individuais extraídos das APIs selecionadas</CardDescription></div>
                    <div className="relative w-full md:w-72"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} /><Input placeholder="Filtrar campanhas..." value={campaignSearch} onChange={(e) => setCampaignSearch(e.target.value)} className="pl-10 h-11 bg-background rounded-2xl" /></div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-muted/30 text-muted-foreground font-black uppercase tracking-widest border-b border-border/40">
                            <th className="px-10 py-6">Campanha</th>
                            <th className="px-10 py-6">Plataforma</th>
                            <th className="px-10 py-6 text-right">Gasto</th>
                            <th className="px-10 py-6 text-right">Cliques</th>
                            <th className="px-10 py-6 text-right">Conv.</th>
                            <th className="px-10 py-6 text-right">ROAS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                          {finalCampaigns.map((camp, idx) => (
                            <tr key={idx} className="hover:bg-accent/30 transition-all group">
                              <td className="px-10 py-6 font-black">{camp.name}</td>
                              <td className="px-10 py-6"><Badge className="bg-primary/10 text-primary border-none text-[9px] font-black">{camp.platform}</Badge></td>
                              <td className="px-10 py-6 text-right font-bold">{formatCurrency(camp.spend)}</td>
                              <td className="px-10 py-6 text-right">{camp.clicks}</td>
                              <td className="px-10 py-6 text-right">{camp.conversions.toFixed(0)}</td>
                              <td className="px-10 py-6 text-right font-black text-emerald-600">{(camp.spend > 0 ? (camp.conversions * 150 / camp.spend) : 0).toFixed(1)}x</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="config" className="space-y-5 animate-in fade-in duration-500 pb-12">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-3xl border border-border/50 shadow-sm">
                <div className="space-y-0.5 ml-2">
                  <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    Integrações <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-none text-[10px] h-5 px-2">{integrations.length}</Badge>
                  </h2>
                  <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest opacity-60">Conexões Externas e APIs</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
                  <div className="relative group w-full sm:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                      placeholder="Pesquisar..." 
                      className="pl-10 bg-muted/40 border-border/60 focus:ring-primary/20 h-11 rounded-2xl text-sm transition-all shadow-inner"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="w-full sm:w-auto rounded-2xl h-11 px-6 gap-2 shadow-lg shadow-primary/10 transition-all hover:shadow-primary/20 active:scale-95">
                        <Zap size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">Ligar API</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-3xl p-2 shadow-2xl border-border/50 backdrop-blur-xl">
                      {['Facebook Ads', 'Google Ads', 'Google Analytics'].map(p => (
                        <DropdownMenuItem key={p} onClick={() => openNewIntegration(p)} className="rounded-2xl gap-3 py-3 cursor-pointer font-bold text-xs hover:bg-primary/5">
                          <PlusCircle className="h-4 w-4 text-primary" /> {p}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {filteredIntegrations.length === 0 ? (
                  <Card className="border-2 border-dashed border-border/40 shadow-none col-span-full bg-muted/5 rounded-[2.5rem]">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                      <div className="h-16 w-16 rounded-[1.5rem] bg-primary/5 flex items-center justify-center ring-1 ring-primary/10">
                        <Database className="h-8 w-8 text-primary/40" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-foreground">Sem APIs configuradas</h3>
                        <p className="text-sm text-muted-foreground">Adicione uma nova instância para gerenciar chaves e tokens.</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="rounded-2xl px-8 h-10 text-xs font-bold uppercase tracking-widest"
                        onClick={() => openNewIntegration()}
                      >
                        Configurar agora
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  filteredIntegrations.map((item) => (
                    <Card key={item.id} className="group relative overflow-hidden border-border/50 hover:border-primary/40 hover:shadow-xl transition-all duration-500 rounded-[2.25rem] bg-card/70 backdrop-blur-md shadow-sm">
                      <div className="absolute top-4 right-4 z-20">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 hover:bg-background/80 border border-border/10 bg-background/40 backdrop-blur-xl transition-all shadow-sm group-hover:border-primary/20">
                              <MoreHorizontal className="h-5 w-5 text-muted-foreground/80" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rounded-3xl p-2 shadow-2xl border-border/50 backdrop-blur-xl">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground/40 px-3 py-2 tracking-[0.2em]">Configuração</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openEditIntegration(item)} className="rounded-2xl gap-3 py-3 cursor-pointer font-bold text-xs hover:bg-primary/5">
                              <Pencil className="h-4 w-4 text-primary" /> Editar Dados
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateIntegration(item)} className="rounded-2xl gap-3 py-3 cursor-pointer font-bold text-xs hover:bg-primary/5">
                              <CopyPlus className="h-4 w-4 text-primary" /> Duplicar Instância
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-2 opacity-50" />
                            <DropdownMenuItem 
                              className="rounded-2xl gap-3 py-3 text-destructive focus:text-destructive focus:bg-destructive/5 cursor-pointer font-bold text-xs" 
                              onClick={() => handleRemoveIntegration(item.id)}
                            >
                              <Trash2 className="h-4 w-4" /> Remover Ligação
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <CardContent className="p-6 flex items-center gap-7">
                        <div className="relative shrink-0">
                          <div className="h-24 w-24 rounded-[2rem] bg-white dark:bg-zinc-900 border border-border/60 shadow-xl flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 duration-500">
                            {item.logo_url ? (
                              <img src={item.logo_url} alt="" className="h-full w-full object-contain p-3" />
                            ) : (
                              <Globe className="h-10 w-10 text-primary/10" />
                            )}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-4 border-background shadow-lg ${item.api_config?.active !== false ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        </div>

                        <div className="min-w-0 flex-1 space-y-2.5 pr-10">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[9px] h-5 px-2.5 font-black uppercase bg-primary/5 text-primary border-none tracking-[0.1em]">Cloud API</Badge>
                          </div>
                          
                          <CardTitle className="text-xl font-black truncate tracking-tight text-foreground leading-tight" title={item.instance_name}>
                            {item.instance_name}
                          </CardTitle>

                          <div className="flex flex-col gap-2">
                            {item.url_site && (
                              <div className="flex items-center gap-2 text-muted-foreground/60 font-bold text-[11px] truncate">
                                <LinkIcon className="h-3.5 w-3.5 opacity-40 shrink-0" />
                                <span className="truncate">{item.url_site.replace(/^https?:\/\//, '')}</span>
                              </div>
                            )}
                            
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {item.api_config && Object.keys(item.api_config).slice(0, 2).map((key) => (
                                <div key={key} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/30 border border-border/10 text-[9px] font-black uppercase tracking-tighter text-muted-foreground/50">
                                   <Activity className="h-2.5 w-2.5 opacity-40" />
                                   {key}
                                </div>
                              ))}
                              {item.api_config && Object.keys(item.api_config).length > 2 && (
                                <div className="text-[8px] font-black text-primary/40 pt-1">+ {Object.keys(item.api_config).length - 2}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <div className="h-1 w-full bg-gradient-to-r from-primary/30 via-transparent to-transparent opacity-40" />
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="sm:max-w-[720px] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-3xl">
          <DialogHeader className="px-10 pt-10 pb-6 bg-gradient-to-b from-primary/5 to-transparent flex flex-row items-center gap-6">
            <div className="h-16 w-16 rounded-[1.5rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/30 shrink-0 text-white">
              {editingId ? <Pencil className="h-7 w-7" /> : <Plus className="h-8 w-8" />}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-2xl font-black tracking-tight leading-none mb-2">
                {editingId ? "Configurar Instância" : "Conectar Nova API"}
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-muted-foreground/80 flex items-center gap-2">
                <Activity className="h-3 w-3 text-emerald-500" />
                Defina os parâmetros técnicos e a identidade da integração.
              </DialogDescription>
            </div>
            <button onClick={() => setIsConfigDialogOpen(false)} className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors">
              <X className="h-5 w-5 text-muted-foreground/40" />
            </button>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-10 py-4 space-y-10 pb-10">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground/50">Identidade & Visual</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr] gap-8 p-8 rounded-[2rem] bg-muted/20 border border-border/30 hover:bg-muted/30 transition-colors duration-500">
                <div className="flex flex-col items-center gap-4">
                   <div className="h-32 w-32 rounded-[2rem] bg-white dark:bg-zinc-900 border border-border shadow-xl flex items-center justify-center overflow-hidden relative group">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Preview" className="h-full w-full object-contain p-6 group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <ImageIcon className="h-12 w-12 text-muted-foreground/10" />
                      )}
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </div>
                   <Badge variant="outline" className="text-[8px] font-black uppercase rounded-full px-3 py-1 border-primary/20 text-primary/60 bg-primary/5 tracking-widest">Logo API</Badge>
                </div>
                
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground/70">Nome da Instância</Label>
                    <Input 
                      value={instanceName} 
                      onChange={e => setInstanceName(e.target.value)} 
                      placeholder="Ex: CRM Principal - São Paulo"
                      className="h-12 bg-background border-border/60 focus:ring-primary/20 rounded-2xl font-black text-lg shadow-sm"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground/70">URL do Site</Label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30" />
                        <Input 
                          value={urlSite} 
                          onChange={handleUrlChange}
                          placeholder="exemplo.com.br"
                          className="pl-12 h-11 bg-background border-border/60 focus:ring-primary/20 rounded-2xl font-bold shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground/70">Link do Logo (Opcional)</Label>
                      <div className="relative">
                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30" />
                        <Input 
                          value={logoUrl} 
                          onChange={e => setLogoUrl(e.target.value)}
                          placeholder="https://.../logo.png"
                          className="pl-12 h-11 bg-background border-border/60 focus:ring-primary/20 rounded-2xl font-mono text-[11px] shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground/50">Definições de Conexão</h3>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addField} 
                  className="rounded-full h-10 text-[10px] font-black uppercase gap-2 border-primary/20 text-primary hover:bg-primary/5 hover:border-primary transition-all px-6 shadow-md hover:shadow-primary/5"
                >
                  <Plus className="h-4 w-4" /> Novo Campo
                </Button>
              </div>

              <div className="grid gap-4">
                <div className="space-y-4">
                  {dynamicFields.map((field) => (
                    <div key={field.id} className="group/field grid grid-cols-[1fr_1fr_auto_auto] items-end gap-5 p-6 rounded-[2rem] bg-card border border-border/40 shadow-sm hover:border-primary/30 transition-all duration-300 animate-in zoom-in-95 duration-200">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em] ml-1">Chave do Parâmetro</Label>
                        <div className="relative">
                          <Database className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30" />
                          <Input 
                            value={field.key} 
                            onChange={e => updateField(field.id, { key: e.target.value })}
                            placeholder="api_key, token..."
                            className="h-11 pl-10 text-xs bg-muted/10 border-transparent focus:bg-background focus:border-border rounded-xl font-black tracking-wider transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em] ml-1">Valor Correspondente</Label>
                        <div className="relative">
                          <Input 
                            type={field.isVisible ? "text" : (field.isSecret ? "password" : "text")}
                            value={field.value} 
                            onChange={e => updateField(field.id, { value: e.target.value })}
                            placeholder="Introduza o valor..."
                            className="h-11 text-xs bg-muted/10 border-transparent focus:bg-background focus:border-border pr-12 rounded-xl font-bold transition-all"
                          />
                          {field.isSecret && (
                            <button 
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-primary transition-colors"
                              onClick={() => updateField(field.id, { isVisible: !field.isVisible })}
                            >
                              {field.isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">Privado</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className={`h-11 w-11 rounded-xl border transition-all ${field.isSecret ? 'bg-orange-500/10 border-orange-500/30 text-orange-600 shadow-sm' : 'border-border/40 text-muted-foreground/20 hover:text-foreground'}`}
                                onClick={() => updateField(field.id, { isSecret: !field.isSecret })}
                              >
                                {field.isSecret ? <Lock className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="rounded-xl border-border/50 font-bold text-[10px] uppercase">Ocultar Valor</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <Label className="text-[10px] font-black text-transparent">Remover</Label>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-11 w-11 rounded-xl text-muted-foreground/20 hover:text-destructive hover:bg-destructive/5 transition-all mb-0.5"
                          onClick={() => removeField(field.id)}
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="px-10 py-8 border-t border-border/40 bg-muted/30 flex flex-col-reverse sm:flex-row gap-4 items-center justify-end">
            <Button variant="ghost" onClick={() => setIsConfigDialogOpen(false)} className="rounded-2xl px-8 font-black h-12 text-xs uppercase tracking-widest hover:bg-muted/50 w-full sm:w-auto text-muted-foreground transition-all">
              Cancelar Operação
            </Button>
            <Button onClick={handleSaveConfig} disabled={isSaving} className="rounded-2xl gap-3 px-12 h-12 shadow-2xl shadow-primary/20 font-black tracking-tight text-sm uppercase transition-all hover:scale-[1.02] active:scale-95 w-full sm:w-auto">
              {isSaving ? <Loader2 className="animate-spin h-6 w-6" /> : <Check className="h-6 w-6" />}
              {editingId ? "Guardar Alterações" : "Ativar Integração"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}