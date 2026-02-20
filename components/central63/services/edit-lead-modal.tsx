"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../../ui/dialog"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { Textarea } from "../../ui/textarea"
import { Checkbox } from "../../ui/checkbox"
import { DollarSign, Calendar, User, Eye, EyeOff, Percent, Plus, Trash2, Home, Loader2, Image as ImageIcon, CheckCircle2, Tag, XCircle } from "lucide-react"
import { supabase } from "../../../lib/supabase"

export interface ImovelVendido {
  codigo: string;
  valor: number;
  imagem?: string;
  origemVendas?: boolean;
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
    data_venda: new Date().toISOString().slice(0, 16),
    obs_venda: "",
    status_dashboard: true
  })

  const [loadingAction, setLoadingAction] = useState(false)
  const [loadingImoveis, setLoadingImoveis] = useState(false)
  const [novoImovel, setNovoImovel] = useState<ImovelVendido>({ codigo: "", valor: 0 })
  const [valorVisual, setValorVisual] = useState("");
  const [imoveisVendidosDb, setImoveisVendidosDb] = useState<string[]>([])

  const formatToBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const parseBRLToNumber = (value: string) => {
    return Number(value.replace(/\D/g, "")) / 100;
  };

  const loadImoveis = async () => {
    if (!lead) return
    setLoadingImoveis(true)
    const isAux = lead.sourceTable?.includes('aux')
    const negocioTable = isAux ? 'imovel_negocio_aux' : 'imovel_negocio_pmw'
    const imovelPrincipalTable = isAux ? 'imovel_aux' : 'imovel_pmw'

    try {
      const { data: vendasData } = await supabase
        .from('vendas')
        .select('codigo_imovel, valor_venda, lista_imoveis')
        .eq('id_origem', lead.raw_codigo || lead.id)

      const codigosVendidos = vendasData?.map(v => String(v.codigo_imovel)) || []
      setImoveisVendidosDb(codigosVendidos)

      let imoveisMap = new Map<string, ImovelVendido>();

      const { data: vinculados } = await supabase
        .from(negocioTable)
        .select('codigo_imovel, valor_venda')
        .eq('codigo_atendimento', lead.raw_codigo || lead.id)

      if (vinculados && vinculados.length > 0) {
        vinculados.forEach(v => {
          imoveisMap.set(String(v.codigo_imovel), {
            codigo: String(v.codigo_imovel),
            valor: v.valor_venda || 0
          });
        });
      } else if (lead.propertyLocation && lead.propertyLocation !== "----") {
        imoveisMap.set(String(lead.propertyLocation), {
          codigo: String(lead.propertyLocation),
          valor: lead.valueLaunched || lead.value || 0,
          imagem: lead.image,
        });
      }

      if (vendasData && vendasData.length > 0) {
        vendasData.forEach(venda => {
          if (venda.lista_imoveis) {
            try {
              const lista = typeof venda.lista_imoveis === 'string' ? JSON.parse(venda.lista_imoveis) : venda.lista_imoveis;
              lista.forEach((item: any) => {
                const cod = String(item.codigo);
                imoveisMap.set(cod, {
                  codigo: cod,
                  valor: item.valor !== undefined ? Number(item.valor) : (imoveisMap.get(cod)?.valor || 0),
                  imagem: item.imagem,
                  origemVendas: !imoveisMap.has(cod)
                });
              });
            } catch (e) { console.error(e) }
          }
          const codPrincipal = String(venda.codigo_imovel);
          if (!imoveisMap.has(codPrincipal)) {
            imoveisMap.set(codPrincipal, {
              codigo: codPrincipal,
              valor: Number(venda.valor_venda) || 0,
              origemVendas: true
            });
          }
        });
      }

      const imoveisFinal = Array.from(imoveisMap.values());
      const codigosSemImagem = imoveisFinal.filter(i => !i.imagem).map(i => i.codigo);
      if (codigosSemImagem.length > 0) {
        const { data: details } = await supabase.from(imovelPrincipalTable).select('codigo, urlfotoprincipal').in('codigo', codigosSemImagem);
        imoveisFinal.forEach(imovel => {
          const detail = details?.find(d => String(d.codigo) === imovel.codigo);
          if (detail) imovel.imagem = detail.urlfotoprincipal;
        });
      }

      setFormData(prev => ({
        ...prev,
        clientName: lead.clientName || "",
        lista_imoveis: imoveisFinal,
        valor_venda: imoveisFinal.reduce((acc, curr) => acc + curr.valor, 0),
        comissao: lead.comissao || 5,
        // Correção aqui: Garantimos a conversão para Date e formatamos para o input (AAAA-MM-DDTHH:mm)
        data_venda: (() => {
          if (!lead.raw_data) return new Date().toISOString().slice(0, 16);

          try {
            // Divide a string "05/01/2026 15:43" em partes
            const [data, hora] = lead.raw_data.split(" ");
            const [dia, mes, ano] = data.split("/");
            
            // O input datetime-local EXIGE o formato: YYYY-MM-DDTHH:mm
            // Montamos a string exatamente como o navegador precisa
            return `${ano}-${mes}-${dia}T${hora}`;
          } catch (e) {
            // Caso a string venha em outro formato inesperado, usa a data atual como fallback
            return new Date().toISOString().slice(0, 16);
          }
        })(),
        obs_venda: lead.obs_venda || "",
        status_dashboard: lead.status_dashboard !== undefined 
          ? (lead.status_dashboard === "Visível" || lead.status_dashboard === true) 
          : true
      }))
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingImoveis(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit") {
        setFormData({
          clientName: lead.clientName || "",
          email: lead.leadData?.email || "",
          phone: lead.leadData?.phone || "",
          lista_imoveis: [],
        })
      } else {
        loadImoveis()
      }
    }
  }, [lead, mode, isOpen])

  useEffect(() => {
    if (mode === "sale" && formData.lista_imoveis) {
      const total = formData.lista_imoveis.reduce((acc, curr) => acc + curr.valor, 0)
      setFormData(prev => ({ ...prev, valor_venda: total }))
    }
  }, [formData.lista_imoveis, mode])

  const handleRemoveSale = async () => {
    if (!lead || !window.confirm("Deseja realmente remover esta venda?")) return
    setLoadingAction(true)
    try {
      const { error } = await supabase
        .from('vendas')
        .delete()
        .eq('id_origem', lead.raw_codigo || lead.id)

      if (error) throw error

      // RESET IMEDIATO DOS DADOS PARA O DASHBOARD
      const resetData: EditableLeadData = {
        ...formData,
        valor_venda: 0,
        status_dashboard: false, // Oculta do dashboard para atualizar o card
        obs_venda: ""
      }
      
      // Enviamos a atualização para o componente pai ANTES de fechar
      await onSave(lead.id, resetData)
      
      onClose()
    } catch (err) {
      console.error("Erro ao remover:", err)
    } finally {
      setLoadingAction(false)
    }
  }

  const addImovel = async () => {
    if (!novoImovel.codigo || novoImovel.valor <= 0) return
    const isAux = lead.sourceTable?.includes('aux')
    const imovelTable = isAux ? 'imovel_aux' : 'imovel_pmw'
    const { data } = await supabase.from(imovelTable).select('urlfotoprincipal').eq('codigo', novoImovel.codigo).single()
    const itemComImg = { ...novoImovel, imagem: data?.urlfotoprincipal }
    setFormData(prev => ({ ...prev, lista_imoveis: [...(prev.lista_imoveis || []), itemComImg] }))
    setNovoImovel({ codigo: "", valor: 0 }); setValorVisual("") 
  }

  const removeImovel = (index: number) => {
    setFormData(prev => ({ ...prev, lista_imoveis: prev.lista_imoveis?.filter((_, i) => i !== index) }))
  }

  const handleConfirmSave = () => {
    if (lead) {
      const dataToSave: EditableLeadData = {
        ...formData,
        valor_venda: mode === "sale" ? formData.lista_imoveis?.reduce((acc, curr) => acc + curr.valor, 0) : formData.valor_venda
      }
      onSave(lead.id, dataToSave)
      onClose()
    }
  }

  if (!lead) return null
  const formatCurrency = (val: any) => `${Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  const dialogMaxWidth = mode === "sale" ? "sm:max-w-[950px]" : "sm:max-w-[550px]"
  const hasSaleInDb = imoveisVendidosDb.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${dialogMaxWidth} max-h-[90vh] h-[90vh] overflow-hidden p-0 gap-0 transition-all duration-300 flex flex-col`}>
        <div className={`grid h-full overflow-hidden ${mode === "sale" ? "grid-cols-1 md:grid-cols-12" : "grid-cols-1"}`}>
          <div className={`flex flex-col h-full overflow-y-auto ${mode === "sale" ? "md:col-span-7 border-r bg-white" : "p-1"}`}>
            
            {/* Header */}
            <div className="p-6 pb-2 sticky top-0 bg-white z-10">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  {mode === "sale" ? <><div className="text-emerald-500 font-bold text-lg">R$</div> Lançar Venda</> : <><User className="text-primary" /> Editar Lead</>}
                </DialogTitle>
                <DialogDescription>
                  {mode === "sale" ? "Confirme os imóveis e os valores da negociação." : "Atualize os dados de contato."}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-6 pt-2 space-y-6 flex-1">
              <div className="grid gap-2">
                <Label htmlFor="clientName">Nome do Cliente</Label>
                <Input id="clientName" value={formData.clientName || ""} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} className="font-medium" />
              </div>

              {mode === "sale" && (
                <>
                  {/* Seção Adicionar Imóvel */}
                  <div className="p-4 bg-slate-50 border rounded-lg space-y-3">
                    <Label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1"><Plus size={12} /> Adicionar Imóvel</Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input placeholder="Cód. Imóvel" value={novoImovel.codigo || ""} onChange={(e) => setNovoImovel({...novoImovel, codigo: e.target.value})} className="bg-white" />
                      </div>
                      <div className="flex-1 relative">
                        <Input type="text" className="pl-3 bg-white" placeholder="0,00" value={valorVisual} onChange={(e) => {
                          const numericValue = parseBRLToNumber(e.target.value);
                          setNovoImovel({...novoImovel, valor: numericValue});
                          setValorVisual(formatToBRL(numericValue));
                        }} />
                      </div>
                      <Button type="button" onClick={addImovel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3"><Plus size={18} /></Button>
                    </div>
                  </div>

                  {/* VGV e Data */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-emerald-700 font-semibold">VGV Total</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-emerald-600">R$</span>
                        <Input readOnly className="pl-9 border-emerald-200 bg-emerald-50 text-emerald-700 font-bold" value={formatCurrency(formData.valor_venda)} />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Data da Venda</Label>
                      <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-3 text-muted-foreground" />
                        <Input type="datetime-local" className="pl-9" value={formData.data_venda || ""} onChange={(e) => setFormData({ ...formData, data_venda: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Observações</Label>
                    <Textarea placeholder="Forma de pagamento..." className="min-h-[80px]" value={formData.obs_venda || ""} onChange={(e) => setFormData({ ...formData, obs_venda: e.target.value })} />
                  </div>

                  <div className={`flex items-center space-x-2 border p-3 rounded-md transition-colors ${formData.status_dashboard ? 'bg-emerald-50 border-emerald-100' : 'bg-muted/50'}`}>
                    <Checkbox id="status_dashboard" checked={formData.status_dashboard} onCheckedChange={(checked) => setFormData({ ...formData, status_dashboard: checked as boolean })} />
                    <Label htmlFor="status_dashboard" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                      {formData.status_dashboard ? <Eye size={14} className="text-emerald-600"/> : <EyeOff size={14} className="text-muted-foreground"/>}
                      {formData.status_dashboard ? "Visível no Dashboard" : "Oculto no Dashboard"}
                    </Label>
                  </div>
                </>
              )}
            </div>

            {/* Footer com Botão de Remover */}
            <DialogFooter className="p-6 border-t mt-auto bg-gray-50/50 sticky bottom-0 flex justify-between items-center">
              <div className="flex-1">
                {mode === "sale" && hasSaleInDb && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2 px-2" 
                    onClick={handleRemoveSale}
                    disabled={loadingAction}
                  >
                    {loadingAction ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                    Remover Venda
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleConfirmSave} className={mode === "sale" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}>
                  {mode === "sale" ? "Confirmar Venda" : "Salvar"}
                </Button>
              </div>
            </DialogFooter>
          </div>

          {/* Lateral de Imóveis */}
          {mode === "sale" && (
            <div className="md:col-span-5 bg-slate-100/80 flex flex-col h-full border-l overflow-hidden">
              <div className="p-6 pb-2 shrink-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Home size={16} className="text-slate-500" />
                    Imóveis Selecionados
                    <span className="ml-1 bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-full">{formData.lista_imoveis?.length || 0}</span>
                  </h4>
                  {loadingImoveis && <Loader2 size={14} className="animate-spin text-emerald-600" />}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-3 custom-scrollbar">
                {formData.lista_imoveis?.map((item, index) => {
                  const jaVendido = imoveisVendidosDb.includes(String(item.codigo));
                  const apenasEmVendas = item.origemVendas === true;
                  
                  return (
                    <div key={index} className={`group relative bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${jaVendido || apenasEmVendas ? "border-emerald-200 ring-1 ring-emerald-100" : "border-slate-200"}`}>
                      <div className="aspect-video w-full bg-slate-100 relative overflow-hidden">
                        {item.imagem ? <img src={item.imagem} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Imóvel" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="text-slate-300 w-8" /></div>}
                        
                        {apenasEmVendas ? (
                          <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            <Tag size={10} /> VENDAS
                          </div>
                        ) : jaVendido && (
                          <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle2 size={10} /> INCLUÍDO
                          </div>
                        )}
                        <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeImovel(index)}><Trash2 size={12} /></Button>
                      </div>
                      <div className="p-3">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">#{item.codigo}</span>
                        <p className="text-emerald-700 font-bold text-sm mt-1">{formatCurrency(item.valor)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="p-4 border-t border-slate-200 shrink-0 bg-slate-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Subtotal:</span>
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