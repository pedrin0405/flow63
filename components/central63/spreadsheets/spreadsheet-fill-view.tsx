"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Send, 
  FileSpreadsheet, 
  Building2, 
  Info,
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  Layout,
  Edit3,
  Type,
  DollarSign,
  Calendar as CalendarIcon,
  Percent,
  MinusCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

  const getFieldIcon = (type: string) => {
    switch (type) {
      case "currency": return <DollarSign size={12} className="text-emerald-500" />;
      case "percentage": return <Percent size={12} className="text-indigo-500" />;
      case "date": return <CalendarIcon size={12} className="text-amber-500" />;
      default: return <Type size={12} className="text-sky-500" />;
    }
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    if (!numericValue) return "";
    return (Number(numericValue) / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleInputChange = (index: number, fieldName: string, value: string, type?: string) => {
    const newRows = [...rows];
    if (type === "currency") {
      newRows[index][fieldName] = formatCurrency(value);
    } else {
      newRows[index][fieldName] = value;
    }
    setRows(newRows);
  };

  const addRow = () => {
    setRows([...rows, createEmptyRow()]);
  };

  const removeRow = (index: number) => {
    if (rows.length === 1) {
      setRows([createEmptyRow()]);
      return;
    }
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
        criado_por: model.criado_por,
        dados: rows,
        data_preenchimento: new Date().toISOString()
      };

      await onSaveData(payload);
      toast.success(`${rows.length} linha(s) salva(s) com sucesso!`);
    } catch (error) {
      toast.error("Erro ao salvar os dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[98vw] mx-auto p-2 md:p-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            onClick={onBack} 
            className="rounded-full h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={18} className="text-slate-500" /> 
          </Button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-sky-500 uppercase tracking-tight leading-none">Editor</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[120px] md:max-w-full">{model.nome}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="rounded-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold h-8 px-4 shadow-md transition-all active:scale-95 gap-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin h-3 w-3" /> : <Send size={14} />}
            <span>Finalizar</span>
          </Button>
        </div>
      </div>

      <Card className="rounded-3xl border-none shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden bg-white dark:bg-slate-950">
        <CardHeader className="p-6 md:p-8 bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-950 border-b border-slate-100 dark:border-slate-900">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 space-y-1 group">
              <div className="flex items-center gap-2 text-[10px] font-black text-sky-500 uppercase tracking-widest ml-1">
                <Building2 size={12} />
                {model.unidade || "Geral"}
              </div>
              
              <div className="relative flex items-center max-w-fit">
                <Input 
                  value={nomeTabela ?? ""}
                  onChange={(e) => setNomeTabela(e.target.value)}
                  placeholder="Título da Planilha"
                  className={cn(
                    "h-auto p-0 text-2xl md:text-4xl font-black bg-transparent border-none shadow-none focus-visible:ring-0 tracking-tight text-slate-900 dark:text-white",
                    "placeholder:text-slate-200 dark:placeholder:text-slate-800"
                  )}
                />
                <Edit3 size={16} className="ml-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm self-start">
               <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-[10px] font-bold text-white shadow-inner">
                 {model.criado_por?.charAt(0).toUpperCase() || "U"}
               </div>
               <div className="flex flex-col pr-2">
                 <span className="text-[9px] font-bold text-slate-400 uppercase leading-none tracking-tighter">Responsável</span>
                 <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{model.criado_por || "Usuário"}</span>
               </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <form onSubmit={handleSubmit}>
            <div className="overflow-x-auto">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="bg-slate-50/50 dark:bg-slate-900/50 border-none">
                    {/* Cabeçalho de controle ajustado */}
                    <TableHead className="w-12 text-center text-[9px] font-bold text-slate-300 uppercase">#</TableHead>
                    {model.dados?.map((field: any, index: number) => (
                      <TableHead key={index} className="px-4 py-3 min-w-[160px] border-r border-slate-200/20 last:border-r-0">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                            {getFieldIcon(field.type)}
                          </div>
                          <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wide">
                            {field.name}
                          </span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex} className="group border-b border-slate-100 dark:border-slate-900 hover:bg-sky-50/30 dark:hover:bg-sky-900/10 transition-colors">
                      
                      {/* Célula de Índice com Botão de Deletar Integrado (Solução Intuitiva) */}
                      <TableCell className="p-0 w-12 text-center bg-slate-50/20 dark:bg-slate-900/10">
                        <div className="relative flex items-center justify-center h-12 w-full">
                          <span className="font-mono text-[10px] text-slate-300 group-hover:opacity-0 transition-opacity">
                            {rowIndex + 1}
                          </span>
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="icon" 
                            className="absolute inset-0 h-full w-full rounded-none opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                            onClick={() => removeRow(rowIndex)}
                          >
                            <MinusCircle size={16} />
                          </Button>
                        </div>
                      </TableCell>
                      
                      {model.dados?.map((field: any, colIndex: number) => (
                        <TableCell key={colIndex} className="p-0 relative border-r border-slate-100/30 last:border-r-0">
                          <div className="flex items-center h-full w-full group/cell px-4 py-3.5">
                            {field.type === "currency" ? (
                              <div className="flex items-center w-full">
                                <span className="text-[10px] font-bold text-emerald-500/50 mr-1.5">R$</span>
                                <input 
                                  type="text"
                                  className="w-full bg-transparent border-none focus:ring-0 text-sm font-semibold outline-none text-slate-700 dark:text-slate-200"
                                  value={row[field.name] ?? ""}
                                  placeholder="0,00"
                                  onChange={(e) => handleInputChange(rowIndex, field.name, e.target.value, "currency")}
                                />
                              </div>
                            ) : field.type === "percentage" ? (
                              <div className="flex items-center w-full">
                                <input 
                                  type="number"
                                  className="w-full bg-transparent border-none focus:ring-0 text-sm font-semibold outline-none text-right text-slate-700 dark:text-slate-200"
                                  value={row[field.name] ?? ""}
                                  onChange={(e) => handleInputChange(rowIndex, field.name, e.target.value)}
                                />
                                <span className="text-[10px] font-bold text-indigo-500/50 ml-1.5">%</span>
                              </div>
                            ) : field.type === "date" ? (
                              <input 
                                type="date"
                                className="w-full bg-transparent border-none focus:ring-0 text-sm font-semibold outline-none text-slate-700 dark:text-slate-200"
                                value={row[field.name] ?? ""}
                                onChange={(e) => handleInputChange(rowIndex, field.name, e.target.value)}
                              />
                            ) : (
                              <input 
                                type={field.type === "number" ? "number" : "text"}
                                className="w-full bg-transparent border-none focus:ring-0 text-sm font-semibold outline-none text-slate-700 dark:text-slate-200 placeholder-slate-200 dark:placeholder-slate-800"
                                placeholder="..."
                                value={row[field.name] ?? ""}
                                onChange={(e) => handleInputChange(rowIndex, field.name, e.target.value)}
                              />
                            )}
                            <div className="absolute inset-0 border-2 border-sky-500/0 group-focus-within/cell:border-sky-500/40 pointer-events-none rounded-xl m-1 transition-all" />
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="p-4 flex items-center justify-between bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={addRow}
                className="rounded-full text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 font-bold text-[11px] gap-2 h-9 px-5 transition-all active:scale-95"
              >
                <Plus size={16} /> Adicionar Linha
              </Button>

              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-1.5 rounded-full border border-slate-100 dark:border-slate-700 shadow-inner">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{rows.length} Linhas</span>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}