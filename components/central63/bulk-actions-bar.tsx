"use client"

import { X, LayoutDashboard, Eye, EyeOff, CheckCircle2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BulkActionsBarProps {
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onDeselectAll: () => void
  onAddToDashboard: () => void
  onRemoveFromDashboard: () => void
  onMarkAsVerified: () => void
  allSelected: boolean
}

export function BulkActionsBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onAddToDashboard,
  onRemoveFromDashboard,
  onMarkAsVerified,
  allSelected
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-foreground text-background px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-border/10">
        {/* Selection Info */}
        <div className="flex items-center gap-3 pr-4 border-r border-background/20">
          <button 
            onClick={onDeselectAll}
            className="p-1.5 hover:bg-background/10 rounded-lg transition"
          >
            <X size={18} />
          </button>
          <span className="font-medium text-sm">
            <span className="text-primary-foreground font-bold">{selectedCount}</span> de {totalCount} selecionados
          </span>
        </div>

        {/* Select All Toggle */}
        <button
          onClick={allSelected ? onDeselectAll : onSelectAll}
          className="text-sm hover:text-primary-foreground/80 transition underline-offset-2 hover:underline"
        >
          {allSelected ? "Desmarcar todos" : "Selecionar todos"}
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-background/20" />

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddToDashboard}
            className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
          >
            <Eye size={16} />
            Add ao Dashboard
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemoveFromDashboard}
            className="bg-background/10 hover:bg-background/20 text-background gap-2"
          >
            <EyeOff size={16} />
            Ocultar
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAsVerified}
            className="bg-background/10 hover:bg-background/20 text-background gap-2"
          >
            <CheckCircle2 size={16} />
            Verificar
          </Button>
        </div>
      </div>
    </div>
  )
}
