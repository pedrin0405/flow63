'use client';

import React, { useState, useEffect, useRef, Suspense, useCallback, useMemo } from 'react';
import { Artboard } from '@/components/central63/editor/Artboard';
import { ImageUploads } from '@/components/central63/editor/ImageUploads';
import { MagicFill } from '@/components/central63/editor/MagicFill';
import { supabase } from '@/lib/supabase';
import { Sidebar } from '@/components/central63/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { jsPDF } from 'jspdf';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import {
  Type as TypeIcon, Image as ImageIcon, Download, Save, Trash2,
  MousePointer2, Layers, Sparkles, FlipHorizontal, FlipVertical,
  Maximize, ArrowUpToLine, ArrowDownToLine, CircleDashed, SquareDashed, ImagePlus,
  LayoutTemplate, Shapes, Palette, UploadCloud, Wand2, FolderHeart, Lock, Crown,
  CornerUpLeft, CornerUpRight, CornerDownLeft, CornerDownRight, Loader2, Share, Menu, Crop,
  ZoomIn, ZoomOut, Focus, LockOpen, Unlink, Move, Scissors, Check, X,
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ArrowRightToLine, Type, Paintbrush, Undo2, Redo2, Plus, Copy, ChevronUp, ChevronDown, Files, Edit3, FileDown,
  Eye, EyeOff, Square, Circle, Triangle, Minus, Grab, MoreVertical, Home, GripVertical
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../../lib/utils';
import Loading from '../loading';

const glassStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,700&display=swap');

  :root {
    --glass-white: rgba(255, 255, 255, 0.85);
    --glass-border: rgba(255, 255, 255, 1);
    --glass-shadow: 0 16px 40px rgba(0, 0, 0, 0.08), 0 6px 16px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 1);
    --pink: #3b82f6; /* Blue for Flow Design */
    --pink-glow: rgba(59, 130, 246, 0.35);
    --bg-base: #f5f5f7;
    --bg-mesh: radial-gradient(ellipse 80% 80% at 10% -10%, rgba(59, 130, 246, 0.08) 0%, transparent 60%),
               radial-gradient(ellipse 60% 60% at 90% 100%, rgba(139, 92, 246, 0.08) 0%, transparent 55%),
               radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255, 255, 255, 0.8) 0%, transparent 60%),
               linear-gradient(160deg, #fdfdfd 0%, #f5f5f7 100%);
    --text-main: #111827;
    --text-muted: #6b7280;
    --card-bg: #ffffff;
    --border-subtle: rgba(0, 0, 0, 0.05);
  }

  .dark {
    --glass-white: rgba(24, 24, 27, 0.8);
    --glass-border: rgba(255, 255, 255, 0.1);
    --glass-shadow: 0 16px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
    --bg-base: #09090b;
    --bg-mesh: radial-gradient(ellipse 80% 80% at 10% -10%, rgba(59, 130, 246, 0.15) 0%, transparent 60%),
               radial-gradient(ellipse 60% 60% at 90% 100%, rgba(139, 92, 246, 0.1) 0%, transparent 55%),
               linear-gradient(160deg, #09090b 0%, #18181b 100%);
    --text-main: #f8fafc;
    --text-muted: #94a3b8;
    --card-bg: #18181b;
    --border-subtle: rgba(255, 255, 255, 0.1);
  }

  .glass-font { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; }

  .glass-panel {
    background: var(--glass-white);
    backdrop-filter: blur(32px) saturate(200%);
    -webkit-backdrop-filter: blur(32px) saturate(200%);
    border: 1px solid var(--glass-border);
    box-shadow: var(--glass-shadow);
  }

  @keyframes fadeSlideUp {
    from { opacity:0; transform: translateY(16px); }
    to   { opacity:1; transform: translateY(0); }
  }
  .appear-anim { animation: fadeSlideUp 0.5s cubic-bezier(0.23,1,0.32,1) both; }

  .design-card {
    background: var(--card-bg);
    border: 1px solid var(--border-subtle);
    transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  }
  .design-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    border-color: rgba(59, 130, 246, 0.3);
  }

  .glass-scroll::-webkit-scrollbar { width: 4px; }
  .glass-scroll::-webkit-scrollbar-track { background: transparent; }
  .glass-scroll::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.2); border-radius: 99px; }
`;

interface ArtboardData {
  id: string;
  title: string;
  width: number;
  height: number;
  data?: any;
}

function SupportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [canvasTitle, setCanvasTitle] = useState('Nova Arte Sem Título');
  const [isSaving, setIsSaving] = useState(false);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('editor'); 
  const [zoomLevel, setZoomLevel] = useState(0.5);

  const workspaceRef = useRef<HTMLElement>(null);

  const [savedModels, setSavedModels] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [currentModelId, setCurrentModelId] = useState<string | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const [showLanding, setShowLanding] = useState(true);
  const [isNewDesignModalOpen, setIsNewDesignModalOpen] = useState(false);

  const [gradColor1, setGradColor1] = useState('#3b82f6');
  const [gradColor2, setGradColor2] = useState('#1d4ed8');

  // Gatilho para forçar re-renderização da página quando o Fabric altera objetos
  const [, setUpdateTrigger] = useState(0);
  const forceUpdatePage = () => setUpdateTrigger(prev => prev + 1);

  // ESTADO DE MÚLTIPLAS PRANCHETAS
  const [artboards, setArtboards] = useState<ArtboardData[]>([
    { id: uuidv4(), title: 'Prancheta 1', width: 1080, height: 1080 }
  ]);
  const [activeArtboardId, setActiveArtboardId] = useState<string>(artboards[0].id);
  const [editingArtboardId, setEditingArtboardId] = useState<string | null>(null);
  const [expandedArtboardId, setExpandedArtboardId] = useState<string | null>(null);
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);
  const [resizeAllArtboards, setResizeAllArtboards] = useState(false);
  const artboardsMethods = useRef<Record<string, any>>({});
  const [activeEditor, setActiveEditor] = useState<any>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: 'default' | 'destructive';
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
    variant: 'default'
  });

  const showConfirm = (title: string, description: string, onConfirm: () => void, variant: 'default' | 'destructive' = 'destructive') => {
    setConfirmDialog({ isOpen: true, title, description, onConfirm, variant });
  };

  const handleSelectItem = (artboardId: string, obj: any) => {
    const methods = artboardsMethods.current[artboardId];
    if (methods && methods.fabricCanvas.current) {
      if (activeArtboardId !== artboardId) {
        handleSelectArtboard(artboardId, methods);
      }
      methods.fabricCanvas.current.setActiveObject(obj);
      methods.fabricCanvas.current.renderAll();
    }
  };

  const getObjectIcon = (type: string) => {
    switch (type) {
      case 'i-text':
      case 'text': return <TypeIcon className="w-3.5 h-3.5" />;
      case 'image': return <ImageIcon className="w-3.5 h-3.5" />;
      case 'rect': return <Square className="w-3.5 h-3.5" />;
      case 'circle': return <Circle className="w-3.5 h-3.5" />;
      case 'triangle': return <Triangle className="w-3.5 h-3.5" />;
      case 'line': return <Minus className="w-3.5 h-3.5" />;
      default: return <Shapes className="w-3.5 h-3.5" />;
    }
  };

  const getObjectName = (obj: any) => {
    if (obj.customName) return obj.customName;
    if (obj.isFrame) return obj.frameType === 'circle' ? 'Moldura Circular' : 'Moldura Retangular';
    switch (obj.type) {
      case 'i-text':
      case 'text': return obj.text?.substring(0, 20) || 'Texto';
      case 'image': return 'Imagem';
      case 'rect': return 'Retângulo';
      case 'circle': return 'Círculo';
      case 'triangle': return 'Triângulo';
      case 'line': return 'Linha';
      default: return 'Elemento';
    }
  };

  const handleRenameObject = (artboardId: string, obj: any, newName: string) => {
    const methods = artboardsMethods.current[artboardId];
    if (methods && methods.renameObject) {
      methods.renameObject(obj, newName);
    }
    setEditingObjectId(null);
  };

  // Destruturação segura dos métodos do editor ativo
  const {
    addText = () => {}, 
    addImage = () => {}, 
    addShape = () => {}, 
    addFrame = () => {}, 
    detachImageFromFrame = () => {}, 
    exportToImage = () => '', 
    saveToJson = () => '', 
    clearCanvas = () => {}, 
    deleteSelected = () => {},
    setCornerRadii = () => {}, 
    toggleFlipX = () => {}, 
    toggleFlipY = () => {}, 
    setImageOpacity = () => {}, 
    centerObject = () => {}, 
    bringToFront = () => {}, 
    sendToBack = () => {}, 
    toggleLock = () => {}, 
    selectedObject = null, 
    fabricCanvas = { current: null }, 
    contextMenuInfo = { visible: false, x: 0, y: 0 }, 
    setContextMenuInfo = () => {},
    isPanMode = false, 
    togglePanMode = () => {}, 
    cropBox = null, 
    startCrop = () => {}, 
    applyCrop = () => {}, 
    cancelCrop = () => {}, 
    removeCrop = () => {},
    changeTextColor = () => {}, 
    toggleBold = () => {}, 
    toggleItalic = () => {}, 
    toggleUnderline = () => {}, 
    toggleLinethrough = () => {}, 
    setFontSize = () => {}, 
    setTextAlignment = () => {}, 
    toggleList = () => {}, 
    setLineHeight = () => {}, 
    setTextIndent = () => {}, 
    applyGradient = () => {},
    undo = () => {}, 
    redo = () => {}, 
    canUndo = false, 
    canRedo = false,
    setCanvasProperty = (key: string, val: any) => {},
    changeCount = 0,
    toggleObjectVisibility = (o: any) => {},
    toggleObjectLock = (o: any) => {},
    deleteObject = (o: any) => {},
    moveObject = (o: any, d: any) => {},
    renameObject = (o: any, n: any) => {},
    toggleOutlineOnly = () => {}
  } = activeEditor || {};

  const handleRegisterMethods = useCallback((id: string, methods: any) => {
    artboardsMethods.current[id] = methods;
    if (id === activeArtboardId) {
      setActiveEditor(methods);
    }
  }, [activeArtboardId]);

  const handleSelectArtboard = useCallback((id: string, methods: any) => {
    setActiveArtboardId(id);
    setActiveEditor({ ...methods }); 
    setUpdateTrigger(prev => prev + 1);
  }, []);

  const updateProperty = (key: string, value: any) => {
    if (setCanvasProperty && typeof setCanvasProperty === 'function' && activeEditor) {
      setCanvasProperty(key, value);
    } else if (selectedObject && fabricCanvas.current) {
      selectedObject.set(key as any, value);
      fabricCanvas.current.renderAll();
      fabricCanvas.current.fire('object:modified');
    }
    forceUpdatePage();
  };

  const handleAddArtboard = () => {
    const newId = uuidv4();
    const lastArtboard = artboards[artboards.length - 1];
    const newArtboard: ArtboardData = {
      id: newId,
      title: `Prancheta ${artboards.length + 1}`,
      width: lastArtboard.width,
      height: lastArtboard.height
    };
    setArtboards([...artboards, newArtboard]);
    setActiveArtboardId(newId);
    toast.success('Nova prancheta adicionada.');
  };

  const handleDuplicateArtboard = (id: string) => {
    const artboardToDup = artboards.find(a => a.id === id);
    if (!artboardToDup) return;

    const methods = artboardsMethods.current[id];
    const jsonData = methods ? JSON.parse(methods.saveToJson()) : null;

    const newId = uuidv4();
    const newArtboard: ArtboardData = {
      ...artboardToDup,
      id: newId,
      title: `${artboardToDup.title} (Cópia)`,
      data: jsonData
    };

    const index = artboards.findIndex(a => a.id === id);
    const newArtboards = [...artboards];
    newArtboards.splice(index + 1, 0, newArtboard);
    
    setArtboards(newArtboards);
    setActiveArtboardId(newId);
    toast.success('Prancheta duplicada.');
  };

  const handleDeleteArtboard = (id: string) => {
    if (artboards.length <= 1) {
      toast.error('O projeto deve ter pelo menos uma prancheta.');
      return;
    }

    showConfirm(
      "Excluir Prancheta",
      "Tem certeza que deseja apagar esta prancheta permanentemente? Esta ação não pode ser desfeita.",
      () => {
        // Sincroniza as outras pranchetas antes de remover uma para evitar perda de dados no re-render
        const newArtboards = artboards
          .filter(a => a.id !== id)
          .map(a => {
            const methods = artboardsMethods.current[a.id];
            if (methods) {
              try {
                return { ...a, data: JSON.parse(methods.saveToJson()) };
              } catch (e) { console.error(e); }
            }
            return a;
          });

        setArtboards(newArtboards);
        delete artboardsMethods.current[id];

        if (activeArtboardId === id) {
          const nextActive = newArtboards[0];
          setActiveArtboardId(nextActive.id);
          setActiveEditor(artboardsMethods.current[nextActive.id]);
        }
        toast.success('Prancheta removida.');
      }
    );
  };

  const handleMoveArtboard = (id: string, direction: 'up' | 'down') => {
    // Sincroniza o estado atual de todas as pranchetas antes de reordenar
    const syncedArtboards = artboards.map(artboard => {
      const methods = artboardsMethods.current[artboard.id];
      if (methods) {
        try {
          return {
            ...artboard,
            data: JSON.parse(methods.saveToJson())
          };
        } catch (e) {
          console.error("Erro ao sincronizar prancheta antes de mover:", e);
        }
      }
      return artboard;
    });

    const index = syncedArtboards.findIndex(a => a.id === id);
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === syncedArtboards.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const reorderedArtboards = [...syncedArtboards];
    const [removed] = reorderedArtboards.splice(index, 1);
    reorderedArtboards.splice(newIndex, 0, removed);
    
    setArtboards(reorderedArtboards);
    toast.info(`Prancheta movida para ${direction === 'up' ? 'cima' : 'baixo'}`);
  };

  const handleRenameArtboard = (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    // Sincroniza antes de atualizar para evitar perda de dados no re-render
    setArtboards(prev => prev.map(a => {
      const methods = artboardsMethods.current[a.id];
      const base = a.id === id ? { ...a, title: newTitle } : a;
      if (methods) {
        try {
          return { ...base, data: JSON.parse(methods.saveToJson()) };
        } catch (e) { console.error(e); }
      }
      return base;
    }));
    
    setEditingArtboardId(null);
    toast.success("Prancheta renomeada");
  };

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
    const newId = uuidv4();
    setArtboards([{ id: newId, title: 'Prancheta 1', width: 1080, height: 1080 }]);
    setActiveArtboardId(newId);
    setCanvasTitle('Nova Arte Sem Título');
    setCurrentModelId(null);
    setShowLanding(false);
    toast.success('Novo projeto criado.');
  };

  const handleResizeCanvas = (width: number, height: number) => {
    const syncedArtboards = artboards.map(artboard => {
      const methods = artboardsMethods.current[artboard.id];
      const base = (resizeAllArtboards || artboard.id === activeArtboardId) ? { ...artboard, width, height } : artboard;
      if (methods) {
        try {
          return {
            ...base,
            data: JSON.parse(methods.saveToJson())
          };
        } catch (e) {
          console.error("Erro ao sincronizar prancheta antes de redimensionar:", e);
        }
      }
      return base;
    });

    setArtboards(syncedArtboards);
    toast.success(`Prancheta${resizeAllArtboards ? 's' : ''} redimensionada${resizeAllArtboards ? 's' : ''}.`);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2)); 
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.1)); 
  };

  const handleResetZoom = () => {
    setZoomLevel(0.6);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const artboardsWithData = artboards.map(a => {
        const methods = artboardsMethods.current[a.id];
        return {
          ...a,
          data: methods ? JSON.parse(methods.saveToJson()) : a.data
        };
      });

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Precisa fazer login para guardar modelos.");

      const firstMethods = artboardsMethods.current[artboards[0].id];
      const thumbnailUrl = firstMethods?.exportToImage(); 
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
        data: { artboards: artboardsWithData },
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
      
      const artboardsWithData = artboards.map(a => {
        const methods = artboardsMethods.current[a.id];
        return {
          ...a,
          data: methods ? JSON.parse(methods.saveToJson()) : a.data
        };
      });

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Precisa fazer login.");

      const firstMethods = artboardsMethods.current[artboards[0].id];
      const thumbnailUrl = firstMethods?.exportToImage(); 
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
        data: { artboards: artboardsWithData },
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
    if (model.data?.artboards) {
      setArtboards(model.data.artboards);
      setActiveArtboardId(model.data.artboards[0].id);
    } else {
      const newId = uuidv4();
      setArtboards([{ 
        id: newId, 
        title: 'Prancheta 1', 
        width: model.data.customCanvasSize?.width || 1080, 
        height: model.data.customCanvasSize?.height || 1080,
        data: model.data
      }]);
      setActiveArtboardId(newId);
    }

    if (isTemplate) {
      setCanvasTitle(`${model.title} (Cópia)`);
      setCurrentModelId(null); 
      toast.success(`Template Base carregado.`);
    } else {
      setCanvasTitle(model.title);
      setCurrentModelId(model.id);
      toast.success(`Projeto "${model.title}" carregado!`);
    }
    setShowLanding(false);
  };

  const handleDeleteModel = async (id: string, e: React.MouseEvent, table: 'design_models' | 'design_templates') => {
    e.stopPropagation(); 
    
    showConfirm(
      "Apagar Design Permanentemente?",
      "Tem certeza que deseja apagar permanentemente este design? Esta ação removerá o arquivo de nossos servidores e não poderá ser desfeita.",
      async () => {
        try {
          const { error } = await supabase.from(table).delete().eq('id', id);
          if (error) throw error;

          toast.success('Design apagado com sucesso!');
          if (currentModelId === id && table === 'design_models') {
            handleCreateNew(); 
          }
          fetchModels();
        } catch (error: any) {
          toast.error("Erro ao apagar: " + error.message);
        }
      }
    );
  };

  const [showDownloadSettings, setShowDownloadSettings] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg' | 'pdf'>('png');
  const [exportQuality, setExportQuality] = useState(1);
  const [exportTransparent, setExportTransparent] = useState(false);
  const [selectedArtboardsForExport, setSelectedArtboardsForExport] = useState<string[]>([]);

  // Sincroniza pranchetas selecionadas quando a lista de pranchetas muda
  useEffect(() => {
    setSelectedArtboardsForExport(artboards.map(a => a.id));
  }, [artboards]);

  const handleExport = async () => {
    try {
      setIsSaving(true);
      const targets = artboards.filter(a => selectedArtboardsForExport.includes(a.id));
      
      if (targets.length === 0) {
        toast.error("Selecione pelo menos uma prancheta para exportar.");
        setIsSaving(false);
        return;
      }

      // Verifica se todos os editores estão prontos
      const missingMethods = targets.some(a => !artboardsMethods.current[a.id]);
      if (missingMethods) {
        toast.error("Algumas pranchetas ainda estão carregando. Por favor, aguarde um momento.");
        setIsSaving(false);
        return;
      }

      if (exportFormat === 'pdf') {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [targets[0].width, targets[0].height]
        });

        for (let i = 0; i < targets.length; i++) {
          const artboard = targets[i];
          const methods = artboardsMethods.current[artboard.id];
          if (!methods) continue;

          const dataUrl = methods.exportToImage(); 
          if (!dataUrl) continue;

          if (i > 0) doc.addPage([artboard.width, artboard.height], artboard.width > artboard.height ? 'landscape' : 'portrait');
          doc.addImage(dataUrl, 'PNG', 0, 0, artboard.width, artboard.height);
        }

        doc.save(`${canvasTitle}.pdf`);
        toast.success('PDF gerado com sucesso!');
      } else {
        // Exportação de Imagens
        for (const artboard of targets) {
          const methods = artboardsMethods.current[artboard.id];
          if (!methods) continue;

          const canvas = methods.fabricCanvas.current;
          const originalBg = canvas.backgroundColor;
          
          if (exportTransparent && exportFormat === 'png') {
            canvas.backgroundColor = 'transparent';
          } else {
            canvas.backgroundColor = '#ffffff';
          }
          canvas.renderAll();

          const dataUrl = canvas.toDataURL({
            format: exportFormat,
            quality: 1,
            multiplier: exportQuality
          });

          // Restaura fundo
          canvas.backgroundColor = originalBg;
          canvas.renderAll();

          const link = document.createElement('a');
          link.download = `${canvasTitle}_${artboard.title}.${exportFormat}`;
          link.href = dataUrl;
          link.click();
          
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        toast.success(`${targets.length} imagem(ns) exportada(s)!`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao exportar arquivo.");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // Delete key
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedObject && !selectedObject.isEditing) {
          deleteSelected();
        }
      }

      // Ctrl/Cmd + Z (Undo)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y (Redo)
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObject, undo, redo, deleteSelected]);

  // PROXY PARA O MAGIC FILL:
  const activeItemForMagicFill = selectedObject ? new Proxy(selectedObject, {
    get(target: any, prop: string | symbol) {
      if (prop === 'locked') return false; 
      const value = target[prop];
      if (typeof value === 'function') {
        return value.bind(target);
      }
      return value;
    }
  }) : null;

  const NewDesignDialog = () => (
    <Dialog open={isNewDesignModalOpen} onOpenChange={setIsNewDesignModalOpen}>
      <DialogContent className="rounded-[2rem] max-w-md p-8 glass-panel border-none shadow-2xl overflow-hidden glass-font">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Novo Design</DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400 font-medium">Escolha um formato para começar sua arte.</DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Button variant="outline" className="h-24 flex-col gap-2 rounded-2xl border-slate-100 dark:border-white/10 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 group transition-all" onClick={() => { handleCreateNew(); handleResizeCanvas(1080, 1080); setIsNewDesignModalOpen(false); }}>
            <Square className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
            <div className="text-center">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200">Feed Quadrado</div>
              <div className="text-[10px] text-slate-400">1080 x 1080 px</div>
            </div>
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2 rounded-2xl border-slate-100 dark:border-white/10 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 group transition-all" onClick={() => { handleCreateNew(); handleResizeCanvas(1080, 1350); setIsNewDesignModalOpen(false); }}>
            <FileDown className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
            <div className="text-center">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200">Feed Vertical</div>
              <div className="text-[10px] text-slate-400">1080 x 1350 px</div>
            </div>
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2 rounded-2xl border-slate-100 dark:border-white/10 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 group transition-all" onClick={() => { handleCreateNew(); handleResizeCanvas(1080, 1920); setIsNewDesignModalOpen(false); }}>
            <Maximize className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
            <div className="text-center">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200">Story / Reels</div>
              <div className="text-[10px] text-slate-400">1080 x 1920 px</div>
            </div>
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2 rounded-2xl border-slate-100 dark:border-white/10 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 group transition-all" onClick={() => { handleCreateNew(); handleResizeCanvas(1080, 1440); setIsNewDesignModalOpen(false); }}>
            <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
            <div className="text-center">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200">Capa Reels</div>
              <div className="text-[10px] text-slate-400">1080 x 1440 px</div>
            </div>
          </Button>
        </div>
        
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/10">
           <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Tamanho Personalizado</Label>
           <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-1.5">
                <Label className="text-[10px] text-slate-500 font-bold uppercase">Largura</Label>
                <Input type="number" id="landing-w" defaultValue={1080} className="h-10 rounded-xl bg-slate-50/50 dark:bg-white/5 border-slate-200 dark:border-white/10" />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label className="text-[10px] text-slate-500 font-bold uppercase">Altura</Label>
                <Input type="number" id="landing-h" defaultValue={1080} className="h-10 rounded-xl bg-slate-50/50 dark:bg-white/5 border-slate-200 dark:border-white/10" />
              </div>
              <Button className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200/50" onClick={() => {
                const w = Number((document.getElementById('landing-w') as HTMLInputElement).value);
                const h = Number((document.getElementById('landing-h') as HTMLInputElement).value);
                handleCreateNew();
                handleResizeCanvas(w, h);
                setIsNewDesignModalOpen(false);
              }}>Criar</Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (showLanding) {
    return (
      <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground relative glass-font">
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
        
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <style dangerouslySetInnerHTML={{ __html: glassStyles }} />
          
          <div className="absolute inset-0 bg-[var(--bg-mesh)] z-0" />
          
          {/* Header Superior - Divisão visual solicitada */}
          <header className="relative z-20 border-b border-slate-200/60 dark:border-white/5 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl shrink-0">
            <div className="max-w-6xl mx-auto px-6 py-6 md:px-12">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 appear-anim">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 lg:hidden mb-2 cursor-pointer" onClick={() => setSidebarOpen(true)}>
                    <Menu className="w-6 h-6 text-blue-600" />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">Flow Design</h1>
                  <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium max-w-xl">Crie designs profissionais e impactantes em segundos.</p>
                </div>
                
                <Button 
                  onClick={() => setIsNewDesignModalOpen(true)}
                  className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-xl shadow-xl shadow-blue-200/50 dark:shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex gap-2"
                >
                  <Plus className="w-5 h-5 stroke-[3]" /> Novo Design
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 relative z-10 overflow-y-auto glass-scroll px-6 py-10 md:px-12 md:py-16">
            <div className="max-w-6xl mx-auto space-y-12">
              
              {/* O conteúdo principal começa aqui, o cabeçalho foi movido para fora do scroll */}

              {/* Recent Designs */}
              <section className="space-y-6 appear-anim [animation-delay:0.1s]">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FolderHeart className="w-5 h-5 text-blue-500" /> Designs Recentes
                  </h2>
                </div>
                
                {isLoadingModels ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[1,2,3,4].map(i => <div key={i} className="aspect-[4/3] rounded-2xl bg-slate-200 dark:bg-white/5 animate-pulse" />)}
                  </div>
                ) : savedModels.length === 0 ? (
                  <div className="glass-panel rounded-3xl p-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto">
                      <Layers className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">Nenhum design recente</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Comece seu primeiro projeto clicando no botão acima.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {savedModels.map((model) => (
                      <div 
                        key={model.id} 
                        onClick={() => handleLoadModel(model, false)}
                        className="design-card rounded-2xl p-4 cursor-pointer group flex flex-col gap-3"
                      >
                        <div className="aspect-[4/3] rounded-xl bg-slate-50 dark:bg-white/5 overflow-hidden flex items-center justify-center relative">
                          {model.thumbnail_url ? (
                            <img src={model.thumbnail_url} alt={model.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          ) : (
                            <Layers className="text-slate-300 dark:text-slate-700 w-12 h-12" />
                          )}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="destructive" size="icon" className="w-8 h-8 rounded-xl bg-red-500/90 hover:bg-red-600 shadow-lg" onClick={(e) => handleDeleteModel(model.id, e, 'design_models')}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="px-1">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">{model.title}</h4>
                          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                            {model.data?.artboards ? `${model.data.artboards.length} pranchetas` : '1 prancheta'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Templates */}
              <section className="space-y-6 appear-anim [animation-delay:0.2s]">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <LayoutTemplate className="w-5 h-5 text-blue-500" /> Modelos Base
                  </h2>
                </div>
                
                {templates.length === 0 ? (
                  <div className="glass-panel rounded-3xl p-8 text-center bg-blue-50/30 dark:bg-blue-900/5">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Nenhum template global disponível no momento.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {templates.map((template) => (
                      <div 
                        key={template.id} 
                        onClick={() => handleLoadModel(template, true)}
                        className="design-card rounded-2xl p-4 cursor-pointer group flex flex-col gap-3"
                      >
                        <div className="aspect-[4/3] rounded-xl bg-slate-50 dark:bg-white/5 overflow-hidden flex items-center justify-center relative">
                          {template.thumbnail_url ? (
                            <img src={template.thumbnail_url} alt={template.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          ) : (
                            <LayoutTemplate className="text-slate-300 dark:text-zinc-700 w-12 h-12" />
                          )}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="destructive" size="icon" className="w-8 h-8 rounded-xl bg-red-500/90 hover:bg-red-600 shadow-lg" onClick={(e) => handleDeleteModel(template.id, e, 'design_templates')}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="px-1">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">{template.title}</h4>
                          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">Template Base</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

            </div>
          </main>
        </div>
        <NewDesignDialog />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
      
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

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 dark:bg-[#09090b]">
        <div className="flex flex-col flex-1 overflow-hidden relative">
          
          <div className="h-14 border-b bg-white dark:bg-zinc-900 dark:border-zinc-800 flex items-center justify-between px-6 shrink-0 z-20">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 lg:hidden cursor-pointer" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5 text-blue-600" />
              </div>
              <div 
                className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text font-bold text-lg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowLanding(true)}
              >
                <Layers className="w-6 h-6 text-blue-600" /> Flow Design
              </div>
              <Separator orientation="vertical" className="h-6 mx-2 dark:bg-zinc-800" />
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 px-3 text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 gap-2 font-semibold"
                onClick={() => setShowLanding(true)}
              >
                <Home className="w-4 h-4" /> Voltar
              </Button>
              <Separator orientation="vertical" className="h-6 mx-2 dark:bg-zinc-800" />
              <Input 
                value={canvasTitle} 
                onChange={(e) => setCanvasTitle(e.target.value)} 
                className="border-transparent hover:border-blue-200 dark:hover:border-blue-800 focus:border-blue-500 w-64 font-medium h-9 text-base transition-colors bg-transparent dark:text-zinc-100" 
              />
              
              <div className="flex items-center gap-1 ml-2">
                <Button 
                  variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-zinc-400" 
                  onClick={undo} disabled={!canUndo} title="Desfazer (Ctrl+Z)"
                >
                  <Undo2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-zinc-400" 
                  onClick={redo} disabled={!canRedo} title="Refazer (Ctrl+Y)"
                >
                  <Redo2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isSaving && <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2 mr-2"><Loader2 className="w-3 h-3 animate-spin"/> Guardando...</div>}
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="text-blue-900 dark:text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium">
                    <Crop className="w-4 h-4 mr-2" /> Formato
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-4 rounded-xl shadow-xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900" align="end">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-100 mb-3">Tamanho da Prancheta</h4>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-bold tracking-wider">Largura</Label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          defaultValue={1080}
                          id="custom-width"
                          className="h-9 text-xs pr-6 rounded-lg border-slate-200 dark:border-zinc-800 focus:border-blue-500 bg-transparent dark:text-zinc-100" 
                        />
                        <span className="absolute right-2 top-2.5 text-[10px] text-slate-400">px</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-bold tracking-wider">Altura</Label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          defaultValue={1080}
                          id="custom-height"
                          className="h-9 text-xs pr-6 rounded-lg border-slate-200 dark:border-zinc-800 focus:border-blue-500 bg-transparent dark:text-zinc-100" 
                        />
                        <span className="absolute right-2 top-2.5 text-[10px] text-slate-400">px</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <input 
                      type="checkbox" 
                      id="resize-all" 
                      checked={resizeAllArtboards} 
                      onChange={(e) => setResizeAllArtboards(e.target.checked)}
                      className="w-3 h-3 rounded text-blue-600"
                    />
                    <label htmlFor="resize-all" className="text-[10px] font-medium text-slate-600 dark:text-zinc-400">Aplicar em todas</label>
                  </div>

                  <Button className="w-full h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg" onClick={() => {
                    const w = Number((document.getElementById('custom-width') as HTMLInputElement).value);
                    const h = Number((document.getElementById('custom-height') as HTMLInputElement).value);
                    handleResizeCanvas(w, h);
                  }}>
                    Redimensionar {resizeAllArtboards ? 'Todas' : 'Ativa'}
                  </Button>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button variant="outline" className="h-8 text-[10px] font-medium border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400" onClick={() => handleResizeCanvas(1080, 1080)}>Feed Quad.</Button>
                    <Button variant="outline" className="h-8 text-[10px] font-medium border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400" onClick={() => handleResizeCanvas(1080, 1350)}>Feed Vert.</Button>
                    <Button variant="outline" className="h-8 text-[10px] font-medium border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400" onClick={() => handleResizeCanvas(1080, 1920)}>Story</Button>
                    <Button variant="outline" className="h-8 text-[10px] font-medium border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400" onClick={() => handleResizeCanvas(1080, 1440)}>Capa Reels</Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Button variant="ghost" className="text-blue-900 dark:text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium" onClick={handleCreateNew}>
                Novo Design
              </Button>
              
              <DropdownMenu onOpenChange={(open) => { if(!open) setShowDownloadSettings(false); }}>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 shadow-sm font-semibold rounded-lg px-6 border-0">
                    <Share className="w-4 h-4 mr-2" /> Compartilhar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0 rounded-xl shadow-2xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                  {!showDownloadSettings ? (
                    <>
                      <div className="p-4 pb-3">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-100">Opções do Design</h4>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">Salve ou exporte sua arte.</p>
                      </div>
                      
                      <DropdownMenuSeparator className="dark:bg-zinc-800" />
                      
                      <div className="p-2 space-y-1">
                        <DropdownMenuItem onClick={handleSave} className="cursor-pointer py-3 rounded-lg focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:text-blue-700 dark:focus:text-blue-400">
                          <Save className="w-4 h-4 mr-3 text-slate-500 dark:text-zinc-400" />
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">Salvar Projeto</span>
                            <span className="text-[10px] text-slate-500 dark:text-zinc-500">Guarda todas as pranchetas</span>
                          </div>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={handleSaveAsTemplate} className="cursor-pointer py-3 rounded-lg focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:text-blue-700 dark:focus:text-blue-400">
                          <LayoutTemplate className="w-4 h-4 mr-3 text-slate-500 dark:text-zinc-400" />
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">Salvar como Template</span>
                            <span className="text-[10px] text-slate-500 dark:text-zinc-500">Para toda a equipe</span>
                          </div>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="my-1 dark:bg-zinc-800" />

                        <DropdownMenuItem onClick={(e) => { e.preventDefault(); setShowDownloadSettings(true); }} className="cursor-pointer py-3 rounded-lg focus:bg-blue-600 focus:text-white group">
                          <Download className="w-4 h-4 mr-3 text-slate-500 dark:text-zinc-400 group-focus:text-white" />
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">Baixar</span>
                            <span className="text-[10px] text-slate-500 dark:text-zinc-500 group-focus:text-blue-100">PNG, JPG, PDF</span>
                          </div>
                        </DropdownMenuItem>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col animate-in slide-in-from-right-2 duration-200">
                      <div className="p-4 border-b dark:border-zinc-800 flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full dark:text-zinc-400" onClick={(e) => { e.preventDefault(); setShowDownloadSettings(false); }}>
                          <X className="w-4 h-4" />
                        </Button>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-100">Baixar</h4>
                      </div>

                      <div className="p-5 space-y-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Tipo de arquivo</Label>
                          <Select value={exportFormat} onValueChange={(val: any) => setExportFormat(val)}>
                            <SelectTrigger className="h-11 rounded-xl border-slate-200 dark:border-zinc-800 focus:ring-blue-100 bg-transparent dark:text-zinc-100">
                              <SelectValue placeholder="Selecione o formato" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                              <SelectItem value="png" className="py-2.5 rounded-lg">PNG <span className="text-[10px] text-slate-400 ml-2">Melhor para imagens</span></SelectItem>
                              <SelectItem value="jpg" className="py-2.5 rounded-lg">JPG <span className="text-[10px] text-slate-400 ml-2">Melhor para web</span></SelectItem>
                              <SelectItem value="pdf" className="py-2.5 rounded-lg">PDF <span className="text-[10px] text-slate-400 ml-2">Melhor para impressão</span></SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {exportFormat !== 'pdf' && (
                          <>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <Label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Tamanho</Label>
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">{exportQuality}x</span>
                              </div>
                              <Slider 
                                min={0.5} max={3} step={0.5} 
                                value={[exportQuality]} 
                                onValueChange={(v) => setExportQuality(v[0])} 
                                className="py-2"
                              />
                              <p className="text-[10px] text-slate-400">Aumente para melhor resolução.</p>
                            </div>

                            {exportFormat === 'png' && (
                              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                                <div className="space-y-0.5">
                                  <Label htmlFor="transparency" className="text-xs font-bold text-slate-700 dark:text-zinc-200">Fundo transparente</Label>
                                  <p className="text-[10px] text-slate-500 dark:text-zinc-500">Remove o fundo branco</p>
                                </div>
                                <input 
                                  type="checkbox" 
                                  id="transparency"
                                  checked={exportTransparent}
                                  onChange={(e) => setExportTransparent(e.target.checked)}
                                  className="w-4 h-4 rounded border-slate-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                                />
                              </div>
                            )}
                          </>
                        )}

                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Selecionar pranchetas</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full h-11 justify-between px-4 rounded-xl border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 font-medium bg-transparent">
                                <span className="truncate">
                                  {selectedArtboardsForExport.length === artboards.length 
                                    ? "Todas as pranchetas" 
                                    : `${selectedArtboardsForExport.length} prancheta(s) selecionada(s)`}
                                </span>
                                <ChevronDown className="w-4 h-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-2 rounded-xl shadow-xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900" align="start">
                              <div className="max-h-60 overflow-y-auto space-y-1">
                                <div 
                                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                                  onClick={() => {
                                    if (selectedArtboardsForExport.length === artboards.length) setSelectedArtboardsForExport([]);
                                    else setSelectedArtboardsForExport(artboards.map(a => a.id));
                                  }}
                                >
                                  <input 
                                    type="checkbox" 
                                    checked={selectedArtboardsForExport.length === artboards.length}
                                    onChange={() => {}} 
                                    className="rounded border-slate-300 dark:border-zinc-700"
                                  />
                                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">Todas ({artboards.length})</span>
                                </div>
                                <Separator className="my-1 dark:bg-zinc-800" />
                                {artboards.map((artboard, idx) => (
                                  <div 
                                    key={artboard.id}
                                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                                    onClick={() => {
                                      if (selectedArtboardsForExport.includes(artboard.id)) {
                                        setSelectedArtboardsForExport(prev => prev.filter(id => id !== artboard.id));
                                      } else {
                                        setSelectedArtboardsForExport(prev => [...prev, artboard.id]);
                                      }
                                    }}
                                  >
                                    <input 
                                      type="checkbox" 
                                      checked={selectedArtboardsForExport.includes(artboard.id)}
                                      onChange={() => {}}
                                      className="rounded border-slate-300 dark:border-zinc-700"
                                    />
                                    <span className="text-xs text-slate-600 dark:text-zinc-400">{idx + 1}. {artboard.title}</span>
                                  </div>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>

                        <Button 
                          onClick={handleExport}
                          disabled={selectedArtboardsForExport.length === 0 || isSaving}
                          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900/40"
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                          Baixar
                        </Button>
                      </div>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={20} minSize={15} maxSize={35} className="flex flex-col">
                <aside className="h-full w-full bg-white dark:bg-zinc-900 border-r dark:border-zinc-800 flex flex-col overflow-hidden z-10">
                  <Tabs defaultValue="pranchetas" className="flex flex-row w-full h-full">
                    
                    <TabsList className="flex flex-col h-full w-[80px] shrink-0 bg-gradient-to-b from-blue-600 to-indigo-600 text-white justify-start py-4 gap-3 rounded-none h-auto border-none">
                      
                      <TabsTrigger value="pranchetas" className="group flex flex-col items-center justify-center gap-1.5 w-[68px] h-16 text-[10px] font-medium text-white data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-none bg-transparent border-none rounded-xl transition-all hover:bg-white/10 hover:text-white">
                        <Files className="w-[22px] h-[22px] text-white" /> Páginas
                      </TabsTrigger>

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
                      
                      <TabsTrigger value="uploads" className="group flex flex-col items-center justify-center gap-1.5 w-[68px] h-16 text-[10px] font-medium text-white data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-none bg-transparent border-none rounded-xl transition-all hover:bg-white/10 hover:text-white">
                        <UploadCloud className="w-[22px] h-[22px] text-white" /> Uploads
                      </TabsTrigger>
                      
                      <TabsTrigger value="ferramentas" className="group flex flex-col items-center justify-center gap-1.5 w-[68px] h-16 text-[10px] font-medium text-white data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-none bg-transparent border-none rounded-xl transition-all hover:bg-white/10 hover:text-white">
                        <Wand2 className="w-[22px] h-[22px] text-white" /> Ferramentas
                      </TabsTrigger>

                    </TabsList>

                    <div className="flex-1 h-full overflow-y-auto bg-white dark:bg-zinc-900 shadow-[inset_10px_0_15px_-10px_rgba(0,0,0,0.05)]">
                      
                      <TabsContent value="pranchetas" className="m-0 p-5 space-y-4 outline-none border-none">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-base text-slate-800 dark:text-zinc-100">Pranchetas</h3>
                          <Button size="sm" onClick={handleAddArtboard} className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg">
                            <Plus className="w-3.5 h-3.5" /> Adicionar
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          {artboards.map((artboard, index) => {
                            const methods = artboardsMethods.current[artboard.id];
                            const objects = methods?.fabricCanvas.current?.getObjects() || [];
                            const isExpanded = expandedArtboardId === artboard.id;

                            return (
                              <div key={artboard.id} className="space-y-1">
                                <div 
                                  className={cn(
                                    "group p-3 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer",
                                    activeArtboardId === artboard.id 
                                      ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm" 
                                      : "border-slate-100 dark:border-zinc-800 hover:border-slate-200 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                                  )}
                                  onClick={() => {
                                    if (methods) handleSelectArtboard(artboard.id, methods);
                                  }}
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div 
                                      className="flex items-center gap-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedArtboardId(isExpanded ? null : artboard.id);
                                      }}
                                    >
                                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-400 -rotate-90" />}
                                      <div className={cn(
                                        "w-7 h-7 rounded-lg border flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors shadow-sm",
                                        activeArtboardId === artboard.id 
                                          ? "bg-blue-600 border-blue-700 text-white" 
                                          : "bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400"
                                      )}>
                                        {index + 1}
                                      </div>
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        {editingArtboardId === artboard.id ? (
                                          <Input
                                            autoFocus
                                            defaultValue={artboard.title}
                                            className="h-7 text-sm font-bold px-1 py-0 rounded-sm border-blue-400 bg-transparent dark:text-zinc-100"
                                            onClick={(e) => e.stopPropagation()}
                                            onBlur={(e) => handleRenameArtboard(artboard.id, e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleRenameArtboard(artboard.id, (e.target as HTMLInputElement).value);
                                              if (e.key === 'Escape') setEditingArtboardId(null);
                                            }}
                                          />
                                        ) : (
                                          <span 
                                            className={cn(
                                              "text-sm font-bold truncate cursor-text hover:text-blue-600 dark:hover:text-blue-400 transition-colors",
                                              activeArtboardId === artboard.id ? "text-blue-700 dark:text-blue-400" : "text-slate-800 dark:text-zinc-200"
                                            )}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingArtboardId(artboard.id);
                                            }}
                                          >
                                            {artboard.title}
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-medium">{artboard.width}x{artboard.height}px</span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 rounded-lg" onClick={(e) => e.stopPropagation()}>
                                          <MoreVertical className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl shadow-xl dark:bg-zinc-900 dark:border-zinc-800">
                                        <DropdownMenuItem onClick={() => setEditingArtboardId(artboard.id)} className="rounded-lg">
                                          <Edit3 className="w-4 h-4 mr-2 text-slate-500 dark:text-zinc-400" /> Renomear
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleMoveArtboard(artboard.id, 'up')} disabled={index === 0} className="rounded-lg">
                                          <ChevronUp className="w-4 h-4 mr-2 text-slate-500 dark:text-zinc-400" /> Mover para cima
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleMoveArtboard(artboard.id, 'down')} disabled={index === artboards.length - 1} className="rounded-lg">
                                          <ChevronDown className="w-4 h-4 mr-2 text-slate-500 dark:text-zinc-400" /> Mover para baixo
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDuplicateArtboard(artboard.id)} className="rounded-lg">
                                          <Copy className="w-4 h-4 mr-2 text-slate-500 dark:text-zinc-400" /> Duplicar
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="dark:bg-zinc-800" />
                                        <DropdownMenuItem className="text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 focus:text-red-700 rounded-lg" onClick={(e) => { e.stopPropagation(); handleDeleteArtboard(artboard.id); }}>
                                          <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="pl-8 pr-2 py-1 space-y-1 bg-slate-50/50 dark:bg-zinc-800/20 rounded-b-xl border-x border-b border-slate-100 dark:border-zinc-800">
                                    {objects.length === 0 ? (
                                      <p className="text-[10px] text-slate-400 py-2 italic text-center">Nenhum item nesta prancheta</p>
                                    ) : (
                                      [...objects].reverse().map((obj: any, objIdx) => (
                                        <div 
                                          key={objIdx}
                                          className={cn(
                                            "group/item flex items-center justify-between p-2 rounded-lg transition-colors border",
                                            selectedObject === obj 
                                              ? "bg-white dark:bg-zinc-800 border-blue-200 dark:border-blue-900 shadow-sm" 
                                              : "border-transparent hover:bg-white dark:hover:bg-zinc-800 hover:border-slate-200 dark:hover:border-zinc-700"
                                          )}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectItem(artboard.id, obj);
                                          }}
                                        >
                                          <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <div className="text-slate-400">{getObjectIcon(obj.type)}</div>
                                            <div className="flex-1 min-w-0">
                                              {editingObjectId === `${artboard.id}-${objIdx}` ? (
                                                <Input
                                                  autoFocus
                                                  defaultValue={getObjectName(obj)}
                                                  className="h-5 text-[10px] px-1 py-0 rounded-sm border-blue-400 bg-transparent dark:text-zinc-100"
                                                  onClick={(e) => e.stopPropagation()}
                                                  onBlur={(e) => handleRenameObject(artboard.id, obj, e.target.value)}
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleRenameObject(artboard.id, obj, (e.target as HTMLInputElement).value);
                                                    if (e.key === 'Escape') setEditingObjectId(null);
                                                  }}
                                                />
                                              ) : (
                                                <span className="text-[10px] font-medium text-slate-600 dark:text-zinc-400 truncate block">
                                                  {getObjectName(obj)}
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                            <Button 
                                              variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400" 
                                              onClick={(e) => { e.stopPropagation(); toggleObjectVisibility(obj); }}
                                              title={obj.visible ? "Ocultar" : "Mostrar"}
                                            >
                                              {obj.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-red-400" />}
                                            </Button>
                                            <Button 
                                              variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-amber-600 dark:hover:text-amber-500" 
                                              onClick={(e) => { e.stopPropagation(); toggleObjectLock(obj); }}
                                              title={obj.locked ? "Destravar" : "Travar"}
                                            >
                                              {obj.locked ? <Lock className="w-3 h-3 text-amber-500" /> : <LockOpen className="w-3 h-3" />}
                                            </Button>
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200" onClick={(e) => e.stopPropagation()}>
                                                  <Grab className="w-3 h-3" />
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end" className="w-40 dark:bg-zinc-900 dark:border-zinc-800">
                                                <DropdownMenuItem onClick={() => moveObject(obj, 'front')}>Trazer para frente</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => moveObject(obj, 'up')}>Trazer para cima</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => moveObject(obj, 'down')}>Enviar para baixo</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => moveObject(obj, 'back')}>Enviar para trás</DropdownMenuItem>
                                                <DropdownMenuSeparator className="dark:bg-zinc-800" />
                                                <DropdownMenuItem onClick={() => setEditingObjectId(`${artboard.id}-${objIdx}`)}>Renomear</DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600" onClick={() => deleteObject(obj)}>Excluir</DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </TabsContent>

                      <TabsContent value="projetos" className="m-0 p-5 space-y-4 outline-none border-none">
                        <h3 className="font-bold text-base text-slate-800 dark:text-zinc-100 mb-4">Meus Projetos</h3>
                        {isLoadingModels ? (
                          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600" /></div>
                        ) : savedModels.length === 0 ? (
                          <div className="text-center p-6 bg-slate-50 dark:bg-zinc-800/20 rounded-lg border border-dashed border-slate-200 dark:border-zinc-800">
                             <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">Nenhum projeto salvo</p>
                             <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">Crie sua arte e vá em Compartilhar {'>'} Salvar.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            {savedModels.map((model) => (
                              <div 
                                key={model.id} 
                                onClick={() => handleLoadModel(model, false)}
                                className="group flex flex-col gap-2 cursor-pointer"
                              >
                                <div className={`relative aspect-square bg-white dark:bg-zinc-950 rounded-xl border flex items-center justify-center overflow-hidden transition-all ${currentModelId === model.id ? 'border-blue-600 shadow-md ring-1 ring-blue-600' : 'border-slate-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-900'}`}>
                                  {model.thumbnail_url ? (
                                    <img src={model.thumbnail_url} alt={model.title} className="max-w-[80%] max-h-[80%] object-contain shadow-sm rounded-sm" />
                                  ) : (
                                    <Layers className="text-slate-300 dark:text-zinc-700 w-8 h-8" />
                                  )}
                                  
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="destructive" size="icon" className="w-7 h-7 rounded-lg bg-red-500/90 hover:bg-red-600 shadow-sm" onClick={(e) => handleDeleteModel(model.id, e, 'design_models')}>
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="px-1 flex flex-col">
                                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">{model.title}</span>
                                  <span className="text-[10px] text-slate-500 dark:text-zinc-500 truncate mt-0.5">
                                    {model.data?.artboards ? `${model.data.artboards.length} pranchetas` : '1 prancheta'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="modelos" className="m-0 p-5 space-y-4 outline-none border-none">
                        <h3 className="font-bold text-base mb-4 text-blue-700 dark:text-blue-400 flex items-center gap-2"><LayoutTemplate className="w-5 h-5"/> Templates da Equipa</h3>
                        {isLoadingModels ? (
                          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600" /></div>
                        ) : templates.length === 0 ? (
                          <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-dashed border-blue-200 dark:border-blue-900/30">
                             <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Nenhum template global.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            {templates.map((template) => (
                              <div 
                                key={template.id} 
                                onClick={() => handleLoadModel(template, true)}
                                className="group flex flex-col gap-2 cursor-pointer"
                              >
                                <div className="relative aspect-square bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden transition-all hover:border-blue-400 dark:hover:border-blue-900 hover:shadow-sm">
                                  {template.thumbnail_url ? (
                                    <img src={template.thumbnail_url} alt={template.title} className="max-w-[80%] max-h-[80%] object-contain shadow-sm rounded-sm" />
                                  ) : (
                                    <LayoutTemplate className="text-slate-300 dark:text-zinc-700 w-8 h-8" />
                                  )}
                                  
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="destructive" size="icon" className="w-7 h-7 rounded-lg bg-red-500/90 hover:bg-red-600 shadow-sm" onClick={(e) => handleDeleteModel(template.id, e, 'design_templates')}>
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="px-1 flex flex-col">
                                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">{template.title}</span>
                                  <span className="text-[10px] text-slate-500 dark:text-zinc-500 truncate mt-0.5">
                                    {template.data?.artboards ? `${template.data.artboards.length} pranchetas` : '1 prancheta'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="elementos" className="m-0 p-5 space-y-6 outline-none border-none">
                        <div>
                          <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200 mb-3">Formas Básicas</h3>
                          <div className="grid grid-cols-4 gap-2">
                            <Button variant="outline" className="h-14 w-full p-0 border-slate-200 dark:border-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-800 group bg-transparent" onClick={() => addShape('rect')}><div className="w-6 h-6 bg-slate-400 dark:bg-zinc-600 group-hover:bg-blue-500 rounded-sm transition-colors" /></Button>
                            <Button variant="outline" className="h-14 w-full p-0 border-slate-200 dark:border-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-800 group bg-transparent" onClick={() => addShape('circle')}><div className="w-6 h-6 bg-slate-400 dark:bg-zinc-600 group-hover:bg-blue-500 rounded-full transition-colors" /></Button>
                            <Button variant="outline" className="h-14 w-full p-0 border-slate-200 dark:border-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-800 group bg-transparent" onClick={() => addShape('triangle')}><div className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent border-b-slate-400 dark:border-b-zinc-600 group-hover:border-b-blue-500 transition-colors" /></Button>
                            <Button variant="outline" className="h-14 w-full p-0 border-slate-200 dark:border-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-800 group flex items-center justify-center bg-transparent" onClick={() => addShape('line')}><div className="w-8 h-1 bg-slate-400 dark:bg-zinc-600 group-hover:bg-blue-500 rounded-full transition-colors" /></Button>
                          </div>
                        </div>
                        <Separator className="dark:bg-zinc-800" />
                        <div>
                          <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200 mb-3">Molduras Inteligentes</h3>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-500 mb-3 leading-tight">Adicione uma moldura e arraste fotos para dentro dela.</p>
                          <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" className="h-24 flex-col gap-3 border-slate-200 dark:border-zinc-800 border-dashed hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all bg-slate-50 dark:bg-zinc-800/50 group" onClick={() => addFrame('circle')}><CircleDashed className="w-7 h-7 text-slate-400 dark:text-zinc-600 group-hover:text-blue-500" /><span className="text-xs font-semibold">Círculo</span></Button>
                            <Button variant="outline" className="h-24 flex-col gap-3 border-slate-200 dark:border-zinc-800 border-dashed hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all bg-slate-50 dark:bg-zinc-800/50 group" onClick={() => addFrame('rect')}><SquareDashed className="w-7 h-7 text-slate-400 dark:text-zinc-600 group-hover:text-blue-500" /><span className="text-xs font-semibold">Retângulo</span></Button>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="texto" className="m-0 p-5 space-y-4 outline-none border-none">
                        <Button className="w-full h-14 text-xl font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm" onClick={() => addText('Inserir um título')}>Adicionar um Título</Button>
                        <Button className="w-full h-12 text-lg font-semibold bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-900 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-900/50" onClick={() => addText('Inserir um subtítulo')}>Adicionar Subtítulo</Button>
                        <Button className="w-full h-10 text-sm font-normal bg-transparent border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-xl" onClick={() => addText('Inserir texto no corpo')}>Adicionar corpo de texto</Button>
                      </TabsContent>

                      <TabsContent value="uploads" className="m-0 p-5 outline-none border-none">
                        <ImageUploads onImageSelect={(url) => addImage(url)} />
                      </TabsContent>

                      <TabsContent value="ferramentas" className="m-0 p-5 space-y-4 outline-none border-none">
                        <h3 className="font-bold text-sm mb-4 text-slate-800 dark:text-zinc-200">Magic Tools</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <Button variant="outline" className="h-28 flex-col gap-3 relative overflow-hidden group border-slate-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl bg-transparent"><Sparkles className="w-8 h-8 text-blue-500" /><span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Remover Fundo</span><Lock className="w-3.5 h-3.5 absolute top-2 right-2 text-slate-300 dark:text-zinc-700" /></Button>
                          <Button variant="outline" className="h-28 flex-col gap-3 relative overflow-hidden group border-slate-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl bg-transparent"><ImageIcon className="w-8 h-8 text-blue-500" /><span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Gerador IA</span><Lock className="w-3.5 h-3.5 absolute top-2 right-2 text-slate-300 dark:text-zinc-700" /></Button>
                        </div>
                        <Separator className="my-4 dark:bg-zinc-800" />
                        <h3 className="font-bold text-sm mb-4 text-slate-800 dark:text-zinc-200">Ações Rápidas</h3>
                        <Button 
                          variant="outline" 
                          className="w-full h-12 justify-start gap-3 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-200 dark:hover:border-red-800 rounded-xl bg-transparent"
                          onClick={() => showConfirm("Limpar Prancheta", "Deseja remover todos os elementos da prancheta atual?", clearCanvas)}
                        >
                          <Trash2 className="w-4 h-4" /> Limpar Prancheta Atual
                        </Button>
                      </TabsContent>
                    </div>
                  </Tabs>
                </aside>
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize={60} className="relative flex flex-col min-w-[400px]">
                <div className="flex-1 relative flex flex-col bg-slate-100 dark:bg-[#09090b] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e1e24_1px,transparent_1px)] [background-size:20px_20px] shadow-[inset_0_4px_6px_rgba(0,0,0,0.05)] overflow-hidden">
                  
                  <main ref={workspaceRef} className="flex-1 overflow-auto p-20 relative scroll-smooth custom-scrollbar">
                    <div className="min-w-full flex flex-col items-center gap-8 py-10">
                      {artboards.map((artboard) => (
                        <Artboard 
                          key={artboard.id}
                          id={artboard.id}
                          title={artboard.title}
                          width={artboard.width}
                          height={artboard.height}
                          isActive={activeArtboardId === artboard.id}
                          onSelect={handleSelectArtboard}
                          onMethodsReady={handleRegisterMethods}
                          initialData={artboard.data}
                          zoomLevel={zoomLevel}
                        />
                      ))}
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
                          className="fixed z-[101] w-52 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-xl py-2 flex flex-col text-sm text-slate-700 dark:text-zinc-300 animate-in fade-in zoom-in duration-100"
                          style={{ 
                            left: Math.min(contextMenuInfo.x, typeof window !== 'undefined' ? window.innerWidth - 200 : contextMenuInfo.x), 
                            top: Math.min(contextMenuInfo.y, typeof window !== 'undefined' ? window.innerHeight - 250 : contextMenuInfo.y) 
                          }}
                        >
                          <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Ações</div>
                          
                          <button 
                            className="flex items-center px-4 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50 w-full text-left"
                            disabled={(selectedObject as any).locked}
                            onClick={() => { bringToFront(); setContextMenuInfo({ ...contextMenuInfo, visible: false }); }}
                          >
                            <ArrowUpToLine className="w-4 h-4 mr-3" /> Trazer para frente
                          </button>
                          <button 
                            className="flex items-center px-4 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50 w-full text-left"
                            disabled={(selectedObject as any).locked}
                            onClick={() => { sendToBack(); setContextMenuInfo({ ...contextMenuInfo, visible: false }); }}
                          >
                            <ArrowDownToLine className="w-4 h-4 mr-3" /> Enviar para trás
                          </button>
                          
                          <Separator className="my-1.5 opacity-50 dark:bg-zinc-800" />
                          
                          <button 
                            className="flex items-center px-4 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50 w-full text-left"
                            disabled={(selectedObject as any).locked}
                            onClick={() => { centerObject(); setContextMenuInfo({ ...contextMenuInfo, visible: false }); }}
                          >
                            <Maximize className="w-4 h-4 mr-3" /> Centralizar na Arte
                          </button>

                          {selectedObject.type === 'image' && (
                            <>
                              <Separator className="my-1.5 opacity-50 dark:bg-zinc-800" />
                              <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Imagem</div>
                              
                              {(selectedObject as any).isFrame ? (
                                <button 
                                  className="flex items-center px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 transition-colors w-full text-left disabled:opacity-50"
                                  onClick={() => { detachImageFromFrame(); setContextMenuInfo({ ...contextMenuInfo, visible: false }); }}
                                >
                                  <Unlink className="w-4 h-4 mr-3" /> Desanexar da moldura
                                </button>
                              ) : (
                                <button 
                                  className="flex items-center px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 transition-colors w-full text-left disabled:opacity-50"
                                  disabled={cropBox !== null}
                                  onClick={() => { startCrop(); setContextMenuInfo({ ...contextMenuInfo, visible: false }); }}
                                >
                                  <Scissors className="w-4 h-4 mr-3" /> Recortar Imagem
                                </button>
                              )}

                              {((selectedObject as any).isFrame || (selectedObject as any).isCropped) && (
                                <button 
                                  className="flex items-center px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 transition-colors w-full text-left disabled:opacity-50"
                                  onClick={() => { togglePanMode(); setContextMenuInfo({ ...contextMenuInfo, visible: false }); }}
                                >
                                  <Move className="w-4 h-4 mr-3" /> {isPanMode ? 'Concluir Ajuste' : 'Ajustar Posição'}
                                </button>
                              )}
                            </>
                          )}

                          <Separator className="my-1.5 opacity-50 dark:bg-zinc-800" />

                          <button 
                            className="flex items-center px-4 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors w-full text-left"
                            onClick={() => { toggleLock(); setContextMenuInfo({ ...contextMenuInfo, visible: false }); }}
                          >
                            {(selectedObject as any).locked ? (
                              <><LockOpen className="w-4 h-4 mr-3 text-amber-500" /> Destravar item</>
                            ) : (
                              <><Lock className="w-4 h-4 mr-3 text-slate-400 dark:text-zinc-500" /> Travar item</>
                            )}
                          </button>

                          <button 
                            className="flex items-center px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors disabled:opacity-30 w-full text-left"
                            disabled={(selectedObject as any).locked}
                            onClick={() => { deleteSelected(); setContextMenuInfo({ ...contextMenuInfo, visible: false }); }}
                          >
                            <Trash2 className="w-4 h-4 mr-3" /> Excluir
                          </button>
                        </div>
                      </>
                    )}
                  </main>

                  <div className="absolute bottom-6 right-6 flex items-center gap-1 bg-white dark:bg-zinc-900 p-1.5 rounded-xl shadow-lg border border-slate-200 dark:border-zinc-800 z-10">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={handleZoomOut} title="Diminuir Zoom">
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <div className="w-14 text-center text-xs font-semibold text-slate-600 dark:text-zinc-300 select-none">
                      {Math.round(zoomLevel * 100)}%
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={handleZoomIn} title="Aumentar Zoom">
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-5 mx-1 dark:bg-zinc-800" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={handleResetZoom} title="Reset Zoom">
                      <Focus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize={20} minSize={15} maxSize={35} className="flex flex-col">
                <aside className="h-full w-full bg-white dark:bg-zinc-900 border-l dark:border-zinc-800 p-5 flex flex-col gap-6 overflow-y-auto z-10 shadow-[inset_-10px_0_15px_-10px_rgba(0,0,0,0.05)]">
                  
                  {cropBox ? (
                    <div className="flex flex-col gap-4 bg-blue-50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-200 dark:border-blue-900/30 shadow-sm animate-in slide-in-from-right-4">
                      <div>
                        <h3 className="font-bold text-sm text-blue-900 dark:text-blue-400 flex items-center gap-2"><Scissors className="w-4 h-4" /> Modo de Recorte</h3>
                        <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">Ajuste os cantos azuis da caixa sobre a imagem e clique em aplicar.</p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={applyCrop} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm h-10"><Check className="w-4 h-4 mr-2" /> Aplicar</Button>
                        <Button variant="outline" onClick={cancelCrop} className="w-full border-blue-200 dark:border-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 h-10 bg-transparent"> <X className="w-4 h-4 mr-2" /> Cancelar</Button>
                      </div>
                    </div>
                  ) : isPanMode ? (
                    <div className="flex flex-col gap-4 bg-amber-50 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-200 dark:border-amber-900/30 shadow-sm animate-in slide-in-from-right-4">
                      <div>
                        <h3 className="font-bold text-sm text-amber-900 dark:text-amber-400 flex items-center gap-2"><Move className="w-4 h-4" /> Ajustar Imagem</h3>
                        <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">Clique e arraste a imagem dentro da área da moldura para encontrar a melhor posição.</p>
                      </div>
                      <Button onClick={togglePanMode} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm h-10"><Check className="w-4 h-4 mr-2" /> Concluir Ajuste</Button>
                    </div>
                  ) : selectedObject ? (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-100">Propriedades</h3>
                        <div className="flex items-center gap-1">
                          
                          {selectedObject.type === 'image' && (
                            <>
                              {((selectedObject as any).isFrame || (selectedObject as any).isCropped) && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg disabled:opacity-50" onClick={togglePanMode} title="Ajustar posição na moldura">
                                  <Move className="w-4 h-4" />
                                </Button>
                              )}

                              {(selectedObject as any).isFrame ? (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200 rounded-lg disabled:opacity-50" onClick={detachImageFromFrame} title="Desanexar Imagem">
                                  <Unlink className="w-4 h-4" />
                                </Button>
                              ) : (
                                <>
                                  {(selectedObject as any).isCropped ? (
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg disabled:opacity-50" onClick={removeCrop} title="Remover Recorte">
                                      <X className="w-4 h-4" />
                                    </Button>
                                  ) : (
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg disabled:opacity-50" onClick={startCrop} title="Recortar Imagem">
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
                            className={`h-8 w-8 rounded-lg ${ (selectedObject as any).locked ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-500 hover:bg-amber-200' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200' }`} 
                            onClick={toggleLock}
                            title={(selectedObject as any).locked ? "Destravar Objeto" : "Travar Objeto"}
                          >
                            {(selectedObject as any).locked ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500 hover:bg-red-600 dark:hover:bg-red-900 hover:text-white rounded-lg disabled:opacity-50" 
                            onClick={deleteSelected}
                            disabled={(selectedObject as any).locked}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {(selectedObject as any).isFrame && selectedObject.type !== 'image' && (
                        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-200 dark:border-amber-900/30">
                          <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-500"><ImagePlus className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-widest">Moldura Ativa</span></div>
                          <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-tight">Vá à aba "Uploads" e clique numa foto. Ela será inserida automaticamente dentro desta forma.</p>
                        </div>
                      )}

                      <MagicFill 
                        selectedObject={activeItemForMagicFill} 
                        onUpdate={updateProperty} 
                        onInjectImage={(url) => addImage(url)} 
                      />

                      <Separator className="bg-slate-100 dark:bg-zinc-800" />

                      {/* PROPRIEDADES DE TEXTO */}
                      {(selectedObject.type === 'i-text' || selectedObject.type === 'text') && (
                        <div className="space-y-6">
                          
                          <div className="space-y-3">
                            <Label className="text-xs font-semibold text-slate-800 dark:text-zinc-200">Texto</Label>
                            <div className="flex gap-2">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className="w-10 h-10 p-0 border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden rounded-lg bg-transparent">
                                    <div 
                                      className="w-full h-full" 
                                      style={{ backgroundColor: typeof selectedObject.fill === 'string' ? selectedObject.fill : '#000000' }} 
                                    />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-4 bg-white dark:bg-zinc-900 shadow-xl rounded-xl border-slate-200 dark:border-zinc-800">
                                  <Tabs defaultValue="solid">
                                    <TabsList className="grid grid-cols-2 mb-4">
                                      <TabsTrigger value="solid">Sólido</TabsTrigger>
                                      <TabsTrigger value="gradient">Degradê</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="solid" className="space-y-3">
                                      <Label className="text-[10px] font-bold uppercase text-slate-400">Cor Sólida</Label>
                                      <Input 
                                        type="color" 
                                        className="h-10 p-1 cursor-pointer bg-transparent"
                                        value={typeof selectedObject.fill === 'string' ? selectedObject.fill : '#000000'}
                                        onChange={(e) => changeTextColor(e.target.value)}
                                      />
                                    </TabsContent>
                                    <TabsContent value="gradient" className="space-y-4">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                          <Label className="text-[10px] dark:text-zinc-400">Cor 1</Label>
                                          <Input type="color" value={gradColor1} onChange={(e) => setGradColor1(e.target.value)} className="h-8 p-1 bg-transparent" />
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-[10px] dark:text-zinc-400">Cor 2</Label>
                                          <Input type="color" value={gradColor2} onChange={(e) => setGradColor2(e.target.value)} className="h-8 p-1 bg-transparent" />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <Button size="sm" variant="outline" className="text-[10px] h-7 dark:border-zinc-800" onClick={() => applyGradient(gradColor1, gradColor2, 'horizontal')}>Horizontal</Button>
                                        <Button size="sm" variant="outline" className="text-[10px] h-7 dark:border-zinc-800" onClick={() => applyGradient(gradColor1, gradColor2, 'vertical')}>Vertical</Button>
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
                                  className="pl-9 rounded-lg border-slate-200 dark:border-zinc-800 focus:border-blue-400 focus:ring-blue-100 bg-transparent dark:text-zinc-100" 
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-xs font-semibold text-slate-800 dark:text-zinc-200">Estilo</Label>
                            <div className="flex flex-wrap gap-1">
                              <Button 
                                variant="outline" size="icon" className={`h-9 w-9 rounded-md bg-transparent dark:border-zinc-800 ${(selectedObject as any).fontWeight === 'bold' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400' : 'dark:text-zinc-400'}`}
                                onClick={toggleBold} title="Negrito"
                              >
                                <Bold className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" size="icon" className={`h-9 w-9 rounded-md bg-transparent dark:border-zinc-800 ${(selectedObject as any).fontStyle === 'italic' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400' : 'dark:text-zinc-400'}`}
                                onClick={toggleItalic} title="Itálico"
                              >
                                <Italic className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" size="icon" className={`h-9 w-9 rounded-md bg-transparent dark:border-zinc-800 ${(selectedObject as any).underline ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400' : 'dark:text-zinc-400'}`}
                                onClick={toggleUnderline} title="Sublinhado"
                              >
                                <Underline className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" size="icon" className={`h-9 w-9 rounded-md bg-transparent dark:border-zinc-800 ${(selectedObject as any).linethrough ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400' : 'dark:text-zinc-400'}`}
                                onClick={toggleLinethrough} title="Tachado"
                              >
                                <Strikethrough className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-xs font-semibold text-slate-800 dark:text-zinc-200">Alinhamento</Label>
                            <div className="flex gap-1 bg-slate-50 dark:bg-zinc-800/50 p-1 rounded-lg border border-slate-100 dark:border-zinc-800">
                              {[
                                { val: 'left', icon: AlignLeft },
                                { val: 'center', icon: AlignCenter },
                                { val: 'right', icon: AlignRight },
                                { val: 'justify', icon: AlignJustify }
                              ].map((item) => (
                                <Button 
                                  key={item.val}
                                  variant="ghost" size="icon" 
                                  className={`h-8 flex-1 rounded-md ${(selectedObject as any).textAlign === item.val ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-zinc-500'}`}
                                  onClick={() => setTextAlignment(item.val as any)}
                                >
                                  <item.icon className="w-4 h-4" />
                                </Button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-xs font-semibold text-slate-800 dark:text-zinc-200">Formatação</Label>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" className="flex-1 gap-2 h-9 text-xs bg-transparent dark:border-zinc-800 dark:text-zinc-400"
                                onClick={toggleList}
                              >
                                <List className="w-4 h-4" /> Lista
                              </Button>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className="flex-1 gap-2 h-9 text-xs bg-transparent dark:border-zinc-800 dark:text-zinc-400">
                                    <ArrowRightToLine className="w-4 h-4" /> Recuo
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-4 bg-white dark:bg-zinc-900 shadow-xl rounded-xl border-slate-200 dark:border-zinc-800">
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

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-semibold text-slate-800 dark:text-zinc-200">Espaçamento entre Linhas</Label>
                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{(selectedObject as any).lineHeight?.toFixed(2)}</span>
                            </div>
                            <Slider 
                              min={0.5} max={3} step={0.05} 
                              value={[(selectedObject as any).lineHeight || 1.16]} 
                              onValueChange={(v) => setLineHeight(v[0])} 
                            />
                          </div>

                          <Separator className="bg-slate-100 dark:bg-zinc-800" />
                          
                          <div className="space-y-3">
                            <Label className="text-xs font-semibold text-slate-800 dark:text-zinc-200">Fonte</Label>
                            <Select 
                              value={selectedObject.get ? selectedObject.get('fontFamily') : (selectedObject as any).fontFamily} 
                              onValueChange={(val) => setCanvasProperty('fontFamily', val)}
                            >
                              <SelectTrigger className="text-sm rounded-lg border-slate-200 dark:border-zinc-800 focus:ring-blue-100 bg-transparent dark:text-zinc-100">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                                <SelectItem value="Arial">Arial</SelectItem>
                                <SelectItem value="Inter">Inter</SelectItem>
                                <SelectItem value="Montserrat">Montserrat</SelectItem>
                                <SelectItem value="Poppins">Poppins</SelectItem>
                                <SelectItem value="Roboto">Roboto</SelectItem>
                                <SelectItem value="Open Sans">Open Sans</SelectItem>
                                <SelectItem value="Lato">Lato</SelectItem>
                                <SelectItem value="Oswald">Oswald</SelectItem>
                                <SelectItem value="Raleway">Raleway</SelectItem>
                                <SelectItem value="Nunito">Nunito</SelectItem>
                                <SelectItem value="Merriweather">Merriweather</SelectItem>
                                <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                                <SelectItem value="Bebas Neue">Bebas Neue</SelectItem>
                                <SelectItem value="Dancing Script">Dancing Script</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      {(selectedObject.type === 'rect' || selectedObject.type === 'circle' || selectedObject.type === 'triangle' || selectedObject.type === 'line') && (
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <Label className="text-xs font-semibold text-slate-800 dark:text-zinc-200">Cor da Forma</Label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                {(() => {
                                  const isOutlineOnly = selectedObject.fill === 'transparent' || !selectedObject.fill;
                                  const colorProp = (selectedObject.type === 'line' || isOutlineOnly) ? 'stroke' : 'fill';
                                  const currentColor = typeof selectedObject[colorProp] === 'string' ? selectedObject[colorProp] as string : '#94a3b8';
                                  
                                  return (
                                    <>
                                      <div 
                                        className="absolute left-3 top-2.5 w-4 h-4 rounded-full border border-slate-200 dark:border-zinc-700 pointer-events-none z-10"
                                        style={{ backgroundColor: currentColor }}
                                      />
                                      <Input 
                                        type="color" 
                                        className="w-full h-9 pl-9 pr-2 cursor-pointer bg-transparent border-slate-200 dark:border-zinc-800 rounded-xl"
                                        value={currentColor.startsWith('#') ? currentColor : '#94a3b8'}
                                        onChange={(e) => updateProperty(colorProp, e.target.value)}
                                      />
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
                            <div className="space-y-0.5">
                              <Label className="text-xs font-bold text-slate-800 dark:text-zinc-200">Apenas Contorno</Label>
                              <p className="text-[10px] text-slate-500 dark:text-zinc-500">Remove o preenchimento da forma</p>
                            </div>
                            <Switch 
                              checked={selectedObject.fill === 'transparent' || !selectedObject.fill}
                              onCheckedChange={toggleOutlineOnly}
                            />
                          </div>

                          {(selectedObject.type === 'line' || selectedObject.fill === 'transparent' || !selectedObject.fill) && (
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <Label className="text-xs font-semibold text-slate-800 dark:text-zinc-200">Espessura do Contorno</Label>
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{selectedObject.strokeWidth || 0}px</span>
                              </div>
                              <Slider 
                                min={0} max={50} step={1} 
                                value={[selectedObject.strokeWidth || 0]} 
                                onValueChange={(v) => updateProperty('strokeWidth', v[0])} 
                                className="py-2"
                              />
                            </div>
                          )}

                          {selectedObject.type !== 'circle' && selectedObject.type !== 'line' && (
                            <div className="space-y-3">
                              <Label className="text-xs font-semibold text-slate-800 dark:text-zinc-200">Arredondar Cantos (px)</Label>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-2 border border-slate-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 bg-slate-50 dark:bg-zinc-800/50"><CornerUpLeft className="w-4 h-4 text-slate-400 shrink-0" /><input type="number" min={0} value={Math.round(getCornerRadii().tl)} onChange={(e) => handleRadiusChange('tl', parseInt(e.target.value))} className="w-full text-xs bg-transparent border-none outline-none text-slate-700 dark:text-zinc-300 font-medium" /></div>
                                <div className="flex items-center gap-2 border border-slate-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 bg-slate-50 dark:bg-zinc-800/50"><CornerUpRight className="w-4 h-4 text-slate-400 shrink-0" /><input type="number" min={0} value={Math.round(getCornerRadii().tr)} onChange={(e) => handleRadiusChange('tr', parseInt(e.target.value))} className="w-full text-xs bg-transparent border-none outline-none text-slate-700 dark:text-zinc-300 font-medium" /></div>
                                <div className="flex items-center gap-2 border border-slate-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 bg-slate-50 dark:bg-zinc-800/50"><CornerDownLeft className="w-4 h-4 text-slate-400 shrink-0" /><input type="number" min={0} value={Math.round(getCornerRadii().bl)} onChange={(e) => handleRadiusChange('bl', parseInt(e.target.value))} className="w-full text-xs bg-transparent border-none outline-none text-slate-700 dark:text-zinc-300 font-medium" /></div>
                                <div className="flex items-center gap-2 border border-slate-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 bg-slate-50 dark:bg-zinc-800/50"><CornerDownRight className="w-4 h-4 text-slate-400 shrink-0" /><input type="number" min={0} value={Math.round(getCornerRadii().br)} onChange={(e) => handleRadiusChange('br', parseInt(e.target.value))} className="w-full text-xs bg-transparent border-none outline-none text-slate-700 dark:text-zinc-300 font-medium" /></div>
                              </div>
                            </div>
                          )}

                          <div className="space-y-3">
                            <div className="flex items-center justify-between"><Label className="text-xs font-semibold text-slate-800 dark:text-zinc-200">Transparência</Label><span className="text-xs text-slate-500 dark:text-zinc-500 font-medium">{Math.round((selectedObject.opacity || 1) * 100)}%</span></div>
                            <Slider defaultValue={[1]} max={1} step={0.01} value={[selectedObject.opacity || 1]} onValueChange={(vals) => setImageOpacity(vals[0])} className="py-2" />
                          </div>
                        </div>
                      )}

                      {selectedObject.type === 'image' && (
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <Label className="text-xs font-semibold text-slate-800 dark:text-zinc-200">Arredondar Cantos (px)</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center gap-2 border border-slate-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 bg-slate-50 dark:bg-zinc-800/50"><CornerUpLeft className="w-4 h-4 text-slate-400 shrink-0" /><input type="number" min={0} value={Math.round(getCornerRadii().tl)} onChange={(e) => handleRadiusChange('tl', parseInt(e.target.value))} className="w-full text-xs bg-transparent border-none outline-none text-slate-700 dark:text-zinc-300 font-medium" /></div>
                              <div className="flex items-center gap-2 border border-slate-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 bg-slate-50 dark:bg-zinc-800/50"><CornerUpRight className="w-4 h-4 text-slate-400 shrink-0" /><input type="number" min={0} value={Math.round(getCornerRadii().tr)} onChange={(e) => handleRadiusChange('tr', parseInt(e.target.value))} className="w-full text-xs bg-transparent border-none outline-none text-slate-700 dark:text-zinc-300 font-medium" /></div>
                              <div className="flex items-center gap-2 border border-slate-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 bg-slate-50 dark:bg-zinc-800/50"><CornerDownLeft className="w-4 h-4 text-slate-400 shrink-0" /><input type="number" min={0} value={Math.round(getCornerRadii().bl)} onChange={(e) => handleRadiusChange('bl', parseInt(e.target.value))} className="w-full text-xs bg-transparent border-none outline-none text-slate-700 dark:text-zinc-300 font-medium" /></div>
                              <div className="flex items-center gap-2 border border-slate-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 bg-slate-50 dark:bg-zinc-800/50"><CornerDownRight className="w-4 h-4 text-slate-400 shrink-0" /><input type="number" min={0} value={Math.round(getCornerRadii().br)} onChange={(e) => handleRadiusChange('br', parseInt(e.target.value))} className="w-full text-xs bg-transparent border-none outline-none text-slate-700 dark:text-zinc-300 font-medium" /></div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <Label className="text-xs font-semibold text-slate-800 dark:text-zinc-200">Transparência</Label>
                            <Slider defaultValue={[1]} max={1} step={0.01} value={[selectedObject.opacity || 1]} onValueChange={(vals) => setImageOpacity(vals[0])} className="py-2" />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-xs font-semibold text-slate-800 dark:text-zinc-200">Inverter</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <Button variant="outline" size="sm" className={`bg-transparent dark:border-zinc-800 ${selectedObject.flipX ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'dark:text-zinc-400'}`} onClick={toggleFlipX}><FlipHorizontal className="w-4 h-4 mr-2" /> X</Button>
                              <Button variant="outline" size="sm" className={`bg-transparent dark:border-zinc-800 ${selectedObject.flipY ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'dark:text-zinc-400'}`} onClick={toggleFlipY}><FlipVertical className="w-4 h-4 mr-2" /> Y</Button>
                            </div>
                          </div>
                        </div>
                      )}

                      <Separator className="bg-slate-100 dark:bg-zinc-800" />

                      <div className={`space-y-3 ${(selectedObject as any).locked ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Label className="text-xs font-semibold text-slate-800 dark:text-zinc-200">Alinhamento e Camadas</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Button variant="outline" size="sm" className="rounded-lg text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-transparent border-slate-200 dark:border-zinc-800" onClick={centerObject} title="Centralizar" disabled={(selectedObject as any).locked}><Maximize className="w-4 h-4" /></Button>
                          <Button variant="outline" size="sm" className="rounded-lg text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-transparent border-slate-200 dark:border-zinc-800" onClick={bringToFront} title="Mover para frente" disabled={(selectedObject as any).locked}><ArrowUpToLine className="w-4 h-4" /></Button>
                          <Button variant="outline" size="sm" className="rounded-lg text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-transparent border-slate-200 dark:border-zinc-800" onClick={sendToBack} title="Mover para trás" disabled={(selectedObject as any).locked}><ArrowDownToLine className="w-4 h-4" /></Button>
                        </div>
                      </div>

                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 opacity-40">
                      <MousePointer2 className="w-10 h-10 text-slate-300 dark:text-zinc-700" />
                      <p className="text-sm font-medium text-slate-600 dark:text-zinc-500">Nada selecionado</p>
                    </div>
                  )}
                </aside>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>

        <AlertDialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}>
          <AlertDialogContent className="rounded-2xl max-w-[400px] dark:bg-zinc-900 dark:border-zinc-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold dark:text-zinc-100">{confirmDialog.title}</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed">
                {confirmDialog.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 mt-4">
              <AlertDialogCancel className="rounded-xl font-semibold border-slate-200 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800">Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }}
                className={cn(
                  "rounded-xl font-semibold px-6",
                  confirmDialog.variant === 'destructive' ? "bg-red-600 hover:bg-red-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
                )}
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </main>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <SupportContent />
    </Suspense>
  )
}