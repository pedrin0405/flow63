"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Map as MapIcon, Search, X, MapPin, Building2, Home, Landmark, Trees, Store, Info, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PropertyDetailsDrawer } from "@/components/central63/property-details-drawer"

// Imports dinâmicos para Leaflet (evita erro de SSR no Next.js)
import dynamic from 'next/dynamic'

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

// Import de estilos do Leaflet
import 'leaflet/dist/leaflet.css'

interface PropertyMapDialogProps {
  properties: any[]
  formatCurrency: (val: number) => string
}

export function PropertyMapDialog({ properties, formatCurrency }: PropertyMapDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [drawerProperty, setDrawerProperty] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [L, setL] = useState<any>(null)

  // Carrega o Leaflet apenas no cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((leaflet) => {
        setL(leaflet)
      })
    }
  }, [])

  const defaultCenter: [number, number] = [-10.1837, -48.3337] // Palmas, TO

  const filteredProperties = useMemo(() => {
    if (!searchQuery) return properties
    const s = searchQuery.toLowerCase()
    return properties.filter(p => 
      String(p.code || "").toLowerCase().includes(s) ||
      String(p.address || "").toLowerCase().includes(s) ||
      String(p.neighborhood || "").toLowerCase().includes(s) ||
      String(p.type || "").toLowerCase().includes(s)
    )
  }, [properties, searchQuery])

  // Cores por tipo usando ícones padrão do Leaflet customizados
  const createIcon = (type: string) => {
    if (!L) return null
    const t = type.toLowerCase()
    let color = "#3b82f6" // azul (Casa)
    if (t.includes("apartamento") || t.includes("predio") || t.includes("prédio")) color = "#ef4444" // vermelho
    else if (t.includes("lote") || t.includes("terreno")) color = "#22c55e" // verde
    else if (t.includes("comercial") || t.includes("loja")) color = "#f97316" // laranja
    else if (t.includes("rural") || t.includes("fazenda")) color = "#8b4513" // marrom

    return new L.DivIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    })
  }

  const getTypeIcon = (type: string) => {
    const t = type.toLowerCase()
    if (t.includes("casa")) return <Home className="w-4 h-4" />
    if (t.includes("apartamento")) return <Building2 className="w-4 h-4" />
    if (t.includes("lote")) return <Landmark className="w-4 h-4" />
    if (t.includes("comercial")) return <Store className="w-4 h-4" />
    if (t.includes("rural")) return <Trees className="w-4 h-4" />
    return <Info className="w-4 h-4" />
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 shadow-sm border-primary/20 hover:border-primary transition-all">
            <MapIcon size={18} className="text-primary" />
            <span className="hidden sm:inline">Ver no Mapa</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[95vw] w-[1200px] h-[90vh] p-0 overflow-hidden flex flex-col rounded-2xl border-none shadow-2xl">
          <DialogHeader className="p-4 border-b bg-card shrink-0 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapIcon className="text-primary" size={20} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Mapa de Imóveis (OpenSource)</DialogTitle>
                <p className="text-xs text-muted-foreground">Visualize {filteredProperties.length} imóveis na região</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 max-w-md w-full ml-auto mr-8">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input 
                        placeholder="Buscar por código, nome ou tipo..." 
                        className="pl-9 bg-muted/50 border-none focus-visible:ring-primary/30 h-10 rounded-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>
          </DialogHeader>

          <div className="flex-1 relative bg-muted z-0">
            {isOpen && L && (
              <MapContainer 
                center={defaultCenter} 
                zoom={13} 
                scrollWheelZoom={true} 
                className="w-full h-full z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {filteredProperties.map((prop, idx) => {
                  const lat = prop.latitude || -10.18 + (Math.random() * 0.05 - 0.025)
                  const lng = prop.longitude || -48.33 + (Math.random() * 0.05 - 0.025)
                  const icon = createIcon(prop.type)

                  if (!icon) return null

                  return (
                    <Marker 
                      key={`${prop.code}-${idx}`} 
                      position={[lat, lng]} 
                      icon={icon}
                    >
                      <Popup>
                        <div className="p-1 min-w-[200px] font-sans">
                            <div className="relative h-24 mb-2 rounded-lg overflow-hidden">
                                <img 
                                    src={prop.image} 
                                    alt="Imóvel" 
                                    className="w-full h-full object-cover"
                                />
                                <Badge className="absolute top-1 left-1 text-[10px] px-1.5 py-0 shadow-sm" variant="default">
                                    {prop.status}
                                </Badge>
                            </div>
                            
                            <div className="space-y-1">
                                <div className="flex items-start justify-between gap-1">
                                    <h4 className="font-bold text-[13px] line-clamp-1 leading-tight text-slate-900">
                                        {prop.address}
                                    </h4>
                                    <div className="p-1 bg-muted rounded shrink-0">
                                        {getTypeIcon(prop.type)}
                                    </div>
                                </div>
                                
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <MapPin size={8} /> {prop.neighborhood}
                                </p>
                                
                                <div className="flex items-center justify-between pt-1 border-t mt-1">
                                    <span className="font-black text-primary text-[14px]">
                                        {formatCurrency(prop.value)}
                                    </span>
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-6 px-1.5 text-[10px] font-bold gap-1 hover:bg-primary/10 hover:text-primary"
                                        onClick={() => setDrawerProperty(prop)}
                                    >
                                        <ExternalLink size={10} /> Detalhes
                                    </Button>
                                </div>
                            </div>
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}
              </MapContainer>
            )}

            {/* Legenda */}
            <div className="absolute bottom-6 left-6 bg-card/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-border z-[1000] hidden md:block">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Legenda</h5>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium">
                        <div className="w-3 h-3 rounded-full bg-blue-500" /> Casas
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium">
                        <div className="w-3 h-3 rounded-full bg-red-500" /> Prédios
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium">
                        <div className="w-3 h-3 rounded-full bg-green-500" /> Lotes
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium">
                        <div className="w-3 h-3 rounded-full bg-orange-500" /> Comercial
                    </div>
                     <div className="flex items-center gap-2 text-xs font-medium">
                        <div className="w-3 h-3 rounded-full bg-[#8B4513]" /> Rural
                    </div>
                </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PropertyDetailsDrawer 
        property={drawerProperty}
        onClose={() => setDrawerProperty(null)}
        formatCurrency={formatCurrency}
      />
    </>
  )
}
