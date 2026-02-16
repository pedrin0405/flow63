"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
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
  Layout
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

  // Função auxiliar para formatar moeda automaticamente
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
    // Se for moeda, aplica a formatação automática
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
    <div className="w-full max-w-[98vw] mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={onBack} 
            className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 gap-2 h-11 px-4 shadow-sm"
          >
            <ArrowLeft size={18} /> 
            <span>Voltar</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Preencher Planilha
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <Layout size={14} />
              Modelo: <span className="font-semibold text-slate-700 dark:text-slate-300">{model.nome}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 px-4 py-2.5 rounded-2xl">
          <div className="p-1.5 bg-blue-500 rounded-lg shadow-sm shadow-blue-200">
            <Info size={14} className="text-white" />
          </div>
          <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
            Edição Dinâmica Ativada
          </span>
        </div>
      </div>

      <Card className="rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden bg-white dark:bg-slate-950">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-6 md:px-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
               <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest">
                <Building2 size={12} />
                {model.unidade || "Unidade Geral"}
              </div>
              <CardTitle className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
                Entrada de Dados
              </CardTitle>
            </div>
          </div>
          
          <div className="flex items-center gap-4 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm">
              <div className="text-right">
                <p className="text-[9px] uppercase font-bold text-slate-400">Responsável</p>
                <p className="text-xs text-slate-700 dark:text-slate-200 font-bold">{model.criado_por || "Não definido"}</p>
              </div>
              <div className="h-8 w-px bg-slate-100 dark:bg-slate-700" />
              <div className="flex -space-x-2">
                <div className="h-8 w-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold">U</div>
              </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <form onSubmit={handleSubmit}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
                  <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                    <TableHead className="w-16 px-6 text-center text-[10px] font-black uppercase text-slate-400">Linha</TableHead>
                    {model.dados?.map((field: any, index: number) => (
                      <TableHead key={index} className="px-4 py-5 min-w-[200px] border-r border-slate-100 dark:border-slate-800 last:border-r-0">
                        <span className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">
                          {field.name}
                        </span>
                      </TableHead>
                    ))}
                    <TableHead className="w-16 px-4 text-center"><Trash2 size={14} className="text-slate-300 mx-auto"/></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/30 group transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <TableCell className="text-center font-mono text-[11px] font-bold text-slate-400 bg-slate-50/30 dark:bg-slate-900/30">
                        {String(rowIndex + 1).padStart(2, '0')}
                      </TableCell>
                      
                      {model.dados?.map((field: any, colIndex: number) => (
                        <TableCell key={colIndex} className="p-0 border-r border-slate-100 dark:border-slate-800 last:border-r-0 relative">
                          <div className="relative h-full w-full group/cell flex items-center">
                            {field.type === "currency" ? (
                              <div className="flex items-center w-full px-4 py-4 bg-transparent group-focus-within/cell:bg-white dark:group-focus-within/cell:bg-slate-900 transition-all">
                                <span className="text-sm font-bold text-slate-400 mr-2">R$</span>
                                <input 
                                  type="text"
                                  className="w-full bg-transparent border-none focus:ring-0 text-sm font-semibold outline-none text-slate-700 dark:text-slate-200"
                                  value={row[field.name]}
                                  placeholder="0,00"
                                  onChange={(e) => handleInputChange(rowIndex, field.name, e.target.value, "currency")}
                                />
                              </div>
                            ) : field.type === "percentage" ? (
                              <div className="flex items-center w-full px-4 py-4 bg-transparent group-focus-within/cell:bg-white dark:group-focus-within/cell:bg-slate-900 transition-all">
                                <input 
                                  type="number"
                                  className="w-full bg-transparent border-none focus:ring-0 text-sm font-semibold outline-none text-right text-slate-700 dark:text-slate-200"
                                  value={row[field.name]}
                                  onChange={(e) => handleInputChange(rowIndex, field.name, e.target.value)}
                                />
                                <span className="text-sm font-bold text-slate-400 ml-2">%</span>
                              </div>
                            ) : field.type === "date" ? (
                              <input 
                                type="date"
                                className="w-full h-full px-4 py-4 bg-transparent border-none focus:ring-0 text-sm font-semibold outline-none text-slate-700 dark:text-slate-200 group-focus-within/cell:bg-white dark:group-focus-within/cell:bg-slate-900"
                                value={row[field.name]}
                                onChange={(e) => handleInputChange(rowIndex, field.name, e.target.value)}
                              />
                            ) : (
                              <input 
                                type={field.type === "number" ? "number" : "text"}
                                className="w-full h-full px-4 py-4 bg-transparent border-none focus:ring-0 text-sm font-semibold outline-none text-slate-700 dark:text-slate-200 placeholder-slate-300 group-focus-within/cell:bg-white dark:group-focus-within/cell:bg-slate-900"
                                placeholder="Clique para digitar..."
                                value={row[field.name]}
                                onChange={(e) => handleInputChange(rowIndex, field.name, e.target.value)}
                              />
                            )}
                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary opacity-0 group-focus-within/cell:opacity-100 transition-opacity z-10" />
                          </div>
                        </TableCell>
                      ))}

                      <TableCell className="p-0 text-center">
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                          onClick={() => removeRow(rowIndex)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={addRow}
                className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all font-bold gap-2 h-12 px-6"
              >
                <Plus size={18} /> Adicionar Nova Linha
              </Button>
            </div>

            <div className="p-6 md:p-10 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-6 items-center justify-between">
              <div className="flex items-center gap-4 text-slate-500">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-2xl border border-green-100 dark:border-green-800/30">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total de Entradas</p>
                  <p className="text-base font-bold text-slate-700 dark:text-slate-200">
                    {rows.length} {rows.length === 1 ? 'registro pronto' : 'registros prontos'}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 w-full md:w-auto">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="flex-1 md:flex-none h-12 rounded-xl px-8 font-bold text-slate-500"
                  onClick={onBack}
                >
                  Descartar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 md:flex-none h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-black px-10 shadow-lg shadow-primary/25 transition-all active:scale-95 gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> 
                      <span>Salvar Planilha</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}