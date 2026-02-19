'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/supabase"

export function SuportePopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [mensagem, setMensagem] = useState("")
  const [mensagens, setMensagens] = useState<any[]>([])
  const [chamadoId, setChamadoId] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // 1. Ao carregar, verifica se já existe um chamado guardado no navegador
  useEffect(() => {
    const idSalvo = localStorage.getItem('flow63_chamado_id')
    if (idSalvo) {
      setChamadoId(idSalvo)
      carregarHistorico(idSalvo)
    }
  }, [])

  // 2. Realtime: Ouve novas mensagens sempre que o chamadoId mudar ou o chat abrir
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

  async function enviarMensagem() {
    if (!mensagem.trim()) return

    let currentChamadoId = chamadoId

    // 3. Se não houver chamado ativo, cria um agora
    if (!currentChamadoId) {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: novoChamado, error } = await supabase
        .from('suporte_chamados')
        .insert({ 
          usuario_id: user?.id || null, // null para deslogados
          status: 'aberto'
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
      scrollToBottom()
    }
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
            <p className="text-xs opacity-70">Estamos online para ajudar</p>
          </div>
          
          <ScrollArea ref={scrollAreaRef} className="h-[340px] p-4 bg-slate-50 dark:bg-slate-900/50">
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
                    ? 'bg-white dark:bg-slate-800 text-foreground rounded-tl-none border' 
                    : 'bg-[#dcf8c6] dark:bg-[#056162] text-slate-900 dark:text-white rounded-tr-none'
                  }`}>
                    {msg.conteudo}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 flex gap-2 items-center border-t bg-card">
            <Input 
              placeholder="Digite sua dúvida..." 
              value={mensagem} 
              onChange={(e) => setMensagem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && enviarMensagem()}
              className="rounded-full bg-slate-100 dark:bg-slate-800 border-none h-10"
            />
            <Button size="icon" onClick={enviarMensagem} className="rounded-full bg-[#075E54] hover:bg-[#128C7E] shrink-0 h-10 w-10">
              <Send className="h-4 w-4 text-white" />
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}