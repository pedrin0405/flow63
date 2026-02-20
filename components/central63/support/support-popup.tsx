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
          setMensagens((prev) => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          })
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

  async function iniciarEEnviar() {
    if (!mensagem.trim() || isLoading) return;

    // Tenta obter o ID do estado ou do localStorage para garantir persistência
    let currentChamadoId = chamadoId || localStorage.getItem('flow63_chamado_id');

    // Se não houver ID e não estiver identificando, abre o formulário
    if (!currentChamadoId && !isIdentifying && (!userData.nome || !userData.email || !atendenteSelecionado)) {
      setIsIdentifying(true);
      return;
    }

    // Se estiver identificando, valida os campos
    if (isIdentifying && (!userData.nome || !userData.email || !atendenteSelecionado)) {
      alert("Por favor, preencha o seu nome, e-mail e selecione um atendente.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. CRIAÇÃO DO CHAMADO (Se não existir um ID ativo)
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
          currentChamadoId = novoChamado.id; // Define o ID para a mensagem abaixo
          setChamadoId(novoChamado.id);
          setIsConcluido(false);
          localStorage.setItem('flow63_chamado_id', novoChamado.id);
        }
      }

      // 2. ENVIO DA MENSAGEM (Sempre usando o currentChamadoId do passo anterior)
      if (currentChamadoId) {
        const { data: { user } } = await supabase.auth.getUser();
        
        const { error: errorMsg } = await supabase.from('suporte_mensagens').insert({
          chamado_id: currentChamadoId, // Vinculação garantida com o ID da tabela suporte_chamados
          remetente_id: user?.id || null,
          conteudo: mensagem,
          eh_admin: false
        });
        
        if (errorMsg) {
          // Se o chamado foi removido do banco, limpa local e reinicia
          if (errorMsg.code === '23503') {
            localStorage.removeItem('flow63_chamado_id');
            setChamadoId(null);
            setIsLoading(false);
            return iniciarEEnviar();
          }
          throw errorMsg;
        }

        setMensagem("");
        setIsIdentifying(false); 
        scrollToBottom();
      }
    } catch (error) {
      console.error("Erro no fluxo de suporte:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(open) scrollToBottom(); }}>
        <PopoverTrigger asChild>
          <Button size="icon" className="h-14 w-14 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 transition-all border-none">
            {isOpen ? <X className="h-6 w-6 text-white" /> : <MessageCircle className="h-7 w-7 text-white" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top" align="end" className="w-80 h-[500px] p-0 rounded-[2.5rem] overflow-hidden border-none shadow-2xl bg-card flex flex-col">
          <div className="bg-blue-600 p-6 text-white relative overflow-hidden shrink-0">
            <div className="relative z-10">
              <h3 className="font-bold text-xl leading-none mb-1.5">Suporte Central63</h3>
              <p className="text-[11px] opacity-80 font-medium uppercase tracking-wider">
                {isConcluido ? "Sessão Encerrada" : (isIdentifying ? "Nova Conversa" : "Atendimento Online")}
              </p>
            </div>
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          </div>
          
          <div className="flex-1 relative overflow-hidden">
            <ScrollArea 
              ref={scrollAreaRef} 
              className={`h-full p-4 bg-slate-50/50 dark:bg-slate-900/50 transition-all ${isConcluido ? 'blur-[2px] pointer-events-none' : ''}`}
            >
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

                  <Button 
                    type="button" 
                    onClick={(e) => {
                      e.preventDefault();
                      iniciarEEnviar();
                    }} 
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-2xl mt-2 font-bold shadow-lg"
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Começar Chat"}
                  </Button>
                  <button onClick={() => setIsIdentifying(false)} className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors font-semibold text-center py-1">Voltar</button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {mensagens.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.eh_admin ? 'items-start' : 'items-end'} gap-1`}>
                      {msg.eh_admin && (
                        <span className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-tight">
                          {msg.metadados?.nome_remetente || "Suporte"}
                        </span>
                      )}
                      <div className={`max-w-[85%] p-3.5 rounded-2xl text-[13px] shadow-sm leading-relaxed ${
                        msg.eh_admin 
                        ? 'bg-white text-slate-800 rounded-tl-none border border-slate-100' 
                        : 'bg-blue-600 text-white rounded-tr-none font-medium'
                      }`}>
                        {msg.conteudo}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {isConcluido && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-white/20 backdrop-blur-[2px] animate-in fade-in duration-500">
                <div className="w-full p-6 bg-white border border-blue-100 rounded-[2.5rem] text-center shadow-2xl shadow-blue-900/20 animate-in zoom-in slide-in-from-bottom-8 duration-500 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500" />
                  <div className="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                    <Check className="text-white" size={32} strokeWidth={3} />
                  </div>
                  <h4 className="text-slate-900 font-bold text-lg mb-2">Atendimento Concluído</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8 px-2">
                    Esperamos ter resolvido as tuas questões. Se precisares de algo mais, estamos aqui.
                  </p>
                  <Button 
                    onClick={novoAtendimento}
                    className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 gap-2 shadow-lg transition-all active:scale-95"
                  >
                    <RefreshCw size={16} /> Novo Chamado
                  </Button>
                </div>
              </div>
            )}
          </div>

          {!isIdentifying && !isConcluido && (
            <div className="p-4 border-t bg-white/50 backdrop-blur-md shrink-0">
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