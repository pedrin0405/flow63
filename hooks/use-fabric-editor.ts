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

  const [, setUpdateTrigger] = useState(0);

  const forceUpdate = useCallback(() => {
    setUpdateTrigger((prev) => prev + 1);
  }, []);

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
          locked: this.locked
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
    forceUpdate();
  }, [forceUpdate]);

  useEffect(() => {
    if (canvasRef.current && !fabricCanvas.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 1080,
        height: 1080,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
        stopContextMenu: true, // Bloqueia o menu padrão do botão direito no canvas
        fireRightClick: true,  // Habilita a detecção interna do botão direito no Fabric
      });

      fabricCanvas.current = canvas;

      const handleSelection = () => {
        const active = canvas.getActiveObject();
        setSelectedObject(active || null);
        forceUpdate(); 
      };

      canvas.on('selection:created', handleSelection);
      canvas.on('selection:updated', handleSelection);
      canvas.on('selection:cleared', () => {
        setSelectedObject(null);
        setContextMenuInfo({ visible: false, x: 0, y: 0 });
        forceUpdate();
      });

      // EVENTO NATIVO DO FABRIC PARA CLIQUE DIREITO (Fim do bug do 't.onSelect')
      canvas.on('contextmenu', (options) => {
        const e = options.e;
        e.preventDefault();
        e.stopPropagation();

        const target = options.target;

        if (target) {
          // O setTimeout tira a ação do fluxo atual do evento, permitindo 
          // que o Fabric conclua seus processos internos antes de acionarmos o menu
          setTimeout(() => {
            canvas.setActiveObject(target);
            canvas.renderAll();
            setContextMenuInfo({ 
              visible: true, 
              x: e.clientX, 
              y: e.clientY 
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

      // Fecha o menu ao clicar com o botão esquerdo
      canvas.on('mouse:down', (opt) => {
        if (opt.e.button !== 2) {
          setContextMenuInfo({ visible: false, x: 0, y: 0 });
        }
      });
      
      canvas.on('object:moving', () => setContextMenuInfo({ visible: false, x: 0, y: 0 }));

      // Lógica de arrastar e soltar (Drop na moldura)
      canvas.on('object:modified', (e) => {
        handleSelection();
        const obj = e.target;
        if (obj && obj.type === 'image' && !(obj as any).isFrame) {
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
    }

    return () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.dispose();
        fabricCanvas.current = null;
      }
    };
  }, [forceUpdate, attachImageToFrame]);

  const addText = (content = 'Novo Texto') => {
    if (!fabricCanvas.current) return;
    const text = new fabric.IText(content, { left: 100, top: 100, fontFamily: 'Arial', fontSize: 24, fill: '#000000' });
    (text as any).variableId = null;
    (text as any).locked = false;
    
    text.toObject = (function(toObject) {
      return function(this: any, propertiesToInclude?: string[]) {
        return Object.assign(toObject.call(this, propertiesToInclude), {
          isFrame: this.isFrame,
          frameType: this.frameType,
          variableId: this.variableId,
          customRadii: this.customRadii,
          locked: this.locked
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
          locked: this.locked
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
          locked: this.locked
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
        (img as any).customRadii = { tl: 0, tr: 0, br: 0, bl: 0 };
        (img as any).locked = false;
        
        img.toObject = (function(toObject) {
          return function(this: any, propertiesToInclude?: string[]) {
            return Object.assign(toObject.call(this, propertiesToInclude), {
              isFrame: this.isFrame,
              frameType: this.frameType,
              variableId: this.variableId,
              customRadii: this.customRadii,
              locked: this.locked
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

    let frameWidth = 0;
    let frameHeight = 0;

    if (frameType === 'circle') {
      const radius = (clipPath as fabric.Circle).radius || 0;
      frameWidth = radius * 2 * img.scaleX!;
      frameHeight = radius * 2 * img.scaleY!;
    } else {
      frameWidth = clipPath.width! * img.scaleX!;
      frameHeight = clipPath.height! * img.scaleY!;
    }
    
    let frameObj: fabric.FabricObject;

    if (frameType === 'circle') {
      frameObj = new fabric.Circle({
        radius: frameWidth / 2,
        fill: '#f1f5f9', stroke: '#cbd5e1', strokeWidth: 2, strokeDashArray: [8, 8],
        originX: 'center', originY: 'center',
        left: img.left, top: img.top, angle: img.angle
      });
    } else {
      frameObj = new fabric.Rect({
        width: frameWidth, height: frameHeight,
        fill: '#f1f5f9', stroke: '#cbd5e1', strokeWidth: 2, strokeDashArray: [8, 8],
        originX: 'center', originY: 'center',
        left: img.left, top: img.top, angle: img.angle,
        rx: customRadii?.tl || 16, ry: customRadii?.tl || 16
      });
      (frameObj as any).customRadii = customRadii || { tl: 16, tr: 16, br: 16, bl: 16 };
    }

    (frameObj as any).isFrame = true;
    (frameObj as any).frameType = frameType;
    (frameObj as any).variableId = variableId;
    (frameObj as any).locked = isLocked;

    frameObj.toObject = (function(toObject) {
      return function(this: any, propertiesToInclude?: string[]) {
        return Object.assign(toObject.call(this, propertiesToInclude), {
          isFrame: this.isFrame,
          frameType: this.frameType,
          variableId: this.variableId,
          customRadii: this.customRadii,
          locked: this.locked
        });
      };
    })(frameObj.toObject);

    img.set('clipPath', undefined);
    (img as any).isFrame = false;
    (img as any).frameType = undefined;
    (img as any).variableId = null;
    (img as any).customRadii = { tl: 0, tr: 0, br: 0, bl: 0 };
    
    img.toObject = (function(toObject) {
      return function(this: any, propertiesToInclude?: string[]) {
        return Object.assign(toObject.call(this, propertiesToInclude), {
          isFrame: this.isFrame,
          frameType: this.frameType,
          variableId: this.variableId,
          customRadii: this.customRadii,
          locked: this.locked
        });
      };
    })(img.toObject);
    
    img.set('dirty', true);
    
    fabricCanvas.current.add(frameObj);
    fabricCanvas.current.moveObjectTo(frameObj, zIndex); 
    
    fabricCanvas.current.bringObjectToFront(img);
    fabricCanvas.current.setActiveObject(img);
    
    fabricCanvas.current.renderAll();
    forceUpdate();
    
    toast.success('Imagem desanexada da moldura!');
  };

  const exportToImage = () => {
    return fabricCanvas.current?.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
  };

  const saveToJson = () => {
    if (!fabricCanvas.current) return null;
    return JSON.stringify(fabricCanvas.current.toJSON(['variableId', 'isFrame', 'frameType', 'customRadii', 'locked']));
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
                  locked: this.locked 
                });
              };
            })(canvasObj.toObject);

            canvasObj.set('dirty', true);
          }
        });
      }

      fabricCanvas.current.renderAll();
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
    } 

    fabricCanvas.current.renderAll();
    forceUpdate();
  };

  const toggleFlipX = () => {
    if (!fabricCanvas.current || !selectedObject) return;
    selectedObject.set('flipX', !selectedObject.flipX);
    fabricCanvas.current.renderAll();
    forceUpdate();
  };

  const toggleFlipY = () => {
    if (!fabricCanvas.current || !selectedObject) return;
    selectedObject.set('flipY', !selectedObject.flipY);
    fabricCanvas.current.renderAll();
    forceUpdate();
  };

  const setImageOpacity = (opacity: number) => {
    if (!fabricCanvas.current || !selectedObject) return;
    selectedObject.set('opacity', opacity);
    fabricCanvas.current.renderAll();
    forceUpdate();
  };

  const centerObject = () => {
    if (!fabricCanvas.current || !selectedObject) return;
    fabricCanvas.current.centerObject(selectedObject);
    selectedObject.setCoords(); 
    fabricCanvas.current.renderAll();
    forceUpdate();
  };

  const bringToFront = () => {
    if (!fabricCanvas.current || !selectedObject) return;
    fabricCanvas.current.bringObjectToFront(selectedObject);
    fabricCanvas.current.renderAll();
    forceUpdate();
  };

  const sendToBack = () => {
    if (!fabricCanvas.current || !selectedObject) return;
    fabricCanvas.current.sendObjectToBack(selectedObject);
    fabricCanvas.current.renderAll();
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
    forceUpdate();
  };

  return { 
    canvasRef, addText, addImage, addShape, addFrame, detachImageFromFrame, exportToImage, saveToJson, loadFromJson, clearCanvas, deleteSelected,
    setCornerRadii, toggleFlipX, toggleFlipY, setImageOpacity, centerObject, bringToFront, sendToBack, toggleLock, selectedObject, fabricCanvas, contextMenuInfo, setContextMenuInfo 
  };
};