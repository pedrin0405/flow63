'use client';

import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, ChevronLeft, RefreshCw, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface PageProps {
  params: { templateId: string };
  searchParams: { propertyId?: string };
}

export default function MagicFillPage({ params, searchParams }: PageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  // 1. Função que realiza a "Mágica" da substituição
  const applyMagicFilling = (canvas: fabric.Canvas, data: any) => {
    const objects = canvas.getObjects();
    
    objects.forEach((obj: any) => {
      // Verifica se o objeto é de texto e tem um ID de variável associado
      if (obj.type === 'i-text' || obj.type === 'text') {
        const varId = obj.variableId; // Atributo customizado que salvamos no editor

        if (varId && data[varId]) {
          obj.set('text', String(data[varId]));
        }
      }

      // Se for uma imagem e tiver ID de variável (ex: foto_imovel)
      if (obj.type === 'image' && obj.variableId === 'foto_principal') {
        if (data.foto_url) {
          fabric.Image.fromURL(data.foto_url, (img) => {
            // Mantém a posição e escala do objeto original
            img.set({
              left: obj.left,
              top: obj.top,
              scaleX: obj.width! * obj.scaleX! / img.width!,
              scaleY: obj.height! * obj.scaleY! / img.height!,
            });
            canvas.remove(obj);
            canvas.add(img);
            canvas.renderAll();
          });
        }
      }
    });

    canvas.renderAll();
  };

  const loadDataAndTemplate = async () => {
    try {
      setLoading(true);

      // Busca o modelo no Supabase
      const { data: template, error: tError } = await supabase
        .from('editor_templates')
        .select('*')
        .eq('id', params.templateId)
        .single();

      if (tError) throw tError;

      // Busca os dados do imóvel (exemplo usando sua estrutura de propriedades)
      let propertyData = {};
      if (searchParams.propertyId) {
        const { data: prop } = await supabase
          .from('properties')
          .select('*')
          .eq('id', searchParams.propertyId)
          .single();
        
        // Mapeia os campos do banco para os IDs das variáveis do editor
        propertyData = {
          'valor_imovel': new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prop.price),
          'endereco_imovel': `${prop.address}, ${prop.neighborhood}`,
          'quartos': `${prop.bedrooms} Quartos`,
          'area': `${prop.area_sqm}m²`,
          'foto_url': prop.main_image_url
        };
      }

      // Inicializa o Canvas com o JSON do modelo
      if (canvasRef.current) {
        const canvas = new fabric.Canvas(canvasRef.current, {
          width: 800,
          height: 800,
          backgroundColor: '#f3f4f6'
        });
        fabricRef.current = canvas;

        canvas.loadFromJSON(template.canvas_json, () => {
          // Após carregar o layout, aplica os dados dinâmicos
          applyMagicFilling(canvas, propertyData);
          setLoading(false);
        });
      }
    } catch (error) {
      console.error('Erro na mágica:', error);
      toast.error('Erro ao carregar modelo dinâmico');
    }
  };

  useEffect(() => {
    loadDataAndTemplate();
    return () => fabricRef.current?.dispose();
  }, [params.templateId, searchParams.propertyId]);

  const handleDownload = () => {
    setGenerating(true);
    const dataUrl = fabricRef.current?.toDataURL({
      format: 'png',
      multiplier: 2, // Dobra a resolução para melhor qualidade
    });

    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `arte-imovel-${searchParams.propertyId}.png`;
      link.href = dataUrl;
      link.click();
    }
    setGenerating(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      {/* Header de Ações */}
      <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
          <h1 className="font-semibold text-slate-800">Visualização da Arte</h1>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadDataAndTemplate()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Atualizar Dados
          </Button>
          <Button onClick={handleDownload} disabled={generating}>
            <Download className="w-4 h-4 mr-2" /> 
            {generating ? 'Gerando...' : 'Baixar Arte (PNG)'}
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="w-[600px] h-[600px] rounded-lg" />
            <div className="flex justify-center gap-4">
              <Skeleton className="w-32 h-10" />
              <Skeleton className="w-32 h-10" />
            </div>
          </div>
        ) : (
          <Card className="shadow-2xl overflow-hidden bg-white border-none">
            <canvas ref={canvasRef} />
          </Card>
        )}
      </main>

      {/* Dica para o usuário */}
      <div className="bg-blue-50 border-t border-blue-100 p-3 text-center text-sm text-blue-700">
        Esta arte foi gerada automaticamente com os dados do imóvel selecionado. 
        Você pode alterar o imóvel na sua lista para gerar novas versões.
      </div>
    </div>
  );
}