"use client"

import { useState, useEffect } from "react"
import { 
  Menu, MessageSquare, Send, User, Monitor, 
  Search, Clock, ChevronRight, CheckCheck, 
  Paperclip, StickyNote, History, CheckCircle2,
  Settings, Globe, Cpu, Hash, ShieldCheck, 
  Zap, Loader2, Save, Trash2, MessageCircle, Mail
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
import Loading from "../loading"

const TAG_CONFIG = {
  novo: { label: 'Novo', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  em_progresso: { label: 'Em Atendimento', color: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  urgente: { label: 'Prioridade Máxima', color: 'bg-red-500/10 text-red-600 border-red-200' },
  aguardando: { label: 'Aguardando Cliente', color: 'bg-slate-500/10 text-slate-600 border-slate-200' },
  concluido: { label: 'Finalizado', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' },
}

export default function App() {
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("support")
  
  const [chamados, setChamados] = useState<any[]>([])
  const [chamadoSelecionado, setChamadoSelecionado] = useState<any>(null)
  const [mensagens, setMensagens] = useState<any[]>([])
  const [novaResposta, setNovaResposta] = useState("")
  const [notaInterna, setNotaInterna] = useState("")
  
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)

  useEffect(() => {
    carregarChamados()
  }, [])

  useEffect(() => {
    if (chamadoSelecionado) {
      carregarMensagens(chamadoSelecionado.id)
      setNotaInterna(chamadoSelecionado.notas_internas || "")
      setNoteSaved(false)
      
      const canal = supabase
        .channel(`atendimento-realtime-${chamadoSelecionado.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'suporte_mensagens',
          filter: `chamado_id=eq.${chamadoSelecionado.id}` 
        }, (payload) => {
          setMensagens((prev) => [...prev, payload.new])
          scrollToBottom()
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'suporte_chamados',
          filter: `id=eq.${chamadoSelecionado.id}`
        }, (payload) => {
          setChamadoSelecionado(payload.new)
        })
        .subscribe()
        
      return () => { supabase.removeChannel(canal) }
    }
  }, [chamadoSelecionado?.id])

  const scrollToBottom = () => {
    setTimeout(() => {
      const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
    }, 100);
  }

  async function carregarChamados() {
    setIsLoading(true)
    const { data } = await supabase.from('suporte_chamados').select('*').order('atualizado_em', { ascending: false })
    setChamados(data || [])
    setIsLoading(false)
  }

  async function carregarMensagens(id: string) {
    const { data } = await supabase.from('suporte_mensagens').select('*').eq('chamado_id', id).order('criado_em', { ascending: true })
    setMensagens(data || [])
    scrollToBottom()
  }

  async function atualizarStatusKanban(tag: string) {
    if (!chamadoSelecionado) return
    const { error } = await supabase.from('suporte_chamados').update({ tag, atualizado_em: new Date().toISOString() }).eq('id', chamadoSelecionado.id)
    if (!error) {
      carregarChamados()
      toast({ title: "Status Atualizado" })
    }
  }

  // AJUSTE: Função de exclusão utilizando ID exato e limpando estados de forma persistente
  async function excluirChamado(e: React.MouseEvent, idParaExcluir: string) {
  e.stopPropagation(); 
  if (!confirm("Tem certeza que deseja apagar este atendimento de forma permanente?")) return;

  try {
    // 1. Deleta mensagens primeiro para evitar erro de Foreign Key
    await supabase.from('suporte_mensagens').delete().eq('chamado_id', idParaExcluir);
    
    // 2. Deleta o chamado
    const { error } = await supabase.from('suporte_chamados').delete().eq('id', idParaExcluir);
    
    if (error) throw error;

    // 3. LIMPEZA IMEDIATA DO FRONT-END (Isso evita que ele volte ao atualizar)
    setChamados(prev => prev.filter(c => c.id !== idParaExcluir));
    if (chamadoSelecionado?.id === idParaExcluir) {
      setChamadoSelecionado(null);
      setMensagens([]);
    }

    toast({ title: "Atendimento removido com sucesso" });
  } catch (error: any) {
    toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
  }
}

  async function guardarNota() {
    if (!chamadoSelecionado || isSavingNote) return
    setIsSavingNote(true)
    const { error } = await supabase.from('suporte_chamados').update({ 
      notas_internas: notaInterna,
      atualizado_em: new Date().toISOString()
    }).eq('id', chamadoSelecionado.id)
    
    setTimeout(() => {
      setIsSavingNote(false)
      if (!error) {
        setNoteSaved(true)
        toast({ title: "Notas guardadas com sucesso" })
        setTimeout(() => setNoteSaved(false), 3000)
      }
    }, 600)
  }

  async function enviarResposta() {
    if (!novaResposta.trim() || !chamadoSelecionado || isSending) return
    setIsSending(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase.from('suporte_mensagens').insert({
      chamado_id: chamadoSelecionado.id,
      remetente_id: user?.id,
      conteudo: novaResposta,
      eh_admin: true
    })
    
    if (!error) {
      await supabase.from('suporte_chamados').update({ atualizado_em: new Date().toISOString() }).eq('id', chamadoSelecionado.id)
      setNovaResposta("")
      scrollToBottom()
    }
    setIsSending(false)
  }

  if (isLoading) return <Loading />

  return (
    <div className="flex h-screen bg-[#F5F5F7] dark:bg-background overflow-hidden font-sans">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        activeTab={activeTab} 
        onTabChange={(tab: string) => { setActiveTab(tab); setSidebarOpen(false); }} 
      />
      
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <header className="h-20 shrink-0 flex items-center justify-between px-8 bg-white/70 dark:bg-card/70 border-b border-slate-200/60 z-30 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-5">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-600 rounded-[0.8rem] flex items-center justify-center shadow-md shadow-blue-600/20">
                <MessageCircle className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900">Atendimento Hub</h2>
                <div className="flex items-center gap-2 mt-0.5">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Equipa Online</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <Badge className="bg-white text-slate-700 rounded-lg h-8 px-4 font-semibold border border-slate-200 shadow-sm">
               {chamados.filter(c => c.tag !== 'concluido').length} Em Aberto
             </Badge>
          </div>
        </header>

        <div className="flex-1 overflow-hidden p-6 lg:p-8 flex gap-6">
          
          <div className="w-[320px] flex flex-col bg-white rounded-[1.5rem] border border-slate-200/60 shadow-lg shadow-slate-200/40 overflow-hidden shrink-0">
            <div className="p-4 border-b border-slate-100">
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                <Input placeholder="Buscar conversas..." className="pl-10 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/10 h-10 text-sm transition-all" />
              </div>
            </div>
            <ScrollArea className="flex-1 ">
              <div className="px-3 py-4 space-y-1.5">
                {chamados.map((c) => (
                  <div 
                    key={c.id} 
                    onClick={() => setChamadoSelecionado(c)}
                    className={`group flex flex-col p-4 rounded-[1rem] cursor-pointer transition-all duration-200 relative ${
                      chamadoSelecionado?.id === c.id 
                      ? 'bg-[#E8F0FE] shadow-md shadow-blue-600/20 ring-1 ring-blue-500/30' 
                      : 'bg-transparent shadow-md shadow-black-600/20 hover:bg-slate-150'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-9 w-9 border border-slate-100 shadow-sm">
                        {c.metadados?.avatar_url ? (
                          <img src={c.metadados.avatar_url} className="object-cover" />
                        ) : (
                          <AvatarFallback className={chamadoSelecionado?.id === c.id ? 'bg-blue-600 text-white text-[11px] font-bold' : 'bg-slate-100 text-slate-600 text-[11px] font-bold'}>
                            {c.metadados?.nome?.substring(0, 1).toUpperCase() || (c.usuario_id ? 'U' : 'V')}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate leading-tight ${chamadoSelecionado?.id === c.id ? 'text-slate-900' : 'text-slate-800'}`}>
                          {c.metadados?.nome || (c.usuario_id ? `Utilizador #${c.usuario_id.substring(0, 5)}` : `Visitante ${c.id.substring(0, 4)}`)}
                        </p>
                        <p className={`text-[11px] truncate font-medium mt-0.5 ${chamadoSelecionado?.id === c.id ? 'text-blue-600/80' : 'text-slate-400'}`}>
                          {c.metadados?.email || new Date(c.atualizado_em).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`text-[10px] h-5 px-2 border-none rounded-md font-semibold tracking-tight ${TAG_CONFIG[c.tag as keyof typeof TAG_CONFIG]?.color}`}>
                        {TAG_CONFIG[c.tag as keyof typeof TAG_CONFIG]?.label || 'Novo'}
                      </Badge>
                      <ChevronRight size={14} className={chamadoSelecionado?.id === c.id ? 'text-blue-500' : 'text-slate-300'} />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex-1 flex flex-col bg-white rounded-[1.5rem] border border-slate-200/60 shadow-lg shadow-slate-200/40 overflow-hidden min-w-0">
            {chamadoSelecionado ? (
              <>
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/50 backdrop-blur-md z-20">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 ring-1 ring-slate-200 shadow-sm">
                      {chamadoSelecionado.metadados?.avatar_url ? (
                        <img src={chamadoSelecionado.metadados.avatar_url} className="object-cover" />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-slate-800 to-slate-900 text-white font-bold text-xs">
                          {chamadoSelecionado.metadados?.nome?.substring(0, 2).toUpperCase() || chamadoSelecionado.id.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-base text-slate-900">{chamadoSelecionado.metadados?.nome || `Suporte #${chamadoSelecionado.id.substring(0, 8)}`}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[11px] text-slate-500 font-medium">Sincronizado</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select value={chamadoSelecionado.tag} onValueChange={atualizarStatusKanban}>
                      <SelectTrigger className="w-[160px] h-9 rounded-lg text-xs font-semibold bg-slate-50 border border-slate-200 focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {Object.entries(TAG_CONFIG).map(([key, value]) => (
                          <SelectItem key={key} value={key} className="text-xs font-medium py-2 cursor-pointer">
                            {value.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => excluirChamado(e, chamadoSelecionado.id)}
                      className="h-9 w-9 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden bg-[#F5F5F7]/50">
                  <ScrollArea className="h-full">
                    <div className="p-8 flex flex-col gap-4 max-w-4xl mx-auto">
                      {mensagens.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.eh_admin ? 'justify-end' : 'justify-start'} group animate-in fade-in duration-300`}>
                          <div className={`max-w-[75%] flex flex-col ${msg.eh_admin ? 'items-end' : 'items-start'}`}>
                            <div className={`px-5 py-3 rounded-[1.2rem] text-[14px] shadow-sm leading-relaxed ${
                              msg.eh_admin 
                              ? 'bg-[#007AFF] text-white rounded-br-sm'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                            }`}>
                              {msg.conteudo}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1.5 px-1">
                              <span className="text-[10px] text-slate-400 font-medium">
                                {new Date(msg.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {msg.eh_admin && <CheckCheck size={14} className="text-blue-500" />}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="p-4 border-t border-slate-100 shrink-0 bg-white">
                  <div className="flex gap-2 items-center bg-slate-50 p-1.5 rounded-[1.2rem] border border-slate-200/80 focus-within:bg-white focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-slate-400 hover:text-slate-600"><Paperclip size={18} /></Button>
                    <Input 
                      placeholder="Mensagem..." 
                      value={novaResposta}
                      onChange={(e) => setNovaResposta(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && enviarResposta()}
                      className="border-none bg-transparent focus-visible:ring-0 shadow-none h-10 text-[15px] font-medium placeholder:text-slate-400"
                    />
                    <Button onClick={enviarResposta} disabled={isSending} className="bg-[#007AFF] hover:bg-blue-600 text-white rounded-xl h-10 px-6 shadow-sm">
                      {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="ml-1" />}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50/30 text-slate-400">
                <MessageSquare size={40} className="mb-4 opacity-20" />
                <p className="font-medium text-sm">Selecione uma conversa para começar</p>
              </div>
            )}
          </div>

          <div className="w-[320px] flex flex-col shrink-0 gap-6">
            {chamadoSelecionado ? (
              <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-lg shadow-slate-200/40 flex flex-col overflow-hidden h-full">
                <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                    <TabsList className="w-full bg-slate-100/80 rounded-lg h-9 p-1">
                      <TabsTrigger value="info" className="flex-1 rounded-md text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all">Detalhes</TabsTrigger>
                      <TabsTrigger value="notes" className="flex-1 rounded-md text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all">Notas</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="info" className="flex-1 overflow-hidden m-0 relative data-[state=active]:flex flex-col">
                    <div className="absolute inset-0 overflow-y-auto">
                      <div className="p-6 space-y-8">
                        <div className="flex flex-col items-center text-center">
                          <Avatar className="h-20 w-20 mb-4 shadow-sm border border-slate-100">
                            {chamadoSelecionado.metadados?.avatar_url ? (
                              <img src={chamadoSelecionado.metadados.avatar_url} className="rounded-full object-cover" />
                            ) : (
                              <AvatarFallback className="bg-slate-100 text-slate-700 font-bold text-xl">
                                {chamadoSelecionado.metadados?.nome?.substring(0, 1) || 'V'}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <h4 className="font-semibold text-slate-900 text-[15px]">{chamadoSelecionado.metadados?.nome || 'Informações do Ticket'}</h4>
                          <span className="text-[11px] font-medium text-blue-600 mt-1">{chamadoSelecionado.metadados?.email || `ID: ${chamadoSelecionado.id.substring(0, 12)}`}</span>
                        </div>

                        <div className="space-y-6">
                          <div className="space-y-3">
                            <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-2">Contato</h5>
                            <div className="bg-slate-50 p-3 rounded-xl flex justify-between items-center text-sm border border-slate-100">
                              <span className="font-medium text-slate-500">Email</span>
                              <span className="font-semibold text-slate-800 text-xs">{chamadoSelecionado.metadados?.email || 'N/A'}</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl flex justify-between items-center text-sm border border-slate-100">
                              <span className="font-medium text-slate-500">Plataforma</span>
                              <span className="font-semibold text-slate-800">{chamadoSelecionado.metadados?.plataforma || 'Desconhecida'}</span>
                            </div>
                          </div>

                          <div className="space-y-3">
                             <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-2">Atividade</h5>
                             <div className="pl-3 border-l-[3px] border-slate-200 space-y-4 ml-1">
                                <div>
                                   <p className="text-sm font-semibold text-slate-800">Criado em</p>
                                   <p className="text-xs text-slate-500 mt-0.5">{new Date(chamadoSelecionado.criado_em).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                </div>
                                <div>
                                   <p className="text-sm font-semibold text-slate-800">Atualizado</p>
                                   <p className="text-xs text-slate-500 mt-0.5">{new Date(chamadoSelecionado.atualizado_em).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                </div>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="notes" className="flex-1 overflow-hidden m-0 relative data-[state=active]:flex flex-col bg-white">
                    <div className="absolute inset-0 flex flex-col p-6">
                      <div className="flex items-center justify-center mb-6 relative">
                         <span className="text-[11px] font-medium text-slate-400">
                            {new Date(chamadoSelecionado.atualizado_em).toLocaleString([], { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                         </span>
                         {noteSaved && <CheckCircle2 size={14} className="text-emerald-500 absolute right-0 animate-in fade-in zoom-in duration-300" />}
                      </div>

                      <div className="flex-1 flex flex-col relative">
                        <Textarea 
                          placeholder="Toque para adicionar notas..." 
                          className="flex-1 resize-none border-none bg-transparent shadow-none focus-visible:ring-0 p-0 text-[15px] font-normal leading-relaxed text-slate-800 placeholder:text-slate-300"
                          value={notaInterna}
                          onChange={(e) => {
                            setNotaInterna(e.target.value)
                            setNoteSaved(false)
                          }}
                          onBlur={guardarNota}
                        />
                        {isSavingNote && (
                          <div className="absolute top-2 right-2 bg-white/50 backdrop-blur-sm rounded-full p-1">
                            <Loader2 size={16} className="animate-spin text-slate-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="pt-4 border-t border-slate-50 mt-auto">
                        <Button 
                          onClick={guardarNota} 
                          disabled={isSavingNote}
                          variant="ghost"
                          className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium text-sm"
                        >
                          {isSavingNote ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                          {noteSaved ? 'Guardado' : 'Guardar Manualmente'}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="h-full bg-white rounded-[1.5rem] border border-slate-200/60 flex items-center justify-center">
                 <Settings size={28} className="text-slate-200" />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}