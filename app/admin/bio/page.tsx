"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { 
  Search, 
  Plus, 
  Menu, 
  Trash2, 
  Calendar,
  Link as LinkIcon,
  Eye,
  Filter,
  Users,
  LayoutGrid,
  List as ListIcon,
  Copy,
  Library,
  MousePointer2,
  Edit3,
  ExternalLink,
  CheckCircle2,
  Activity,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Globe,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { supabase } from "@/lib/supabase"
import { Sidebar } from "@/components/central63/sidebar"
import { NotificationBell } from "@/components/central63/notification-bell"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

// ─── Mini Bio Preview Real (Clamping Total V2) ────────────────────────
function MiniBioPreview({ page }: { page: any }) {
  const url = `/bio/${page.slug}?isPreview=true`;
  
  // Constantes de hardware para clipping perfeito
  const width = 115;
  const height = 243;
  const padding = 6; 
  const screenWidth = width - (padding * 2); 
  const screenHeight = height - (padding * 2);
  
  // Escala baseada em viewport mobile de 400px
  const virtualWidth = 400;
  const scale = screenWidth / virtualWidth;
  const virtualHeight = screenHeight / scale;

  return (
    <div 
      className="relative bg-[#050505] rounded-[2.2rem] shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:-rotate-2 group/phone ring-1 ring-white/10 overflow-hidden"
      style={{ width: `${width}px`, height: `${height}px`, padding: `${padding}px` }}
    >
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-3 bg-[#050505] rounded-b-xl z-30" />
      
      {/* Tela do Celular com Clipping Reforçado */}
      <div 
        className="w-full h-full overflow-hidden rounded-[1.6rem] bg-zinc-950 relative"
        style={{ 
          maskImage: 'radial-gradient(white, black)', 
          WebkitMaskImage: '-webkit-radial-gradient(white, black)',
        }}
      >
        <iframe 
          src={url} 
          className="border-none pointer-events-none select-none absolute top-0 left-0"
          scrolling="no"
          style={{ 
            width: `${virtualWidth}px`,
            height: `${virtualHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        />
      </div>

      {/* Home Bar */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/20 rounded-full z-30" />

      {/* Camada de Vidro */}
      <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-20" />

      {/* Badge Live */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/90 backdrop-blur-md rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity z-40">
        <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
        <span className="text-[7px] font-black text-white uppercase">Live</span>
      </div>
    </div>
  );
}

export default function BioAdminPage() {
  const router = useRouter();
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  
  const [pages, setPages] = useState<any[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("bio-admin")
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      setCurrentUserId(user.id)
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      const role = profile?.role || 'Corretor'
      setUserRole(role)

      const isHighLevel = ['Diretor', 'Gestor', 'Marketing', 'Admin'].includes(role)
      
      let query = supabase
        .from("bio_pages")
        .select(`*, profiles:user_id (full_name, avatar_url)`)
        .order("created_at", { ascending: false });

      // Filtragem por papel: Corretores veem apenas os seus
      if (!isHighLevel) {
        query = query.eq('user_id', user.id)
      }

      const { data, error } = await query

      if (error) throw error
      setPages(data || [])
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchPages()
  }, [fetchPages])

  const handleEditNavigate = (id: string) => {
    setNavigatingId(id);
    router.push(`/admin/bio/edit/${id}`);
  };

  const prefetchEditor = (id: string) => {
    router.prefetch(`/admin/bio/edit/${id}`);
  };

  const handleCopyAction = (id: string, slug: string, e?: React.MouseEvent) => {
    if (e && e.stopPropagation) e.stopPropagation()
    const url = `${window.location.origin}/bio/${slug}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    toast({ title: "Copiado", description: "Link copiado para a área de transferência." })
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDeletePage = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta página?")) return
    try {
      const { error } = await supabase.from("bio_pages").delete().eq("id", id)
      if (error) throw error
      setPages(pages.filter(p => p.id !== id))
      toast({ title: "Excluído", description: "Bio removida com sucesso." })
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  }

  const filteredPages = useMemo(() => {
    return pages.filter(p => {
      const searchLower = search.toLowerCase()
      const matchesSearch = 
        p.nome?.toLowerCase().includes(searchLower) ||
        p.slug?.toLowerCase().includes(searchLower) ||
        p.profiles?.full_name?.toLowerCase().includes(searchLower)
      
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" ? (p.views_count || 0) >= 0 : false)

      return matchesSearch && matchesStatus
    })
  }, [pages, search, statusFilter])

  const stats = useMemo(() => {
    const total = pages.length
    const totalViews = pages.reduce((acc, p) => acc + (p.views_count || 0), 0)
    const active = pages.filter(p => (p.views_count || 0) > 0).length
    const leads = Math.floor(totalViews * 0.08)
    return { total, totalViews, active, leads }
  }, [pages])

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans text-foreground">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        activeTab={activeTab} 
        onTabChange={(tab) => { setActiveTab(tab); setSidebarOpen(false); }} 
      />

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative animate-in fade-in duration-700">
        
        {/* ── HEADER GLASS (Bento Style) ── */}
        <header className="h-20 shrink-0 px-8 flex items-center justify-between z-30">
          <div className="flex items-center gap-5">
            <Button variant="ghost" size="icon" className="lg:hidden rounded-xl bg-white/50 dark:bg-white/[0.02] border border-white/20" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </Button>
            
            <div className="relative flex items-center gap-4 bg-white/60 dark:bg-white/[0.02] backdrop-blur-2xl border border-white/20 dark:border-white/[0.06] px-5 py-2.5 rounded-2xl shadow-sm">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
              <div className="h-10 w-10 bg-gradient-to-br from-primary/90 to-primary/60 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <LinkIcon className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-sm font-black tracking-tight text-foreground uppercase">Links na Bio</h2>
                <div className="flex items-center gap-2 mt-0.5">
                   <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                   <span className="text-[9px] text-muted-foreground/60 font-black uppercase tracking-widest">Digital Presence Hub</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="bg-white/60 dark:bg-white/[0.02] backdrop-blur-xl border border-white/20 dark:border-white/[0.06] rounded-xl h-10 px-5 flex items-center gap-3 shadow-sm">
               <Activity className="h-3.5 w-3.5 text-primary" />
               <span className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/70">
                 {userRole} Mode
               </span>
             </div>
             <Button variant="outline" size="icon" onClick={fetchPages} className="rounded-xl border-white/20 bg-white/40 dark:bg-white/[0.02]">
               <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
             </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 pb-12">
          <div className="max-w-[1600px] mx-auto space-y-8">

            {/* ── ANALYTICS BENTO TILES ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[
                { label: 'Total Bios', value: stats.total, icon: Library, color: 'blue' },
                { label: 'Views', value: stats.totalViews.toLocaleString(), icon: Eye, color: 'amber' },
                { label: 'Ativas', value: stats.active, icon: MousePointer2, color: 'emerald' },
                { label: 'Leads Est.', value: stats.leads, icon: Users, color: 'purple' }
              ].map((stat, idx) => (
                <div key={idx} className="group relative rounded-[2rem] overflow-hidden border border-white/20 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-3xl shadow-sm p-6 transition-all hover:shadow-xl hover:-translate-y-1">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg",
                      stat.color === 'blue' ? "bg-blue-500/10 text-blue-600 shadow-blue-500/5" :
                      stat.color === 'amber' ? "bg-amber-500/10 text-amber-600 shadow-amber-500/5" :
                      stat.color === 'emerald' ? "bg-emerald-500/10 text-emerald-600 shadow-emerald-500/5" :
                      "bg-purple-500/10 text-purple-600 shadow-purple-500/5"
                    )}>
                      <stat.icon size={22} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">{stat.label}</p>
                      <p className="text-2xl font-black text-foreground tracking-tight">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── TOOLBAR GLASS ── */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-center w-full">
              <div className="flex items-center gap-2 w-full lg:flex-1 bg-white/60 dark:bg-white/[0.03] backdrop-blur-3xl p-1.5 rounded-2xl border border-white/20 dark:border-white/[0.08] shadow-sm">
                 <div className="relative flex-1 group">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={16} />
                   <Input 
                     placeholder="Procurar bios ou slugs..." 
                     className="pl-11 h-11 border-0 bg-transparent focus-visible:ring-0 w-full text-xs font-bold uppercase tracking-widest placeholder:text-muted-foreground/20"
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                   />
                 </div>
                 <div className="h-6 w-px bg-black/[0.05] dark:bg-white/[0.05] mx-1 flex-shrink-0" />
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button variant="ghost" size="sm" className="h-11 gap-2 rounded-xl text-muted-foreground/60 hover:text-foreground hover:bg-black/[0.02] dark:hover:bg-white/[0.02] flex-shrink-0 px-4">
                         <Filter size={14} className="text-primary" />
                         <span className="text-[10px] font-black uppercase tracking-widest">
                           {statusFilter === 'all' ? 'Filtro' : statusFilter === 'active' ? 'Ativas' : 'Drafts'}
                         </span>
                       </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl border-white/20 dark:border-white/[0.08] bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl">
                      <DropdownMenuItem onClick={() => setStatusFilter('all')} className="text-[10px] font-black uppercase tracking-widest py-3">Todos</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('active')} className="text-[10px] font-black uppercase tracking-widest py-3">Ativas</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('draft')} className="text-[10px] font-black uppercase tracking-widest py-3">Rascunhos</DropdownMenuItem>
                    </DropdownMenuContent>
                 </DropdownMenu>
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className="flex items-center bg-white/60 dark:bg-white/[0.03] backdrop-blur-3xl border border-white/20 dark:border-white/[0.08] rounded-2xl p-1.5 shadow-sm">
                  <Button variant="ghost" size="icon" onClick={() => setViewMode('grid')}
                    className={cn(
                      "h-10 w-10 rounded-xl transition-all",
                      viewMode === 'grid' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground/40 hover:text-foreground"
                    )}
                  >
                    <LayoutGrid size={18} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setViewMode('list')}
                    className={cn(
                      "h-10 w-10 rounded-xl transition-all",
                      viewMode === 'list' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground/40 hover:text-foreground"
                    )}
                  >
                    <ListIcon size={18} />
                  </Button>
                </div>

                <Link href="/admin/bio/new" className="flex-1 lg:flex-none">
                  <Button className="h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 w-full">
                    <Plus size={18} className="mr-2" strokeWidth={3} /> Criar Bio
                  </Button>
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Sincronizando Links...</span>
              </div>
            ) : filteredPages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center bg-white/40 dark:bg-white/[0.02] rounded-[3rem] border border-dashed border-black/10 dark:border-white/10">
                <div className="bg-primary/10 p-6 rounded-[2rem] mb-6 shadow-inner"><Globe className="text-primary/40" size={48} /></div>
                <h3 className="text-lg font-black uppercase tracking-tight text-foreground">Nada por aqui</h3>
                <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest mt-2 max-w-[280px]">Não encontramos nenhuma bio digital vinculada a sua conta.</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {viewMode === 'grid' ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
                  >
                    {filteredPages.map((page) => (
                      <motion.div 
                        key={page.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="group relative rounded-[2.5rem] overflow-hidden flex border border-white/20 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-3xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 w-full h-[420px]"
                      >
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent z-20" />
                        
                        <div className="w-[60%] p-8 flex flex-col justify-between relative z-10">
                          <div className="space-y-6">
                            <div className="flex items-center gap-4">
                              <div className="relative shrink-0">
                                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Avatar className="h-14 w-14 rounded-2xl border-2 border-white/40 dark:border-white/10 shadow-lg relative z-10 group-hover:scale-110 transition-transform duration-500">
                                  <AvatarImage src={page.foto_url} className="object-cover" style={{ objectPosition: page.tema?.foto_posicao || 'center' }} />
                                  <AvatarFallback className="text-xs font-black bg-primary/10 text-primary">{page.nome?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-blue-500 rounded-lg flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-sm z-20">
                                  <CheckCircle2 size={10} className="text-white" />
                                </div>
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-black text-foreground text-sm tracking-tight truncate mb-1">{page.nome}</h3>
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                  <span className="text-[8px] font-black uppercase tracking-widest">/{page.slug}</span>
                                </div>
                              </div>
                            </div>

                            <div className="grid gap-3">
                              <div className="flex items-center justify-between p-4 bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl border border-black/[0.04] dark:border-white/[0.04] group/tile transition-all hover:bg-white dark:hover:bg-white/[0.06]">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm text-amber-500 group-hover/tile:scale-110 transition-transform">
                                    <Eye size={14} />
                                  </div>
                                  <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Alcance</span>
                                </div>
                                <p className="text-sm font-black text-foreground">{(page.views_count || 0).toLocaleString()}</p>
                              </div>

                              <div className="flex items-center justify-between p-4 bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl border border-black/[0.04] dark:border-white/[0.04] group/tile transition-all hover:bg-white dark:hover:bg-white/[0.06]">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm text-purple-500 group-hover/tile:scale-110 transition-transform">
                                    <Calendar size={14} />
                                  </div>
                                  <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Desde</span>
                                </div>
                                <p className="text-[11px] font-black text-foreground/70">{new Date(page.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex gap-2.5">
                              <button onClick={(e) => handleCopyAction(page.id, page.slug, e)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/40 dark:bg-white/5 hover:bg-primary/5 hover:text-primary text-muted-foreground/60 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all border border-black/[0.04] dark:border-white/[0.04] active:scale-95">
                                <LinkIcon size={12} className={cn(copiedId === page.id && "text-green-500")} /> {copiedId === page.id ? 'Pronto' : 'Link'}
                              </button>
                              <button onClick={() => window.open(`/bio/${page.slug}`, '_blank')} className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/40 dark:bg-white/5 hover:bg-blue-500/5 hover:text-blue-500 text-muted-foreground/60 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all border border-black/[0.04] dark:border-white/[0.04] active:scale-95">
                                <ArrowUpRight size={12} /> Visitar
                              </button>
                              <button onClick={() => handleDeletePage(page.id)} className="h-10 w-10 flex items-center justify-center bg-rose-500/5 hover:bg-rose-500 hover:text-white text-rose-500 rounded-xl transition-all border border-rose-500/20 active:scale-90 shadow-inner">
                                <Trash2 size={12} />
                              </button>
                            </div>
                            
                            <div onMouseEnter={() => prefetchEditor(page.id)}>
                              <button 
                                onClick={() => handleEditNavigate(page.id)}
                                disabled={navigatingId === page.id}
                                className={cn(
                                  "w-full flex items-center justify-center gap-3 h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed",
                                  navigatingId === page.id 
                                    ? "bg-zinc-800 text-white" 
                                    : "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
                                )}
                              >
                                {navigatingId === page.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Abrindo Painel...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles size={14} className="animate-pulse" /> Customizar Bio
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="w-[40%] bg-zinc-100 dark:bg-black/40 flex items-center justify-center relative overflow-hidden border-l border-black/[0.04] dark:border-white/[0.04]">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(var(--primary),0.1),transparent)]" />
                          <MiniBioPreview page={page} />
                          <div className="absolute bottom-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
                            <span className="text-[8px] font-black text-foreground/40 uppercase tracking-[0.3em]">Ambiente Live</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[2.5rem] overflow-hidden border border-white/20 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-3xl shadow-xl"
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
                    <Table>
                      <TableHeader>
                        <TableRow className="border-black/[0.04] dark:border-white/[0.04] bg-black/[0.02] dark:bg-white/[0.01]">
                          <TableHead className="h-14 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground/40 pl-8">Proprietário / Hub</TableHead>
                          <TableHead className="h-14 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground/40">Sincronização</TableHead>
                          <TableHead className="h-14 text-center font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground/40">Métricas</TableHead>
                          <TableHead className="h-14 hidden md:table-cell font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground/40">Criado em</TableHead>
                          <TableHead className="h-14 text-right font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground/40 pr-8">Configurações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPages.map((page) => (
                          <TableRow key={page.id} className="group border-black/[0.04] dark:border-white/[0.04] hover:bg-white dark:hover:bg-white/[0.02] transition-colors">
                            <TableCell className="pl-8 py-5">
                              <div className="flex items-center gap-4">
                                <Avatar className="h-11 w-11 rounded-xl border border-white/40 dark:border-white/10 shadow-sm">
                                  <AvatarImage src={page.foto_url} className="object-cover" style={{ objectPosition: page.tema?.foto_posicao || 'center' }} />
                                  <AvatarFallback className="text-[10px] font-black bg-primary/10 text-primary">{page.nome?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="font-black text-sm text-foreground tracking-tight">{page.nome}</span>
                                  <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">{page.profiles?.full_name || 'Agente Flow63'}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                <Globe size={10} />
                                <span className="text-[9px] font-black uppercase tracking-[0.1em]">bio/{page.slug}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center">
                                <span className="font-black text-sm text-foreground">{(page.views_count || 0).toLocaleString()}</span>
                                <span className="text-[8px] uppercase font-black text-muted-foreground/30 tracking-[0.2em]">Interações</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                               <span className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                                 {new Date(page.created_at).toLocaleDateString('pt-BR')}
                               </span>
                            </TableCell>
                            <TableCell className="text-right pr-8">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground/40 hover:text-primary hover:bg-primary/5 rounded-xl transition-all" onClick={() => handleEditNavigate(page.id)}>
                                  <Edit3 size={16} />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground/40 hover:text-blue-500 hover:bg-blue-500/5 rounded-xl transition-all" onClick={(e) => handleCopyAction(page.id, page.slug, e)}>
                                  <Copy size={16} />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/5 rounded-xl transition-all" onClick={() => handleDeletePage(page.id)}>
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
