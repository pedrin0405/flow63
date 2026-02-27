'use client';

import React, { useEffect, useState, useMemo, memo } from 'react';
import { Sidebar } from "@/components/central63/sidebar";
import { 
  Menu, Download, X, BarChart3, LineChart, PieChart, 
  Hash, Table as TableIcon, LayoutDashboard, Database,
  FileImage, FileText, ChevronLeft, Loader2, Info, TrendingUp,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ResponsiveContainer, BarChart as ReBarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart as ReLineChart, Line,
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
  type: "bar" | "line" | "pie" | "value" | "table";
  spreadsheet_ref: string;
  column_x: string;
  column_y: string;
  time_column: string;
  aggregation: "sum" | "avg" | "count" | "max" | "min";
  dataType: DataType;
  filters: WidgetFilter[];
}

const CHART_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

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

const StatCard = ({ title, value, icon: Icon, color, aggregation }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 relative overflow-hidden transition-all hover:shadow-lg hover:border-indigo-100 group">
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-indigo-50 transition-colors">
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <Badge variant="secondary" className="text-[10px] font-bold bg-indigo-50 text-indigo-600 border-none">
          {AGGREGATION_LABELS[aggregation]}
        </Badge>
      </div>
      <h3 className="text-gray-500 text-sm font-bold mb-1 truncate">{title}</h3>
      <span className="text-3xl font-black text-gray-900 tracking-tight">{value}</span>
      <div className="mt-4 flex items-center gap-2">
        <div className="flex -space-x-1">
          <div className="w-1.5 h-4 bg-indigo-500 rounded-full animate-pulse" />
          <div className="w-1.5 h-4 bg-indigo-300 rounded-full delay-75" />
          <div className="w-1.5 h-4 bg-indigo-100 rounded-full delay-150" />
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tempo Real</span>
      </div>
    </div>
    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 z-0 opacity-20 group-hover:opacity-40 transition-opacity" />
  </div>
);

const ChartCard = memo(({ widget, sheetData }: { widget: WidgetConfig; sheetData: any[] }) => {
  const aggregatedData = useMemo(() => computeAggregatedData(widget, sheetData), [widget, sheetData]);
  const Icon = widget.type === 'bar' ? BarChart3 : widget.type === 'line' ? LineChart : PieChart;

  return (
    <Card className="rounded-2xl border border-gray-100 shadow-md flex flex-col h-fit lg:h-[520px] bg-white overflow-hidden">
      <CardHeader className="border-b border-gray-50 p-6 shrink-0 bg-gray-50/30">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white shadow-sm rounded-xl text-indigo-600">
              <Icon size={20} />
            </div>
            <div>
              <CardTitle className="text-gray-800 font-black text-lg tracking-tight">{widget.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[9px] uppercase font-bold text-gray-400 border-gray-200">
                  {widget.column_x}
                </Badge>
                <span className="text-gray-300">/</span>
                <Badge variant="outline" className="text-[9px] uppercase font-bold text-indigo-500 border-indigo-100 bg-indigo-50/30">
                  {AGGREGATION_LABELS[widget.aggregation]}
                </Badge>
              </div>
            </div>
          </div>
          <button className="text-gray-300 hover:text-indigo-500 transition-colors"><Info size={18} /></button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-6 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {widget.type === "bar" ? (
              <ReBarChart data={aggregatedData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-gray-900 text-white p-3 shadow-2xl rounded-xl border-none">
                          <p className="text-[10px] font-bold opacity-60 uppercase mb-1">{payload[0].payload.name}</p>
                          <p className="text-sm font-black">{formatValue(payload[0].value as number, widget.dataType)}</p>
                          <p className="text-[9px] text-indigo-400 font-bold mt-1">{payload[0].payload.percent} do total</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" fill="#4F46E5" radius={[6, 6, 0, 0]} barSize={35}>
                    <LabelList dataKey="percent" position="top" style={{ fontSize: '10px', fill: '#94a3b8', fontWeight: 'bold' }} />
                </Bar>
              </ReBarChart>
            ) : widget.type === "line" ? (
              <ReLineChart data={aggregatedData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip 
                   content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-indigo-600 text-white p-3 shadow-2xl rounded-xl">
                          <p className="text-[10px] font-bold opacity-70 uppercase">{payload[0].payload.name}</p>
                          <p className="text-lg font-black">{formatValue(payload[0].value as number, widget.dataType)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={4} dot={{ r: 6, fill: '#4F46E5', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
              </ReLineChart>
            ) : (
              <RePieChart>
                <Pie data={aggregatedData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5}>
                  {aggregatedData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="#fff" strokeWidth={3} />
                  ))}
                </Pie>
                <Tooltip 
                   content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-4 shadow-2xl border border-gray-100 rounded-2xl">
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

        {/* LEGENDA ENRIQUECIDA */}
        {widget.type === 'pie' && (
          <div className="lg:w-64 flex flex-col justify-center gap-3 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
            <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Composição de Dados</p>
                <div className="space-y-3">
                    {aggregatedData.map((entry, index) => (
                    <div key={index} className="flex flex-col gap-1 group cursor-default">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                                <span className="text-[11px] font-bold text-gray-700 truncate">{entry.name}</span>
                            </div>
                            <span className="text-[11px] font-black text-indigo-600">{entry.percent}</span>
                        </div>
                        <div className="w-full h-1 bg-white rounded-full overflow-hidden">
                            <div className="h-full transition-all duration-1000" style={{ width: entry.percent, backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
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

const TableCard = memo(({ widget, sheetData }: { widget: WidgetConfig; sheetData: any[] }) => {
  const aggregatedData = useMemo(() => computeAggregatedData(widget, sheetData), [widget, sheetData]);

  return (
    <Card className="rounded-2xl border border-gray-100 shadow-lg bg-white overflow-hidden">
      <CardHeader className="px-8 py-6 border-b border-gray-100 bg-white flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
            <TableIcon size={20} />
          </div>
          <div>
            <CardTitle className="text-xl font-black text-gray-900 tracking-tight">Detalhamento Analítico</CardTitle>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Agrupado por {widget.column_x}</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400">STATUS:</span>
            <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none px-3 font-bold">
              {aggregatedData.length} Itens Processados
            </Badge>
        </div>
      </CardHeader>
      <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
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
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-200 group-hover:bg-indigo-500 transition-colors" />
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

// ─────────────────────────────────────────────
// Export Modal
// ─────────────────────────────────────────────
const ExportModal = ({ isOpen, onClose, dashboardName }: { isOpen: boolean, onClose: () => void, dashboardName: string }) => {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-gray-900/40 backdrop-blur-md print:hidden" />
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden p-10 print:hidden text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto mb-6">
                <FileText size={40} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Exportar Dados</h3>
            <p className="text-gray-500 text-sm mb-8 px-4">O relatório de <span className="text-indigo-600 font-bold">"{dashboardName}"</span> será gerado com base nas visualizações atuais.</p>
            
            <div className="grid grid-cols-1 gap-3">
                <button onClick={() => window.print()} className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all font-black shadow-xl shadow-indigo-100">
                    <Download size={20} />
                    BAIXAR EM PDF
                </button>
                <button onClick={onClose} className="w-full p-4 rounded-2xl text-gray-400 font-bold hover:text-gray-600 transition-all">
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
        const sheetIds = [...new Set(widgets.map(w => w.spreadsheet_ref).filter(Boolean))];

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
  const valueWidgets = widgets.filter(w => w.type === 'value');
  const chartWidgets = widgets.filter(w => ['bar', 'line', 'pie'].includes(w.type));
  const tableWidgets = widgets.filter(w => w.type === 'table');

  return (
    <div className="flex h-screen overflow-hidden bg-[#FDFDFD] print:bg-white print:h-auto">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activeTab="dashboard-custom" onTabChange={() => {}} />

      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
        <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 px-8 py-5 flex items-center justify-between shadow-sm print:hidden">
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

        <main className="flex-1 p-8 md:p-12 max-w-[1800px] mx-auto w-full space-y-10">
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
            <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700 pb-20">
              
              {/* KPIs */}
              {valueWidgets.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {valueWidgets.map((widget, idx) => {
                    const data = computeAggregatedData(widget, sheetDataMap[widget.spreadsheet_ref] || []);
                    return (
                      <StatCard
                        key={idx}
                        title={widget.title}
                        value={formatValue(data[0]?.value || 0, widget.dataType)}
                        icon={Hash}
                        color={CHART_COLORS[idx % CHART_COLORS.length]}
                        aggregation={widget.aggregation}
                      />
                    );
                  })}
                </div>
              )}

              {/* Graficos Principais */}
              {chartWidgets.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {chartWidgets.map((widget, idx) => (
                    <ChartCard key={idx} widget={widget} sheetData={sheetDataMap[widget.spreadsheet_ref] || []} />
                  ))}
                </div>
              )}

              {/* Tabelas de Dados */}
              {tableWidgets.length > 0 && (
                <div className="grid grid-cols-1">
                  <TableCard widget={tableWidgets[0]} sheetData={sheetDataMap[tableWidgets[0].spreadsheet_ref] || []} />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}