"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import { Bell, Send, Trash2, Loader2, Megaphone, Edit2, Plus, X } from "lucide-react"

export function BroadcastTab() {
  const [message, setMessage] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [broadcasts, setBroadcasts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  useEffect(() => {
    fetchBroadcasts()
  }, [])

  const handleSave = async () => {
    if (!message.trim()) return toast.error("A mensagem não pode estar vazia")

    setIsSaving(true)
    try {
      const now = new Date().toISOString()
      const apiConfig = { active: true, updatedAt: now }
      
      let error
      if (editingId) {
        const res = await supabase
          .from('company_settings')
          .update({ 
            url_site: message,
            api_config: apiConfig
          })
          .eq('id', editingId)
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
      
      toast.success(editingId ? "Comunicado atualizado!" : "Comunicado disparado!")
      setMessage("")
      setEditingId(null)
      await fetchBroadcasts()
    } catch (error: any) {
      toast.error("Erro ao salvar: " + (error.message || "Erro de conexão"))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja excluir este comunicado?")) return

    try {
      const { error } = await supabase
        .from('company_settings')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      toast.success("Comunicado removido")
      fetchBroadcasts()
    } catch (error: any) {
      toast.error("Erro ao remover")
    }
  }

  const startEdit = (broadcast: any) => {
    setEditingId(broadcast.id)
    setMessage(broadcast.url_site)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Formulário de Criação/Edição */}
      <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white dark:bg-zinc-950">
        <CardHeader className="p-10 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-primary/5">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-3xl bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/30 rotate-3 transition-transform">
              <Megaphone size={32} />
            </div>
            <div>
              <CardTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                {editingId ? "Editar Comunicado" : "Novo Broadcast"}
              </CardTitle>
              <CardDescription className="text-xs font-black uppercase tracking-[0.2em] text-primary/60 mt-1">
                {editingId ? "Modificando mensagem existente" : "Comunicação Global Interna"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-10 space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400">Mensagem do Comunicado</label>
            <Textarea 
              placeholder="Digite aqui o aviso..."
              className="min-h-[150px] rounded-[2rem] p-8 bg-slate-50 dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 focus:ring-primary/20 text-base font-bold leading-relaxed resize-none shadow-inner"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="p-10 pt-0 bg-transparent flex justify-between items-center">
          {editingId && (
            <Button 
              variant="ghost" 
              className="rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-[0.2em]"
              onClick={() => { setEditingId(null); setMessage(""); }}
            >
              Cancelar Edição
            </Button>
          )}
          <Button 
            className="rounded-2xl h-14 px-12 font-black uppercase text-xs tracking-[0.15em] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all ml-auto"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 size={18} className="animate-spin mr-2" /> : editingId ? <Edit2 size={18} className="mr-2" /> : <Send size={18} className="mr-2" />}
            {editingId ? "Salvar Alterações" : "Disparar Mensagem"}
          </Button>
        </CardFooter>
      </Card>

      {/* Lista de Comunicados Ativos */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 ml-6">Comunicados Ativos ({broadcasts.length})</h3>
        
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="animate-spin text-primary opacity-20" size={40} />
          </div>
        ) : broadcasts.length > 0 ? (
          <div className="grid gap-4">
            {broadcasts.map((b) => (
              <div key={b.id} className="group bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all flex items-center justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed truncate">
                    {b.url_site}
                  </p>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2 block">
                    Enviado em: {new Date(b.updated_at || b.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-zinc-800 border-none hover:bg-primary hover:text-white transition-all"
                    onClick={() => startEdit(b)}
                  >
                    <Edit2 size={16} />
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-zinc-800 border-none hover:bg-red-500 hover:text-white transition-all"
                    onClick={() => handleDelete(b.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-slate-50/50 dark:bg-zinc-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-zinc-800">
            <Bell className="mx-auto text-slate-300 mb-4" size={40} />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhum comunicado ativo</p>
          </div>
        )}
      </div>
    </div>
  )
}
