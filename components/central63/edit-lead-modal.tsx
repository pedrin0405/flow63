"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { DollarSign, Calendar, User, Eye, EyeOff, Percent } from "lucide-react"

export interface EditableLeadData {
  // Dados do Lead
  clientName?: string
  email?: string
  phone?: string
  // Dados da Venda
  valor_venda?: number
  comissao?: number
  data_venda?: string
  obs_venda?: string
  status_dashboard?: boolean // true = Visível, false = Oculto
}

interface EditLeadModalProps {
  lead: any
  isOpen: boolean
  onClose: () => void
  onSave: (id: number, data: EditableLeadData) => void
  mode?: "edit" | "sale"
}

export function EditLeadModal({ lead, isOpen, onClose, onSave, mode = "edit" }: EditLeadModalProps) {
  const [formData, setFormData] = useState<EditableLeadData>({})

  useEffect(() => {
    if (lead) {
      if (mode === "edit") {
        setFormData({
          clientName: lead.clientName,
          email: lead.leadData?.email,
          phone: lead.leadData?.phone,
        })
      } else {
        // Modo SALE
        setFormData({
          clientName: lead.clientName,
          valor_venda: lead.value || 0,
          comissao: 5,
          data_venda: new Date().toISOString().split('T')[0],
          obs_venda: "",
          status_dashboard: true // <--- Padrão: Visível
        })
      }
    }
  }, [lead, mode, isOpen])

  const handleSave = () => {
    if (lead) {
      onSave(lead.id, formData)
      onClose()
    }
  }

  if (!lead) return null

  function formatCurrency(value: any) {
    const num = Number(value) || 0;
    return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  }
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "sale" ? (
              <>
                <DollarSign className="text-emerald-500" />
                Lançar no Dashboard
              </>
            ) : (
              <>
                <User className="text-primary" />
                Editar Lead
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === "sale" 
              ? "Preencha os dados finais para lançar esta venda no Dashboard." 
              : "Atualize as informações de contato deste lead."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Cliente</Label>
            <Input
              id="name"
              value={formData.clientName || ""}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
            />
          </div>

          {mode === "sale" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="valor" className="text-emerald-600 font-semibold">Valor da Venda (R$)</Label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      id="valor"
                      type="number"
                      className="pl-8 border-emerald-200 focus-visible:ring-emerald-500"
                      value={formData.valor_venda}
                      onChange={(e) => setFormData({ ...formData, valor_venda: parseFloat(e.target.value) })}
                    />
                  </div>
                  
                </div>
                

                <div className="grid gap-2">
                  <Label htmlFor="data">Data Fechamento</Label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      id="data"
                      type="date"
                      className="pl-8"
                      value={formData.data_venda}
                      onChange={(e) => setFormData({ ...formData, data_venda: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              {/* NOVO CAMPO: Valor Lançado no Dashboard */}
              <div className="mt-0 space-y-4"> 
                <div className={`flex items-center justify-between text-sm px-3 py-2 rounded-md border ${
                  lead.visibleOnDashboard && lead.valueLaunched > 0 
                    ? "bg-emerald-50 border-emerald-200" 
                    : "bg-slate-50 border-slate-200"
                }`}>
                  <span className={`${lead.visibleOnDashboard && lead.valueLaunched > 0 ? "text-emerald-600" : "text-slate-500"} font-medium`}>
                    No Dashboard:
                  </span>
                  <span className={`${lead.visibleOnDashboard && lead.valueLaunched > 0 ? "text-emerald-800" : "text-slate-400"} font-semibold`}>
                    {lead.visibleOnDashboard && lead.valueLaunched > 0 
                      ? formatCurrency(lead.valueLaunched) 
                      : "Valor pendente"}
                  </span>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="comissao">Comissão (%)</Label>
                <div className="relative">
                    <Percent size={14} className="absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      id="comissao"
                      type="number"
                      step="0.1"
                      className="pl-8"
                      value={formData.comissao}
                      onChange={(e) => setFormData({ ...formData, comissao: parseFloat(e.target.value) })}
                    />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="obs">Observações da Venda</Label>
                <Textarea
                  id="obs"
                  placeholder="Detalhes sobre pagamento, permuta, etc."
                  value={formData.obs_venda || ""}
                  onChange={(e) => setFormData({ ...formData, obs_venda: e.target.value })}
                />
              </div>

              {/* --- CHECKBOX DE VISIBILIDADE --- */}
              <div className={`flex items-center space-x-2 border p-3 rounded-md transition-colors ${formData.status_dashboard ? 'bg-emerald-50/50 border-emerald-500' : 'bg-muted/50'}`}>
                <Checkbox 
                  id="status_dashboard" 
                  checked={formData.status_dashboard}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, status_dashboard: checked as boolean })
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <Label 
                    htmlFor="status_dashboard" 
                    className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                  >
                    {formData.status_dashboard ? <Eye size={14} className="text-emerald-600"/> : <EyeOff size={14} className="text-muted-foreground"/>}
                    {formData.status_dashboard ? "Visível no Dashboard" : "Oculto no Dashboard"}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {formData.status_dashboard 
                      ? "Esta venda aparecerá nos gráficos e somatórios." 
                      : "Esta venda ficará salva no banco, mas não aparecerá nos gráficos."}
                  </p>
                </div>
              </div>
            </>
          )}

          {mode === "edit" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </>
          )}

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button 
            onClick={handleSave} 
            className={mode === "sale" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
          >
            {mode === "sale" ? "Confirmar e Lançar" : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}