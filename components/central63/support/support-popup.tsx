'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, X, User, Mail, Loader2, Check, RefreshCw, CheckCircle2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/supabase"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const ATENDENTES = [
  { id: 'marketing_1', nome: 'Equipa Marketing', cargo: 'Marketing' },
  { id: 'gestor_1', nome: 'Gestor de Suporte', cargo: 'Gestão' },
]

export function SuportePopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [mensagem, setMensagem] = useState("")
  const [mensagens, setMensagens] = useState<any[]>([])
  const [chamadoId, setChamadoId] = useState<string | null>(null)
  const [isConcluido, setIsConcluido] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const [userData, setUserData] = useState({ nome: "", email: "" })
  const [atendenteSelecionado, setAtendenteSelecionado] = useState<any>(null)
  const [isIdentifying, setIsIdentifying] = useState(false)
  
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
    if (chamadoId && isOpen) {
      const canal = supabase
        .channel(`chat-${chamadoId}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'suporte_mensagens',
          filter: `chamado_id=eq.${chamadoId}` 
        }, (payload) => {
          setMensagens((prev) => [...prev, payload.new])
          scrollToBottom()
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
  }, [chamadoId, isOpen])

  const scrollToBottom = () => {
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
        setMensagens([]);
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
    setIsIdentifying(true) // Volta para a tela de identificação para iniciar um novo fluxo
  }

  async function iniciarEEnviar() {
    if (!mensagem.trim() || isLoading) return
    
    if (!chamadoId && (!userData.nome || !userData.email || !atendenteSelecionado)) {
      setIsIdentifying(true)
      return
    }

    setIsLoading(true)
    let currentChamadoId = chamadoId

    if (!currentChamadoId) {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: novoChamado } = await supabase
        .from('suporte_chamados')
        .insert({ 
          usuario_id: user?.id || null,
          status: 'aberto',
          tag: 'novo',
          metadados: {
            nome: userData.nome,
            email: userData.email,
            atendente_preferencia: atendenteSelecionado?.nome,
            atendente_cargo: atendenteSelecionado?.cargo,
            plataforma: window.navigator.platform,
          }
        })
        .select()
        .single()

      if (novoChamado) {
        currentChamadoId = novoChamado.id
        setChamadoId(novoChamado.id)
        setIsConcluido(false)
        localStorage.setItem('flow63_chamado_id', novoChamado.id)
      }
    }

    if (currentChamadoId) {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase.from('suporte_mensagens').insert({
        chamado_id: currentChamadoId,
        remetente_id: user?.id || null,
        conteudo: mensagem,
        eh_admin: false
      })
      
      if (error && error.code === '23503') {
          localStorage.removeItem('flow63_chamado_id')
          setChamadoId(null)
          setIsLoading(false)
          return iniciarEEnviar() 
      }

      setMensagem("")
      setIsIdentifying(false)
      scrollToBottom()
    }
    setIsLoading(false)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(open) scrollToBottom(); }}>
        <PopoverTrigger asChild>
          <Button size="icon" className="h-14 w-14 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 transition-all border-none">
            {isOpen ? <X className="h-6 w-6 text-white" /> : <MessageCircle className="h-7 w-7 text-white" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top" align="end" className="w-80 h-[500px] p-0 rounded-[2.5rem] overflow-hidden border-none shadow-2xl bg-card">
          <div className="bg-blue-600 p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-xl leading-none mb-1.5">Suporte Central63</h3>
              <p className="text-[11px] opacity-80 font-medium uppercase tracking-wider">
                {isConcluido ? "Sessão Encerrada" : (isIdentifying ? "Nova Conversa" : "Atendimento Online")}
              </p>
            </div>
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          </div>
          
          <ScrollArea ref={scrollAreaRef} className="h-[340px] p-4 bg-slate-50/50 dark:bg-slate-900/50">
            {isIdentifying ? (
              <div className="flex flex-col gap-4 py-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Os teus dados</label>
                    <Input 
                      placeholder="Nome completo" 
                      className="h-12 bg-white border-slate-200 rounded-2xl shadow-sm focus-visible:ring-blue-500"
                      value={userData.nome}
                      onChange={(e) => setUserData({...userData, nome: e.target.value})}
                    />
                    <Input 
                      placeholder="E-mail profissional" 
                      type="email"
                      className="h-12 bg-white border-slate-200 rounded-2xl shadow-sm focus-visible:ring-blue-500"
                      value={userData.email}
                      onChange={(e) => setUserData({...userData, email: e.target.value})}
                    />
                </div>

                <div className="space-y-3 mt-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Departamento</label>
                  <div className="grid grid-cols-1 gap-2">
                    {ATENDENTES.map((atendente) => (
                      <div 
                        key={atendente.id}
                        onClick={() => setAtendenteSelecionado(atendente)}
                        className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                          atendenteSelecionado?.id === atendente.id 
                          ? 'border-blue-600 bg-blue-50 shadow-sm' 
                          : 'border-white bg-white hover:border-slate-200 shadow-sm'
                        }`}
                      >
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                           <User size={14} className={atendenteSelecionado?.id === atendente.id ? 'text-blue-600' : 'text-slate-400'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{atendente.nome}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{atendente.cargo}</p>
                        </div>
                        {atendenteSelecionado?.id === atendente.id && <CheckCircle2 size={18} className="text-blue-600 fill-blue-50" />}
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={iniciarEEnviar} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-2xl mt-2 font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]">
                  Começar Chat
                </Button>
                <button onClick={() => setIsIdentifying(false)} className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors font-semibold text-center py-1">Voltar</button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {mensagens.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.eh_admin ? 'justify-start' : 'justify-end'} animate-in fade-in duration-300`}>
                    <div className={`max-w-[85%] p-3.5 rounded-2xl text-[13px] shadow-sm leading-relaxed ${
                      msg.eh_admin 
                      ? 'bg-white text-slate-800 rounded-tl-none border border-slate-100' 
                      : 'bg-blue-600 text-white rounded-tr-none font-medium'
                    }`}>
                      {msg.conteudo}
                    </div>
                  </div>
                ))}
                
                {isConcluido && (
                  <div className="mt-6 p-6 bg-white border border-blue-100 rounded-[2rem] text-center shadow-xl shadow-blue-900/5 animate-in zoom-in slide-in-from-top-4 duration-500 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/20" />
                    <div className="bg-blue-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                      <Check className="text-white" size={24} strokeWidth={3} />
                    </div>
                    <h4 className="text-slate-900 font-bold text-sm mb-1">Tudo pronto!</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-6">
                      Este atendimento foi finalizado com sucesso. Esperamos ter resolvido todas as suas dúvidas.
                    </p>
                    <Button 
                      onClick={novoAtendimento}
                      className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 gap-2 shadow-lg transition-all active:scale-95"
                    >
                      <RefreshCw size={14} /> Novo Chamado
                    </Button>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {!isIdentifying && !isConcluido && (
            <div className="p-4 border-t bg-white/50 backdrop-blur-md">
              <div className="flex gap-2 items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
                <Input 
                  placeholder="Escreve aqui..." 
                  value={mensagem} 
                  onChange={(e) => setMensagem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && iniciarEEnviar()}
                  className="border-none bg-transparent shadow-none focus-visible:ring-0 h-10 px-3 text-sm font-medium"
                />
                <Button size="icon" onClick={iniciarEEnviar} disabled={isLoading} className="rounded-xl bg-blue-600 hover:bg-blue-700 h-10 w-10 shrink-0 shadow-md transition-all active:scale-90">
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