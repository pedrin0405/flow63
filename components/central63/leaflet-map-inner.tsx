"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import { MapPin, Building2, Home, Landmark, Trees, Store, Info, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// Fix para os ícones do Leaflet que somem no build do Next.js
const fixLeafletIcons = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  })
}

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.setView(center, zoom)
    }
  }, [center, zoom, map])
  return null
}

export default function LeafletMapInner({ 
  properties, 
  selectedProperty, 
  formatCurrency, 
  onPropertyClick,
  center,
  zoom = 13,
  showPopups = true
}: any) {
  useEffect(() => {
    fixLeafletIcons()
  }, [])

  const defaultCenter: [number, number] = center || [-10.1837, -48.3337]

  const createIcon = (type: string, isSelected: boolean) => {
    const t = type.toLowerCase()
    let color = "#3b82f6" // azul (Casa)
    if (t.includes("apartamento") || t.includes("predio") || t.includes("prédio")) color = "#ef4444" // vermelho
    else if (t.includes("lote") || t.includes("terreno")) color = "#22c55e" // verde
    else if (t.includes("comercial") || t.includes("loja")) color = "#f97316" // laranja
    else if (t.includes("rural") || t.includes("fazenda")) color = "#8b4513" // marrom

    const size = isSelected ? 22 : 14
    const border = isSelected ? '3px solid white' : '2px solid white'
    const shadow = isSelected ? '0 0 15px rgba(0,0,0,0.6)' : '0 2px 4px rgba(0,0,0,0.3)'

    return new L.DivIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: ${border}; box-shadow: ${shadow}; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);"></div>`,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
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
    <MapContainer 
      center={defaultCenter} 
      zoom={zoom} 
      scrollWheelZoom={true} 
      className="w-full h-full z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {center && <ChangeView center={center} zoom={zoom} />}
      
      {properties.map((prop: any, idx: number) => {
        if (!prop.latitude || !prop.longitude) return null;

        const lat = prop.latitude
        const lng = prop.longitude
        const isSelected = selectedProperty?.code === prop.code
        const icon = createIcon(prop.type, isSelected)

        return (
          <Marker 
            key={`${prop.code}-${idx}`} 
            position={[lat, lng]} 
            icon={icon}
            eventHandlers={{
              click: () => onPropertyClick?.(prop)
            }}
          >
            {showPopups && (
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
                                onClick={() => onPropertyClick?.(prop)}
                            >
                                <ExternalLink size={10} /> Detalhes
                            </Button>
                        </div>
                    </div>
                </div>
              </Popup>
            )}
          </Marker>
        )
      })}
    </MapContainer>
  )
}
