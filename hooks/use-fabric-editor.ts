import { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric'; 
import { v4 as uuidv4 } from 'uuid';

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
  
  const [, setUpdateTrigger] = useState(0);

  const forceUpdate = useCallback(() => {
    setUpdateTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (canvasRef.current && !fabricCanvas.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true, 
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
        forceUpdate();
      });
      
      canvas.on('object:modified', handleSelection);
    }

    return () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.dispose();
        fabricCanvas.current = null;
      }
    };
  }, [forceUpdate]);

  const addText = (content = 'Novo Texto') => {
    if (!fabricCanvas.current) return;
    const text = new fabric.IText(content, { left: 100, top: 100, fontFamily: 'Arial', fontSize: 24, fill: '#000000' });
    (text as any).variableId = null;
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

    // CORREÇÃO APLICADA: Substituído 'fabric.util.object.extend' por 'Object.assign'
    frameObj.toObject = (function(toObject) {
      return function(this: any, propertiesToInclude?: string[]) {
        return Object.assign(toObject.call(this, propertiesToInclude), {
          isFrame: this.isFrame,
          frameType: this.frameType,
          variableId: this.variableId,
          customRadii: this.customRadii
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

      if (selectedObject && (selectedObject as any).isFrame) {
        const frame = selectedObject;
        const frameType = (frame as any).frameType;

        const frameWidth = frame.width! * (frame.scaleX || 1);
        const frameHeight = frame.height! * (frame.scaleY || 1);

        const scaleX = frameWidth / img.width!;
        const scaleY = frameHeight / img.height!;
        const scale = Math.max(scaleX, scaleY);

        img.set({ originX: 'center', originY: 'center', left: frame.left, top: frame.top, scaleX: scale, scaleY: scale, angle: frame.angle });

        let clipPath;
        if (frameType === 'circle') {
           clipPath = new fabric.Circle({ radius: (frameWidth / 2) / scale, originX: 'center', originY: 'center' });
        } else {
           const radii = (frame as any).customRadii || { tl: 16, tr: 16, br: 16, bl: 16 };
           const pathStr = createRoundedRectPathString(img.width!, img.height!, radii.tl / scale, radii.tr / scale, radii.br / scale, radii.bl / scale);
           clipPath = new fabric.Path(pathStr, { originX: 'center', originY: 'center', left: 0, top: 0 });
           (img as any).customRadii = { ...radii };
        }

        img.set('clipPath', clipPath);
        (img as any).isFrame = true;
        (img as any).frameType = frameType;
        (img as any).variableId = (frame as any).variableId;

        // CORREÇÃO APLICADA AQUI TAMBÉM
        img.toObject = (function(toObject) {
          return function(this: any, propertiesToInclude?: string[]) {
            return Object.assign(toObject.call(this, propertiesToInclude), {
              isFrame: this.isFrame,
              frameType: this.frameType,
              variableId: this.variableId,
              customRadii: this.customRadii
            });
          };
        })(img.toObject);

        fabricCanvas.current.add(img);
        fabricCanvas.current.remove(frame);
        fabricCanvas.current.setActiveObject(img);

      } else {
        img.scaleToWidth(200);
        (img as any).customRadii = { tl: 0, tr: 0, br: 0, bl: 0 };
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

  const exportToImage = () => {
    return fabricCanvas.current?.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
  };

  const saveToJson = () => {
    if (!fabricCanvas.current) return null;
    return JSON.stringify(fabricCanvas.current.toJSON(['variableId', 'isFrame', 'frameType', 'customRadii']));
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
            
            // CORREÇÃO APLICADA AQUI TAMBÉM
            if (objData.isFrame) {
              canvasObj.toObject = (function(toObject) {
                return function(this: any, propertiesToInclude?: string[]) {
                  return Object.assign(toObject.call(this, propertiesToInclude), {
                    isFrame: this.isFrame,
                    frameType: this.frameType,
                    variableId: this.variableId,
                    customRadii: this.customRadii
                  });
                };
              })(canvasObj.toObject);
            }

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
      
      if (utl <= 0 && utr <= 0 && ubr <= 0 && ubl <= 0) {
         obj.set('clipPath', undefined);
      } else {
         const pathStr = createRoundedRectPathString(obj.width!, obj.height!, utl, utr, ubr, ubl);
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

  return { 
    canvasRef, addText, addImage, addShape, addFrame, exportToImage, saveToJson, loadFromJson, clearCanvas, deleteSelected,
    setCornerRadii, toggleFlipX, toggleFlipY, setImageOpacity, centerObject, bringToFront, sendToBack, selectedObject, fabricCanvas 
  };
};