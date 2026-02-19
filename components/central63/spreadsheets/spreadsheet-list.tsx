"use client";

import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MoreHorizontal, FileText, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SpreadsheetData {
  id: string;
  name: string;
  model: string;
  date: string;
  secretary: string;
  status: string;
}

interface SpreadsheetListProps {
  data: SpreadsheetData[];
}

export function SpreadsheetList({ data }: SpreadsheetListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[300px]">Nome da Planilha</TableHead>
          <TableHead>Modelo Utilizado</TableHead>
          <TableHead>Secretaria</TableHead>
          <TableHead>Data de Criação</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length > 0 ? (
          data.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                {item.name}
              </TableCell>
              <TableCell>{item.model}</TableCell>
              <TableCell>
                <Badge variant="outline" className="font-normal">
                  {item.secretary}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{item.date}</TableCell>
              <TableCell>
                <Badge 
                  variant={item.status === "Finalizado" ? "default" : "secondary"}
                  className={item.status === "Finalizado" ? "bg-green-500 hover:bg-green-600" : ""}
                >
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuItem className="cursor-pointer gap-2">
                      <Eye className="h-4 w-4" /> Visualizar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer gap-2">
                      <Download className="h-4 w-4" /> Exportar (XLSX)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive gap-2">
                      Excluir Planilha
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
              Nenhuma planilha encontrada.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}