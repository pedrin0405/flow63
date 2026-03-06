"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import { Bell, Send, Trash2, Loader2, Megaphone } from "lucide-react"

export function BroadcastTab({ onRefresh }: { onRefresh?: () => void }) {
  const [message, setMessage] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [currentBroadcast, setCurrentBroadcast] = useState<any>(null)

  const fetchBroadcast = async () => {
    try {
      // Busca todos para garantir que pegamos o mais recente e limpamos lixo
      const { data } = await supabase
        .from('company_settings')
        .select('*')
        .eq('instance_name', 'GLOBAL_BROADCAST')
        .order('id', { ascending: false })
      
      if (data && data.length > 0) {
        setCurrentBroadcast(data[0])
        setMessage(data[0].url_site || "")
        
        // Limpeza opcional: se houver duplicatas por erro anterior, removemos
        if (data.length > 1) {
            const extraIds = data.slice(1).map(i => i.id)
            await supabase.from('company_settings').delete().in('id', extraIds)
        }
      } else {
        setCurrentBroadcast(null)
      }
    } catch (err) {
      console.error("Erro ao buscar broadcast:", err)
    }
  }

  useEffect(() => {
    fetchBroadcast()
  }, [])

  const handleSave = async () => {
    if (!message.trim()) return toast.error("A mensagem não pode estar vazia")

    setIsSaving(true)
    try {
      const now = new Date().toISOString()
      const apiConfig = { active: true, updatedAt: now }
      
      // Busca ID existente para fazer update em vez de insert duplicado
      const { data: existing } = await supabase
        .from('company_settings')
        .select('id')
        .eq('instance_name', 'GLOBAL_BROADCAST')
        .limit(1)

      let error
      if (existing && existing.length > 0) {
        const res = await supabase
          .from('company_settings')
          .update({ 
            url_site: message,
            api_config: apiConfig
          })
          .eq('id', existing[0].id)
        error = res.error
      } else {
        const res = await supabase
          .from('company_settings')
          .insert([{ 
            instance_name: 'GLOBAL_BROADCAST', 
            url_site: message, 
            api_config: apiConfig 
          }])
        error = res.error
      }

      if (error) throw error
      
      toast.success("Comunicado disparado com sucesso!")
      await fetchBroadcast()
      onRefresh?.()
    } catch (error: any) {
      console.error(error)
      toast.error("Erro ao disparar: " + (error.message || "Erro de conexão"))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Deseja remover o comunicado atual?")) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('company_settings')
        .delete()
        .eq('instance_name', 'GLOBAL_BROADCAST')

      if (error) throw error
      
      setMessage("")
      setCurrentBroadcast(null)
      toast.success("Comunicado removido com sucesso")
      onRefresh?.()
    } catch (error: any) {
      console.error(error)
      toast.error("Erro ao remover: " + (error.message || "Erro desconhecido"))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white dark:bg-zinc-950">
        <CardHeader className="p-10 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-primary/5">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-3xl bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/30 rotate-3 group-hover:rotate-0 transition-transform">
              <Megaphone size={32} />
            </div>
            <div>
              <CardTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Broadcast</CardTitle>
              <CardDescription className="text-xs font-black uppercase tracking-[0.2em] text-primary/60 mt-1">
                Comunicação Global Interna
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-10 space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400">Mensagem do Comunicado</label>
            <Textarea 
              placeholder="Digite aqui o aviso que todos os usuários verão..."
              className="min-h-[180px] rounded-[2rem] p-8 bg-slate-50 dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 focus:ring-primary/20 text-base font-bold leading-relaxed resize-none shadow-inner"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100/50 dark:border-blue-900/30 flex items-start gap-4">
            <div className="h-10 w-10 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                <Bell size={20} />
            </div>
            <div className="space-y-1 pt-1">
                <p className="text-sm font-bold text-blue-900 dark:text-blue-300">Como funciona?</p>
                <p className="text-xs text-blue-700/70 dark:text-blue-400/70 leading-relaxed font-medium">
                    Ao disparar, a mensagem aparecerá no card de comunicados da página inicial para todos os usuários logados.
                </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-10 pt-0 bg-transparent flex flex-col sm:flex-row gap-4 justify-between items-center">
          <Button 
            variant="ghost" 
            className="rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-[0.2em] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
            onClick={handleDelete}
            disabled={!currentBroadcast?.url_site || isSaving}
          >
            <Trash2 size={16} className="mr-2" />
            Remover Ativo
          </Button>
          <Button 
            className="rounded-2xl h-14 px-12 font-black uppercase text-xs tracking-[0.15em] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all w-full sm:w-auto"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Send size={18} className="mr-2" />}
            Disparar Mensagem
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
