import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as fabric from 'fabric'; 
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

const createRoundedRectPathString = (w: number, h: number, tl: number, tr: number, br: number, bl: number) => {
  const x = -w / 2;
  const y = -h / 2;
  
  const maxR = Math.min(w / 2, h / 2);
  tl = Math.max(0, Math.min(tl, maxR));
  tr = Math.max(0, Math.min(tr, maxR));
  br = Math.max(0, Math.min(br, maxR));
  bl = Math.max(0, Math.min(bl, maxR));

  return `M ${x + tl} ${y} ` +
         `L ${x + w - tr} ${y} ` +
         `Q ${x + w} ${y} ${x + w} ${y + tr} ` +
         `L ${x + w} ${y + h - br} ` +
         `Q ${x + w} ${y + h} ${x + w - br} ${y + h} ` +
         `L ${x + bl} ${y + h} ` +
         `Q ${x} ${y + h} ${x} ${y + h - bl} ` +
         `L ${x} ${y + tl} ` +
         `Q ${x} ${y} ${x + tl} ${y} Z`;
};

export const useFabricEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.FabricObject | null>(null);
  const [contextMenuInfo, setContextMenuInfo] = useState({ visible: false, x: 0, y: 0 });
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const isHistoryProcessing = useRef(false);

  const [isPanMode, setIsPanMode] = useState(false);
  const isPanModeRef = useRef(isPanMode); 
  const panningImgRef = useRef<fabric.FabricImage | null>(null);
  const panOverlayRef = useRef<fabric.FabricObject | null>(null);

  const [cropBox, setCropBox] = useState<fabric.Rect | null>(null);
  const cropBoxRef = useRef(cropBox); 

  useEffect(() => { isPanModeRef.current = isPanMode; }, [isPanMode]);
  useEffect(() => { cropBoxRef.current = cropBox; }, [cropBox]);

  const forceUpdate = useCallback(() => {
    setUpdateTrigger((prev) => prev + 1);
  }, []);

  const saveHistory = useCallback(() => {
    if (!fabricCanvas.current || isHistoryProcessing.current) return;
    const json = JSON.stringify(fabricCanvas.current.toJSON([
      'variableId', 'isFrame', 'frameType', 'customRadii', 'locked', 'isCropped', 
      '_origFrameW', '_origFrameH', '_origFrameScaleX', '_origFrameScaleY',
      'originX', 'originY'
    ]));
    if (undoStack.current.length > 0 && undoStack.current[undoStack.current.length - 1] === json) return;
    undoStack.current.push(json);
    redoStack.current = [];
    if (undoStack.current.length > 50) undoStack.current.shift();
    forceUpdate();
  }, [forceUpdate]);

  const undo = useCallback(async () => {
    if (undoStack.current.length <= 1 || !fabricCanvas.current || isHistoryProcessing.current) return;
    isHistoryProcessing.current = true;
    const currentState = undoStack.current.pop()!;
    redoStack.current.push(currentState);
    const previousState = undoStack.current[undoStack.current.length - 1];
    await fabricCanvas.current.loadFromJSON(JSON.parse(previousState));
    fabricCanvas.current.getObjects().forEach(obj => obj.setCoords());
    fabricCanvas.current.renderAll();
    isHistoryProcessing.current = false;
    forceUpdate();
  }, [forceUpdate]);

  const redo = useCallback(async () => {
    if (redoStack.current.length === 0 || !fabricCanvas.current || isHistoryProcessing.current) return;
    isHistoryProcessing.current = true;
    const nextState = redoStack.current.pop()!;
    undoStack.current.push(nextState);
    await fabricCanvas.current.loadFromJSON(JSON.parse(nextState));
    fabricCanvas.current.getObjects().forEach(obj => obj.setCoords());
    fabricCanvas.current.renderAll();
    isHistoryProcessing.current = false;
    forceUpdate();
  }, [forceUpdate]);

  const attachImageToFrame = useCallback((img: fabric.FabricImage, frame: fabric.FabricObject) => {
    if (!fabricCanvas.current) return;
    const frameType = (frame as any).frameType;
    const isLocked = (frame as any).locked;
    const zIndex = fabricCanvas.current.getObjects().indexOf(frame);
    const frameWidth = frame.getScaledWidth();
    const frameHeight = frame.getScaledHeight();
    const scaleX = frameWidth / img.width!;
    const scaleY = frameHeight / img.height!;
    const scale = Math.max(scaleX, scaleY);
    const centerPoint = frame.getCenterPoint();
    img.set({ originX: 'center', originY: 'center', left: centerPoint.x, top: centerPoint.y, scaleX: scale, scaleY: scale, angle: frame.angle });
    const unscaledFrameWidth = frameWidth / scale;
    const unscaledFrameHeight = frameHeight / scale;
    let clipPath;
    if (frameType === 'circle') {
       clipPath = new fabric.Circle({ radius: unscaledFrameWidth / 2, originX: 'center', originY: 'center' });
    } else {
       const radii = (frame as any).customRadii || { tl: 16, tr: 16, br: 16, bl: 16 };
       const pathStr = createRoundedRectPathString(unscaledFrameWidth, unscaledFrameHeight, radii.tl / scale, radii.tr / scale, radii.br / scale, radii.bl / scale);
       clipPath = new fabric.Path(pathStr, { originX: 'center', originY: 'center', left: 0, top: 0 });
       (img as any).customRadii = { ...radii };
    }
    img.set('clipPath', clipPath);
    (img as any).isFrame = true;
    (img as any).frameType = frameType;
    (img as any).variableId = (frame as any).variableId;
    (img as any)._origFrameW = frame.width;
    (img as any)._origFrameH = frame.height;
    (img as any)._origFrameScaleX = frame.scaleX;
    (img as any)._origFrameScaleY = frame.scaleY;
    (img as any).locked = isLocked;
    if (isLocked) {
      img.set({ lockMovementX: true, lockMovementY: true, lockRotation: true, lockScalingX: true, lockScalingY: true, hasControls: false });
    }
    fabricCanvas.current.remove(frame);
    if (!fabricCanvas.current.getObjects().includes(img)) fabricCanvas.current.add(img);
    fabricCanvas.current.moveObjectTo(img, zIndex);
    fabricCanvas.current.setActiveObject(img);
    fabricCanvas.current.renderAll();
    saveHistory();
    forceUpdate();
  }, [forceUpdate, saveHistory]);

  const stopPanMode = useCallback(() => {
    if (panningImgRef.current) {
      const img = panningImgRef.current;
      const absX = (img as any)._fixedClipAbsX;
      const absY = (img as any)._fixedClipAbsY;
      const fixedScaleX = (img as any)._fixedClipScaleX;
      const fixedScaleY = (img as any)._fixedClipScaleY;
      const originalClipPath = (img as any)._originalClipPath;
      const fixedAngle = (img as any)._fixedAngle || 0;
      if (originalClipPath && absX !== undefined) {
        const imgAngle = img.angle || 0;
        const angleRad = -imgAngle * Math.PI / 180;
        const cosA = Math.cos(angleRad);
        const sinA = Math.sin(angleRad);
        const imgCenter = img.getCenterPoint();
        const dx = absX - imgCenter.x;
        const dy = absY - imgCenter.y;
        const relX = dx * cosA - dy * sinA;
        const relY = dx * sinA + dy * cosA;
        originalClipPath.set({
          left: relX / (img.scaleX || 1),
          top: relY / (img.scaleY || 1),
          scaleX: fixedScaleX / (img.scaleX || 1),
          scaleY: fixedScaleY / (img.scaleY || 1),
          angle: fixedAngle - imgAngle
        });
        img.set('clipPath', originalClipPath);
      }
      if (panOverlayRef.current && fabricCanvas.current) {
        fabricCanvas.current.remove(panOverlayRef.current);
        panOverlayRef.current = null;
      }
      const isLocked = (img as any).locked;
      img.set({ hasControls: !isLocked, lockMovementX: isLocked, lockMovementY: isLocked, lockRotation: isLocked, lockScalingX: isLocked, lockScalingY: isLocked, opacity: 1 });
      img.setCoords();
      img.set('dirty', true);
      saveHistory();
    }
    setIsPanMode(false);
    panningImgRef.current = null;
    if (fabricCanvas.current) fabricCanvas.current.renderAll();
  }, [saveHistory]);

  useEffect(() => {
    if (canvasRef.current && !fabricCanvas.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 1080, height: 1080, backgroundColor: '#ffffff', preserveObjectStacking: true, stopContextMenu: true, fireRightClick: true,  
      });
      fabricCanvas.current = canvas;
      canvas.on('object:modified', saveHistory);
      canvas.on('object:added', saveHistory);
      canvas.on('object:removed', saveHistory);
      const handleSelection = () => {
        const active = canvas.getActiveObject();
        setSelectedObject(active || null);
        if (isPanModeRef.current && active !== panningImgRef.current) stopPanMode(); 
        forceUpdate(); 
      };
      canvas.on('selection:created', handleSelection);
      canvas.on('selection:updated', handleSelection);
      canvas.on('selection:cleared', () => {
        setSelectedObject(null);
        setContextMenuInfo({ visible: false, x: 0, y: 0 });
        if (isPanModeRef.current) stopPanMode();
        forceUpdate();
      });
    }
    return () => {
      if (fabricCanvas.current) {
        const canvas = fabricCanvas.current;
        (canvas as any).isDisposed = true;
        canvas.dispose();
        fabricCanvas.current = null;
      }
    };
  }, [forceUpdate, attachImageToFrame, stopPanMode, saveHistory]);

  const addText = useCallback((content = 'Novo Texto') => {
    if (!fabricCanvas.current) return;
    let fontSize = 35;
    let fontWeight = 'normal';
    if (content.toLowerCase().includes('título')) { fontSize = 75; fontWeight = 'bold'; }
    const text = new fabric.IText(content, { left: 100, top: 100, fontFamily: 'Arial', fontSize, fontWeight, fill: '#000000' });
    fabricCanvas.current.add(text);
    fabricCanvas.current.setActiveObject(text);
    fabricCanvas.current.renderAll();
  }, []);

  const addImage = useCallback(async (url: string) => {
    if (!fabricCanvas.current) return;
    try {
      const img = await fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
      const active = fabricCanvas.current.getActiveObject();
      if (active && (active as any).isFrame) {
        attachImageToFrame(img, active);
      } else {
        img.scaleToWidth(200);
        fabricCanvas.current.add(img);
        fabricCanvas.current.centerObject(img);
        fabricCanvas.current.setActiveObject(img);
      }
      fabricCanvas.current.renderAll();
      forceUpdate();
    } catch (e) { toast.error("Erro ao carregar imagem."); }
  }, [attachImageToFrame, forceUpdate]);

  const toggleLock = useCallback(() => {
    if (!selectedObject || !fabricCanvas.current) return;
    const isLocked = !(selectedObject as any).locked;
    (selectedObject as any).locked = isLocked;
    selectedObject.set({ lockMovementX: isLocked, lockMovementY: isLocked, lockRotation: isLocked, lockScalingX: isLocked, lockScalingY: isLocked, hasControls: !isLocked });
    fabricCanvas.current.renderAll();
    saveHistory();
    forceUpdate();
  }, [selectedObject, saveHistory, forceUpdate]);

  const setCanvasProperty = useCallback((key: string, value: any) => {
    if (!selectedObject || !fabricCanvas.current) return;
    selectedObject.set(key as any, value);
    fabricCanvas.current.renderAll();
    fabricCanvas.current.fire('object:modified');
    saveHistory();
    forceUpdate();
  }, [selectedObject, saveHistory, forceUpdate]);

  const loadFromJson = useCallback(async (json: any) => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;
    if ((canvas as any).isDisposed || !canvas.getContext()) return;
    try {
      const parsedJson = typeof json === 'string' ? JSON.parse(json) : json;
      await new Promise(resolve => setTimeout(resolve, 60));
      if (!(canvas as any).isDisposed && canvas.getContext()) {
        try { await canvas.loadFromJSON(parsedJson); } catch (e) { return; }
      }
      canvas.getObjects().forEach(obj => obj.setCoords());
      canvas.renderAll();
      undoStack.current = [JSON.stringify(canvas.toJSON())];
      forceUpdate();
    } catch (e) { console.error(e); }
  }, [forceUpdate]);

  const memoizedMethods = useMemo(() => ({ 
    canvasRef, addText, addImage, loadFromJson, toggleLock, selectedObject, fabricCanvas, contextMenuInfo, setContextMenuInfo,
    isPanMode, setCanvasProperty, changeCount: updateTrigger, undo, redo, canUndo: undoStack.current.length > 1, canRedo: redoStack.current.length > 0
  }), [selectedObject, contextMenuInfo, isPanMode, updateTrigger, addText, addImage, loadFromJson, toggleLock, setCanvasProperty, undo, redo]);

  return memoizedMethods;
};