"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BioEditor from "@/components/central63/bio-editor";
import { toast } from "sonner";
import { Sidebar } from "@/components/central63/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditBioPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("bio-admin");

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: bio, error } = await supabase
          .from("bio_pages")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setData(bio);
      } catch (error: any) {
        toast.error("Erro ao carregar dados: " + error.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchData();
  }, [id]);

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={(tab: string) => { setActiveTab(tab); setSidebarOpen(false); }}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {loading ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Top Bar Mimic */}
            <div className="h-16 border-b flex items-center justify-between px-8 shrink-0 bg-card/50">
              <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-32 rounded-lg" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-9 w-32 rounded-lg" />
              </div>
            </div>
            {/* Content Area Mimic */}
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar Mimic */}
              <div className="w-80 border-r p-6 space-y-6 shrink-0 bg-card/30">
                <Skeleton className="h-10 w-full rounded-xl" />
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              </div>
              {/* Preview Mimic */}
              <div className="flex-1 p-8 flex justify-center bg-accent/5 overflow-y-auto">
                <Skeleton className="w-full max-w-md h-[800px] rounded-[3rem]" />
              </div>
            </div>
          </div>
        ) : data ? (
          <BioEditor initialData={data} id={id as string} />
        ) : (
          <div className="p-8">Página não encontrada.</div>
        )}
      </main>
    </div>
  );
}
