'use client';

import React, { useState, useEffect } from 'react';
import { useFabricEditor } from '@/hooks/use-fabric-editor';
import { ImageUploads } from '@/components/central63/editor/ImageUploads';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Type as TypeIcon, Image as ImageIcon, Download, Save, Trash2,
  MousePointer2, Layers, Sparkles, ChevronLeft, FlipHorizontal, FlipVertical,
  Maximize, ArrowUpToLine, ArrowDownToLine, CircleDashed, SquareDashed, ImagePlus,
  LayoutTemplate, Shapes, Palette, UploadCloud, Wand2, FolderHeart, Lock, Crown,
  CornerUpLeft, CornerUpRight, CornerDownLeft, CornerDownRight, Loader2, Plus
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function EditorPrincipal() {
  const router = useRouter();
  const [canvasTitle, setCanvasTitle] = useState('Nova Arte Sem Título');
  const [isSaving, setIsSaving] = useState(false);
  
  // ESTADOS NOVOS PARA GESTÃO DE PROJETOS
  const [savedModels, setSavedModels] = useState<any[]>([]);
  const [currentModelId, setCurrentModelId] = useState<string | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  
  const {
    canvasRef, addText, addImage, addShape, addFrame, exportToImage, saveToJson, loadFromJson, clearCanvas,
    deleteSelected, setCornerRadii, toggleFlipX, toggleFlipY,
    setImageOpacity, centerObject, bringToFront, sendToBack, selectedObject, fabricCanvas
  } = useFabricEditor();

  // Buscar os modelos criados pelo utilizador
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

  // --- LÓGICA DE SALVAMENTO (INSERT ou UPDATE) ---
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
        // Atualiza a arte existente
        const { error: updateError } = await supabase.from('design_models').update(payload).eq('id', currentModelId);
        if (updateError) throw updateError;
        toast.success('Projeto atualizado com sucesso!');
      } else {
        // Cria uma nova arte
        const { data, error: insertError } = await supabase.from('design_models').insert(payload).select().single();
        if (insertError) throw insertError;
        setCurrentModelId(data.id);
        toast.success('Novo projeto salvo com sucesso!');
      }

      fetchModels(); // Atualiza a lista na barra lateral
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error(error.message || "Falha ao salvar o modelo.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- LÓGICA DE CARREGAMENTO ---
  const handleLoadModel = (model: any) => {
    loadFromJson(model.data);
    setCanvasTitle(model.title);
    setCurrentModelId(model.id);
    toast.success(`Projeto "${model.title}" carregado!`);
  };

  // --- LÓGICA DE DELEÇÃO ---
  const handleDeleteModel = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que clique no card carregue a arte
    const confirmDelete = window.confirm("Tem certeza que deseja apagar este projeto?");
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('design_models').delete().eq('id', id);
      if (error) throw error;

      toast.success('Projeto apagado!');
      if (currentModelId === id) {
        handleCreateNew(); // Limpa a tela se o projeto deletado for o que está aberto
      }
      fetchModels();
    } catch (error: any) {
      toast.error("Erro ao apagar: " + error.message);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-slate-100 overflow-hidden">
      <header className="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ChevronLeft className="w-5 h-5" /></Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <Input value={canvasTitle} onChange={(e) => setCanvasTitle(e.target.value)} className="border-transparent hover:border-slate-200 focus:border-primary w-64 font-medium h-8" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-primary hover:text-primary/80" onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" /> Novo
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button onClick={() => {
            const link = document.createElement('a'); link.download = `${canvasTitle}.png`; link.href = exportToImage() || ''; link.click();
          }}><Download className="w-4 h-4 mr-2" /> Exportar</Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[380px] bg-white border-r flex flex-col overflow-hidden shrink-0">
          <Tabs defaultValue="projetos" className="flex flex-row w-full h-full">
            <TabsList className="flex flex-col h-full w-[80px] shrink-0 border-r border-slate-200 bg-slate-50 justify-start p-2 gap-2 rounded-none h-auto">
              <TabsTrigger value="projetos" className="flex flex-col items-center justify-center gap-1 w-full h-16 text-[10px] font-medium text-slate-500 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none bg-transparent border-none rounded-xl transition-all"><FolderHeart className="w-5 h-5" /> Projetos</TabsTrigger>
              <TabsTrigger value="elementos" className="flex flex-col items-center justify-center gap-1 w-full h-16 text-[10px] font-medium text-slate-500 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none bg-transparent border-none rounded-xl transition-all"><Shapes className="w-5 h-5" /> Elementos</TabsTrigger>
              <TabsTrigger value="texto" className="flex flex-col items-center justify-center gap-1 w-full h-16 text-[10px] font-medium text-slate-500 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none bg-transparent border-none rounded-xl transition-all"><TypeIcon className="w-5 h-5" /> Texto</TabsTrigger>
              <TabsTrigger value="uploads" className="flex flex-col items-center justify-center gap-1 w-full h-16 text-[10px] font-medium text-slate-500 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none bg-transparent border-none rounded-xl transition-all"><UploadCloud className="w-5 h-5" /> Uploads</TabsTrigger>
              <TabsTrigger value="modelos" className="flex flex-col items-center justify-center gap-1 w-full h-16 text-[10px] font-medium text-slate-500 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none bg-transparent border-none rounded-xl transition-all"><LayoutTemplate className="w-5 h-5" /> Modelos</TabsTrigger>
              <TabsTrigger value="marca" className="flex flex-col items-center justify-center gap-1 w-full h-16 text-[10px] font-medium text-slate-500 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none bg-transparent border-none rounded-xl transition-all"><Palette className="w-5 h-5" /> Marca</TabsTrigger>
              <TabsTrigger value="ferramentas" className="flex flex-col items-center justify-center gap-1 w-full h-16 text-[10px] font-medium text-slate-500 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none bg-transparent border-none rounded-xl transition-all"><Wand2 className="w-5 h-5" /> Apps</TabsTrigger>
            </TabsList>

            <div className="flex-1 h-full overflow-y-auto bg-white">
              
              {/* --- ABA PROJETOS: EXIBE AS ARTES SALVAS --- */}
              <TabsContent value="projetos" className="m-0 p-4 space-y-4 outline-none border-none">
                <h3 className="font-bold text-sm mb-4">Meus Projetos</h3>
                {isLoadingModels ? (
                  <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
                ) : savedModels.length === 0 ? (
                  <div className="text-center p-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                     <p className="text-xs text-slate-500">Nenhum projeto salvo.</p>
                     <p className="text-[10px] text-slate-400 mt-1">Crie sua arte e clique em Salvar!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {savedModels.map((model) => (
                      <div 
                        key={model.id} 
                        className={`group relative cursor-pointer aspect-square bg-slate-100 rounded-lg border-2 flex flex-col justify-end overflow-hidden hover:border-primary transition-all ${currentModelId === model.id ? 'border-primary shadow-md' : 'border-slate-200'}`}
                        onClick={() => handleLoadModel(model)}
                        style={{
                          backgroundImage: `url(${model.thumbnail_url || ''})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        {!model.thumbnail_url && <div className="absolute inset-0 flex items-center justify-center"><Layers className="text-slate-300 w-8 h-8" /></div>}
                        
                        {/* Camada escura hover e botões */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                          <div className="flex justify-end">
                            <Button variant="destructive" size="icon" className="w-6 h-6 rounded bg-red-500/80 hover:bg-red-600" onClick={(e) => handleDeleteModel(model.id, e)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <span className="text-white text-[10px] font-semibold truncate drop-shadow-md">{model.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="modelos" className="m-0 p-4 space-y-4 outline-none border-none">
                <h3 className="font-bold text-sm mb-4">Modelos flow63 (Base)</h3>
                <Input placeholder="Buscar templates..." className="mb-4 text-xs h-8" />
                <p className="text-xs text-slate-500 text-center py-4">Templates globais estarão aqui no futuro.</p>
              </TabsContent>

              <TabsContent value="elementos" className="m-0 p-4 space-y-6 outline-none border-none">
                <div>
                  <h3 className="font-bold text-sm mb-4">Formas</h3>
                  <div className="grid grid-cols-4 gap-2">
                    <Button variant="outline" className="h-12 w-full p-0" onClick={() => addShape('rect')}><div className="w-5 h-5 bg-slate-400" /></Button>
                    <Button variant="outline" className="h-12 w-full p-0" onClick={() => addShape('circle')}><div className="w-5 h-5 bg-slate-400 rounded-full" /></Button>
                    <Button variant="outline" className="h-12 w-full p-0" onClick={() => addShape('triangle')}><div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[16px] border-l-transparent border-r-transparent border-b-slate-400" /></Button>
                    <Button variant="outline" className="h-12 w-full p-0 flex items-center justify-center" onClick={() => addShape('line')}><div className="w-6 h-1 bg-slate-400" /></Button>
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="font-bold text-sm mb-4">Molduras (Fotos)</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="h-20 flex-col gap-2 border-slate-200 border-dashed hover:border-primary hover:text-primary transition-all bg-slate-50" onClick={() => addFrame('circle')}><CircleDashed className="w-5 h-5 text-slate-400" /><span className="text-xs font-semibold">Circular</span></Button>
                    <Button variant="outline" className="h-20 flex-col gap-2 border-slate-200 border-dashed hover:border-primary hover:text-primary transition-all bg-slate-50" onClick={() => addFrame('rect')}><SquareDashed className="w-5 h-5 text-slate-400" /><span className="text-xs font-semibold">Retangular</span></Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="texto" className="m-0 p-4 space-y-4 outline-none border-none">
                <Button className="w-full h-12 text-lg font-bold" variant="default" onClick={() => addText('Inserir um título')}>Inserir um título</Button>
                <Button className="w-full h-10 text-base font-semibold" variant="secondary" onClick={() => addText('Inserir um subtítulo')}>Inserir um subtítulo</Button>
                <Button className="w-full h-8 text-xs" variant="outline" onClick={() => addText('Inserir texto no corpo')}>Inserir texto no corpo</Button>
              </TabsContent>

              <TabsContent value="marca" className="m-0 p-4 outline-none border-none"><p className="text-xs text-slate-500">Kit de marca em breve.</p></TabsContent>
              <TabsContent value="uploads" className="m-0 p-4 outline-none border-none"><ImageUploads onImageSelect={(url) => addImage(url)} /></TabsContent>
              <TabsContent value="ferramentas" className="m-0 p-4 outline-none border-none"><p className="text-xs text-slate-500">Ferramentas de IA em breve.</p></TabsContent>
            </div>
          </Tabs>
        </aside>

        <main className="flex-1 flex items-center justify-center p-12 overflow-auto bg-slate-100 relative">
          <div className="shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-300 bg-white">
            <canvas ref={canvasRef} />
          </div>
        </main>

        <aside className="w-80 bg-white border-l p-4 flex flex-col gap-6 overflow-y-auto shrink-0 z-10">
          {selectedObject ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800">Propriedades</h3>
                <Button variant="ghost" size="icon" onClick={deleteSelected} className="text-red-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
              </div>

              {(selectedObject as any).isFrame && selectedObject.type !== 'image' && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-2">
                  <div className="flex items-center gap-2 mb-2 text-amber-700"><ImagePlus className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-widest">Moldura Vazia</span></div>
                  <p className="text-[10px] text-amber-600 leading-tight">Com esta moldura selecionada, clique numa imagem nos seus Uploads para que ela se adapte automaticamente a este formato.</p>
                </div>
              )}

              <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
                <div className="flex items-center gap-2 mb-3 text-primary"><Sparkles className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-widest">Magic Fill (CRM)</span></div>
                <Label className="text-[10px] mb-2 block text-slate-500 font-semibold">Vincular a campo dinâmico:</Label>
                <Select value={(selectedObject as any).variableId || 'none'} onValueChange={(val) => updateProperty('variableId', val === 'none' ? null : val)}>
                  <SelectTrigger className="h-9 text-xs bg-white border-primary/20 focus:ring-primary/20"><SelectValue placeholder="Escolha um campo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Estático (Normal)</SelectItem>
                    <SelectItem value="valor_imovel">Preço do Imóvel</SelectItem>
                    <SelectItem value="endereco_imovel">Endereço Completo</SelectItem>
                    <SelectItem value="nome_corretor">Nome do Corretor</SelectItem>
                    <SelectItem value="foto_principal">Foto Principal (Imóvel)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {(selectedObject.type === 'image' || ((selectedObject as any).isFrame && (selectedObject as any).frameType === 'rect') || selectedObject.type === 'rect') && (
                <div className="space-y-6">
                  {selectedObject.type !== 'circle' && (
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold text-slate-600">Arredondar Cantos (px)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 border border-slate-200 rounded-md px-2 py-1 bg-slate-50 hover:border-primary transition-colors focus-within:border-primary"><CornerUpLeft className="w-4 h-4 text-slate-400 shrink-0" /><input type="number" min={0} value={Math.round(getCornerRadii().tl)} onChange={(e) => handleRadiusChange('tl', parseInt(e.target.value))} className="w-full text-xs bg-transparent border-none outline-none" /></div>
                        <div className="flex items-center gap-2 border border-slate-200 rounded-md px-2 py-1 bg-slate-50 hover:border-primary transition-colors focus-within:border-primary"><CornerUpRight className="w-4 h-4 text-slate-400 shrink-0" /><input type="number" min={0} value={Math.round(getCornerRadii().tr)} onChange={(e) => handleRadiusChange('tr', parseInt(e.target.value))} className="w-full text-xs bg-transparent border-none outline-none" /></div>
                        <div className="flex items-center gap-2 border border-slate-200 rounded-md px-2 py-1 bg-slate-50 hover:border-primary transition-colors focus-within:border-primary"><CornerDownLeft className="w-4 h-4 text-slate-400 shrink-0" /><input type="number" min={0} value={Math.round(getCornerRadii().bl)} onChange={(e) => handleRadiusChange('bl', parseInt(e.target.value))} className="w-full text-xs bg-transparent border-none outline-none" /></div>
                        <div className="flex items-center gap-2 border border-slate-200 rounded-md px-2 py-1 bg-slate-50 hover:border-primary transition-colors focus-within:border-primary"><CornerDownRight className="w-4 h-4 text-slate-400 shrink-0" /><input type="number" min={0} value={Math.round(getCornerRadii().br)} onChange={(e) => handleRadiusChange('br', parseInt(e.target.value))} className="w-full text-xs bg-transparent border-none outline-none" /></div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between"><Label className="text-xs font-semibold text-slate-600">Transparência</Label><span className="text-xs text-slate-400">{Math.round((selectedObject.opacity || 1) * 100)}%</span></div>
                    <Slider defaultValue={[1]} max={1} step={0.01} value={[selectedObject.opacity || 1]} onValueChange={(vals) => setImageOpacity(vals[0])} />
                  </div>
                </div>
              )}

              {selectedObject.type === 'image' && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Inverter Imagem</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={toggleFlipX} className={selectedObject.flipX ? 'border-primary text-primary bg-primary/5' : ''}><FlipHorizontal className="w-4 h-4 mr-2" /> X</Button>
                      <Button variant="outline" size="sm" onClick={toggleFlipY} className={selectedObject.flipY ? 'border-primary text-primary bg-primary/5' : ''}><FlipVertical className="w-4 h-4 mr-2" /> Y</Button>
                    </div>
                  </div>
                </>
              )}

              {['i-text', 'text', 'rect', 'circle', 'triangle', 'line'].includes(selectedObject.type) && !(selectedObject as any).isFrame && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Cor Principal</Label>
                    <div className="flex gap-2">
                      <div className="w-10 h-10 rounded border shrink-0" style={{ backgroundColor: (selectedObject.type === 'line' ? selectedObject.stroke : selectedObject.fill) as string }} />
                      <Input type="color" className="w-full h-10 p-1 cursor-pointer" value={(selectedObject.type === 'line' ? selectedObject.stroke : selectedObject.fill) as string} onChange={(e) => updateProperty(selectedObject.type === 'line' ? 'stroke' : 'fill', e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-600">Posição e Camadas</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" onClick={centerObject} title="Centralizar na tela"><Maximize className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" onClick={bringToFront} title="Trazer para frente"><ArrowUpToLine className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" onClick={sendToBack} title="Enviar para trás"><ArrowDownToLine className="w-4 h-4" /></Button>
                </div>
              </div>

              {(selectedObject.type === 'i-text' || selectedObject.type === 'text') && (
                <>
                  <Separator />
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-600">Conteúdo do Texto</Label>
                      <Input value={(selectedObject as any).text} onChange={(e) => updateProperty('text', e.target.value)} className="text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600">Tamanho da Fonte</Label>
                        <Input type="number" value={Math.round((selectedObject as any).fontSize)} onChange={(e) => updateProperty('fontSize', parseInt(e.target.value))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-600">Fonte</Label>
                      <Select value={(selectedObject as any).fontFamily} onValueChange={(val) => updateProperty('fontFamily', val)}>
                        <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Inter">Inter</SelectItem>
                          <SelectItem value="Montserrat">Montserrat</SelectItem>
                          <SelectItem value="Playfair Display">Elegante</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-dashed border-slate-300">
                <MousePointer2 className="w-6 h-6 text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-400">Nenhum objeto selecionado</p>
                <p className="text-[10px] text-slate-300 mt-1 uppercase tracking-tighter">Clique em um elemento para editar</p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}