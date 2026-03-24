'use client';

import React, { useEffect, useRef } from 'react';
import { useFabricEditor } from '@/hooks/use-fabric-editor';
import { cn } from '@/lib/utils';
import { Layout } from 'lucide-react';

interface ArtboardProps {
  id: string;
  title: string;
  width: number;
  height: number;
  isActive: boolean;
  onSelect: (id: string, methods: any) => void;
  onMethodsReady: (id: string, methods: any) => void;
  initialData?: any;
  zoomLevel: number;
}

export const Artboard = ({
  id,
  title,
  width,
  height,
  isActive,
  onSelect,
  onMethodsReady,
  initialData,
  zoomLevel
}: ArtboardProps) => {
  const methods = useFabricEditor();
  const { canvasRef, fabricCanvas, loadFromJson, selectedObject, canUndo, canRedo, changeCount, isDisposed } = methods;
  const isInitialized = useRef(false);

  // Initialize with data if provided or if canvas is empty
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    
    const initCanvas = async () => {
      console.log(`[Artboard ${id}] Initing canvas...`, { hasInitialData: !!initialData });
      
      // Verifica se o fabricCanvas.current já existe
      if (!fabricCanvas.current) {
        if (isMounted) setTimeout(initCanvas, 50);
        return;
      }

      // Verifica se o canvas está realmente pronto (possui contexto)
      if (!fabricCanvas.current.getContext()) {
        if (isMounted) setTimeout(initCanvas, 50);
        return;
      }

      // Carrega dados se for a primeira vez OU se o canvas estiver vazio mas tivermos dados iniciais
      const objects = fabricCanvas.current.getObjects();
      const alreadyInitialized = isInitialized.current;

      if (initialData && (objects.length === 0 || !alreadyInitialized)) {
        if (!isMounted || isDisposed.current) return;
        try {
          console.log(`[Artboard ${id}] Loading initial data...`);
          await loadFromJson(initialData);
          console.log(`[Artboard ${id}] Data loaded successfully.`);
        } catch (err) {
          console.error(`[Artboard ${id}] Erro ao carregar JSON:`, err);
        }
      } 
      
      // Sempre registra os métodos na primeira vez, independente de ter dados ou não
      if (isMounted) {
        if (!alreadyInitialized || isInitialized.current) {
          if (!isDisposed.current) {
            console.log(`[Artboard ${id}] Registering methods to parent...`);
            isInitialized.current = true;
            onMethodsReady(id, methods);
          }
        }
      }
    };

    // Pequeno delay inicial para permitir que o useFabricEditor inicialize o canvas
    const startTimer = setTimeout(initCanvas, 20);
    
    return () => {
      isMounted = false;
      clearTimeout(startTimer);
    };
  }, [fabricCanvas.current, initialData, id, isDisposed]);

  // Update dimensions when size changes
  useEffect(() => {
    if (fabricCanvas.current && !isDisposed.current) {
      try {
        fabricCanvas.current.setDimensions({ width, height });
        fabricCanvas.current.renderAll();
      } catch (e) {
        // Silently handle errors if canvas is in a weird state during resize
      }
    }
  }, [width, height, isDisposed]);

  // Notify parent about state changes if active or if context menu is requested
  useEffect(() => {
    if (isDisposed.current) return;
    
    if (isActive || methods.contextMenuInfo.visible) {
      // Pequeno delay para garantir que o estado do editor está estável
      const timer = setTimeout(() => {
        if (!isDisposed.current) {
          onSelect(id, methods);
        }
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [selectedObject, canUndo, canRedo, changeCount, isActive, id, methods.contextMenuInfo.visible, isDisposed]);

  return (
    <div className="flex flex-col gap-3 mb-16 last:mb-0 items-center">
      <div className="flex items-center justify-between w-full max-w-full px-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
            isActive 
              ? "bg-blue-600 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-50" 
              : "bg-slate-200 text-slate-500 shadow-sm"
          )}>
            <Layout className="w-3 h-3" />
            {title}
          </div>
          <span className="text-[10px] font-medium text-slate-400">
            {width} × {height}px
          </span>
        </div>
      </div>
      
      <div 
        className={cn(
          "relative transition-all duration-300 ease-out cursor-pointer",
          isActive 
            ? "ring-4 ring-blue-500/30 shadow-[0_20px_50px_rgba(59,130,246,0.15)] z-10 scale-[1.002]" 
            : "ring-1 ring-slate-200 shadow-xl hover:ring-slate-300 hover:shadow-2xl"
        )}
        onClick={() => onSelect(id, methods)}
        onContextMenu={(e) => {
          onSelect(id, methods);
        }}
        style={{ 
          width: width * zoomLevel, 
          height: height * zoomLevel 
        }}
      >
        {/* Background layer to prevent transparency bleed */}
        <div className="absolute inset-0 bg-white" />
        
        <div 
          className="absolute top-0 left-0 overflow-hidden"
          style={{
            width: width,
            height: height,
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top left'
          }}
        >
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
};
