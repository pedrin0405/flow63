"use client"

import { type LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend: string
  color: string
}

export function StatCard({ title, value, icon: Icon, trend, color }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            <h3 className="text-3xl font-bold text-foreground mt-2 tracking-tight">{value}</h3>
          </div>
          <div className={`p-3 rounded-xl ${color} shadow-lg`}>
            <Icon size={22} className="text-white" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <span className="text-emerald-600 font-semibold flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            {trend}
          </span>
          <span className="text-muted-foreground ml-2">vs. mês anterior</span>
        </div>
      </div>
    </div>
  )
}
