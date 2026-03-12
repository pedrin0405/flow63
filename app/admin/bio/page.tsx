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

// ─── Mini Bio Preview Real (Clamping Total V2 + Glass) ────────────────────────
function MiniBioPreview({ page }: { page: any }) {
  const url = `/bio/${page.slug}?isPreview=true`;
  
  const width = 115;
  const height = 243;
  const padding = 6; 
  const screenWidth = width - (padding * 2); 
  const screenHeight = height - (padding * 2);
  
  const virtualWidth = 400;
  const scale = screenWidth / virtualWidth;
  const virtualHeight = screenHeight / scale;

  return (
    <div 
      className="relative bg-zinc-900/80 dark:bg-[#050505]/90 backdrop-blur-2xl rounded-[2.2rem] shadow-[0_20px_40px_rgba(0,0,0,0.15)] transition-all duration-700 group-hover:scale-110 group-hover:-rotate-2 group/phone ring-1 ring-white/20 dark:ring-white/10 overflow-hidden"
      style={{ width: `${width}px`, height: `${height}px`, padding: `${padding}px` }}
    >
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-3 bg-zinc-900 dark:bg-[#050505] rounded-b-xl z-30 flex justify-center items-end pb-[2px]">
        <div className="w-1 h-1 rounded-full bg-white/10" />
      </div>
      
      {/* Tela do Celular */}
      <div 
        className="w-full h-full overflow-hidden rounded-[1.6rem] bg-zinc-950 relative border border-white/5"
        style={{ 
          maskImage: 'radial-gradient(white, black)', 
          WebkitMaskImage: '-webkit-radial-gradient(white, black)',
        }}
      >
        <iframe 
          src={url} 
          className="border-none pointer-events-none select-none absolute top-0 left-0 transition-opacity duration-500"
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
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/30 rounded-full z-30" />

      {/* Camada de Vidro Reflexivo (Apple effect) */}
      <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-tr from-white/20 via-white/5 to-transparent opacity-30 mix-blend-overlay" />

      {/* Badge Live */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/80 backdrop-blur-md rounded-full border border-white/30 opacity-0 group-hover:opacity-100 transition-opacity z-40 shadow-lg">
        <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
        <span className="text-[7px] font-black text-white uppercase drop-shadow-md">Live</span>
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
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans text-foreground relative">
      
      {/* ── BACKGROUND APPLE GLASS (Gradients & Blobs) ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-blue-400/10 dark:bg-blue-600/10 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-purple-400/10 dark:bg-purple-600/10 blur-[120px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[40vw] rounded-full bg-emerald-400/5 dark:bg-emerald-600/5 blur-[120px]" />
      </div>

      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        activeTab={activeTab} 
        onTabChange={(tab) => { setActiveTab(tab); setSidebarOpen(false); }} 
      />

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative z-10 animate-in fade-in duration-700">
        
        {/* ── HEADER GLASS ── */}
        <header className="h-24 shrink-0 px-8 flex items-center justify-between z-30">
          <div className="flex items-center gap-5">
            <Button variant="ghost" size="icon" className="lg:hidden rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </Button>
            
            <div className="relative flex items-center gap-4 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 px-6 py-3 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
              <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/70 rounded-[1.2rem] flex items-center justify-center shadow-lg shadow-primary/30 border border-white/20">
                <LinkIcon className="text-white" size={22} />
              </div>
              <div>
                <h2 className="text-sm font-black tracking-tight text-foreground uppercase">Links na Bio</h2>
                <div className="flex items-center gap-2 mt-1">
                   <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                   <span className="text-[10px] text-muted-foreground/70 font-black uppercase tracking-[0.2em]">Digital Presence Hub</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-2xl h-12 px-6 flex items-center gap-3 shadow-sm">
               <Activity className="h-4 w-4 text-primary" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">
                 {userRole} Mode
               </span>
             </div>
             <Button variant="outline" size="icon" onClick={fetchPages} className="h-12 w-12 rounded-2xl border-white/50 dark:border-white/10 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl shadow-sm hover:bg-white/60 dark:hover:bg-white/10 transition-all">
               <RefreshCw size={20} className={loading ? "animate-spin text-primary" : "text-foreground/70"} />
             </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 pb-12 scrollbar-thin scrollbar-thumb-white/20">
          <div className="max-w-[1600px] mx-auto space-y-8">

            {/* ── ANALYTICS GLASS BENTO TILES ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Bios', value: stats.total, icon: Library, color: 'blue' },
                { label: 'Views', value: stats.totalViews.toLocaleString(), icon: Eye, color: 'amber' },
                { label: 'Ativas', value: stats.active, icon: MousePointer2, color: 'emerald' },
                { label: 'Leads Est.', value: stats.leads, icon: Users, color: 'purple' }
              ].map((stat, idx) => (
                <div key={idx} className="group relative rounded-[2.5rem] overflow-hidden border border-white/50 dark:border-white/10 bg-white/30 dark:bg-zinc-900/30 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] p-7 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent dark:from-white/5 opacity-50 pointer-events-none" />
                  <div className="flex items-center gap-5 relative z-10">
                    <div className={cn(
                      "h-14 w-14 rounded-[1.2rem] flex items-center justify-center transition-transform duration-500 group-hover:scale-110 shadow-lg border border-white/40 dark:border-white/10 backdrop-blur-md",
                      stat.color === 'blue' ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 shadow-blue-500/10" :
                      stat.color === 'amber' ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-amber-500/10" :
                      stat.color === 'emerald' ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/10" :
                      "bg-purple-500/15 text-purple-600 dark:text-purple-400 shadow-purple-500/10"
                    )}>
                      <stat.icon size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 mb-1.5">{stat.label}</p>
                      <p className="text-3xl font-black text-foreground tracking-tighter">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── TOOLBAR GLASS ── */}
            <div className="flex flex-col lg:flex-row gap-5 justify-between items-center w-full">
              <div className="flex items-center gap-2 w-full lg:flex-1 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl p-2 rounded-[2rem] border border-white/50 dark:border-white/10 shadow-sm">
                 <div className="relative flex-1 group">
                   <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors" size={18} />
                   <Input 
                     placeholder="Procurar bios ou slugs..." 
                     className="pl-14 h-12 border-0 bg-transparent focus-visible:ring-0 w-full text-xs font-bold uppercase tracking-widest placeholder:text-muted-foreground/40"
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                   />
                 </div>
                 <div className="h-8 w-px bg-black/10 dark:bg-white/10 mx-2 flex-shrink-0" />
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button variant="ghost" className="h-12 gap-2.5 rounded-[1.5rem] text-muted-foreground/80 hover:text-foreground hover:bg-white/50 dark:hover:bg-white/10 flex-shrink-0 px-6 transition-all">
                         <Filter size={16} className="text-primary" />
                         <span className="text-[10px] font-black uppercase tracking-[0.15em]">
                           {statusFilter === 'all' ? 'Filtro' : statusFilter === 'active' ? 'Ativas' : 'Drafts'}
                         </span>
                       </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-[1.5rem] border-white/40 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl p-2 shadow-xl">
                      <DropdownMenuItem onClick={() => setStatusFilter('all')} className="text-[10px] font-black uppercase tracking-widest py-3 px-4 rounded-xl cursor-pointer">Todos</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('active')} className="text-[10px] font-black uppercase tracking-widest py-3 px-4 rounded-xl cursor-pointer">Ativas</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('draft')} className="text-[10px] font-black uppercase tracking-widest py-3 px-4 rounded-xl cursor-pointer">Rascunhos</DropdownMenuItem>
                    </DropdownMenuContent>
                 </DropdownMenu>
              </div>

              <div className="flex items-center gap-4 w-full lg:w-auto">
                <div className="flex items-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-[1.8rem] p-1.5 shadow-sm">
                  <Button variant="ghost" size="icon" onClick={() => setViewMode('grid')}
                    className={cn(
                      "h-11 w-12 rounded-[1.4rem] transition-all",
                      viewMode === 'grid' ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-muted-foreground/60 hover:text-foreground hover:bg-white/50 dark:hover:bg-white/10"
                    )}
                  >
                    <LayoutGrid size={18} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setViewMode('list')}
                    className={cn(
                      "h-11 w-12 rounded-[1.4rem] transition-all",
                      viewMode === 'list' ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-muted-foreground/60 hover:text-foreground hover:bg-white/50 dark:hover:bg-white/10"
                    )}
                  >
                    <ListIcon size={18} />
                  </Button>
                </div>

                <Link href="/admin/bio/new" className="flex-1 lg:flex-none">
                  <Button className="h-14 px-8 rounded-[1.8rem] bg-primary hover:bg-primary/90 text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_8px_20px_rgba(var(--primary),0.3)] border border-white/20 transition-all hover:-translate-y-0.5 active:translate-y-0 w-full relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <Plus size={18} className="mr-2" strokeWidth={3} /> Criar Bio
                  </Button>
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-6">
                <Loader2 className="animate-spin text-primary" size={48} />
                <span className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/50">Sincronizando Links...</span>
              </div>
            ) : filteredPages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-40 text-center bg-white/30 dark:bg-zinc-900/30 backdrop-blur-xl rounded-[3rem] border border-dashed border-black/10 dark:border-white/10 shadow-sm">
                <div className="bg-primary/10 p-6 rounded-[2rem] mb-6 shadow-inner"><Globe className="text-primary/50" size={56} /></div>
                <h3 className="text-xl font-black uppercase tracking-tight text-foreground">Nada por aqui</h3>
                <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest mt-3 max-w-[300px]">Não encontramos nenhuma bio digital vinculada a sua conta.</p>
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
                        className="group relative rounded-[2.5rem] overflow-hidden flex border border-white/60 dark:border-white/10 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.15)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.1)] hover:-translate-y-2 transition-all duration-500 w-full h-[360px]"
                      >
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent z-20" />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-50 pointer-events-none z-0" />
                        
                        {/* Seção Esquerda (Conteúdo) */}
                        <div className="w-[60%] p-6 flex flex-col justify-between relative z-10">
                          
                          <div className="space-y-4">
                            <div className="flex items-center gap-4">
                              <div className="relative shrink-0">
                                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <Avatar className="h-14 w-14 rounded-2xl border-2 border-white/60 dark:border-white/10 shadow-lg relative z-10 group-hover:scale-105 transition-transform duration-500">
                                  <AvatarImage src={page.foto_url} className="object-cover" style={{ objectPosition: page.tema?.foto_posicao || 'center' }} />
                                  <AvatarFallback className="text-sm font-black bg-primary/10 text-primary">{page.nome?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-blue-500 rounded-lg flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-sm z-20">
                                  <CheckCircle2 size={10} className="text-white" />
                                </div>
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-black text-foreground text-[15px] tracking-tight truncate mb-1">{page.nome}</h3>
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 backdrop-blur-sm">
                                  <span className="text-[8px] font-black uppercase tracking-[0.1em]">/{page.slug}</span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1 p-3 bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-2xl border border-white/50 dark:border-white/5 transition-all">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                                    <Eye size={10} />
                                  </div>
                                  <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest">Alcance</span>
                                </div>
                                <p className="text-sm font-black text-foreground ml-1">{(page.views_count || 0).toLocaleString()}</p>
                              </div>

                              <div className="flex flex-col gap-1 p-3 bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-2xl border border-white/50 dark:border-white/5 transition-all">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500">
                                    <Calendar size={10} />
                                  </div>
                                  <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest">Desde</span>
                                </div>
                                <p className="text-[11px] font-black text-foreground/80 truncate ml-1">{new Date(page.created_at).toLocaleDateString('pt-BR')}</p>
                              </div>
                            </div>

                            {/* Botões Secundários (Copiar e Excluir mantidos!) */}
                            <div className="grid grid-cols-2 gap-3">
                              <button 
                                onClick={(e) => handleCopyAction(page.id, page.slug, e)} 
                                className="flex-1 flex items-center justify-center gap-2 h-10 bg-amber-500/5 hover:bg-amber-500/15 text-amber-600 dark:text-amber-500 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border border-amber-500/20 backdrop-blur-md active:scale-95 shadow-sm"
                              >
                                {copiedId === page.id ? <CheckCircle2 size={14} className="text-green-500" /> : <LinkIcon size={14} />}
                               <span>{copiedId === page.id ? 'Copiado' : 'Link'}</span>
                              </button>
                              <button 
                                onClick={() => handleDeletePage(page.id)} 
                                className="flex-1 flex items-center justify-center gap-2 h-10 bg-rose-500/5 hover:bg-rose-500/15 text-rose-500 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border border-rose-500/20 backdrop-blur-md active:scale-95 shadow-sm"
                              >
                                <Trash2 size={14} />
                                <span>Excluir</span>
                              </button>
                            </div>
                          </div>

                          {/* Botões Principais de Ação (Mantidos!) */}
                          <div className="space-y-3 mt-auto">
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={(e) => { e.stopPropagation(); router.push(`/admin/bio/insights/${page.id}`); }} 
                                className="flex-1 flex items-center justify-center gap-2 h-11 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 text-foreground/70 rounded-[1.2rem] text-[9px] font-black uppercase tracking-wider transition-all border border-white/50 dark:border-white/10 backdrop-blur-md active:scale-95 shadow-sm"
                              >
                                <Activity size={14} />
                                <span>Insights</span>
                              </button>

                              <button 
                                onClick={() => window.open(`/bio/${page.slug}`, '_blank')} 
                                className="flex-1 flex items-center justify-center gap-2 h-11 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 text-foreground/70 rounded-[1.2rem] text-[9px] font-black uppercase tracking-wider transition-all border border-white/50 dark:border-white/10 backdrop-blur-md active:scale-95 shadow-sm"
                              >
                                <ArrowUpRight size={14} />
                                <span>Visitar</span>
                              </button>
                            </div>
                            
                            <div onMouseEnter={() => prefetchEditor(page.id)}>
                              <button 
                                onClick={() => handleEditNavigate(page.id)}
                                disabled={navigatingId === page.id}
                                className={cn(
                                  "w-full flex items-center justify-center gap-2 h-12 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden",
                                  navigatingId === page.id 
                                    ? "bg-zinc-800 text-white" 
                                    : "bg-primary hover:bg-primary/90 text-white shadow-primary/20 border border-white/20"
                                )}
                              >
                                {navigatingId === page.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Painel...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles size={14} className="animate-pulse" /> Customizar
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Seção Direita (Preview Mobile) */}
                        <div className="w-[40%] bg-white/20 dark:bg-black/20 flex items-center justify-center relative overflow-hidden border-l border-white/40 dark:border-white/5 backdrop-blur-sm">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(var(--primary),0.15),transparent)]" />
                          <MiniBioPreview page={page} />
                          <div className="absolute bottom-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 bg-white/40 dark:bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
                            <span className="text-[8px] font-black text-foreground/70 uppercase tracking-[0.2em]">Ambiente Live</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[2.5rem] overflow-hidden border border-white/50 dark:border-white/10 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] p-2"
                  >
                    <div className="rounded-[2rem] overflow-hidden bg-white/40 dark:bg-black/20">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-black/5 dark:border-white/5 hover:bg-transparent">
                            <TableHead className="h-16 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground/60 pl-8">Proprietário / Hub</TableHead>
                            <TableHead className="h-16 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground/60">Sincronização</TableHead>
                            <TableHead className="h-16 text-center font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground/60">Métricas</TableHead>
                            <TableHead className="h-16 hidden md:table-cell font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground/60">Criado em</TableHead>
                            <TableHead className="h-16 text-right font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground/60 pr-8">Configurações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPages.map((page) => (
                            <TableRow key={page.id} className="group border-b border-black/5 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/5 transition-colors duration-300">
                              <TableCell className="pl-8 py-5">
                                <div className="flex items-center gap-4">
                                  <Avatar className="h-12 w-12 rounded-2xl border-2 border-white/80 dark:border-white/10 shadow-sm transition-transform group-hover:scale-105">
                                    <AvatarImage src={page.foto_url} className="object-cover" style={{ objectPosition: page.tema?.foto_posicao || 'center' }} />
                                    <AvatarFallback className="text-[10px] font-black bg-primary/10 text-primary">{page.nome?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span className="font-black text-sm text-foreground tracking-tight">{page.nome}</span>
                                    <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">{page.profiles?.full_name || 'Agente Flow63'}</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 backdrop-blur-sm">
                                  <Globe size={12} />
                                  <span className="text-[9px] font-black uppercase tracking-[0.1em]">bio/{page.slug}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center">
                                  <span className="font-black text-sm text-foreground">{(page.views_count || 0).toLocaleString()}</span>
                                  <span className="text-[8px] uppercase font-black text-muted-foreground/50 tracking-[0.2em]">Interações</span>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                 <span className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                                   {new Date(page.created_at).toLocaleDateString('pt-BR')}
                                 </span>
                              </TableCell>
                              <TableCell className="text-right pr-8">
                                <div className="flex items-center justify-end gap-2">
                                  <Button variant="ghost" size="icon" className="h-11 w-11 text-muted-foreground/60 hover:text-primary hover:bg-primary/10 rounded-[1.2rem] transition-all bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/50 dark:border-white/5" onClick={() => handleEditNavigate(page.id)}>
                                    <Edit3 size={16} />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-11 w-11 text-muted-foreground/60 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 rounded-[1.2rem] transition-all bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/50 dark:border-white/5" onClick={(e) => handleCopyAction(page.id, page.slug, e)}>
                                    <Copy size={16} />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-11 w-11 text-rose-500/60 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-[1.2rem] transition-all bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/50 dark:border-white/5" onClick={() => handleDeletePage(page.id)}>
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
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