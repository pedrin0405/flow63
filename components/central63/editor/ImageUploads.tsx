'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; 
import { Button } from '@/components/ui/button';
import { Upload, Plus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadsProps {
  onImageSelect: (url: string) => void;
}

export function ImageUploads({ onImageSelect }: ImageUploadsProps) {
  const [images, setImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserImages();
  }, []);

  const fetchUserImages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('user_uploads')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error("Erro ao buscar índice de imagens:", error);
    setImages(data || []);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("Você precisa estar logado para fazer upload.");
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // 1. Upload para o Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw new Error(`Erro no Storage: ${uploadError.message}`);

      // 2. Pegar URL Pública
      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(fileName);

      // 3. Salvar referência na tabela SQL
      const { error: dbError } = await supabase.from('user_uploads').insert({
        user_id: user.id,
        url: publicUrl,
        name: file.name
      });

      if (dbError) throw new Error("Erro ao registrar imagem no banco de dados.");

      toast.success("Imagem pronta para uso!");
      fetchUserImages();
    } catch (error: any) {
      console.error("Falha no processo de upload:", error);
      toast.error(error.message || "Erro desconhecido ao fazer upload.");
    } finally {
      setUploading(false);
    }
  };

  // --- NOVA FUNÇÃO: EXCLUIR IMAGEM ---
  const handleDeleteImage = async (e: React.MouseEvent, img: any) => {
    e.stopPropagation(); // Impede que o clique adicione a imagem ao Canvas
    
    if (!window.confirm("Tem certeza que deseja apagar esta imagem permanentemente?")) return;

    try {
      setDeletingId(img.id);
      
      // 1. Extrair o caminho do arquivo físico no Storage a partir da URL
      // Ex: Pega apenas "USER_ID/12345.png" da URL pública
      const filePathMatch = img.url.match(/user-uploads\/(.+)$/);
      
      if (filePathMatch && filePathMatch[1]) {
        const filePath = filePathMatch[1];
        // 2. Apagar do Storage
        await supabase.storage.from('user-uploads').remove([filePath]);
      }

      // 3. Apagar da tabela no banco de dados
      const { error } = await supabase.from('user_uploads').delete().eq('id', img.id);
      if (error) throw error;

      toast.success("Imagem excluída com sucesso!");
      
      // Remove a imagem da tela sem precisar recarregar a página
      setImages((prevImages) => prevImages.filter((i) => i.id !== img.id));
      
    } catch (error: any) {
      console.error("Erro ao excluir imagem:", error);
      toast.error("Erro ao excluir imagem.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="file"
          id="image-upload"
          className="hidden"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
        />
        <label htmlFor="image-upload" className="cursor-pointer">
          <div className="w-full h-24 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-slate-50 transition-all">
            {uploading ? <Loader2 className="animate-spin text-primary" /> : <Upload className="w-6 h-6 text-slate-400" />}
            <span className="text-xs font-medium text-slate-500">
              {uploading ? "Processando..." : "Subir Minha Imagem"}
            </span>
          </div>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {images.map((img) => (
          <div 
            key={img.id} 
            className="group relative aspect-square bg-slate-50 rounded-lg overflow-hidden border cursor-pointer hover:border-primary transition-all"
            onClick={() => onImageSelect(img.url)}
          >
            <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
            
            {/* Camada escura de Hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Plus className="text-white w-6 h-6" />
            </div>

            {/* BOTÃO DE EXCLUIR (No topo direito) */}
            <button
              onClick={(e) => handleDeleteImage(e, img)}
              disabled={deletingId === img.id}
              className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 z-10"
              title="Excluir imagem"
            >
              {deletingId === img.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}