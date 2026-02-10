"use client"

import { useState } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Link, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NewFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function NewFormModal({ isOpen, onClose, onSubmit }: NewFormModalProps) {
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    clientName: "",
    brokerName: ""
  })
  const [generatedLink, setGeneratedLink] = useState("")
  const [copied, setCopied] = useState(false)

  const handleGenerate = () => {
    if (!formData.clientName || !formData.brokerName) {
      toast({ title: "Erro", description: "Preencha todos os campos.", variant: "destructive" })
      return
    }
    
    const randomVar = Math.random().toString(36).substring(2, 9).toUpperCase()
    const link = `www.central63.vercel.com/forms/${randomVar}`
    setGeneratedLink(link)
    setStep(2)
  }

  const handleFinish = () => {
    onSubmit(formData)
    setStep(1)
    setFormData({ clientName: "", brokerName: "" })
    onClose()
    toast({ title: "Formulário Criado", description: "O link foi gerado e o formulário está como pendente." })
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: "Copiado!", description: "Link copiado para a área de transferência." })
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      onClose()
      setStep(1)
    }}>
      <DialogContent className="sm:max-w-[450px] rounded-3xl p-8 border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center uppercase tracking-tight">
            {step === 1 ? "Novo Formulário" : "Link Gerado"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">Nome do Cliente</Label>
              <Input 
                className="rounded-xl h-12 bg-accent/20 border-none focus-visible:ring-primary/20"
                placeholder="Ex: João Silva"
                value={formData.clientName}
                onChange={(e) => setFormData({...formData, clientName: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">Corretor Responsável</Label>
              <Select onValueChange={(v) => setFormData({...formData, brokerName: v})}>
                <SelectTrigger className="rounded-xl h-12 bg-accent/20 border-none focus-visible:ring-primary/20">
                  <SelectValue placeholder="Selecionar Corretor" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  <SelectItem value="Pedro Augusto">Pedro Augusto</SelectItem>
                  <SelectItem value="Ana Clara">Ana Clara</SelectItem>
                  <SelectItem value="Carlos Eduardo">Carlos Eduardo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-lg shadow-primary/20"
              onClick={handleGenerate}
            >
              GERAR LINK
            </Button>
          </div>
        ) : (
          <div className="space-y-6 pt-4 text-center">
            <div className="p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex flex-col items-center gap-3">
              <Link size={32} className="text-emerald-600" />
              <p className="text-sm font-bold text-foreground break-all">{generatedLink}</p>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 h-12 rounded-xl font-bold text-sm gap-2 border-border hover:bg-accent"
                onClick={copyToClipboard}
              >
                {copied ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
                {copied ? "COPIADO" : "COPIAR LINK"}
              </Button>
              <Button 
                className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm"
                onClick={handleFinish}
              >
                FINALIZAR
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Envie este link para o cliente. O formulário aparecerá como <span className="text-amber-600 font-bold">PENDENTE</span> até ser preenchido.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
