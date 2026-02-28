'use client';

import React from 'react';
import { useFabricEditor } from '@/hooks/use-fabric-editor';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Type, Image as ImageIcon, Download, Save, Layers } from 'lucide-react';

export function VisualEditor() {
  const { canvasRef, addText, addImage, exportToImage, saveToJson } = useFabricEditor();

  const handleDownload = () => {
    const dataUrl = exportToImage();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = 'minha-arte.png';
      link.href = dataUrl;
      link.click();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Barra Lateral de Ferramentas */}
      <Card className="w-64 m-4 p-4 flex flex-col gap-4">
        <h3 className="font-bold text-lg">Elementos</h3>
        <Button variant="outline" onClick={() => addText()} className="justify-start">
          <Type className="mr-2 h-4 w-4" /> Texto
        </Button>
        <Button variant="outline" onClick={() => addImage('https://via.placeholder.com/150')} className="justify-start">
          <ImageIcon className="mr-2 h-4 w-4" /> Imagem
        </Button>
        
        <div className="mt-auto flex flex-col gap-2">
          <Button onClick={() => console.log(saveToJson())} variant="secondary">
            <Save className="mr-2 h-4 w-4" /> Salvar Modelo
          </Button>
          <Button onClick={handleDownload} variant="default">
            <Download className="mr-2 h-4 w-4" /> Baixar PNG
          </Button>
        </div>
      </Card>

      {/* Área do Canvas */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
        <div className="shadow-2xl border bg-white">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}