"use client"

import { useState, useEffect, useRef } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Camera, Plus } from "lucide-react"

export interface Broker {
  id: string | number
  nome: string
  departamento?: string
  cidade_origem: string
  unidade: string
  imagem_url: string
  data_nascimento?: string
  desativado: string | boolean
  data_sincronizacao?: string
}

interface BrokerEditModalProps {
  broker: Broker
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export default function BrokerEditModal({ broker, isOpen, onClose, onUpdate }: BrokerEditModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  const [isAddingDept, setIsAddingDept] = useState(false)
  const [newDeptName, setNewDeptName] = useState("")
  
  const [isAddingUnit, setIsAddingUnit] = useState(false)
  const [newUnitName, setNewUnitName] = useState("")
  
  const [options, setOptions] = useState({ 
    cities: [] as string[], 
    units: [] as string[], 
    departments: [] as string[] 
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchOptions = async () => {
    if (!supabase) return
    const [pmwRes, auxRes] = await Promise.all([
      supabase.from('corretores_pmw').select('cidade_origem, unidade, departamento'),
      supabase.from('corretores_aux').select('cidade_origem, unidade, departamento')
    ])
    const allData = [...(pmwRes.data || []), ...(auxRes.data || [])]
    
    const cities = Array.from(new Set(allData.map(d => d.cidade_origem).filter(Boolean))) as string[]
    const units = Array.from(new Set(allData.map(d => d.unidade).filter(Boolean))) as string[]
    const departments = Array.from(new Set(allData.map(d => d.departamento).filter(Boolean))) as string[]
    // Se a lista vier vazia, garanta que o departamento atual do corretor esteja nela
    if (broker.departamento && !departments.includes(broker.departamento)) {
      departments.push(broker.departamento)
    }
    
    setOptions({ cities, units, departments })
  }

  useEffect(() => {
    if (isOpen) fetchOptions()
  }, [isOpen])
  
  const [formData, setFormData] = useState({
    nome: broker.nome,
    departamento: broker.departamento || "",
    cidade_origem: broker.cidade_origem,
    unidade: broker.unidade || "",
    data_nascimento: "", 
    desativado: (broker.desativado as any) === true || (broker.desativado as any) === "true",
    imagem_url: broker.imagem_url
  })

  useEffect(() => {
    const isDes = (broker.desativado as any) === true || (broker.desativado as any) === "true"
    
    // Formata o que vem do banco (YYYY-MM-DD ou DD/MM/YYYY) para apenas DD/MM
    let dateView = ""
    if (broker.data_nascimento) {
      const parts = broker.data_nascimento.includes('-') 
        ? broker.data_nascimento.split('-').reverse() // YYYY-MM-DD -> [DD, MM, YYYY]
        : broker.data_nascimento.split('/') // DD/MM/YYYY -> [DD, MM, YYYY]
      
      if (parts.length >= 2) {
        dateView = `${parts[0]}/${parts[1]}`
      }
    }

    setFormData({
      nome: broker.nome,
      departamento: broker.departamento || "",
      cidade_origem: broker.cidade_origem,
      unidade: broker.unidade || "",
      data_nascimento: dateView,
      desativado: isDes,
      imagem_url: broker.imagem_url
    })
  }, [broker])

  // Função para aplicar máscara DD/MM enquanto o usuário digita
  const handleDateChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, "").slice(0, 4)
    let formatted = cleanValue
    if (cleanValue.length >= 3) {
      formatted = `${cleanValue.slice(0, 2)}/${cleanValue.slice(2, 4)}`
    }
    setFormData({ ...formData, data_nascimento: formatted })
  }

  const handleSave = async () => {
    if (!supabase) return
    setLoading(true)
    try {
      const isPmw = formData.cidade_origem.toLowerCase().includes("palmas")
      const table = isPmw ? "corretores_pmw" : "corretores_aux"
      
      const payload = {
        nome: formData.nome,
        departamento: formData.departamento,
        unidade: formData.unidade || "Não definida",
        desativado: formData.desativado ? "true" : "false",
        imagem_url: formData.imagem_url || "",
        data_nascimento: formData.data_nascimento, // Salva como "DD/MM"
        data_sincronizacao: new Date().toISOString()
      }
      
      const response = await supabase.from(table).update(payload).eq('id', broker.id)
      if (response.error) throw response.error
      
      toast({ title: "Sucesso", description: "Dados atualizados." })
      onUpdate(); 
      onClose()
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" })
    } finally { setLoading(false) }
  }

  const handleAddNewDepartment = () => {
    if (!newDeptName.trim()) return
    setOptions(prev => ({ ...prev, departments: [...prev.departments, newDeptName.trim()] }))
    setFormData(prev => ({ ...prev, departamento: newDeptName.trim() }))
    setIsAddingDept(false)
    setNewDeptName("")
  }

  const handleAddNewUnit = () => {
    if (!newUnitName.trim()) return
    setOptions(prev => ({ ...prev, units: [...prev.units, newUnitName.trim()] }))
    setFormData(prev => ({ ...prev, unidade: newUnitName.trim() }))
    setIsAddingUnit(false)
    setNewUnitName("")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setFormData({ ...formData, imagem_url: reader.result as string })
    reader.readAsDataURL(file)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl" aria-describedby={undefined}>
        <div className="bg-primary/5 p-8 pb-6 flex flex-col items-center gap-4">
          <div className="relative group">
            <Avatar className="h-28 w-28 border-4 border-background shadow-2xl">
              <AvatarImage src={formData.imagem_url} className="object-cover object-top" />
              <AvatarFallback className="text-2xl font-black bg-primary/10 text-primary">
                {(formData.nome || "C").substring(0,2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="absolute bottom-0 right-0 bg-primary text-white p-2.5 rounded-full shadow-lg hover:scale-110 transition-transform"
            >
              <Camera size={14} />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>
          <div className="text-center">
            <DialogTitle className="text-2xl font-black text-foreground uppercase tracking-tight leading-none mb-1">
              {formData.nome || "Novo Corretor"}
            </DialogTitle>
            <Badge variant="outline" className="font-bold opacity-60 border-primary/20 tracking-tighter">CÓDIGO #{broker.id}</Badge>
          </div>
        </div>

        <div className="p-8 pt-6 space-y-6">
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Nome Completo</Label>
              <Input 
                className="rounded-2xl h-12 bg-muted/40 border-none focus-visible:ring-primary/20 font-bold" 
                value={formData.nome} 
                onChange={(e) => setFormData({...formData, nome: e.target.value})} 
              />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 ml-1 mb-1">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Departamento</Label>
                <button onClick={() => setIsAddingDept(true)} className="bg-primary/10 text-primary hover:bg-primary hover:text-white p-0.5 rounded transition-all">
                  <Plus size={10} strokeWidth={4} />
                </button>
              </div>
              <Select value={formData.departamento || ""} 
                onValueChange={(v) => setFormData({...formData, departamento: v})}
              >
                <SelectTrigger className="rounded-2xl h-11 bg-muted/40 border-none font-bold text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">{options.departments.map(d => <SelectItem key={d} value={d} className="font-bold text-xs">{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 ml-1 mb-1">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Unidade</Label>
                <button onClick={() => setIsAddingUnit(true)} className="bg-primary/10 text-primary hover:bg-primary hover:text-white p-0.5 rounded transition-all">
                  <Plus size={10} strokeWidth={4} />
                </button>
              </div>
              <Select value={formData.unidade} onValueChange={(v) => setFormData({...formData, unidade: v})}>
                <SelectTrigger className="rounded-2xl h-11 bg-muted/40 border-none font-bold text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">{options.units.map(u => <SelectItem key={u} value={u} className="font-bold text-xs">{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Cidade</Label>
              <Select value={formData.cidade_origem} onValueChange={(v) => setFormData({...formData, cidade_origem: v})}>
                <SelectTrigger className="rounded-2xl h-11 bg-muted/40 border-none font-bold text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">{options.cities.map(c => <SelectItem key={c} value={c} className="font-bold text-xs">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Aniversário (Dia/Mês)</Label>
              <Input 
                type="text" 
                placeholder="Ex: 02/06"
                className="rounded-2xl h-11 bg-muted/40 border-none text-xs font-bold" 
                value={formData.data_nascimento} 
                onChange={(e) => handleDateChange(e.target.value)} 
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-3xl border border-border/50">
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-tight leading-none">Status</span>
              <span className={`text-[10px] font-bold ${formData.desativado ? "text-red-500" : "text-emerald-500"}`}>
                {formData.desativado ? "CONTA INATIVA" : "CONTA ATIVA"}
              </span>
            </div>
            <Switch 
              className="data-[state=checked]:bg-emerald-500" 
              checked={!formData.desativado} 
              onCheckedChange={(c) => setFormData({...formData, desativado: !c})} 
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button className="flex-1 h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs shadow-xl shadow-primary/20 transition-all active:scale-95" onClick={handleSave} disabled={loading}>SALVAR</Button>
            <Button variant="ghost" className="h-12 rounded-2xl font-bold text-xs text-muted-foreground" onClick={onClose}>CANCELAR</Button>
          </div>
        </div>

        {isAddingDept && (
          <Dialog open={isAddingDept} onOpenChange={setIsAddingDept}>
            <DialogContent className="sm:max-w-[350px] rounded-[2.5rem] p-8 border-none shadow-3xl">
              <DialogHeader><DialogTitle className="text-center font-black uppercase text-sm tracking-widest">Novo Depto</DialogTitle></DialogHeader>
              <div className="py-4 space-y-4">
                <Input placeholder="Nome do departamento..." className="rounded-2xl h-12 bg-muted/50 border-none font-bold text-center" value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} />
                <Button className="w-full h-12 rounded-2xl font-black text-xs" onClick={handleAddNewDepartment}>ADICIONAR</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {isAddingUnit && (
          <Dialog open={isAddingUnit} onOpenChange={setIsAddingUnit}>
            <DialogContent className="sm:max-w-[350px] rounded-[2.5rem] p-8 border-none shadow-3xl">
              <DialogHeader><DialogTitle className="text-center font-black uppercase text-sm tracking-widest">Nova Unidade</DialogTitle></DialogHeader>
              <div className="py-4 space-y-4">
                <Input placeholder="Nome da unidade..." className="rounded-2xl h-12 bg-muted/50 border-none font-bold text-center" value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} />
                <Button className="w-full h-12 rounded-2xl font-black text-xs" onClick={handleAddNewUnit}>ADICIONAR</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}