"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { 
  Bell, Send, Trash2, Loader2, Megaphone, Pencil, 
  X, Check, Clock, Sparkles, ChevronRight, Info,
  Search, Calendar, Globe, Zap, History
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

// ─── Sub-Componente de Card de Comunicado (Apple Glass) ───────────────────
function BroadcastCard({ item, onEdit, onDelete }: any) {
  const date = new Date(item.updated_at || item.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className={cn(
      "group relative rounded-[1.75rem] overflow-hidden transition-all duration-500",
      "border border-white/20 dark:border-white/[0.06]",
      "bg-white/60 dark:bg-white/[0.03] backdrop-blur-2xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)] hover:-translate-y-0.5"
    )}>
      {/* Glass refraction top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />

      <div className="relative p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] bg-primary/10 text-primary border border-primary/20">
            <Globe className="h-3 w-3" />
            Global Interno
          </div>
          
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(item)}
              className="h-8 w-8 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-primary hover:text-white flex items-center justify-center transition-all border border-black/[0.06] dark:border-white/[0.08]"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="h-8 w-8 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all border border-black/[0.06] dark:border-white/[0.08]"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <p className="text-[13px] font-bold text-foreground/80 leading-relaxed mb-4 line-clamp-3">
          {item.url_site}
        </p>

        <div className="flex items-center gap-3 pt-4 border-t border-black/[0.04] dark:border-white/[0.04]">
          <div className="flex items-center gap-1.5">
            <Calendar size={11} className="text-muted-foreground/40" />
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">{date}</span>
          </div>
          <div className="h-1 w-1 rounded-full bg-muted-foreground/20" />
          <div className="flex items-center gap-1.5">
            <Clock size={11} className="text-muted-foreground/40" />
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Ativo</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BroadcastTab() {
  const [message, setMessage] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [broadcasts, setBroadcasts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchBroadcasts = async () => {
    setIsLoading(true)
    try {
      const { data } = await supabase
        .from('company_settings')
        .select('*')
        .eq('instance_name', 'GLOBAL_BROADCAST')
        .order('id', { ascending: false })
      setBroadcasts(data || [])
    } catch (err) {
      console.error("Erro ao buscar comunicados:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchBroadcasts() }, [])

  const filteredBroadcasts = useMemo(() => {
    return broadcasts.filter(b => 
      b.url_site?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [broadcasts, searchTerm])

  const handleSave = async () => {
    if (!message.trim()) return toast.error("A mensagem não pode estar vazia")
    setIsSaving(true)
    try {
      const now = new Date().toISOString()
      const apiConfig = { active: true, updatedAt: now }
      let error
      if (editingId) {
        const res = await supabase.from('company_settings').update({ url_site: message, api_config: apiConfig }).eq('id', editingId)
        error = res.error
      } else {
        const res = await supabase.from('company_settings').insert([{ instance_name: 'GLOBAL_BROADCAST', url_site: message, api_config: apiConfig }])
        error = res.error
      }
      if (error) throw error
      toast.success(editingId ? "Comunicado atualizado!" : "Comunicado disparado!")
      setMessage(""); setEditingId(null); await fetchBroadcasts()
    } catch (error: any) {
      toast.error("Erro ao salvar: " + (error.message || "Erro de conexão"))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja excluir este comunicado?")) return
    try {
      const { error } = await supabase.from('company_settings').delete().eq('id', id)
      if (error) throw error
      toast.success("Comunicado removido"); fetchBroadcasts()
    } catch (error: any) { toast.error("Erro ao remover") }
  }

  const startEdit = (broadcast: any) => {
    setEditingId(broadcast.id)
    setMessage(broadcast.url_site)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5 animate-in fade-in duration-500 pb-16">
      
      {/* ── BENTO HEADER ─────────────────────────────────────────── */}
      <div className="relative rounded-[2rem] overflow-hidden border border-white/20 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.02] backdrop-blur-2xl shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 dark:via-white/30 to-transparent" />

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/90 to-primary/60 shadow-lg shadow-primary/20 flex items-center justify-center shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent to-white/20" />
              <Megaphone className="h-5 w-5 text-white relative z-10" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-foreground">Comunicados</h2>
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black border border-primary/20">
                  {broadcasts.length}
                </span>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mt-0.5">Gestão de Avisos Globais</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            <div className="relative group w-full sm:w-56">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Pesquisar mensagens..."
                className="pl-9 h-9 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border-black/[0.05] dark:border-white/[0.06] focus:bg-white dark:focus:bg-white/[0.06] text-xs font-medium transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── BENTO GRID LAYOUT ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* ── TILE: EDITOR (Glass Card) ── */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="relative rounded-[2rem] overflow-hidden border border-white/20 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-3xl p-8 shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
            
            <div className="flex items-center gap-3 mb-6">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground/60">
                {editingId ? "Editando Comunicado" : "Nova Mensagem Global"}
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <Textarea 
                  placeholder="Digite aqui o aviso importante para toda a equipe..."
                  className="min-h-[180px] rounded-[1.75rem] p-6 bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.06] dark:border-white/[0.08] focus:bg-white dark:focus:bg-zinc-900 focus:ring-primary/10 text-[15px] font-bold leading-relaxed resize-none transition-all shadow-inner"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10">
                    <Zap size={14} className="text-primary/60" />
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground/50 max-w-[200px] leading-tight uppercase tracking-wider">
                    Disparo instantâneo para todos os usuários logados.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {editingId && (
                    <Button 
                      variant="ghost" 
                      onClick={() => { setEditingId(null); setMessage(""); }}
                      className="h-11 rounded-xl px-5 font-black uppercase text-[10px] tracking-widest"
                    >
                      Descartar
                    </Button>
                  )}
                  <Button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-11 rounded-xl px-8 bg-primary text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all gap-2"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : editingId ? <Check size={16} /> : <Send size={16} />}
                    {editingId ? "Salvar" : "Disparar"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Accents (Stats) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative rounded-[1.5rem] overflow-hidden border border-white/20 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] backdrop-blur-xl p-5">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
              <History size={16} className="text-primary/40 mb-3" />
              <p className="text-2xl font-black text-foreground leading-none">{broadcasts.length}</p>
              <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1.5">Total de Disparos</p>
            </div>
            <div className="relative rounded-[1.5rem] overflow-hidden border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-xl p-5">
              <Check size={16} className="text-emerald-500 mb-3" />
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">Global</p>
              <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500/50 mt-1.5">Alcance Máximo</p>
            </div>
          </div>
        </div>

        {/* ── TILE: HISTORY (Active List) ── */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Histórico Recente</p>
            </div>
            <p className="text-[9px] font-bold text-muted-foreground/30">{filteredBroadcasts.length} ativos</p>
          </div>

          <div className="relative rounded-[2rem] overflow-hidden border border-white/20 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] backdrop-blur-2xl p-4 shadow-sm min-h-[400px]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="animate-spin text-primary/20" size={32} />
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">Sincronizando...</p>
              </div>
            ) : filteredBroadcasts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center opacity-20">
                <Bell size={40} className="mb-3" />
                <p className="text-xs font-black uppercase tracking-widest">Sem comunicados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBroadcasts.map((b) => (
                  <BroadcastCard key={b.id} item={b} onEdit={startEdit} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>

          <div className="p-4 rounded-[1.5rem] bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
            <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[9px] font-medium text-amber-600/70 dark:text-amber-400/70 leading-relaxed uppercase tracking-wider">
              Comunicados são exibidos em formato de toast e notificação persistente para todos os membros da empresa.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
