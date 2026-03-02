'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Wand2, Loader2, Home, UserCircle, Type, 
  Image as ImageIcon, MapPin, DollarSign, BedDouble, Briefcase, Pin, PinOff, Search,
  Bath, Maximize, AlignLeft
} from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel
} from '@/components/ui/select';

interface MagicFillProps {
  selectedObject: any;
  onUpdate: (key: string, value: any) => void;
  onInjectImage: (url: string) => void; 
}

type DataSource = 'corretores_pmw' | 'corretores_aux' | 'imovel_pmw' | 'imovel_aux' | '';

type PinnedItem = {
  id: string;
  sourceTable: DataSource;
  data: any;
};

export function MagicFill({ selectedObject, onUpdate, onInjectImage }: MagicFillProps) {
  const [loading, setLoading] = useState(false);
  const [sourceTable, setSourceTable] = useState<DataSource>('');
  const [items, setItems] = useState<any[]>([]);
  const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>([]);
  const [selectedValue, setSelectedValue] = useState<string>('');

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  // Estados para a Galeria
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [propertyImages, setPropertyImages] = useState<string[]>([]);
  const [activeItemForImages, setActiveItemForImages] = useState<{ source: DataSource, data: any } | null>(null);

  // 1. DEBOUNCE DA BUSCA
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 2. CARREGAMENTO INICIAL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPinned = sessionStorage.getItem('magicFill_pinnedItems');
      if (savedPinned) {
        try { setPinnedItems(JSON.parse(savedPinned)); } catch (e) {}
      }
      
      const savedSource = sessionStorage.getItem('magicFill_sourceTable') as DataSource;
      if (savedSource) setSourceTable(savedSource);
    }
  }, []);

  // 3. BUSCA DE DADOS
  useEffect(() => {
    async function fetchTableData() {
      if (!sourceTable) {
        setItems([]);
        return;
      }

      setLoading(true);
      try {
        let query = supabase.from(sourceTable).select('*');

        if (debouncedTerm.trim()) {
          if (sourceTable.includes('corretores')) {
            query = query.ilike('nome', `%${debouncedTerm.trim()}%`);
          } else if (sourceTable.includes('imovel')) {
            const codigoNum = parseInt(debouncedTerm.trim());
            if (!isNaN(codigoNum)) {
              query = query.eq('codigo', codigoNum);
            } else {
              setItems([]);
              setLoading(false);
              return;
            }
          }
        }

        const { data, error } = await query.limit(30);

        if (error) throw error;
        setItems(data || []);
      } catch (err) {
        console.error("Erro ao buscar dados do Magic Fill:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTableData();
  }, [sourceTable, debouncedTerm]);

  // 4. TROCA DE ABA DE ORIGEM
  const handleSourceChange = (val: DataSource) => {
    setSourceTable(val);
    setSelectedValue('');
    setSearchTerm('');
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('magicFill_sourceTable', val);
    }
  };

  // 5. ADICIONAR NOVO ITEM À PILHA
  const handleSelectItem = (val: string) => {
    setSelectedValue(val);
    const itemData = items.find(i => (i.id?.toString() === val) || (i.codigo?.toString() === val));
    
    if (itemData) {
      const newItem: PinnedItem = {
        id: `${sourceTable}_${val}`,
        sourceTable: sourceTable,
        data: itemData
      };

      if (!pinnedItems.some(p => p.id === newItem.id)) {
        const updatedList = [newItem, ...pinnedItems];
        setPinnedItems(updatedList);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('magicFill_pinnedItems', JSON.stringify(updatedList));
        }
      }
      
      setSearchTerm('');
      setSelectedValue('');
    }
  };

  // 6. REMOVER DA PILHA
  const handleRemovePin = (idToRemove: string) => {
    const updatedList = pinnedItems.filter(p => p.id !== idToRemove);
    setPinnedItems(updatedList);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('magicFill_pinnedItems', JSON.stringify(updatedList));
    }
  };

  // 7. INJEÇÃO INTELIGENTE
  const injectData = (type: 'text' | 'image', value: string | number | null, fieldName: string, itemSource: DataSource) => {
    if (!selectedObject || value === null || value === undefined) return;

    if (type === 'text' && selectedObject.type.includes('text')) {
      selectedObject.set('text', value.toString());
      onUpdate('variableId', `${itemSource}_${fieldName}`);
    } 
    else if (type === 'image' && (selectedObject.type === 'rect' || selectedObject.type === 'circle' || selectedObject.isFrame)) {
      onInjectImage(value.toString());
    } 
    else {
      alert(`Selecione um elemento de ${type === 'text' ? 'texto' : 'imagem/moldura'} no Canvas para injetar este dado.`);
    }
  };

  // 8. BUSCAR FOTOS DO IMÓVEL (Galeria)
  const openGalleryModal = async (itemSource: DataSource, itemData: any) => {
    if (!selectedObject || (!selectedObject.isFrame && selectedObject.type !== 'rect' && selectedObject.type !== 'circle')) {
      alert("Selecione primeiro uma moldura ou forma no Canvas para injetar a imagem.");
      return;
    }

    setActiveItemForImages({ source: itemSource, data: itemData });
    setImageModalOpen(true);
    setLoadingImages(true);

    const baseImages = itemData.urlfotoprincipal ? [itemData.urlfotoprincipal] : [];
    setPropertyImages(baseImages);

    try {
      const fotosTable = itemSource === 'imovel_pmw' ? 'fotos_imoveis_pmw' : 'fotos_imoveis_aux';
      
      const { data, error } = await supabase
        .from(fotosTable)
        .select('url')
        .eq('imovel_codigo', itemData.codigo);

      if (!error && data) {
        const fetchedUrls = data.map(d => d.url).filter(Boolean);
        const allImages = Array.from(new Set([...baseImages, ...fetchedUrls]));
        setPropertyImages(allImages);
      }
    } catch (err) {
      console.error('Erro ao buscar galeria de fotos:', err);
    } finally {
      setLoadingImages(false);
    }
  };

  // 9. RENDER DO MINI CARD PREMIUM (RESTURADO AO DESIGN MAIS ELEGANTE)
  const renderPinnedCard = (pinned: PinnedItem) => {
    const { sourceTable: itemSource, data: item, id: uniqueId } = pinned;
    const isBroker = itemSource.includes('corretores');
    const isProperty = itemSource.includes('imovel');

    const itemPhoto = isBroker ? item.imagem_url : item.urlfotoprincipal;
    const itemName = isBroker ? item.nome : item.titulo;
    const itemSub = isBroker ? (item.unidade || item.departamento || 'Corretor') : item.valor;

    return (
      <div key={uniqueId} className="group relative border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-white overflow-hidden rounded-[1.5rem] ring-1 ring-slate-200 hover:ring-blue-300 animate-in fade-in slide-in-from-top-2">
        {/* Efeito de Topo Colorido Moderno */}
        <div className={`absolute top-0 left-0 right-0 h-20 opacity-20 bg-gradient-to-b ${isBroker ? 'from-indigo-500' : 'from-emerald-500'} to-transparent pointer-events-none`} />

        <div className="p-4 flex flex-col relative z-10">
          {/* Cabeçalho */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex gap-3">
              <div className={`w-12 h-12 rounded-full ring-4 ring-white shadow-sm flex items-center justify-center shrink-0 overflow-hidden ${isBroker ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {itemPhoto && !itemPhoto.includes('placeholder') ? (
                  <img src={itemPhoto} alt="Avatar" className="w-full h-full object-cover" />
                ) : isBroker ? (
                  <UserCircle className="w-6 h-6" />
                ) : (
                  <Home className="w-6 h-6" />
                )}
              </div>
              <div className="pt-0.5">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${isBroker ? 'text-indigo-600' : 'text-emerald-600'}`}>
                    <Pin className="w-2.5 h-2.5 fill-current" /> {isBroker ? 'Corretor' : 'Imóvel'} Fixado
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-800 leading-tight truncate w-[140px]" title={itemName}>
                  {itemName || 'Sem título'}
                </h3>
                <p className="text-[10px] font-medium text-slate-500 truncate w-[140px]">
                  {itemSub}
                </p>
              </div>
            </div>

            <Button 
              variant="ghost" size="icon" onClick={() => handleRemovePin(uniqueId)}
              className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full -mr-2 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm bg-white/50 backdrop-blur-sm" 
              title="Desafixar"
            >
              <PinOff className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Informações Centrais (Painel de Botões) */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center mb-2">
              <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Ações de Injeção</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {isBroker && (
                <>
                  <Button variant="outline" size="sm" className="h-8 text-[10px] justify-start text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors col-span-2" onClick={() => injectData('text', item.nome, 'nome', itemSource)}>
                    <Type className="w-3 h-3 mr-2 text-indigo-500" /> Nome do Corretor
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-[10px] justify-start text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-colors" onClick={() => injectData('text', item.departamento || item.unidade, 'departamento', itemSource)}>
                    <Briefcase className="w-3 h-3 mr-2 text-amber-500" /> Depto
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-[10px] justify-start text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors" onClick={() => injectData('text', item.cidade_origem, 'cidade', itemSource)}>
                    <MapPin className="w-3 h-3 mr-2 text-red-500" /> Cidade
                  </Button>
                  {itemPhoto && (
                    <Button variant="default" size="sm" className="h-8 text-[10px] justify-center bg-indigo-600 hover:bg-indigo-700 text-white col-span-2 shadow-md transition-all font-semibold" onClick={() => injectData('image', itemPhoto, 'foto_perfil', itemSource)}>
                      <ImageIcon className="w-3 h-3 mr-2" /> Injetar Foto Perfil
                    </Button>
                  )}
                </>
              )}

              {isProperty && (
                <>
                  <Button variant="outline" size="sm" className="h-8 text-[10px] justify-start text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors" onClick={() => injectData('text', item.titulo, 'titulo', itemSource)}>
                    <Type className="w-3 h-3 mr-2 text-blue-500" /> Título
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-[10px] justify-start text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors" onClick={() => injectData('text', item.valor, 'valor', itemSource)}>
                    <DollarSign className="w-3 h-3 mr-2 text-emerald-500" /> Preço
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-[10px] justify-start text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors col-span-2" onClick={() => injectData('text', `${item.bairro}${item.cidade ? `, ${item.cidade}` : ''}`, 'localizacao', itemSource)}>
                    <MapPin className="w-3 h-3 mr-2 text-red-500" /> Bairro/Cidade
                  </Button>
                  
                  {/* Novos botões de Informações do Imóvel mantendo a altura h-8 */}
                  <Button variant="outline" size="sm" className="h-8 text-[10px] justify-start text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors" onClick={() => injectData('text', `${item.numeroquartos || 0}`, 'quartos', itemSource)}>
                    <BedDouble className="w-3 h-3 mr-2 text-indigo-500" /> Quartos
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-[10px] justify-start text-slate-600 border-slate-200 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 transition-colors" onClick={() => injectData('text', `${item.numerobanhos || 0}`, 'banheiros', itemSource)}>
                    <Bath className="w-3 h-3 mr-2 text-sky-500" /> Banheiros
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-[10px] justify-start text-slate-600 border-slate-200 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200 transition-colors" onClick={() => injectData('text', `${item.areaprincipal || 0} m²`, 'area', itemSource)}>
                    <Maximize className="w-3 h-3 mr-2 text-cyan-500" /> Área (m²)
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-[10px] justify-start text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => injectData('text', item.descricao || '', 'descricao', itemSource)}>
                    <AlignLeft className="w-3 h-3 mr-2 text-slate-500" /> Descrição
                  </Button>
                  
                  {/* Botão de Galeria */}
                  <Button variant="default" size="sm" className="h-8 text-[10px] justify-center bg-emerald-600 hover:bg-emerald-700 text-white col-span-2 shadow-md transition-all font-semibold" onClick={() => openGalleryModal(itemSource, item)}>
                    <ImageIcon className="w-3 h-3 mr-2" /> Escolher Foto da Galeria
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const isBroker = sourceTable.includes('corretores');

  return (
    <>
      <div className={`bg-slate-50/80 p-4 rounded-2xl border border-slate-200 flex flex-col gap-4 shadow-sm ${selectedObject?.locked ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between text-blue-700">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Wand2 className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-800">Magic Fill</span>
          </div>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
        </div>
        
        {/* 1. Seleção da Base de Dados */}
        <div className="space-y-2">
          <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Adicionar Dados de:</Label>
          <Select value={sourceTable} onValueChange={handleSourceChange}>
            <SelectTrigger className="h-10 text-xs bg-white border-slate-200 focus:ring-blue-500 rounded-xl shadow-sm">
              <SelectValue placeholder="Escolha a base de dados..." />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel className="flex items-center gap-2 text-indigo-600 font-bold"><UserCircle className="w-4 h-4"/> Corretores</SelectLabel>
                <SelectItem value="corretores_pmw">Corretores (Palmas - PMW)</SelectItem>
                <SelectItem value="corretores_aux">Corretores (Araguaína - AUX)</SelectItem>
              </SelectGroup>
              <Separator className="my-1" />
              <SelectGroup>
                <SelectLabel className="flex items-center gap-2 text-emerald-600 font-bold"><Home className="w-4 h-4"/> Imóveis</SelectLabel>
                <SelectItem value="imovel_pmw">Imóveis (Palmas - PMW)</SelectItem>
                <SelectItem value="imovel_aux">Imóveis (Araguaína - AUX)</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* 2. Campo de Busca + Resultados */}
        {sourceTable && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input 
                placeholder={isBroker ? "Procurar por nome..." : "Código do Imóvel (ex: 1234)..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-9 text-xs border-slate-200 focus:border-blue-400 focus:ring-blue-100 bg-slate-50 rounded-lg"
              />
            </div>

            <Select 
              value={selectedValue} 
              onValueChange={handleSelectItem}
              disabled={loading}
            >
              <SelectTrigger className="h-9 text-xs border-dashed border-slate-300 focus:ring-blue-300 rounded-lg">
                <SelectValue placeholder={loading ? "A pesquisar..." : (items.length === 0 ? (searchTerm ? "Nenhum resultado" : "Escolha abaixo") : "Clique para selecionar...")} />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => {
                  const identifier = (item.id || item.codigo).toString();
                  const displayName = isBroker ? item.nome : `${item.codigo} - ${item.titulo || item.bairro}`;
                  return (
                    <SelectItem key={identifier} value={identifier}>
                      {displayName}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 3. A Pilha de Cards Fixados */}
        {pinnedItems.length > 0 && (
          <div className="pt-2 flex flex-col gap-4">
            <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex justify-between items-center">
              <span>Área de Trabalho ({pinnedItems.length})</span>
              {pinnedItems.length > 1 && (
                <span className="text-[9px] font-semibold lowercase text-slate-400 cursor-pointer hover:text-red-500 bg-white px-2 py-0.5 rounded-full border border-slate-200" onClick={() => { setPinnedItems([]); sessionStorage.removeItem('magicFill_pinnedItems'); }}>
                  Limpar Todos
                </span>
              )}
            </Label>
            
            {pinnedItems.map(renderPinnedCard)}
          </div>
        )}
      </div>

      {/* MODAL DE GALERIA DE FOTOS DO IMÓVEL */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="sm:max-w-3xl bg-white border-slate-200 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                <ImageIcon className="w-5 h-5" />
              </div>
              Galeria do Imóvel
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Clique na imagem que deseja injetar diretamente na sua arte.
            </DialogDescription>
          </DialogHeader>

          {loadingImages ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-4" />
              <p className="text-sm font-medium text-slate-500">A carregar fotos do imóvel...</p>
            </div>
          ) : propertyImages.length === 0 ? (
            <div className="text-center py-20 text-slate-500 font-medium flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <ImageIcon className="w-8 h-8 text-slate-300" />
              </div>
              <p>Nenhuma imagem extra encontrada para este imóvel.</p>
            </div>
          ) : (
            <ScrollArea className="h-[450px] w-full pr-4 rounded-xl">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-4">
                {propertyImages.map((imgUrl, idx) => (
                  <div 
                    key={idx} 
                    className="group relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-transparent hover:border-emerald-500 hover:shadow-lg cursor-pointer transition-all bg-slate-100"
                    onClick={() => {
                      if (activeItemForImages) {
                        injectData('image', imgUrl, `foto_extra_${idx}`, activeItemForImages.source);
                        setImageModalOpen(false); 
                      }
                    }}
                  >
                    <img 
                      src={imgUrl} 
                      alt={`Foto ${idx + 1}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-emerald-900/0 group-hover:bg-emerald-900/40 transition-colors duration-300 flex items-center justify-center">
                       <span className="opacity-0 group-hover:opacity-100 text-white font-bold text-xs bg-emerald-600/90 px-3 py-1.5 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                         Usar esta Foto
                       </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}