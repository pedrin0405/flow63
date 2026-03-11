"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { 
  Menu, MessageSquare, Send, User, Monitor, 
  Search, Clock, ChevronRight, CheckCheck, Check,
  Paperclip, StickyNote, History, CheckCircle2,
  Settings, Globe, Cpu, Hash, ShieldCheck, 
  Zap, Loader2, Save, Trash2, MessageCircle, Mail, X,
  Activity, Sparkles
} from "lucide-react"
import { Sidebar } from "../../components/central63/sidebar"
import { supabase } from "../../lib/supabase"
import { Input } from "../../components/ui/input"
import { Button } from "../../components/ui/button"
import { ScrollArea } from "../../components/ui/scroll-area"
import { Avatar, AvatarFallback } from "../../components/ui/avatar"
import { Badge } from "../../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Textarea } from "../../components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select"
import { useToast } from "../../hooks/use-toast"
import { useSearchParams } from "next/navigation"
import Loading from "../loading"
import { cn } from "@/lib/utils"

const TAG_CONFIG = {
  novo: { label: 'Novo', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  em_progresso: { label: 'Em Atendimento', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  urgente: { label: 'Prioridade Máxima', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
  aguardando: { label: 'Aguardando Cliente', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
  concluido: { label: 'Finalizado', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
}

function SupportContent() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const ticketIdFromUrl = searchParams.get('id')
  
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("support")
  
  const [chamados, setChamados] = useState<any[]>([])
  const [chamadoSelecionado, setChamadoSelecionado] = useState<any>(null)
  const [mensagens, setMensagens] = useState<any[]>([])
  const [novaResposta, setNovaResposta] = useState("")
  const [notaInterna, setNotaInterna] = useState("")
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)
  
  const chatScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    carregarChamados()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [mensagens])

  useEffect(() => {
    if (ticketIdFromUrl && chamados.length > 0) {
      const ticket = chamados.find(c => c.id === ticketIdFromUrl)
      if (ticket && chamadoSelecionado?.id !== ticket.id) {
        setChamadoSelecionado(ticket)
        carregarMensagens(ticket)
      }
    }
  }, [ticketIdFromUrl, chamados])

  useEffect(() => {
    const canalLista = supabase
      .channel('lista-tickets-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'suporte_chamados' 
      }, () => {
        carregarChamadosSilencioso(); 
      })
      .subscribe();

    let canalChat: any;
    if (chamadoSelecionado?.id) {
      marcarComoLidas(chamadoSelecionado.id);
      canalChat = supabase
        .channel(`chat-ativo-${chamadoSelecionado.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'suporte_mensagens',
          filter: `chamado_id=eq.${chamadoSelecionado.id}` 
        }, (payload) => {
          const newMessage = payload.new;
          if (newMessage.metadados && typeof newMessage.metadados === 'string') {
            try {
              newMessage.metadados = JSON.parse(newMessage.metadados);
            } catch (e) {
              console.error("Erro ao parsear metadados:", e);
            }
          }

          if (!newMessage.eh_admin) {
            marcarComoLidas(chamadoSelecionado.id);
            try {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3')
              audio.volume = 0.5
              audio.play().catch(() => {})
            } catch (e) {}
          }

          setMensagens((prev) => {
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          scrollToBottom();
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public', 
          table: 'suporte_mensagens',
          filter: `chamado_id=eq.${chamadoSelecionado.id}`
        }, (payload) => {
          setMensagens((prev) => 
            prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m)
          )
        })
        .subscribe();
    }

    return () => {
      supabase.removeChannel(canalLista);
      if (canalChat) supabase.removeChannel(canalChat);
    };
  }, [chamadoSelecionado?.id]);

  async function marcarComoLidas(id: string) {
    await supabase
      .from('suporte_mensagens')
      .update({ lida: true })
      .eq('chamado_id', id)
      .eq('eh_admin', false)
      .eq('lida', false)
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatScrollRef.current) {
        const viewport = chatScrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
        if (viewport) {
          viewport.scrollTo({
            top: viewport.scrollHeight,
            behavior: 'smooth'
          })
        }
      }
    }, 100)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Arquivo muito grande", description: "O limite é 5MB", variant: "destructive" })
        return
      }
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function carregarChamados() {
    setIsLoading(true)
    const { data } = await supabase.from('suporte_chamados').select('*').order('atualizado_em', { ascending: false })
    setChamados(data || [])
    setIsLoading(false)
  }

  async function carregarChamadosSilencioso() {
    const { data } = await supabase.from('suporte_chamados').select('*').order('atualizado_em', { ascending: false })
    if (data) setChamados(data)
  }

  async function carregarMensagens(chamado: any) {
    setNotaInterna(chamado.notas_internas || "")
    const { data } = await supabase.from('suporte_mensagens').select('*').eq('chamado_id', chamado.id).order('criado_em', { ascending: true })
    setMensagens(data || [])
    scrollToBottom()
  }

  async function atualizarStatusKanban(tag: string) {
    if (!chamadoSelecionado) return
    setChamadoSelecionado((prev: any) => ({ ...prev, tag }));
    
    const { error } = await supabase
      .from('suporte_chamados')
      .update({ tag, atualizado_em: new Date().toISOString() })
      .eq('id', chamadoSelecionado.id)
    
    if (!error) {
      carregarChamadosSilencioso()
      toast({ title: "Status Atualizado" })
    }
  }

  async function excluirChamado(e: React.MouseEvent, idParaExcluir: string) {
    e.stopPropagation(); 
    if (!confirm("Tem certeza que deseja apagar este atendimento permanentemente?")) return;

    try {
      await supabase.from('suporte_mensagens').delete().eq('chamado_id', idParaExcluir);
      const { error: errorChamado } = await supabase.from('suporte_chamados').delete().eq('id', idParaExcluir);

      if (!errorChamado) {
        setChamados(prev => prev.filter(c => c.id !== idParaExcluir));
        if (chamadoSelecionado?.id === idParaExcluir) {
          setChamadoSelecionado(null);
          setMensagens([]);
        }
        toast({ title: "Atendimento removido" });
      }
    } catch (error: any) {
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  }

  async function guardarNota() {
    if (!chamadoSelecionado || isSavingNote) return
    setIsSavingNote(true)
    
    const { error } = await supabase
      .from('suporte_chamados')
      .update({ 
        notas_internas: notaInterna,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', chamadoSelecionado.id)
    
    setIsSavingNote(false)
    if (!error) {
      setNoteSaved(true)
      toast({ title: "Notas guardadas" })
      carregarChamadosSilencioso()
      setTimeout(() => setNoteSaved(false), 3000)
    } else {
      toast({ title: "Erro ao salvar nota", variant: "destructive" })
    }
  }

  async function enviarResposta() {
    if ((!novaResposta.trim() && !selectedFile) || !chamadoSelecionado || isSending) return
    setIsSending(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const nomeAdmin = user?.user_metadata?.full_name || "Suporte Central63"
      
      let imagem_url = null
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop()
        const fileName = `support/${chamadoSelecionado.id}/${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('user-uploads')
          .upload(fileName, selectedFile)
        
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('user-uploads')
          .getPublicUrl(fileName)
        
        imagem_url = publicUrl
      }

      const { error } = await supabase.from('suporte_mensagens').insert({
        chamado_id: chamadoSelecionado.id,
        remetente_id: user?.id,
        conteudo: novaResposta,
        eh_admin: true,
        metadados: { 
          nome_remetente: nomeAdmin,
          imagem_url: imagem_url
        } 
      })
      
      if (!error) {
        await supabase.from('suporte_chamados').update({ atualizado_em: new Date().toISOString() }).eq('id', chamadoSelecionado.id)
        setNovaResposta("")
        setSelectedFile(null)
        setPreviewUrl(null)
        scrollToBottom()
      }
    } catch (error: any) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" })
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) return <Loading />

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        activeTab={activeTab} 
        onTabChange={(tab: string) => { setActiveTab(tab); setSidebarOpen(false); }} 
      />
      
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative animate-in fade-in duration-700">
        
        {/* ── BENTO HEADER ── */}
        <header className="h-20 shrink-0 px-8 flex items-center justify-between z-30">
          <div className="flex items-center gap-5">
            <Button variant="ghost" size="icon" className="lg:hidden rounded-xl bg-white/50 dark:bg-white/[0.02] border border-white/20" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </Button>
            
            <div className="relative flex items-center gap-4 bg-white/60 dark:bg-white/[0.02] backdrop-blur-2xl border border-white/20 dark:border-white/[0.06] px-5 py-2.5 rounded-2xl shadow-sm">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
              <div className="h-10 w-10 bg-gradient-to-br from-primary/90 to-primary/60 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <MessageCircle className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-sm font-black tracking-tight text-foreground uppercase">Atendimento Hub</h2>
                <div className="flex items-center gap-2 mt-0.5">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                   <span className="text-[9px] text-muted-foreground/60 font-black uppercase tracking-widest">Equipe Online</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="bg-white/60 dark:bg-white/[0.02] backdrop-blur-xl border border-white/20 dark:border-white/[0.06] rounded-xl h-10 px-5 flex items-center gap-3 shadow-sm">
               <Activity className="h-3.5 w-3.5 text-primary" />
               <span className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/70">
                 {chamados.filter(c => c.tag !== 'concluido').length} Em Aberto
               </span>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden p-6 lg:p-8 flex gap-6">
          
          {/* ── TILE: LISTA DE CHAMADOS (Bento Sidebar) ── */}
          <div className="w-[340px] flex flex-col relative rounded-[2rem] overflow-hidden border border-white/20 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-3xl shadow-2xl shrink-0 transition-all">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
            
            <div className="p-5 border-b border-black/[0.04] dark:border-white/[0.04]">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" size={14} />
                <Input 
                  placeholder="Pesquisar conversas..." 
                  className="pl-10 h-11 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border-black/[0.05] dark:border-white/[0.08] focus:bg-white dark:focus:bg-white/[0.06] text-xs font-bold transition-all" 
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="px-4 py-4 space-y-2">
                {chamados.map((c) => (
                  <div 
                    key={c.id} 
                    onClick={() => { setChamadoSelecionado(c); carregarMensagens(c); }}
                    className={cn(
                      "group flex flex-col p-4 rounded-[1.5rem] cursor-pointer transition-all duration-300 relative border",
                      chamadoSelecionado?.id === c.id 
                      ? 'bg-primary/5 border-primary/20 shadow-lg shadow-primary/5 -translate-y-0.5' 
                      : 'bg-transparent border-transparent hover:bg-black/[0.02] dark:hover:bg-white/[0.02] hover:border-black/[0.05] dark:hover:border-white/[0.05]'
                    )}
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div className="relative">
                        <Avatar className="h-11 w-11 rounded-2xl border border-white/40 dark:border-white/[0.08] shadow-sm overflow-hidden">
                          {c.metadados?.avatar_url ? (
                            <img src={c.metadados.avatar_url} alt="Foto" className="h-full w-full object-cover" />
                          ) : (
                            <AvatarFallback className="text-xs font-black bg-black/[0.05] dark:bg-white/[0.05] text-muted-foreground/40">
                              {c.metadados?.nome?.substring(0, 2).toUpperCase() || 'V'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        {chamadoSelecionado?.id === c.id && (
                          <div className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-primary border-2 border-white dark:border-zinc-900 shadow-sm" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-[13px] font-black tracking-tight truncate text-foreground/90">
                            {c.metadados?.nome || (c.usuario_id ? `Utilizador #${c.usuario_id.substring(0, 5)}` : `Visitante ${c.id.substring(0, 4)}`)}
                          </p>
                          <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest shrink-0">
                            {new Date(c.atualizado_em).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <p className="text-[10px] truncate font-bold text-muted-foreground/40 uppercase tracking-wider">
                          {c.metadados?.email || "Nenhum email vinculado"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className={cn(
                        "text-[9px] h-5 px-2.5 flex items-center rounded-lg font-black uppercase tracking-[0.1em] border",
                        TAG_CONFIG[c.tag as keyof typeof TAG_CONFIG]?.color
                      )}>
                        {TAG_CONFIG[c.tag as keyof typeof TAG_CONFIG]?.label || 'Novo'}
                      </div>
                      <ChevronRight size={14} className={cn("transition-transform duration-300", chamadoSelecionado?.id === c.id ? 'text-primary translate-x-1' : 'text-muted-foreground/20')} />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* ── TILE: CHAT INTERFACE (Bento Main) ── */}
          <div className="flex-1 flex flex-col relative rounded-[2rem] overflow-hidden border border-white/20 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-3xl shadow-2xl min-w-0">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
            
            {chamadoSelecionado ? (
              <>
                <div className="px-8 py-5 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between shrink-0 bg-white/40 dark:bg-white/[0.02] backdrop-blur-xl z-20">
                  <div className="flex items-center gap-5">
                    <Avatar className="h-12 w-12 rounded-2xl ring-4 ring-black/[0.02] dark:ring-white/[0.02] shadow-sm border border-white/40 dark:border-white/[0.1]">
                      {chamadoSelecionado.metadados?.avatar_url ? (
                        <img src={chamadoSelecionado.metadados.avatar_url} className="object-cover" />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary font-black text-sm">
                          {chamadoSelecionado.metadados?.nome?.substring(0, 2).toUpperCase() || chamadoSelecionado.id.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <h3 className="font-black text-base text-foreground tracking-tight">{chamadoSelecionado.metadados?.nome || `Suporte #${chamadoSelecionado.id.substring(0, 8)}`}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        <span className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.2em]">Sincronizado via Realtime</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Select value={chamadoSelecionado.tag} onValueChange={atualizarStatusKanban}>
                      <SelectTrigger className="w-[180px] h-10 rounded-xl text-[10px] font-black uppercase tracking-widest bg-black/[0.02] dark:bg-white/[0.04] border-black/[0.06] dark:border-white/[0.08] focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-white/20 dark:border-white/[0.08] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl">
                        {Object.entries(TAG_CONFIG).map(([key, value]) => (
                          <SelectItem key={key} value={key} className="text-[10px] font-black uppercase tracking-widest py-3 cursor-pointer">
                            {value.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <button onClick={(e) => excluirChamado(e, chamadoSelecionado.id)} className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden" ref={chatScrollRef}>
                  <ScrollArea className="h-full">
                    <div className="p-10 flex flex-col gap-5 max-w-4xl mx-auto">
                      {mensagens.map((msg) => (
                        <div key={msg.id} className={cn("flex group animate-in slide-in-from-bottom-2 duration-500", msg.eh_admin ? 'justify-end' : 'justify-start')}>
                          <div className={cn("max-w-[80%] flex flex-col", msg.eh_admin ? 'items-end' : 'items-start')}>
                            <div className={cn(
                              "relative px-6 py-4 rounded-[2rem] text-[14px] font-medium leading-relaxed shadow-sm transition-all hover:shadow-md",
                              msg.eh_admin 
                              ? 'bg-primary text-white rounded-br-none shadow-primary/20'
                              : 'bg-white dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/[0.08] text-foreground rounded-bl-none'
                            )}>
                              {msg.eh_admin && <div className="absolute inset-x-0 top-0 h-px rounded-t-[2rem]" />}

                              {msg.metadados?.imagem_url && (
                                <div className="mb-3 overflow-hidden rounded-2xl border border-white/20 shadow-lg">
                                  <img 
                                    src={msg.metadados.imagem_url} 
                                    alt="Anexo" 
                                    className="max-w-full h-auto cursor-pointer hover:scale-105 transition-transform duration-500"
                                    onClick={() => window.open(msg.metadados.imagem_url, '_blank')}
                                  />
                                </div>
                              )}
                              
                              <div className="flex flex-col gap-1">
                                <span>{msg.conteudo}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2 px-2">
                              {!msg.eh_admin && (
                                <User size={14} className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-widest" />
                              )}
                              <span className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-widest">
                                {new Date(msg.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {msg.eh_admin && (
                                  <div className="flex justify-end -mb-0 mt-0">
                                    {msg.lida ? (
                                      <CheckCheck size={14} className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-widest" />
                                    ) : (
                                      <Check size={14} className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-widest" />
                                    )}
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* ── CHAT INPUT GLASS ── */}
                <div className="p-6 border-t border-black/[0.04] dark:border-white/[0.04] shrink-0 bg-white/40 dark:bg-white/[0.01] backdrop-blur-xl">
                  {previewUrl && (
                    <div className="mb-4 relative inline-block mx-4 animate-in zoom-in duration-300">
                      <div className="h-24 w-24 rounded-[1.5rem] overflow-hidden border-2 border-primary/20 shadow-xl ring-4 ring-black/[0.02]">
                        <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                      <button 
                        onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                        className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1.5 shadow-lg hover:bg-rose-600 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  
                  <div className="flex gap-3 items-center bg-black/[0.02] dark:bg-white/[0.03] p-2 rounded-[1.75rem] border border-black/[0.06] dark:border-white/[0.08] focus-within:bg-white dark:focus-within:bg-white/[0.06] focus-within:shadow-xl focus-within:shadow-primary/5 transition-all">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileChange}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => fileInputRef.current?.click()}
                      className="h-11 w-11 rounded-2xl text-muted-foreground/40 hover:text-primary hover:bg-primary/5"
                    >
                      <Paperclip size={20} />
                    </Button>
                    <Input 
                      placeholder="Digite sua resposta aqui..." 
                      value={novaResposta}
                      onChange={(e) => setNovaResposta(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && enviarResposta()}
                      className="border-none bg-transparent focus-visible:ring-0 shadow-none h-11 text-sm font-bold placeholder:text-muted-foreground/30 placeholder:uppercase placeholder:tracking-widest"
                    />
                    <Button 
                      onClick={enviarResposta} 
                      disabled={isSending} 
                      className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-11 px-6 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-20">
                <MessageSquare size={60} className="mb-6" />
                <h3 className="text-xl font-black uppercase tracking-[0.2em] text-foreground">Central de Atendimento</h3>
                <p className="text-sm font-bold uppercase tracking-widest mt-2">Selecione uma conversa para começar o suporte</p>
              </div>
            )}
          </div>

          {/* ── TILE: DETALHES & NOTAS (Bento Aside) ── */}
          <div className="w-[340px] flex flex-col shrink-0 gap-6">
            {chamadoSelecionado ? (
              <div className="relative flex-1 flex flex-col rounded-[2rem] overflow-hidden border border-white/20 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-3xl shadow-2xl transition-all h-full">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
                
                <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-black/[0.04] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.01]">
                    <TabsList className="w-full bg-black/[0.04] dark:bg-white/[0.04] rounded-xl h-11 p-1">
                      <TabsTrigger value="info" className="flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Detalhes</TabsTrigger>
                      <TabsTrigger value="notes" className="flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Notas</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="info" className="flex-1 overflow-hidden m-0 relative data-[state=active]:flex flex-col">
                    <ScrollArea className="h-full">
                      <div className="p-8 space-y-10">
                        <div className="flex flex-col items-center text-center">
                          <Avatar className="h-24 w-24 mb-5 shadow-2xl border-4 border-white/40 dark:border-white/[0.05] ring-8 ring-black/[0.02] dark:ring-white/[0.01] rounded-[2rem]">
                            {chamadoSelecionado.metadados?.avatar_url ? (
                              <img src={chamadoSelecionado.metadados.avatar_url} className="object-cover" />
                            ) : (
                              <AvatarFallback className="bg-black/[0.03] dark:bg-white/[0.05] text-muted-foreground/30 font-black text-2xl uppercase">
                                {chamadoSelecionado.metadados?.nome?.substring(0, 1) || 'V'}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <h4 className="font-black text-lg tracking-tight text-foreground uppercase truncate w-full px-2">
                            {chamadoSelecionado.metadados?.nome || 'Utilizador Anon'}
                          </h4>
                          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                            <Mail size={10} />
                            <span className="text-[9px] font-black uppercase tracking-widest truncate max-w-[180px]">
                              {chamadoSelecionado.metadados?.email || "No Email"}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-8">
                          <div className="space-y-4">
                            <h5 className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.25em] flex items-center gap-3">
                              <User size={12} className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-widest" />
                              Perfil Técnico
                            </h5>
                            <div className="bg-black/[0.03] dark:bg-white/[0.02] p-5 rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">Preferência</p>
                              <p className="font-black text-foreground text-sm tracking-tight">{chamadoSelecionado.metadados?.atendente_preferencia || 'Padrão'}</p>
                              <div className="h-px bg-black/[0.06] dark:bg-white/[0.06] my-3" />
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">Cargo/Setor</p>
                              <p className="font-black text-primary text-[11px] uppercase tracking-widest">{chamadoSelecionado.metadados?.atendente_cargo || 'Generalista'}</p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h5 className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.25em] flex items-center gap-3">
                              <Monitor size={12} className="text-primary" />
                              Sessão & Plataforma
                            </h5>
                            <div className="grid grid-cols-1 gap-2">
                              <div className="flex items-center justify-between p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.01] border border-black/[0.04] dark:border-white/[0.04]">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Plataforma</span>
                                <span className="text-[10px] font-black uppercase text-foreground">{chamadoSelecionado.metadados?.plataforma || 'N/A'}</span>
                              </div>
                              <div className="flex items-center justify-between p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.01] border border-black/[0.04] dark:border-white/[0.04]">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Status Sinc</span>
                                <span className="text-[10px] font-black uppercase text-emerald-500">Live</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                             <h5 className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.25em] flex items-center gap-3">
                               <History size={12} className="text-primary" />
                               Linha do Tempo
                             </h5>
                             <div className="pl-4 border-l-2 border-primary/20 space-y-6 ml-2 py-1">
                                <div className="relative">
                                   <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                                   <p className="text-[11px] font-black text-foreground uppercase tracking-widest">Abertura</p>
                                   <p className="text-[9px] font-bold text-muted-foreground/50 mt-1">
                                     {new Date(chamadoSelecionado.criado_em).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                   </p>
                                </div>
                                <div className="relative">
                                   <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-zinc-400 dark:bg-zinc-600 shadow-sm" />
                                   <p className="text-[11px] font-black text-foreground uppercase tracking-widest">Última Interação</p>
                                   <p className="text-[9px] font-bold text-muted-foreground/50 mt-1">
                                     {new Date(chamadoSelecionado.atualizado_em).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                   </p>
                                </div>
                             </div>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="notes" className="flex-1 overflow-hidden m-0 relative data-[state=active]:flex flex-col">
                    <div className="absolute inset-0 flex flex-col p-8">
                      <div className="flex items-center justify-between mb-8">
                         <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Notas de Atendimento</span>
                            <span className="text-[10px] font-bold text-foreground/60">Privado para a equipe</span>
                         </div>
                         {noteSaved ? (
                           <CheckCircle2 size={18} className="text-emerald-500 animate-in zoom-in-50 duration-500" />
                         ) : (
                           <StickyNote size={18} className="text-primary/40" />
                         )}
                      </div>
                      
                      <div className="flex-1 flex flex-col relative bg-black/[0.02] dark:bg-white/[0.02] rounded-[1.5rem] p-6 border border-black/[0.04] dark:border-white/[0.04] shadow-inner">
                        <Textarea 
                          placeholder="Digite aqui as observações internas sobre este caso..." 
                          value={notaInterna}
                          onChange={(e) => { setNotaInterna(e.target.value); setNoteSaved(false); }}
                        />
                        {isSavingNote && (
                          <div className="absolute top-4 right-4 animate-spin">
                            <Loader2 size={16} className="text-primary/40" />
                          </div>
                        )}
                      </div>
                      
                      <div className="pt-6 mt-auto">
                        <Button 
                          onClick={guardarNota} 
                          disabled={isSavingNote} 
                          className="w-full h-12 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                          {isSavingNote ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                          {noteSaved ? 'Informação Salva' : 'Salvar Alterações'}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="flex-1 rounded-[2rem] border border-white/20 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-3xl flex flex-col items-center justify-center opacity-20">
                 <Settings size={32} className="animate-spin-slow" />
                 <span className="text-[10px] font-black uppercase tracking-widest mt-4 text-foreground/50">Configurações Ativas</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <SupportContent />
    </Suspense>
  )
}
