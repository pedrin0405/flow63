'use client';

import React, { useState, useEffect } from 'react';
import { useFabricEditor } from '@/hooks/use-fabric-editor';
import { ImageUploads } from '@/components/central63/editor/ImageUploads';
import { supabase } from '@/lib/supabase';
import { Sidebar } from '@/components/central63/sidebar'; // COMPONENTE DE SIDEBAR ADICIONADO
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Type as TypeIcon, Image as ImageIcon, Download, Save, Trash2,
  MousePointer2, Layers, Sparkles, ChevronLeft, FlipHorizontal, FlipVertical,
  Maximize, ArrowUpToLine, ArrowDownToLine, CircleDashed, SquareDashed, ImagePlus,
  LayoutTemplate, Shapes, Palette, UploadCloud, Wand2, FolderHeart, Lock, Crown,
  CornerUpLeft, CornerUpRight, CornerDownLeft, CornerDownRight, Loader2, Plus, Share, Send, Menu, LayoutDashboard // ÍCONES NOVOS IMPORTADOS
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function EditorPrincipal() {
  const router = useRouter();
  const [canvasTitle, setCanvasTitle] = useState('Nova Arte Sem Título');
  const [isSaving, setIsSaving] = useState(false);
  
  // ESTADOS PARA O SIDEBAR GLOBAL
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('editor'); // Assumindo que 'editor' é a tab atual no seu Sidebar

  // ESTADOS NOVOS PARA GESTÃO DE PROJETOS E TEMPLATES
  const [savedModels, setSavedModels] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [currentModelId, setCurrentModelId] = useState<string | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  
  const {
    canvasRef, addText, addImage, addShape, addFrame, exportToImage, saveToJson, loadFromJson, clearCanvas,
    deleteSelected, setCornerRadii, toggleFlipX, toggleFlipY,
    setImageOpacity, centerObject, bringToFront, sendToBack, selectedObject, fabricCanvas
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

  useEffect(() => {
    fetchModels();
  }, []);

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
    toast.success('Novo canvas em branco criado.');
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

      const payload = {
        user_id: user.id,
        title: canvasTitle,
        data: JSON.parse(jsonStr),
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

      const payload = {
        user_id: user.id,
        title: canvasTitle,
        data: JSON.parse(jsonStr),
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
    loadFromJson(model.data);
    
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
      
      {/* SIDEBAR GLOBAL DA APLICAÇÃO */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        activeTab={activeTab} 
        onTabChange={(tab: string) => {
          setActiveTab(tab);
          setSidebarOpen(false);
          // Se precisar redirecionar ao trocar de tab no sidebar
          if (tab !== 'editor') router.push(`/${tab}`);
        }} 
      />

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        
        {/* HEADER GLOBAL DO DASHBOARD */}
        {/* <header className="sticky top-0 z-30 w-full bg-card/80 backdrop-blur-md border-b border-border px-4 lg:px-8 py-4 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors" 
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>
            <LayoutDashboard className="text-primary hidden sm:block" />
            <h2 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">Editor Canva63</h2>
          </div>
        </header> */}

        {/* --- INÍCIO DO CONTEÚDO DO EDITOR --- */}
        <div className="flex flex-col flex-1 overflow-hidden relative">
          
          {/* BARRA SUPERIOR DE FERRAMENTAS DO EDITOR */}
          <div className="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0 z-20">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text font-bold text-lg">
                <Layers className="w-6 h-6 text-blue-600" />
                flow63
              </div>
              <Separator orientation="vertical" className="h-6 mx-2" />
              <Input 
                value={canvasTitle} 
                onChange={(e) => setCanvasTitle(e.target.value)} 
                className="border-transparent hover:border-blue-200 focus:border-blue-500 w-64 font-medium h-9 text-base transition-colors" 
              />
            </div>

            <div className="flex items-center gap-3">
              {isSaving && <div className="text-xs text-blue-600 flex items-center gap-2 mr-2"><Loader2 className="w-3 h-3 animate-spin"/> Guardando...</div>}
              
              <Button variant="ghost" className="text-blue-900 hover:text-blue-600 hover:bg-blue-50 font-medium" onClick={handleCreateNew}>
                Novo Design
              </Button>
              
              {/* MENU COMPARTILHAR / EXPORTAR */}
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

          {/* PAINÉIS LATERAIS E CANVAS */}
          <div className="flex flex-1 overflow-hidden">
            
            {/* BARRA LATERAL ESQUERDA (NOVO DEGRADÊ COMBINANDO COM O BOTÃO - TEXTO/ÍCONES 100% BRANCOS) */}
            <aside className="w-[380px] bg-white border-r flex flex-col overflow-hidden shrink-0 z-10">
              <Tabs defaultValue="projetos" className="flex flex-row w-full h-full">
                
                {/* MENU LATERAL DEGRADÊ COM TEXTO BRANCO */}
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
                            className={`group relative cursor-pointer aspect-square bg-slate-100 rounded-xl border-2 flex flex-col justify-end overflow-hidden hover:border-blue-500 transition-all ${currentModelId === model.id ? 'border-blue-600 shadow-md' : 'border-slate-200'}`}
                            onClick={() => handleLoadModel(model, false)}
                            style={{ backgroundImage: `url(${model.thumbnail_url || ''})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                          >
                            {!model.thumbnail_url && <div className="absolute inset-0 flex items-center justify-center"><Layers className="text-slate-300 w-8 h-8" /></div>}
                            <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-blue-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                              <div className="flex justify-end">
                                <Button variant="destructive" size="icon" className="w-7 h-7 rounded-lg bg-red-500/90 hover:bg-red-600 shadow-sm" onClick={(e) => handleDeleteModel(model.id, e, 'design_models')}><Trash2 className="w-3.5 h-3.5" /></Button>
                              </div>
                              <span className="text-white text-xs font-semibold truncate drop-shadow-md px-1">{model.title}</span>
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
                            className="group relative cursor-pointer aspect-[3/4] bg-blue-50 rounded-xl border border-blue-200 flex flex-col justify-end overflow-hidden hover:border-blue-500 hover:shadow-md transition-all"
                            onClick={() => handleLoadModel(template, true)} 
                            style={{ backgroundImage: `url(${template.thumbnail_url || ''})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                          >
                            {!template.thumbnail_url && <div className="absolute inset-0 flex items-center justify-center"><LayoutTemplate className="text-blue-300 w-8 h-8" /></div>}
                            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                              <div className="flex justify-end">
                                <Button variant="destructive" size="icon" className="w-7 h-7 rounded-lg bg-red-500/90 hover:bg-red-600 shadow-sm" onClick={(e) => handleDeleteModel(template.id, e, 'design_templates')}><Trash2 className="w-3.5 h-3.5" /></Button>
                              </div>
                              <span className="text-white text-xs font-semibold truncate drop-shadow-md px-1">{template.title}</span>
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

            {/* CANVAS ÁREA */}
            <main className="flex-1 flex items-center justify-center p-8 overflow-auto bg-[#f1f2f6] relative">
              <div className="shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-200 bg-white transition-all">
                <canvas ref={canvasRef} />
              </div>
            </main>

            {/* --- BARRA LATERAL DIREITA (PROPRIEDADES) --- */}
            <aside className="w-80 bg-white border-l p-5 flex flex-col gap-6 overflow-y-auto shrink-0 z-10 shadow-[inset_-10px_0_15px_-10px_rgba(0,0,0,0.05)]">
              {selectedObject ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-800">Propriedades</h3>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg" onClick={deleteSelected}><Trash2 className="w-4 h-4" /></Button>
                  </div>

                  {(selectedObject as any).isFrame && selectedObject.type !== 'image' && (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                      <div className="flex items-center gap-2 mb-2 text-amber-700"><ImagePlus className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-widest">Moldura Ativa</span></div>
                      <p className="text-[10px] text-amber-700 leading-tight">Vá à aba "Uploads" e clique numa foto. Ela será inserida automaticamente dentro desta forma.</p>
                    </div>
                  )}

                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-3 text-blue-600"><Wand2 className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-widest">Magic Fill (CRM)</span></div>
                    <Label className="text-[10px] mb-2 block text-blue-800 font-semibold">Preencher automaticamente com:</Label>
                    <Select value={(selectedObject as any).variableId || 'none'} onValueChange={(val) => updateProperty('variableId', val === 'none' ? null : val)}>
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

                  {(selectedObject.type === 'image' || ((selectedObject as any).isFrame && (selectedObject as any).frameType === 'rect') || selectedObject.type === 'rect') && (
                    <div className="space-y-6">
                      {selectedObject.type !== 'circle' && (
                        <div className="space-y-3">
                          <Label className="text-xs font-semibold text-slate-800">Arredondar Cantos (px)</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-100 transition-all"><CornerUpLeft className="w-4 h-4 text-slate-400 shrink-0" /><input type="number" min={0} value={Math.round(getCornerRadii().tl)} onChange={(e) => handleRadiusChange('tl', parseInt(e.target.value))} className="w-full text-xs bg-transparent border-none outline-none text-slate-700 font-medium" /></div>
                            <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-100 transition-all"><CornerUpRight className="w-4 h-4 text-slate-400 shrink-0" /><input type="number" min={0} value={Math.round(getCornerRadii().tr)} onChange={(e) => handleRadiusChange('tr', parseInt(e.target.value))} className="w-full text-xs bg-transparent border-none outline-none text-slate-700 font-medium" /></div>
                            <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-100 transition-all"><CornerDownLeft className="w-4 h-4 text-slate-400 shrink-0" /><input type="number" min={0} value={Math.round(getCornerRadii().bl)} onChange={(e) => handleRadiusChange('bl', parseInt(e.target.value))} className="w-full text-xs bg-transparent border-none outline-none text-slate-700 font-medium" /></div>
                            <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-100 transition-all"><CornerDownRight className="w-4 h-4 text-slate-400 shrink-0" /><input type="number" min={0} value={Math.round(getCornerRadii().br)} onChange={(e) => handleRadiusChange('br', parseInt(e.target.value))} className="w-full text-xs bg-transparent border-none outline-none text-slate-700 font-medium" /></div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center justify-between"><Label className="text-xs font-semibold text-slate-800">Transparência</Label><span className="text-xs text-slate-500 font-medium">{Math.round((selectedObject.opacity || 1) * 100)}%</span></div>
                        <Slider defaultValue={[1]} max={1} step={0.01} value={[selectedObject.opacity || 1]} onValueChange={(vals) => setImageOpacity(vals[0])} className="py-2" />
                      </div>
                    </div>
                  )}

                  {selectedObject.type === 'image' && (
                    <>
                      <Separator className="bg-slate-100" />
                      <div className="space-y-3">
                        <Label className="text-xs font-semibold text-slate-800">Inverter Imagem</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm" className={`rounded-lg ${selectedObject.flipX ? 'border-blue-600 text-blue-700 bg-blue-50' : 'text-slate-600'}`} onClick={toggleFlipX}><FlipHorizontal className="w-4 h-4 mr-2" /> X</Button>
                          <Button variant="outline" size="sm" className={`rounded-lg ${selectedObject.flipY ? 'border-blue-600 text-blue-700 bg-blue-50' : 'text-slate-600'}`} onClick={toggleFlipY}><FlipVertical className="w-4 h-4 mr-2" /> Y</Button>
                        </div>
                      </div>
                    </>
                  )}

                  {['i-text', 'text', 'rect', 'circle', 'triangle', 'line'].includes(selectedObject.type) && !(selectedObject as any).isFrame && (
                    <>
                      <Separator className="bg-slate-100" />
                      <div className="space-y-3">
                        <Label className="text-xs font-semibold text-slate-800">Cor Principal</Label>
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-lg shadow-sm shrink-0 border border-slate-200" style={{ backgroundColor: (selectedObject.type === 'line' ? selectedObject.stroke : selectedObject.fill) as string }} />
                          <Input type="color" className="w-full h-10 p-1 cursor-pointer rounded-lg border-slate-200" value={(selectedObject.type === 'line' ? selectedObject.stroke : selectedObject.fill) as string} onChange={(e) => updateProperty(selectedObject.type === 'line' ? 'stroke' : 'fill', e.target.value)} />
                        </div>
                      </div>
                    </>
                  )}

                  <Separator className="bg-slate-100" />

                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-slate-800">Alinhamento e Camadas</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" size="sm" className="rounded-lg text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50" onClick={centerObject} title="Centralizar"><Maximize className="w-4 h-4" /></Button>
                      <Button variant="outline" size="sm" className="rounded-lg text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50" onClick={bringToFront} title="Mover para frente"><ArrowUpToLine className="w-4 h-4" /></Button>
                      <Button variant="outline" size="sm" className="rounded-lg text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50" onClick={sendToBack} title="Mover para trás"><ArrowDownToLine className="w-4 h-4" /></Button>
                    </div>
                  </div>

                  {(selectedObject.type === 'i-text' || selectedObject.type === 'text') && (
                    <>
                      <Separator className="bg-slate-100" />
                      <div className="space-y-5">
                        <div className="space-y-3">
                          <Label className="text-xs font-semibold text-slate-800">Conteúdo do Texto</Label>
                          <Input value={(selectedObject as any).text} onChange={(e) => updateProperty('text', e.target.value)} className="text-sm rounded-lg border-slate-200 focus:border-blue-400 focus:ring-blue-100" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <Label className="text-xs font-semibold text-slate-800">Tamanho</Label>
                            <Input type="number" value={Math.round((selectedObject as any).fontSize)} onChange={(e) => updateProperty('fontSize', parseInt(e.target.value))} className="rounded-lg border-slate-200 focus:border-blue-400 focus:ring-blue-100" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-xs font-semibold text-slate-800">Fonte</Label>
                          <Select value={(selectedObject as any).fontFamily} onValueChange={(val) => updateProperty('fontFamily', val)}>
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
                    </>
                  )}
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-20 h-20 bg-blue-50/50 rounded-full flex items-center justify-center border-2 border-dashed border-blue-200">
                    <MousePointer2 className="w-8 h-8 text-blue-300" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600">Nada selecionado</p>
                    <p className="text-[11px] text-slate-400 mt-1">Clique em algum elemento no canvas para ver as opções de edição.</p>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}