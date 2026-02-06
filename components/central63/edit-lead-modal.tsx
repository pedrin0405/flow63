"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Checkbox } from "../ui/checkbox"
import { DollarSign, Calendar, User, Eye, EyeOff, Percent, Plus, Trash2, Home, Loader2, Image as ImageIcon } from "lucide-react"
import { supabase } from "../../lib/supabase"

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
  const [formData, setFormData] = useState<EditableLeadData>({
    clientName: "",
    email: "",
    phone: "",
    lista_imoveis: [],
    valor_venda: 0,
    comissao: 5,
    data_venda: new Date().toISOString().slice(0, 16), // Captura YYYY-MM-DDTHH:mm,
    obs_venda: "",
    status_dashboard: true
  })

  const [loadingImoveis, setLoadingImoveis] = useState(false)
  const [novoImovel, setNovoImovel] = useState<ImovelVendido>({ codigo: "", valor: 0 })
  const [valorVisual, setValorVisual] = useState("");

  const formatToBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const parseBRLToNumber = (value: string) => {
    return Number(value.replace(/\D/g, "")) / 100;
  };

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
              valor: lead.valueLaunched || lead.value || 0,
              imagem: lead.image 
            }]
          }

          setFormData({
            clientName: lead.clientName || "",
            lista_imoveis: imoveisFormatados,
            valor_venda: imoveisFormatados.reduce((acc, curr) => acc + curr.valor, 0),
            comissao: 5,
            data_venda: new Date().toISOString().slice(0, 16), // Captura YYYY-MM-DDTHH:mm
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
    setValorVisual("") 
  }

  const removeImovel = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lista_imoveis: prev.lista_imoveis?.filter((_, i) => i !== index)
    }))
  }

  const handleConfirmSave = () => {
    if (lead) {
      const dataToSave: EditableLeadData = {
        ...formData,
        valor_venda: mode === "sale" 
          ? formData.lista_imoveis?.reduce((acc, curr) => acc + curr.valor, 0) 
          : formData.valor_venda
      }
      
      onSave(lead.id, dataToSave)
      onClose()
    }
  }

  if (!lead) return null
  const formatCurrency = (valueLaunched: any) => `${Number(valueLaunched || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  const dialogMaxWidth = mode === "sale" ? "sm:max-w-[950px]" : "sm:max-w-[550px]"

  console.log("Dados", lead)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`${dialogMaxWidth} max-h-[90vh] h-[90vh] overflow-hidden p-0 gap-0 transition-all duration-300 flex flex-col`}
      >
        <div className={`grid h-full overflow-hidden ${mode === "sale" ? "grid-cols-1 md:grid-cols-12" : "grid-cols-1"}`}>
          <div className={`flex flex-col h-full overflow-y-auto ${mode === "sale" ? "md:col-span-7 border-r bg-white" : "p-1"}`}>
            
            <div className="p-6 pb-2 sticky top-0 bg-white z-10">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  {mode === "sale" ? <><div className="text-emerald-500 font-bold text-lg">R$</div> Lançar Venda</> : <><User className="text-primary" /> Editar Lead</>}
                </DialogTitle>
                <DialogDescription>
                  {mode === "sale" ? "Preencha os dados da negociação e confirme os imóveis." : "Atualize as informações de contato deste lead."}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-6 pt-2 space-y-6 flex-1">
              <div className="grid gap-2">
                <Label htmlFor="clientName">Nome do Cliente</Label>
                <Input 
                  id="clientName"
                  value={formData.clientName || ""} 
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} 
                  className="font-medium"
                />
              </div>

              {mode === "sale" && (
                <>
                  <div className="p-4 bg-slate-50 border rounded-lg space-y-3">
                    <Label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
                      <Plus size={12} /> Adicionar Imóvel à Venda
                    </Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input 
                          placeholder="Cód. Imóvel" 
                          value={novoImovel.codigo || ""} 
                          onChange={(e) => setNovoImovel({...novoImovel, codigo: e.target.value})} 
                          className="bg-white"
                        />
                      </div>
                      <div className="flex-1 relative">
                        
                        <Input 
                          type="text" 
                          className="pl-3 bg-white" 
                          placeholder="0,00" 
                          value={valorVisual} 
                          onChange={(e) => {
                            const value = e.target.value;
                            const numericValue = parseBRLToNumber(value);
                            setNovoImovel({...novoImovel, valor: numericValue});
                            setValorVisual(formatToBRL(numericValue));
                          }} 
                        />
                      </div>
                      <Button type="button" onClick={addImovel} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm px-3">
                        <Plus size={18} />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-emerald-700 font-semibold">VGV Total</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-emerald-600">R$</span>
                        <Input 
                          readOnly 
                          className="pl-9 border-emerald-200 bg-emerald-50 text-emerald-700 font-bold" 
                          value={formatCurrency(formData.valor_venda).replace("", "").trim()} 
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label>Data e Hora da Venda</Label>
                      <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-3 text-muted-foreground" />
                        <Input 
                          type="datetime-local" // Permite selecionar data e hora
                          className="pl-9"
                          value={formData.data_venda || ""} 
                          onChange={(e) => setFormData({ ...formData, data_venda: e.target.value })} 
                        />
                      </div>
                    </div>
                  </div>  

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

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label>Comissão (%)</Label>
                      <span className="text-xs text-muted-foreground font-medium">
                        Valor: {formatCurrency((formData.valor_venda || 0) * ((formData.comissao || 0) / 100))}
                      </span>
                    </div>
                    <div className="relative">
                      <Percent size={14} className="absolute right-3 top-3 text-muted-foreground" />
                      <Input 
                        type="number" 
                        step="0.1" 
                        value={formData.comissao || 0} 
                        onChange={(e) => setFormData({ ...formData, comissao: parseFloat(e.target.value) || 0 })} 
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Observações</Label>
                    <Textarea 
                      placeholder="Detalhes sobre a forma de pagamento, permuta, etc..." 
                      className="min-h-[80px] resize-none"
                      value={formData.obs_venda || ""} 
                      onChange={(e) => setFormData({ ...formData, obs_venda: e.target.value })} 
                    />
                  </div>

                  <div className={`flex items-center space-x-2 border p-3 rounded-md transition-colors ${formData.status_dashboard ? 'bg-emerald-50/50 border-emerald-100' : 'bg-muted/50'}`}>
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
                <div className="space-y-4">
                  <div className="grid gap-2"><Label>Email</Label><Input value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                  <div className="grid gap-2"><Label>Telefone</Label><Input value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
                </div>
              )}
            </div>

            <DialogFooter className="p-6 border-t mt-auto bg-gray-50/50 sticky bottom-0">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleConfirmSave} className={mode === "sale" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}>
                {mode === "sale" ? "Confirmar Venda" : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </div>

          {mode === "sale" && (
            <div className="md:col-span-5 bg-slate-100/80 flex flex-col h-full border-l overflow-hidden">
              <div className="p-6 pb-2 shrink-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Home size={16} className="text-slate-500" />
                    Imóveis Selecionados
                    <span className="ml-1 bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-full">
                      {formData.lista_imoveis?.length || 0}
                    </span>
                  </h4>
                  {loadingImoveis && <Loader2 size={14} className="animate-spin text-emerald-600" />}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-3 custom-scrollbar">
                {formData.lista_imoveis?.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-300 rounded-lg opacity-60">
                    <Home size={32} className="text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500 font-medium">Nenhum imóvel</p>
                  </div>
                ) : (
                  formData.lista_imoveis?.map((item, index) => (
                    <div 
                      key={index} 
                      className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="aspect-video w-full bg-slate-100 relative overflow-hidden">
                        {item.imagem ? (
                          <img 
                            src={item.imagem} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                            alt={`Imóvel ${item.codigo}`} 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-50">
                            <ImageIcon className="text-slate-300 w-8 h-8" />
                          </div>
                        )}
                        
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                          <span className="text-white text-xs font-medium">Cód: {item.codigo}</span>
                        </div>

                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm" 
                          onClick={() => removeImovel(index)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>

                      <div className="p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            #{item.codigo}
                          </span>
                        </div>
                        <p className="text-emerald-700 font-bold text-sm">
                          {formatCurrency(item.valor)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-slate-200 shrink-0 bg-slate-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Subtotal Imóveis:</span>
                  <span className="font-bold text-slate-800">{formatCurrency(formData.valor_venda)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}