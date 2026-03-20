"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { PropertyDetailsContent } from "./property-details-content"

interface PropertyDetailsDrawerProps {
  property: any | null
  onClose: () => void
  formatCurrency: (val: number) => string
}

export function PropertyDetailsDrawer({ property, onClose, formatCurrency }: PropertyDetailsDrawerProps) {
  if (!property) return null

  return (
    <Sheet open={!!property} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col bg-card border-l border-border h-full">
        <SheetHeader className="sr-only">
          <SheetTitle>Detalhes do Imóvel</SheetTitle>
          <SheetDescription>
            Visualização detalhada do imóvel localizado em {property.address}
          </SheetDescription>
        </SheetHeader>

        <PropertyDetailsContent 
            property={property} 
            formatCurrency={formatCurrency} 
            onClose={onClose}
        />
      </SheetContent>
    </Sheet>
  )
}
