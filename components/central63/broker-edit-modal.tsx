import { useState, useEffect, useRef } from "react"
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
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Camera, X } from "lucide-react"

interface Broker {
  id: string | number
  nome: string
  apelido?: string
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

export function BrokerEditModal({ broker, isOpen, onClose, onUpdate }: BrokerEditModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState({ cities: [] as string[], units: [] as string[], departments: [] as string[] })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function fetchOptions() {
      if (!supabase) return
      
      const [pmwRes, auxRes] = await Promise.all([
        supabase.from('corretores_pmw').select('cidade_origem, unidade, departamento'),
        supabase.from('corretores_aux').select('cidade_origem, unidade, departamento')
      ])

      const allData = [...(pmwRes.data || []), ...(auxRes.data || [])]
      
      const cities = Array.from(new Set(allData.map(d => d.cidade_origem).filter(Boolean))) as string[]
      const units = Array.from(new Set(allData.map(d => d.unidade).filter(Boolean))) as string[]
      const departments = Array.from(new Set(allData.map(d => d.departamento).filter(Boolean))) as string[]

      setOptions({ cities, units, departments })
    }
    
    if (isOpen) {
      fetchOptions()
    }
  }, [isOpen])
  
  const initialDesativado = (broker.desativado as any) === true || (broker.desativado as any) === "true"

  const [formData, setFormData] = useState({
    nome: broker.nome,
    apelido: broker.apelido || "",
    departamento: broker.departamento || "",
    cidade_origem: broker.cidade_origem,
    unidade: broker.unidade || "",
    data_nascimento: broker.data_nascimento || "",
    desativado: initialDesativado,
    imagem_url: broker.imagem_url
  })

  useEffect(() => {
    const isDesativado = (broker.desativado as any) === true || (broker.desativado as any) === "true"
    setFormData({
      nome: broker.nome,
      apelido: broker.apelido || "",
      departamento: broker.departamento || "",
      cidade_origem: broker.cidade_origem,
      unidade: broker.unidade || "",
      data_nascimento: broker.data_nascimento || "",
      desativado: isDesativado,
      imagem_url: broker.imagem_url
    })
  }, [broker])

  const handleSave = async () => {
    if (!supabase) return
    setLoading(true)
    try {
      const isPmw = formData.cidade_origem.toLowerCase().includes("palmas")
      const table = isPmw ? "corretores_pmw" : "corretores_aux"
      
      const statusValue = formData.desativado ? "true" : "false"

      const payload: any = {
        nome: formData.nome,
        apelido: formData.apelido,
        departamento: formData.departamento,
        unidade: formData.unidade || "Não definida",
        desativado: statusValue,
        imagem_url: formData.imagem_url || "",
        data_nascimento: formData.data_nascimento || null,
        data_sincronizacao: new Date().toISOString()
      }

      console.log("Enviando para Supabase:", { table, id: broker.id, payload })

      let response
      if (broker.id === "novo") {
        response = await supabase.from(table).insert([payload]).select()
      } else {
        response = await supabase.from(table).update(payload).eq('id', broker.id).select()
      }

      if (response.error) {
        console.error("Erro Supabase:", response.error)
        throw response.error
      }

      toast({ 
        title: "Sucesso", 
        description: broker.id === "novo" ? "Corretor adicionado com sucesso." : "Dados do corretor atualizados." 
      })
      onUpdate()
      onClose()
    } catch (err: any) {
      console.error("Erro detalhado ao salvar:", err)
      toast({ title: "Erro ao salvar", description: err.message || "Erro desconhecido", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setFormData({ ...formData, imagem_url: base64String })
      toast({ title: "Foto Convertida", description: "A imagem foi convertida para Base64 e será salva ao atualizar." })
    }
    reader.readAsDataURL(file)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="flex flex-col items-center gap-4">
            <div className="relative group">
              <Avatar className="h-28 w-28 border-4 border-white shadow-xl">
                <AvatarImage src={formData.imagem_url} alt={formData.nome} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold uppercase">
                  {formData.nome.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                <Camera size={16} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
              />
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight">{formData.nome}</h2>
              <p className="text-sm font-bold text-muted-foreground bg-accent/50 px-3 py-0.5 rounded-full inline-block">
                ID: {broker.id}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="px-8 pb-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">Apelido / Nome</Label>
              <Input 
                className="rounded-xl h-12 bg-accent/20 border-none focus-visible:ring-primary/20"
                value={formData.nome} 
                onChange={(e) => setFormData({...formData, nome: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">Cidade Origem</Label>
              <Select value={formData.cidade_origem} onValueChange={(v) => setFormData({...formData, cidade_origem: v})}>
                <SelectTrigger className="rounded-xl h-12 bg-accent/20 border-none focus-visible:ring-primary/20">
                  <SelectValue placeholder="Selecionar Cidade" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  {options.cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                  {options.cities.length === 0 && (
                    <>
                      <SelectItem value="Palmas-To">Palmas-To</SelectItem>
                      <SelectItem value="Araguaina-To">Araguaína-To</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">Departamento</Label>
              <Select value={formData.departamento} onValueChange={(v) => setFormData({...formData, departamento: v})}>
                <SelectTrigger className="rounded-xl h-12 bg-accent/20 border-none focus-visible:ring-primary/20">
                  <SelectValue placeholder="Selecionar Departamento" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  {options.departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                  {options.departments.length === 0 && (
                    <>
                      <SelectItem value="Vendas">Vendas</SelectItem>
                      <SelectItem value="Locação">Locação</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">Unidade</Label>
              <Select value={formData.unidade} onValueChange={(v) => setFormData({...formData, unidade: v})}>
                <SelectTrigger className="rounded-xl h-12 bg-accent/20 border-none focus-visible:ring-primary/20">
                  <SelectValue placeholder="Selecionar Unidade" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  {options.units.map(unit => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                  {options.units.length === 0 && (
                    <>
                      <SelectItem value="Matriz">Matriz</SelectItem>
                      <SelectItem value="Orla">Orla</SelectItem>
                      <SelectItem value="Shopping">Shopping</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">Apelido</Label>
              <Input 
                className="rounded-xl h-12 bg-accent/20 border-none focus-visible:ring-primary/20"
                value={formData.apelido} 
                onChange={(e) => setFormData({...formData, apelido: e.target.value})} 
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">Aniversário</Label>
              <Input 
                type="date"
                className="rounded-xl h-12 bg-accent/20 border-none focus-visible:ring-primary/20"
                value={formData.data_nascimento} 
                onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})} 
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-accent/20 rounded-2xl">
            <div className="space-y-0.5">
              <Label className="text-sm font-bold text-foreground">Status do Corretor</Label>
              <p className="text-xs text-muted-foreground">
                {formData.desativado ? "Corretor está DESATIVADO" : "Corretor está ATIVO"}
              </p>
            </div>
            <Switch 
              className="data-[state=checked]:bg-primary"
              checked={!formData.desativado} 
              onCheckedChange={(checked) => setFormData({...formData, desativado: !checked})} 
            />
          </div>

          <div className="flex gap-3">
            <Button 
              className="flex-1 h-12 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm shadow-lg shadow-pink-600/20" 
              onClick={handleSave} 
              disabled={loading}
            >
              ATUALIZAR
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 h-12 rounded-xl font-bold text-sm border-border hover:bg-accent" 
              onClick={onClose}
            >
              SAIR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
