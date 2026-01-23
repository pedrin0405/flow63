import { useState } from "react"
import { Search, MapPin, Users, Edit2, Plus } from "lucide-react" // Adicionado Plus
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

// Interface exportada para usar na página
export interface Broker {
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

  const dynamicCities = Array.from(
    new Set(brokers.map(b => b.cidade_origem).filter(Boolean))
  )

  const filteredBrokers = brokers.filter(broker => {
    const isDesativado =
      broker.desativado === true || broker.desativado === "true"

    const matchesSearch =
      broker.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      broker.id.toString().includes(searchTerm)

    const matchesCity =
      cityFilter === "all" || broker.cidade_origem === cityFilter

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !isDesativado) ||
      (statusFilter === "inactive" && isDesativado)

    return matchesSearch && matchesCity && matchesStatus
  })

  // Função para abrir modal de criação
  const handleNewBroker = () => {
    setSelectedBroker({
      id: "novo",
      nome: "",
      cidade_origem: "",
      unidade: "",
      imagem_url: "",
      desativado: false
    } as Broker)
    setIsEditModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* FILTROS E AÇÕES */}
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
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Cidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Cidades</SelectItem>
            {dynamicCities.map(city => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleNewBroker} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus size={18} />
          Novo
        </Button>
      </div>

      {/* LISTA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBrokers.map((broker) => {
          const isDesativado =
            broker.desativado === true || broker.desativado === "true"

          return (
            <Card
              // ALTERE AQUI: Usamos ID + Cidade para garantir unicidade
              key={`${broker.id}-${broker.cidade_origem}`} 
              className={`group hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden bg-card border-2 rounded-2xl flex flex-col h-full ${
                isDesativado ? "border-red-500" : "border-emerald-500"
              }`}
              onClick={() => {
                setSelectedBroker(broker)
                setIsEditModalOpen(true)
              }}
            >
              {/* HEADER */}
              <div className="p-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs truncate uppercase">
                    {broker.nome}
                  </h3>
                  <span className="text-[9px] text-muted-foreground uppercase">
                    Corretor
                  </span>
                </div>
              </div>

              {/* IMAGEM */}
              <div className="relative aspect-[4/3] bg-accent/50 overflow-hidden border-y">
                {broker.imagem_url ? (
                  <img
                    src={broker.imagem_url}
                    alt={broker.nome}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Users className="w-16 h-16 text-muted-foreground/20" />
                  </div>
                )}

                <div className="absolute bottom-3 left-3">
                  <Badge className="bg-foreground/60 text-card text-[10px]">
                    <MapPin size={10} />
                    {broker.cidade_origem}
                  </Badge>
                </div>

                {isDesativado && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-2 py-1 rounded-bl-lg uppercase">
                    Desativado
                  </div>
                )}
              </div>

              {/* CONTEÚDO */}
              <CardContent className="p-3 flex-1 flex flex-col justify-between">
                <div className="flex justify-between">
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase">
                      Unidade
                    </span>
                    <p className="text-xs font-bold truncate">
                      {broker.unidade || "Não definida"}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] text-muted-foreground uppercase">
                      ID
                    </span>
                    <p className="text-xs font-bold">#{broker.id}</p>
                  </div>
                </div>

                <div className="pt-2 border-t flex justify-end">
                  <Button variant="outline" size="sm" className="gap-1">
                    <Edit2 size={12} />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* MODAL */}
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