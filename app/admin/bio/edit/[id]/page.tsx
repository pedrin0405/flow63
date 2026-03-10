"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BioEditor from "@/components/central63/bio-editor";
import { toast } from "sonner";

export default function EditBioPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="p-8">Carregando editor...</div>;
  if (!data) return <div className="p-8">Página não encontrada.</div>;

  return <BioEditor initialData={data} id={id as string} />;
}
