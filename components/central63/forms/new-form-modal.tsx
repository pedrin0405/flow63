"use client"

import { useState, useEffect, useMemo } from "react"
import { User, Briefcase, UserCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/supabase"

interface NewFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function NewFormModal({ isOpen, onClose, onSubmit }: NewFormModalProps) {
  const [clientName, setClientName] = useState("")
  const [brokerName, setBrokerName] = useState("")
  const [secretaryName, setSecretaryName] = useState("")
  const [allBrokers, setAllBrokers] = useState<any[]>([])
  const [filter, setFilter] = useState<"todos" | "pmw" | "arg">("todos")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const initData = async () => {
        setIsLoading(true)
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const userName = user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split('@')[0] || ""
            setSecretaryName(userName)
          }

          const [pmwResponse, auxResponse] = await Promise.all([
            supabase.from('corretores_pmw').select('id, nome'),
            supabase.from('corretores_aux').select('id, nome')
          ])

          if (pmwResponse.error) throw pmwResponse.error
          if (auxResponse.error) throw auxResponse.error

          const pmwList = (pmwResponse.data || []).map(b => ({ ...b, origem: 'pmw' }))
          const auxList = (auxResponse.data || []).map(b => ({ ...b, origem: 'arg' }))

          const combined = [...pmwList, ...auxList]

          const unique = combined.reduce((acc: any[], current) => {
            const exists = acc.find(item => item.nome.trim().toLowerCase() === current.nome.trim().toLowerCase())
            return exists ? acc : [...acc, current]
          }, [])

          setAllBrokers(unique.sort((a, b) => a.nome.localeCompare(b.nome)))

        } catch (error) {
          console.error("Erro ao carregar dados:", error)
        } finally {
          setIsLoading(false)
        }
      }
      initData()
    }
  }, [isOpen])

  const displayedBrokers = useMemo(() => {
    if (filter === "todos") return allBrokers
    return allBrokers.filter(b => b.origem === filter)
  }, [allBrokers, filter])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientName || !brokerName || !secretaryName) return
    onSubmit({ clientName, brokerName, secretaryName })
    setClientName("")
    setBrokerName("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] gap-0 p-0 overflow-hidden rounded-2xl">
        <div className="p-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
              Novo Formulário
            </DialogTitle>
            <DialogDescription>Preencha os dados abaixo.</DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <ScrollArea className="max-h-[60vh] px-6 py-4">
            <div className="space-y-6 p-1">

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Nome do Cliente</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nome completo"
                    className="pl-10 h-11 rounded-xl bg-accent/20 border-accent-foreground/10"
                    required
                  />
                </div>
              </div>

              {/* Campo Corretor com Bloco de Filtros Ajustado */}
              <div className="flex items-end gap-3">
                <div className="flex flex-col gap-2 min-w-[220px]">
                  <Label className="text-xs font-bold uppercase text-muted-foreground pb-1">
                    Corretor Responsável
                  </Label>

                  <Select value={brokerName} onValueChange={setBrokerName} required>
                    <SelectTrigger className="h-11 rounded-xl bg-accent/20 border-accent-foreground/10 pl-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Briefcase size={18} />
                        <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione o corretor..."} />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {displayedBrokers.length > 0 ? (
                        displayedBrokers.map((broker) => (
                          <SelectItem key={broker.nome} value={broker.nome}>
                            {broker.nome}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>Nenhum corretor nesta lista</SelectItem>
                      )}
                    </SelectContent>
                  </Select>

                </div>
                <div className="flex flex-col gap-2 min-w-[220px]">
                  <div className="flex items-center gap-4 self-start" style={{ marginTop: '-0.5rem' }}>
                    {/* translate-y para alinhar com o centro do texto da label */}
                    <div className="flex bg-accent/30 p-1 rounded-lg gap-1 border border-accent-foreground/5 translate-y-[2px]">
                      <button
                        type="button"
                        onClick={() => setFilter("todos")}
                        className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all ${filter === "todos" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-accent/50"}`}
                      >
                        TODOS
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilter("pmw")}
                        className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all ${filter === "pmw" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-accent/50"}`}
                      >
                        PALMAS
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilter("arg")}
                        className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all ${filter === "arg" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-accent/50"}`}
                      >
                        ARAGUAÍNA
                      </button>
                    </div>
                  </div>
                </div>
              </div>


              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Responsável (Secretária)</Label>
                <div className="relative">
                  <UserCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={18} />
                  <Input
                    value={secretaryName}
                    onChange={(e) => setSecretaryName(e.target.value)}
                    className="pl-10 h-11 rounded-xl bg-primary/5 border-primary/20 text-primary font-medium"
                    required
                  />
                </div>
              </div>
            </div>

          </ScrollArea>

          <div className="p-6 pt-4 border-t bg-gray-50/50 dark:bg-zinc-900/50">
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl h-11 font-bold">Cancelar</Button>
              <Button type="submit" className="rounded-xl h-11 px-8 font-bold bg-primary text-white" disabled={isLoading}>
                Criar Ficha
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}