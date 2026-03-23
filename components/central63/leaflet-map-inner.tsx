"use client"

import { useEffect, useMemo, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import { MapPin, Building2, Home, Landmark, Trees, Store, Info, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const fixLeafletIcons = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  })
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  const lastAppliedRef = useRef<{ lat: number; lng: number; zoom: number } | null>(null)

  useEffect(() => {
    const current = map.getCenter()
    const currentZoom = map.getZoom()
    const [targetLat, targetLng] = center

    const isSameAsCurrentView =
      Math.abs(current.lat - targetLat) < 0.00001 &&
      Math.abs(current.lng - targetLng) < 0.00001 &&
      currentZoom === zoom

    const isSameAsLastApplied =
      !!lastAppliedRef.current &&
      Math.abs(lastAppliedRef.current.lat - targetLat) < 0.00001 &&
      Math.abs(lastAppliedRef.current.lng - targetLng) < 0.00001 &&
      lastAppliedRef.current.zoom === zoom

    if (isSameAsCurrentView || isSameAsLastApplied) return

    map.setView(center, zoom)
    lastAppliedRef.current = { lat: targetLat, lng: targetLng, zoom }
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
  featuredCodes = [],
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

  const featuredCodeSet = useMemo(() => {
    return new Set((featuredCodes || []).map((c: any) => String(c)))
  }, [featuredCodes])

  const createIcon = (type: string, isSelected: boolean, isFeatured: boolean) => {
    const t = String(type || "").toLowerCase()
    let color = "#3b82f6"
    if (t.includes("apartamento") || t.includes("predio") || t.includes("prédio")) color = "#ef4444"
    else if (t.includes("lote") || t.includes("terreno")) color = "#22c55e"
    else if (t.includes("comercial") || t.includes("loja")) color = "#f97316"
    else if (t.includes("rural") || t.includes("fazenda")) color = "#8b4513"

    const size = isSelected ? 22 : 14
    const border = isSelected ? "3px solid white" : "2px solid white"
    const shadow = isSelected ? "0 0 15px rgba(0,0,0,0.6)" : "0 2px 4px rgba(0,0,0,0.3)"

    const starHtml = isFeatured
      ? `<div style="position:absolute;top:-8px;right:-8px;background:#f59e0b;border-radius:50%;width:14px;height:14px;display:flex;align-items:center;justify-content:center;border:1.5px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.2);z-index:10;"><svg viewBox=\"0 0 24 24\" width=\"8\" height=\"8\" fill=\"white\"><path d=\"M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z\"></path></svg></div>`
      : ""

    return new L.DivIcon({
      className: "custom-div-icon",
      html: `<div style="position:relative;"><div style="background-color:${color};width:${size}px;height:${size}px;border-radius:50%;border:${border};box-shadow:${shadow};transition:all .2s ease;"></div>${starHtml}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    })
  }

  const getTypeIcon = (type: string) => {
    const t = String(type || "").toLowerCase()
    if (t.includes("casa")) return <Home className="w-4 h-4" />
    if (t.includes("apartamento")) return <Building2 className="w-4 h-4" />
    if (t.includes("lote")) return <Landmark className="w-4 h-4" />
    if (t.includes("comercial")) return <Store className="w-4 h-4" />
    if (t.includes("rural")) return <Trees className="w-4 h-4" />
    return <Info className="w-4 h-4" />
  }

  return (
    <>
    <MapContainer
      center={defaultCenter}
      zoom={zoom}
      scrollWheelZoom={true}
      zoomAnimation={true}
      markerZoomAnimation={true}
      zoomSnap={0.25}
      zoomDelta={0.25}
      wheelPxPerZoomLevel={160}
      wheelDebounceTime={80}
      minZoom={5}
      maxZoom={19}
      className="w-full h-full z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {center && parsedCenterLat !== null && parsedCenterLng !== null && (
        <ChangeView center={[parsedCenterLat, parsedCenterLng]} zoom={zoom} />
      )}

      {(properties || []).map((prop: any, idx: number) => {
        const lat = parseCoordinate(prop.latitude)
        const lng = parseCoordinate(prop.longitude)
        if (lat === null || lng === null) return null

        const isSelected = selectedProperty?.code === prop.code
        const isFeatured = featuredCodeSet.has(String(prop.code))
        const icon = createIcon(prop.type, isSelected, isFeatured)

        return (
          <Marker
            key={`${String(prop.code)}-${idx}`}
            position={[lat, lng]}
            icon={icon}
            eventHandlers={showPopups ? undefined : {
              click: () => onPropertyClick?.(prop),
            }}
          >
            {showPopups && (
              <Popup className="apple-glass-popup" closeButton={false} autoPan={true} keepInView={true}>
                <div className="relative w-[min(288px,78vw)] font-sans rounded-2xl border border-white/60 dark:border-white/15 bg-white/70 dark:bg-zinc-900/72 backdrop-blur-3xl shadow-[0_18px_36px_rgba(15,23,42,0.22)] dark:shadow-[0_18px_36px_rgba(0,0,0,0.45)] overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/95 dark:via-white/30 to-transparent" />

                  <div className="relative h-24 overflow-hidden">
                    <img
                      src={prop.image || "https://app.imoview.com.br//Front/img/house1.png"}
                      alt={`Preview imóvel ${String(prop.code)}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                    <Badge className="absolute left-2.5 top-2 text-[9px] px-1.5 py-0 font-black rounded-md bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 border border-white/70 dark:border-white/10">
                      {prop.status || "Disponível"}
                    </Badge>
                  </div>

                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-[0.16em] font-black text-muted-foreground">Imóvel</p>
                        <p className="text-sm font-black leading-tight text-zinc-900 dark:text-zinc-100">#{String(prop.code)}</p>
                      </div>
                      <div className="p-1.5 rounded-md bg-white/80 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 shrink-0 text-zinc-800 dark:text-zinc-100">
                        {getTypeIcon(prop.type)}
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground flex items-start gap-1.5 mt-2 leading-snug break-words">
                      <MapPin size={10} /> {prop.neighborhood}
                    </p>

                    <p className="text-[11px] text-zinc-700 dark:text-zinc-300 mt-1.5 leading-snug break-words">
                      {prop.address || "Endereço não informado"}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-white/45 dark:border-white/15">
                      <span className="font-black text-primary text-base leading-none">{formatCurrency(Number(prop.value || 0))}</span>
                      <Button
                        size="sm"
                        className="h-8 px-3 text-[10px] font-black uppercase tracking-[0.1em] rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 border border-white/20 dark:border-white/50"
                        onClick={() => onPropertyClick?.(prop)}
                      >
                        <ExternalLink size={10} className="mr-1" /> Ver Detalhes
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

    <style jsx global>{`
      .apple-glass-popup .leaflet-popup-content-wrapper {
        background: transparent;
        box-shadow: none;
        border: none;
        padding: 0;
        border-radius: 16px;
        overflow: visible;
      }

      .apple-glass-popup .leaflet-popup-content {
        margin: 0;
        width: auto !important;
        min-width: 0;
      }

      .apple-glass-popup .leaflet-popup-tip-container {
        margin-top: -1px;
      }

      .apple-glass-popup .leaflet-popup-tip {
        background: rgba(255, 255, 255, 0.78);
        box-shadow: none;
        border: 1px solid rgba(255, 255, 255, 0.65);
      }

      .dark .apple-glass-popup .leaflet-popup-tip {
        background: rgba(24, 24, 27, 0.92);
        border: 1px solid rgba(255, 255, 255, 0.12);
      }

      .apple-glass-popup.leaflet-popup {
        margin-bottom: 16px;
      }
    `}</style>
    </>
  )
}
