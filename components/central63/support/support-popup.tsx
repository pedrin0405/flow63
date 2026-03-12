'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, X, User, Mail, Loader2, Check, RefreshCw, CheckCircle2, Image as ImageIcon, Paperclip, CheckCheck, ChevronLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/supabase"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { usePathname } from 'next/navigation'

const ATENDENTES = [
  { id: 'marketing_1', nome: 'Equipe Marketing', cargo: 'Marketing' },
  { id: 'gestor_1', nome: 'Gestor de Suporte', cargo: 'Gestão' },
]

export function SuportePopup() {
  const pathname = usePathname()
  const { toast } = useToast()
  
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [mensagem, setMensagem] = useState("")
  const [mensagens, setMensagens] = useState<any[]>([])
  const [chamadoId, setChamadoId] = useState<string | null>(null)
  const [isConcluido, setIsConcluido] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  
  const [userData, setUserData] = useState({ nome: "", email: "" })
  const [atendenteSelecionado, setAtendenteSelecionado] = useState<any>(null)
  const [isIdentifying, setIsIdentifying] = useState(false)
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Ocultar suporte em páginas de bio públicas
  const isBioPage = pathname?.startsWith('/bio/')
  const isEditorPage = pathname?.startsWith('/editor')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const idSalvo = localStorage.getItem('flow63_chamado_id')
    if (idSalvo) {
      setChamadoId(idSalvo)
      carregarHistorico(idSalvo)
    }

    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserData({ 
          nome: user.user_metadata?.full_name || user.email?.split('@')[0] || "Utilizador", 
          email: user.email || "" 
        })
      }
    }
    checkUser()
  }, [])

  useEffect(() => {
    const updateTitle = () => {
      const baseTitle = "Central63 - Gestão Imobiliária"; // Título padrão do seu app
      if (unreadCount > 0 && !isOpen) {
        document.title = `(${unreadCount}) Nova Mensagem - ${baseTitle}`;
      } else {
        document.title = baseTitle;
      }
    };

    updateTitle();
    // Limpar ao desmontar
    return () => { document.title = "Central63 - Gestão Imobiliária"; };
  }, [unreadCount, isOpen])

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0)
      if (chamadoId) {
        marcarComoLidas()
      }
    }
  }, [isOpen, chamadoId])

  async function marcarComoLidas() {
    if (!chamadoId) return
    await supabase
      .from('suporte_mensagens')
      .update({ lida: true })
      .eq('chamado_id', chamadoId)
      .eq('eh_admin', true)
      .eq('lida', false)
  }

  useEffect(() => {
    if (chamadoId) {
      const canal = supabase
        .channel(`chat-${chamadoId}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'suporte_mensagens',
          filter: `chamado_id=eq.${chamadoId}` 
        }, (payload) => {
          const newMessage = payload.new;
          if (newMessage.metadados && typeof newMessage.metadados === 'string') {
            try {
              newMessage.metadados = JSON.parse(newMessage.metadados);
            } catch (e) {
              console.error("Erro ao parsear metadados:", e);
            }
          }

          if (newMessage.eh_admin) {
            // Abre o chat automaticamente ao receber mensagem do suporte
            setIsOpen(true)
            
            if (!isOpen) {
              setUnreadCount(prev => prev + 1)
            } else {
              marcarComoLidas()
            }

            // Som de notificação
            try {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3')
              audio.volume = 0.4
              audio.play().catch(() => {})
            } catch (e) {}
          }

          setMensagens((prev) => {
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          })
          scrollToBottom()
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public', 
          table: 'suporte_mensagens',
          filter: `chamado_id=eq.${chamadoId}`
        }, (payload) => {
          setMensagens((prev) => 
            prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m)
          )
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'suporte_chamados',
          filter: `id=eq.${chamadoId}`
        }, (payload) => {
          if (payload.new.tag === 'concluido') {
            setIsConcluido(true)
          } else {
            setIsConcluido(false)
          }
        })
        .subscribe()

      return () => { supabase.removeChannel(canal) }
    }
  }, [chamadoId, isOpen, toast])

  useEffect(() => {
    if (isOpen && chamadoId) {
      carregarHistorico(chamadoId)
    }
  }, [isOpen, chamadoId])

  const scrollToBottom = () => {
    if (isConcluido) return 
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
        if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }, 100)
  }

  async function carregarHistorico(id: string) {
    const { data: chamado } = await supabase
      .from('suporte_chamados')
      .select('tag')
      .eq('id', id)
      .single()
    
    if (chamado?.tag === 'concluido') setIsConcluido(true)

    const { data, error } = await supabase
      .from('suporte_mensagens')
      .select('*')
      .eq('chamado_id', id)
      .order('criado_em', { ascending: true })
    
    if (error || !data) {
        localStorage.removeItem('flow63_chamado_id')
        setChamadoId(null)
        return
    }
    setMensagens(data)
    scrollToBottom()
  }

  function novoAtendimento() {
    localStorage.removeItem('flow63_chamado_id')
    setChamadoId(null)
    setMensagens([])
    setIsConcluido(false)
    setIsIdentifying(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 5MB",
          variant: "destructive"
        })
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

  async function iniciarEEnviar() {
    if ((!mensagem.trim() && !selectedFile) || isLoading) return;

    let currentChamadoId = chamadoId || localStorage.getItem('flow63_chamado_id');

    if (!currentChamadoId && !isIdentifying && (!userData.nome || !userData.email || !atendenteSelecionado)) {
      setIsIdentifying(true);
      return;
    }

    if (isIdentifying && (!userData.nome || !userData.email || !atendenteSelecionado)) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o seu nome, e-mail e selecione um atendente.",
        variant: "destructive"
      })
      return;
    }

    setIsLoading(true);

    try {
      if (!currentChamadoId) {
        const { data: { user } } = await supabase.auth.getUser();
        const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

        const { data: novoChamado, error: errorChamado } = await supabase
          .from('suporte_chamados')
          .insert({ 
            usuario_id: user?.id || null,
            status: 'aberto',
            tag: 'novo',
            metadados: {
              nome: userData.nome || user?.user_metadata?.full_name,
              email: userData.email || user?.email,
              avatar_url: avatarUrl,
              atendente_preferencia: atendenteSelecionado?.nome,
              atendente_cargo: atendenteSelecionado?.cargo,
              plataforma: window.navigator.platform,
            }
          })
          .select()
          .single();

        if (errorChamado) throw errorChamado;

        if (novoChamado) {
          currentChamadoId = novoChamado.id; 
          setChamadoId(novoChamado.id);
          setIsConcluido(false);
          localStorage.setItem('flow63_chamado_id', novoChamado.id);
        }
      }

      if (currentChamadoId) {
        const { data: { user } } = await supabase.auth.getUser();
        
        let imagem_url = null
        if (selectedFile) {
          const fileExt = selectedFile.name.split('.').pop()
          const fileName = `support/${currentChamadoId}/${Date.now()}.${fileExt}`
          const { error: uploadError } = await supabase.storage.from('user-uploads').upload(fileName, selectedFile)
          if (uploadError) throw uploadError
          const { data: { publicUrl } } = supabase.storage.from('user-uploads').getPublicUrl(fileName)
          imagem_url = publicUrl
        }

        const { error: errorMsg } = await supabase.from('suporte_mensagens').insert({
          chamado_id: currentChamadoId,
          remetente_id: user?.id || null,
          conteudo: mensagem,
          eh_admin: false,
          metadados: imagem_url ? { imagem_url } : null
        });
        
        if (errorMsg) {
          if (errorMsg.code === '23503') {
            localStorage.removeItem('flow63_chamado_id');
            setChamadoId(null);
            setIsLoading(false);
            return iniciarEEnviar();
          }
          throw errorMsg;
        }

        setMensagem("");
        setSelectedFile(null);
        setPreviewUrl(null);
        setIsIdentifying(false); 
        scrollToBottom();
      }
    } catch (error) {
      console.error("Erro no fluxo de suporte:", error);
    } finally {
      setIsLoading(false);
    }
  }

  if (!mounted || isBioPage || isEditorPage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(open) scrollToBottom(); }}>
        <PopoverTrigger asChild>
          <Button 
            size="icon" 
            className={cn(
              "h-14 w-14 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-all duration-500 scale-100 active:scale-90 border relative group overflow-hidden",
              "bg-white/80 dark:bg-white/[0.05] backdrop-blur-xl border-white/40 dark:border-white/[0.1]",
              isOpen ? "rotate-90" : "rotate-0"
            )}
          >
            {/* Inner glass highlight */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
            
            {isOpen ? (
              <X className="h-6 w-6 text-foreground/70" />
            ) : (
              <MessageCircle className="h-7 w-7 text-primary animate-in zoom-in duration-500" />
            )}
            
            {!isOpen && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-white text-[10px] font-black rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center animate-bounce shadow-lg shadow-primary/20">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          side="top" 
          align="end" 
          sideOffset={20}
          className={cn(
            "w-[360px] h-[600px] p-0 rounded-[2.5rem] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-500",
            "border border-white/40 dark:border-white/[0.08] bg-white/70 dark:bg-zinc-950/40 backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)]"
          )}
        >
          {/* Top glass refraction highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent z-50" />

          {/* ── HEADER GLASS ── */}
          <div className="bg-white/40 dark:bg-white/[0.02] p-6 border-b border-black/[0.04] dark:border-white/[0.04] relative shrink-0 z-40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {isIdentifying && (
                  <button 
                    onClick={() => setIsIdentifying(false)} 
                    className="h-8 w-8 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] flex items-center justify-center text-foreground/40 hover:text-primary transition-all active:scale-90"
                  >
                    <ChevronLeft size={18} />
                  </button>
                )}
                <div>
                  <h3 className="font-black text-[14px] uppercase tracking-[0.15em] text-foreground leading-none mb-1.5">Hub de Suporte</h3>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                    <p className="text-[9px] text-muted-foreground/50 font-black uppercase tracking-widest">
                      {isConcluido ? "Sessão Encerrada" : (isIdentifying ? "Identificação" : "Time Online")}
                    </p>
                  </div>
                </div>
              </div>
              
              {!isIdentifying && !isConcluido && (
                <button 
                  onClick={novoAtendimento}
                  className="h-8 px-3 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all active:scale-95 shadow-sm"
                >
                  Reiniciar
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 relative overflow-hidden bg-gradient-to-b from-transparent to-black/[0.02] dark:to-white/[0.01]">
            <ScrollArea 
              ref={scrollAreaRef} 
              className={cn(
                "h-full p-6 transition-all duration-500",
                isConcluido && "blur-[2px] pointer-events-none grayscale-[0.5]"
              )}
            >
              {isIdentifying ? (
                <div className="flex flex-col gap-6 py-2 animate-in fade-in slide-in-from-top-2 duration-700">
                  <div className="space-y-4">
                      <div className="px-1 flex items-center gap-2">
                        <User size={10} className="text-primary" />
                        <label className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Quem é você?</label>
                      </div>
                      <div className="space-y-2">
                        <div className="relative group">
                           <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 group-focus-within:text-primary transition-all" />
                           <Input 
                            placeholder="Introduza o seu nome" 
                            className="h-12 pl-12 rounded-2xl bg-white/50 dark:bg-white/[0.03] border-black/[0.05] dark:border-white/[0.08] focus:bg-white dark:focus:bg-white/[0.06] text-xs font-bold transition-all"
                            value={userData.nome}
                            onChange={(e) => setUserData({...userData, nome: e.target.value})}
                          />
                        </div>
                        <div className="relative group">
                           <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 group-focus-within:text-primary transition-all" />
                           <Input 
                            placeholder="Introduza o seu e-mail" 
                            type="email"
                            className="h-12 pl-12 rounded-2xl bg-white/50 dark:bg-white/[0.03] border-black/[0.05] dark:border-white/[0.08] focus:bg-white dark:focus:bg-white/[0.06] text-xs font-bold transition-all"
                            value={userData.email}
                            onChange={(e) => setUserData({...userData, email: e.target.value})}
                          />
                        </div>
                      </div>
                  </div>

                  <div className="space-y-4">
                    <div className="px-1 flex items-center gap-2">
                      <MessageCircle size={10} className="text-primary" />
                      <label className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Falar com...</label>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                      {ATENDENTES.map((atendente) => (
                        <div 
                          key={atendente.id}
                          onClick={() => setAtendenteSelecionado(atendente)}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 group cursor-pointer",
                            atendenteSelecionado?.id === atendente.id 
                            ? 'border-primary/40 bg-primary/5 shadow-lg shadow-primary/5 -translate-y-0.5' 
                            : 'border-black/[0.04] dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.04] hover:border-primary/20'
                          )}
                        >
                          <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center transition-all border shrink-0",
                            atendenteSelecionado?.id === atendente.id 
                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                            : 'bg-black/[0.03] dark:bg-white/[0.05] text-muted-foreground/40 border-black/[0.05] dark:border-white/[0.05]'
                          )}>
                             <User size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-black text-foreground tracking-tight truncate">{atendente.nome}</p>
                            <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-widest mt-0.5">{atendente.cargo}</p>
                          </div>
                          {atendenteSelecionado?.id === atendente.id && <CheckCircle2 size={16} className="text-muted-foreground/30 animate-in zoom-in duration-300" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    type="button" 
                    onClick={(e) => { e.preventDefault(); iniciarEEnviar(); }} 
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary/90 text-white h-12 rounded-[1.25rem] mt-4 font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Iniciar Diálogo"}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-5 py-2">
                  {mensagens.map((msg) => (
                    <div key={msg.id} className={cn("flex flex-col gap-1.5 animate-in slide-in-from-bottom-2 duration-500", msg.eh_admin ? 'items-start' : 'items-end')}>
                      {msg.eh_admin && (
                        <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] ml-0">
                          {(msg.metadados?.nome_remetente || "Suporte Central63").split(' ')[0]}
                        </span>
                      )}
                      <div className={cn(
                        "max-w-[85%] p-4 rounded-[1.75rem] text-[14px] font-medium leading-relaxed shadow-sm transition-all hover:shadow-md relative overflow-hidden",
                        msg.eh_admin 
                        ? 'bg-white dark:bg-white/[0.05] text-foreground rounded-tl-none border border-black/[0.04] dark:border-white/[0.08]' 
                        : 'bg-primary text-white rounded-tr-none shadow-primary/10'
                      )}>
                        {/* Internal highlight for bubbles */}
                        {!msg.eh_admin && <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />}
                        
                        {msg.metadados && typeof msg.metadados === 'object' && msg.metadados.imagem_url && (
                          <div className="mb-3 overflow-hidden rounded-2xl border border-white/20 shadow-lg bg-black/[0.02]">
                            <img 
                              src={msg.metadados.imagem_url} 
                              alt="Anexo" 
                              className="max-w-full h-auto cursor-pointer hover:scale-105 transition-transform duration-500"
                              onClick={() => window.open(msg.metadados.imagem_url, '_blank')}
                            />
                          </div>
                        )}
                        <div className="flex flex-col gap-2">
                          <span className="break-words">{msg.conteudo}</span>
                          
                        </div>
                        
                      </div>
                      <div className="flex items-center justify-between mt-1">
                             <span className={cn(
                                "text-[8px] font-black uppercase tracking-widest",
                                msg.eh_admin ? "text-muted-foreground/30" : "text-white/40"
                             )}>
                               {new Date(msg.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </span>
                             {!msg.eh_admin && (
                                <div className="flex justify-end">
                                  {msg.lida ? (
                                    <CheckCheck size={12} className="text-muted-foreground/30" />
                                  ) : (
                                    <Check size={12} className="text-muted-foreground/30" />
                                  )}
                                </div>
                             )}
                          </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {isConcluido && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-white/60 dark:bg-black/60 backdrop-blur-[6px] animate-in fade-in duration-700">
                <div className="w-full p-10 bg-white/90 dark:bg-zinc-900/90 border border-white/20 dark:border-white/[0.1] rounded-[2.5rem] text-center shadow-2xl animate-in zoom-in-95 duration-500 relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                  
                  <div className="bg-emerald-500/10 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/10">
                    <Check className="text-emerald-500" size={32} strokeWidth={3} />
                  </div>
                  <h4 className="text-foreground font-black text-xl uppercase tracking-tight mb-2">Finalizado</h4>
                  <p className="text-[12px] text-muted-foreground/60 font-bold leading-relaxed mb-8">
                    Esperamos ter ajudado! Se precisar, estamos sempre aqui no ecossistema Flow63.
                  </p>
                  <Button 
                    onClick={novoAtendimento}
                    className="w-full rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] h-12 gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20"
                  >
                    <RefreshCw size={14} /> Novo Chamado
                  </Button>
                </div>
              </div>
            )}
          </div>

          {!isIdentifying && !isConcluido && (
            <div className="p-6 bg-white/40 dark:bg-white/[0.01] border-t border-black/[0.04] dark:border-white/[0.04] shrink-0 backdrop-blur-xl">
              {previewUrl && (
                <div className="mb-4 relative inline-block animate-in zoom-in duration-300 ml-2">
                  <img src={previewUrl} alt="Preview" className="h-24 w-24 object-cover rounded-[1.5rem] border-2 border-primary/20 shadow-2xl ring-4 ring-black/[0.02]" />
                  <button 
                    onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                    className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-2 shadow-lg hover:bg-rose-600 transition-all active:scale-90"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <div className="flex gap-3 items-center">
                <div className="flex-1 flex gap-1 items-center bg-black/[0.03] dark:bg-white/[0.03] p-1.5 rounded-[1.75rem] border border-black/[0.06] dark:border-white/[0.08] focus-within:bg-white dark:focus-within:bg-white/[0.06] focus-within:shadow-xl focus-within:shadow-primary/5 transition-all">
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-[1.2rem] text-muted-foreground/40 hover:text-primary hover:bg-primary/5 transition-all shrink-0 h-10 w-10"
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Input 
                    placeholder="Sua mensagem..." 
                    value={mensagem} 
                    onChange={(e) => setMensagem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && iniciarEEnviar()}
                    className="border-none bg-transparent shadow-none focus-visible:ring-0 h-10 px-1 text-[13px] font-bold placeholder:text-muted-foreground/30 placeholder:uppercase placeholder:tracking-widest"
                  />
                </div>
                <Button 
                  size="icon" 
                  onClick={iniciarEEnviar} 
                  disabled={isLoading || (!mensagem.trim() && !selectedFile)} 
                  className="rounded-[1.2rem] bg-primary hover:bg-primary/90 h-11 w-11 shrink-0 shadow-lg shadow-primary/20 transition-all active:scale-90"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Send className="h-5 w-5 text-white" />}
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
