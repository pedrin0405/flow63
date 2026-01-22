import { useState } from "react"
import { Search, MapPin, UserCheck, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BrokerEditModal } from "./broker-edit-modal"

// Interface atualizada para usar data_nascimento
interface Broker {
  id: string | number
  nome: string
  imagem_url: string
  unidade: string
  cidade: string
  desativado: boolean
  equipe?: string
  data_nascimento?: string // Mudado de aniversario para data_nascimento
}

interface BrokerListProps {
  brokers: Broker[]
  onUpdate: () => void
}

export function BrokerList({ brokers, onUpdate }: BrokerListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [cityFilter, setCityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const filteredBrokers = brokers.filter(broker => {
    // @ts-ignore
    const isDesativado = broker.desativado === true || broker.desativado === "true"
    
    const matchesSearch = broker.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          broker.id.toString().includes(searchTerm)
    const matchesCity = cityFilter === "all" || broker.cidade === cityFilter
    const matchesStatus = statusFilter === "all" || 
                          (statusFilter === "active" && !isDesativado) || 
                          (statusFilter === "inactive" && isDesativado)
    
    return matchesSearch && matchesCity && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Buscar por nome ou código..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Cidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Cidades</SelectItem>
            <SelectItem value="Palmas">Palmas</SelectItem>
            <SelectItem value="Araguaina">Araguaína</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBrokers.map((broker) => (
          <Card 
            key={broker.id} 
            className="group hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden bg-card border border-border rounded-2xl flex flex-col h-full"
            onClick={() => {
              setSelectedBroker(broker)
              setIsEditModalOpen(true)
            }}
          >
            {/* Header: Foto Redonda e Info básica */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-foreground truncate w-40 group-hover:text-primary transition-colors uppercase">
                    {broker.nome}
                  </h3>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium uppercase">
                    CORRETOR
                  </div>
                </div>
              </div>
            </div>

            {/* Imagem do Corretor Centralizada e Alinhada */}
            <div className="relative aspect-square bg-accent/50 overflow-hidden mx-0 border-y border-border/30">
              {broker.imagem_url ? (
                <img 
                  src={broker.imagem_url} 
                  alt={broker.nome} 
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-accent/20">
                  <UserCheck className="w-16 h-16 text-muted-foreground/20" />
                </div>
              )}
              
              {/* Overlay de Cidade no Rodapé da Imagem */}
              <div className="absolute bottom-3 left-3">
                <Badge variant="secondary" className="bg-foreground/60 backdrop-blur-sm text-card border-none shadow-sm flex items-center gap-1 py-1 px-2 text-[10px]">
                  <MapPin size={10} className="text-white" />
                  {broker.cidade}
                </Badge>
              </div>

              {/* Tag Desativado - Estilo Imagem 5 */}
              {/* @ts-ignore */}
              {(broker.desativado === true || broker.desativado === "true") && (
                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10 flex items-center gap-1 shadow-sm uppercase tracking-wider">
                  Desativado
                </div>
              )}
            </div>

            <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight mb-0.5">Unidade</span>
                  <span className="text-sm font-bold text-foreground truncate">{broker.unidade || "Não definida"}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight mb-0.5">ID</span>
                  <span className="bg-accent/50 px-2 py-0.5 rounded text-[10px] font-bold text-foreground">
                    #{broker.id}
                  </span>
                </div>
              </div>
              
              <div className="pt-3 border-t border-border flex items-center justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl h-8 px-4 font-bold text-xs gap-1.5 border-border hover:bg-accent transition-all shrink-0"
                >
                  <Edit2 size={12} />
                  <span>Editar</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
        
      {selectedBroker && (
        <BrokerEditModal 
          broker={selectedBroker}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedBroker(null)
          }}
          onUpdate={onUpdate}
        />
      )}
    </div>
  )
}