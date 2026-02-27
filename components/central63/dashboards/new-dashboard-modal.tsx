"use client";

import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
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
  Database, Settings2, LineChart, PieChart, Sigma, Type,
  Filter, Clock, Hash, Table as TableIcon, Eye, SlidersHorizontal,
  Pencil, AlertTriangle, CircleFadingPlus,
  Heading1, SplitSquareHorizontal, MoveLeft, MoveRight, Expand, Shrink, Columns, Maximize2,
  StretchHorizontal, AlignLeft, AlignCenter, AlignRight, Target, Zap, Star, Flame, TrendingUp, Users, Wallet, Briefcase
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

// ── Importação do Modal de Criação ──
import { CreateDashboardFromModelModal } from "./create-from-model-modal";

// ─────────────────────────────────────────────
// Types & Constants
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

const TITLE_ICONS: Record<string, { icon: React.ElementType, label: string }> = {
  target: { icon: Target, label: "Alvo" },
  zap: { icon: Zap, label: "Raio" },
  star: { icon: Star, label: "Estrela" },
  flame: { icon: Flame, label: "Fogo" },
  trending: { icon: TrendingUp, label: "Crescimento" },
  users: { icon: Users, label: "Usuários" },
  wallet: { icon: Wallet, label: "Carteira" },
  briefcase: { icon: Briefcase, label: "Maleta" },
};

// ─────────────────────────────────────────────
// Helpers — defined once outside any component
// ─────────────────────────────────────────────
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

function formatValue(value: number, type: DataType): string {
  if (type === "currency")
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  if (type === "number")
    return new Intl.NumberFormat('pt-BR').format(value);
  return value.toFixed(2);
}

function formatXAxis(value: any, type: DataType): string {
  if (type === "date" && value) {
    const date = new Date(value);
    return !isNaN(date.getTime()) ? date.toLocaleDateString('pt-BR') : value;
  }
  return value;
}

function computeAggregatedData(
  widget: WidgetConfig,
  sheetData: any[]
): { name: string; value: number }[] {
  let filtered = [...sheetData];

  if (widget.filters?.length > 0) {
    filtered = filtered.filter(item =>
      widget.filters.every(f => {
        if (!f.field) return true;
        const val = String(item[f.field] ?? "").toLowerCase();
        const fv  = String(f.value ?? "").toLowerCase();
        let match = false;
        switch (f.condition) {
          case "equal":       match = val === fv; break;
          case "contains":    match = val.includes(fv); break;
          case "starts_with": match = val.startsWith(fv); break;
          case "null":        match = !item[f.field] || item[f.field] === ""; break;
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
      case "avg":   total = values.reduce((a, b) => a + b, 0) / (values.length || 1); break;
      case "count": total = values.length; break;
      case "max":   total = Math.max(...values, 0); break;
      case "min":   total = Math.min(...values, 0); break;
      default:      total = values.reduce((a, b) => a + b, 0);
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
      case "avg":   result = vals.reduce((a, b) => a + b, 0) / vals.length; break;
      case "count": result = vals.length; break;
      case "max":   result = Math.max(...vals); break;
      case "min":   result = Math.min(...vals); break;
      default:      result = vals.reduce((a, b) => a + b, 0);
    }
    return { name: formatXAxis(key, widget.dataType), value: result };
  });
}

// ─────────────────────────────────────────────
// WidgetPreview — memoized, outside parent
// ─────────────────────────────────────────────
interface WidgetPreviewProps {
  widget: WidgetConfig;
  sheetData: any[] | null;
  compact?: boolean;
}

const WidgetPreview = memo(function WidgetPreview({
  widget,
  sheetData,
  compact = false,
}: WidgetPreviewProps) {
  const isLayoutViz = widget.type === 'title' || widget.type === 'divider';
  
  const hasData = isLayoutViz || (
    sheetData !== null &&
    (widget.type === 'value' || widget.column_x) &&
    widget.column_y
  );

  const aggregatedData = useMemo(() => {
    if (!hasData || isLayoutViz) return [];
    return computeAggregatedData(widget, sheetData!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasData,
    sheetData,
    widget.type,
    widget.column_x,
    widget.column_y,
    widget.aggregation,
    widget.dataType,
    isLayoutViz,
    JSON.stringify(widget.filters),
  ]);

  if (!hasData) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-slate-300 gap-2 bg-white">
        <BarChart3 size={compact ? 22 : 36} className="text-slate-200" />
        <p className={cn("font-bold uppercase tracking-widest text-slate-400", compact ? "text-[8px]" : "text-xs")}>
          Aguardando Configuração
        </p>
      </div>
    );
  }

  if (widget.type === "title") {
    const SelectedIcon = widget.icon && TITLE_ICONS[widget.icon] ? TITLE_ICONS[widget.icon].icon : null;
    const justifyClass = widget.align === 'center' ? 'justify-center' : widget.align === 'right' ? 'justify-end' : 'justify-start';

    return (
      <div className={cn("h-full w-full flex items-center p-6 bg-white", justifyClass)}>
        <div className="flex items-center gap-4">
          {SelectedIcon && (
            <div className={cn("flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm", compact ? "w-10 h-10" : "w-14 h-14")}>
              <SelectedIcon size={compact ? 20 : 28} strokeWidth={2.5} />
            </div>
          )}
          <h2 className={cn("font-black text-slate-800 tracking-tight", compact ? "text-2xl" : "text-4xl")}>
            {widget.title || "Novo Título"}
          </h2>
        </div>
      </div>
    );
  }

  if (widget.type === "divider") {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-white p-6 relative">
        <div className="w-full absolute inset-0 flex items-center justify-center px-8">
           <div className="w-full border-t-2 border-dashed border-slate-200"></div>
        </div>
        {widget.title && (
          <span className="relative z-10 bg-white px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            {widget.title}
          </span>
        )}
      </div>
    );
  }

  if (widget.type === "value") {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-white p-4 text-center">
        <p className={cn("font-black uppercase text-slate-400 tracking-[0.2em] mb-1", compact ? "text-[8px]" : "text-[10px]")}>
          {widget.title || "Valor Total"}
        </p>
        <h2 className={cn("font-black text-indigo-600 tracking-tighter", compact ? "text-xl" : "text-4xl")}>
          {formatValue(aggregatedData[0]?.value || 0, widget.dataType)}
        </h2>
        {!compact && (
          <div className="mt-3 px-3 py-1 bg-indigo-50 rounded-full text-[10px] font-bold text-indigo-500 uppercase tracking-wide">
            {widget.aggregation === 'sum' ? 'Soma' : widget.aggregation === 'avg' ? 'Média' : 'Métrica'} acumulada
          </div>
        )}
      </div>
    );
  }

  if (widget.type === "table") {
    return (
      <div className="h-full w-full flex flex-col bg-white overflow-hidden">
        {!compact && (
          <div className="p-2 border-b bg-slate-50/50">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              {widget.title || "Tabela de Dados"}
            </span>
          </div>
        )}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white shadow-sm">
              <tr>
                <th className="p-2 text-[9px] font-black uppercase text-slate-400 border-b">{widget.column_x}</th>
                <th className="p-2 text-[9px] font-black uppercase text-slate-400 border-b text-right">{widget.column_y}</th>
              </tr>
            </thead>
            <tbody>
              {aggregatedData.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors">
                  <td className="p-2 text-[10px] font-medium text-slate-600">{row.name}</td>
                  <td className="p-2 text-[10px] font-bold text-slate-900 text-right">
                    {formatValue(row.value, widget.dataType)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-3 flex flex-col bg-white">
      {!compact && (
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-slate-800 tracking-tight text-xs">{widget.title || "Visualização"}</h4>
          <div className="p-1 bg-indigo-50 rounded-lg text-indigo-600">
            {widget.type === 'bar' ? <BarChart3 size={12} /> : widget.type === 'line' ? <LineChart size={12} /> : <PieChart size={12} />}
          </div>
        </div>
      )}
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {widget.type === "bar" ? (
            <ReBarChart data={aggregatedData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: compact ? 7 : 9 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: compact ? 7 : 9 }} />
              <Tooltip
                formatter={(value: number) => [formatValue(value, widget.dataType), "Valor"]}
                contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '11px' }}
              />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={compact ? 12 : 22} />
            </ReBarChart>
          ) : widget.type === "line" ? (
            <ReLineChart data={aggregatedData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: compact ? 7 : 9 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: compact ? 7 : 9 }} />
              <Tooltip formatter={(value: number) => [formatValue(value, widget.dataType), "Valor"]} />
              <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ r: compact ? 2 : 3 }} />
            </ReLineChart>
          ) : (
            <RePieChart>
              <Pie
                data={aggregatedData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={compact ? 25 : 45}
                outerRadius={compact ? 40 : 60}
                paddingAngle={4}
              >
                {aggregatedData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatValue(value, widget.dataType)} />
            </RePieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────
// DeleteConfirmDialog — inline lightweight confirm
// ─────────────────────────────────────────────
function DeleteConfirmDialog({
  modelName,
  onConfirm,
  onCancel,
}: {
  modelName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[340px] flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-50 rounded-xl flex-shrink-0">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div>
            <p className="font-black text-sm text-slate-800">Excluir modelo?</p>
            <p className="text-xs text-slate-500 mt-1">
              O modelo <span className="font-bold text-slate-700">"{modelName}"</span> será removido permanentemente. Esta ação não pode ser desfeita.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onCancel} className="rounded-xl h-9 px-4 text-sm font-bold text-slate-500">
            Cancelar
          </Button>
          <Button onClick={onConfirm} className="rounded-xl h-9 px-4 text-sm font-black bg-red-500 hover:bg-red-600 text-white border-0">
            <Trash2 size={13} className="mr-1.5" /> Excluir
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main modal
// ─────────────────────────────────────────────
export function NewDashboardModal({ isOpen, onClose, onSave }: any) {
  const [view, setView] = useState<"gallery" | "form">("gallery");
  const [isSaving, setIsSaving] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [availableSpreadsheets, setAvailableSpreadsheets] = useState<any[]>([]);

  // Form state
  const [editingModelId, setEditingModelId] = useState<string | null>(null); // null = creating new
  const [nome, setNome] = useState("");
  const [unidade, setUnidade] = useState("");
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [selectedWidgetIndex, setSelectedWidgetIndex] = useState<number | null>(null);

  // Modal Use Model State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedModelForCreation, setSelectedModelForCreation] = useState<any>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nome: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Fetch ──
  useEffect(() => {
    if (isOpen) {
      fetchDashboardModels();
      fetchAvailableSpreadsheets();
      setView("gallery");
      resetForm();
    }
  }, [isOpen]);

  const fetchDashboardModels = async () => {
    const { data } = await supabase
      .from('dashboard_models')
      .select('*')
      .order('updated_at', { ascending: false });
    if (data) setModels(data);
  };

  const fetchAvailableSpreadsheets = async () => {
    const { data } = await supabase
      .from('spreadsheet_data')
      .select('id, nome_tabela, modelo_tabela, unidade, dados');
    if (data) setAvailableSpreadsheets(data);
  };

  // ── Form helpers ──
  const resetForm = () => {
    setEditingModelId(null);
    setNome("");
    setUnidade("");
    setWidgets([]);
    setSelectedWidgetIndex(null);
  };

  const openNewForm = () => {
    resetForm();
    setView("form");
  };

  const openEditForm = (model: any) => {
    setEditingModelId(model.id);
    setNome(model.nome || "");
    setUnidade(model.unidade || "");
    // Default size protection on legacy widgets
    const parsedWidgets = JSON.parse(JSON.stringify(model.widgets || [])).map((w: any) => ({
      ...w,
      size: w.size || "small",
      align: w.align || "left",
    }));
    setWidgets(parsedWidgets);
    setSelectedWidgetIndex(null);
    setView("form");
  };

  // ── Derived stable maps ──
  const spreadsheetColumnsMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    availableSpreadsheets.forEach(sheet => {
      if (sheet.dados?.length > 0) map[sheet.id] = Object.keys(sheet.dados[0]);
    });
    return map;
  }, [availableSpreadsheets]);

  const sheetDataMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    availableSpreadsheets.forEach(sheet => { map[sheet.id] = sheet.dados || []; });
    return map;
  }, [availableSpreadsheets]);

  // ── Widget mutations ──
  const addWidget = useCallback(() => {
    setWidgets(prev => {
      const next: WidgetConfig[] = [
        ...prev,
        {
          title: "",
          type: "bar",
          size: "small",
          align: "left",
          spreadsheet_ref: "",
          column_x: "",
          column_y: "",
          time_column: "",
          aggregation: "sum",
          dataType: "number",
          filters: [],
        },
      ];
      setSelectedWidgetIndex(next.length - 1);
      return next;
    });
  }, []);

  const updateWidget = useCallback((index: number, updates: Partial<WidgetConfig>) => {
    setWidgets(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  }, []);

  const removeWidget = useCallback((index: number) => {
    setWidgets(prev => {
      const next = prev.filter((_, i) => i !== index);
      setSelectedWidgetIndex(sel => {
        if (sel === null) return null;
        if (sel === index) return next.length > 0 ? Math.max(0, index - 1) : null;
        if (sel > index) return sel - 1;
        return sel;
      });
      return next;
    });
  }, []);

  const moveWidget = useCallback((index: number, direction: 'left' | 'right') => {
    setWidgets(prev => {
      const next = [...prev];
      if (direction === 'left' && index > 0) {
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
        setSelectedWidgetIndex(index - 1);
      } else if (direction === 'right' && index < next.length - 1) {
        [next[index + 1], next[index]] = [next[index], next[index + 1]];
        setSelectedWidgetIndex(index + 1);
      }
      return next;
    });
  }, []);

  const addFilter = useCallback((widgetIndex: number) => {
    setWidgets(prev => {
      const next = [...prev];
      next[widgetIndex] = {
        ...next[widgetIndex],
        filters: [
          ...next[widgetIndex].filters,
          { type: "include", field: "", condition: "equal", value: "" },
        ],
      };
      return next;
    });
  }, []);

  const updateFilter = useCallback((
    widgetIndex: number,
    filterIndex: number,
    field: keyof WidgetFilter,
    value: string
  ) => {
    setWidgets(prev => {
      const next = [...prev];
      const filters = [...next[widgetIndex].filters];
      filters[filterIndex] = { ...filters[filterIndex], [field]: value };
      next[widgetIndex] = { ...next[widgetIndex], filters };
      return next;
    });
  }, []);

  const removeFilter = useCallback((widgetIndex: number, filterIndex: number) => {
    setWidgets(prev => {
      const next = [...prev];
      next[widgetIndex] = {
        ...next[widgetIndex],
        filters: next[widgetIndex].filters.filter((_, i) => i !== filterIndex),
      };
      return next;
    });
  }, []);

  // ── Save (create or update) ──
  const handleSaveModel = async () => {
    if (!nome.trim()) return toast.error("Nome do dashboard é obrigatório");
    if (widgets.length === 0) return toast.error("Adicione pelo menos um elemento");

    setIsSaving(true);

    let error: any = null;

    if (editingModelId) {
      // UPDATE existing model
      ({ error } = await supabase
        .from('dashboard_models')
        .update({ nome, unidade, widgets, updated_at: new Date().toISOString() })
        .eq('id', editingModelId));
    } else {
      // INSERT new model
      ({ error } = await supabase
        .from('dashboard_models')
        .insert([{ nome, unidade, widgets, updated_at: new Date().toISOString() }]));
    }

    setIsSaving(false);

    if (error) {
      toast.error(editingModelId ? "Erro ao atualizar dashboard" : "Erro ao salvar dashboard");
      return;
    }

    toast.success(editingModelId ? "Dashboard atualizado!" : "Dashboard criado!");
    resetForm();
    await fetchDashboardModels();
    setView("gallery");
  };

  // ── Delete model ──
  const handleDeleteModel = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const { error } = await supabase
      .from('dashboard_models')
      .delete()
      .eq('id', deleteTarget.id);
    setIsDeleting(false);
    setDeleteTarget(null);

    if (error) {
      toast.error("Erro ao excluir modelo");
      return;
    }
    toast.success("Modelo excluído!");
    await fetchDashboardModels();
  };

  const selectedWidget = selectedWidgetIndex !== null ? widgets[selectedWidgetIndex] : null;
  const isEditing = !!editingModelId;

  // ─────────────────────────────────────────────
  return (
    <>
      {/* Delete confirmation overlay */}
      {deleteTarget && (
        <DeleteConfirmDialog
          modelName={deleteTarget.nome}
          onConfirm={handleDeleteModel}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Uso de Modelo Dashboard overlay */}
      {isCreateModalOpen && (
        <CreateDashboardFromModelModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setSelectedModelForCreation(null);
          }}
          onSave={() => {
            if (onSave) onSave();
            onClose(); // Fecha também a galeria para exibir o painel principal novo
          }}
          model={selectedModelForCreation}
        />
      )}

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="max-w-[98vw] w-full h-[94vh] flex flex-col p-0 gap-0 border-none shadow-2xl rounded-2xl overflow-hidden bg-[#f0f2f5]"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          {/* ── Header ── */}
          <DialogHeader className="px-5 py-3 border-b bg-white flex-shrink-0 z-[60] shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <DialogTitle className="text-lg font-black tracking-tight text-slate-800">
                  {view === "gallery"
                    ? "Modelos de Dashboard"
                    : isEditing
                      ? `Editando: ${nome || "Sem título"}`
                      : "Novo Dashboard"}
                </DialogTitle>
                {view === "form" && (
                  <div className={cn(
                    "flex items-center gap-1 ml-2 px-3 py-1 rounded-full",
                    isEditing ? "bg-amber-50" : "bg-indigo-50"
                  )}>
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full animate-pulse",
                      isEditing ? "bg-amber-400" : "bg-emerald-500"
                    )} />
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest",
                      isEditing ? "text-amber-600" : "text-indigo-600"
                    )}>
                      {isEditing ? "Modo Edição" : "Modo Studio"}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {view === "gallery" ? (
                  <Button
                    onClick={openNewForm}
                    className="rounded-xl h-9 px-4 text-sm bg-indigo-600 hover:bg-indigo-700 shadow-md"
                  >
                    <Plus className="mr-1.5 h-4 w-4" /> Novo Modelo
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => { setView("gallery"); resetForm(); }}
                    className="rounded-xl h-9 text-sm font-bold text-slate-500 hover:bg-slate-100"
                  >
                    <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar para Galeria
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* ── Body ── */}
          <div className="flex-1 min-h-0 overflow-hidden">

            {/* GALLERY */}
            {view === "gallery" && (
              <div className="h-full overflow-y-auto p-5">
                {models.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                    <div className="w-16 h-16 rounded-2xl bg-white shadow flex items-center justify-center">
                      <LayoutTemplate size={28} className="text-slate-300" />
                    </div>
                    <div className="text-center">
                      <p className="font-black uppercase tracking-widest text-xs text-slate-400">Nenhum modelo criado</p>
                      <p className="text-[11px] text-slate-300 mt-1">Clique em "Novo Modelo" para começar</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {models.map((model) => (
                      <div
                        key={model.id}
                        className="group bg-white rounded-2xl p-5 shadow-sm ring-1 ring-slate-100 flex flex-col hover:shadow-md hover:ring-slate-200 transition-all"
                      >
                        {/* Card top */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="p-2 bg-indigo-50 rounded-xl">
                            <LayoutTemplate className="h-5 w-5 text-indigo-500" />
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Delete button */}
                            <button
                              onClick={() => setDeleteTarget({ id: model.id, nome: model.nome })}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
                              title="Excluir modelo"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <h3 className="font-black text-base mb-1 truncate text-slate-800">{model.nome}</h3>
                        {model.unidade && (
                          <p className="text-[11px] text-slate-400 font-medium mb-3 truncate">{model.unidade}</p>
                        )}

                        {/* Widget count badge */}
                        <div className="flex items-center gap-1.5 mb-4">
                          <div className="px-2 py-0.5 bg-slate-50 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-wider">
                            {(model.widgets || []).length} elemento{(model.widgets || []).length !== 1 ? 's' : ''}
                          </div>
                          {model.updated_at && (
                            <div className="px-2 py-0.5 bg-slate-50 rounded-full text-[10px] font-medium text-slate-400">
                              {new Date(model.updated_at).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="mt-auto flex gap-2">
                          <Button
                            onClick={() => {
                              setSelectedModelForCreation(model);
                              setIsCreateModalOpen(true);
                            }}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-9 border-0 text-xs"
                          >
                            <CircleFadingPlus size={12} className="mr-1.5" /> Usar Modelo
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => openEditForm(model)}
                            className="w-9 h-9 rounded-xl border-slate-100 text-slate-400 hover:text-indigo-500 hover:border-indigo-100 hover:bg-indigo-50 flex-shrink-0 p-0"
                          >
                            <Pencil size={13} />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Create new tile */}
                    <div
                      onClick={openNewForm}
                      className="border-2 border-dashed border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 text-slate-400 hover:bg-white hover:border-indigo-500/50 hover:text-indigo-600 cursor-pointer transition-all min-h-[180px]"
                    >
                      <Plus size={36} strokeWidth={1} />
                      <span className="font-black uppercase tracking-widest text-xs">Criar do Zero</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STUDIO FORM */}
            {view === "form" && (
              <div className="h-full flex overflow-hidden">

                {/* ════ LEFT — Canvas ════ */}
                <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-[#f0f2f5]">

                  {/* Toolbar */}
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-slate-100 flex-shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={nome}
                        onChange={e => setNome(e.target.value)}
                        placeholder="Título do Painel..."
                        className="h-8 text-sm font-black border-0 bg-slate-50 rounded-lg w-52 focus:ring-2 focus:ring-indigo-500"
                      />
                      <Input
                        value={unidade}
                        onChange={e => setUnidade(e.target.value)}
                        placeholder="Unidade..."
                        className="h-8 text-sm font-bold border-0 bg-slate-50 rounded-lg w-36 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <Button
                      onClick={addWidget}
                      className="rounded-lg gap-1.5 h-8 px-3 text-xs bg-indigo-600 text-white hover:bg-indigo-700 font-bold shadow-sm flex-shrink-0"
                    >
                      <Plus size={13} /> Adicionar Elemento
                    </Button>
                  </div>

                  {/* Canvas */}
                  <div className="flex-1 overflow-y-auto p-5">
                    {widgets.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                        <div className="w-16 h-16 rounded-2xl bg-white shadow flex items-center justify-center">
                          <BarChart3 size={28} className="text-slate-300" />
                        </div>
                        <div className="text-center">
                          <p className="font-black uppercase tracking-widest text-xs text-slate-400">Nenhum elemento adicionado</p>
                          <p className="text-[11px] text-slate-300 mt-1">Clique em "Adicionar Elemento" para começar</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-[220px] grid-flow-dense">
                        {widgets.map((widget, index) => {
                          const sizeClass = {
                            small: "col-span-1 row-span-1",
                            wide: "col-span-2 xl:col-span-2 row-span-1",
                            tall: "col-span-1 row-span-2",
                            large: "col-span-2 xl:col-span-2 row-span-2",
                            full: "col-span-full row-span-1",
                          }[widget.size || "small"];

                          return (
                            <div
                              key={index}
                              onClick={() => setSelectedWidgetIndex(index)}
                              className={cn(
                                "relative bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-150 group",
                                sizeClass,
                                selectedWidgetIndex === index
                                  ? "ring-2 ring-indigo-500 shadow-lg shadow-indigo-100"
                                  : "ring-1 ring-slate-100 shadow-sm hover:ring-2 hover:ring-indigo-300 hover:shadow-md"
                              )}
                            >
                              {/* Badge */}
                              <div className="absolute top-2.5 left-3 z-10">
                                <div className={cn(
                                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm",
                                  selectedWidgetIndex === index ? "bg-indigo-600 text-white" : "bg-white/90 text-slate-500 backdrop-blur"
                                )}>
                                  {widget.type === 'bar'   ? <BarChart3 size={9} /> :
                                   widget.type === 'line'  ? <LineChart size={9} /> :
                                   widget.type === 'pie'   ? <PieChart size={9} /> :
                                   widget.type === 'value' ? <Hash size={9} /> :
                                   widget.type === 'table' ? <TableIcon size={9} /> :
                                   widget.type === 'title' ? <Heading1 size={9} /> :
                                   <SplitSquareHorizontal size={9} />}
                                  {widget.title || `Elemento ${index + 1}`}
                                </div>
                              </div>

                              {/* Action Buttons (Move Left/Right & Delete) */}
                              <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveWidget(index, 'left'); }}
                                  className="w-6 h-6 rounded-full bg-white shadow text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-colors"
                                  title="Mover para Esquerda/Cima"
                                >
                                  <MoveLeft size={11} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveWidget(index, 'right'); }}
                                  className="w-6 h-6 rounded-full bg-white shadow text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-colors"
                                  title="Mover para Direita/Baixo"
                                >
                                  <MoveRight size={11} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); removeWidget(index); }}
                                  className="w-6 h-6 rounded-full bg-white shadow text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors ml-1"
                                  title="Excluir"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>

                              {/* Editing pill */}
                              {selectedWidgetIndex === index && (
                                <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 bg-indigo-600 text-white rounded-full px-2 py-0.5 shadow-sm">
                                  <SlidersHorizontal size={9} />
                                  <span className="text-[8px] font-black uppercase">Editando</span>
                                </div>
                              )}

                              <WidgetPreview
                                widget={widget}
                                sheetData={sheetDataMap[widget.spreadsheet_ref] ?? null}
                                compact
                              />
                            </div>
                          );
                        })}

                        {/* Add tile */}
                        <div
                          onClick={addWidget}
                          className="col-span-1 row-span-1 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:bg-white hover:border-indigo-400 hover:text-indigo-600 cursor-pointer transition-all min-h-[220px]"
                        >
                          <Plus size={28} strokeWidth={1.5} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Novo Elemento</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ════ RIGHT — Properties ════ */}
                <div className="w-[340px] xl:w-[380px] flex-shrink-0 flex flex-col bg-white border-l border-slate-100 shadow-xl overflow-hidden">
                  {selectedWidget === null ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                        <Settings2 size={20} className="text-slate-300" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Nenhum elemento selecionado</p>
                        <p className="text-[11px] text-slate-300 mt-1">Clique em um elemento para editar suas propriedades</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Panel header */}
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/80">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                            <Settings2 size={13} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Propriedades</p>
                            <p className="text-xs font-black text-slate-800 truncate max-w-[160px]">
                              {selectedWidget.title || `Elemento ${(selectedWidgetIndex ?? 0) + 1}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-wrap max-w-[120px] justify-end">
                          {widgets.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setSelectedWidgetIndex(i)}
                              className={cn(
                                "w-5 h-5 rounded-full text-[9px] font-black transition-all flex items-center justify-center",
                                i === selectedWidgetIndex
                                  ? "bg-indigo-600 text-white shadow-sm"
                                  : "bg-slate-100 text-slate-400 hover:bg-indigo-100"
                              )}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Scrollable form */}
                      <div className="flex-1 overflow-y-auto">
                        <div className="p-4 space-y-5">

                          {/* Title */}
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                              {selectedWidget.type === 'divider' ? 'Texto do Divisor' : selectedWidget.type === 'title' ? 'Texto do Título' : 'Título do Gráfico'}
                            </Label>
                            <Input
                              value={selectedWidget.title}
                              onChange={e => updateWidget(selectedWidgetIndex!, { title: e.target.value })}
                              className="h-9 bg-slate-50/50 rounded-xl font-bold border-slate-100 text-sm"
                              placeholder="Digite o título..."
                            />
                          </div>

                          {/* Viz type */}
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tipo de Visualização</Label>
                            <div className="grid grid-cols-4 gap-1 mb-1">
                              {([
                                { t: 'bar',   icon: <BarChart3 size={14} />,  label: 'Barra'  },
                                { t: 'line',  icon: <LineChart size={14} />,  label: 'Linha'  },
                                { t: 'pie',   icon: <PieChart size={14} />,   label: 'Pizza'  },
                                { t: 'value', icon: <Hash size={14} />,       label: 'Valor'  },
                                { t: 'table', icon: <TableIcon size={14} />,  label: 'Tabela' },
                                { t: 'title', icon: <Heading1 size={14} />,   label: 'Título' },
                                { t: 'divider', icon: <SplitSquareHorizontal size={14} />, label: 'Divisor' },
                              ] as any[]).map(({ t, icon, label }) => (
                                <Button
                                  key={t}
                                  variant="outline"
                                  onClick={() => {
                                    const isLayout = t === 'title' || t === 'divider';
                                    updateWidget(selectedWidgetIndex!, { 
                                      type: t,
                                      ...(isLayout && selectedWidget.type !== t ? { size: 'full' } : {}) 
                                    });
                                  }}
                                  className={cn(
                                    "h-11 rounded-xl flex-col gap-0.5 text-[8px] font-black",
                                    selectedWidget.type === t && "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                  )}
                                >
                                  {icon}{label}
                                </Button>
                              ))}
                            </div>
                          </div>

                          {/* Sizing options */}
                          <div className="space-y-1.5 pt-3 border-t border-slate-100">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tamanho de Exibição</Label>
                            <div className="grid grid-cols-5 gap-1">
                              {[
                                { s: 'small', label: 'Pequeno', icon: <Shrink size={12} /> },
                                { s: 'wide',  label: 'Largo',   icon: <Columns size={12} /> },
                                { s: 'tall',  label: 'Alto',    icon: <Maximize2 size={12} className="rotate-90" /> },
                                { s: 'large', label: 'Grande',  icon: <Expand size={12} /> },
                                { s: 'full',  label: '100%',    icon: <StretchHorizontal size={12} /> },
                              ].map(({ s, label, icon }) => (
                                <Button
                                  key={s}
                                  variant="outline"
                                  onClick={() => updateWidget(selectedWidgetIndex!, { size: s as any })}
                                  className={cn(
                                    "h-10 rounded-xl flex-col gap-0.5 text-[8px] font-black transition-all",
                                    (selectedWidget.size || 'small') === s
                                      ? "bg-slate-800 text-white border-slate-800 shadow-md"
                                      : "text-slate-500 hover:bg-slate-50"
                                  )}
                                >
                                  {icon}{label}
                                </Button>
                              ))}
                            </div>
                          </div>

                          {/* ── Title Specific Options ── */}
                          {selectedWidget.type === 'title' && (
                            <div className="space-y-4 pt-3 border-t border-slate-100">
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Alinhamento</Label>
                                <div className="grid grid-cols-3 gap-1">
                                  {[
                                    { a: 'left', icon: <AlignLeft size={14} /> },
                                    { a: 'center', icon: <AlignCenter size={14} /> },
                                    { a: 'right', icon: <AlignRight size={14} /> },
                                  ].map(({ a, icon }) => (
                                    <Button
                                      key={a}
                                      variant="outline"
                                      onClick={() => updateWidget(selectedWidgetIndex!, { align: a as any })}
                                      className={cn(
                                        "h-9 rounded-xl text-slate-500 hover:bg-slate-50",
                                        (selectedWidget.align || 'left') === a && "bg-slate-800 text-white border-slate-800 shadow-md"
                                      )}
                                    >
                                      {icon}
                                    </Button>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ícone do Título</Label>
                                <Select
                                  value={selectedWidget.icon || "none"}
                                  onValueChange={(v) => updateWidget(selectedWidgetIndex!, { icon: v === "none" ? undefined : v })}
                                >
                                  <SelectTrigger className="h-9 bg-slate-50/50 rounded-xl font-bold border-slate-100 text-sm">
                                    <SelectValue placeholder="Nenhum ícone" />
                                  </SelectTrigger>
                                  <SelectContent className="z-[100] rounded-xl">
                                    <SelectItem value="none">Sem ícone</SelectItem>
                                    {Object.entries(TITLE_ICONS).map(([key, { icon: IconCmp, label }]) => (
                                      <SelectItem key={key} value={key}>
                                        <div className="flex items-center gap-2">
                                          <IconCmp size={14} className="text-indigo-600" />
                                          <span>{label}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}

                          {/* Conditional rendering for Data / Filters (Only show if not layout types) */}
                          {selectedWidget.type !== 'title' && selectedWidget.type !== 'divider' && (
                            <>
                              <div className="border-t border-slate-100" />

                              {/* Data source */}
                              <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-1.5">
                                  <Database size={10} /> Fonte de Dados
                                </Label>

                                <Select
                                  value={selectedWidget.spreadsheet_ref}
                                  onValueChange={(v) => updateWidget(selectedWidgetIndex!, { spreadsheet_ref: v, column_x: '', column_y: '', time_column: '' })}
                                >
                                  <SelectTrigger className="h-9 bg-white rounded-xl font-bold border-slate-100 text-xs shadow-sm">
                                    <SelectValue placeholder="Selecione a planilha..." />
                                  </SelectTrigger>
                                  <SelectContent className="z-[100] rounded-xl">
                                    {availableSpreadsheets.map((s) => (
                                      <SelectItem key={s.id} value={s.id}>{s.nome_tabela || s.modelo_tabela}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Eixo X</Label>
                                    <Select
                                      value={selectedWidget.column_x}
                                      onValueChange={(v) => updateWidget(selectedWidgetIndex!, { column_x: v })}
                                      disabled={!selectedWidget.spreadsheet_ref || selectedWidget.type === 'value'}
                                    >
                                      <SelectTrigger className="h-8 bg-white rounded-lg text-[10px] font-bold border-slate-100 shadow-sm">
                                        <SelectValue placeholder="Coluna..." />
                                      </SelectTrigger>
                                      <SelectContent className="z-[100] rounded-xl">
                                        {(spreadsheetColumnsMap[selectedWidget.spreadsheet_ref] || []).map((col) => (
                                          <SelectItem key={col} value={col}>{col}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Eixo Y</Label>
                                    <Select
                                      value={selectedWidget.column_y}
                                      onValueChange={(v) => updateWidget(selectedWidgetIndex!, { column_y: v })}
                                      disabled={!selectedWidget.spreadsheet_ref}
                                    >
                                      <SelectTrigger className="h-8 bg-white rounded-lg text-[10px] font-bold border-slate-100 shadow-sm">
                                        <SelectValue placeholder="Coluna..." />
                                      </SelectTrigger>
                                      <SelectContent className="z-[100] rounded-xl">
                                        {(spreadsheetColumnsMap[selectedWidget.spreadsheet_ref] || []).map((col) => (
                                          <SelectItem key={col} value={col}>{col}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-[9px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-1.5">
                                    <Clock size={9} /> Coluna de Período
                                  </Label>
                                  <Select
                                    value={selectedWidget.time_column}
                                    onValueChange={(v) => updateWidget(selectedWidgetIndex!, { time_column: v })}
                                    disabled={!selectedWidget.spreadsheet_ref}
                                  >
                                    <SelectTrigger className="h-8 bg-white rounded-lg text-[10px] font-bold border-slate-100 shadow-sm">
                                      <SelectValue placeholder="Data/Hora..." />
                                    </SelectTrigger>
                                    <SelectContent className="z-[100] rounded-xl">
                                      {(spreadsheetColumnsMap[selectedWidget.spreadsheet_ref] || []).map((col) => (
                                        <SelectItem key={col} value={col}>{col}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                                      <Sigma size={9} /> Agregação
                                    </Label>
                                    <Select
                                      value={selectedWidget.aggregation}
                                      onValueChange={(v) => updateWidget(selectedWidgetIndex!, { aggregation: v as any })}
                                      disabled={!selectedWidget.spreadsheet_ref}
                                    >
                                      <SelectTrigger className="h-8 bg-white rounded-lg text-[10px] font-bold border-slate-100 shadow-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="z-[100] rounded-xl">
                                        <SelectItem value="sum">Soma</SelectItem>
                                        <SelectItem value="avg">Média</SelectItem>
                                        <SelectItem value="count">Contagem</SelectItem>
                                        <SelectItem value="max">Máximo</SelectItem>
                                        <SelectItem value="min">Mínimo</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                                      <Type size={9} /> Formato
                                    </Label>
                                    <Select
                                      value={selectedWidget.dataType}
                                      onValueChange={(v) => updateWidget(selectedWidgetIndex!, { dataType: v as any })}
                                    >
                                      <SelectTrigger className="h-8 bg-white rounded-lg text-[10px] font-bold border-slate-100 shadow-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="z-[100] rounded-xl">
                                        <SelectItem value="text">Texto</SelectItem>
                                        <SelectItem value="number">Número</SelectItem>
                                        <SelectItem value="date">Data</SelectItem>
                                        <SelectItem value="currency">Moeda (R$)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>

                              <div className="border-t border-slate-100" />

                              {/* Filters */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <Label className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-1.5">
                                    <Filter size={10} /> Filtros de Dados
                                  </Label>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addFilter(selectedWidgetIndex!)}
                                    className="h-6 rounded-lg text-[9px] font-bold border-indigo-100 text-indigo-600 px-2"
                                  >
                                    <Plus size={10} className="mr-1" /> Add Filtro
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  {selectedWidget.filters.map((filter, fIndex) => (
                                    <div key={fIndex} className="p-2.5 bg-slate-50 rounded-xl grid grid-cols-12 gap-1.5 items-end ring-1 ring-slate-100">
                                      <div className="col-span-3">
                                        <Select value={filter.type} onValueChange={(v) => updateFilter(selectedWidgetIndex!, fIndex, 'type', v as any)}>
                                          <SelectTrigger className="h-7 bg-white text-[9px] rounded-lg border-0 shadow-sm"><SelectValue /></SelectTrigger>
                                          <SelectContent className="z-[100]">
                                            <SelectItem value="include">Incluir</SelectItem>
                                            <SelectItem value="exclude">Excluir</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="col-span-3">
                                        <Select value={filter.field} onValueChange={(v) => updateFilter(selectedWidgetIndex!, fIndex, 'field', v)}>
                                          <SelectTrigger className="h-7 bg-white text-[9px] rounded-lg border-0 shadow-sm"><SelectValue placeholder="Campo..." /></SelectTrigger>
                                          <SelectContent className="z-[100]">
                                            {(spreadsheetColumnsMap[selectedWidget.spreadsheet_ref] || []).map(col => (
                                              <SelectItem key={col} value={col}>{col}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="col-span-3">
                                        <Select value={filter.condition} onValueChange={(v) => updateFilter(selectedWidgetIndex!, fIndex, 'condition', v as any)}>
                                          <SelectTrigger className="h-7 bg-white text-[9px] rounded-lg border-0 shadow-sm"><SelectValue /></SelectTrigger>
                                          <SelectContent className="z-[100]">
                                            <SelectItem value="equal">Igual a</SelectItem>
                                            <SelectItem value="contains">Contém</SelectItem>
                                            <SelectItem value="starts_with">Começa com</SelectItem>
                                            <SelectItem value="null">Nulo</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="col-span-2">
                                        <Input
                                          disabled={filter.condition === 'null'}
                                          value={filter.value}
                                          onChange={(e) => updateFilter(selectedWidgetIndex!, fIndex, 'value', e.target.value)}
                                          className="h-7 bg-white text-[9px] rounded-lg border-0 shadow-sm px-2"
                                        />
                                      </div>
                                      <div className="col-span-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => removeFilter(selectedWidgetIndex!, fIndex)}
                                          className="h-7 w-7 text-slate-300 hover:text-red-500 rounded-lg"
                                        >
                                          <Trash2 size={11} />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}

                          {/* Delete widget */}
                          <div className={cn("pt-2", selectedWidget.type === 'title' || selectedWidget.type === 'divider' ? "mt-4" : "")}>
                            <Button
                              variant="ghost"
                              onClick={() => removeWidget(selectedWidgetIndex!)}
                              className="w-full h-9 rounded-xl text-xs font-bold text-red-400 hover:text-red-600 hover:bg-red-50 border border-dashed border-red-100 transition-colors"
                            >
                              <Trash2 size={13} className="mr-2" /> Remover Elemento
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Live preview at bottom */}
                      <div className="flex-shrink-0 border-t border-slate-100 p-3 bg-slate-50/60">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Eye size={10} className="text-slate-400" />
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Preview Rápido</span>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-auto" />
                        </div>
                        <div className="h-[140px] bg-white rounded-xl ring-1 ring-slate-100 overflow-hidden shadow-sm">
                          <WidgetPreview
                            widget={selectedWidget}
                            sheetData={sheetDataMap[selectedWidget.spreadsheet_ref] ?? null}
                            compact={false}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <DialogFooter className="px-5 py-3 border-t bg-white flex flex-row items-center justify-end gap-3 z-50 shadow-sm flex-shrink-0">
            <Button
              variant="ghost"
              onClick={onClose}
              className="rounded-xl h-10 px-5 font-bold text-slate-400 text-sm hover:bg-slate-50"
            >
              Cancelar
            </Button>
            {view === "form" && (
              <Button
                onClick={handleSaveModel}
                disabled={isSaving}
                className={cn(
                  "h-10 px-6 rounded-xl text-white font-black uppercase tracking-widest text-xs shadow-lg transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100",
                  isEditing
                    ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
                )}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    {isEditing ? "Atualizando..." : "Salvando..."}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditing ? "Salvar Alterações" : "Salvar Modelo"}
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}