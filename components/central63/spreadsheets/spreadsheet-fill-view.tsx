"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Send,
  Building2,
  Loader2,
  Plus,
  CheckCircle2,
  Edit3,
  Type,
  DollarSign,
  Calendar as CalendarIcon,
  Percent,
  MinusCircle,
  FileUp
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

interface SpreadsheetFillViewProps {
  model: any;
  onBack: () => void;
  onSaveData: (data: any) => void;
  initialRows?: any[];
}

export function SpreadsheetFillView({ model, onBack, onSaveData, initialRows }: SpreadsheetFillViewProps) {
  const createEmptyRow = () => {
    const row: any = {};
    model.dados?.forEach((field: any) => {
      row[field.name] = "";
    });
    return row;
  };

  const [rows, setRows] = useState<any[]>(initialRows && initialRows.length > 0 ? initialRows : [createEmptyRow()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nomeTabela, setNomeTabela] = useState(model.nome_tabela || model.nome_customizado || "");
  const [perfilUsuario, setPerfilUsuario] = useState<{ full_name: string; avatar_url: string } | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedData, setImportedData] = useState<any[]>([]);
  const [importedHeaders, setImportedHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function carregarPerfil() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .single();
        if (profile) setPerfilUsuario(profile);
      }
    }
    carregarPerfil();
  }, []);

  const formatCurrency = (value: any) => {
    if (typeof value === "number") {
      return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    const numericValue = String(value).replace(/\D/g, "");
    if (!numericValue) return "";
    return (Number(numericValue) / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDateForInput = (value: any) => {
    if (!value) return "";
    if (typeof value === "number") {
      const date = XLSX.SSF.parse_date_code(value);
      const d = new Date(date.y, date.m - 1, date.d);
      return d.toISOString().split("T")[0];
    }
    try {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
    } catch (e) { }
    return value;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary", cellDates: true });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      if (data.length > 0) {
        const headers = Object.keys(data[0] as object);
        setImportedHeaders(headers);
        setImportedData(data);

        const initialMapping: Record<string, string> = {};
        model.dados.forEach((field: any) => {
          const match = headers.find(h => h.toLowerCase() === field.name.toLowerCase());
          if (match) initialMapping[field.name] = match;
        });
        setMapping(initialMapping);
        setIsImportModalOpen(true);
      }
    };
    reader.readAsBinaryString(file);
  };

  const confirmImport = () => {
    const newRows = importedData.map((impRow) => {
      const row: any = {};
      model.dados.forEach((field: any) => {
        const importedKey = mapping[field.name];
        const rawValue = importedKey ? impRow[importedKey] : "";

        if (field.type === "currency") {
          row[field.name] = rawValue !== "" ? formatCurrency(rawValue) : "";
        } else if (field.type === "date") {
          row[field.name] = formatDateForInput(rawValue);
        } else if (field.type === "percentage") {
          const num = parseFloat(rawValue);
          row[field.name] = !isNaN(num) ? (num < 1 && num > 0 ? (num * 100).toString() : num.toString()) : "";
        } else {
          row[field.name] = rawValue !== undefined ? String(rawValue) : "";
        }
      });
      return row;
    });

    const currentActiveRows = rows.filter(r => Object.values(r).some(v => v !== ""));
    setRows([...currentActiveRows, ...newRows]);
    setIsImportModalOpen(false);
    toast.success(`${newRows.length} linhas importadas!`);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case "currency": return <DollarSign size={12} className="text-emerald-500" />;
      case "percentage": return <Percent size={12} className="text-indigo-500" />;
      case "date": return <CalendarIcon size={12} className="text-amber-500" />;
      default: return <Type size={12} className="text-sky-500" />;
    }
  };

  const handleInputChange = (index: number, fieldName: string, value: string, type?: string) => {
    const newRows = [...rows];
    newRows[index][fieldName] = type === "currency" ? formatCurrency(value) : value;
    setRows(newRows);
  };

  const addRow = () => setRows([...rows, createEmptyRow()]);
  const removeRow = (index: number) => {
    if (rows.length === 1) { setRows([createEmptyRow()]); return; }
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        spreadsheet_id: model.id,
        nome_tabela: nomeTabela,
        nome_modelo: model.nome,
        unidade: model.unidade,
        criado_por: perfilUsuario?.full_name || model.criado_por || "Usuário",
        dados: rows,
        data_preenchimento: new Date().toISOString()
      };
      await onSaveData(payload);
    } catch (error) {
      toast.error("Erro ao salvar os dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[98vw] mx-auto p-2 md:p-4 animate-in fade-in duration-500">
      <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />

      <div className="flex items-center justify-between mb-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onBack} className="rounded-full h-8 w-8 p-0">
            <ArrowLeft size={18} className="text-slate-500" />
          </Button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-sky-500 uppercase tracking-tight leading-none">Editor</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[120px]">{model.nome}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="rounded-full text-xs font-bold h-8 gap-2 border-slate-200">
            <FileUp size={14} />
            <span className="hidden md:inline">Importar</span>
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="rounded-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold h-8 px-4 gap-2">
            {isSubmitting ? <Loader2 className="animate-spin h-3 w-3" /> : <Send size={14} />}
            <span>Finalizar</span>
          </Button>
        </div>
      </div>

      <Card className="rounded-3xl border-none shadow-2xl overflow-hidden bg-white dark:bg-slate-950">
        <CardHeader className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-900">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 text-[10px] font-black text-sky-500 uppercase tracking-widest ml-1">
                <Building2 size={12} />
                {model.unidade || "Geral"}
              </div>

              {/* CORREÇÃO DO ÍCONE COLADO AO TEXTO */}
              <div className="flex items-center group w-fit">
                <Edit3 size={20} className="ml-1 text-slate-300 opacity-40 group-focus-within:text-sky-500 group-focus-within:opacity-100 transition-all shrink-0 cursor-text" />
                <div className="inline-grid items-center relative">
                  {/* Span invisível garante o auto-resize exato */}
                  <span className="invisible col-start-1 row-start-1 whitespace-pre text-2xl md:text-4xl font-black p-0 m-0 pointer-events-none" aria-hidden="true">
                    {nomeTabela || "Título da Planilha"}
                  </span>
                  <input
                    type="text"
                    value={nomeTabela ?? ""}
                    onChange={(e) => setNomeTabela(e.target.value)}
                    placeholder="Título da Planilha"
                    // O SEGREDO ESTÁ AQUI: min-w-0 anula a largura padrão do navegador!
                    className="col-start-1 row-start-1 w-full ml-4 min-w-0 bg-transparent border-none p-0 m-0 text-2xl md:text-4xl font-black text-slate-900 dark:text-white focus:outline-none focus:ring-0 placeholder:text-slate-200 dark:placeholder:text-slate-800"
                  />
                </div>
                {/* Ajustei para ml-1 para dar apenas 4px de respiro. Se quiser 100% grudado, use ml-0 */}
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm self-start">
              <Avatar className="h-8 w-8 rounded-xl">
                <AvatarImage src={perfilUsuario?.avatar_url} />
                <AvatarFallback className="bg-sky-500 text-[10px] text-white">
                  {perfilUsuario?.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col pr-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Responsável</span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{perfilUsuario?.full_name || "Carregando..."}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <form onSubmit={handleSubmit}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                    <TableHead className="w-12 text-center text-[9px] font-bold text-slate-300">#</TableHead>
                    {model.dados?.map((field: any, index: number) => (
                      <TableHead key={index} className="px-4 py-3 min-w-[160px]">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm">{getFieldIcon(field.type)}</div>
                          <span className="text-[10px] font-black uppercase text-slate-500">{field.name}</span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex} className="group border-b hover:bg-sky-50/30 transition-colors">
                      <TableCell className="p-0 w-12 text-center">
                        <div className="relative flex items-center justify-center h-12">
                          <span className="font-mono text-[10px] text-slate-300 group-hover:opacity-0 transition-opacity">{rowIndex + 1}</span>
                          <Button type="button" variant="ghost" size="icon" className="absolute inset-0 h-full w-full opacity-0 group-hover:opacity-100 text-red-500" onClick={() => removeRow(rowIndex)}>
                            <MinusCircle size={16} />
                          </Button>
                        </div>
                      </TableCell>

                      {model.dados?.map((field: any, colIndex: number) => (
                        <TableCell key={colIndex} className="p-0 relative border-r last:border-r-0">
                          <div className="flex items-center h-full w-full px-4 py-3.5">
                            {field.type === "currency" ? (
                              <div className="flex items-center w-full">
                                <span className="text-[10px] font-bold text-emerald-500/50 mr-1.5">R$</span>
                                <input className="w-full bg-transparent border-none text-sm font-semibold outline-none" value={row[field.name] ?? ""} onChange={(e) => handleInputChange(rowIndex, field.name, e.target.value, "currency")} />
                              </div>
                            ) : field.type === "percentage" ? (
                              <div className="flex items-center w-full">
                                <input type="number" className="w-full bg-transparent border-none focus:ring-0 text-sm font-semibold outline-none text-right text-slate-700 dark:text-slate-200" value={row[field.name] ?? ""} onChange={(e) => handleInputChange(rowIndex, field.name, e.target.value)} />
                                <span className="text-[10px] font-bold text-indigo-500/50 ml-1.5">%</span>
                              </div>
                            ) : (
                              <input type={field.type === "date" ? "date" : "text"} className="w-full bg-transparent border-none text-sm font-semibold outline-none" value={row[field.name] ?? ""} onChange={(e) => handleInputChange(rowIndex, field.name, e.target.value)} />
                            )}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="p-4 flex items-center justify-between bg-white dark:bg-slate-900 border-t">
              <Button type="button" variant="ghost" onClick={addRow} className="rounded-full text-sky-600 font-bold text-[11px] gap-2">
                <Plus size={16} /> Adicionar Linha
              </Button>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-1.5 rounded-full border">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase">{rows.length} Linhas</span>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <FileUp className="text-sky-500" /> Mapear Colunas
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            {model.dados?.map((field: any) => (
              <div key={field.name} className="flex flex-col gap-1.5 p-2 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase text-slate-400">{field.name}</label>
                  <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">{field.type}</span>
                </div>
                <Select value={mapping[field.name]} onValueChange={(val) => setMapping({ ...mapping, [field.name]: val })}>
                  <SelectTrigger className="rounded-xl h-9 border-slate-200">
                    <SelectValue placeholder="Ignorar campo" />
                  </SelectTrigger>
                  <SelectContent>
                    {importedHeaders.map(h => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={confirmImport} className="w-full rounded-full bg-sky-600 hover:bg-sky-700 font-bold">Confirmar Importação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}