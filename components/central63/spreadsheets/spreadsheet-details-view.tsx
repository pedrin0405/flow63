"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileSpreadsheet, Building2, Calendar, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function SpreadsheetDetailsView({ data, onBack }: { data: any, onBack: () => void }) {
  // Pegamos as chaves do primeiro objeto para criar o cabeçalho da tabela
  const columns = data.dados && data.dados.length > 0 ? Object.keys(data.dados[0]) : [];

  return (
    <div className="w-full max-w-[98vw] mx-auto p-4 md:p-6 animate-in fade-in duration-500">
      <Button variant="ghost" onClick={onBack} className="mb-6 gap-2 rounded-xl font-bold">
        <ArrowLeft size={18} /> Voltar para a Lista
      </Button>

      <Card className="rounded-[2rem] border-none shadow-2xl overflow-hidden bg-white dark:bg-slate-950">
        <CardHeader className="bg-blue-600 text-white p-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 text-blue-100 text-[10px] font-black uppercase tracking-widest mb-2">
                <Building2 size={12} /> {data.unidade} | {data.secretaria}
              </div>
              <CardTitle className="text-3xl font-black">{data.modelo_tabela}</CardTitle>
              <div className="flex gap-4 mt-4 text-blue-100 text-xs">
                <span className="flex items-center gap-1"><User size={14}/> {data.preenchido_por}</span>
                <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(data.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
            <FileSpreadsheet className="h-12 w-12 opacity-20" />
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900">
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col} className="font-black uppercase text-[10px] text-slate-500 px-6 py-4">
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.dados?.map((row: any, i: number) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col} className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                      {row[col]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}