import { useEffect, useRef, useState, useCallback } from 'react';
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

  // HISTÓRICO (UNDO/REDO)
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const isHistoryProcessing = useRef(false);

  // ESTADOS E REFS PARA MODO DE AJUSTE (PAN) E RECORTE (CROP)
  const [isPanMode, setIsPanMode] = useState(false);
  const isPanModeRef = useRef(isPanMode); 
  
  const panningImgRef = useRef<fabric.FabricImage | null>(null);
  const panOverlayRef = useRef<fabric.FabricObject | null>(null);

  const [cropBox, setCropBox] = useState<fabric.Rect | null>(null);
  const cropBoxRef = useRef(cropBox); 

  // Sincroniza os estados com as Refs
  useEffect(() => { isPanModeRef.current = isPanMode; }, [isPanMode]);
  useEffect(() => { cropBoxRef.current = cropBox; }, [cropBox]);

  const [, setUpdateTrigger] = useState(0);

  const forceUpdate = useCallback(() => {
    setUpdateTrigger((prev) => prev + 1);
  }, []);

  // --- FUNÇÕES DE HISTÓRICO ---

  const saveHistory = useCallback(() => {
    if (!fabricCanvas.current || isHistoryProcessing.current) return;

    const json = JSON.stringify(fabricCanvas.current.toJSON([
      'variableId', 'isFrame', 'frameType', 'customRadii', 'locked', 'isCropped', 
      '_origFrameW', '_origFrameH', '_origFrameScaleX', '_origFrameScaleY',
      'originX', 'originY' // Crucial para manter a posição correta
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
    
    // CORREÇÃO: Forçar recálculo de coordenadas para evitar pulos para o canto 0,0
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
    
    // CORREÇÃO: Forçar recálculo de coordenadas
    fabricCanvas.current.getObjects().forEach(obj => obj.setCoords());
    fabricCanvas.current.renderAll();

    isHistoryProcessing.current = false;
    forceUpdate();
  }, [forceUpdate]);

  // --- NOVAS FUNÇÕES DE EDIÇÃO DE TEXTO ---

  const changeTextColor = (color: string) => {
    if (!fabricCanvas.current || !selectedObject) return;
    selectedObject.set('fill', color);
    fabricCanvas.current.renderAll();
    saveHistory();
    forceUpdate();
  };

  const applyGradient = (color1: string, color2: string, orientation: 'horizontal' | 'vertical' = 'horizontal') => {
    if (!fabricCanvas.current || !selectedObject) return;

    const isVert = orientation === 'vertical';
    const width = selectedObject.width || 0;
    const height = selectedObject.height || 0;

    const gradient = new fabric.Gradient({
      type: 'linear',
      gradientUnits: 'pixels',
      coords: {
        x1: isVert ? 0 : -width / 2,
        y1: isVert ? -height / 2 : 0,
        x2: isVert ? 0 : width / 2,
        y2: isVert ? height / 2 : 0,
      },
      colorStops: [
        { offset: 0, color: color1 },
        { offset: 1, color: color2 },
      ],
    });

    selectedObject.set('fill', gradient);
    fabricCanvas.current.renderAll();
    saveHistory();
    forceUpdate();
  };

  const toggleBold = () => {
    if (!fabricCanvas.current || !selectedObject) return;
    if (selectedObject instanceof fabric.IText) {
      const isBold = selectedObject.fontWeight === 'bold';
      selectedObject.set('fontWeight', isBold ? 'normal' : 'bold');
      fabricCanvas.current.renderAll();
      saveHistory();
      forceUpdate();
    }
  };

  const toggleItalic = () => {
    if (!fabricCanvas.current || !selectedObject) return;
    if (selectedObject instanceof fabric.IText) {
      const isItalic = selectedObject.fontStyle === 'italic';
      selectedObject.set('fontStyle', isItalic ? 'normal' : 'italic');
      fabricCanvas.current.renderAll();
      saveHistory();
      forceUpdate();
    }
  };

  const toggleUnderline = () => {
    if (!fabricCanvas.current || !selectedObject) return;
    if (selectedObject instanceof fabric.IText) {
      selectedObject.set('underline', !selectedObject.underline);
      fabricCanvas.current.renderAll();
      saveHistory();
      forceUpdate();
    }
  };

  const toggleLinethrough = () => {
    if (!fabricCanvas.current || !selectedObject) return;
    if (selectedObject instanceof fabric.IText) {
      selectedObject.set('linethrough', !selectedObject.linethrough);
      fabricCanvas.current.renderAll();
      saveHistory();
      forceUpdate();
    }
  };

  const setFontSize = (size: number) => {
    if (!fabricCanvas.current || !selectedObject) return;
    if (selectedObject instanceof fabric.IText) {
      selectedObject.set('fontSize', size);
      fabricCanvas.current.renderAll();
      saveHistory();
      forceUpdate();
    }
  };

  const setTextAlignment = (align: 'left' | 'center' | 'right' | 'justify') => {
    if (!fabricCanvas.current || !selectedObject) return;
    if (selectedObject instanceof fabric.IText) {
      selectedObject.set('textAlign', align);
      fabricCanvas.current.renderAll();
      saveHistory();
      forceUpdate();
    }
  };

  const toggleList = () => {
    if (!fabricCanvas.current || !selectedObject) return;
    if (selectedObject instanceof fabric.IText) {
      const text = selectedObject.text || '';
      const lines = text.split('\n');
      const isList = lines.every(line => line.trim().startsWith('• '));

      const newText = isList 
        ? lines.map(line => line.replace('• ', '')).join('\n')
        : lines.map(line => line.trim().startsWith('• ') ? line : `• ${line}`).join('\n');

      selectedObject.set('text', newText);
      fabricCanvas.current.renderAll();
      saveHistory();
      forceUpdate();
    }
  };

  const setLineHeight = (height: number) => {
    if (!fabricCanvas.current || !selectedObject) return;
    if (selectedObject instanceof fabric.IText) {
      selectedObject.set('lineHeight', height);
      fabricCanvas.current.renderAll();
      saveHistory();
      forceUpdate();
    }
  };

  const setTextIndent = (indent: number) => {
    if (!fabricCanvas.current || !selectedObject) return;
    if (selectedObject instanceof fabric.IText) {
      selectedObject.set('charSpacing', indent);
      fabricCanvas.current.renderAll();
      saveHistory();
      forceUpdate();
    }
  };

  // --- FIM DAS FUNÇÕES DE TEXTO ---

  const attachImageToFrame = useCallback((img: fabric.FabricImage, frame: fabric.FabricObject) => {
    if (!fabricCanvas.current) return;

    const frameType = (frame as any).frameType;
    const isLocked = (frame as any).locked;
    const zIndex = fabricCanvas.current.getObjects().indexOf(frame);

    const frameWidth = frame.width! * (frame.scaleX || 1);
    const frameHeight = frame.height! * (frame.scaleY || 1);

    const scaleX = frameWidth / img.width!;
    const scaleY = frameHeight / img.height!;
    const scale = Math.max(scaleX, scaleY);

    img.set({ 
      originX: 'center', originY: 'center', 
      left: frame.left, top: frame.top, 
      scaleX: scale, scaleY: scale, angle: frame.angle 
    });

    const unscaledFrameWidth = frameWidth / scale;
    const unscaledFrameHeight = frameHeight / scale;

    let clipPath;
    if (frameType === 'circle') {
       clipPath = new fabric.Circle({ radius: unscaledFrameWidth / 2, originX: 'center', originY: 'center' });
    } else {
       const radii = (frame as any).customRadii || { tl: 16, tr: 16, br: 16, bl: 16 };
       const pathStr = createRoundedRectPathString(
         unscaledFrameWidth, 
         unscaledFrameHeight, 
         radii.tl / scale, radii.tr / scale, radii.br / scale, radii.bl / scale
       );
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

    img.toObject = (function(toObject) {
      return function(this: any, propertiesToInclude?: string[]) {
        return Object.assign(toObject.call(this, propertiesToInclude), {
          isFrame: this.isFrame,
          frameType: this.frameType,
          variableId: this.variableId,
          customRadii: this.customRadii,
          locked: this.locked,
          isCropped: this.isCropped,
          _origFrameW: this._origFrameW,
          _origFrameH: this._origFrameH,
          _origFrameScaleX: this._origFrameScaleX,
          _origFrameScaleY: this._origFrameScaleY
        });
      };
    })(img.toObject);

    fabricCanvas.current.remove(frame);
    if (!fabricCanvas.current.getObjects().includes(img)) {
        fabricCanvas.current.add(img);
    }
    
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

        const dx = absX - img.left!;
        const dy = absY - img.top!;

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
      img.set({ 
        hasControls: !isLocked, 
        lockMovementX: isLocked, 
        lockMovementY: isLocked, 
        lockRotation: isLocked, 
        lockScalingX: isLocked, 
        lockScalingY: isLocked, 
        opacity: 1 
      });

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

    if (fabricCanvas.current) {
       fabricCanvas.current.renderAll();
    }
  }, [saveHistory]);

  useEffect(() => {
    if (canvasRef.current && !fabricCanvas.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 1080,
        height: 1080,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
        stopContextMenu: true, 
        fireRightClick: true,  
      });

      if (canvas.wrapperEl) {
        canvas.wrapperEl.style.overflow = 'hidden';
      }

      fabricCanvas.current = canvas;

      canvas.on('object:modified', saveHistory);
      canvas.on('object:added', saveHistory);
      canvas.on('object:removed', saveHistory);

      canvas.on('text:editing:entered', (e) => {
        const target = e.target as any;
        if (target && target.hiddenTextarea) {
          const textarea = target.hiddenTextarea;
          textarea.style.minHeight = '0px';
          textarea.style.minWidth = '0px';
          textarea.style.padding = '0px';
          textarea.style.margin = '0px';
          textarea.style.resize = 'none';
          textarea.style.boxSizing = 'content-box';
          textarea.style.overflow = 'hidden';
        }
      });

      const handleSelection = () => {
        const active = canvas.getActiveObject();
        setSelectedObject(active || null);
        
        if (isPanModeRef.current && active !== panningImgRef.current) {
          stopPanMode(); 
        }
        
        forceUpdate(); 
      };

      canvas.on('selection:created', handleSelection);
      canvas.on('selection:updated', handleSelection);
      canvas.on('selection:cleared', () => {
        setSelectedObject(null);
        setContextMenuInfo({ visible: false, x: 0, y: 0 });
        
        if (isPanModeRef.current) {
          stopPanMode();
        }
        
        forceUpdate();
      });

      canvas.on('contextmenu', (options) => {
        const e = options.e;
        e.preventDefault();
        e.stopPropagation();

        const target = options.target;
        const clientX = e.clientX;
        const clientY = e.clientY;

        const isSelectableObject = target && target.type && typeof (target as any).onSelect === 'function';

        if (isSelectableObject) {
          setTimeout(() => {
            if (canvas.getActiveObject() !== target) {
              canvas.setActiveObject(target);
              canvas.renderAll();
            }
            setContextMenuInfo({ 
              visible: true, 
              x: clientX, 
              y: clientY 
            });
            forceUpdate();
          }, 0);
        } else {
          canvas.discardActiveObject();
          canvas.renderAll();
          setContextMenuInfo({ visible: false, x: 0, y: 0 });
          forceUpdate();
        }
      });

      canvas.on('mouse:down', (opt) => {
        const e = opt.e as MouseEvent;
        if (e.button !== 2) {
          setContextMenuInfo({ visible: false, x: 0, y: 0 });
        }
      });

      canvas.on('object:modified', (e) => {
        handleSelection();
        const obj = e.target;
        if (obj && obj.type === 'image' && !(obj as any).isFrame && !cropBoxRef.current && !isPanModeRef.current) {
          const imgCenter = obj.getCenterPoint();
          const frames = canvas.getObjects().filter(o => (o as any).isFrame && o.type !== 'image');
          for (const frame of frames) {
            if (frame.containsPoint(imgCenter)) {
               attachImageToFrame(obj as fabric.FabricImage, frame);
               toast.success('Imagem anexada à moldura!');
               break; 
            }
          }
        }
      });

      saveHistory();
    }

    return () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.dispose();
        fabricCanvas.current = null;
      }
    };
  }, [forceUpdate, attachImageToFrame, stopPanMode, saveHistory]);

  const addText = (content = 'Novo Texto') => {
    if (!fabricCanvas.current) return;
    const text = new fabric.IText(content, { 
      left: 100, 
      top: 100, 
      fontFamily: 'Arial', 
      fontSize: 24, 
      fill: '#000000',
      lineHeight: 1.16,
      originX: 'center',
      originY: 'center'
    });
    (text as any).variableId = null;
    (text as any).locked = false;
    
    text.toObject = (function(toObject) {
      return function(this: any, propertiesToInclude?: string[]) {
        return Object.assign(toObject.call(this, propertiesToInclude), {
          isFrame: this.isFrame,
          frameType: this.frameType,
          variableId: this.variableId,
          customRadii: this.customRadii,
          locked: this.locked,
          isCropped: this.isCropped
        });
      };
    })(text.toObject);

    fabricCanvas.current.add(text);
    fabricCanvas.current.setActiveObject(text);
    fabricCanvas.current.renderAll();
  };

  const addShape = (type: 'rect' | 'circle' | 'triangle' | 'line') => {
    if (!fabricCanvas.current) return;

    let shapeObj: fabric.FabricObject;
    const baseOptions = { fill: '#94a3b8', originX: 'center', originY: 'center' };

    if (type === 'rect') {
      shapeObj = new fabric.Rect({ ...baseOptions, width: 100, height: 100 });
      (shapeObj as any).customRadii = { tl: 0, tr: 0, br: 0, bl: 0 };
    } else if (type === 'circle') {
      shapeObj = new fabric.Circle({ ...baseOptions, radius: 50 });
    } else if (type === 'triangle') {
      shapeObj = new fabric.Triangle({ ...baseOptions, width: 100, height: 100 });
    } else if (type === 'line') {
      shapeObj = new fabric.Line([-75, 0, 75, 0], { stroke: '#94a3b8', strokeWidth: 5, originX: 'center', originY: 'center' });
    } else { return; }

    (shapeObj as any).variableId = null;
    (shapeObj as any).isFrame = false;
    (shapeObj as any).locked = false;

    shapeObj.toObject = (function(toObject) {
      return function(this: any, propertiesToInclude?: string[]) {
        return Object.assign(toObject.call(this, propertiesToInclude), {
          isFrame: this.isFrame,
          frameType: this.frameType,
          variableId: this.variableId,
          customRadii: this.customRadii,
          locked: this.locked,
          isCropped: this.isCropped
        });
      };
    })(shapeObj.toObject);

    fabricCanvas.current.add(shapeObj);
    fabricCanvas.current.centerObject(shapeObj);
    fabricCanvas.current.setActiveObject(shapeObj);
    fabricCanvas.current.renderAll();
    forceUpdate();
  };

  const addFrame = (type: 'circle' | 'rect') => {
    if (!fabricCanvas.current) return;

    let frameObj: fabric.FabricObject;

    if (type === 'circle') {
      frameObj = new fabric.Circle({ radius: 100, fill: '#f1f5f9', stroke: '#cbd5e1', strokeWidth: 2, strokeDashArray: [8, 8], originX: 'center', originY: 'center' });
    } else {
      frameObj = new fabric.Rect({ width: 200, height: 200, fill: '#f1f5f9', stroke: '#cbd5e1', strokeWidth: 2, strokeDashArray: [8, 8], originX: 'center', originY: 'center', rx: 16, ry: 16 });
      (frameObj as any).customRadii = { tl: 16, tr: 16, br: 16, bl: 16 };
    }

    (frameObj as any).isFrame = true;
    (frameObj as any).frameType = type;
    (frameObj as any).variableId = null; 
    (frameObj as any).locked = false;

    frameObj.toObject = (function(toObject) {
      return function(this: any, propertiesToInclude?: string[]) {
        return Object.assign(toObject.call(this, propertiesToInclude), {
          isFrame: this.isFrame,
          frameType: this.frameType,
          variableId: this.variableId,
          customRadii: this.customRadii,
          locked: this.locked,
          isCropped: this.isCropped
        });
      };
    })(frameObj.toObject);

    fabricCanvas.current.add(frameObj);
    fabricCanvas.current.centerObject(frameObj);
    fabricCanvas.current.setActiveObject(frameObj);
    fabricCanvas.current.renderAll();
    forceUpdate();
  };

  const addImage = async (url: string) => {
    if (!fabricCanvas.current) return;

    try {
      const img = await fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' });

      if (selectedObject && (selectedObject as any).isFrame && selectedObject.type !== 'image') {
        attachImageToFrame(img, selectedObject);
      } 
      else {
        img.scaleToWidth(200);
        img.set({ originX: 'center', originY: 'center' });
        (img as any).customRadii = { tl: 0, tr: 0, br: 0, bl: 0 };
        (img as any).locked = false;
        
        img.toObject = (function(toObject) {
          return function(this: any, propertiesToInclude?: string[]) {
            return Object.assign(toObject.call(this, propertiesToInclude), {
              isFrame: this.isFrame,
              frameType: this.frameType,
              variableId: this.variableId,
              customRadii: this.customRadii,
              locked: this.locked,
              isCropped: this.isCropped
            });
          };
        })(img.toObject);

        fabricCanvas.current.add(img);
        fabricCanvas.current.centerObject(img);
        fabricCanvas.current.setActiveObject(img);
      }

      fabricCanvas.current.renderAll();
      forceUpdate();
    } catch (error) {
      console.error("Erro ao carregar imagem no Fabric:", error);
    }
  };

  const detachImageFromFrame = () => {
    if (!fabricCanvas.current || !selectedObject) return;
    const img = selectedObject;
    
    if (img.type !== 'image' || !(img as any).isFrame) return;

    const frameType = (img as any).frameType;
    const customRadii = (img as any).customRadii;
    const variableId = (img as any).variableId;
    const isLocked = (img as any).locked;
    const zIndex = fabricCanvas.current.getObjects().indexOf(img);
    
    const clipPath = img.clipPath;
    if (!clipPath) return;

    const frameW = (img as any)._origFrameW || clipPath.width;
    const frameH = (img as any)._origFrameH || clipPath.height;
    const frameScaleX = (img as any)._origFrameScaleX || 1;
    const frameScaleY = (img as any)._origFrameScaleY || 1;
    
    let frameObj: fabric.FabricObject;

    if (frameType === 'circle') {
      frameObj = new fabric.Circle({
        radius: frameW / 2,
        fill: '#f1f5f9', stroke: '#cbd5e1', strokeWidth: 2, strokeDashArray: [8, 8],
        originX: 'center', originY: 'center',
        left: img.left, top: img.top, angle: img.angle,
        scaleX: frameScaleX, scaleY: frameScaleY
      });
    } else {
      frameObj = new fabric.Rect({
        width: frameW, height: frameH,
        fill: '#f1f5f9', stroke: '#cbd5e1', strokeWidth: 2, strokeDashArray: [8, 8],
        originX: 'center', originY: 'center',
        left: img.left, top: img.top, angle: img.angle,
        rx: customRadii?.tl || 16, ry: customRadii?.tl || 16,
        scaleX: frameScaleX, scaleY: frameScaleY
      });
      (frameObj as any).customRadii = customRadii || { tl: 16, tr: 16, br: 16, bl: 16 };
    }

    (frameObj as any).isFrame = true;
    (frameObj as any).frameType = frameType;
    (frameObj as any).variableId = variableId;
    (frameObj as any).locked = isLocked;

    if (isLocked) {
        frameObj.set({ lockMovementX: true, lockMovementY: true, lockRotation: true, lockScalingX: true, lockScalingY: true, hasControls: false });
    }

    frameObj.toObject = (function(toObject) {
      return function(this: any, propertiesToInclude?: string[]) {
        return Object.assign(toObject.call(this, propertiesToInclude), {
          isFrame: this.isFrame,
          frameType: this.frameType,
          variableId: this.variableId,
          customRadii: this.customRadii,
          locked: this.locked,
          isCropped: this.isCropped,
          _origFrameW: this._origFrameW,
          _origFrameH: this._origFrameH,
          _origFrameScaleX: this._origFrameScaleX,
          _origFrameScaleY: this._origFrameScaleY
        });
      };
    })(frameObj.toObject);

    img.set('clipPath', undefined);
    (img as any).isFrame = false;
    (img as any).frameType = undefined;
    (img as any).variableId = null;
    (img as any).customRadii = { tl: 0, tr: 0, br: 0, bl: 0 };
    (img as any).locked = false; 
    img.set({ lockMovementX: false, lockMovementY: false, lockRotation: false, lockScalingX: false, lockScalingY: false, hasControls: true });
    
    img.toObject = (function(toObject) {
      return function(this: any, propertiesToInclude?: string[]) {
        return Object.assign(toObject.call(this, propertiesToInclude), {
          isFrame: this.isFrame,
          frameType: this.frameType,
          variableId: this.variableId,
          customRadii: this.customRadii,
          locked: this.locked,
          isCropped: this.isCropped
        });
      };
    })(img.toObject);
    
    img.set('dirty', true);
    
    fabricCanvas.current.add(frameObj);
    fabricCanvas.current.moveObjectTo(frameObj, zIndex); 
    
    fabricCanvas.current.bringObjectToFront(img);
    fabricCanvas.current.setActiveObject(img);
    
    fabricCanvas.current.renderAll();
    saveHistory();
    forceUpdate();
    
    toast.success('Imagem desanexada da moldura!');
  };

  const togglePanMode = () => {
    if (!fabricCanvas.current || !selectedObject || selectedObject.type !== 'image') return;
    const img = selectedObject as fabric.FabricImage;
    
    if (isPanMode) {
      stopPanMode();
      fabricCanvas.current.discardActiveObject();
      toast.success("Ajuste concluído!");
    } else {
      if (!img.clipPath) {
         toast.info("A imagem precisa estar em uma moldura ou recortada para usar o ajuste.");
         return;
      }
      setIsPanMode(true);
      panningImgRef.current = img;

      const clipPath = img.clipPath;
      if (clipPath) {
         const angleRad = (img.angle || 0) * Math.PI / 180;
         const cosA = Math.cos(angleRad);
         const sinA = Math.sin(angleRad);
         
         const relX = clipPath.left! * (img.scaleX || 1);
         const relY = clipPath.top! * (img.scaleY || 1);
         
         const absX = img.left! + relX * cosA - relY * sinA;
         const absY = img.top! + relX * sinA + relY * cosA;
         
         const fixedScaleX = (clipPath.scaleX || 1) * (img.scaleX || 1);
         const fixedScaleY = (clipPath.scaleY || 1) * (img.scaleY || 1);
         const fixedAngle = img.angle || 0;

         (img as any)._originalClipPath = clipPath;
         (img as any)._fixedClipAbsX = absX;
         (img as any)._fixedClipAbsY = absY;
         (img as any)._fixedClipScaleX = fixedScaleX;
         (img as any)._fixedClipScaleY = fixedScaleY;
         (img as any)._fixedAngle = fixedAngle;

         let overlay: fabric.FabricObject;
         if (clipPath.type === 'circle') {
           overlay = new fabric.Circle({
             radius: (clipPath as fabric.Circle).radius,
             originX: 'center', originY: 'center',
             left: absX, top: absY,
             scaleX: fixedScaleX, scaleY: fixedScaleY,
             angle: fixedAngle,
             fill: 'transparent',
             stroke: '#3b82f6', 
             strokeWidth: 4,
             strokeDashArray: [8, 8],
             selectable: false,
             evented: false,
             excludeFromExport: true
           });
         } else {
           const pathData = (clipPath as fabric.Path).path;
           overlay = new fabric.Path(pathData, {
             originX: 'center', originY: 'center',
             left: absX, top: absY,
             scaleX: fixedScaleX, scaleY: fixedScaleY,
             angle: fixedAngle,
             fill: 'transparent',
             stroke: '#3b82f6', 
             strokeWidth: 4,
             strokeDashArray: [8, 8],
             selectable: false,
             evented: false,
             excludeFromExport: true
           });
         }

         fabricCanvas.current.add(overlay);
         panOverlayRef.current = overlay;
         img.set('clipPath', undefined);
      }

      img.set({ 
        hasControls: true, 
        lockMovementX: false, 
        lockMovementY: false, 
        lockScalingX: false,
        lockScalingY: false,
        opacity: 0.5 
      });
      img.set('dirty', true);
      toast.info("Ajuste a imagem e clique em 'Concluir Ajustes' para aplicar.");
    }
    fabricCanvas.current.renderAll();
    forceUpdate();
  };

  const startCrop = () => {
    if (!fabricCanvas.current || !selectedObject || selectedObject.type !== 'image') return;
    const img = selectedObject as fabric.FabricImage;

    if ((img as any).isFrame || (img as any).isCropped) {
       toast.info("A imagem já possui recorte ou moldura. Use a ferramenta 'Ajustar Foto'.");
       return;
    }

    const rect = new fabric.Rect({
       left: img.left,
       top: img.top,
       width: img.getScaledWidth(),
       height: img.getScaledHeight(),
       originX: 'center',
       originY: 'center',
       fill: 'rgba(0,0,0,0.5)',
       stroke: '#3b82f6',
       strokeWidth: 2,
       strokeDashArray: [5, 5],
       cornerColor: '#3b82f6',
       transparentCorners: false,
       hasRotatingPoint: false
    });

    (rect as any).targetImg = img;
    img.set({ selectable: false, evented: false });
    
    fabricCanvas.current.add(rect);
    fabricCanvas.current.setActiveObject(rect);
    setCropBox(rect);
    fabricCanvas.current.renderAll();
    forceUpdate();
    toast.info("Ajuste a caixa de corte e clique em 'Aplicar Recorte'.");
  };

  const applyCrop = () => {
    if (!fabricCanvas.current || !cropBox) return;
    const img = (cropBox as any).targetImg as fabric.FabricImage;

    const diffX = cropBox.left! - img.left!;
    const diffY = cropBox.top! - img.top!;
    const angleDiff = (cropBox.angle || 0) - (img.angle || 0);

    const angleRad = -(img.angle || 0) * Math.PI / 180;
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);
    
    const localX = diffX * cosA - diffY * sinA;
    const localY = diffX * sinA + diffY * cosA;

    const clipPath = new fabric.Rect({
       width: cropBox.getScaledWidth() / (img.scaleX || 1),
       height: cropBox.getScaledHeight() / (img.scaleY || 1),
       originX: 'center',
       originY: 'center',
       left: localX / (img.scaleX || 1),
       top: localY / (img.scaleY || 1),
       angle: angleDiff
    });

    img.set('clipPath', clipPath);
    (img as any).isCropped = true;
    
    img.set({ selectable: true, evented: true, dirty: true });
    
    img.toObject = (function(toObject) {
       return function(this: any, propertiesToInclude?: string[]) {
         return Object.assign(toObject.call(this, propertiesToInclude), {
           isFrame: this.isFrame,
           frameType: this.frameType,
           variableId: this.variableId,
           customRadii: this.customRadii,
           locked: this.locked,
           isCropped: this.isCropped
         });
       };
    })(img.toObject);

    fabricCanvas.current.remove(cropBox);
    setCropBox(null);
    fabricCanvas.current.setActiveObject(img);
    fabricCanvas.current.renderAll();
    saveHistory();
    forceUpdate();
    toast.success("Recorte aplicado!");
  };

  const cancelCrop = () => {
    if (!fabricCanvas.current || !cropBox) return;
    const img = (cropBox as any).targetImg as fabric.FabricImage;
    img.set({ selectable: true, evented: true });
    fabricCanvas.current.remove(cropBox);
    setCropBox(null);
    fabricCanvas.current.setActiveObject(img);
    fabricCanvas.current.renderAll();
    forceUpdate();
  };

  const removeCrop = () => {
    if (!fabricCanvas.current || !selectedObject || selectedObject.type !== 'image') return;
    const img = selectedObject;
    if (!(img as any).isCropped) return;
    
    img.set('clipPath', undefined);
    (img as any).isCropped = false;
    img.set('dirty', true);
    
    fabricCanvas.current.renderAll();
    saveHistory();
    forceUpdate();
    toast.success("Recorte removido.");
  };

  const exportToImage = () => {
    return fabricCanvas.current?.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
  };

  const saveToJson = () => {
    if (!fabricCanvas.current) return null;
    return JSON.stringify(fabricCanvas.current.toJSON(['variableId', 'isFrame', 'frameType', 'customRadii', 'locked', 'isCropped', '_origFrameW', '_origFrameH', '_origFrameScaleX', '_origFrameScaleY']));
  };

  const loadFromJson = async (json: any) => {
    if (!fabricCanvas.current) return;
    try {
      const parsedJson = typeof json === 'string' ? JSON.parse(json) : json;
      
      await fabricCanvas.current.loadFromJSON(parsedJson);
      
      const objects = fabricCanvas.current.getObjects();
      
      if (parsedJson.objects && Array.isArray(parsedJson.objects)) {
        parsedJson.objects.forEach((objData: any, index: number) => {
          const canvasObj = objects[index];
          if (canvasObj) {
            if (objData.isFrame !== undefined) (canvasObj as any).isFrame = objData.isFrame;
            if (objData.frameType !== undefined) (canvasObj as any).frameType = objData.frameType;
            if (objData.variableId !== undefined) (canvasObj as any).variableId = objData.variableId;
            if (objData.customRadii !== undefined) (canvasObj as any).customRadii = objData.customRadii;
            if (objData.isCropped !== undefined) (canvasObj as any).isCropped = objData.isCropped;
            
            if (objData._origFrameW !== undefined) (canvasObj as any)._origFrameW = objData._origFrameW;
            if (objData._origFrameH !== undefined) (canvasObj as any)._origFrameH = objData._origFrameH;
            if (objData._origFrameScaleX !== undefined) (canvasObj as any)._origFrameScaleX = objData._origFrameScaleX;
            if (objData._origFrameScaleY !== undefined) (canvasObj as any)._origFrameScaleY = objData._origFrameScaleY;

            if (objData.locked !== undefined) {
              (canvasObj as any).locked = objData.locked;
              if (objData.locked) {
                canvasObj.set({ lockMovementX: true, lockMovementY: true, lockRotation: true, lockScalingX: true, lockScalingY: true, hasControls: false });
              }
            }
            
            canvasObj.toObject = (function(toObject) {
              return function(this: any, propertiesToInclude?: string[]) {
                return Object.assign(toObject.call(this, propertiesToInclude), {
                  isFrame: this.isFrame,
                  frameType: this.frameType,
                  variableId: this.variableId,
                  customRadii: this.customRadii,
                  locked: this.locked,
                  isCropped: this.isCropped,
                  _origFrameW: this._origFrameW,
                  _origFrameH: this._origFrameH,
                  _origFrameScaleX: this._origFrameScaleX,
                  _origFrameScaleY: this._origFrameScaleY
                });
              };
            })(canvasObj.toObject);

            canvasObj.set('dirty', true);
          }
        });
      }

      fabricCanvas.current.getObjects().forEach(obj => obj.setCoords());
      fabricCanvas.current.renderAll();
      undoStack.current = [JSON.stringify(fabricCanvas.current.toJSON())];
      redoStack.current = [];
      forceUpdate();
    } catch (error) {
      console.error("Erro ao carregar projeto:", error);
    }
  };

  const clearCanvas = () => {
    if (!fabricCanvas.current) return;
    fabricCanvas.current.clear();
    fabricCanvas.current.backgroundColor = '#ffffff';
    fabricCanvas.current.renderAll();
    setSelectedObject(null);
    saveHistory();
    forceUpdate();
  };

  const deleteSelected = () => {
    if (!selectedObject || !fabricCanvas.current) return;
    fabricCanvas.current.remove(selectedObject);
    fabricCanvas.current.discardActiveObject();
    fabricCanvas.current.renderAll();
  };

  const setCornerRadii = (tl: number, tr: number, br: number, bl: number) => {
    if (!fabricCanvas.current || !selectedObject) return;
    
    const obj = selectedObject;
    const scaleX = obj.scaleX || 1;

    const utl = tl / scaleX;
    const utr = tr / scaleX;
    const ubr = br / scaleX;
    const ubl = bl / scaleX;

    (obj as any).customRadii = { tl, tr, br, bl };

    if (obj.type === 'image' || obj.type === 'rect') {
      if (obj.type === 'rect') {
         (obj as fabric.Rect).set({ rx: 0, ry: 0 });
      }
      
      let targetWidth = obj.width!;
      let targetHeight = obj.height!;
      if (obj.type === 'image' && obj.clipPath && (obj as any).frameType === 'rect') {
         targetWidth = obj.clipPath.width!;
         targetHeight = obj.clipPath.height!;
      }
      
      if (utl <= 0 && utr <= 0 && ubr <= 0 && ubl <= 0) {
         obj.set('clipPath', undefined);
      } else {
         const pathStr = createRoundedRectPathString(targetWidth, targetHeight, utl, utr, ubr, ubl);
         const clipPath = new fabric.Path(pathStr, { originX: 'center', originY: 'center', left: 0, top: 0 });
         obj.set('clipPath', clipPath);
      }
      obj.set('dirty', true);
      saveHistory();
    } 

    fabricCanvas.current.renderAll();
    forceUpdate();
  };

  const toggleFlipX = () => {
    if (!fabricCanvas.current || !selectedObject) return;
    selectedObject.set('flipX', !selectedObject.flipX);
    fabricCanvas.current.renderAll();
    saveHistory();
    forceUpdate();
  };

  const toggleFlipY = () => {
    if (!fabricCanvas.current || !selectedObject) return;
    selectedObject.set('flipY', !selectedObject.flipY);
    fabricCanvas.current.renderAll();
    saveHistory();
    forceUpdate();
  };

  const setImageOpacity = (opacity: number) => {
    if (!fabricCanvas.current || !selectedObject) return;
    selectedObject.set('opacity', opacity);
    fabricCanvas.current.renderAll();
    saveHistory();
    forceUpdate();
  };

  const centerObject = () => {
    if (!fabricCanvas.current || !selectedObject) return;
    fabricCanvas.current.centerObject(selectedObject);
    selectedObject.setCoords(); 
    fabricCanvas.current.renderAll();
    saveHistory();
    forceUpdate();
  };

  const bringToFront = () => {
    if (!fabricCanvas.current || !selectedObject) return;
    fabricCanvas.current.bringObjectToFront(selectedObject);
    fabricCanvas.current.renderAll();
    saveHistory();
    forceUpdate();
  };

  const sendToBack = () => {
    if (!fabricCanvas.current || !selectedObject) return;
    fabricCanvas.current.sendObjectToBack(selectedObject);
    fabricCanvas.current.renderAll();
    saveHistory();
    forceUpdate();
  };

  const toggleLock = () => {
    if (!fabricCanvas.current || !selectedObject) return;
    
    const isLocked = !(selectedObject as any).locked;
    (selectedObject as any).locked = isLocked;

    selectedObject.set({
      lockMovementX: isLocked,
      lockMovementY: isLocked,
      lockRotation: isLocked,
      lockScalingX: isLocked,
      lockScalingY: isLocked,
      hasControls: !isLocked 
    });

    fabricCanvas.current.renderAll();
    saveHistory();
    forceUpdate();
  };

  return { 
    canvasRef, addText, addImage, addShape, addFrame, detachImageFromFrame, exportToImage, saveToJson, loadFromJson, clearCanvas, deleteSelected,
    setCornerRadii, toggleFlipX, toggleFlipY, setImageOpacity, centerObject, bringToFront, sendToBack, toggleLock, selectedObject, fabricCanvas, contextMenuInfo, setContextMenuInfo,
    isPanMode, togglePanMode, cropBox, startCrop, applyCrop, cancelCrop, removeCrop,
    changeTextColor, toggleBold, toggleItalic, toggleUnderline, toggleLinethrough, setFontSize, setTextAlignment, toggleList, setLineHeight, setTextIndent, applyGradient,
    undo, redo, canUndo: undoStack.current.length > 1, canRedo: redoStack.current.length > 0
  };
};