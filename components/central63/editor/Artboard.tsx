'use client';

import React, { useEffect, useRef } from 'react';
import { useFabricEditor } from '@/hooks/use-fabric-editor';
import { cn } from '@/lib/utils';

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
  const { canvasRef, fabricCanvas, loadFromJson, selectedObject, canUndo, canRedo, changeCount } = methods;
  const isInitialized = useRef(false);

  // Initialize with data if provided
  useEffect(() => {
    let isMounted = true;
    
    const initCanvas = async () => {
      // Pequena espera inicial para garantir que o Fabric Canvas foi criado pelo hook
      await new Promise(resolve => setTimeout(resolve, 100));

      if (fabricCanvas.current && !isInitialized.current) {
        // Verifica se o canvas está realmente pronto (possui contexto)
        if (!fabricCanvas.current.getContext()) {
          if (isMounted) setTimeout(initCanvas, 50); // Tenta novamente
          return;
        }

        if (initialData) {
          await loadFromJson(initialData);
        }
        
        if (isMounted) {
          isInitialized.current = true;
          onMethodsReady(id, methods);
        }
      }
    };

    initCanvas();
    
    return () => {
      isMounted = false;
    };
  }, [fabricCanvas.current, initialData, id]);

  // Update dimensions when size changes
  useEffect(() => {
    if (fabricCanvas.current) {
      fabricCanvas.current.setDimensions({ width, height });
      fabricCanvas.current.renderAll();
    }
  }, [width, height]);

  // Notify parent about state changes if active
  useEffect(() => {
    if (isActive) {
      onSelect(id, methods);
    }
  }, [selectedObject, canUndo, canRedo, changeCount, isActive, id, onSelect, methods]);

  return (
    <div className="flex flex-col gap-2 mb-12 last:mb-0 items-center">
      <div className="flex items-center justify-between w-full max-w-full px-1">
        <span className={cn(
          "text-[11px] font-bold uppercase tracking-wider transition-colors",
          isActive ? "text-blue-600" : "text-slate-400"
        )}>
          {title} — {width}x{height}px
        </span>
      </div>
      
      <div 
        className={cn(
          "relative transition-all duration-200 ease-out cursor-pointer",
          isActive ? "ring-2 ring-blue-500 shadow-2xl z-10" : "ring-1 ring-slate-200 shadow-md hover:ring-slate-300"
        )}
        onClick={() => onSelect(id, methods)}
        style={{ 
          width: width * zoomLevel, 
          height: height * zoomLevel 
        }}
      >
        <div 
          className="absolute top-0 left-0 bg-white overflow-hidden"
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
