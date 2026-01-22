import { useState, useEffect, useRef } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
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
import { Camera } from "lucide-react"

// Interface atualizada para usar data_nascimento
interface Broker {
  id: string | number
  nome: string
  imagem_url: string
  unidade: string
  cidade: string
  desativado: boolean
  departamento?: string
  data_nascimento?: string 
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const initialDesativado = (broker.desativado as any) === true || (broker.desativado as any) === "true"

  const [formData, setFormData] = useState({
    nome: broker.nome,
    cidade: broker.cidade,
    departamento: broker.departamento || "",
    unidade: broker.unidade || "",
    data_nascimento: broker.data_nascimento || "",
    desativado: initialDesativado,
    imagem_url: broker.imagem_url
  })

  useEffect(() => {
    const isDesativado = (broker.desativado as any) === true || (broker.desativado as any) === "true"
    setFormData({
      nome: broker.nome,
      cidade: broker.cidade,
      departamento: broker.departamento || "",
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
      const isPmw = formData.cidade === "Palmas"
      const table = isPmw ? "corretores_pmw" : "corretores_aux"
      
      const statusValue = formData.desativado ? "true" : "false"

      const { error } = await supabase
        .from(table)
        .update({
          nome: formData.nome,
          unidade: formData.unidade,
          departamento: formData.departamento,
          desativado: statusValue,
          imagem_url: formData.imagem_url,
          data_nascimento: formData.data_nascimento
        } as any)
        .eq('id', broker.id)

      if (error) throw error

      toast({ title: "Sucesso", description: "Dados do corretor atualizados." })
      onUpdate()
      onClose()
    } catch (err: any) {
      console.error("Erro ao salvar:", err)
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData({ ...formData, imagem_url: reader.result as string })
    }
    reader.readAsDataURL(file)
    
    toast({ title: "Foto Selecionada", description: "A foto será salva ao clicar em ATUALIZAR." })
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
              <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">Cidade</Label>
              <Select value={formData.cidade} onValueChange={(v) => setFormData({...formData, cidade: v})}>
                <SelectTrigger className="rounded-xl h-12 bg-accent/20 border-none focus-visible:ring-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  <SelectItem value="Palmas">Palmas</SelectItem>
                  <SelectItem value="Araguaina">Araguaína</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">departamento</Label>
              <Select value={formData.departamento} onValueChange={(v) => setFormData({...formData, departamento: v})}>
                <SelectTrigger className="rounded-xl h-12 bg-accent/20 border-none focus-visible:ring-primary/20">
                  <SelectValue placeholder="Selecionar Equipe" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  <SelectItem value="Vendas A">Maurício</SelectItem>
                  <SelectItem value="Vendas B">Fernando</SelectItem>
                  <SelectItem value="Vendas C">Mariana</SelectItem>
                  <SelectItem value="Vendas D">Martins</SelectItem>
                  <SelectItem value="Vendas E">Igor</SelectItem>
                  <SelectItem value="Vendas F">Daniel</SelectItem>
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
                  <SelectItem value="Matriz">Matriz</SelectItem>
                  <SelectItem value="Orla">Orla</SelectItem>
                  <SelectItem value="Shopping">Shopping</SelectItem>
                  <SelectItem value="Araguaina">Araguaína</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">Data de Nascimento</Label>
              <Input 
                type="date"
                className="rounded-xl h-12 bg-accent/20 border-none focus-visible:ring-primary/20"
                value={formData.data_nascimento} 
                onChange={(e) => setFormData({...formData,  data_nascimento: e.target.value})} 
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