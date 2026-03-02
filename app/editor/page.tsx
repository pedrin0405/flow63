'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFabricEditor } from '@/hooks/use-fabric-editor';
import { ImageUploads } from '@/components/central63/editor/ImageUploads';
import { supabase } from '@/lib/supabase';
import { Sidebar } from '@/components/central63/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Type as TypeIcon, Image as ImageIcon, Download, Save, Trash2,
  MousePointer2, Layers, Sparkles, FlipHorizontal, FlipVertical,
  Maximize, ArrowUpToLine, ArrowDownToLine, CircleDashed, SquareDashed, ImagePlus,
  LayoutTemplate, Shapes, Palette, UploadCloud, Wand2, FolderHeart, Lock, Crown,
  CornerUpLeft, CornerUpRight, CornerDownLeft, CornerDownRight, Loader2, Share, Menu, Crop,
  ZoomIn, ZoomOut, Focus, LockOpen, Unlink, Move, Scissors, Check, X,
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ArrowRightToLine, Type, Paintbrush, Undo2, Redo2
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function EditorPrincipal() {
  const router = useRouter();
  const [canvasTitle, setCanvasTitle] = useState('Nova Arte Sem Título');
  const [isSaving, setIsSaving] = useState(false);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('editor'); 
  const [canvasSize, setCanvasSize] = useState({ width: 1080, height: 1080 });
  const [zoomLevel, setZoomLevel] = useState(1);

  const workspaceRef = useRef<HTMLElement>(null);

  const [savedModels, setSavedModels] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [currentModelId, setCurrentModelId] = useState<string | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const [gradColor1, setGradColor1] = useState('#3b82f6');
  const [gradColor2, setGradColor2] = useState('#1d4ed8');
  
  const {
    canvasRef, addText, addImage, addShape, addFrame, detachImageFromFrame, exportToImage, saveToJson, loadFromJson, clearCanvas,
    deleteSelected, setCornerRadii, toggleFlipX, toggleFlipY,
    setImageOpacity, centerObject, bringToFront, sendToBack, toggleLock, selectedObject, fabricCanvas,
    contextMenuInfo, setContextMenuInfo,
    isPanMode, togglePanMode, cropBox, startCrop, applyCrop, cancelCrop, removeCrop,
    changeTextColor, toggleBold, toggleItalic, toggleUnderline, toggleLinethrough, 
    setFontSize, setTextAlignment, toggleList, setLineHeight, setTextIndent, applyGradient,
    // NOVAS FUNÇÕES DE HISTÓRICO
    undo, redo, canUndo, canRedo
  } = useFabricEditor();

  const fetchModels = async () => {
    setIsLoadingModels(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data, error } = await supabase
        .from('design_models')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) setSavedModels(data);
    }

    const { data: templatesData, error: templatesError } = await supabase
      .from('design_templates')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!templatesError && templatesData) setTemplates(templatesData);

    setIsLoadingModels(false);
  };

  const calculateFitZoom = (width: number, height: number) => {
    if (!workspaceRef.current) return 1;
    
    const padding = 100; 
    const availableWidth = workspaceRef.current.clientWidth - padding;
    const availableHeight = workspaceRef.current.clientHeight - padding;
    
    const scaleX = availableWidth / width;
    const scaleY = availableHeight / height;
    
    let bestScale = Math.min(scaleX, scaleY);
    if (bestScale > 1) bestScale = 1;
    if (bestScale < 0.1) bestScale = 0.1;
    
    return Number(bestScale.toFixed(2));
  };

  useEffect(() => {
    fetchModels();
    
    setTimeout(() => {
      setZoomLevel(calculateFitZoom(1080, 1080));
    }, 200);
  }, []);

  useEffect(() => {
    if (fabricCanvas.current) {
      fabricCanvas.current.calcOffset();
    }
  }, [zoomLevel, canvasSize, sidebarOpen]);

  const updateProperty = (key: string, value: any) => {
    if (!selectedObject || !fabricCanvas.current) return;
    selectedObject.set(key as any, value);
    fabricCanvas.current.renderAll();
    fabricCanvas.current.fire('object:modified');
  };

  const getCornerRadii = () => {
    if (!selectedObject) return { tl: 0, tr: 0, br: 0, bl: 0 };
    if ((selectedObject as any).customRadii) return (selectedObject as any).customRadii;
    let r = 0;
    if (selectedObject.type === 'rect') r = (selectedObject as any).rx || 0;
    return { tl: r, tr: r, br: r, bl: r };
  };

  const handleRadiusChange = (corner: 'tl' | 'tr' | 'br' | 'bl', value: number) => {
    const safeValue = isNaN(value) ? 0 : Math.max(0, value);
    const current = getCornerRadii();
    const newRadii = { ...current, [corner]: safeValue };
    setCornerRadii(newRadii.tl, newRadii.tr, newRadii.br, newRadii.bl);
  };

  const handleCreateNew = () => {
    clearCanvas();
    setCanvasTitle('Nova Arte Sem Título');
    setCurrentModelId(null);
    
    setCanvasSize({ width: 1080, height: 1080 });
    if (fabricCanvas.current) {
      fabricCanvas.current.setDimensions({ width: 1080, height: 1080 });
      fabricCanvas.current.renderAll();
    }
    
    setTimeout(() => {
      setZoomLevel(calculateFitZoom(1080, 1080));
    }, 100);

    toast.success('Novo canvas em branco criado.');
  };

  const handleResizeCanvas = () => {
    if (!fabricCanvas.current) return;
    const newWidth = Math.max(100, canvasSize.width);
    const newHeight = Math.max(100, canvasSize.height);
    
    fabricCanvas.current.setDimensions({ width: newWidth, height: newHeight });
    fabricCanvas.current.renderAll();
    
    setZoomLevel(calculateFitZoom(newWidth, newHeight));
    toast.success(`Tamanho alterado para ${newWidth}x${newHeight}px`);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.15, 4)); 
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.15, 0.1)); 
  };

  const handleResetZoom = () => {
    setZoomLevel(calculateFitZoom(canvasSize.width, canvasSize.height));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const jsonStr = saveToJson();
      if (!jsonStr) throw new Error("Não foi possível gerar os dados da arte.");

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Precisa fazer login para guardar modelos.");

      const thumbnailUrl = exportToImage(); 
      let savedThumbnailUrl = null;

      if (thumbnailUrl) {
         const response = await fetch(thumbnailUrl);
         const blob = await response.blob();
         const fileName = `${user.id}/thumb_${Date.now()}.png`;
         
         const { error: uploadError } = await supabase.storage.from('user-uploads').upload(fileName, blob, { upsert: true });
         if (!uploadError) {
           const { data: { publicUrl } } = supabase.storage.from('user-uploads').getPublicUrl(fileName);
           savedThumbnailUrl = publicUrl;
         }
      }

      const parsedData = JSON.parse(jsonStr);
      parsedData.customCanvasSize = canvasSize;

      const payload = {
        user_id: user.id,
        title: canvasTitle,
        data: parsedData,
        ...(savedThumbnailUrl && { thumbnail_url: savedThumbnailUrl })
      };

      if (currentModelId) {
        const { error: updateError } = await supabase.from('design_models').update(payload).eq('id', currentModelId);
        if (updateError) throw updateError;
        toast.success('Projeto atualizado com sucesso!');
      } else {
        const { data, error: insertError } = await supabase.from('design_models').insert(payload).select().single();
        if (insertError) throw insertError;
        setCurrentModelId(data.id);
        toast.success('Novo projeto salvo com sucesso!');
      }

      fetchModels(); 
    } catch (error: any) {
      toast.error(error.message || "Falha ao salvar o modelo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    try {
      setIsSaving(true);
      const jsonStr = saveToJson();
      if (!jsonStr) throw new Error("Não foi possível gerar os dados da arte.");

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Precisa fazer login.");

      const thumbnailUrl = exportToImage(); 
      let savedThumbnailUrl = null;

      if (thumbnailUrl) {
         const response = await fetch(thumbnailUrl);
         const blob = await response.blob();
         const fileName = `templates/thumb_${Date.now()}.png`;
         
         const { error: uploadError } = await supabase.storage.from('user-uploads').upload(fileName, blob, { upsert: true });
         if (!uploadError) {
           const { data: { publicUrl } } = supabase.storage.from('user-uploads').getPublicUrl(fileName);
           savedThumbnailUrl = publicUrl;
         }
      }

      const parsedData = JSON.parse(jsonStr);
      parsedData.customCanvasSize = canvasSize;

      const payload = {
        user_id: user.id,
        title: canvasTitle,
        data: parsedData,
        ...(savedThumbnailUrl && { thumbnail_url: savedThumbnailUrl })
      };

      const { error: insertError } = await supabase.from('design_templates').insert(payload);
      if (insertError) throw insertError;
      
      toast.success('Template base criado com sucesso!');
      fetchModels();
    } catch (error: any) {
      toast.error(error.message || "Falha ao criar template.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadModel = (model: any, isTemplate: boolean = false) => {
    const loadedSize = model.data.customCanvasSize || { width: 1080, height: 1080 };
    setCanvasSize(loadedSize);

    loadFromJson(model.data);
    
    setTimeout(() => {
      if (fabricCanvas.current) {
        fabricCanvas.current.setDimensions(loadedSize);
        fabricCanvas.current.renderAll();
      }
      setZoomLevel(calculateFitZoom(loadedSize.width, loadedSize.height));
    }, 50);

    if (isTemplate) {
      setCanvasTitle(`${model.title} (Cópia)`);
      setCurrentModelId(null); 
      toast.success(`Template Base carregado para edição.`);
    } else {
      setCanvasTitle(model.title);
      setCurrentModelId(model.id);
      toast.success(`Projeto "${model.title}" carregado!`);
    }
  };

  const handleDeleteModel = async (id: string, e: React.MouseEvent, table: 'design_models' | 'design_templates') => {
    e.stopPropagation(); 
    const confirmDelete = window.confirm("Tem certeza que deseja apagar permanentemente?");
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;

      toast.success('Apagado com sucesso!');
      if (currentModelId === id && table === 'design_models') {
        handleCreateNew(); 
      }
      fetchModels();
    } catch (error: any) {
      toast.error("Erro ao apagar: " + error.message);
    }
  };

  const handleExportPNG = () => {
    const link = document.createElement('a'); 
    link.download = `${canvasTitle}.png`; 
    link.href = exportToImage() || ''; 
    link.click();
    toast.success('Download iniciado!');
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
      
      {/* SOLUÇÃO DEFINITIVA DO BUG DO TEXTAREA */}
      <style dangerouslySetInnerHTML={{ __html: `
        body > textarea, .canvas-container textarea {
          position: fixed !important;
          top: -100px !important;
          left: -100px !important;
          width: 10px !important;
          height: 10px !important;
          opacity: 0 !important;
          pointer-events: none !important;
          min-height: 0px !important;
          min-width: 0px !important;
          padding: 0px !important;
          margin: 0px !important;
          border: none !important;
          outline: none !important;
          resize: none !important;
          background: transparent !important;
        }
      `}} />

      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        activeTab={activeTab} 
        onTabChange={(tab: string) => {
          setActiveTab(tab);
          setSidebarOpen(false);
          if (tab !== 'editor') router.push(`/${tab}`);
        }} 
      />

      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-100">
        <div className="flex flex-col flex-1 overflow-hidden relative">
          
          <div className="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0 z-20">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 lg:hidden cursor-pointer" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5 text-blue-600" />
              </div>
              <div className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text font-bold text-lg">
                <Layers className="w-6 h-6 text-blue-600" /> Flow Design
              </div>
              <Separator orientation="vertical" className="h-6 mx-2" />
              <Input 
                value={canvasTitle} 
                onChange={(e) => setCanvasTitle(e.target.value)} 
                className="border-transparent hover:border-blue-200 focus:border-blue-500 w-64 font-medium h-9 text-base transition-colors" 
              />
              
              {/* BOTÕES DESFAZER / REFAZER */}
              <div className="flex items-center gap-1 ml-2">
                <Button 
                  variant="ghost" size="icon" className="h-8 w-8 text-slate-600" 
                  onClick={undo} disabled={!canUndo} title="Desfazer (Ctrl+Z)"
                >
                  <Undo2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" size="icon" className="h-8 w-8 text-slate-600" 
                  onClick={redo} disabled={!canRedo} title="Refazer (Ctrl+Y)"
                >
                  <Redo2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isSaving && <div className="text-xs text-blue-600 flex items-center gap-2 mr-2"><Loader2 className="w-3 h-3 animate-spin"/> Guardando...</div>}
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="text-blue-900 hover:text-blue-600 hover:bg-blue-50 font-medium">
                    <Crop className="w-4 h-4 mr-2" /> Tamanho
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-4 rounded-xl shadow-xl border-slate-200 bg-white" align="end">
                  <h4 className="font-bold text-sm text-slate-800 mb-3">Tamanho da Arte</h4>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Largura</Label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          min={100}
                          value={canvasSize.width} 
                          onChange={(e) => setCanvasSize(prev => ({ ...prev, width: Number(e.target.value) }))} 
                          className="h-9 text-xs pr-6 rounded-lg border-slate-200 focus:border-blue-500 focus:ring-blue-100" 
                        />
                        <span className="absolute right-2 top-2.5 text-[10px] text-slate-400">px</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Altura</Label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          min={100}
                          value={canvasSize.height} 
                          onChange={(e) => setCanvasSize(prev => ({ ...prev, height: Number(e.target.value) }))} 
                          className="h-9 text-xs pr-6 rounded-lg border-slate-200 focus:border-blue-500 focus:ring-blue-100" 
                        />
                        <span className="absolute right-2 top-2.5 text-[10px] text-slate-400">px</span>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg" onClick={handleResizeCanvas}>
                    Aplicar Novo Tamanho
                  </Button>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button variant="outline" className="h-8 text-[10px] font-medium border-slate-200 text-slate-600 hover:text-blue-600" onClick={() => setCanvasSize({width: 1080, height: 1080})}>Feed Quad.</Button>
                    <Button variant="outline" className="h-8 text-[10px] font-medium border-slate-200 text-slate-600 hover:text-blue-600" onClick={() => setCanvasSize({width: 1080, height: 1350})}>Feed Vert.</Button>
                    <Button variant="outline" className="h-8 text-[10px] font-medium border-slate-200 text-slate-600 hover:text-blue-600" onClick={() => setCanvasSize({width: 1080, height: 1920})}>Story</Button>
                    <Button variant="outline" className="h-8 text-[10px] font-medium border-slate-200 text-slate-600 hover:text-blue-600" onClick={() => setCanvasSize({width: 1080, height: 1440})}>Capa Reels</Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Button variant="ghost" className="text-blue-900 hover:text-blue-600 hover:bg-blue-50 font-medium" onClick={handleCreateNew}>
                Novo Design
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 shadow-sm font-semibold rounded-lg px-6 border-0">
                    <Share className="w-4 h-4 mr-2" /> Compartilhar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl shadow-xl border-slate-200">
                  <div className="p-2 pb-3">
                    <h4 className="font-bold text-sm text-slate-800">Opções do Design</h4>
                    <p className="text-xs text-slate-500">Salve ou exporte sua arte.</p>
                  </div>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleSave} className="cursor-pointer py-3 rounded-lg focus:bg-blue-50 focus:text-blue-700">
                    <Save className="w-4 h-4 mr-3 text-slate-500" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">Salvar Projeto</span>
                      <span className="text-[10px] text-slate-500">Guarda em "Meus Projetos"</span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={handleSaveAsTemplate} className="cursor-pointer py-3 rounded-lg focus:bg-blue-50 focus:text-blue-700">
                    <LayoutTemplate className="w-4 h-4 mr-3 text-slate-500" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">Salvar como Template</span>
                      <span className="text-[10px] text-slate-500">Disponível para toda a equipe</span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={handleExportPNG} className="cursor-pointer py-3 rounded-lg focus:bg-slate-100">
                    <Download className="w-4 h-4 mr-3 text-slate-500" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">Baixar PNG</span>
                      <span className="text-[10px] text-slate-500">Alta qualidade para redes sociais</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            
            <aside className="w-[380px] bg-white border-r flex flex-col overflow-hidden shrink-0 z-10">
              <Tabs defaultValue="projetos" className="flex flex-row w-full h-full">
                
                <TabsList className="flex flex-col h-full w-[80px] shrink-0 bg-gradient-to-b from-blue-600 to-indigo-600 text-white justify-start py-4 gap-3 rounded-none h-auto border-none">
                  
                  <TabsTrigger value="projetos" className="group flex flex-col items-center justify-center gap-1.5 w-[68px] h-16 text-[10px] font-medium text-white data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-none bg-transparent border-none rounded-xl transition-all hover:bg-white/10 hover:text-white">
                    <FolderHeart className="w-[22px] h-[22px] text-white" /> Projetos
                  </TabsTrigger>
                  
                  <TabsTrigger value="modelos" className="group flex flex-col items-center justify-center gap-1.5 w-[68px] h-16 text-[10px] font-medium text-white data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-none bg-transparent border-none rounded-xl transition-all hover:bg-white/10 hover:text-white">
                    <LayoutTemplate className="w-[22px] h-[22px] text-white" /> Modelos
                  </TabsTrigger>
                  
                  <TabsTrigger value="elementos" className="group flex flex-col items-center justify-center gap-1.5 w-[68px] h-16 text-[10px] font-medium text-white data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-none bg-transparent border-none rounded-xl transition-all hover:bg-white/10 hover:text-white">
                    <Shapes className="w-[22px] h-[22px] text-white" /> Elementos
                  </TabsTrigger>
                  
                  <TabsTrigger value="texto" className="group flex flex-col items-center justify-center gap-1.5 w-[68px] h-16 text-[10px] font-medium text-white data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-none bg-transparent border-none rounded-xl transition-all hover:bg-white/10 hover:text-white">
                    <TypeIcon className="w-[22px] h-[22px] text-white" /> Texto
                  </TabsTrigger>
                  
                  <TabsTrigger value="marca" className="group flex flex-col items-center justify-center gap-1.5 w-[68px] h-16 text-[10px] font-medium text-white data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-none bg-transparent border-none rounded-xl transition-all hover:bg-white/10 hover:text-white relative">
                    <Palette className="w-[22px] h-[22px] text-white" /> 
                    Marca
                    <Crown className="w-3 h-3 text-amber-300 absolute top-1 right-2" />
                  </TabsTrigger>

                  <TabsTrigger value="uploads" className="group flex flex-col items-center justify-center gap-1.5 w-[68px] h-16 text-[10px] font-medium text-white data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-none bg-transparent border-none rounded-xl transition-all hover:bg-white/10 hover:text-white">
                    <UploadCloud className="w-[22px] h-[22px] text-white" /> Uploads
                  </TabsTrigger>
                  
                  <TabsTrigger value="ferramentas" className="group flex flex-col items-center justify-center gap-1.5 w-[68px] h-16 text-[10px] font-medium text-white data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-none bg-transparent border-none rounded-xl transition-all hover:bg-white/10 hover:text-white">
                    <Wand2 className="w-[22px] h-[22px] text-white" /> Ferramentas
                  </TabsTrigger>

                </TabsList>

                <div className="flex-1 h-full overflow-y-auto bg-white shadow-[inset_10px_0_15px_-10px_rgba(0,0,0,0.05)]">
                  
                  <TabsContent value="projetos" className="m-0 p-5 space-y-4 outline-none border-none">
                    <h3 className="font-bold text-base text-slate-800 mb-4">Meus Projetos</h3>
                    {isLoadingModels ? (
                      <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600" /></div>
                    ) : savedModels.length === 0 ? (
                      <div className="text-center p-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                         <p className="text-sm font-medium text-slate-600">Nenhum projeto salvo</p>
                         <p className="text-[11px] text-slate-400 mt-1">Crie sua arte e vá em Compartilhar {'>'} Salvar.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {savedModels.map((model) => (
                          <div 
                            key={model.id} 
                            onClick={() => handleLoadModel(model, false)}
                            className="group flex flex-col gap-2 cursor-pointer"
                          >
                            <div className={`relative aspect-square bg-white rounded-xl border flex items-center justify-center overflow-hidden transition-all ${currentModelId === model.id ? 'border-blue-600 shadow-md ring-1 ring-blue-600' : 'border-slate-200 hover:border-blue-400'}`}>
                              {model.thumbnail_url ? (
                                <img src={model.thumbnail_url} alt={model.title} className="max-w-[80%] max-h-[80%] object-contain shadow-sm rounded-sm" />
                              ) : (
                                <Layers className="text-slate-300 w-8 h-8" />
                              )}
                              
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="destructive" size="icon" className="w-7 h-7 rounded-lg bg-red-500/90 hover:bg-red-600 shadow-sm" onClick={(e) => handleDeleteModel(model.id, e, 'design_models')}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="px-1 flex flex-col">
                              <span className="text-xs font-bold text-slate-800 truncate">{model.title}</span>
                              <span className="text-[10px] text-slate-500 truncate mt-0.5">
                                {model.data?.customCanvasSize ? `${model.data.customCanvasSize.width} px × ${model.data.customCanvasSize.height} px` : '1080 px × 1080 px'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="modelos" className="m-0 p-5 space-y-4 outline-none border-none">
                    <h3 className="font-bold text-base mb-4 text-blue-700 flex items-center gap-2"><LayoutTemplate className="w-5 h-5"/> Templates da Equipa</h3>
                    {isLoadingModels ? (
                      <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600" /></div>
                    ) : templates.length === 0 ? (
                      <div className="text-center p-6 bg-blue-50 rounded-lg border border-dashed border-blue-200">
                         <p className="text-sm font-medium text-blue-600">Nenhum template global.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {templates.map((template) => (
                          <div 
                            key={template.id} 
                            onClick={() => handleLoadModel(template, true)}
                            className="group flex flex-col gap-2 cursor-pointer"
                          >
                            <div className="relative aspect-square bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden transition-all hover:border-blue-400 hover:shadow-sm">
                              {template.thumbnail_url ? (
                                <img src={template.thumbnail_url} alt={template.title} className="max-w-[80%] max-h-[80%] object-contain shadow-sm rounded-sm" />
                              ) : (
                                <LayoutTemplate className="text-slate-300 w-8 h-8" />
                              )}
                              
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="destructive" size="icon" className="w-7 h-7 rounded-lg bg-red-500/90 hover:bg-red-600 shadow-sm" onClick={(e) => handleDeleteModel(template.id, e, 'design_templates')}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="px-1 flex flex-col">
                              <span className="text-xs font-bold text-slate-800 truncate">{template.title}</span>
                              <span className="text-[10px] text-slate-500 truncate mt-0.5">
                                {template.data?.customCanvasSize ? `${template.data.customCanvasSize.width} px × ${template.data.customCanvasSize.height} px` : '1080 px × 1080 px'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="elementos" className="m-0 p-5 space-y-6 outline-none border-none">
                    <div>
                      <h3 className="font-bold text-sm text-slate-800 mb-3">Formas Básicas</h3>
                      <div className="grid grid-cols-4 gap-2">
                        <Button variant="outline" className="h-14 w-full p-0 border-slate-200 hover:bg-blue-50 hover:border-blue-400 group" onClick={() => addShape('rect')}><div className="w-6 h-6 bg-slate-400 group-hover:bg-blue-500 rounded-sm transition-colors" /></Button>
                        <Button variant="outline" className="h-14 w-full p-0 border-slate-200 hover:bg-blue-50 hover:border-blue-400 group" onClick={() => addShape('circle')}><div className="w-6 h-6 bg-slate-400 group-hover:bg-blue-500 rounded-full transition-colors" /></Button>
                        <Button variant="outline" className="h-14 w-full p-0 border-slate-200 hover:bg-blue-50 hover:border-blue-400 group" onClick={() => addShape('triangle')}><div className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent border-b-slate-400 group-hover:border-b-blue-500 transition-colors" /></Button>
                        <Button variant="outline" className="h-14 w-full p-0 border-slate-200 hover:bg-blue-50 hover:border-blue-400 group flex items-center justify-center" onClick={() => addShape('line')}><div className="w-8 h-1 bg-slate-400 group-hover:bg-blue-500 rounded-full transition-colors" /></Button>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <h3 className="font-bold text-sm text-slate-800 mb-3">Molduras Inteligentes</h3>
                      <p className="text-[11px] text-slate-500 mb-3 leading-tight">Adicione uma moldura e arraste fotos para dentro dela.</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="h-24 flex-col gap-3 border-slate-200 border-dashed hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all bg-slate-50 group" onClick={() => addFrame('circle')}><CircleDashed className="w-7 h-7 text-slate-400 group-hover:text-blue-500" /><span className="text-xs font-semibold">Círculo</span></Button>
                        <Button variant="outline" className="h-24 flex-col gap-3 border-slate-200 border-dashed hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all bg-slate-50 group" onClick={() => addFrame('rect')}><SquareDashed className="w-7 h-7 text-slate-400 group-hover:text-blue-500" /><span className="text-xs font-semibold">Retângulo</span></Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="texto" className="m-0 p-5 space-y-4 outline-none border-none">
                    <Button className="w-full h-14 text-xl font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm" onClick={() => addText('Inserir um título')}>Adicionar um Título</Button>
                    <Button className="w-full h-12 text-lg font-semibold bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl border border-blue-200" onClick={() => addText('Inserir um subtítulo')}>Adicionar Subtítulo</Button>
                    <Button className="w-full h-10 text-sm font-normal bg-transparent border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl" onClick={() => addText('Inserir texto no corpo')}>Adicionar corpo de texto</Button>
                  </TabsContent>

                  <TabsContent value="uploads" className="m-0 p-5 outline-none border-none">
                    <ImageUploads onImageSelect={(url) => addImage(url)} />
                  </TabsContent>

                  <TabsContent value="marca" className="m-0 p-5 space-y-6 outline-none border-none">
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3"><Crown className="text-amber-500 w-8 h-8 shrink-0" /><div><h4 className="font-bold text-sm text-amber-800">Kit de Marca Pro</h4><p className="text-[11px] text-amber-700 mt-1 leading-tight">Mantenha a identidade visual da sua imobiliária sempre acessível.</p></div></div>
                    <div>
                      <h3 className="font-bold text-sm mb-3 text-slate-800">Cores Oficiais</h3>
                      <div className="flex gap-2"><div className="w-10 h-10 rounded-full bg-blue-600 border shadow-sm cursor-pointer" /><div className="w-10 h-10 rounded-full bg-slate-900 border shadow-sm cursor-pointer" /><div className="w-10 h-10 rounded-full bg-white border shadow-sm cursor-pointer" /><div className="w-10 h-10 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-50">+</div></div>
                    </div>
                  </TabsContent>

                  <TabsContent value="ferramentas" className="m-0 p-5 space-y-4 outline-none border-none">
                    <h3 className="font-bold text-sm mb-4 text-slate-800">Magic Tools</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="h-28 flex-col gap-3 relative overflow-hidden group border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl"><Sparkles className="w-8 h-8 text-blue-500" /><span className="text-xs font-semibold text-slate-700">Remover Fundo</span><Lock className="w-3.5 h-3.5 absolute top-2 right-2 text-slate-300" /></Button>
                      <Button variant="outline" className="h-28 flex-col gap-3 relative overflow-hidden group border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl"><ImageIcon className="w-8 h-8 text-blue-500" /><span className="text-xs font-semibold text-slate-700">Gerador IA</span><Lock className="w-3.5 h-3.5 absolute top-2 right-2 text-slate-300" /></Button>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </aside>

            <div className="flex-1 relative flex flex-col bg-slate-100 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] shadow-[inset_0_4px_6px_rgba(0,0,0,0.05)] overflow-hidden">
              
              <main ref={workspaceRef} className="flex-1 overflow-auto p-10 relative">
                <div className="min-w-full min-h-full flex items-center justify-center">
                  
                  <div 
                    className="relative transition-all duration-200 ease-out"
                    style={{ 
                      width: canvasSize.width * zoomLevel, 
                      height: canvasSize.height * zoomLevel 
                    }}
                  >
                    <div 
                      className="absolute top-0 left-0 bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] ring-1 ring-slate-300 overflow-hidden"
                      style={{
                        width: canvasSize.width,
                        height: canvasSize.height,
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: 'top left'
                      }}
                    >
                      <canvas ref={canvasRef} />
                    </div>
                  </div>

                </div>

                {/* MENU DE CONTEXTO */}
                {contextMenuInfo.visible && selectedObject && (
                  <>
                    <div 
                      className="fixed inset-0 z-[100]" 
                      onClick={(e) => { e.stopPropagation(); setContextMenuInfo({ ...contextMenuInfo, visible: false }); }} 
                      onContextMenu={(e) => { e.preventDefault(); setContextMenuInfo({ ...contextMenuInfo, visible: false }); }}
                    />
                    
                    <div 
                      className="fixed z-[101] w-52 bg-white border border-slate-200 shadow-2xl rounded-xl py-2 flex flex-col text-sm text-slate-700 animate-in fade-in zoom-in duration-100"
                      style={{ 
                        left: Math.min(contextMenuInfo.x, typeof window !== 'undefined' ? window.innerWidth - 200 : contextMenuInfo.x), 
                        top: Math.min(contextMenuInfo.y, typeof window !== 'undefined' ? window.innerHeight - 250 : contextMenuInfo.y) 
                      }}
                    >
                      <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ações</div>
                      
                      <button 
                        className="flex items-center px-4 py-2 hover:bg-slate-100 hover:text-blue-600 transition-colors disabled:opacity-50 w-full text-left"
                        disabled={(selectedObject as any).locked}
                        onClick={() => { bringToFront(); setContextMenuInfo({ ...contextMenuInfo, visible: false }); }}
                      >
                        <ArrowUpToLine className="w-4 h-4 mr-3" /> Trazer para frente
                      </button>
                      <button 
                        className="flex items-center px-4 py-2 hover:bg-slate-100 hover:text-blue-600 transition-colors disabled:opacity-50 w-full text-left"
                        disabled={(selectedObject as any).locked}
                        onClick={() => { sendToBack(); setContextMenuInfo({ ...contextMenuInfo, visible: false }); }}
                      >
                        <ArrowDownToLine className="w-4 h-4 mr-3" /> Enviar para trás
                      </button>
                      
                      <Separator className="my-1.5 opacity-50" />
                      
                      <button 
                        className="flex items-center px-4 py-2 hover:bg-slate-100 hover:text-blue-600 transition-colors disabled:opacity-50 w-full text-left"
                        disabled={(selectedObject as any).locked}
                        onClick={() => { centerObject(); setContextMenuInfo({ ...contextMenuInfo, visible: false }); }}
                      >
                        <Maximize className="w-4 h-4 mr-3" /> Centralizar na Arte
                      </button>

                      {selectedObject.type === 'image' && (
                        <>
                          <Separator className="my-1.5 opacity-50" />
                          <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Imagem</div>
                          
                          {(selectedObject as any).isFrame ? (
                            <button 
                              className="flex items-center px-4 py-2 hover:bg-blue-50 hover:text-blue-700 transition-colors w-full text-left disabled:opacity-50"
                              onClick={() => { detachImageFromFrame(); setContextMenuInfo({ ...contextMenuInfo, visible: false }); }}
                            >
                              <Unlink className="w-4 h-4 mr-3" /> Desanexar da moldura
                            </button>
                          ) : (
                            <button 
                              className="flex items-center px-4 py-2 hover:bg-blue-50 hover:text-blue-700 transition-colors w-full text-left disabled:opacity-50"
                              disabled={cropBox !== null}
                              onClick={() => { startCrop(); setContextMenuInfo({ ...contextMenuInfo, visible: false }); }}
                            >
                              <Scissors className="w-4 h-4 mr-3" /> Recortar Imagem
                            </button>
                          )}

                          {((selectedObject as any).isFrame || (selectedObject as any).isCropped) && (
                            <button 
                              className="flex items-center px-4 py-2 hover:bg-blue-50 hover:text-blue-700 transition-colors w-full text-left disabled:opacity-50"
                              onClick={() => { togglePanMode(); setContextMenuInfo({ ...contextMenuInfo, visible: false }); }}
                            >
                              <Move className="w-4 h-4 mr-3" /> {isPanMode ? 'Concluir Ajuste' : 'Ajustar Posição'}
                            </button>
                          )}
                        </>
                      )}

                      <Separator className="my-1.5 opacity-50" />

                      <button 
                        className="flex items-center px-4 py-2 hover:bg-slate-100 transition-colors w-full text-left"
                        onClick={() => { toggleLock(); setContextMenuInfo({ ...contextMenuInfo, visible: false }); }}
                      >
                        {(selectedObject as any).locked ? (
                          <><LockOpen className="w-4 h-4 mr-3 text-amber-500" /> Destravar item</>
                        ) : (
                          <><Lock className="w-4 h-4 mr-3 text-slate-400" /> Travar item</>
                        )}
                      </button>

                      <button 
                        className="flex items-center px-4 py-2 hover:bg-red-50 text-red-600 transition-colors disabled:opacity-30 w-full text-left"
                        disabled={(selectedObject as any).locked}
                        onClick={() => { deleteSelected(); setContextMenuInfo({ ...contextMenuInfo, visible: false }); }}
                      >
                        <Trash2 className="w-4 h-4 mr-3" /> Excluir
                      </button>
                    </div>
                  </>
                )}
              </main>

              <div className="absolute bottom-6 right-6 flex items-center gap-1 bg-white p-1.5 rounded-xl shadow-lg border border-slate-200 z-10">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:text-blue-600 hover:bg-blue-50" onClick={handleZoomOut} title="Diminuir Zoom">
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <div className="w-14 text-center text-xs font-semibold text-slate-600 select-none">
                  {Math.round(zoomLevel * 100)}%
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:text-blue-600 hover:bg-blue-50" onClick={handleZoomIn} title="Aumentar Zoom">
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Separator orientation="vertical" className="h-5 mx-1" />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:text-blue-600 hover:bg-blue-50" onClick={handleResetZoom} title="Centralizar Visualização">
                  <Focus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <aside className="w-80 bg-white border-l p-5 flex flex-col gap-6 overflow-y-auto shrink-0 z-10 shadow-[inset_-10px_0_15px_-10px_rgba(0,0,0,0.05)]">
              
              {cropBox ? (
                <div className="flex flex-col gap-4 bg-blue-50 p-5 rounded-xl border border-blue-200 shadow-sm animate-in slide-in-from-right-4">
                  <div>
                    <h3 className="font-bold text-sm text-blue-900 flex items-center gap-2"><Scissors className="w-4 h-4" /> Modo de Recorte</h3>
                    <p className="text-[11px] text-blue-700 mt-1 leading-relaxed">Ajuste os cantos azuis da caixa sobre a imagem e clique em aplicar.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={applyCrop} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm h-10"><Check className="w-4 h-4 mr-2" /> Aplicar</Button>
                    <Button variant="outline" onClick={cancelCrop} className="w-full border-blue-200 text-blue-700 hover:bg-blue-100 h-10"><X className="w-4 h-4 mr-2" /> Cancelar</Button>
                  </div>
                </div>
              ) : isPanMode ? (
                <div className="flex flex-col gap-4 bg-amber-50 p-5 rounded-xl border border-amber-200 shadow-sm animate-in slide-in-from-right-4">
                  <div>
                    <h3 className="font-bold text-sm text-amber-900 flex items-center gap-2"><Move className="w-4 h-4" /> Ajustar Imagem</h3>
                    <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">Clique e arraste a imagem dentro da área da moldura para encontrar a melhor posição.</p>
                  </div>
                  <Button onClick={togglePanMode} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm h-10"><Check className="w-4 h-4 mr-2" /> Concluir Ajuste</Button>
                </div>
              ) : selectedObject ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-800">Propriedades</h3>
                    <div className="flex items-center gap-1">
                      
                      {selectedObject.type === 'image' && (
                        <>
                          {((selectedObject as any).isFrame || (selectedObject as any).isCropped) && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg disabled:opacity-50" onClick={togglePanMode} title="Ajustar posição na moldura">
                              <Move className="w-4 h-4" />
                            </Button>
                          )}

                          {(selectedObject as any).isFrame ? (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg disabled:opacity-50" onClick={detachImageFromFrame} title="Desanexar Imagem">
                              <Unlink className="w-4 h-4" />
                            </Button>
                          ) : (
                            <>
                              {(selectedObject as any).isCropped ? (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg disabled:opacity-50" onClick={removeCrop} title="Remover Recorte">
                                  <X className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg disabled:opacity-50" onClick={startCrop} title="Recortar Imagem">
                                  <Scissors className="w-4 h-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </>
                      )}

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 rounded-lg ${ (selectedObject as any).locked ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700' }`} 
                        onClick={toggleLock}
                        title={(selectedObject as any).locked ? "Destravar Objeto" : "Travar Objeto"}
                      >
                        {(selectedObject as any).locked ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg disabled:opacity-50" 
                        onClick={deleteSelected}
                        disabled={(selectedObject as any).locked}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {(selectedObject as any).isFrame && selectedObject.type !== 'image' && (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                      <div className="flex items-center gap-2 mb-2 text-amber-700"><ImagePlus className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-widest">Moldura Ativa</span></div>
                      <p className="text-[10px] text-amber-700 leading-tight">Vá à aba "Uploads" e clique numa foto. Ela será inserida automaticamente dentro desta forma.</p>
                    </div>
                  )}

                  <div className={`bg-blue-50 p-4 rounded-xl border border-blue-100 ${(selectedObject as any).locked ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-2 mb-3 text-blue-600"><Wand2 className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-widest">Magic Fill (CRM)</span></div>
                    <Label className="text-[10px] mb-2 block text-blue-800 font-semibold">Preencher automaticamente com:</Label>
                    <Select value={(selectedObject as any).variableId || 'none'} onValueChange={(val) => updateProperty('variableId', val === 'none' ? null : val)} disabled={(selectedObject as any).locked}>
                      <SelectTrigger className="h-9 text-xs bg-white border-blue-200 focus:ring-blue-200 rounded-lg"><SelectValue placeholder="Escolha um campo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Estático (Nenhum)</SelectItem>
                        <SelectItem value="valor_imovel">Preço do Imóvel</SelectItem>
                        <SelectItem value="endereco_imovel">Endereço Completo</SelectItem>
                        <SelectItem value="nome_corretor">Nome do Corretor</SelectItem>
                        <SelectItem value="foto_principal">Foto Principal (Imóvel)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator className="bg-slate-100" />

                  {/* PROPRIEDADES DE TEXTO - NOVO PAINEL */}
                  {(selectedObject.type === 'i-text' || selectedObject.type === 'text') && (
                    <div className={`space-y-6 ${(selectedObject as any).locked ? 'opacity-50 pointer-events-none' : ''}`}>
                      
                      {/* Cor e Tamanho da Fonte */}
                      <div className="space-y-3">
                        <Label className="text-xs font-semibold text-slate-800">Texto</Label>
                        <div className="flex gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-10 h-10 p-0 border-slate-200 shadow-sm overflow-hidden rounded-lg">
                                <div 
                                  className="w-full h-full" 
                                  style={{ backgroundColor: typeof selectedObject.fill === 'string' ? selectedObject.fill : '#000000' }} 
                                />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-4 bg-white shadow-xl rounded-xl">
                              <Tabs defaultValue="solid">
                                <TabsList className="grid grid-cols-2 mb-4">
                                  <TabsTrigger value="solid">Sólido</TabsTrigger>
                                  <TabsTrigger value="gradient">Degradê</TabsTrigger>
                                </TabsList>
                                <TabsContent value="solid" className="space-y-3">
                                  <Label className="text-[10px] font-bold uppercase text-slate-400">Cor Sólida</Label>
                                  <Input 
                                    type="color" 
                                    className="h-10 p-1 cursor-pointer"
                                    value={typeof selectedObject.fill === 'string' ? selectedObject.fill : '#000000'}
                                    onChange={(e) => changeTextColor(e.target.value)}
                                  />
                                </TabsContent>
                                <TabsContent value="gradient" className="space-y-4">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <Label className="text-[10px]">Cor 1</Label>
                                      <Input type="color" value={gradColor1} onChange={(e) => setGradColor1(e.target.value)} className="h-8 p-1" />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-[10px]">Cor 2</Label>
                                      <Input type="color" value={gradColor2} onChange={(e) => setGradColor2(e.target.value)} className="h-8 p-1" />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Button size="sm" variant="outline" className="text-[10px] h-7" onClick={() => applyGradient(gradColor1, gradColor2, 'horizontal')}>Horizontal</Button>
                                    <Button size="sm" variant="outline" className="text-[10px] h-7" onClick={() => applyGradient(gradColor1, gradColor2, 'vertical')}>Vertical</Button>
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </PopoverContent>
                          </Popover>

                          <div className="relative flex-1">
                            <Type className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <Input 
                              type="number" 
                              value={Math.round(selectedObject.fontSize || 24)} 
                              onChange={(e) => setFontSize(parseInt(e.target.value))} 
                              className="pl-9 rounded-lg border-slate-200 focus:border-blue-400 focus:ring-blue-100" 
                              disabled={(selectedObject as any).locked}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Estilos de Fonte */}
                      <div className="space-y-3">
                        <Label className="text-xs font-semibold text-slate-800">Estilo</Label>
                        <div className="flex flex-wrap gap-1">
                          <Button 
                            variant="outline" size="icon" className={`h-9 w-9 rounded-md ${(selectedObject as any).fontWeight === 'bold' ? 'bg-blue-50 border-blue-200 text-blue-600' : ''}`}
                            onClick={toggleBold} title="Negrito"
                          >
                            <Bold className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" size="icon" className={`h-9 w-9 rounded-md ${(selectedObject as any).fontStyle === 'italic' ? 'bg-blue-50 border-blue-200 text-blue-600' : ''}`}
                            onClick={toggleItalic} title="Itálico"
                          >
                            <Italic className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" size="icon" className={`h-9 w-9 rounded-md ${(selectedObject as any).underline ? 'bg-blue-50 border-blue-200 text-blue-600' : ''}`}
                            onClick={toggleUnderline} title="Sublinhado"
                          >
                            <Underline className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" size="icon" className={`h-9 w-9 rounded-md ${(selectedObject as any).linethrough ? 'bg-blue-50 border-blue-200 text-blue-600' : ''}`}
                            onClick={toggleLinethrough} title="Tachado"
                          >
                            <Strikethrough className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Alinhamento */}
                      <div className="space-y-3">
                        <Label className="text-xs font-semibold text-slate-800">Alinhamento</Label>
                        <div className="flex gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                          {[
                            { val: 'left', icon: AlignLeft },
                            { val: 'center', icon: AlignCenter },
                            { val: 'right', icon: AlignRight },
                            { val: 'justify', icon: AlignJustify }
                          ].map((item) => (
                            <Button 
                              key={item.val}
                              variant="ghost" size="icon" 
                              className={`h-8 flex-1 rounded-md ${(selectedObject as any).textAlign === item.val ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                              onClick={() => setTextAlignment(item.val as any)}
                            >
                              <item.icon className="w-4 h-4" />
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Listas e Recuo */}
                      <div className="space-y-3">
                        <Label className="text-xs font-semibold text-slate-800">Formatação</Label>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" className="flex-1 gap-2 h-9 text-xs"
                            onClick={toggleList}
                          >
                            <List className="w-4 h-4" /> Lista
                          </Button>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="flex-1 gap-2 h-9 text-xs">
                                <ArrowRightToLine className="w-4 h-4" /> Recuo
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-4 bg-white shadow-xl rounded-xl">
                               <Label className="text-[10px] font-bold uppercase text-slate-400 mb-3 block">Espaçamento Entre Letras</Label>
                               <Slider 
                                 max={200} step={1} 
                                 value={[(selectedObject as any).charSpacing || 0]} 
                                 onValueChange={(v) => setTextIndent(v[0])} 
                               />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      {/* Espaçamento de Linha */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold text-slate-800">Espaçamento entre Linhas</Label>
                          <span className="text-[10px] font-bold text-blue-600">{(selectedObject as any).lineHeight?.toFixed(2)}</span>
                        </div>
                        <Slider 
                          min={0.5} max={3} step={0.05} 
                          value={[(selectedObject as any).lineHeight || 1.16]} 
                          onValueChange={(v) => setLineHeight(v[0])} 
                        />
                      </div>

                      <Separator className="bg-slate-100" />
                      
                      <div className="space-y-3">
                        <Label className="text-xs font-semibold text-slate-800">Fonte</Label>
                        <Select value={(selectedObject as any).fontFamily} onValueChange={(val) => updateProperty('fontFamily', val)} disabled={(selectedObject as any).locked}>
                          <SelectTrigger className="text-sm rounded-lg border-slate-200 focus:ring-blue-100"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Inter">Inter</SelectItem>
                            <SelectItem value="Montserrat">Montserrat</SelectItem>
                            <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* PROPRIEDADES DE FORMAS E MOLDURAS (Adicionado Seletor de degradê) */}
                  {(selectedObject.type === 'rect' || selectedObject.type === 'circle' || selectedObject.type === 'triangle' || selectedObject.type === 'line') && (
                    <div className={`space-y-6 ${(selectedObject as any).locked ? 'opacity-50 pointer-events-none' : ''}`}>
                      
                      <div className="space-y-3">
                        <Label className="text-xs font-semibold text-slate-800">Cor da Forma</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full h-10 flex gap-3 px-3 border-slate-200 rounded-lg justify-start items-center">
                              <div 
                                className="w-5 h-5 rounded-sm border" 
                                style={{ backgroundColor: typeof (selectedObject.type === 'line' ? selectedObject.stroke : selectedObject.fill) === 'string' ? (selectedObject.type === 'line' ? selectedObject.stroke : selectedObject.fill) as string : '#94a3b8' }} 
                              />
                              <span className="text-xs font-medium text-slate-600">Escolher Cor / Degradê</span>
                              <Paintbrush className="w-3 h-3 ml-auto text-slate-400" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-4 bg-white shadow-xl rounded-xl">
                            <Tabs defaultValue="solid">
                              <TabsList className="grid grid-cols-2 mb-4">
                                <TabsTrigger value="solid">Sólido</TabsTrigger>
                                <TabsTrigger value="gradient">Degradê</TabsTrigger>
                              </TabsList>
                              <TabsContent value="solid" className="space-y-3">
                                <Label className="text-[10px] font-bold uppercase text-slate-400">Cor Sólida</Label>
                                <Input 
                                  type="color" 
                                  className="h-10 p-1 cursor-pointer"
                                  value={typeof (selectedObject.type === 'line' ? selectedObject.stroke : selectedObject.fill) === 'string' ? (selectedObject.type === 'line' ? selectedObject.stroke : selectedObject.fill) as string : '#94a3b8'}
                                  onChange={(e) => updateProperty(selectedObject.type === 'line' ? 'stroke' : 'fill', e.target.value)}
                                />
                              </TabsContent>
                              <TabsContent value="gradient" className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <Label className="text-[10px]">Cor 1</Label>
                                    <Input type="color" value={gradColor1} onChange={(e) => setGradColor1(e.target.value)} className="h-8 p-1" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[10px]">Cor 2</Label>
                                    <Input type="color" value={gradColor2} onChange={(e) => setGradColor2(e.target.value)} className="h-8 p-1" />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <Button size="sm" variant="outline" className="text-[10px] h-7" onClick={() => applyGradient(gradColor1, gradColor2, 'horizontal')}>Horizontal</Button>
                                  <Button size="sm" variant="outline" className="text-[10px] h-7" onClick={() => applyGradient(gradColor1, gradColor2, 'vertical')}>Vertical</Button>
                                </div>
                              </TabsContent>
                            </Tabs>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {selectedObject.type !== 'circle' && selectedObject.type !== 'line' && (
                        <div className="space-y-3">
                          <Label className="text-xs font-semibold text-slate-800">Arredondar Cantos (px)</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-100 transition-all"><CornerUpLeft className="w-4 h-4 text-slate-400 shrink-0" /><input type="number" min={0} value={Math.round(getCornerRadii().tl)} onChange={(e) => handleRadiusChange('tl', parseInt(e.target.value))} className="w-full text-xs bg-transparent border-none outline-none text-slate-700 font-medium" disabled={(selectedObject as any).locked} /></div>
                            <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-100 transition-all"><CornerUpRight className="w-4 h-4 text-slate-400 shrink-0" /><input type="number" min={0} value={Math.round(getCornerRadii().tr)} onChange={(e) => handleRadiusChange('tr', parseInt(e.target.value))} className="w-full text-xs bg-transparent border-none outline-none text-slate-700 font-medium" disabled={(selectedObject as any).locked} /></div>
                            <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-100 transition-all"><CornerDownLeft className="w-4 h-4 text-slate-400 shrink-0" /><input type="number" min={0} value={Math.round(getCornerRadii().bl)} onChange={(e) => handleRadiusChange('bl', parseInt(e.target.value))} className="w-full text-xs bg-transparent border-none outline-none text-slate-700 font-medium" disabled={(selectedObject as any).locked} /></div>
                            <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-100 transition-all"><CornerDownRight className="w-4 h-4 text-slate-400 shrink-0" /><input type="number" min={0} value={Math.round(getCornerRadii().br)} onChange={(e) => handleRadiusChange('br', parseInt(e.target.value))} className="w-full text-xs bg-transparent border-none outline-none text-slate-700 font-medium" disabled={(selectedObject as any).locked} /></div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center justify-between"><Label className="text-xs font-semibold text-slate-800">Transparência</Label><span className="text-xs text-slate-500 font-medium">{Math.round((selectedObject.opacity || 1) * 100)}%</span></div>
                        <Slider defaultValue={[1]} max={1} step={0.01} value={[selectedObject.opacity || 1]} onValueChange={(vals) => setImageOpacity(vals[0])} className="py-2" disabled={(selectedObject as any).locked} />
                      </div>
                    </div>
                  )}

                  {/* PROPRIEDADES DE IMAGENS */}
                  {selectedObject.type === 'image' && (
                    <div className={`space-y-6 ${(selectedObject as any).locked ? 'opacity-50 pointer-events-none' : ''}`}>
                      <div className="space-y-3">
                        <Label className="text-xs font-semibold text-slate-800">Transparência</Label>
                        <Slider defaultValue={[1]} max={1} step={0.01} value={[selectedObject.opacity || 1]} onValueChange={(vals) => setImageOpacity(vals[0])} className="py-2" disabled={(selectedObject as any).locked} />
                      </div>
                      <Separator className="bg-slate-100" />
                      <div className="space-y-3">
                        <Label className="text-xs font-semibold text-slate-800">Inverter</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm" className={selectedObject.flipX ? 'border-blue-600 bg-blue-50' : ''} onClick={toggleFlipX} disabled={(selectedObject as any).locked}><FlipHorizontal className="w-4 h-4 mr-2" /> X</Button>
                          <Button variant="outline" size="sm" className={selectedObject.flipY ? 'border-blue-600 bg-blue-50' : ''} onClick={toggleFlipY} disabled={(selectedObject as any).locked}><FlipVertical className="w-4 h-4 mr-2" /> Y</Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator className="bg-slate-100" />

                  {/* ALINHAMENTO GLOBAL */}
                  <div className={`space-y-3 ${(selectedObject as any).locked ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Label className="text-xs font-semibold text-slate-800">Alinhamento e Camadas</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" size="sm" className="rounded-lg text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50" onClick={centerObject} title="Centralizar" disabled={(selectedObject as any).locked}><Maximize className="w-4 h-4" /></Button>
                      <Button variant="outline" size="sm" className="rounded-lg text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50" onClick={bringToFront} title="Mover para frente" disabled={(selectedObject as any).locked}><ArrowUpToLine className="w-4 h-4" /></Button>
                      <Button variant="outline" size="sm" className="rounded-lg text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50" onClick={sendToBack} title="Mover para trás" disabled={(selectedObject as any).locked}><ArrowDownToLine className="w-4 h-4" /></Button>
                    </div>
                  </div>

                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 opacity-40">
                  <MousePointer2 className="w-10 h-10 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">Nada selecionado</p>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}