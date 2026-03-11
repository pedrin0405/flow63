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
  const { toast } = useToast()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  
  // Ocultar suporte em páginas de bio públicas
  const isBioPage = pathname?.startsWith('/bio/')

  useEffect(() => {
    setMounted(true)
  }, [])

  // ... rest of state ...
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

  if (!mounted || isBioPage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(open) scrollToBottom(); }}>
        <PopoverTrigger asChild>
          <Button size="icon" className="h-14 w-14 rounded-full shadow-lg bg-white hover:bg-slate-50 transition-all border border-slate-200 relative group scale-100 active:scale-95 duration-200">
            {isOpen ? <X className="h-6 w-6 text-slate-600" /> : <MessageCircle className="h-7 w-7 text-[#007AFF]" />}
            {!isOpen && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-[#FF3B30] text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center animate-in zoom-in duration-300">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          side="top" 
          align="end" 
          sideOffset={16}
          className="w-[340px] h-[560px] p-0 rounded-[2rem] overflow-hidden border border-slate-200/60 shadow-[0_10px_40px_rgba(0,0,0,0.08)] bg-white/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom-2 duration-300"
        >
          {/* Header Discreet Style */}
          <div className="bg-white/50 p-5 border-b border-slate-100 relative shrink-0">
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isIdentifying && (
                  <button onClick={() => setIsIdentifying(false)} className="mr-1 text-slate-400 hover:text-slate-600 transition-colors">
                    <ChevronLeft size={20} />
                  </button>
                )}
                <div>
                  <h3 className="font-semibold text-[16px] text-slate-800 tracking-tight leading-none mb-1">Suporte Central63</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#34C759]" />
                    <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                      {isConcluido ? "Sessão Encerrada" : (isIdentifying ? "Nova Conversa" : "Online agora")}
                    </p>
                  </div>
                </div>
              </div>
              {!isIdentifying && !isConcluido && (
                <button 
                  onClick={novoAtendimento}
                  className="text-[11px] font-semibold text-[#007AFF] hover:opacity-70 transition-opacity"
                >
                  Novo
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 relative overflow-hidden bg-slate-50/30">
            <ScrollArea 
              ref={scrollAreaRef} 
              className={cn(
                "h-full p-4 transition-all duration-300",
                isConcluido && "blur-[1px] pointer-events-none grayscale-[0.3]"
              )}
            >
              {isIdentifying ? (
                <div className="flex flex-col gap-5 py-4 animate-in fade-in duration-500">
                  <div className="space-y-4">
                      <div className="px-1">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Identificação</label>
                      </div>
                      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
                        <Input 
                          placeholder="Seu nome" 
                          className="h-12 border-none rounded-none focus-visible:ring-0 px-4 text-[14px] bg-transparent"
                          value={userData.nome}
                          onChange={(e) => setUserData({...userData, nome: e.target.value})}
                        />
                        <div className="h-px bg-slate-100 mx-4" />
                        <Input 
                          placeholder="Seu e-mail" 
                          type="email"
                          className="h-12 border-none rounded-none focus-visible:ring-0 px-4 text-[14px] bg-transparent"
                          value={userData.email}
                          onChange={(e) => setUserData({...userData, email: e.target.value})}
                        />
                      </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">Departamento</label>
                    <div className="grid grid-cols-1 gap-2">
                      {ATENDENTES.map((atendente) => (
                        <div 
                          key={atendente.id}
                          onClick={() => setAtendenteSelecionado(atendente)}
                          className={cn(
                            "flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all duration-200",
                            atendenteSelecionado?.id === atendente.id 
                            ? 'border-[#007AFF] bg-[#007AFF]/5' 
                            : 'border-white bg-white hover:border-slate-200 shadow-sm'
                          )}
                        >
                          <div className={cn(
                            "h-9 w-9 rounded-full flex items-center justify-center transition-colors",
                            atendenteSelecionado?.id === atendente.id ? 'bg-[#007AFF]/10' : 'bg-slate-100'
                          )}>
                             <User size={16} className={atendenteSelecionado?.id === atendente.id ? 'text-[#007AFF]' : 'text-slate-400'} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-slate-800 truncate">{atendente.nome}</p>
                            <p className="text-[11px] text-slate-400 font-medium">{atendente.cargo}</p>
                          </div>
                          {atendenteSelecionado?.id === atendente.id && <CheckCircle2 size={18} className="text-[#007AFF]" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    type="button" 
                    onClick={(e) => { e.preventDefault(); iniciarEEnviar(); }} 
                    disabled={isLoading}
                    className="w-full bg-[#007AFF] hover:bg-[#0062CC] text-white h-11 rounded-2xl mt-2 font-semibold text-[14px] shadow-sm transition-all active:scale-[0.98]"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Começar atendimento"}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 py-2">
                  {mensagens.map((msg) => (
                    <div key={msg.id} className={cn("flex flex-col gap-1", msg.eh_admin ? 'items-start' : 'items-end')}>
                      {msg.eh_admin && (
                        <span className="text-[9px] font-medium text-slate-400/80 ml-2.5">
                          {msg.metadados?.nome_remetente || "Suporte"}
                        </span>
                      )}
                      <div className={cn(
                        "max-w-[85%] p-3.5 rounded-[1.2rem] text-[14px] leading-snug animate-in fade-in duration-300",
                        msg.eh_admin 
                        ? 'bg-white text-slate-800 rounded-tl-none border border-slate-200/60 shadow-sm' 
                        : 'bg-[#007AFF] text-white rounded-tr-none font-normal shadow-sm'
                      )}>
                        {msg.metadados && typeof msg.metadados === 'object' && msg.metadados.imagem_url && (
                          <div className="mb-2.5 overflow-hidden rounded-xl bg-slate-100/50 min-h-[100px] flex items-center justify-center">
                            <img 
                              src={msg.metadados.imagem_url} 
                              alt="Anexo" 
                              className="max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(msg.metadados.imagem_url, '_blank')}
                            />
                          </div>
                        )}
                        <div className="flex flex-col gap-1">
                          <span className="break-words">{msg.conteudo}</span>
                          {!msg.eh_admin && (
                            <div className="flex justify-end -mb-1 -mr-1">
                              {msg.lida ? (
                                <CheckCheck size={13} className="text-blue-100/80" />
                              ) : (
                                <Check size={13} className="text-blue-100/50" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {isConcluido && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-white/60 backdrop-blur-[4px] animate-in fade-in duration-500">
                <div className="w-full p-8 bg-white border border-slate-200/60 rounded-[2rem] text-center shadow-xl animate-in zoom-in duration-500">
                  <div className="bg-slate-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="text-[#34C759]" size={28} strokeWidth={3} />
                  </div>
                  <h4 className="text-slate-800 font-bold text-lg mb-1">Atendimento Finalizado</h4>
                  <p className="text-[13px] text-slate-500 font-medium leading-relaxed mb-6">
                    Esperamos ter ajudado! Se precisar, estamos sempre aqui.
                  </p>
                  <Button 
                    onClick={novoAtendimento}
                    variant="outline"
                    className="w-full rounded-xl border-slate-200 text-slate-700 font-semibold h-11 gap-2 hover:bg-slate-50 transition-all active:scale-95"
                  >
                    <RefreshCw size={14} /> Novo Chamado
                  </Button>
                </div>
              </div>
            )}
          </div>

          {!isIdentifying && !isConcluido && (
            <div className="p-4 bg-white shrink-0">
              {previewUrl && (
                <div className="mb-3 relative inline-block animate-in zoom-in duration-200">
                  <img src={previewUrl} alt="Preview" className="h-20 w-20 object-cover rounded-xl border border-slate-200 shadow-md" />
                  <button 
                    onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                    className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1.5 shadow-lg hover:bg-black transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <div className="flex gap-2.5 items-center">
                <div className="flex-1 flex gap-2 items-center bg-slate-100/80 p-1.5 rounded-[1.4rem] border border-transparent focus-within:bg-white focus-within:border-slate-200 transition-all">
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full text-slate-400 hover:text-[#007AFF] hover:bg-white transition-colors shrink-0 h-9 w-9"
                  >
                    <Paperclip className="h-4.5 w-4.5" />
                  </Button>
                  <Input 
                    placeholder="Mensagem" 
                    value={mensagem} 
                    onChange={(e) => setMensagem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && iniciarEEnviar()}
                    className="border-none bg-transparent shadow-none focus-visible:ring-0 h-9 px-1 text-[14px] font-medium placeholder:text-slate-400"
                  />
                </div>
                <Button 
                  size="icon" 
                  onClick={iniciarEEnviar} 
                  disabled={isLoading || (!mensagem.trim() && !selectedFile)} 
                  className="rounded-full bg-[#007AFF] hover:bg-[#0062CC] h-10 w-10 shrink-0 shadow-sm transition-all active:scale-90"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Send className="h-4 w-4 text-white" />}
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}