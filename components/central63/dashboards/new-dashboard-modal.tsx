"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  BarChart3, Plus, ArrowLeft, LayoutTemplate, Trash2, Save, 
  Loader2, Database, Settings2, LineChart, PieChart, Sigma, Type, Calendar as CalendarIcon, Coins, Filter, Clock, Hash, Table as TableIcon
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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

export function NewDashboardModal({ isOpen, onClose, onSave }: any) {
  const [view, setView] = useState<"gallery" | "form">("gallery");
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [availableSpreadsheets, setAvailableSpreadsheets] = useState<any[]>([]);
  
  const [nome, setNome] = useState("");
  const [unidade, setUnidade] = useState("");
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#f59e0b'];

  useEffect(() => {
    if (isOpen) {
      fetchDashboardModels();
      fetchAvailableSpreadsheets();
      setView("gallery");
    }
  }, [isOpen]);

  const fetchDashboardModels = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('dashboard_models')
      .select('*')
      .order('updated_at', { ascending: false });
    if (data) setModels(data);
    setIsLoading(false);
  };

  const fetchAvailableSpreadsheets = async () => {
    const { data } = await supabase
      .from('spreadsheet_data')
      .select('id, nome_tabela, modelo_tabela, unidade, dados');
    if (data) setAvailableSpreadsheets(data);
  };

  const spreadsheetColumnsMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    availableSpreadsheets.forEach(sheet => {
      if (sheet.dados && sheet.dados.length > 0) {
        map[sheet.id] = Object.keys(sheet.dados[0]);
      }
    });
    return map;
  }, [availableSpreadsheets]);

  const addWidget = () => {
    setWidgets([...widgets, { 
      title: "", 
      type: "bar", 
      spreadsheet_ref: "", 
      column_x: "", 
      column_y: "",
      time_column: "",
      aggregation: "sum",
      dataType: "number",
      filters: []
    }]);
  };

  const updateWidget = (index: number, updates: Partial<WidgetConfig>) => {
    const newWidgets = [...widgets];
    newWidgets[index] = { ...newWidgets[index], ...updates };
    setWidgets(newWidgets);
  };

  const addFilter = (index: number) => {
    const newWidgets = [...widgets];
    newWidgets[index].filters.push({
      type: "include",
      field: "",
      condition: "equal",
      value: ""
    });
    setWidgets(newWidgets);
  };

  const updateFilter = (widgetIndex: number, filterIndex: number, field: keyof WidgetFilter, value: string) => {
    const newWidgets = [...widgets];
    newWidgets[widgetIndex].filters[filterIndex] = {
      ...newWidgets[widgetIndex].filters[filterIndex],
      [field]: value
    };
    setWidgets(newWidgets);
  };

  const removeFilter = (widgetIndex: number, filterIndex: number) => {
    const newWidgets = [...widgets];
    newWidgets[widgetIndex].filters = newWidgets[widgetIndex].filters.filter((_, i) => i !== filterIndex);
    setWidgets(newWidgets);
  };

  const removeWidget = (index: number) => {
    setWidgets(widgets.filter((_, i) => i !== index));
  };

  const handleSaveModel = async () => {
    if (!nome) return toast.error("Nome do dashboard é obrigatório");
    if (widgets.length === 0) return toast.error("Adicione pelo menos um gráfico");
    const { error } = await supabase.from('dashboard_models').insert([{ nome, unidade, widgets, updated_at: new Date().toISOString() }]);
    if (!error) { toast.success("Dashboard criado!"); fetchDashboardModels(); setView("gallery"); if (onSave) onSave(); }
  };

  const formatValue = (value: number, type: DataType) => {
    if (type === "currency") return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    if (type === "number") return new Intl.NumberFormat('pt-BR').format(value);
    return value.toFixed(2);
  };

  const formatXAxis = (value: any, type: DataType) => {
    if (type === "date" && value) {
      const date = new Date(value);
      return !isNaN(date.getTime()) ? date.toLocaleDateString('pt-BR') : value;
    }
    return value;
  };

  const WidgetPreview = ({ widget }: { widget: WidgetConfig }) => {
    const sheet = availableSpreadsheets.find(s => s.id === widget.spreadsheet_ref);
    if (!sheet || (widget.type !== 'value' && !widget.column_x) || !widget.column_y) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center text-slate-300 gap-3 border-2 border-dashed rounded-2xl bg-slate-50/50">
          <BarChart3 size={36} className="text-slate-200" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Aguardando Configuração</p>
        </div>
      );
    }

    const aggregatedData = useMemo(() => {
        let filteredData = [...sheet.dados];
        if (widget.filters?.length > 0) {
          filteredData = filteredData.filter(item => {
            return widget.filters.every(f => {
              if (!f.field) return true;
              const val = String(item[f.field] || "").toLowerCase();
              const filterVal = String(f.value || "").toLowerCase();
              let match = false;
              switch(f.condition) {
                case "equal": match = val === filterVal; break;
                case "contains": match = val.includes(filterVal); break;
                case "starts_with": match = val.startsWith(filterVal); break;
                case "null": match = !item[f.field] || item[f.field] === ""; break;
              }
              return f.type === "include" ? match : !match;
            });
          });
        }

        if (widget.type === "value") {
          const values = filteredData.map(item => {
            let v = item[widget.column_y];
            if (typeof v === 'string') v = v.replace(/[R$\s.]/g, '').replace(',', '.');
            return parseFloat(v) || 0;
          });
          
          let total = 0;
          switch(widget.aggregation) {
            case "avg": total = values.reduce((a, b) => a + b, 0) / (values.length || 1); break;
            case "count": total = values.length; break;
            case "max": total = Math.max(...values, 0); break;
            case "min": total = Math.min(...values, 0); break;
            default: total = values.reduce((a, b) => a + b, 0);
          }
          return [{ name: "Total", value: total }];
        }

        const groups: Record<string, number[]> = {};
        filteredData.forEach((item: any) => {
            const xVal = item[widget.column_x] || "N/A";
            let yValRaw = item[widget.column_y];
            if (typeof yValRaw === 'string') yValRaw = yValRaw.replace(/[R$\s.]/g, '').replace(',', '.');
            const yVal = parseFloat(yValRaw) || 0;
            if (!groups[xVal]) groups[xVal] = [];
            groups[xVal].push(yVal);
        });

        return Object.keys(groups).slice(0, 12).map(key => {
            const values = groups[key];
            let result = 0;
            switch(widget.aggregation) {
                case "avg": result = values.reduce((a, b) => a + b, 0) / values.length; break;
                case "count": result = values.length; break;
                case "max": result = Math.max(...values); break;
                case "min": result = Math.min(...values); break;
                default: result = values.reduce((a, b) => a + b, 0);
            }
            return { name: formatXAxis(key, widget.dataType), value: result };
        });
    }, [sheet.dados, widget.column_x, widget.column_y, widget.aggregation, widget.dataType, widget.filters, widget.type]);

    if (widget.type === "value") {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-white rounded-2xl p-6 text-center">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2">{widget.title || "Valor Total"}</p>
          <h2 className="text-4xl font-black text-indigo-600 tracking-tighter">
            {formatValue(aggregatedData[0]?.value || 0, widget.dataType)}
          </h2>
          <div className="mt-3 px-3 py-1 bg-indigo-50 rounded-full text-[10px] font-bold text-indigo-500 uppercase tracking-wide">
            {widget.aggregation === 'sum' ? 'Soma' : widget.aggregation === 'avg' ? 'Média' : 'Métrica'} acumulada
          </div>
        </div>
      );
    }

    if (widget.type === "table") {
      return (
        <div className="h-full w-full flex flex-col bg-white rounded-2xl overflow-hidden">
          <div className="p-3 border-b bg-slate-50/50 flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{widget.title || "Tabela de Dados"}</span>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white shadow-sm">
                <tr>
                  <th className="p-2 text-[10px] font-black uppercase text-slate-400 border-b">{widget.column_x}</th>
                  <th className="p-2 text-[10px] font-black uppercase text-slate-400 border-b text-right">{widget.column_y}</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedData.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors">
                    <td className="p-2 text-xs font-medium text-slate-600">{row.name}</td>
                    <td className="p-2 text-xs font-bold text-slate-900 text-right">{formatValue(row.value, widget.dataType)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full w-full p-4 flex flex-col bg-white rounded-2xl">
        <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-slate-800 tracking-tight text-sm">{widget.title || "Visualização"}</h4>
            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                {widget.type === 'bar' ? <BarChart3 size={16}/> : widget.type === 'line' ? <LineChart size={16}/> : <PieChart size={16}/>}
            </div>
        </div>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            {widget.type === "bar" ? (
              <ReBarChart data={aggregatedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip formatter={(value: number) => [formatValue(value, widget.dataType), "Valor"]} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={28} />
              </ReBarChart>
            ) : widget.type === "line" ? (
              <ReLineChart data={aggregatedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip formatter={(value: number) => [formatValue(value, widget.dataType), "Valor"]} />
                <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
              </ReLineChart>
            ) : (
              <RePieChart>
                <Pie data={aggregatedData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={5}>
                  {aggregatedData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(value: number) => formatValue(value, widget.dataType)} />
              </RePieChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[96vw] w-full h-[92vh] md:h-[88vh] flex flex-col p-0 gap-0 border-none shadow-2xl rounded-2xl overflow-hidden bg-slate-50"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* Header */}
        <DialogHeader className="px-5 py-3 border-b bg-white flex-shrink-0 z-[60] shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md"><BarChart3 className="h-5 w-5" /></div>
              <DialogTitle className="text-lg font-black tracking-tight text-slate-800">
                {view === "gallery" ? "Modelos de Dashboard" : "Configurar Widgets"}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              {view === "gallery" ? (
                <Button onClick={() => setView("form")} className="rounded-xl h-9 px-4 text-sm bg-indigo-600 hover:bg-indigo-700 shadow-md">
                  <Plus className="mr-1.5 h-4 w-4" /> Novo Modelo
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => setView("gallery")} className="rounded-xl h-9 text-sm font-bold text-slate-500 hover:bg-slate-100">
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar para Galeria
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {view === "gallery" ? (
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {models.map((model) => (
                  <div key={model.id} className="group bg-white rounded-2xl p-5 shadow-sm ring-1 ring-slate-100 flex flex-col">
                    <LayoutTemplate className="h-7 w-7 text-slate-300 mb-4" />
                    <h3 className="font-black text-base mb-4 truncate">{model.nome}</h3>
                    <Button className="mt-auto bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl h-10 border-0 text-sm">
                      Usar Layout
                    </Button>
                  </div>
                ))}
                <div onClick={() => setView("form")} className="border-2 border-dashed border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 text-slate-400 hover:bg-white hover:border-indigo-500/50 hover:text-indigo-600 cursor-pointer transition-all min-h-[180px]">
                  <Plus size={36} strokeWidth={1} />
                  <span className="font-black uppercase tracking-widest text-xs">Criar do Zero</span>
                </div>
              </div>
            </div>
          ) : (
            <main className="p-4 md:p-6">
              <div className="max-w-[1400px] mx-auto space-y-5 pb-16">

                {/* Dashboard info */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border-0 shadow-sm ring-1 ring-slate-100">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em] ml-0.5">Título do Painel</Label>
                    <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Vendas 2026" className="h-10 rounded-xl border-slate-100 bg-slate-50/50 font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em] ml-0.5">Unidade</Label>
                    <Input value={unidade} onChange={e => setUnidade(e.target.value)} placeholder="Ex: Comercial" className="h-10 rounded-xl border-slate-100 bg-slate-50/50 font-bold" />
                  </div>
                </section>

                {/* Widgets section */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-base font-black tracking-tight text-slate-800">Configuração de Widgets</h3>
                    <Button onClick={addWidget} className="rounded-xl gap-1.5 h-9 px-4 text-sm bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 shadow-sm font-bold">
                      <Plus size={16} /> Adicionar Gráfico
                    </Button>
                  </div>

                  <div className="grid gap-5">
                    {widgets.map((widget, index) => (
                      <div key={index} className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 overflow-hidden">
                        <div className="flex flex-col lg:flex-row">

                          {/* Config panel */}
                          <div className="lg:w-1/2 p-5 lg:p-6 space-y-5 border-r border-slate-50">
                            <div className="flex justify-between items-center">
                                <h5 className="font-black text-base text-slate-800">Configuração do Indicador</h5>
                                <Button variant="ghost" size="icon" onClick={() => removeWidget(index)} className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                                    <Trash2 size={18} />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {/* Widget title */}
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Título do Widget</Label>
                                    <Input value={widget.title} onChange={e => updateWidget(index, { title: e.target.value })} className="h-10 bg-slate-50/50 rounded-xl font-bold border-slate-100" />
                                </div>

                                {/* Viz type */}
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tipo de Visualização</Label>
                                    <div className="grid grid-cols-5 gap-1.5">
                                        <Button variant="outline" onClick={() => updateWidget(index, { type: 'bar' })} className={cn("h-12 rounded-xl flex-col gap-0.5 text-[9px] font-bold", widget.type === 'bar' && "bg-indigo-600 text-white border-indigo-600 shadow-md")}><BarChart3 size={16}/>Barra</Button>
                                        <Button variant="outline" onClick={() => updateWidget(index, { type: 'line' })} className={cn("h-12 rounded-xl flex-col gap-0.5 text-[9px] font-bold", widget.type === 'line' && "bg-indigo-600 text-white border-indigo-600 shadow-md")}><LineChart size={16}/>Linha</Button>
                                        <Button variant="outline" onClick={() => updateWidget(index, { type: 'pie' })} className={cn("h-12 rounded-xl flex-col gap-0.5 text-[9px] font-bold", widget.type === 'pie' && "bg-indigo-600 text-white border-indigo-600 shadow-md")}><PieChart size={16}/>Pizza</Button>
                                        <Button variant="outline" onClick={() => updateWidget(index, { type: 'value' })} className={cn("h-12 rounded-xl flex-col gap-0.5 text-[9px] font-bold", widget.type === 'value' && "bg-indigo-600 text-white border-indigo-600 shadow-md")}><Hash size={16}/>Valor</Button>
                                        <Button variant="outline" onClick={() => updateWidget(index, { type: 'table' })} className={cn("h-12 rounded-xl flex-col gap-0.5 text-[9px] font-bold", widget.type === 'table' && "bg-indigo-600 text-white border-indigo-600 shadow-md")}><TableIcon size={16}/>Tabela</Button>
                                    </div>
                                </div>

                                {/* Data source */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2 space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-1.5"><Database size={11}/> Planilha de Referência</Label>
                                        <Select value={widget.spreadsheet_ref} onValueChange={(v) => updateWidget(index, { spreadsheet_ref: v, column_x: '', column_y: '', time_column: '' })}>
                                            <SelectTrigger className="h-10 bg-white rounded-xl font-bold border-slate-100"><SelectValue placeholder="Selecione a fonte..." /></SelectTrigger>
                                            <SelectContent className="z-[100] rounded-xl">
                                                {availableSpreadsheets.map((s) => (<SelectItem key={s.id} value={s.id}>{s.nome_tabela || s.modelo_tabela}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Eixo X (Categorias)</Label>
                                        <Select value={widget.column_x} onValueChange={(v) => updateWidget(index, { column_x: v })} disabled={!widget.spreadsheet_ref || widget.type === 'value'}>
                                            <SelectTrigger className="h-10 bg-white rounded-xl text-xs font-bold border-slate-100"><SelectValue placeholder="Coluna..." /></SelectTrigger>
                                            <SelectContent className="z-[100] rounded-xl">
                                                {(spreadsheetColumnsMap[widget.spreadsheet_ref] || []).map((col) => (<SelectItem key={col} value={col}>{col}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Eixo Y (Valores)</Label>
                                        <Select value={widget.column_y} onValueChange={(v) => updateWidget(index, { column_y: v })} disabled={!widget.spreadsheet_ref}>
                                            <SelectTrigger className="h-10 bg-white rounded-xl text-xs font-bold border-slate-100"><SelectValue placeholder="Coluna..." /></SelectTrigger>
                                            <SelectContent className="z-[100] rounded-xl">
                                                {(spreadsheetColumnsMap[widget.spreadsheet_ref] || []).map((col) => (<SelectItem key={col} value={col}>{col}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5 col-span-2">
                                        <Label className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-1.5"><Clock size={11}/> Período (Coluna de Tempo)</Label>
                                        <Select value={widget.time_column} onValueChange={(v) => updateWidget(index, { time_column: v })} disabled={!widget.spreadsheet_ref}>
                                            <SelectTrigger className="h-10 bg-white rounded-xl text-xs font-bold border-slate-100"><SelectValue placeholder="Selecione a coluna de data/hora..." /></SelectTrigger>
                                            <SelectContent className="z-[100] rounded-xl">
                                                {(spreadsheetColumnsMap[widget.spreadsheet_ref] || []).map((col) => (<SelectItem key={col} value={col}>{col}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><Sigma size={11}/> Agregação</Label>
                                        <Select value={widget.aggregation} onValueChange={(v) => updateWidget(index, { aggregation: v as any })} disabled={!widget.spreadsheet_ref}>
                                            <SelectTrigger className="h-10 bg-white rounded-xl text-xs font-bold border-slate-100"><SelectValue /></SelectTrigger>
                                            <SelectContent className="z-[100] rounded-xl">
                                                <SelectItem value="sum">Soma</SelectItem><SelectItem value="avg">Média</SelectItem><SelectItem value="count">Contagem</SelectItem><SelectItem value="max">Máximo</SelectItem><SelectItem value="min">Mínimo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><Type size={11}/> Formato</Label>
                                        <Select value={widget.dataType} onValueChange={(v) => updateWidget(index, { dataType: v as any })}>
                                            <SelectTrigger className="h-10 bg-white rounded-xl text-xs font-bold border-slate-100"><SelectValue /></SelectTrigger>
                                            <SelectContent className="z-[100] rounded-xl">
                                                <SelectItem value="text">Texto</SelectItem><SelectItem value="number">Número</SelectItem><SelectItem value="date">Data</SelectItem><SelectItem value="currency">Moeda (R$)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Filters */}
                                <div className="space-y-3 pt-3 border-t border-slate-100">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-1.5"><Filter size={11}/> Filtros de Dados</Label>
                                    <Button variant="outline" size="sm" onClick={() => addFilter(index)} className="h-7 rounded-lg text-[10px] font-bold border-indigo-100 text-indigo-600 px-2.5"><Plus size={11} className="mr-1"/> Add Filtro</Button>
                                  </div>
                                  <div className="space-y-2">
                                    {widget.filters.map((filter, fIndex) => (
                                      <div key={fIndex} className="p-3 bg-slate-50 rounded-xl grid grid-cols-12 gap-2 items-end ring-1 ring-slate-100 border-0 shadow-sm">
                                        <div className="col-span-3">
                                          <Select value={filter.type} onValueChange={(v) => updateFilter(index, fIndex, 'type', v as any)}>
                                            <SelectTrigger className="h-8 bg-white text-[10px] rounded-lg border-0 shadow-sm"><SelectValue /></SelectTrigger>
                                            <SelectContent className="z-[100]"><SelectItem value="include">Incluir</SelectItem><SelectItem value="exclude">Excluir</SelectItem></SelectContent>
                                          </Select>
                                        </div>
                                        <div className="col-span-3">
                                          <Select value={filter.field} onValueChange={(v) => updateFilter(index, fIndex, 'field', v)}>
                                            <SelectTrigger className="h-8 bg-white text-[10px] rounded-lg border-0 shadow-sm"><SelectValue placeholder="Campo..." /></SelectTrigger>
                                            <SelectContent className="z-[100]">{(spreadsheetColumnsMap[widget.spreadsheet_ref] || []).map(col => (<SelectItem key={col} value={col}>{col}</SelectItem>))}</SelectContent>
                                          </Select>
                                        </div>
                                        <div className="col-span-3">
                                          <Select value={filter.condition} onValueChange={(v) => updateFilter(index, fIndex, 'condition', v as any)}>
                                            <SelectTrigger className="h-8 bg-white text-[10px] rounded-lg border-0 shadow-sm"><SelectValue /></SelectTrigger>
                                            <SelectContent className="z-[100]"><SelectItem value="equal">Igual a</SelectItem><SelectItem value="contains">Contém</SelectItem><SelectItem value="starts_with">Começa com</SelectItem><SelectItem value="null">Nulo</SelectItem></SelectContent>
                                          </Select>
                                        </div>
                                        <div className="col-span-2"><Input disabled={filter.condition === 'null'} value={filter.value} onChange={(e) => updateFilter(index, fIndex, 'value', e.target.value)} className="h-8 bg-white text-[10px] rounded-lg border-0 shadow-sm" /></div>
                                        <div className="col-span-1"><Button variant="ghost" size="icon" onClick={() => removeFilter(index, fIndex)} className="h-8 w-8 text-slate-300 hover:text-red-500 rounded-lg"><Trash2 size={13}/></Button></div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                            </div>
                          </div>

                          {/* Preview panel */}
                          <div className="lg:w-1/2 bg-slate-50/80 p-5 lg:p-6 flex flex-col justify-center min-h-[320px] relative">
                             <div className="absolute top-4 left-6 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[9px] font-black uppercase text-slate-400">Live Preview</span></div>
                             <div className="w-full h-full min-h-[260px] bg-white rounded-2xl shadow-md overflow-hidden ring-1 ring-slate-100 flex items-stretch mt-5">
                                <WidgetPreview widget={widget} />
                             </div>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </main>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-5 py-3 border-t bg-white flex flex-row items-center justify-end gap-3 z-50 shadow-sm flex-shrink-0">
          <Button variant="ghost" onClick={onClose} className="rounded-xl h-10 px-5 font-bold text-slate-400 text-sm">Cancelar</Button>
          {view === "form" && (
            <Button onClick={handleSaveModel} className="h-10 px-6 rounded-xl bg-indigo-600 text-white font-black uppercase tracking-widest text-xs shadow-lg transition-all hover:scale-[1.02] hover:bg-indigo-700">
              <Save className="mr-2 h-4 w-4" /> Finalizar Dashboard
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}