"use client"

import { useState, useEffect } from "react"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { 
  Loader2, 
  MapPin, 
  User, 
  Hash, 
  Send,
  Sparkles,
  CheckCircle2
} from "lucide-react"

interface UpdateLeadModalProps {
  isOpen: boolean
  onClose: () => void
}

type ModalStatus = "idle" | "loading" | "success"

export function UpdateLeadModal({ isOpen, onClose }: UpdateLeadModalProps) {
  const { toast } = useToast()
  const [status, setStatus] = useState<ModalStatus>("idle")
  const [formData, setFormData] = useState({
    cidade: "Palmas",
    codigoCliente: "",
    codigoAtendimento: ""
  })

  useEffect(() => {
    if (isOpen) setStatus("idle")
  }, [isOpen])

  const handleSend = async () => {
    // AJUSTE: Valida se AMBOS estão vazios. Se um deles tiver valor, ele prossegue.
    if (!formData.codigoCliente && !formData.codigoAtendimento) {
      toast({
        title: "Atenção",
        description: "Preencha ao menos um dos códigos (Cliente ou Atendimento).",
        variant: "destructive"
      })
      return
    }

    setStatus("loading")
    try {
      const response = await fetch("https://n8n.srv1207506.hstgr.cloud/webhook/central63-SOLO", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cidade: formData.cidade,
          // Se o campo estiver vazio, envia null ou 0 para não quebrar o parseInt
          codigoCliente: formData.codigoCliente ? parseInt(formData.codigoCliente) : null,
          codigoAtendimento: formData.codigoAtendimento ? parseInt(formData.codigoAtendimento) : null
        })
      })

      if (response.ok) {
        setStatus("success")
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        throw new Error()
      }
    } catch (error) {
      setStatus("idle")
      toast({
        title: "Erro na integração",
        description: "Não foi possível conectar ao serviço.",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[350px] gap-0 p-0 overflow-hidden border-white/10 bg-background backdrop-blur-xl shadow-2xl transition-all duration-300">
        
        {status === "idle" && (
          <div className="animate-in fade-in duration-300">
            <div className="bg-gradient-to-br from-primary/10 via-transparent to-transparent p-5 pb-3">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="p-1 rounded-md bg-primary/10 text-primary">
                    <Sparkles size={14} />
                  </div>
                  <DialogTitle className="text-lg font-bold tracking-tight">
                    Sincronizar Solo
                  </DialogTitle>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Atualização manual de atendimento na base.
                </p>
              </DialogHeader>
            </div>

            <div className="px-5 py-3 space-y-3">
              

              <div className="grid grid-cols-2 gap-3">
                
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/80 flex items-center gap-1.5">
                    <User size={10} className="text-primary" />
                    Cód. Lead
                  </Label>
                  <Input 
                    type="number"
                    className="bg-background/50 border-white/5 h-9 text-sm"
                    placeholder="Opcional"
                    value={formData.codigoCliente}
                    onChange={(e) => setFormData({...formData, codigoCliente: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/80 flex items-center gap-1.5">
                  <MapPin size={10} className="text-primary" />
                  Localidade
                </Label>
                <Select 
                  value={formData.cidade} 
                  onValueChange={(v) => setFormData({...formData, cidade: v})}
                >
                  <SelectTrigger className="bg-background/50 border-white/5 h-9 text-sm transition-all">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="backdrop-blur-xl border-white/10">
                    <SelectItem value="Palmas">Palmas</SelectItem>
                    <SelectItem value="Araguaina">Araguaína</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                {/* <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/80 flex items-center gap-1.5">
                    <Hash size={10} className="text-primary" />
                    Cód. Atend.
                  </Label>
                  <Input 
                    type="number"
                    className="bg-background/50 border-white/5 h-9 text-sm"
                    placeholder="Opcional"
                    value={formData.codigoAtendimento}
                    onChange={(e) => setFormData({...formData, codigoAtendimento: e.target.value})}
                  />
                </div> */}
              </div>
            </div>

            <DialogFooter className="p-5 pt-1">
              <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-8">Voltar</Button>
              <Button onClick={handleSend} className="bg-primary h-8 px-5 active:scale-95 text-xs">
                <div className="flex items-center gap-1.5">
                  <Send size={12} />
                  <span>Lançar</span>
                </div>
              </Button>
            </DialogFooter>
          </div>
        )}

        {status === "loading" && (
          <div className="p-12 flex flex-col items-center justify-center space-y-4 min-h-[280px] animate-in fade-in zoom-in duration-300">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
              <Loader2 className="h-12 w-12 text-primary animate-spin relative z-10" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold tracking-tight">Atualizando atendimento</h3>
              <p className="text-[11px] text-muted-foreground animate-pulse">Enviando dados para a base SOLO...</p>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="p-12 flex flex-col items-center justify-center space-y-4 min-h-[280px] animate-in fade-in zoom-in duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
              <CheckCircle2 className="h-16 w-16 text-emerald-500 relative z-10 animate-in zoom-in-50 duration-500" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold tracking-tight">Atendimento atualizado</h3>
              <p className="text-[11px] text-muted-foreground">Sincronização concluída com sucesso!</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}