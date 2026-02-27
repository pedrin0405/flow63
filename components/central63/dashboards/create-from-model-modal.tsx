"use client";

import React, { useState, useEffect, useMemo, memo } from "react";
import {
  Dialog, DialogContent, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  BarChart3, LineChart, PieChart, Hash, Table as TableIcon, Save,
  Loader2, ArrowLeft, LayoutDashboard, Database, ArrowRight,
  Target, Zap, Star, Flame, TrendingUp, Users, Wallet, Briefcase
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart as ReLineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell
} from "recharts";

// ─────────────────────────────────────────────
// Types
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

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];
const STAT_COLORS = ['#4F46E5', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#06B6D4'];

function formatValue(value: number, type: DataType): string {
  if (type === "currency") return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  if (type === "number") return new Intl.NumberFormat('pt-BR').format(value);
  return value.toFixed(2);
}

function formatXAxis(value: any, type: DataType): string {
  if (type === "date" && value) {
    const date = new Date(value);
    return !isNaN(date.getTime()) ? date.toLocaleDateString('pt-BR') : value;
  }
  return value;
}

function computeAggregatedData(widget: WidgetConfig, sheetData: any[]): { name: string; value: number }[] {
  // Ignora componentes puramente visuais para evitar erros de cálculo
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
    const xVal = item[widget.column_x] || "N/A";
    let raw = item[widget.column_y];
    if (typeof raw === 'string') raw = raw.replace(/[R$\s.]/g, '').replace(',', '.');
    const yVal = parseFloat(raw) || 0;
    if (!groups[xVal]) groups[xVal] = [];
    groups[xVal].push(yVal);
  });

  return Object.keys(groups).slice(0, 12).map(key => {
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
}

// ─────────────────────────────────────────────
// Components based on indicators/page.tsx design
// ─────────────────────────────────────────────

const StatCard = memo(({ title, value, icon: Icon, color, subValue, className }: any) => (
  <div className={cn("bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden hover:translate-y-[-2px] transition-all h-full min-h-[140px] flex flex-col justify-center", className)}>
    <div className="relative z-10 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-500 text-sm font-medium truncate pr-2">{title}</span>
        <Icon className="w-5 h-5 flex-shrink-0" style={{ color }} />
      </div>
      <span className="text-3xl font-extrabold text-gray-900 truncate">{value}</span>
      {subValue && <span className="text-xs text-gray-400 mt-1 truncate">{subValue}</span>}
    </div>
    <div
      className="absolute bottom-[-20px] right-[-20px] w-24 h-24 rounded-full opacity-5 pointer-events-none"
      style={{ backgroundColor: color }}
    />
  </div>
));
StatCard.displayName = "StatCard";

const ChartCard = memo(({ widget, sheetData, className }: { widget: WidgetConfig; sheetData: any[], className?: string }) => {
  const aggregatedData = useMemo(() => computeAggregatedData(widget, sheetData), [widget, sheetData]);
  const Icon = widget.type === 'bar' ? BarChart3 : widget.type === 'line' ? LineChart : PieChart;

  return (
    <Card className={cn("rounded-2xl border-none shadow-sm flex flex-col h-full min-h-[320px]", className)}>
      <CardHeader className="border-b border-gray-50 pb-4 flex-shrink-0">
        <CardTitle className="text-gray-700 flex items-center gap-2 font-bold text-base truncate">
          <Icon className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          <span className="truncate">{widget.title || "Visualização de Dados"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-6 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          {widget.type === "bar" ? (
            <ReBarChart data={aggregatedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip formatter={(value: number) => [formatValue(value, widget.dataType), "Valor"]} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
            </ReBarChart>
          ) : widget.type === "line" ? (
            <ReLineChart data={aggregatedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip formatter={(value: number) => [formatValue(value, widget.dataType), "Valor"]} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </ReLineChart>
          ) : (
            <RePieChart>
              <Pie data={aggregatedData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5}>
                {aggregatedData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatValue(value, widget.dataType)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            </RePieChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});
ChartCard.displayName = "ChartCard";

const TableCard = memo(({ widget, sheetData, className }: { widget: WidgetConfig; sheetData: any[], className?: string }) => {
  const aggregatedData = useMemo(() => computeAggregatedData(widget, sheetData), [widget, sheetData]);

  return (
    <Card className={cn("rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden flex flex-col h-full min-h-[320px]", className)}>
      <CardHeader className="px-6 py-5 border-b border-gray-100 bg-white flex flex-row items-center justify-between flex-shrink-0">
        <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2 truncate">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 flex-shrink-0">
            <TableIcon size={18} />
          </div>
          <span className="truncate">{widget.title || "Tabela de Dados"}</span>
        </CardTitle>
      </CardHeader>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left relative">
          <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100 sticky top-0 z-10">
            <tr>
              <th className="py-4 px-6 font-semibold">{widget.column_x || "Categoria"}</th>
              <th className="py-4 px-6 text-right font-semibold">{widget.column_y || "Valor"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {aggregatedData.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors group">
                <td className="py-4 px-6 font-medium text-gray-900">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-indigo-500 transition-colors"></span>
                    {row.name}
                  </div>
                </td>
                <td className="py-4 px-6 text-right tabular-nums text-gray-600 group-hover:text-indigo-600 transition-colors">
                  {formatValue(row.value, widget.dataType)}
                </td>
              </tr>
            ))}
            {aggregatedData.length === 0 && (
              <tr>
                <td colSpan={2} className="py-8 text-center text-gray-400 font-medium">Nenhum dado encontrado para os filtros aplicados.</td>
              </tr>
            )}
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
      <div className="flex items-center gap-4">
        {SelectedIcon && (
          <div className="flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm w-12 h-12 md:w-14 md:h-14 flex-shrink-0">
            <SelectedIcon size={28} strokeWidth={2.5} />
          </div>
        )}
        <h2 className="font-black text-slate-800 tracking-tight text-3xl md:text-4xl truncate">
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
         <div className="w-full border-t-2 border-dashed border-slate-200"></div>
      </div>
      {widget.title && (
        <span className="relative z-10 bg-[#fafafa] px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          {widget.title}
        </span>
      )}
    </div>
  );
});
DividerCard.displayName = "DividerCard";


// ─────────────────────────────────────────────
// Main Creation Modal Component
// ─────────────────────────────────────────────
export function CreateDashboardFromModelModal({ isOpen, onClose, onSave, model }: any) {
  const [nome, setNome] = useState("");
  const [unidade, setUnidade] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Lista global de planilhas para mapeamento
  const [availableSheets, setAvailableSheets] = useState<any[]>([]);
  // Dicionário que mapeia o ID da planilha original do modelo -> ID da planilha selecionada agora
  const [sheetMapping, setSheetMapping] = useState<Record<string, string>>({});
  // Cache dos dados das planilhas selecionadas
  const [sheetDataMap, setSheetDataMap] = useState<Record<string, any[]>>({});

  // 1. Quando o modal abre, carrega todas as planilhas disponíveis e inicia o mapeamento padrão
  useEffect(() => {
    if (isOpen && model) {
      setNome(`${model.nome} (Criado)`);
      setUnidade(model.unidade || "");
      fetchAvailableSheets(model.widgets || []);
    } else {
      setAvailableSheets([]);
      setSheetMapping({});
      setSheetDataMap({});
    }
  }, [isOpen, model]);

  const fetchAvailableSheets = async (widgets: WidgetConfig[]) => {
    setIsLoading(true);
    try {
      // Baixa apenas metadados das planilhas (leve)
      const { data, error } = await supabase
        .from('spreadsheet_data')
        .select('id, nome_tabela, modelo_tabela');
        
      if (error) throw error;
      setAvailableSheets(data || []);
      
      // Identifica quais planilhas originais o modelo precisa (ignorando os widgets que não usam dados)
      const requiredSheetIds = [...new Set(widgets.filter(w => w.type !== 'title' && w.type !== 'divider').map(w => w.spreadsheet_ref).filter(Boolean))];
      const initialMapping: Record<string, string> = {};
      requiredSheetIds.forEach(id => {
        initialMapping[id] = id; // Por padrão, a planilha aponta pra si mesma
      });
      
      setSheetMapping(initialMapping);
    } catch (error: any) {
      toast.error("Erro ao carregar planilhas disponíveis: " + error.message);
      setIsLoading(false);
    }
  };

  // 2. Sempre que o mapeamento mudar (ou inicializar), baixar os dados completos das planilhas selecionadas
  useEffect(() => {
    const selectedIds = [...new Set(Object.values(sheetMapping))];
    if (selectedIds.length > 0) {
      fetchSheetData(selectedIds);
    } else {
      setSheetDataMap({});
      setIsLoading(false);
    }
  }, [sheetMapping]);

  const fetchSheetData = async (ids: string[]) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('spreadsheet_data')
        .select('id, dados')
        .in('id', ids);
        
      if (error) throw error;

      const map: Record<string, any[]> = {};
      data?.forEach(sheet => {
        map[sheet.id] = sheet.dados || [];
      });
      setSheetDataMap(map);
    } catch (error: any) {
      toast.error("Erro ao carregar os dados reais das planilhas: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Salvar o Dashboard Final
  const handleCreateDashboard = async () => {
    if (!nome.trim()) return toast.error("Por favor, dê um nome ao seu novo dashboard.");
    
    setIsSaving(true)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Usuário não autenticado.");
      }
      // Substitui as referências antigas (spreadsheet_ref) pelas novas que o usuário selecionou
      const updatedWidgets = (model.widgets || []).map((w: WidgetConfig) => ({
        ...w,
        spreadsheet_ref: (w.type !== 'title' && w.type !== 'divider') ? (sheetMapping[w.spreadsheet_ref] || w.spreadsheet_ref) : w.spreadsheet_ref
      }));

      // Cria a instância final do dashboard baseada no modelo e no novo mapeamento
      const { error } = await supabase.from('dashboard_data').insert([{
        nome,
        unidade,
        modelo_id: model.id,
        widgets_config: updatedWidgets,
        criado_por: user.id, // Substitua pelo usuário real se tiver autenticação
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;

      toast.success("Dashboard gerado com sucesso!");
      if (onSave) onSave();
      onClose();
    } catch (error: any) {
      toast.error("Erro ao gerar dashboard: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!model) return null;

  const widgets: WidgetConfig[] = model.widgets || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[100vw] w-full h-[100vh] flex flex-col p-0 gap-0 border-none rounded-none bg-[#fafafa] overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* ── Header ── */}
        <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 lg:px-8 py-4 flex items-center justify-between shadow-sm flex-shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100 text-slate-500">
              <ArrowLeft size={20} />
            </Button>
            <div className="hidden sm:flex items-center gap-3 border-r border-slate-200 pr-4">
              <LayoutDashboard className="text-indigo-600" size={24} />
              <div>
                <DialogTitle className="text-sm font-bold text-gray-900 tracking-tight leading-none">
                  Gerar Dashboard
                </DialogTitle>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">Baseado no modelo: {model.nome}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-2">
              <Input
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Nome do Dashboard Final..."
                className="h-9 w-64 bg-slate-50 border-slate-200 rounded-xl font-bold focus-visible:ring-indigo-500"
              />
              <Input
                value={unidade}
                onChange={e => setUnidade(e.target.value)}
                placeholder="Unidade..."
                className="h-9 w-32 bg-slate-50 border-slate-200 rounded-xl font-bold focus-visible:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold text-slate-500">Cancelar</Button>
            <Button
              onClick={handleCreateDashboard}
              disabled={isSaving || isLoading}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 gap-2 h-10 px-6 transition-all"
            >
              {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
              {isSaving ? "Gerando..." : "Confirmar e Gerar Dashboard"}
            </Button>
          </div>
        </header>

        {/* ── Mapping Bar (Planilha A -> Planilha B) ── */}
        {Object.keys(sheetMapping).length > 0 && (
          <div className="bg-indigo-50/50 border-b border-indigo-100 px-4 lg:px-8 py-3 flex flex-wrap items-center gap-4 flex-shrink-0 z-20">
            <div className="flex items-center gap-1.5 text-indigo-600">
              <Database size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Fontes de Dados</span>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {Object.keys(sheetMapping).map(origId => {
                const origSheet = availableSheets.find(s => s.id === origId);
                const modelo = origSheet?.modelo_tabela || 'Desconhecido';
                
                // Filtra as opções mantendo apenas tabelas que têm EXATAMENTE o mesmo modelo que a tabela original
                const compatibleSheets = origSheet 
                  ? availableSheets.filter(s => s.modelo_tabela === modelo) 
                  : [];
                
                return (
                  <div key={origId} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500 truncate max-w-[140px]" title={`Tabela Original: ${origSheet?.nome_tabela || 'Desconhecida'}`}>
                      {origSheet?.nome_tabela || 'Planilha Excluída'}
                    </span>
                    <ArrowRight size={12} className="text-indigo-300" />
                    <Select 
                      value={sheetMapping[origId]} 
                      onValueChange={(val) => setSheetMapping({...sheetMapping, [origId]: val})}
                    >
                      <SelectTrigger className="h-6 text-xs border-0 bg-transparent shadow-none focus:ring-0 p-0 font-bold text-indigo-600 gap-1 w-auto">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {compatibleSheets.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.nome_tabela}</SelectItem>
                        ))}
                        {compatibleSheets.length === 0 && (
                          <SelectItem value={origId} disabled>Nenhuma compatível encontrada</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Body: Live Dashboard Preview ── */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
              <Loader2 size={32} className="animate-spin text-indigo-500" />
              <p className="font-bold tracking-wide">Compilando dados para visualização...</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
              {widgets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                  <LayoutDashboard size={48} className="mb-4 text-slate-200" />
                  <p className="font-bold text-lg text-slate-500">Este modelo está vazio.</p>
                  <p className="text-sm mt-1">Adicione elementos no construtor de modelos antes de gerar um dashboard.</p>
                </div>
              ) : (
                /* GRID UNIFICADO: 3 Colunas como no construtor. Isso resolve o problema de espaçamento! */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 grid-flow-dense">
                  {widgets.map((widget, idx) => {
                    // Mapeia o tamanho escolhido para col-span e row-span baseando-se no layout de 3 colunas (xl:grid-cols-3)
                    const sizeClass = {
                      small: "col-span-1 row-span-1",
                      wide:  "col-span-1 md:col-span-2 xl:col-span-2 row-span-1",
                      tall:  "col-span-1 row-span-2",
                      large: "col-span-1 md:col-span-2 xl:col-span-2 row-span-2",
                      full:  "col-span-full row-span-1",
                    }[widget.size || "small"];

                    // Pega o ID referenciado atualizado (caso o usuário tenha trocado o select no topo)
                    const mappedId = sheetMapping[widget.spreadsheet_ref] || widget.spreadsheet_ref;
                    const sheetData = sheetDataMap[mappedId] || [];

                    // Renderiza o componente adequado baseado no tipo
                    if (widget.type === 'title') {
                      return <TitleCard key={idx} widget={widget} className={sizeClass} />;
                    }
                    
                    if (widget.type === 'divider') {
                      return <DividerCard key={idx} widget={widget} className={sizeClass} />;
                    }
                    
                    if (widget.type === 'value') {
                      const data = computeAggregatedData(widget, sheetData);
                      const val = data[0]?.value || 0;
                      return (
                        <div key={idx} className={sizeClass}>
                          <StatCard
                            title={widget.title || 'Métrica'}
                            value={formatValue(val, widget.dataType)}
                            icon={Hash}
                            color={STAT_COLORS[idx % STAT_COLORS.length]}
                            subValue={widget.aggregation === 'sum' ? 'Soma Total' : widget.aggregation === 'count' ? 'Contagem' : 'Valor'}
                          />
                        </div>
                      );
                    }
                    
                    if (['bar', 'line', 'pie'].includes(widget.type)) {
                      return (
                        <div key={idx} className={sizeClass}>
                          <ChartCard widget={widget} sheetData={sheetData} />
                        </div>
                      );
                    }
                    
                    if (widget.type === 'table') {
                      return (
                        <div key={idx} className={sizeClass}>
                          <TableCard widget={widget} sheetData={sheetData} />
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}