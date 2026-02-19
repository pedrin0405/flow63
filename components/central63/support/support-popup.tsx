'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, X, User, Mail, Loader2, Check } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/supabase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Configuração dos atendentes disponíveis
const ATENDENTES = [
  { id: 'marketing_1', nome: 'Equipa Marketing', cargo: 'Marketing', avatar: '' },
  { id: 'gestor_1', nome: 'Gestor de Suporte', cargo: 'Gestão', avatar: '' },
]

export function SuportePopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [mensagem, setMensagem] = useState("")
  const [mensagens, setMensagens] = useState<any[]>([])
  const [chamadoId, setChamadoId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Estados para identificação e seleção
  const [userData, setUserData] = useState({ nome: "", email: "" })
  const [atendenteSelecionado, setAtendenteSelecionado] = useState<any>(null)
  const [isIdentifying, setIsIdentifying] = useState(false)
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // 1. Verifica se já existe um chamado ou utilizador logado
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

  // 2. Realtime para novas mensagens
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
    const { data } = await supabase
      .from('suporte_mensagens')
      .select('*')
      .eq('chamado_id', id)
      .order('criado_em', { ascending: true })
    if (data) setMensagens(data)
    scrollToBottom()
  }

  async function iniciarEEnviar() {
    if (!mensagem.trim() || isLoading) return
    
    // Se não houver chamado e os dados/atendente estiverem vazios, pede identificação
    if (!chamadoId && (!userData.nome || !userData.email || !atendenteSelecionado)) {
      setIsIdentifying(true)
      return
    }

    setIsLoading(true)
    let currentChamadoId = chamadoId

    if (!currentChamadoId) {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: novoChamado, error } = await supabase
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
            avatar_url: user?.user_metadata?.avatar_url || null,
            plataforma: window.navigator.platform,
            origem: 'Chat Pop-up'
          }
        })
        .select()
        .single()

      if (novoChamado) {
        currentChamadoId = novoChamado.id
        setChamadoId(novoChamado.id)
        localStorage.setItem('flow63_chamado_id', novoChamado.id)
      }
    }

    if (currentChamadoId) {
      const { data: { user } } = await supabase.auth.getUser()
      
      await supabase.from('suporte_mensagens').insert({
        chamado_id: currentChamadoId,
        remetente_id: user?.id || null,
        conteudo: mensagem,
        eh_admin: false
      })
      
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
          <Button size="icon" className="h-14 w-14 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 transition-all">
            {isOpen ? <X className="h-6 w-6 text-white" /> : <MessageCircle className="h-7 w-7 text-white" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top" align="end" className="w-80 h-[500px] p-0 rounded-[2rem] overflow-hidden border-none shadow-2xl bg-card">
          <div className="bg-blue-600 p-5 text-white">
            <h3 className="font-bold text-lg leading-none mb-1">Suporte Central63</h3>
            <p className="text-xs opacity-70">
              {isIdentifying ? "Configure seu atendimento" : "Estamos online para ajudar"}
            </p>
          </div>
          
          <ScrollArea ref={scrollAreaRef} className="h-[340px] p-4 bg-slate-50 dark:bg-slate-900/50">
            {isIdentifying ? (
              <div className="flex flex-col gap-4 py-4 animate-in fade-in slide-in-from-bottom-2">
                <p className="text-[11px] text-slate-500 font-medium px-1 uppercase tracking-wider">Identificação</p>
                <div className="space-y-3">
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-400" size={16} />
                    <Input 
                      placeholder="Seu nome" 
                      className="pl-10 h-11 bg-white border-slate-200 rounded-xl"
                      value={userData.nome}
                      onChange={(e) => setUserData({...userData, nome: e.target.value})}
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
                    <Input 
                      placeholder="Seu e-mail" 
                      type="email"
                      className="pl-10 h-11 bg-white border-slate-200 rounded-xl"
                      value={userData.email}
                      onChange={(e) => setUserData({...userData, email: e.target.value})}
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 font-medium px-1 uppercase tracking-wider mt-2">Escolha com quem falar</p>
                <div className="grid grid-cols-1 gap-2">
                  {ATENDENTES.map((atendente) => (
                    <div 
                      key={atendente.id}
                      onClick={() => setAtendenteSelecionado(atendente)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        atendenteSelecionado?.id === atendente.id 
                        ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-slate-100 text-[10px] font-bold">{atendente.nome.substring(0,2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{atendente.nome}</p>
                        <p className="text-[10px] text-slate-500">{atendente.cargo}</p>
                      </div>
                      {atendenteSelecionado?.id === atendente.id && <Check size={14} className="text-blue-600" />}
                    </div>
                  ))}
                </div>

                <Button onClick={iniciarEEnviar} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 rounded-xl mt-2 font-bold shadow-lg shadow-blue-600/20">
                  Iniciar Atendimento
                </Button>
                <button onClick={() => setIsIdentifying(false)} className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors font-medium">Cancelar</button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {mensagens.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground mt-4">
                    Olá! Como podemos ajudar hoje?
                  </p>
                )}
                {mensagens.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.eh_admin ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                      msg.eh_admin 
                      ? 'bg-white dark:bg-slate-800 text-foreground rounded-tl-none border border-slate-100' 
                      : 'bg-blue-600 text-white rounded-tr-none'
                    }`}>
                      {msg.conteudo}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {!isIdentifying && (
            <div className="p-4 border-t bg-card">
              <div className="flex gap-2 items-center">
                <Input 
                  placeholder="Digite sua dúvida..." 
                  value={mensagem} 
                  onChange={(e) => setMensagem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && iniciarEEnviar()}
                  className="rounded-full bg-slate-100 dark:bg-slate-800 border-none h-10 px-4 focus-visible:ring-1 focus-visible:ring-blue-500"
                />
                <Button size="icon" onClick={iniciarEEnviar} disabled={isLoading} className="rounded-full bg-blue-600 hover:bg-blue-700 shrink-0 h-10 w-10 shadow-md">
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