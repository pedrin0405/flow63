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
  showPopups = true,
  featuredCodes = []
}: any) {
  useEffect(() => {
    fixLeafletIcons()
  }, [])

  const parseCoordinate = (value: any): number | null => {
    if (value === null || value === undefined || value === "") return null
    if (typeof value === "number") return Number.isFinite(value) ? value : null
    const normalized = String(value).trim().replace(/\s+/g, "").replace(",", ".")
    const parsed = Number.parseFloat(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }

  const parsedCenterLat = parseCoordinate(center?.[0])
  const parsedCenterLng = parseCoordinate(center?.[1])
  const defaultCenter: [number, number] =
    parsedCenterLat !== null && parsedCenterLng !== null ? [parsedCenterLat, parsedCenterLng] : [-10.1837, -48.3337]

  const createIcon = (type: string, isSelected: boolean, isFeatured: boolean) => {
    const t = type.toLowerCase()
    let color = "#3b82f6" // azul (Casa)
    if (t.includes("apartamento") || t.includes("predio") || t.includes("prédio")) color = "#ef4444" // vermelho
    else if (t.includes("lote") || t.includes("terreno")) color = "#22c55e" // verde
    else if (t.includes("comercial") || t.includes("loja")) color = "#f97316" // laranja
    else if (t.includes("rural") || t.includes("fazenda")) color = "#8b4513" // marrom

    const size = isSelected ? 22 : 14
    let border = isSelected ? '3px solid white' : '2px solid white'
    if (isFeatured) border = isSelected ? '3.5px solid #f59e0b' : '2.5px solid #f59e0b'
    
    const shadow = isSelected ? '0 0 15px rgba(245,158,11,0.4)' : '0 2px 4px rgba(0,0,0,0.3)'

    const starHtml = isFeatured ? `
      <div style="position: absolute; top: -10px; right: -10px; background: #f59e0b; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; border: 1.5px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); z-index: 10;">
        <svg viewBox="0 0 24 24" width="10" height="10" fill="white" stroke="white" stroke-width="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
        </svg>
      </div>
    ` : ''

    return new L.DivIcon({
      className: 'custom-div-icon',
      html: `
        <div style="position: relative;">
          <div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: ${border}; box-shadow: ${shadow}; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);"></div>
          ${starHtml}
        </div>
      `,
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
      
      {center && parsedCenterLat !== null && parsedCenterLng !== null && (
        <ChangeView center={[parsedCenterLat, parsedCenterLng]} zoom={zoom} />
      )}
      
      {properties.map((prop: any, idx: number) => {
        const lat = parseCoordinate(prop.latitude)
        const lng = parseCoordinate(prop.longitude)
        if (lat === null || lng === null) return null

        const isSelected = selectedProperty?.code === prop.code
        const isFeatured = featuredCodes.includes(prop.code)
        const icon = createIcon(prop.type, isSelected, isFeatured)

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
