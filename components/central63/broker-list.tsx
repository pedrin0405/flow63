import { useState } from "react"
import { MapPin, Users, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import BrokerEditModal, { Broker } from "./broker-edit-modal"
import { BrokerFilters } from "./broker-filters"

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

  const hasActiveFilters =
    searchTerm !== "" || cityFilter !== "all" || statusFilter !== "all"

  const handleClearFilters = () => {
    setSearchTerm("")
    setCityFilter("all")
    setStatusFilter("all")
  }

  const filteredBrokers = brokers.filter(broker => {
    const isDesativado =
      broker.desativado === true || broker.desativado === "true"

    const brokerStatus = isDesativado ? "inactive" : "active"

    const matchesSearch =
      (broker.nome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      broker.id?.toString().includes(searchTerm)

    const matchesCity =
      cityFilter === "all" || broker.cidade_origem === cityFilter

    const matchesStatus =
      statusFilter === "all" || statusFilter === brokerStatus

    return matchesSearch && matchesCity && matchesStatus
  })

  return (
    <div className="space-y-6">
      <BrokerFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        cityFilter={cityFilter}
        onCityChange={setCityFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        cities={dynamicCities}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBrokers.length > 0 ? (
          filteredBrokers.map((broker, index) => {
            const isDesativado =
              broker.desativado === true || broker.desativado === "true"

            return (
              <Card
                key={`${broker.id}-${index}`}
                className="
                  group cursor-pointer relative overflow-hidden
                  bg-card border-2 border-border
                  rounded-[2rem]
                  flex flex-col h-full
                  p-0
                  hover:border-primary/20 hover:shadow-xl
                  transition-all duration-300
                "
                onClick={() => {
                  setSelectedBroker(broker)
                  setIsEditModalOpen(true)
                }}
              >
                {/* TOPO COM FOTO (100% FULL BLEED) */}
                <div className="relative aspect-square w-full overflow-hidden">
                  {broker.imagem_url ? (
                    <img
                      src={broker.imagem_url}
                      alt={broker.nome}
                      className="
                        w-full h-full object-cover object-top
                        rounded-t-[2rem]
                        transition-transform duration-500
                        group-hover:scale-105
                      "
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-accent/20 rounded-t-[2rem]">
                      <Users className="w-16 h-16 text-muted-foreground/20" />
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3">
                    <Badge
                      variant="secondary"
                      className="
                        bg-black/60 backdrop-blur-md text-white
                        border-none shadow-sm
                        flex items-center gap-1.5
                        py-1.5 px-3
                        text-[10px] font-bold rounded-full
                      "
                    >
                      <MapPin size={10} />
                      {broker.cidade_origem}
                    </Badge>
                  </div>

                  {isDesativado && (
                    <div className="
                      absolute top-0 right-0
                      bg-[#FF3B30] text-white
                      text-[10px] font-black
                      px-4 py-2
                      rounded-bl-3xl
                      shadow-lg z-10
                      uppercase tracking-widest
                    ">
                      INATIVO
                    </div>
                  )}
                </div>

                {/* CONTEÚDO */}
                <CardContent className="p-5 space-y-1 flex-1 flex flex-col">
                  <div className="space-y-0.5">
                    <div className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em]">
                      CORRETOR
                    </div>
                    <h3 className="font-bold text-lg text-foreground leading-tight uppercase truncate group-hover:text-primary transition-colors">
                      {broker.nome}
                    </h3>
                  </div>

                  <div className="pt-4 mt-auto border-t border-border/50 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-muted-foreground font-black uppercase">
                          Unidade
                        </span>
                        <span className="text-xs font-bold">
                          {broker.unidade || "ND"}
                        </span>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className="text-[9px] text-muted-foreground font-black uppercase">
                          ID
                        </span>
                        <span className="text-xs font-bold">
                          #{broker.id}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="
                          rounded-full h-10 px-6 w-full
                          font-bold text-xs gap-2
                          border-border
                          bg-accent/5
                          hover:bg-primary hover:text-white
                          transition-all shadow-sm
                        "
                      >
                        <Edit2 size={14} />
                        EDITAR
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center p-12 text-center opacity-50">
            <Users className="w-16 h-16 mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-bold">Nenhum corretor encontrado</h3>
            <Button
              variant="link"
              onClick={handleClearFilters}
              className="mt-2 text-primary font-bold"
            >
              Limpar filtros
            </Button>
          </div>
        )}
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
