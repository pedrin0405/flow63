"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  ExternalLink, 
  Edit2, 
  BarChart2, 
  MoreVertical,
  Trash2,
  Copy
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import Link from "next/link";

export default function BioAdminPage() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPages();
  }, []);

  async function fetchPages() {
    try {
      const { data, error } = await supabase
        .from("bio_pages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPages(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar páginas: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const copyToClipboard = (slug: string) => {
    const url = `${window.location.origin}/bio/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado para a área de transferência!");
  };

  const filteredPages = pages.filter(page => 
    page.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Links na Bio</h1>
          <p className="text-muted-foreground">Gerencie as páginas de links da sua equipe.</p>
        </div>
        <Link href="/admin/bio/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Nova Página
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome ou slug..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse bg-muted h-48" />
          ))
        ) : filteredPages.length > 0 ? (
          filteredPages.map((page) => (
            <Card key={page.id} className="group hover:shadow-md transition-all border-2 hover:border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-bold">{page.nome}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/bio/edit/${page.id}`} className="flex items-center gap-2">
                        <Edit2 className="w-4 h-4" /> Editar
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copyToClipboard(page.slug)} className="flex items-center gap-2 text-primary">
                      <Copy className="w-4 h-4" /> Copiar Link
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2 text-destructive">
                      <Trash2 className="w-4 h-4" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">/{page.slug}</p>
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BarChart2 className="w-4 h-4" /> 0 views
                    </span>
                  </div>
                  <Link href={`/bio/${page.slug}`} target="_blank">
                    <Button variant="secondary" size="sm" className="gap-2">
                      <ExternalLink className="w-4 h-4" /> Ver Página
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl">
            <p className="text-muted-foreground">Nenhuma página encontrada.</p>
          </div>
        )}
      </div>
    </div>
  );
}
