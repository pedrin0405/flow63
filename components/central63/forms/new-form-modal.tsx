"use client"

import { useState, useEffect } from "react"
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
import { ScrollArea } from "@/components/ui/scroll-area" // Importação adicionada
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
  const [brokers, setBrokers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Busca dados iniciais
  useEffect(() => {
    if (isOpen) {
      const initData = async () => {
        setIsLoading(true)
        try {
          // 1. Busca usuário logado
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const userName = user.user_metadata?.full_name || 
                             user.user_metadata?.name || 
                             user.email?.split('@')[0] || 
                             ""
            setSecretaryName(userName)
          }

          // 2. Busca corretores
          const { data: brokersData, error: brokersError } = await supabase
            .from('corretores_pmw')
            .select('id, nome')
            .order('nome', { ascending: true })

          if (brokersError) throw brokersError
          setBrokers(brokersData || [])

        } catch (error) {
          console.error("Erro ao carregar dados:", error)
        } finally {
          setIsLoading(false)
        }
      }

      initData()
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!clientName || !brokerName || !secretaryName) return

    onSubmit({
      clientName,
      brokerName,
      secretaryName
    })

    setClientName("")
    setBrokerName("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] gap-0 p-0 overflow-hidden rounded-2xl">
        {/* Header Fixo */}
        <div className="p-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
              Novo Formulário
            </DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para iniciar um novo atendimento.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          
          {/* Área de Scroll para os Campos */}
          <ScrollArea className="max-h-[60vh] px-6 py-4">
            <div className="space-y-6 p-1">
              
              {/* Campo Cliente */}
              <div className="space-y-2">
                <Label htmlFor="client" className="text-xs font-bold uppercase text-muted-foreground">
                  Nome do Cliente
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="client"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Digite o nome completo do cliente"
                    className="pl-10 h-11 rounded-xl bg-accent/20 border-accent-foreground/10 focus-visible:ring-primary"
                    required
                  />
                </div>
              </div>

              {/* Campo Corretor */}
              <div className="space-y-2">
                <Label htmlFor="broker" className="text-xs font-bold uppercase text-muted-foreground">
                  Corretor Responsável
                </Label>
                <Select value={brokerName} onValueChange={setBrokerName} required>
                  <SelectTrigger className="h-11 rounded-xl bg-accent/20 border-accent-foreground/10 focus:ring-primary pl-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase size={18} />
                      <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione o corretor..."} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {brokers.length > 0 ? (
                      brokers.map((broker) => (
                        <SelectItem key={broker.id} value={broker.nome}>
                          {broker.nome}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        {isLoading ? "Carregando..." : "Nenhum corretor encontrado"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Campo Secretária */}
              <div className="space-y-2">
                <Label htmlFor="secretary" className="text-xs font-bold uppercase text-muted-foreground">
                  Secretária (Responsável)
                </Label>
                <div className="relative">
                  <UserCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={18} />
                  <Input
                    id="secretary"
                    value={secretaryName}
                    onChange={(e) => setSecretaryName(e.target.value)}
                    placeholder="Nome da secretária"
                    className="pl-10 h-11 rounded-xl bg-primary/5 border-primary/20 font-medium text-primary focus-visible:ring-primary"
                    required
                  />
                </div>
              </div>

            </div>
          </ScrollArea>

          {/* Footer Fixo */}
          <div className="p-6 pt-4 border-t bg-gray-50/50 dark:bg-zinc-900/50">
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl h-11 font-bold">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="rounded-xl h-11 px-8 font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
                disabled={isLoading}
              >
                Criar Ficha
              </Button>
            </DialogFooter>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  )
}