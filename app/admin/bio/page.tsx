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
  MoreHorizontal,
  Check,
  Library,
  MousePointer2,
  Edit2,
  Edit3,
  ExternalLink,
  Share2,
  ShieldCheck,
  Zap,
  MoreVertical,
  ChevronRight,
  Sparkles,
  Smartphone,
  CheckCircle2,
  ArrowUpRight
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
  const padding = 6; // Aumentado levemente para selar melhor
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
          maskImage: 'radial-gradient(white, black)', // Força o hardware a respeitar o border-radius
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
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("bio_pages")
        .select(`*, profiles:user_id (full_name, avatar_url)`)
        .order("created_at", { ascending: false });

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
    <div className="flex h-screen bg-[#FAFAFA] dark:bg-background overflow-hidden font-sans text-foreground">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        activeTab={activeTab} 
        onTabChange={(tab) => { setActiveTab(tab); setSidebarOpen(false); }} 
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-sm flex-shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-muted-foreground hover:bg-accent rounded-lg" onClick={() => setSidebarOpen(true)}><Menu /></button>
            <LinkIcon className="text-primary hidden lg:block" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Links na Bio</h2>
            <p className="text-primary hidden sm:block" >| Member Bios</p>
          </div>
          <NotificationBell />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-8 pb-20">

            {/* Dashboard Analítico */}
            <div className="bg-white dark:bg-card rounded-2xl border shadow-sm p-1 grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100 dark:divide-gray-800">
              <div className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Library size={20} /></div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total de Bios</p>
                  <p className="text-xl font-bold tracking-tight">{stats.total}</p>
                </div>
              </div>
              <div className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Eye size={20} /></div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Visualizações</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl font-bold tracking-tight">{stats.totalViews.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><MousePointer2 size={20} /></div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Páginas Ativas</p>
                  <p className="text-xl font-bold tracking-tight">{stats.active}</p>
                </div>
              </div>
              <div className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><Users size={20} /></div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Leads</p>
                  <p className="text-xl font-bold tracking-tight">{stats.leads}</p>
                </div>
              </div>
            </div>

            {/* Toolbar Principal */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center w-full">
              <div className="flex items-center gap-2 w-full md:flex-1 bg-white dark:bg-card p-1 rounded-xl border shadow-sm">
                 <div className="relative flex-1">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                   <Input 
                     placeholder="Buscar por nome, slug ou corretor..." 
                     className="pl-9 h-10 border-0 bg-transparent focus-visible:ring-0 w-full font-medium"
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                   />
                 </div>
                 <div className="h-6 w-px bg-border mx-1 flex-shrink-0" />
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground hover:text-foreground flex-shrink-0">
                         <Filter size={14} />
                         <span className="text-xs font-medium hidden sm:inline-block">
                           {statusFilter === 'all' ? 'Status' : statusFilter === 'active' ? 'Ativas' : 'Rascunhos'}
                         </span>
                       </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setStatusFilter('all')}>Todos</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('active')}>Ativas</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('draft')}>Rascunhos</DropdownMenuItem>
                    </DropdownMenuContent>
                 </DropdownMenu>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto flex-shrink-0">
                <div className="flex items-center bg-white dark:bg-card border rounded-xl p-1 shadow-sm flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => setViewMode('grid')}
                    className={`h-9 w-9 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-zinc-800 text-foreground shadow-sm' : 'text-muted-foreground'}`}
                  >
                    <LayoutGrid size={18} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setViewMode('list')}
                    className={`h-9 w-9 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 dark:bg-zinc-800 text-foreground shadow-sm' : 'text-muted-foreground'}`}
                  >
                    <ListIcon size={18} />
                  </Button>
                </div>

                <Link href="/admin/bio/new" className="flex-1 md:flex-none">
                  <Button className="h-11 px-6 font-bold bg-primary text-white shadow-lg hover:bg-primary/90 rounded-xl w-full">
                    <Plus size={18} className="mr-2" strokeWidth={3} /> Nova Bio
                  </Button>
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : filteredPages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="bg-gray-50 p-4 rounded-full mb-3"><LinkIcon className="text-gray-300" size={32} /></div>
                <p className="text-muted-foreground font-medium">Nenhuma bio encontrada.</p>
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredPages.map((page) => (
                      <motion.div 
                        key={page.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden flex shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 w-full group h-[380px]"
                      >
                        <div className="w-[62%] p-6 flex flex-col justify-between relative bg-white dark:bg-zinc-900 z-10">
                          <div className="space-y-5">
                            <div className="flex items-center gap-3">
                              <div className="relative flex-shrink-0">
                                <img 
                                  src={page.foto_url || "/placeholder-user.jpg"} 
                                  className="w-12 h-12 rounded-2xl object-cover border border-slate-100 dark:border-white/5 shadow-sm transition-transform group-hover:scale-105" 
                                  alt={page.nome} 
                                  style={{ objectPosition: page.tema?.foto_posicao || 'center' }}
                                />
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900">
                                  <CheckCircle2 size={10} className="text-white" />
                                </div>
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight truncate">{page.nome}</h3>
                                <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider truncate">/{page.slug}</p>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/[0.03] rounded-2xl border border-slate-100/50 dark:border-white/5">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center shadow-sm">
                                    <Eye size={12} className="text-slate-400 dark:text-blue-400" />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-tighter">Views</span>
                                </div>
                                <p className="text-sm font-black text-slate-800 dark:text-white">{(page.views_count || 0).toLocaleString()}</p>
                              </div>

                              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/[0.03] rounded-2xl border border-slate-100/50 dark:border-white/5">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center shadow-sm">
                                    <Calendar size={12} className="text-slate-400 dark:text-purple-400" />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-tighter">Criada</span>
                                </div>
                                <p className="text-[11px] font-bold text-slate-800 dark:text-white/80">{new Date(page.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <button onClick={(e) => handleCopyAction(page.id, page.slug, e)} className="flex-[2] flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-white/70 rounded-xl text-[10px] font-bold transition-all border border-slate-100 dark:border-white/5">
                                <LinkIcon size={12} className={cn(copiedId === page.id && "text-green-500")} /> {copiedId === page.id ? 'Pronto' : 'Link'}
                              </button>
                              <button onClick={() => window.open(`/bio/${page.slug}`, '_blank')} className="flex-[2] flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-white/70 rounded-xl text-[10px] font-bold transition-all border border-slate-100 dark:border-white/5">
                                <ExternalLink size={12} /> Bio
                              </button>
                              <button onClick={() => handleDeletePage(page.id)} className="flex-1 flex items-center justify-center bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl transition-all border border-red-100 dark:border-red-500/20 shadow-sm">
                                <Trash2 size={12} />
                              </button>
                            </div>
                            
                            <div onMouseEnter={() => prefetchEditor(page.id)}>
                              <button 
                                onClick={() => handleEditNavigate(page.id)}
                                disabled={navigatingId === page.id}
                                className={cn(
                                  "w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[11px] font-black transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed",
                                  navigatingId === page.id 
                                    ? "bg-zinc-800 text-white" 
                                    : "bg-slate-900 dark:bg-[#e91c74] hover:bg-black dark:hover:bg-[#d01866] text-white shadow-slate-200 dark:shadow-none"
                                )}
                              >
                                {navigatingId === page.id ? (
                                  <>
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Abrindo...
                                  </>
                                ) : (
                                  <>
                                    <Edit3 size={14} /> Editar Perfil
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="w-[38%] bg-slate-50 dark:bg-zinc-950 flex items-center justify-center relative overflow-hidden border-l border-slate-100 dark:border-white/5">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 dark:from-blue-900/10 to-transparent"></div>
                          <MiniBioPreview page={page} />
                          <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                            <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Live</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-card rounded-2xl border shadow-sm overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                          <TableHead className="font-bold uppercase text-[10px] tracking-widest opacity-50">Corretor / Página</TableHead>
                          <TableHead className="font-bold uppercase text-[10px] tracking-widest opacity-50">Slug</TableHead>
                          <TableHead className="text-center font-bold uppercase text-[10px] tracking-widest opacity-50">Performance</TableHead>
                          <TableHead className="hidden md:table-cell font-bold uppercase text-[10px] tracking-widest opacity-50">Responsável</TableHead>
                          <TableHead className="hidden md:table-cell font-bold uppercase text-[10px] tracking-widest opacity-50">Data</TableHead>
                          <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest opacity-50">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPages.map((page) => (
                          <TableRow key={page.id} className="group cursor-pointer hover:bg-gray-50/50 transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={page.foto_url} className="object-cover" style={{ objectPosition: page.tema?.foto_posicao || 'center' }} />
                                  <AvatarFallback className="text-[10px] font-bold">{page.nome?.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <span className="font-bold text-sm text-foreground">{page.nome}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-blue-600 font-bold">/{page.slug}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center">
                                <span className="font-bold text-sm">{(page.views_count || 0).toLocaleString()}</span>
                                <span className="text-[9px] uppercase font-black opacity-30 tracking-widest">Views</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={page.profiles?.avatar_url} />
                                  <AvatarFallback className="text-[8px]">{page.profiles?.full_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{page.profiles?.full_name || 'Central63'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground hidden md:table-cell font-medium">
                              {new Date(page.created_at).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Link href={`/admin/bio/edit/${page.id}`}>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-blue-600 rounded-xl">
                                    <Edit2 size={16} />
                                  </Button>
                                </Link>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-[#e91c74] rounded-xl" onClick={(e) => handleCopyAction(page.id, page.slug, e)}>
                                  <Copy size={16} />
                                </Button>
                                <Link href={`/bio/${page.slug}`} target="_blank">
                                  <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-emerald-600 rounded-xl">
                                    <ExternalLink size={16} />
                                  </Button>
                                </Link>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-red-600 rounded-xl" onClick={() => handleDeletePage(page.id)}>
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
