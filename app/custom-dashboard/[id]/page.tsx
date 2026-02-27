'use client';

import React, { useEffect, useState, useMemo, memo } from 'react';
import { Sidebar } from "@/components/central63/sidebar";
import { 
  Menu, Download, X, BarChart3, LineChart, PieChart, 
  Hash, Table as TableIcon, LayoutDashboard, Database,
  FileImage, FileText, ChevronLeft, Loader2, Info, TrendingUp,
  Activity, Target, Zap, Star, Flame, Users, Wallet, Briefcase
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import {
  ResponsiveContainer, BarChart as ReBarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart as ReLineChart, Line, AreaChart as ReAreaChart, Area,
  PieChart as RePieChart, Pie, Cell, LabelList
} from "recharts";

// ─────────────────────────────────────────────
// Types & Helpers
// ─────────────────────────────────────────────
type DataType = "text" | "number" | "date" | "currency";

interface WidgetFilter {
  type: "include" | "exclude";
  field: string;
  condition: "equal" | "contains" | "starts_with" | "null";
  value: string;
}

interface WidgetConfig {
  title: string;
  type: "bar" | "line" | "pie" | "value" | "table" | "title" | "divider";
  size: "small" | "wide" | "tall" | "large" | "full";
  icon?: string;
  align?: "left" | "center" | "right";
  spreadsheet_ref: string;
  column_x: string;
  column_y: string;
  time_column: string;
  aggregation: "sum" | "avg" | "count" | "max" | "min";
  dataType: DataType;
  filters: WidgetFilter[];
}

const TITLE_ICONS: Record<string, { icon: React.ElementType }> = {
  target: { icon: Target },
  zap: { icon: Zap },
  star: { icon: Star },
  flame: { icon: Flame },
  trending: { icon: TrendingUp },
  users: { icon: Users },
  wallet: { icon: Wallet },
  briefcase: { icon: Briefcase },
};

const CHART_COLORS = [
  '#3b82f6', // Blue 500
  '#10b981', // Emerald 500
  '#f59e0b', // Amber 500
  '#ef4444', // Red 500
  '#8b5cf6', // Violet 500
  '#ec4899', // Pink 500
  '#06b6d4', // Cyan 500
  '#84cc16', // Lime 500
  '#f97316', // Orange 500
  '#14b8a6', // Teal 500
];

const AGGREGATION_LABELS: Record<string, string> = {
  sum: "Soma Total",
  avg: "Média",
  count: "Quantidade",
  max: "Máximo",
  min: "Mínimo"
};

function formatValue(value: number, type: DataType): string {
  if (type === "currency") return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  if (type === "number") return new Intl.NumberFormat('pt-BR').format(value);
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatXAxis(value: any, type: DataType): string {
  if (type === "date" && value) {
    const date = new Date(value);
    return !isNaN(date.getTime()) ? date.toLocaleDateString('pt-BR') : value;
  }
  return value;
}

function computeAggregatedData(widget: WidgetConfig, sheetData: any[]): { name: string; value: number; percent?: string }[] {
  if (widget.type === 'title' || widget.type === 'divider') return [];
  if (!sheetData || sheetData.length === 0) return [];
  let filtered = [...sheetData];

  if (widget.filters?.length > 0) {
    filtered = filtered.filter(item =>
      widget.filters.every(f => {
        if (!f.field) return true;
        const val = String(item[f.field] ?? "").toLowerCase();
        const fv = String(f.value ?? "").toLowerCase();
        let match = false;
        switch (f.condition) {
          case "equal": match = val === fv; break;
          case "contains": match = val.includes(fv); break;
          case "starts_with": match = val.startsWith(fv); break;
          case "null": match = !item[f.field] || item[f.field] === ""; break;
        }
        return f.type === "include" ? match : !match;
      })
    );
  }

  if (widget.type === "value") {
    const values = filtered.map(item => {
      let v = item[widget.column_y];
      if (typeof v === 'string') v = v.replace(/[R$\s.]/g, '').replace(',', '.');
      return parseFloat(v) || 0;
    });
    let total = 0;
    switch (widget.aggregation) {
      case "avg": total = values.reduce((a, b) => a + b, 0) / (values.length || 1); break;
      case "count": total = values.length; break;
      case "max": total = Math.max(...values, 0); break;
      case "min": total = Math.min(...values, 0); break;
      default: total = values.reduce((a, b) => a + b, 0);
    }
    return [{ name: "Total", value: total }];
  }

  const groups: Record<string, number[]> = {};
  filtered.forEach((item: any) => {
    const xVal = item[widget.column_x] || "Não Informado";
    let raw = item[widget.column_y];
    if (typeof raw === 'string') raw = raw.replace(/[R$\s.]/g, '').replace(',', '.');
    const yVal = parseFloat(raw) || 0;
    if (!groups[xVal]) groups[xVal] = [];
    groups[xVal].push(yVal);
  });

  const rawData = Object.keys(groups).slice(0, 15).map(key => {
    const vals = groups[key];
    let result = 0;
    switch (widget.aggregation) {
      case "avg": result = vals.reduce((a, b) => a + b, 0) / vals.length; break;
      case "count": result = vals.length; break;
      case "max": result = Math.max(...vals); break;
      case "min": result = Math.min(...vals); break;
      default: result = vals.reduce((a, b) => a + b, 0);
    }
    return { name: formatXAxis(key, widget.dataType), value: result };
  });

  const totalValue = rawData.reduce((acc, curr) => acc + curr.value, 0);
  return rawData.map(d => ({
    ...d,
    percent: totalValue > 0 ? ((d.value / totalValue) * 100).toFixed(1) + "%" : "0%"
  }));
}

// ─────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────

const StatCard = memo(({ title, value, icon: Icon, color, aggregation, className }: any) => (
  <div className={cn("bg-white p-6 rounded-2xl shadow-md border border-gray-100 relative overflow-hidden transition-all hover:shadow-lg hover:border-indigo-100 group flex flex-col justify-center min-h-[160px] h-full", className)}>
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-indigo-50 transition-colors">
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <Badge variant="secondary" className="text-[10px] font-bold bg-indigo-50 text-indigo-600 border-none">
          {AGGREGATION_LABELS[aggregation] || "Métrica"}
        </Badge>
      </div>
      <h3 className="text-gray-500 text-sm font-bold mb-1 truncate">{title}</h3>
      <span className="text-3xl font-black text-gray-900 tracking-tight truncate block">{value}</span>
      <div className="mt-4 flex items-center gap-2">
        <div className="flex -space-x-1">
          <div className="w-1.5 h-4 bg-indigo-500 rounded-full animate-pulse" />
          <div className="w-1.5 h-4 bg-indigo-300 rounded-full delay-75" />
          <div className="w-1.5 h-4 bg-indigo-100 rounded-full delay-150" />
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tempo Real</span>
      </div>
    </div>
    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 z-0 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none" />
  </div>
));
StatCard.displayName = "StatCard";

const ChartCard = memo(({ widget, sheetData, className }: { widget: WidgetConfig; sheetData: any[], className?: string }) => {
  const aggregatedData = useMemo(() => computeAggregatedData(widget, sheetData), [widget, sheetData]);
  const Icon = widget.type === 'bar' ? BarChart3 : widget.type === 'line' ? LineChart : PieChart;
  
  const isNarrow = widget.size === 'small' || widget.size === 'tall';

  // Gerador de ID único robusto para o gradiente SVG
  const gradientId = useMemo(() => `colorValue-${Math.random().toString(36).substr(2, 9)}`, []);
  
  // Escolhe uma cor ALEATÓRIA da paleta para este gráfico de linha especificamente
  const lineColor = useMemo(() => CHART_COLORS[Math.floor(Math.random() * CHART_COLORS.length)], []);

  return (
    <Card className={cn("rounded-2xl border border-gray-100 shadow-md flex flex-col h-full bg-white overflow-hidden", isNarrow ? "min-h-[400px]" : "lg:min-h-[520px]", className)}>
      <CardHeader className="border-b border-gray-50 p-5 lg:p-6 shrink-0 bg-gray-50/30">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2.5 bg-white shadow-sm rounded-xl text-indigo-600 shrink-0">
              <Icon size={20} />
            </div>
            <div className="overflow-hidden">
              <CardTitle className="text-gray-800 font-black text-lg tracking-tight truncate">{widget.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[9px] uppercase font-bold text-gray-400 border-gray-200 truncate max-w-[120px]">
                  {widget.column_x}
                </Badge>
                <span className="text-gray-300">/</span>
                <Badge variant="outline" className="text-[9px] uppercase font-bold text-indigo-500 border-indigo-100 bg-indigo-50/30 shrink-0">
                  {AGGREGATION_LABELS[widget.aggregation] || "Agreg."}
                </Badge>
              </div>
            </div>
          </div>
          <button className="text-gray-300 hover:text-indigo-500 transition-colors shrink-0"><Info size={18} /></button>
        </div>
      </CardHeader>
      
      <CardContent className={cn("flex-1 p-5 lg:p-6 flex gap-6", isNarrow ? "flex-col" : "flex-col lg:flex-row")}>
        <div className={cn("w-full flex-1 flex items-center justify-center", isNarrow ? "min-h-[200px]" : "min-h-[250px]")}>
          <ResponsiveContainer width="100%" height="100%">
            {widget.type === "bar" ? (
              <ReBarChart data={aggregatedData} margin={{ top: 35, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-gray-900 text-white p-3 shadow-2xl rounded-xl border-none">
                          <p className="text-[10px] font-bold opacity-60 uppercase mb-1">{data.name}</p>
                          <p className="text-sm font-black">{formatValue(payload[0].value as number, widget.dataType)}</p>
                          <p className="text-[9px] text-gray-300 font-bold mt-1">{data.percent} do total</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[6, 6, 0, 0]} 
                  barSize={isNarrow ? 25 : 35}
                  isAnimationActive={false}
                >
                    {aggregatedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                    <LabelList 
                      dataKey="value" 
                      position="top" 
                      offset={10} 
                      formatter={(val: number) => formatValue(val, widget.dataType)}
                      style={{ fontSize: '10px', fill: '#475569', fontWeight: 'bold' }} 
                    />
                </Bar>
              </ReBarChart>
            ) : widget.type === "line" ? (
              <ReAreaChart data={aggregatedData} margin={{ top: 35, right: 20, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={lineColor} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={lineColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip 
                   content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="text-white p-3 shadow-2xl rounded-xl" style={{ backgroundColor: lineColor }}>
                          <p className="text-[10px] font-bold opacity-70 uppercase">{payload[0].payload.name}</p>
                          <p className="text-lg font-black">{formatValue(payload[0].value as number, widget.dataType)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={lineColor} 
                  strokeWidth={4} 
                  fill={`url(#${gradientId})`}
                  dot={{ r: 5, fill: '#fff', strokeWidth: 2, stroke: lineColor }} 
                  activeDot={{ r: 7, strokeWidth: 0, fill: lineColor }}
                  isAnimationActive={false}
                >
                    <LabelList 
                      dataKey="value" 
                      position="top" 
                      offset={12} 
                      formatter={(val: number) => formatValue(val, widget.dataType)}
                      style={{ fontSize: '10px', fill: '#000000', fontWeight: 'bold' }} 
                    />
                </Area>
              </ReAreaChart>
            ) : (
              <RePieChart>
                <Pie 
                  data={aggregatedData} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" cy="50%" 
                  innerRadius="45%" 
                  outerRadius="70%" 
                  paddingAngle={5}
                  labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                  isAnimationActive={false}
                  label={(props: any) => {
                    const { x, y, cx, value } = props;
                    return (
                      <text 
                        x={x} 
                        y={y} 
                        fill="#475569" 
                        textAnchor={x > cx ? 'start' : 'end'} 
                        dominantBaseline="central"
                        style={{ fontSize: '10px', fontWeight: 'bold' }}
                      >
                        {formatValue(value, widget.dataType)}
                      </text>
                    );
                  }}
                >
                  {aggregatedData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="#fff" strokeWidth={isNarrow ? 2 : 3} />
                  ))}
                </Pie>
                <Tooltip 
                   content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-4 shadow-2xl border border-gray-100 rounded-2xl z-50">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{payload[0].name}</p>
                          <p className="text-xl font-black text-gray-900">{formatValue(payload[0].value as number, widget.dataType)}</p>
                          <Badge className="mt-2 bg-indigo-50 text-indigo-600 border-none font-bold">{payload[0].payload.percent}</Badge>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RePieChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* LEGENDA ENRIQUECIDA (Pie Chart) */}
        {widget.type === 'pie' && (
          <div className={cn("flex flex-col justify-center gap-3 overflow-y-auto pr-2 custom-scrollbar shrink-0", isNarrow ? "w-full max-h-[220px]" : "lg:w-64 max-h-[350px]")}>
            <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Composição de Dados</p>
                <div className="space-y-3">
                    {aggregatedData.map((entry, index) => (
                    <div key={index} className="flex flex-col gap-1 group cursor-default">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                                <span className="text-[11px] font-bold text-gray-700 truncate max-w-[120px]">{entry.name}</span>
                            </div>
                            <span className="text-[11px] font-black text-indigo-600 shrink-0">{entry.percent}</span>
                        </div>
                        <div className="w-full h-1 bg-white rounded-full overflow-hidden">
                            <div className="h-full transition-all duration-0" style={{ width: entry.percent, backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                        </div>
                    </div>
                    ))}
                </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
ChartCard.displayName = "ChartCard";

const TableCard = memo(({ widget, sheetData, className }: { widget: WidgetConfig; sheetData: any[], className?: string }) => {
  const aggregatedData = useMemo(() => computeAggregatedData(widget, sheetData), [widget, sheetData]);

  return (
    <Card className={cn("rounded-2xl border border-gray-100 shadow-lg bg-white overflow-hidden flex flex-col h-full min-h-[320px]", className)}>
      <CardHeader className="px-8 py-6 border-b border-gray-100 bg-white flex flex-row items-center justify-between shrink-0">
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 shrink-0">
            <TableIcon size={20} />
          </div>
          <div className="overflow-hidden">
            <CardTitle className="text-xl font-black text-gray-900 tracking-tight truncate">{widget.title || "Detalhamento Analítico"}</CardTitle>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider truncate">Agrupado por {widget.column_x}</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold text-gray-400">STATUS:</span>
            <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none px-3 font-bold">
              {aggregatedData.length} Itens Processados
            </Badge>
        </div>
      </CardHeader>
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-sm text-left relative">
          <thead className="bg-gray-50/50 text-gray-400 font-black uppercase text-[10px] tracking-[0.15em] border-b border-gray-100 sticky top-0 z-10 backdrop-blur-md">
            <tr>
              <th className="py-5 px-8">{widget.column_x || "Eixo X"}</th>
              <th className="py-5 px-8 text-right">{widget.column_y || "Resultado"}</th>
              <th className="py-5 px-8 text-center w-24">Proporção</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {aggregatedData.map((row, i) => (
              <tr key={i} className="hover:bg-indigo-50/20 transition-all group">
                <td className="py-5 px-8">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full transition-colors shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="font-bold text-gray-700">{row.name}</span>
                  </div>
                </td>
                <td className="py-5 px-8 text-right tabular-nums font-black text-gray-900">
                  {formatValue(row.value, widget.dataType)}
                </td>
                <td className="py-5 px-8">
                   <div className="flex items-center justify-center">
                        <Badge variant="outline" className="text-[10px] font-black border-gray-200 text-gray-400 group-hover:text-indigo-600 group-hover:border-indigo-100 group-hover:bg-indigo-50">
                            {row.percent}
                        </Badge>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
});
TableCard.displayName = "TableCard";

const TitleCard = memo(({ widget, className }: { widget: WidgetConfig; className?: string }) => {
  const SelectedIcon = widget.icon && TITLE_ICONS[widget.icon] ? TITLE_ICONS[widget.icon].icon : null;
  const justifyClass = widget.align === 'center' ? 'justify-center' : widget.align === 'right' ? 'justify-end' : 'justify-start';

  return (
    <div className={cn("w-full flex items-center py-6 bg-transparent h-full", justifyClass, className)}>
      <div className="flex items-center gap-4 max-w-full">
        {SelectedIcon && (
          <div className="flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm w-12 h-12 md:w-14 md:h-14 shrink-0">
            <SelectedIcon size={28} strokeWidth={2.5} />
          </div>
        )}
        <h2 className="font-black text-gray-900 tracking-tight text-3xl md:text-4xl truncate">
          {widget.title || "Novo Título"}
        </h2>
      </div>
    </div>
  );
});
TitleCard.displayName = "TitleCard";

const DividerCard = memo(({ widget, className }: { widget: WidgetConfig; className?: string }) => {
  return (
    <div className={cn("w-full flex flex-col items-center justify-center relative py-6 h-full min-h-[60px]", className)}>
      <div className="w-full absolute inset-0 flex items-center justify-center px-2 md:px-8">
         <div className="w-full border-t-2 border-dashed border-gray-200"></div>
      </div>
      {widget.title && (
        <span className="relative z-10 bg-[#FDFDFD] px-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          {widget.title}
        </span>
      )}
    </div>
  );
});
DividerCard.displayName = "DividerCard";

// ─────────────────────────────────────────────
// Export Modal with html-to-image + jsPDF
// ─────────────────────────────────────────────
const ExportModal = ({ isOpen, onClose, dashboardName }: { isOpen: boolean, onClose: () => void, dashboardName: string }) => {
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExportPDF = async () => {
    setIsExporting(true);
    
    const hideScrollbarsStyle = document.createElement('style');
    hideScrollbarsStyle.innerHTML = `
      *::-webkit-scrollbar { display: none !important; }
      * { -ms-overflow-style: none !important; scrollbar-width: none !important; }
      
      #dashboard-export-area .overflow-auto,
      #dashboard-export-area .overflow-y-auto,
      #dashboard-export-area .overflow-x-auto,
      #dashboard-export-area .custom-scrollbar {
        overflow: visible !important;
        max-height: none !important;
      }
    `;
    document.head.appendChild(hideScrollbarsStyle);

    try {
      const element = document.getElementById('dashboard-export-area');
      if (!element) throw new Error("Área de exportação não encontrada");

      await new Promise((resolve) => setTimeout(resolve, 800));

      const imgData = await toPng(element, {
        quality: 1,
        pixelRatio: 2, 
        backgroundColor: '#FDFDFD',
      });
      
      const canvasWidth = element.scrollWidth;
      const canvasHeight = element.scrollHeight;

      const pdf = new jsPDF({
        orientation: canvasWidth > canvasHeight ? 'landscape' : 'portrait',
        unit: 'px', 
        format: [canvasWidth, canvasHeight] 
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvasWidth, canvasHeight);

      const safeName = dashboardName.replace(/\s+/g, '_') || 'Dashboard';
      pdf.save(`${safeName}_Export.pdf`);
      
      toast.success("PDF gerado com sucesso!");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar PDF do Dashboard.");
    } finally {
      if (document.head.contains(hideScrollbarsStyle)) {
        document.head.removeChild(hideScrollbarsStyle);
      }
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={!isExporting ? onClose : undefined} className="absolute inset-0 bg-gray-900/40 backdrop-blur-md print:hidden" />
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden p-10 text-center print:hidden">
            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto mb-6">
                <FileText size={40} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Exportar Dados</h3>
            <p className="text-gray-500 text-sm mb-8 px-4">O relatório de <span className="text-indigo-600 font-bold">"{dashboardName}"</span> será gerado em página única.</p>
            
            <div className="grid grid-cols-1 gap-3">
                <button onClick={handleExportPDF} disabled={isExporting} className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all font-black shadow-xl shadow-indigo-100 disabled:opacity-70 disabled:cursor-not-allowed">
                    {isExporting ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                    {isExporting ? 'PROCESSANDO PDF...' : 'BAIXAR EM PDF'}
                </button>
                <button onClick={onClose} disabled={isExporting} className="w-full p-4 rounded-2xl text-gray-400 font-bold hover:text-gray-600 transition-all disabled:opacity-50">
                    FECHAR
                </button>
            </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function CustomDashboardViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [dashboard, setDashboard] = useState<any>(null);
  const [sheetDataMap, setSheetDataMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const { data: dbData, error: dbError } = await supabase.from('dashboard_data').select('*').eq('id', id).single();
        if (dbError) throw dbError;
        setDashboard(dbData);

        const widgets: WidgetConfig[] = dbData.widgets_config || [];
        const sheetIds = [...new Set(widgets.filter(w => w.type !== 'title' && w.type !== 'divider').map(w => w.spreadsheet_ref).filter(Boolean))];

        if (sheetIds.length > 0) {
          const { data: sheetsData, error: sheetsError } = await supabase.from('spreadsheet_data').select('id, dados').in('id', sheetIds);
          if (sheetsError) throw sheetsError;
          const map: Record<string, any[]> = {};
          sheetsData?.forEach(sheet => { map[sheet.id] = sheet.dados || []; });
          setSheetDataMap(map);
        }
      } catch (err: any) {
        toast.error("Erro na sincronização.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDashboard();
  }, [id]);

  const widgets: WidgetConfig[] = dashboard?.widgets_config || [];

  return (
    <div className="flex h-screen overflow-hidden bg-[#FDFDFD]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activeTab="dashboard-custom" onTabChange={() => {}} />

      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
        <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 px-8 py-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-5">
            <button className="lg:hidden p-2 bg-gray-50 rounded-xl" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <button onClick={() => router.push('/custom-dashboard')} className="p-2 text-gray-300 hover:text-indigo-600 transition-all border border-transparent hover:border-gray-100 rounded-xl"><ChevronLeft size={24} /></button>             
            <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">{dashboard?.nome}</h2>
                <div className="flex items-center gap-2 mt-2">
                    <Activity size={12} className="text-indigo-500" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{dashboard?.unidade || 'PROJETO CENTRAL63'}</span>
                </div>
            </div>
          </div>
          
          <button onClick={() => setIsExportModalOpen(true)} className="bg-blue-500 text-white px-6 py-3 rounded-2xl font-black hover:bg-blue-900 transition-all shadow-xl shadow-gray-200 flex items-center gap-2 text-sm">
            <Download size={18} />
            EXPORTAR
          </button>
        </header>

        <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} dashboardName={dashboard?.nome || ""} />

        <main id="dashboard-export-area" className="flex-1 p-8 md:p-12 max-w-[1800px] mx-auto w-full space-y-10 bg-[#FDFDFD]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-60">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                </div>
              </div>
              <p className="font-black text-gray-300 uppercase tracking-[0.3em] mt-6 text-xs">Mapeando Ecossistema...</p>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-700 pb-20">
              {widgets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                  <LayoutDashboard size={48} className="mb-4 text-gray-200" />
                  <p className="font-bold text-lg text-gray-500">Este dashboard não possui elementos.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 grid-flow-dense auto-rows-min">
                  {widgets.map((widget, idx) => {
                    const sizeClass = {
                      small: "col-span-1 row-span-1",
                      wide:  "col-span-1 md:col-span-2 xl:col-span-2 row-span-1",
                      tall:  "col-span-1 row-span-2",
                      large: "col-span-1 md:col-span-2 xl:col-span-2 row-span-2",
                      full:  "col-span-full row-span-1",
                    }[widget.size || "small"];

                    const sheetData = sheetDataMap[widget.spreadsheet_ref] || [];

                    if (widget.type === 'title') {
                      return <TitleCard key={idx} widget={widget} className={sizeClass} />;
                    }
                    
                    if (widget.type === 'divider') {
                      return <DividerCard key={idx} widget={widget} className={sizeClass} />;
                    }
                    
                    if (widget.type === 'value') {
                      const data = computeAggregatedData(widget, sheetData);
                      return (
                        <StatCard
                          key={idx}
                          title={widget.title}
                          value={formatValue(data[0]?.value || 0, widget.dataType)}
                          icon={Hash}
                          color={CHART_COLORS[idx % CHART_COLORS.length]}
                          aggregation={widget.aggregation}
                          className={sizeClass}
                        />
                      );
                    }
                    
                    if (['bar', 'line', 'pie'].includes(widget.type)) {
                      return <ChartCard key={idx} widget={widget} sheetData={sheetData} className={sizeClass} />;
                    }
                    
                    if (widget.type === 'table') {
                      return <TableCard key={idx} widget={widget} sheetData={sheetData} className={sizeClass} />;
                    }

                    return null;
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}