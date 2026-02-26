import { useState } from "react"
import { MapPin, Users, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/central63/services/pagination"
import BrokerEditModal, { Broker } from "./broker-edit-modal"
import { BrokerFilters } from "./broker-filters"

interface BrokerListProps {
  brokers: Broker[]
  onUpdate: () => void
  isLoading: boolean
  currentPage: number
  totalItems: number
  onPageChange: (page: number) => void
  filters: { search: string; city: string; status: string }
  setFilters: (filters: any) => void
  cities: string[]
}

export function BrokerList({
  brokers,
  onUpdate,
  isLoading,
  currentPage,
  totalItems,
  onPageChange,
  filters,
  setFilters,
  cities,
}: BrokerListProps) {
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  const itemsPerPage = 10
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // Atualiza os filtros e reseta para a página 1
  const updateFilters = (key: string, value: string) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }))
    onPageChange(1)
  }

  return (
    <div className="space-y-6">
      {/* 1. BARRA DE FILTROS FIXA (Fora do condicional de Loading) */}
      <BrokerFilters
        searchTerm={filters.search}
        onSearchChange={(val) => updateFilters("search", val)}
        cityFilter={filters.city}
        onCityChange={(val) => updateFilters("city", val)}
        statusFilter={filters.status}
        onStatusChange={(val) => updateFilters("status", val)}
        cities={cities}
        onClearFilters={() => {
          setFilters({ search: "", city: "all", status: "all" })
          onPageChange(1)
        }}
        hasActiveFilters={
          filters.search !== "" || 
          filters.city !== "all" || 
          filters.status !== "all"
        }
      />

      {/* 2. ÁREA DE RESULTADOS COM LOADING */}
      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {brokers.length > 0 ? (
              brokers.map((broker, index) => {
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
                    <div className="relative aspect-square w-full overflow-hidden">
                      {broker.imagem_url ? (
                        <img
                          src={broker.imagem_url}
                          alt={broker.nome}
                          loading="lazy" // Otimização de Egress para imagens
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
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center p-12 text-center opacity-50">
                <Users className="w-16 h-16 mb-4 text-muted-foreground/30" />
                <h3 className="text-lg font-bold">Nenhum corretor encontrado</h3>
              </div>
            )}
          </div>

          {/* 3. PAGINAÇÃO */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          )}
        </>
      )}

      {/* Modais */}
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

export type { Broker }