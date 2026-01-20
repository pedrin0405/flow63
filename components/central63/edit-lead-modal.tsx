"use client"

import { useState, useEffect } from "react"
import { X, Save, Eye, BadgeCheck, TrendingUp, Radio } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface Lead {
  id: number
  clientName: string
  visibleOnDashboard?: boolean
  realOriginMedia?: string
  salesCount?: number
  verified?: boolean
}

interface EditLeadModalProps {
  lead: Lead | null
  isOpen: boolean
  onClose: () => void
  onSave: (leadId: number, data: EditableLeadData) => void
}

export interface EditableLeadData {
  visibleOnDashboard: boolean
  realOriginMedia: string
  salesCount: number
  verified: boolean
}

export function EditLeadModal({ lead, isOpen, onClose, onSave }: EditLeadModalProps) {
  const [formData, setFormData] = useState<EditableLeadData>({
    visibleOnDashboard: true,
    realOriginMedia: "",
    salesCount: 0,
    verified: false
  })

  // Sincroniza dados quando o lead muda
  useEffect(() => {
    if (lead) {
      setFormData({
        visibleOnDashboard: lead.visibleOnDashboard ?? true,
        realOriginMedia: lead.realOriginMedia ?? "",
        salesCount: lead.salesCount ?? 0,
        verified: lead.verified ?? false
      })
    }
  }, [lead])

  if (!isOpen || !lead) return null

  const handleSave = () => {
    onSave(lead.id, formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-border animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-accent/30 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-foreground">Editar Lead</h2>
            <p className="text-xs text-muted-foreground">COD: {lead.id} - {lead.clientName}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-accent rounded-full text-muted-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          
          {/* Visivel no Dashboard */}
          <div className="flex items-center justify-between p-4 bg-accent/50 rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Eye size={20} />
              </div>
              <div>
                <Label htmlFor="visibleOnDashboard" className="text-sm font-medium text-foreground cursor-pointer">
                  Visivel no Dashboard
                </Label>
                <p className="text-xs text-muted-foreground">Exibir este lead no painel principal</p>
              </div>
            </div>
            <Switch
              id="visibleOnDashboard"
              checked={formData.visibleOnDashboard}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, visibleOnDashboard: checked }))}
            />
          </div>

          {/* Midia de Origem Real */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                <Radio size={16} />
              </div>
              <Label htmlFor="realOriginMedia" className="text-sm font-medium text-foreground">
                Midia de Origem Real
              </Label>
            </div>
            <Input
              id="realOriginMedia"
              type="text"
              placeholder="Ex: Instagram, Google Ads, Indicacao..."
              value={formData.realOriginMedia}
              onChange={(e) => setFormData(prev => ({ ...prev, realOriginMedia: e.target.value }))}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">Informe de qual canal o lead realmente veio</p>
          </div>

          {/* Quantidade de Vendas */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <TrendingUp size={16} />
              </div>
              <Label htmlFor="salesCount" className="text-sm font-medium text-foreground">
                Quantidade de Vendas
              </Label>
            </div>
            <Input
              id="salesCount"
              type="number"
              min={0}
              placeholder="0"
              value={formData.salesCount}
              onChange={(e) => setFormData(prev => ({ ...prev, salesCount: parseInt(e.target.value) || 0 }))}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">Numero de vendas realizadas para este lead</p>
          </div>

          {/* Verificado */}
          <div className="flex items-center justify-between p-4 bg-accent/50 rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <BadgeCheck size={20} />
              </div>
              <div>
                <Label htmlFor="verified" className="text-sm font-medium text-foreground cursor-pointer">
                  Verificado
                </Label>
                <p className="text-xs text-muted-foreground">Marcar lead como verificado</p>
              </div>
            </div>
            <Switch
              id="verified"
              checked={formData.verified}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, verified: checked }))}
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border bg-accent/20 flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1 bg-transparent" 
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button 
            className="flex-1 gap-2" 
            onClick={handleSave}
          >
            <Save size={16} />
            Salvar Alteracoes
          </Button>
        </div>
      </div>
    </div>
  )
}
