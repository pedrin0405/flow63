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
  const isDisposed = useRef(false);
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
    if (!fabricCanvas.current || isHistoryProcessing.current || isDisposed.current) return;
    const json = JSON.stringify((fabricCanvas.current as any).toObject([
      'variableId', 'isFrame', 'frameType', 'customRadii', 'locked', 'isCropped', 
      '_origFrameW', '_origFrameH', '_origFrameScaleX', '_origFrameScaleY',
      'originX', 'originY', 'customName'
    ]));
    if (undoStack.current.length > 0 && undoStack.current[undoStack.current.length - 1] === json) return;
    undoStack.current.push(json);
    redoStack.current = [];
    if (undoStack.current.length > 50) undoStack.current.shift();
    forceUpdate();
  }, [forceUpdate]);

  const undo = useCallback(async () => {
    if (undoStack.current.length <= 1 || !fabricCanvas.current || isHistoryProcessing.current || isDisposed.current) return;
    isHistoryProcessing.current = true;
    const currentState = undoStack.current.pop()!;
    redoStack.current.push(currentState);
    const previousState = undoStack.current[undoStack.current.length - 1];
    await fabricCanvas.current.loadFromJSON(JSON.parse(previousState));
    fabricCanvas.current.getObjects().forEach(obj => obj.setCoords());
    fabricCanvas.current.renderAll();
    isHistoryProcessing.current = false;
    forceUpdate();
    toast.info("Ação desfeita");
  }, [forceUpdate]);

  const redo = useCallback(async () => {
    if (redoStack.current.length === 0 || !fabricCanvas.current || isHistoryProcessing.current || isDisposed.current) return;
    isHistoryProcessing.current = true;
    const nextState = redoStack.current.pop()!;
    undoStack.current.push(nextState);
    await fabricCanvas.current.loadFromJSON(JSON.parse(nextState));
    fabricCanvas.current.getObjects().forEach(obj => obj.setCoords());
    fabricCanvas.current.renderAll();
    isHistoryProcessing.current = false;
    forceUpdate();
    toast.info("Ação refeita");
  }, [forceUpdate]);

  const attachImageToFrame = useCallback((img: fabric.FabricImage, frame: fabric.FabricObject) => {
    if (!fabricCanvas.current || isDisposed.current) return;

    const zIndex = fabricCanvas.current.getObjects().indexOf(frame);
    const frameType = (frame as any).frameType;
    const isLocked = (frame as any).locked;
    const customName = (frame as any).customName;
    const variableId = (frame as any).variableId;
    
    const centerPoint = frame.getCenterPoint();
    let frameAbsX = centerPoint.x;
    let frameAbsY = centerPoint.y;
    let frameAngle = frame.angle || 0;

    if (frame.type === 'image' && frame.clipPath) {
      const cp = frame.clipPath;
      const angleRad = (frame.angle || 0) * Math.PI / 180;
      const cosA = Math.cos(angleRad), sinA = Math.sin(angleRad);
      const relX = (cp.left || 0) * (frame.scaleX || 1);
      const relY = (cp.top || 0) * (frame.scaleY || 1);
      frameAbsX = centerPoint.x + relX * cosA - relY * sinA;
      frameAbsY = centerPoint.y + relX * sinA + relY * cosA;
      frameAngle = (frame.angle || 0) + (cp.angle || 0);
    }

    const fW = (frame as any)._origFrameW || (frame as any).width || 0;
    const fH = (frame as any)._origFrameH || (frame as any).height || 0;
    const fSX = (frame as any)._origFrameScaleX || frame.scaleX || 1;
    const fSY = (frame as any)._origFrameScaleY || frame.scaleY || 1;
    
    const targetW = fW * fSX;
    const targetH = fH * fSY;

    const scaleX = targetW / (img.width || 1);
    const scaleY = targetH / (img.height || 1);
    const scale = Math.max(scaleX, scaleY);

    img.set({ 
      originX: 'center', originY: 'center', 
      left: frameAbsX, top: frameAbsY, 
      scaleX: scale, scaleY: scale, angle: frameAngle 
    });

    const unscaledFrameW = targetW / scale;
    const unscaledFrameH = targetH / scale;

    let clipPath;
    if (frameType === 'circle') {
       clipPath = new fabric.Circle({ radius: unscaledFrameW / 2, originX: 'center', originY: 'center' });
    } else {
       const radii = (frame as any).customRadii || { tl: 16, tr: 16, br: 16, bl: 16 };
       const pathStr = createRoundedRectPathString(unscaledFrameW, unscaledFrameH, radii.tl / scale, radii.tr / scale, radii.br / scale, radii.bl / scale);
       clipPath = new fabric.Path(pathStr, { originX: 'center', originY: 'center', left: 0, top: 0 });
       (img as any).customRadii = { ...radii };
    }

    img.set('clipPath', clipPath);
    (img as any).isFrame = true;
    (img as any).frameType = frameType;
    (img as any).variableId = variableId;
    (img as any).customName = customName;
    (img as any)._origFrameW = fW;
    (img as any)._origFrameH = fH;
    (img as any)._origFrameScaleX = fSX;
    (img as any)._origFrameScaleY = fSY;
    (img as any).locked = isLocked;

    if (isLocked) {
      img.set({ lockMovementX: true, lockMovementY: true, lockRotation: true, lockScalingX: true, lockScalingY: true, hasControls: false });
    }

    const originalImgToObject = img.toObject.bind(img);
    (img as any).toObject = (propertiesToInclude?: string[]) => {
      return Object.assign(originalImgToObject(propertiesToInclude as any), {
        isFrame: (img as any).isFrame, frameType: (img as any).frameType, variableId: (img as any).variableId,
        customRadii: (img as any).customRadii, locked: (img as any).locked, isCropped: (img as any).isCropped,
        customName: (img as any).customName, _origFrameW: (img as any)._origFrameW, _origFrameH: (img as any)._origFrameH,
        _origFrameScaleX: (img as any)._origFrameScaleX, _origFrameScaleY: (img as any)._origFrameScaleY
      });
    };

    fabricCanvas.current.remove(frame);
    if (!fabricCanvas.current.getObjects().includes(img)) fabricCanvas.current.add(img);
    if (zIndex !== -1) fabricCanvas.current.moveObjectTo(img, zIndex);
    
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
      if (panOverlayRef.current && fabricCanvas.current && !isDisposed.current) {
        fabricCanvas.current.remove(panOverlayRef.current);
        panOverlayRef.current = null;
      }
      const isLocked = (img as any).locked;
      img.set({ hasControls: !isLocked, lockMovementX: isLocked, lockMovementY: isLocked, lockRotation: isLocked, lockScalingX: isLocked, lockScalingY: isLocked, opacity: 1 });
      
      delete (img as any)._originalClipPath;
      delete (img as any)._fixedClipAbsX;
      delete (img as any)._fixedClipAbsY;
      delete (img as any)._fixedClipScaleX;
      delete (img as any)._fixedClipScaleY;
      delete (img as any)._fixedAngle;

      img.setCoords();
      img.set('dirty', true);
      saveHistory();
    }
    setIsPanMode(false);
    panningImgRef.current = null;
    if (fabricCanvas.current && !isDisposed.current) fabricCanvas.current.renderAll();
  }, [saveHistory]);

  const togglePanMode = useCallback(() => {
    if (!fabricCanvas.current || !selectedObject || selectedObject.type !== 'image' || isDisposed.current) return;
    const img = selectedObject as fabric.FabricImage;
    if (isPanMode) {
      stopPanMode();
      fabricCanvas.current.discardActiveObject();
    } else {
      if (!img.clipPath) {
         toast.info("A imagem precisa estar em uma moldura ou recortada.");
         return;
      }
      setIsPanMode(true);
      panningImgRef.current = img;
      const clipPath = img.clipPath;
      if (clipPath) {
         const angleRad = (img.angle || 0) * Math.PI / 180;
         const cosA = Math.cos(angleRad);
         const sinA = Math.sin(angleRad);
         const relX = (clipPath.left || 0) * (img.scaleX || 1);
         const relY = (clipPath.top || 0) * (img.scaleY || 1);
         const imgCenter = img.getCenterPoint();
         const absX = imgCenter.x + relX * cosA - relY * sinA;
         const absY = imgCenter.y + relX * sinA + relY * cosA;
         const fixedScaleX = (clipPath.scaleX || 1) * (img.scaleX || 1);
         const fixedScaleY = (clipPath.scaleY || 1) * (img.scaleY || 1);
         const fixedAngle = img.angle || 0;
         (img as any)._originalClipPath = clipPath;
         (img as any)._fixedClipAbsX = absX; (img as any)._fixedClipAbsY = absY;
         (img as any)._fixedClipScaleX = fixedScaleX; (img as any)._fixedClipScaleY = fixedScaleY;
         (img as any)._fixedAngle = fixedAngle;

         let overlay: fabric.FabricObject;
         if (clipPath.type === 'circle') {
           overlay = new fabric.Circle({ radius: (clipPath as fabric.Circle).radius, originX: 'center', originY: 'center', left: absX, top: absY, scaleX: fixedScaleX, scaleY: fixedScaleY, angle: fixedAngle, fill: 'transparent', stroke: '#3b82f6', strokeWidth: 4, strokeDashArray: [8, 8], selectable: false, evented: false, excludeFromExport: true });
         } else {
           const pathData = (clipPath as fabric.Path).path;
           overlay = new fabric.Path(pathData, { originX: 'center', originY: 'center', left: absX, top: absY, scaleX: fixedScaleX, scaleY: fixedScaleY, angle: fixedAngle, fill: 'transparent', stroke: '#3b82f6', strokeWidth: 4, strokeDashArray: [8, 8], selectable: false, evented: false, excludeFromExport: true });
         }
         fabricCanvas.current.add(overlay);
         panOverlayRef.current = overlay;
         img.set('clipPath', undefined);
      }
      img.set({ hasControls: true, lockMovementX: false, lockMovementY: false, lockScalingX: false, lockScalingY: false, opacity: 0.5 });
      img.set('dirty', true);
    }
    fabricCanvas.current.renderAll();
    forceUpdate();
  }, [isPanMode, stopPanMode, selectedObject, forceUpdate]);

  useEffect(() => {
    isDisposed.current = false;
    if (canvasRef.current && !fabricCanvas.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 1080, height: 1080, backgroundColor: '#ffffff', preserveObjectStacking: true, stopContextMenu: true, fireRightClick: true,  
      });
      fabricCanvas.current = canvas;
      canvas.on('object:modified', saveHistory);
      canvas.on('object:added', saveHistory);
      canvas.on('object:removed', saveHistory);

      canvas.on('text:editing:entered', (e) => {
        const target = e.target as any;
        if (target && target.hiddenTextarea) {
          const textarea = target.hiddenTextarea;
          textarea.style.minHeight = '0px'; textarea.style.minWidth = '0px';
          textarea.style.padding = '0px'; textarea.style.margin = '0px';
          textarea.style.resize = 'none'; textarea.style.boxSizing = 'content-box'; textarea.style.overflow = 'hidden';
        }
      });

      const handleSelection = () => {
        if (isDisposed.current) return;
        const active = canvas.getActiveObject();
        setSelectedObject(active || null);
        if (isPanModeRef.current && active !== panningImgRef.current) stopPanMode(); 
        forceUpdate(); 
      };
      canvas.on('selection:created', handleSelection);
      canvas.on('selection:updated', handleSelection);
      canvas.on('selection:cleared', () => {
        if (isDisposed.current) return;
        setSelectedObject(null);
        setContextMenuInfo({ visible: false, x: 0, y: 0 });
        if (isPanModeRef.current) stopPanMode();
        forceUpdate();
      });

      canvas.on('contextmenu', (options) => {
        if (isDisposed.current) return;
        const e = options.e as MouseEvent;
        e.preventDefault(); e.stopPropagation();
        const target = options.target;
        if (target) {
          if (canvas.getActiveObject() !== target) {
            canvas.setActiveObject(target);
            canvas.renderAll();
          }
          setContextMenuInfo({ visible: true, x: e.clientX, y: e.clientY });
          forceUpdate();
        } else {
          canvas.discardActiveObject(); canvas.renderAll();
          setContextMenuInfo({ visible: false, x: 0, y: 0 });
          forceUpdate();
        }
      });

      canvas.on('mouse:down', (opt) => {
        if (isDisposed.current) return;
        const e = opt.e as MouseEvent;
        if (e.button !== 2) setContextMenuInfo({ visible: false, x: 0, y: 0 });
      });

      canvas.on('object:modified', (e) => {
        if (isDisposed.current) return;
        const obj = e.target;
        const isTransform = !!(e as any).transform;
        
        if (isTransform && obj && obj.type === 'image' && !(obj as any).isFrame && !cropBoxRef.current && !isPanModeRef.current) {
          const imgCenter = obj.getCenterPoint();
          const frames = canvas.getObjects().filter(o => (o as any).isFrame && o !== obj);
          for (const frame of frames) {
            if (frame.containsPoint(imgCenter)) {
               attachImageToFrame(obj as fabric.FabricImage, frame);
               toast.success('Imagem anexada à moldura!');
               break; 
            }
          }
        }
      });
    }
    return () => {
      isDisposed.current = true;
      if (fabricCanvas.current) {
        fabricCanvas.current.dispose();
        fabricCanvas.current = null;
      }
    };
  }, [forceUpdate, attachImageToFrame, stopPanMode, saveHistory]);

  const addText = useCallback((content = 'Novo Texto') => {
    if (!fabricCanvas.current || isDisposed.current) return;
    let fontSize = 35; let fontWeight: any = 'normal';
    const lower = content.toLowerCase();
    if (lower.includes('subtítulo')) fontSize = 55;
    else if (lower.includes('título')) { fontSize = 75; fontWeight = 'bold'; }
    const text = new fabric.IText(content, { 
      left: 100, top: 100, 
      fontFamily: 'Arial', fontSize, fontWeight, 
      fill: '#000000',
      originX: 'center', originY: 'center'
    });
    (text as any).variableId = null; (text as any).locked = false; (text as any).customName = '';
    
    const originalTextToObject = text.toObject.bind(text);
    (text as any).toObject = (propertiesToInclude?: string[]) => {
      return Object.assign(originalTextToObject(propertiesToInclude as any), {
        isFrame: (text as any).isFrame, frameType: (text as any).frameType, variableId: (text as any).variableId,
        customRadii: (text as any).customRadii, locked: (text as any).locked, isCropped: (text as any).isCropped,
        customName: (text as any).customName, _origFrameW: (text as any)._origFrameW, _origFrameH: (text as any)._origFrameH,
        _origFrameScaleX: (text as any)._origFrameScaleX, _origFrameScaleY: (text as any)._origFrameScaleY
      });
    };

    fabricCanvas.current.add(text);
    fabricCanvas.current.centerObject(text);
    fabricCanvas.current.setActiveObject(text);
    fabricCanvas.current.renderAll();
  }, []);

  const addShape = useCallback((type: 'rect' | 'circle' | 'triangle' | 'line') => {
    if (!fabricCanvas.current || isDisposed.current) return;
    let shapeObj: fabric.FabricObject;
    const base = { fill: '#94a3b8', originX: 'center' as const, originY: 'center' as const };
    if (type === 'rect') { 
      shapeObj = new fabric.Rect({ ...base, width: 100, height: 100 }); 
      (shapeObj as any).customRadii = { tl: 0, tr: 0, br: 0, bl: 0 }; 
    }
    else if (type === 'circle') shapeObj = new fabric.Circle({ ...base, radius: 50 });
    else if (type === 'triangle') shapeObj = new fabric.Triangle({ ...base, width: 100, height: 100 });
    else shapeObj = new fabric.Line([-75, 0, 75, 0], { stroke: '#94a3b8', strokeWidth: 5, originX: 'center', originY: 'center' });
    
    (shapeObj as any).variableId = null; (shapeObj as any).isFrame = false; (shapeObj as any).locked = false; (shapeObj as any).customName = '';
    
    const originalShapeToObject = shapeObj.toObject.bind(shapeObj);
    (shapeObj as any).toObject = (propertiesToInclude?: string[]) => {
      return Object.assign(originalShapeToObject(propertiesToInclude as any), {
        isFrame: (shapeObj as any).isFrame, frameType: (shapeObj as any).frameType, variableId: (shapeObj as any).variableId,
        customRadii: (shapeObj as any).customRadii, locked: (shapeObj as any).locked, isCropped: (shapeObj as any).isCropped,
        customName: (shapeObj as any).customName, _origFrameW: (shapeObj as any)._origFrameW, _origFrameH: (shapeObj as any)._origFrameH,
        _origFrameScaleX: (shapeObj as any)._origFrameScaleX, _origFrameScaleY: (shapeObj as any)._origFrameScaleY
      });
    };

    fabricCanvas.current.add(shapeObj);
    fabricCanvas.current.centerObject(shapeObj);
    fabricCanvas.current.setActiveObject(shapeObj);
    fabricCanvas.current.renderAll();
    forceUpdate();
  }, [forceUpdate]);

  const addFrame = useCallback((type: 'circle' | 'rect') => {
    if (!fabricCanvas.current || isDisposed.current) return;
    let frameObj: fabric.FabricObject;
    const common = { fill: '#f1f5f9', stroke: '#cbd5e1', strokeWidth: 2, strokeDashArray: [8, 8], originX: 'center' as const, originY: 'center' as const };
    if (type === 'circle') frameObj = new fabric.Circle({ ...common, radius: 100 });
    else { 
      frameObj = new fabric.Rect({ ...common, width: 200, height: 200, rx: 16, ry: 16 }); 
      (frameObj as any).customRadii = { tl: 16, tr: 16, br: 16, bl: 16 }; 
    }
    
    (frameObj as any).isFrame = true; (frameObj as any).frameType = type; (frameObj as any).variableId = null; (frameObj as any).locked = false; (frameObj as any).customName = '';
    
    const originalFrameToObject = frameObj.toObject.bind(frameObj);
    (frameObj as any).toObject = (propertiesToInclude?: string[]) => {
      return Object.assign(originalFrameToObject(propertiesToInclude as any), {
        isFrame: (frameObj as any).isFrame, frameType: (frameObj as any).frameType, variableId: (frameObj as any).variableId,
        customRadii: (frameObj as any).customRadii, locked: (frameObj as any).locked, isCropped: (frameObj as any).isCropped,
        customName: (frameObj as any).customName, _origFrameW: (frameObj as any)._origFrameW, _origFrameH: (frameObj as any)._origFrameH,
        _origFrameScaleX: (frameObj as any)._origFrameScaleX, _origFrameScaleY: (frameObj as any)._origFrameScaleY
      });
    };

    fabricCanvas.current.add(frameObj);
    fabricCanvas.current.centerObject(frameObj);
    fabricCanvas.current.setActiveObject(frameObj);
    fabricCanvas.current.renderAll();
    forceUpdate();
  }, [forceUpdate]);

  const addImage = useCallback(async (url: string) => {
    if (!fabricCanvas.current || isDisposed.current) return;
    try {
      const img = await fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
      const active = fabricCanvas.current.getActiveObject();
      if (active && (active as any).isFrame) {
        attachImageToFrame(img, active);
      } else {
        img.scaleToWidth(200); img.set({ originX: 'center', originY: 'center' });
        (img as any).customRadii = { tl: 0, tr: 0, br: 0, bl: 0 }; (img as any).locked = false; (img as any).customName = '';
        
        const originalImgToObject = img.toObject.bind(img);
        (img as any).toObject = (propertiesToInclude?: string[]) => {
          return Object.assign(originalImgToObject(propertiesToInclude as any), {
            isFrame: (img as any).isFrame, frameType: (img as any).frameType, variableId: (img as any).variableId,
            customRadii: (img as any).customRadii, locked: (img as any).locked, isCropped: (img as any).isCropped,
            customName: (img as any).customName, _origFrameW: (img as any)._origFrameW, _origFrameH: (img as any)._origFrameH,
            _origFrameScaleX: (img as any)._origFrameScaleX, _origFrameScaleY: (img as any)._origFrameScaleY
          });
        };

        fabricCanvas.current.add(img); 
        fabricCanvas.current.centerObject(img); 
        fabricCanvas.current.setActiveObject(img);
      }
      fabricCanvas.current.renderAll();
      forceUpdate();
    } catch (e) { toast.error("Erro ao carregar imagem."); }
  }, [attachImageToFrame, forceUpdate]);

  const toggleObjectVisibility = useCallback((obj: fabric.FabricObject) => {
    if (!fabricCanvas.current || isDisposed.current) return;
    const isVisible = !obj.visible;
    obj.set('visible', isVisible);
    fabricCanvas.current.renderAll();
    saveHistory();
    forceUpdate();
    toast.info(isVisible ? "Item visível" : "Item ocultado");
  }, [saveHistory, forceUpdate]);

  const toggleObjectLock = useCallback((obj: fabric.FabricObject) => {
    if (!fabricCanvas.current || isDisposed.current) return;
    const isLocked = !(obj as any).locked;
    (obj as any).locked = isLocked;
    obj.set({
      lockMovementX: isLocked, lockMovementY: isLocked,
      lockRotation: isLocked, lockScalingX: isLocked,
      lockScalingY: isLocked, hasControls: !isLocked
    });
    fabricCanvas.current.renderAll();
    saveHistory();
    forceUpdate();
    toast.info(isLocked ? "Item travado" : "Item destravado");
  }, [saveHistory, forceUpdate]);

  const deleteObject = useCallback((obj: fabric.FabricObject) => {
    if (!fabricCanvas.current || isDisposed.current) return;
    fabricCanvas.current.remove(obj);
    if (selectedObject === obj) setSelectedObject(null);
    fabricCanvas.current.renderAll();
    saveHistory();
    forceUpdate();
    toast.success("Item removido");
  }, [selectedObject, saveHistory, forceUpdate]);

  const moveObject = useCallback((obj: fabric.FabricObject, direction: 'up' | 'down' | 'front' | 'back') => {
    if (!fabricCanvas.current || isDisposed.current) return;
    switch (direction) {
      case 'up': fabricCanvas.current.bringObjectForward(obj); break;
      case 'down': fabricCanvas.current.sendObjectBackwards(obj); break;
      case 'front': fabricCanvas.current.bringObjectToFront(obj); break;
      case 'back': fabricCanvas.current.sendObjectToBack(obj); break;
    }
    fabricCanvas.current.renderAll();
    saveHistory();
    forceUpdate();
    toast.info("Posição alterada");
  }, [saveHistory, forceUpdate]);

  const renameObject = useCallback((obj: fabric.FabricObject, newName: string) => {
    (obj as any).customName = newName;
    saveHistory();
    forceUpdate();
    toast.success("Item renomeado");
  }, [saveHistory, forceUpdate]);

  const detachImageFromFrame = useCallback(() => {
    if (!fabricCanvas.current || !selectedObject || selectedObject.type !== 'image' || !(selectedObject as any).isFrame || isDisposed.current) return;
    const img = selectedObject as fabric.FabricImage;
    const clipPath = img.clipPath; if (!clipPath) return;
    const zIndex = fabricCanvas.current.getObjects().indexOf(img);
    const frameW = (img as any)._origFrameW || (clipPath as any).width, frameH = (img as any)._origFrameH || (clipPath as any).height;
    const frameScaleX = (img as any)._origFrameScaleX || 1, frameScaleY = (img as any)._origFrameScaleY || 1;
    const centerPoint = img.getCenterPoint();
    const angleRad = (img.angle || 0) * Math.PI / 180;
    const cosA = Math.cos(angleRad), sinA = Math.sin(angleRad);
    const relX = (clipPath.left || 0) * (img.scaleX || 1), relY = (clipPath.top || 0) * (img.scaleY || 1);
    const frameAbsX = centerPoint.x + relX * cosA - relY * sinA, frameAbsY = centerPoint.y + relX * sinA + relY * cosA, frameAngle = (img.angle || 0) + (clipPath.angle || 0);
    
    let frameObj: fabric.FabricObject;
    if ((img as any).frameType === 'circle') frameObj = new fabric.Circle({ radius: frameW / 2, fill: '#f1f5f9', stroke: '#cbd5e1', strokeWidth: 2, strokeDashArray: [8, 8], originX: 'center', originY: 'center', left: frameAbsX, top: frameAbsY, angle: frameAngle, scaleX: frameScaleX, scaleY: frameScaleY });
    else frameObj = new fabric.Rect({ width: frameW, height: frameH, fill: '#f1f5f9', stroke: '#cbd5e1', strokeWidth: 2, strokeDashArray: [8, 8], originX: 'center', originY: 'center', left: frameAbsX, top: frameAbsY, angle: frameAngle, rx: (img as any).customRadii?.tl || 16, ry: (img as any).customRadii?.tl || 16, scaleX: frameScaleX, scaleY: frameScaleY });
    
    (frameObj as any).isFrame = true; (frameObj as any).frameType = (img as any).frameType; (frameObj as any).variableId = (img as any).variableId; (frameObj as any).locked = (img as any).locked; (frameObj as any).customName = (img as any).customName;
    if ((img as any).locked) frameObj.set({ lockMovementX: true, lockMovementY: true, lockRotation: true, lockScalingX: true, lockScalingY: true, hasControls: false });
    
    const originalFrameToObject = frameObj.toObject.bind(frameObj);
    (frameObj as any).toObject = (propertiesToInclude?: string[]) => {
      return Object.assign(originalFrameToObject(propertiesToInclude as any), { isFrame: (frameObj as any).isFrame, frameType: (frameObj as any).frameType, variableId: (frameObj as any).variableId, customRadii: (frameObj as any).customRadii, locked: (frameObj as any).locked, isCropped: (frameObj as any).isCropped, customName: (frameObj as any).customName, _origFrameW: (frameObj as any)._origFrameW, _origFrameH: (frameObj as any)._origFrameH, _origFrameScaleX: (frameObj as any)._origFrameScaleX, _origFrameScaleY: (frameObj as any)._origFrameScaleY });
    };

    img.set('clipPath', undefined); (img as any).isFrame = false; (img as any).variableId = null; (img as any).customRadii = { tl: 0, tr: 0, br: 0, bl: 0 }; (img as any).locked = false;
    img.set({ lockMovementX: false, lockMovementY: false, lockRotation: false, lockScalingX: false, lockScalingY: false, hasControls: true });
    img.set('dirty', true);
    fabricCanvas.current.add(frameObj); fabricCanvas.current.moveObjectTo(frameObj, zIndex); fabricCanvas.current.bringObjectToFront(img); fabricCanvas.current.setActiveObject(img);
    fabricCanvas.current.renderAll(); saveHistory(); forceUpdate();
    toast.info("Imagem removida da moldura");
  }, [selectedObject, saveHistory, forceUpdate]);

  const startCrop = useCallback(() => {
    if (!fabricCanvas.current || !selectedObject || selectedObject.type !== 'image' || isDisposed.current) return;
    const img = selectedObject as fabric.FabricImage;
    if ((img as any).isFrame || (img as any).isCropped) { toast.info("A imagem já possui recorte ou moldura."); return; }
    const imgCenter = img.getCenterPoint();
    const rect = new fabric.Rect({ left: imgCenter.x, top: imgCenter.y, width: img.getScaledWidth(), height: img.getScaledHeight(), originX: 'center', originY: 'center', angle: img.angle, fill: 'rgba(0,0,0,0.5)', stroke: '#3b82f6', strokeWidth: 2, strokeDashArray: [5, 5], cornerColor: '#3b82f6', transparentCorners: false, hasRotatingPoint: false });
    (rect as any).targetImg = img; img.set({ selectable: false, evented: false });
    fabricCanvas.current.add(rect); fabricCanvas.current.setActiveObject(rect); setCropBox(rect); fabricCanvas.current.renderAll(); forceUpdate();
    toast.info("Selecione a área de recorte");
  }, [selectedObject, forceUpdate]);

  const applyCrop = useCallback(() => {
    if (!fabricCanvas.current || !cropBox || isDisposed.current) return;
    const img = (cropBox as any).targetImg as fabric.FabricImage;
    const imgCenter = img.getCenterPoint(), cropCenter = cropBox.getCenterPoint();
    const diffX = cropCenter.x - imgCenter.x, diffY = cropCenter.y - imgCenter.y, angleDiff = (cropBox.angle || 0) - (img.angle || 0);
    const angleRad = -(img.angle || 0) * Math.PI / 180;
    const cosA = Math.cos(angleRad), sinA = Math.sin(angleRad);
    const localX = diffX * cosA - diffY * sinA, localY = diffX * sinA + diffY * cosA;
    const clipPath = new fabric.Rect({ width: cropBox.getScaledWidth() / (img.scaleX || 1), height: cropBox.getScaledHeight() / (img.scaleY || 1), originX: 'center', originY: 'center', left: localX / (img.scaleX || 1), top: localY / (img.scaleY || 1), angle: angleDiff });
    img.set('clipPath', clipPath); (img as any).isCropped = true; img.set({ selectable: true, evented: true, dirty: true });
    fabricCanvas.current.remove(cropBox); setCropBox(null); fabricCanvas.current.setActiveObject(img); fabricCanvas.current.renderAll(); saveHistory(); forceUpdate();
    toast.success("Recorte aplicado");
  }, [cropBox, saveHistory, forceUpdate]);

  const cancelCrop = useCallback(() => {
    if (!fabricCanvas.current || !cropBox || isDisposed.current) return;
    const img = (cropBox as any).targetImg as fabric.FabricImage;
    img.set({ selectable: true, evented: true });
    fabricCanvas.current.remove(cropBox); setCropBox(null); fabricCanvas.current.setActiveObject(img); fabricCanvas.current.renderAll(); forceUpdate();
    toast.info("Recorte cancelado");
  }, [cropBox, forceUpdate]);

  const removeCrop = useCallback(() => {
    if (!fabricCanvas.current || !selectedObject || selectedObject.type !== 'image' || isDisposed.current) return;
    const img = selectedObject; if (!(img as any).isCropped) return;
    img.set('clipPath', undefined); (img as any).isCropped = false; img.set('dirty', true);
    fabricCanvas.current.renderAll(); saveHistory(); forceUpdate();
    toast.info("Recorte removido");
  }, [selectedObject, saveHistory, forceUpdate]);

  const exportToImage = useCallback(() => fabricCanvas.current?.toDataURL({ format: 'png', multiplier: 2 }) || '', []);
  const saveToJson = useCallback(() => fabricCanvas.current ? JSON.stringify((fabricCanvas.current as any).toObject(['variableId', 'isFrame', 'frameType', 'customRadii', 'locked', 'isCropped', 'customName', '_origFrameW', '_origFrameH', '_origFrameScaleX', '_origFrameScaleY'])) : '', []);

  const loadFromJson = useCallback(async (json: any) => {
    if (!fabricCanvas.current || isDisposed.current) return;
    
    // Verifica se o contexto ainda é válido
    const ctx = fabricCanvas.current.getContext();
    if (!ctx) return;

    isHistoryProcessing.current = true;
    try {
      const parsed = typeof json === 'string' ? JSON.parse(json) : json;
      
      // Certifica-se que o canvas ainda está ativo antes de carregar
      await fabricCanvas.current.loadFromJSON(parsed);
      
      const objects = fabricCanvas.current.getObjects() || [];
      if (parsed.objects) {
        parsed.objects.forEach((data: any, i: number) => {
          const obj = objects[i]; if (!obj) return;
          if (data.isFrame !== undefined) (obj as any).isFrame = data.isFrame;
          if (data.frameType !== undefined) (obj as any).frameType = data.frameType;
          if (data.variableId !== undefined) (obj as any).variableId = data.variableId;
          if (data.customRadii !== undefined) (obj as any).customRadii = data.customRadii;
          if (data.isCropped !== undefined) (obj as any).isCropped = data.isCropped;
          if (data.customName !== undefined) (obj as any).customName = data.customName;
          if (data._origFrameW !== undefined) (obj as any)._origFrameW = data._origFrameW;
          if (data._origFrameH !== undefined) (obj as any)._origFrameH = data._origFrameH;
          if (data._origFrameScaleX !== undefined) (obj as any)._origFrameScaleX = data._origFrameScaleX;
          if (data._origFrameScaleY !== undefined) (obj as any)._origFrameScaleY = data._origFrameScaleY;
          if (data.locked !== undefined) {
            (obj as any).locked = data.locked;
            if (data.locked) obj.set({ lockMovementX: true, lockMovementY: true, lockRotation: true, lockScalingX: true, lockScalingY: true, hasControls: false });
          }
          
          const originalObjToObject = obj.toObject.bind(obj);
          (obj as any).toObject = (propertiesToInclude?: string[]) => {
            return Object.assign(originalObjToObject(propertiesToInclude as any), { isFrame: (obj as any).isFrame, frameType: (obj as any).frameType, variableId: (obj as any).variableId, customRadii: (obj as any).customRadii, locked: (obj as any).locked, isCropped: (obj as any).isCropped, customName: (obj as any).customName, _origFrameW: (obj as any)._origFrameW, _origFrameH: (obj as any)._origFrameH, _origFrameScaleX: (obj as any)._origFrameScaleX, _origFrameScaleY: (obj as any)._origFrameScaleY });
          };
          obj.set('dirty', true);
        });
      }
      
      fabricCanvas.current.getObjects().forEach(obj => obj.setCoords());
      fabricCanvas.current.renderAll();
      undoStack.current = [JSON.stringify((fabricCanvas.current as any).toObject())]; 
      redoStack.current = []; 
      forceUpdate();
    } catch (e) { 
      console.error("Erro ao carregar JSON:", e); 
    } finally {
      isHistoryProcessing.current = false;
    }
  }, [forceUpdate]);

  const clearCanvas = useCallback(() => {
    if (!fabricCanvas.current || isDisposed.current) return;
    fabricCanvas.current.clear(); fabricCanvas.current.backgroundColor = '#ffffff'; fabricCanvas.current.renderAll();
    setSelectedObject(null); saveHistory(); forceUpdate();
    toast.info("Canvas limpo");
  }, [saveHistory, forceUpdate]);

  const deleteSelected = useCallback(() => {
    if (!selectedObject || !fabricCanvas.current || isDisposed.current) return;
    fabricCanvas.current.remove(selectedObject); fabricCanvas.current.discardActiveObject(); fabricCanvas.current.renderAll();
    saveHistory(); forceUpdate();
    toast.success("Item excluído");
  }, [selectedObject, saveHistory, forceUpdate]);

  const setCornerRadii = useCallback((tl: number, tr: number, br: number, bl: number) => {
    if (!fabricCanvas.current || !selectedObject || isDisposed.current) return;
    const obj = selectedObject, scaleX = obj.scaleX || 1;
    const utl = tl / scaleX, utr = tr / scaleX, ubr = br / scaleX, ubl = bl / scaleX;
    (obj as any).customRadii = { tl, tr, br, bl };
    if (obj.type === 'image' || obj.type === 'rect') {
      if (obj.type === 'rect') (obj as fabric.Rect).set({ rx: 0, ry: 0 });
      let tw = (obj as any).width || 0, th = (obj as any).height || 0;
      if (obj.type === 'image' && obj.clipPath && (obj as any).frameType === 'rect') { 
        tw = (obj.clipPath as any).width || 0; 
        th = (obj.clipPath as any).height || 0; 
      }
      if (utl <= 0 && utr <= 0 && ubr <= 0 && ubl <= 0) obj.set('clipPath', undefined);
      else {
         const pathStr = createRoundedRectPathString(tw, th, utl, utr, ubr, ubl);
         const clipPath = new fabric.Path(pathStr, { originX: 'center', originY: 'center', left: 0, top: 0 });
         obj.set('clipPath', clipPath);
      }
      obj.set('dirty', true); saveHistory();
    } 
    fabricCanvas.current.renderAll(); forceUpdate();
  }, [selectedObject, saveHistory, forceUpdate]);

  const changeTextColor = useCallback((color: string) => {
    if (!selectedObject || !fabricCanvas.current || isDisposed.current) return;
    selectedObject.set('fill', color); fabricCanvas.current.renderAll(); saveHistory(); forceUpdate();
  }, [selectedObject, saveHistory, forceUpdate]);

  const applyGradient = useCallback((stopsOrColor1: any, typeOrColor2: any, directionOrType?: any) => {
    if (!selectedObject || !fabricCanvas.current || isDisposed.current) return;
    
    let stops: { offset: number, color: string }[] = [];
    let gradientDirection: 'to-right' | 'to-bottom' | 'to-bottom-right' | 'to-top-right' | 'radial' = 'to-right';

    if (Array.isArray(stopsOrColor1)) {
      stops = stopsOrColor1;
      gradientDirection = typeOrColor2 || 'to-right';
    } else if (typeof stopsOrColor1 === 'string' && typeof typeOrColor2 === 'string') {
      stops = [
        { offset: 0, color: stopsOrColor1 },
        { offset: 1, color: typeOrColor2 }
      ];
      
      const dir = directionOrType || 'horizontal';
      if (dir === 'horizontal') gradientDirection = 'to-right';
      else if (dir === 'vertical') gradientDirection = 'to-bottom';
      else gradientDirection = dir as any;
    } else {
      return;
    }

    const w = selectedObject.width || 0;
    const h = selectedObject.height || 0;
    let coords: any = {};
    let gradientType: 'linear' | 'radial' = 'linear';

    switch (gradientDirection) {
      case 'to-right':
        coords = { x1: -w / 2, y1: 0, x2: w / 2, y2: 0 };
        break;
      case 'to-bottom':
        coords = { x1: 0, y1: -h / 2, x2: 0, y2: h / 2 };
        break;
      case 'to-bottom-right':
        coords = { x1: -w / 2, y1: -h / 2, x2: w / 2, y2: h / 2 };
        break;
      case 'to-top-right':
        coords = { x1: -w / 2, y1: h / 2, x2: w / 2, y2: -h / 2 };
        break;
      case 'radial':
        gradientType = 'radial';
        coords = {
          r1: 0,
          r2: Math.max(w, h) / 2,
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 0,
        };
        break;
    }

    const gradient = new fabric.Gradient({
      type: gradientType,
      gradientUnits: 'pixels',
      coords,
      colorStops: stops
    });

    const property = (selectedObject.type === 'line' || selectedObject.type === 'polyline') ? 'stroke' : 'fill';
    selectedObject.set(property, gradient);
    fabricCanvas.current.renderAll();
    saveHistory();
    forceUpdate();
  }, [selectedObject, saveHistory, forceUpdate]);

  const toggleBold = useCallback(() => {
    if (!selectedObject || !(selectedObject instanceof fabric.IText) || isDisposed.current) return;
    selectedObject.set('fontWeight', selectedObject.fontWeight === 'bold' ? 'normal' : 'bold');
    fabricCanvas.current?.renderAll(); saveHistory(); forceUpdate();
  }, [selectedObject, saveHistory, forceUpdate]);

  const toggleItalic = useCallback(() => {
    if (!selectedObject || !(selectedObject instanceof fabric.IText) || isDisposed.current) return;
    selectedObject.set('fontStyle', selectedObject.fontStyle === 'italic' ? 'normal' : 'italic');
    fabricCanvas.current?.renderAll(); saveHistory(); forceUpdate();
  }, [selectedObject, saveHistory, forceUpdate]);

  const toggleUnderline = useCallback(() => {
    if (!selectedObject || !(selectedObject instanceof fabric.IText) || isDisposed.current) return;
    selectedObject.set('underline', !selectedObject.underline);
    fabricCanvas.current?.renderAll(); saveHistory(); forceUpdate();
  }, [selectedObject, saveHistory, forceUpdate]);

  const toggleLinethrough = useCallback(() => {
    if (!selectedObject || !(selectedObject instanceof fabric.IText) || isDisposed.current) return;
    selectedObject.set('linethrough', !selectedObject.linethrough);
    fabricCanvas.current?.renderAll(); saveHistory(); forceUpdate();
  }, [selectedObject, saveHistory, forceUpdate]);

  const setFontSize = useCallback((size: number) => {
    if (!selectedObject || !(selectedObject instanceof fabric.IText) || isDisposed.current) return;
    selectedObject.set('fontSize', size);
    fabricCanvas.current?.renderAll(); saveHistory(); forceUpdate();
  }, [selectedObject, saveHistory, forceUpdate]);

  const setTextAlignment = useCallback((align: any) => {
    if (!selectedObject || !(selectedObject instanceof fabric.IText) || isDisposed.current) return;
    selectedObject.set('textAlign', align);
    fabricCanvas.current?.renderAll(); saveHistory(); forceUpdate();
  }, [selectedObject, saveHistory, forceUpdate]);

  const toggleList = useCallback(() => {
    if (!selectedObject || !(selectedObject instanceof fabric.IText) || isDisposed.current) return;
    const lines = (selectedObject.text || '').split('\n');
    const isList = lines.every(l => l.trim().startsWith('• '));
    selectedObject.set('text', isList ? lines.map(l => l.replace('• ', '')).join('\n') : lines.map(l => l.trim().startsWith('• ') ? l : `• ${l}`).join('\n'));
    fabricCanvas.current?.renderAll(); saveHistory(); forceUpdate();
  }, [selectedObject, saveHistory, forceUpdate]);

  const setLineHeight = useCallback((val: number) => {
    if (!selectedObject || !(selectedObject instanceof fabric.IText) || isDisposed.current) return;
    selectedObject.set('lineHeight', val);
    fabricCanvas.current?.renderAll(); saveHistory(); forceUpdate();
  }, [selectedObject, saveHistory, forceUpdate]);

  const setTextIndent = useCallback((val: number) => {
    if (!selectedObject || !(selectedObject instanceof fabric.IText) || isDisposed.current) return;
    selectedObject.set('charSpacing', val);
    fabricCanvas.current?.renderAll(); saveHistory(); forceUpdate();
  }, [selectedObject, saveHistory, forceUpdate]);

  const centerObject = useCallback(() => {
    if (!selectedObject || !fabricCanvas.current || isDisposed.current) return;
    fabricCanvas.current.centerObject(selectedObject); selectedObject.setCoords(); fabricCanvas.current.renderAll(); saveHistory(); forceUpdate();
    toast.info("Item centralizado");
  }, [selectedObject, saveHistory, forceUpdate]);

  const bringToFront = useCallback(() => {
    if (!selectedObject || !fabricCanvas.current || isDisposed.current) return;
    fabricCanvas.current.bringObjectToFront(selectedObject); fabricCanvas.current.renderAll(); saveHistory(); forceUpdate();
    toast.info("Trazido para frente");
  }, [selectedObject, saveHistory, forceUpdate]);

  const sendToBack = useCallback(() => {
    if (!selectedObject || !fabricCanvas.current || isDisposed.current) return;
    fabricCanvas.current.sendObjectToBack(selectedObject); fabricCanvas.current.renderAll(); saveHistory(); forceUpdate();
    toast.info("Enviado para trás");
  }, [selectedObject, saveHistory, forceUpdate]);

  const toggleLock = useCallback(() => {
    if (!selectedObject || !fabricCanvas.current || isDisposed.current) return;
    const isLocked = !(selectedObject as any).locked; (selectedObject as any).locked = isLocked;
    selectedObject.set({ lockMovementX: isLocked, lockMovementY: isLocked, lockRotation: isLocked, lockScalingX: isLocked, lockScalingY: isLocked, hasControls: !isLocked });
    fabricCanvas.current.renderAll(); saveHistory(); forceUpdate();
    toast.info(isLocked ? "Item travado" : "Item destravado");
  }, [selectedObject, saveHistory, forceUpdate]);

  const toggleFlipX = useCallback(() => { if (selectedObject && !isDisposed.current) { selectedObject.set('flipX', !selectedObject.flipX); fabricCanvas.current?.renderAll(); saveHistory(); forceUpdate(); } }, [selectedObject, saveHistory, forceUpdate]);
  const toggleFlipY = useCallback(() => { if (selectedObject && !isDisposed.current) { selectedObject.set('flipY', !selectedObject.flipY); fabricCanvas.current?.renderAll(); saveHistory(); forceUpdate(); } }, [selectedObject, saveHistory, forceUpdate]);
  const setImageOpacity = useCallback((v: number) => { if (selectedObject && !isDisposed.current) { selectedObject.set('opacity', v); fabricCanvas.current?.renderAll(); saveHistory(); forceUpdate(); } }, [selectedObject, saveHistory, forceUpdate]);
  const setCanvasProperty = useCallback((k: string, v: any) => { if (selectedObject && !isDisposed.current) { selectedObject.set(k as any, v); fabricCanvas.current?.renderAll(); saveHistory(); forceUpdate(); } }, [selectedObject, saveHistory, forceUpdate]);

  const toggleOutlineOnly = useCallback(() => {
    if (!selectedObject || !fabricCanvas.current || isDisposed.current) return;
    if (selectedObject.type === 'image' || selectedObject.type === 'i-text' || selectedObject.type === 'text') return;

    const hasFill = selectedObject.fill && selectedObject.fill !== 'transparent';
    
    if (hasFill) {
      // Ativa apenas contorno: transfere a cor do preenchimento para o contorno
      const currentColor = typeof selectedObject.fill === 'string' ? selectedObject.fill : '#94a3b8';
      selectedObject.set({
        fill: 'transparent',
        stroke: currentColor,
        strokeWidth: selectedObject.strokeWidth || 2
      });
    } else {
      // Ativa preenchimento: transfere a cor do contorno para o preenchimento
      const currentColor = typeof selectedObject.stroke === 'string' ? selectedObject.stroke : '#94a3b8';
      selectedObject.set({
        fill: currentColor,
        stroke: null,
        strokeWidth: 0
      });
    }
    
    fabricCanvas.current.renderAll();
    saveHistory();
    forceUpdate();
  }, [selectedObject, saveHistory, forceUpdate]);

  const memoizedMethods = useMemo(() => ({ 
    canvasRef, addText, addImage, addShape, addFrame, detachImageFromFrame, exportToImage, saveToJson, loadFromJson, clearCanvas, deleteSelected,
    setCornerRadii, toggleFlipX, toggleFlipY, setImageOpacity, centerObject, bringToFront, sendToBack, toggleLock, selectedObject, fabricCanvas, contextMenuInfo, setContextMenuInfo,
    isPanMode, togglePanMode, cropBox, startCrop, applyCrop, cancelCrop, removeCrop,
    changeTextColor, toggleBold, toggleItalic, toggleUnderline, toggleLinethrough, setFontSize, setTextAlignment, toggleList, setLineHeight, setTextIndent, applyGradient,
    undo, redo, canUndo: undoStack.current.length > 1, canRedo: redoStack.current.length > 0, setCanvasProperty, changeCount: updateTrigger,
    toggleObjectVisibility, toggleObjectLock, deleteObject, moveObject, renameObject, isDisposed, toggleOutlineOnly
  }), [selectedObject, contextMenuInfo, isPanMode, updateTrigger, addText, addImage, addShape, addFrame, detachImageFromFrame, exportToImage, saveToJson, loadFromJson, clearCanvas, deleteSelected, setCornerRadii, toggleFlipX, toggleFlipY, setImageOpacity, centerObject, bringToFront, sendToBack, toggleLock, togglePanMode, cropBox, startCrop, applyCrop, cancelCrop, removeCrop, changeTextColor, toggleBold, toggleItalic, toggleUnderline, toggleLinethrough, setFontSize, setTextAlignment, toggleList, setLineHeight, setTextIndent, applyGradient, undo, redo, setCanvasProperty, toggleObjectVisibility, toggleObjectLock, deleteObject, moveObject, renameObject, toggleOutlineOnly]);

  return memoizedMethods;
};