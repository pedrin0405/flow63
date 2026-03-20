"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import dynamic from 'next/dynamic'

// Precisamos carregar o CSS do Leaflet fora do componente dinâmico
import 'leaflet/dist/leaflet.css'

interface PropertyMapProps {
  properties: any[]
  selectedProperty?: any | null
  formatCurrency: (val: number) => string
  onPropertyClick?: (prop: any) => void
  center?: [number, number]
  zoom?: number
  className?: string
  showPopups?: boolean
}

// O componente real do Leaflet que só roda no cliente
const MapComponent = dynamic(
  () => import('./leaflet-map-inner'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-muted/50 animate-pulse flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin opacity-20" />
        <p className="text-muted-foreground font-black text-[10px] uppercase tracking-widest opacity-30">Renderizando Mapa</p>
      </div>
    )
  }
)

export function PropertyMap(props: PropertyMapProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className={props.className || "w-full h-[400px]"}>
      <MapComponent {...props} />
    </div>
  )
}
