"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { DollarSign, Calendar, User, Eye, EyeOff, Percent, Plus, Trash2, Home, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

export interface ImovelVendido {
  codigo: string;
  valor: number;
  imagem?: string;
}

export interface EditableLeadData {
  clientName?: string
  email?: string
  phone?: string
  lista_imoveis?: ImovelVendido[] 
  valor_venda?: number
  comissao?: number
  data_venda?: string
  obs_venda?: string
  status_dashboard?: boolean 
}

interface EditLeadModalProps {
  lead: any
  isOpen: boolean
  onClose: () => void
  onSave: (id: number, data: EditableLeadData) => void
  mode?: "edit" | "sale"
}

export function EditLeadModal({ lead, isOpen, onClose, onSave, mode = "edit" }: EditLeadModalProps) {
  // CORREÇÃO: Inicialização de estado com valores padrão para evitar erro de "uncontrolled input"
  const [formData, setFormData] = useState<EditableLeadData>({
    clientName: "",
    email: "",
    phone: "",
    lista_imoveis: [],
    valor_venda: 0,
    comissao: 5,
    data_venda: new Date().toISOString().split('T')[0],
    obs_venda: "",
    status_dashboard: true
  })

  const [loadingImoveis, setLoadingImoveis] = useState(false)
  const [novoImovel, setNovoImovel] = useState<ImovelVendido>({ codigo: "", valor: 0 })

  useEffect(() => {
    async function initModal() {
      if (!lead || !isOpen) return

      if (mode === "edit") {
        setFormData({
          clientName: lead.clientName || "",
          email: lead.leadData?.email || "",
          phone: lead.leadData?.phone || "",
          lista_imoveis: [],
        })
      } else {
        setLoadingImoveis(true)
        const isAux = lead.sourceTable?.includes('aux')
        const negocioTable = isAux ? 'imovel_negocio_aux' : 'imovel_negocio_pmw'
        const imovelPrincipalTable = isAux ? 'imovel_aux' : 'imovel_pmw'

        try {
          const { data: vinculados } = await supabase
            .from(negocioTable)
            .select('codigo_imovel, valor_venda')
            .eq('codigo_atendimento', lead.raw_codigo || lead.id)

          let imoveisFormatados: ImovelVendido[] = []

          if (vinculados && vinculados.length > 0) {
            const codigos = vinculados.map(v => v.codigo_imovel)
            const { data: details } = await supabase
              .from(imovelPrincipalTable)
              .select('codigo, urlfotoprincipal')
              .in('codigo', codigos)

            imoveisFormatados = vinculados.map(v => ({
              codigo: v.codigo_imovel,
              valor: v.valor_venda || 0,
              imagem: details?.find(d => d.codigo === v.codigo_imovel)?.urlfotoprincipal
            }))
          } else if (lead.propertyLocation && lead.propertyLocation !== "----") {
            imoveisFormatados = [{ 
              codigo: lead.propertyLocation, 
              valor: lead.value || 0,
              imagem: lead.image 
            }]
          }

          setFormData({
            clientName: lead.clientName || "",
            lista_imoveis: imoveisFormatados,
            valor_venda: imoveisFormatados.reduce((acc, curr) => acc + curr.valor, 0),
            comissao: 5,
            data_venda: new Date().toISOString().split('T')[0],
            obs_venda: "",
            status_dashboard: true
          })
        } catch (err) {
          console.error("Erro ao carregar imóveis:", err)
        } finally {
          setLoadingImoveis(false)
        }
      }
    }

    initModal()
  }, [lead, mode, isOpen])

  useEffect(() => {
    if (mode === "sale" && formData.lista_imoveis) {
      const total = formData.lista_imoveis.reduce((acc, curr) => acc + curr.valor, 0)
      setFormData(prev => ({ ...prev, valor_venda: total }))
    }
  }, [formData.lista_imoveis, mode])

  const addImovel = async () => {
    if (!novoImovel.codigo || novoImovel.valor <= 0) return
    
    const isAux = lead.sourceTable?.includes('aux')
    const imovelTable = isAux ? 'imovel_aux' : 'imovel_pmw'
    
    const { data } = await supabase
      .from(imovelTable)
      .select('urlfotoprincipal')
      .eq('codigo', novoImovel.codigo)
      .single()

    const itemComImg = { ...novoImovel, imagem: data?.urlfotoprincipal }

    setFormData(prev => ({
      ...prev,
      lista_imoveis: [...(prev.lista_imoveis || []), itemComImg]
    }))
    setNovoImovel({ codigo: "", valor: 0 })
  }

  const removeImovel = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lista_imoveis: prev.lista_imoveis?.filter((_, i) => i !== index)
    }))
  }

  // CORREÇÃO: Função unificada que chama a prop onSave passada pelo pai
  const handleConfirmSave = () => {
    if (lead) {
      // Garantir que estamos enviando a lista atualizada e o valor total calculado
      const dataToSave: EditableLeadData = {
        ...formData,
        // Se for modo venda, garantir que o valor_venda reflete a soma da lista
        valor_venda: mode === "sale" 
          ? formData.lista_imoveis?.reduce((acc, curr) => acc + curr.valor, 0) 
          : formData.valor_venda
      }
      
      console.log("Dados a serem salvos:", dataToSave)
      onSave(lead.id, dataToSave)
      onClose()
    }
  }

  if (!lead) return null
  const formatCurrency = (value: any) => `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "sale" ? <><DollarSign className="text-emerald-500" /> Lançar no Dashboard</> : <><User className="text-primary" /> Editar Lead</>}
          </DialogTitle>
          <DialogDescription>
            {mode === "sale" ? "Confirme os imóveis vendidos e os valores finais." : "Atualize o contato do lead."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Nome do Cliente</Label>
            <Input value={formData.clientName || ""} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} />
          </div>

          {mode === "sale" && (
            <>
              <div className="space-y-3 p-3 border rounded-lg bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase text-slate-500">Imóveis na Venda</Label>
                  {loadingImoveis && <Loader2 size={14} className="animate-spin text-primary" />}
                </div>
                
                <div className="flex gap-2">
                  <Input 
                    className="flex-1" 
                    placeholder="Cód. Imóvel" 
                    value={novoImovel.codigo || ""} 
                    onChange={(e) => setNovoImovel({...novoImovel, codigo: e.target.value})} 
                  />
                  <div className="flex-1 relative">
                    <DollarSign size={14} className="absolute left-2 top-3 text-muted-foreground" />
                    <Input 
                      type="number" 
                      className="pl-7" 
                      placeholder="Valor" 
                      value={novoImovel.valor || ""} 
                      onChange={(e) => setNovoImovel({...novoImovel, valor: parseFloat(e.target.value) || 0})} 
                    />
                  </div>
                  <Button type="button" size="icon" onClick={addImovel} variant="secondary"><Plus size={18} /></Button>
                </div>

                <div className="space-y-2 mt-2">
                  {formData.lista_imoveis?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 border rounded-md text-sm">
                      <div className="flex items-center gap-3">
                        <img src={item.imagem || "/placeholder.svg"} className="w-10 h-8 object-cover rounded bg-muted" alt="" />
                        <div className="flex flex-col">
                          <span className="font-bold text-xs">{item.codigo}</span>
                          <span className="text-emerald-600 font-medium text-[11px]">{formatCurrency(item.valor)}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeImovel(index)}><Trash2 size={14} /></Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-emerald-600 font-semibold">Valor Total (VGV)</Label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-3 text-muted-foreground" />
                    <Input id="valor" type="number" readOnly className="pl-8 border-emerald-200 bg-emerald-50/30 font-bold" value={formData.valor_venda || 0} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Data Fechamento</Label>
                  <Input type="date" value={formData.data_venda || ""} onChange={(e) => setFormData({ ...formData, data_venda: e.target.value })} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Comissão (%)</Label>
                <Input type="number" step="0.1" value={formData.comissao || 0} onChange={(e) => setFormData({ ...formData, comissao: parseFloat(e.target.value) || 0 })} />
              </div>

              <div className="grid gap-2">
                <Label>Observações</Label>
                <Textarea placeholder="Detalhes da negociação..." value={formData.obs_venda || ""} onChange={(e) => setFormData({ ...formData, obs_venda: e.target.value })} />
              </div>

              <div className={`flex items-center space-x-2 border p-3 rounded-md transition-colors ${formData.status_dashboard ? 'bg-emerald-50/50 border-emerald-500' : 'bg-muted/50'}`}>
                <Checkbox id="status_dashboard" checked={formData.status_dashboard || false} onCheckedChange={(checked) => setFormData({ ...formData, status_dashboard: checked as boolean })} />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="status_dashboard" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                    {formData.status_dashboard ? <Eye size={14} className="text-emerald-600"/> : <EyeOff size={14} className="text-muted-foreground"/>}
                    {formData.status_dashboard ? "Visível no Dashboard" : "Oculto no Dashboard"}
                  </Label>
                </div>
              </div>
            </>
          )}

          {mode === "edit" && (
            <div className="space-y-4">
              <div className="grid gap-2"><Label>Email</Label><Input value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Telefone</Label><Input value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirmSave} className={mode === "sale" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}>
            {mode === "sale" ? "Confirmar e Lançar" : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}