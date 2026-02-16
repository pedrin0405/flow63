'use client';

import { Sidebar } from "@/components/central63/sidebar";
import { IndicatorsFilters } from "@/components/central63/indicators-filters";
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
import { 
  Phone, 
  TrendingUp, 
  Home,
  FileText,
  ChartPie,
  Menu,
  AlertTriangle,
  PauseCircle,
  TimerOff,
  Target,
  ChevronDown, 
  ChevronUp,
  ThermometerSun,
  Snowflake,
  Flame,
  PieChart,
  LineChart,
  AreaChart,
  Download,
  X,
  Table as TableIcon,
  Database,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import Loading from "../loading"

Chart.register(...registerables);

// --- Componentes de Apoio ---

const StatCard = ({ title, value, icon: Icon, color, subValue }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden hover:translate-y-[-2px] transition-all">
    <div className="relative z-10 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-500 text-sm font-medium">{title}</span>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <span className="text-3xl font-extrabold text-gray-900">{value}</span>
      {subValue && <span className="text-xs text-gray-400 mt-1">{subValue}</span>}
    </div>
    <div 
      className="absolute bottom-[-20px] right-[-20px] w-24 h-24 rounded-full opacity-5" 
      style={{ backgroundColor: color }}
    />
  </div>
);

const ExportModal = ({ isOpen, onClose, dashboardData }: { isOpen: boolean, onClose: () => void, dashboardData: any }) => {
  if (!isOpen) return null;

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const jsonString = JSON.stringify(dashboardData, null, 2);
    downloadFile(jsonString, 'dados-dashboard.json', 'application/json');
  };

  const handleDownloadExcel = () => {
    if (!dashboardData) return;
    let csvContent = "\uFEFF"; 
    csvContent += "Relatório de Indicadores - Central63\n\n";
    csvContent += "INDICADORES GERAIS\n";
    csvContent += "Métrica,Valor\n";
    Object.entries(dashboardData.indicadoresGerais || {}).forEach(([key, val]) => {
      csvContent += `${key},${val}\n`;
    });
    csvContent += "\nDETALHAMENTO SEMANAL\n";
    csvContent += "Semana,Atendimentos,Visitas,Propostas,Negócios\n";
    dashboardData.funilDeVendasSemanal?.forEach((item: any) => {
      csvContent += `${item.semana},${item.atendimentos},${item.visitas},${item.propostas},${item.negocios}\n`;
    });
    downloadFile(csvContent, 'indicadores.csv', 'text/csv;charset=utf-8;');
  };

  const handleDownloadPDF = () => { window.print(); };

  const exportOptions = [
    { name: 'Relatório em PDF', icon: FileText, desc: 'Salvar visão completa em PDF', action: handleDownloadPDF },
    { name: 'Planilha Excel', icon: FileSpreadsheet, desc: 'Dados convertidos para CSV/Excel', action: handleDownloadExcel },
    { name: 'Dados em JSON', icon: FileImage, desc: 'Download direto dos dados da API', action: handleDownloadJSON },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm print:hidden" />
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden print:hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50/30">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Exportar Dados</h3>
              <p className="text-xs text-gray-500">Escolha o formato de saída</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
          </div>
          <div className="p-4 space-y-2">
            {exportOptions.map((opt, i) => (
              /* @ts-ignore */
              <button key={i} onClick={() => { opt.action(); if (opt.name !== 'Relatório em PDF') onClose(); }} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100 group text-left">
                <div className="w-12 h-12 rounded-xl bg-indigo-100/50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <opt.icon size={24} />
                </div>
                <div>
                  <p className="font-bold text-gray-800">{opt.name}</p>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// --- Tipos para ícones dinâmicos ---
import { LucideIcon, FileSpreadsheet, FileImage } from 'lucide-react';

export default function IndicatorsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAllMidia, setShowAllMidia] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Instância e Unidade selecionadas (gerenciadas via Filters, mas refletidas aqui)
  const [selectedInstance, setSelectedInstance] = useState<string>("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");

  const chartsInstance = useRef<{ [key: string]: Chart | null }>({});
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const lastFilters = useRef<string>("");
  
  const chartRefs = {
    tipoAtendimento: useRef<HTMLCanvasElement>(null),
    desempenhoLinha: useRef<HTMLCanvasElement>(null),
    volumeAtividadesSemanal: useRef<HTMLCanvasElement>(null),
  };

  const parseFilterString = (filterString: string) => {
    const params = new URLSearchParams(filterString);
    const filtersObj: any = {};
    params.forEach((value, key) => { filtersObj[key] = value; });
    return filtersObj;
  };

  /**
   * FUNÇÃO PRINCIPAL DE CARREGAMENTO
   * Agora ela captura a instância e unidade direto da string de filtros ou estados
   */
  const fetchDashboardData = useCallback(async (filterString: string) => {
    setLoading(true);
    lastFilters.current = filterString;
    const minWait = new Promise(resolve => setTimeout(resolve, 800));
    
    const filters = parseFilterString(filterString);
    
    // Atualiza estados locais de controle se vierem no filtro
    if (filters.instanceName) setSelectedInstance(filters.instanceName);
    if (filters.CodigoUnidade) setSelectedUnitId(filters.CodigoUnidade);

    const params = new URLSearchParams(filterString);

    setLoading(true);
    lastFilters.current = filterString;

    try {
      const response = await fetch('/api/imoview/indicators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'default', 
          instanceName: params.get('instanceName') || params.get('instance'),
          filters 
        }),
      });

      const [result] = await Promise.all([response.json(), minWait]);
      if (result.error) throw new Error(result.message);
      setData(result.body);
    } catch (error) {
      console.error("Erro ao carregar indicadores:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedInstance]);

  // Atualização periódica (10 min)
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastFilters.current) fetchDashboardData(lastFilters.current);
    }, 600000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Lógica de Renderização dos Gráficos (Chart.js)
  useEffect(() => {
    if (!data) return;
    Object.values(chartsInstance.current).forEach(chart => chart?.destroy());

    if (chartRefs.tipoAtendimento.current && data.dadosGraficos.tipoAtendimento) {
      const colors = ['#6366F1', '#c55cf6', '#EC4899', '#06B6D4', '#F59E0B'];
      chartsInstance.current.tipoAtendimento = new Chart(chartRefs.tipoAtendimento.current, {
        type: 'doughnut',
        data: {
          labels: data.dadosGraficos.tipoAtendimento.map((i: any) => i.categoria),
          datasets: [{
            data: data.dadosGraficos.tipoAtendimento.map((i: any) => i.valor),
            backgroundColor: colors,
            borderWidth: 0,
            hoverOffset: 10,
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { display: false } } }
      });
    }

    if (chartRefs.desempenhoLinha.current && data.funilDeVendasSemanal) {
      const chartData = data.funilDeVendasSemanal.filter((item: any) => 
        item.semana !== 'Total' && item.semana !== 'Sem atividade programada'
      );
      chartsInstance.current.desempenhoLinha = new Chart(chartRefs.desempenhoLinha.current, {
        type: 'line',
        data: {
          labels: chartData.map((item: any) => item.semana),
          datasets: [
            { label: 'Atendimentos', data: chartData.map((item: any) => item.atendimentos), borderColor: '#6366F1', fill: true, tension: 0.4, borderWidth: 3 },
            { label: 'Visitas', data: chartData.map((item: any) => item.visitas), borderColor: '#c55cf6', tension: 0.4 },
            { label: 'Propostas', data: chartData.map((item: any) => item.propostas), borderColor: '#EC4899', tension: 0.4 },
            { label: 'Negócios', data: chartData.map((item: any) => item.negocios), borderColor: '#10B981', tension: 0.4 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', align: 'end' } } }
      });
    }

    if (chartRefs.volumeAtividadesSemanal.current && data.funilDeVendasSemanal) {
      const chartData = data.funilDeVendasSemanal.filter((item: any) => 
        item.semana !== 'Total' && item.semana !== 'Sem atividade programada'
      );
      chartsInstance.current.volumeAtividadesSemanal = new Chart(chartRefs.volumeAtividadesSemanal.current, {
        type: 'line',
        data: {
          labels: chartData.map((item: any) => item.semana),
          datasets: [
            { label: 'Visitas', data: chartData.map((item: any) => item.visitas), borderColor: '#8B5CF6', fill: true, tension: 0.4 },
            { label: 'Negócios', data: chartData.map((item: any) => item.negocios), borderColor: '#10B981', fill: true, tension: 0.4 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
  }, [data]);

  const getMetricValue = (array: any[], key: string) => {
    const item = array?.find(i => i.categoria === key);
    return item ? item.valor : 0;
  };

  const sortedMidia = data?.dadosGraficos?.midiaDeOrigem 
    ? [...data.dadosGraficos.midiaDeOrigem].sort((a: any, b: any) => b.valor - a.valor)
    : [];
  const maxMidiaValue = sortedMidia.length > 0 ? sortedMidia[0].valor : 1;
  const displayedMidia = showAllMidia ? sortedMidia : sortedMidia.slice(0, 5);

  const lastActiveIndex = data?.etapasAtendimento?.reduce((last: number, curr: any, idx: number) => {
    return curr.quantidade > 0 ? idx : last;
  }, -1) ?? -1;
  const progressPercentage = lastActiveIndex >= 0 ? (lastActiveIndex / (data?.etapasAtendimento?.length - 1)) * 100 : 0;

  const containerVariants: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } } };
  const itemVariants: Variants = { hidden: { y: 20, opacity: 0, scale: 0.8 }, show: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100 } } };

  const stepColors = [
    { from: 'from-blue-500', to: 'to-blue-600', shadow: 'shadow-blue-200', ring: 'ring-blue-50', text: 'text-blue-800', bg: 'bg-blue-50', border: 'border-blue-100' },
    { from: 'from-indigo-500', to: 'to-indigo-600', shadow: 'shadow-indigo-200', ring: 'ring-indigo-50', text: 'text-indigo-800', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { from: 'from-violet-500', to: 'to-violet-600', shadow: 'shadow-violet-200', ring: 'ring-violet-50', text: 'text-violet-800', bg: 'bg-violet-50', border: 'border-violet-100' },
    { from: 'from-purple-500', to: 'to-purple-600', shadow: 'shadow-purple-200', ring: 'ring-purple-50', text: 'text-purple-800', bg: 'bg-purple-50', border: 'border-purple-100' },
    { from: 'from-fuchsia-500', to: 'to-fuchsia-600', shadow: 'shadow-fuchsia-200', ring: 'ring-fuchsia-50', text: 'text-fuchsia-800', bg: 'bg-fuchsia-50', border: 'border-fuchsia-100' },
    { from: 'from-pink-500', to: 'to-pink-600', shadow: 'shadow-pink-200', ring: 'ring-pink-50', text: 'text-pink-800', bg: 'bg-pink-50', border: 'border-pink-100' },
    { from: 'from-rose-500', to: 'to-rose-600', shadow: 'shadow-rose-200', ring: 'ring-rose-50', text: 'text-rose-800', bg: 'bg-rose-50', border: 'border-rose-100' },
    { from: 'from-orange-500', to: 'to-orange-600', shadow: 'shadow-orange-200', ring: 'ring-orange-50', text: 'text-orange-800', bg: 'bg-orange-50', border: 'border-orange-100' },
  ];

  const getTempStyle = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('frio')) return { color: 'text-blue-500', bg: 'bg-blue-500', bgLight: 'bg-blue-50', icon: Snowflake };
    if (l.includes('morno')) return { color: 'text-orange-500', bg: 'bg-orange-500', bgLight: 'bg-orange-50', icon: ThermometerSun };
    if (l.includes('quente')) return { color: 'text-red-500', bg: 'bg-red-500', bgLight: 'bg-red-50', icon: Flame };
    return { color: 'text-gray-500', bg: 'bg-gray-500', bgLight: 'bg-gray-50', icon: ThermometerSun };
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa] print:bg-white print:h-auto print:overflow-visible">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activeTab={activeTab} onTabChange={(tab: string) => { setActiveTab(tab); setSidebarOpen(false); }} />

      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar ">
        <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 lg:px-8 py-4 flex items-center justify-between shadow-sm print:hidden">
            <div className="flex items-center gap-3">
                <button 
                    className="lg:hidden p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors" 
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Menu size={20} />
                </button>                
                <ChartPie className="text-primary hidden sm:block" />
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">Painel de Indicadores</h2>
                <p className="text-primary hidden sm:block">| Sincronização direta Imoview</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                  onClick={() => setIsShareModalOpen(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
              >
                  <Download size={18} />
                  <span className="hidden sm:inline">Exportar</span>
              </button>
            </div>
        </header>

        <ExportModal 
          isOpen={isShareModalOpen} 
          onClose={() => setIsShareModalOpen(false)} 
          dashboardData={data} 
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          
          {/* COMPONENTE DE FILTROS INTEGRADO */}
          <IndicatorsFilters onFilterChange={fetchDashboardData} />

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <p className="text-gray-500 animate-pulse">Sincronizando dados com Imoview...</p>
            </div>
          ) : data ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              
              {/* KPIs Principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Atendimentos" value={data.indicadoresGerais?.totalAtendimentos || 0} icon={Phone} color="#4F46E5" />
                <StatCard title="Visitas Realizadas" value={data.funilDeVendasTotal?.visitas || 0} icon={Home} color="#8B5CF6" />
                <StatCard title="Propostas" value={data.funilDeVendasTotal?.propostas || 0} icon={FileText} color="#EC4899" />
                <StatCard title="Negócios" value={data.funilDeVendasTotal?.negocios || 0} icon={TrendingUp} color="#10B981" />
              </div>

              {/* JORNADA DE ATENDIMENTO */}
              <Card className="rounded-2xl border-none shadow-xl bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/20 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-4 border-b border-indigo-50/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-gray-700 text-lg flex items-center gap-2 font-bold tracking-tight">
                      <div className="p-2 bg-indigo-100/50 rounded-lg"><TrendingUp className="w-5 h-5 text-indigo-600" /></div>
                      Jornada de Atendimento
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-8 pb-8">
                  <div className="relative mx-4">
                    <div className="absolute top-[22px] left-0 w-full h-1.5 bg-gray-100 rounded-full z-0 overflow-hidden">
                       <motion.div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 rounded-full shadow-md" initial={{ width: 0 }} animate={{ width: `${progressPercentage}%` }} transition={{ duration: 1.5, ease: "circOut", delay: 0.5 }} />
                    </div>
                    <motion.div className="flex justify-between items-start relative z-10 overflow-x-auto no-scrollbar pb-2" variants={containerVariants} initial="hidden" animate="show">
                      {data.etapasAtendimento?.map((etapa: any, idx: number) => {
                        const isActive = etapa.quantidade > 0;
                        const isLastActive = idx === lastActiveIndex;
                        const theme = stepColors[idx % stepColors.length];
                        return (
                          <motion.div key={idx} variants={itemVariants} className="flex flex-col items-center group cursor-default w-full min-w-[100px]">
                            <div className="relative">
                              {isLastActive && (<span className={`absolute -inset-2 rounded-full opacity-30 animate-ping pointer-events-none ${theme.bg.replace('50', '400')}`} />)}
                              {isActive && (<span className={`absolute -inset-1 rounded-full blur-sm -z-10 transition-all ${theme.bg}`} />)}
                              <motion.div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 relative ${isActive ? `bg-gradient-to-br ${theme.from} ${theme.to} border-white ring-2 ${theme.ring} shadow-lg ${theme.shadow}` : 'bg-white border-gray-100 text-gray-300 shadow-sm'}`} whileHover={{ scale: 1.15, y: -2 }} whileTap={{ scale: 0.95 }}>
                                {isActive ? (<span className="text-sm font-bold text-white drop-shadow-md">{etapa.quantidade}</span>) : (<div className="w-2 h-2 rounded-full bg-gray-200" />)}
                              </motion.div>
                            </div>
                            <motion.div className={`mt-3 px-3 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-wide text-center transition-all duration-300 border ${isActive ? `${theme.text} ${theme.bg} ${theme.border} shadow-sm transform translate-y-0 opacity-100` : 'text-gray-400 bg-transparent border-transparent translate-y-2 opacity-60 group-hover:opacity-100 group-hover:translate-y-0'}`}>
                              {etapa.nome}
                            </motion.div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </div>
                </CardContent>
              </Card>

              {/* GRÁFICOS PRINCIPAIS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="rounded-2xl border-none shadow-sm flex flex-col h-[530px] print:h-[930px] print:max-h-[930px] print:col-span-1"> 
                <CardHeader className="border-b border-gray-50 pb-4 shrink-0">
                  <CardTitle className="text-gray-700 flex items-center gap-2 font-bold">
                    <Target className="w-5 h-5 text-indigo-600" />
                    Mídia de Origem
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 overflow-hidden relative p-0 print:overflow-visible">
                  <div className="h-full overflow-y-auto custom-scrollbar pb-10 print:overflow-visible print:h-auto">
                    <div className="flex flex-col">
                      {/* Mapeamos a lista completa para o print ler os itens extras */}
                      {sortedMidia.map((item: any, idx: number) => {
                        const percent = (item.valor / maxMidiaValue) * 100;
                        
                        // Lógica de visibilidade:
                        // Na tela: segue o estado 'showAllMidia' (limite 5)
                        // No print: mostra até o índice 9 (total 10 itens) independente do botão
                        const isHiddenOnScreen = !showAllMidia && idx > 4;
                        const isVisibleOnPrint = idx < 10; 

                        return (
                          <div 
                            key={idx} 
                            className={`relative py-4 px-6 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group
                              ${isHiddenOnScreen ? 'hidden' : 'flex'} 
                              ${isVisibleOnPrint ? 'print:flex' : 'print:hidden'} flex-col`}
                          >
                            <div className="flex justify-between items-center mb-2 relative z-10">
                              <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <span className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black ${idx < 3 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>{idx + 1}</span>
                                {item.categoria}
                              </span>
                              <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{item.valor}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                              <motion.div 
                                className={`h-full rounded-full ${idx < 3 ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-gray-400'}`} 
                                initial={{ width: 0 }} 
                                animate={{ width: `${percent}%` }} 
                                transition={{ duration: 1, delay: idx * 0.1, ease: "easeOut" }} 
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Botão original: print:hidden para não aparecer na impressão */}
                  {sortedMidia.length > 5 && (
                    <div className="absolute bottom-0 w-full bg-gradient-to-t from-white via-white to-transparent pt-6 pb-2 flex justify-center z-20 print:hidden">
                        <button onClick={() => setShowAllMidia(!showAllMidia)} className="flex items-center gap-1.5 px-4 py-1.5 bg-white border border-gray-200 shadow-sm rounded-full text-xs font-bold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all transform hover:scale-105">
                          {showAllMidia ? (<>Ver menos <ChevronUp className="w-3 h-3" /></>) : (<>Ver mais ({sortedMidia.length - 5}) <ChevronDown className="w-3 h-3" /></>)}
                        </button>
                    </div>
                  )}
                </CardContent>
              </Card>

                <Card className="rounded-2xl border-none shadow-sm h-[530px] flex flex-col">
                  <CardHeader className="border-b border-gray-50 pb-4 shrink-0">
                    <CardTitle className="text-gray-700 flex items-center gap-2 font-bold">
                      <ThermometerSun className="w-5 h-5 text-indigo-600" />
                      Temperatura do Lead
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <div className="flex flex-col gap-5">
                      {data.dadosGraficos?.termometro?.map((item: any, idx: number) => {
                        const style = getTempStyle(item.categoria);
                        const Icon = style.icon;
                        const totalTemp = data.dadosGraficos.termometro.reduce((acc: number, curr: any) => acc + curr.valor, 0);
                        const percent = totalTemp > 0 ? (item.valor / totalTemp) * 100 : 0;
                        return (
                          <div key={idx} className="group">
                            <div className="flex justify-between items-end mb-2">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.bgLight} ${style.color} shadow-sm transition-transform group-hover:scale-110`}>
                                  <Icon size={20} />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-700">{item.categoria}</p>
                                  <p className="text-xs text-gray-400 font-medium">{percent.toFixed(1)}% do total</p>
                                </div>
                              </div>
                              <span className={`text-xl font-black ${style.color}`}>{item.valor}</span>
                            </div>
                            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden p-0.5">
                              <motion.div className={`h-full rounded-full ${style.bg} shadow-sm`} initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 1, ease: "easeOut", delay: idx * 0.1 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* KPIs de Alerta */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <StatCard title="Leads sem Atividade" value={data.atividades?.Sematividadeprogramada?.atendimento || 0} icon={PauseCircle} color="#F59E0B" subValue="Atenção Necessária" />
                 <StatCard title="Atividades Vencidas" value={data.atividades?.Atividadesvencidas?.atividade || 0} icon={AlertTriangle} color="#EF4444" subValue="Prioridade Alta" />
                 <StatCard title="Leads Estagnados (+45d)" value={getMetricValue(data.dadosGraficos?.ultimaInteracao, 'acima de 45 dias')} icon={TimerOff} color="#64748B" subValue="Sem interação recente" />
              </div>

              {/* GRÁFICOS SECUNDÁRIOS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="rounded-2xl border-none shadow-sm flex flex-col h-[400px]">
                  <CardHeader className="border-b border-gray-50 pb-4">
                    <CardTitle className="text-gray-700 flex items-center gap-2 font-bold">
                      <X className="w-5 h-5 text-rose-500" />
                      Motivos de Descarte
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto custom-scrollbar p-0">
                    <div className="flex flex-col">
                      {data.dadosGraficos?.motivoDescarte?.sort((a: any, b: any) => b.valor - a.valor).slice(0, 10).map((item: any, idx: number) => {
                          const maxVal = data.dadosGraficos.motivoDescarte[0]?.valor || 1;
                          const percent = (item.valor / maxVal) * 100;
                          return (
                            <div key={idx} className="relative py-3 px-6 hover:bg-rose-50/30 border-b border-gray-50 last:border-0 group">
                               <div className="flex justify-between items-center mb-1.5 relative z-10">
                                  <span className="text-xs font-bold text-gray-700 truncate max-w-[80%]" title={item.categoria}>{item.categoria}</span>
                                  <span className="text-xs font-black text-rose-600">{item.valor}</span>
                               </div>
                               <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                  <motion.div className="h-full rounded-full bg-gradient-to-r from-rose-400 to-red-500 shadow-sm" initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 1, ease: "easeOut", delay: idx * 0.05 }} />
                               </div>
                            </div>
                          );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-none shadow-sm flex flex-col h-[400px]">
                  <CardHeader className="border-b border-gray-50 pb-4">
                    <CardTitle className="text-gray-700 flex items-center gap-2 font-bold">
                      <PieChart className="w-5 h-5 text-indigo-600" />
                      Canais de Atendimento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 p-4 flex items-center">
                    <div className="flex w-full items-center gap-4">
                      <div className="w-1/2 h-[220px] relative">
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                           <span className="text-3xl font-black text-gray-800">{data?.dadosGraficos?.tipoAtendimento?.reduce((a:any, b:any) => a + b.valor, 0)}</span>
                           <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Total</span>
                        </div>
                        <canvas ref={chartRefs.tipoAtendimento}></canvas>
                      </div>
                      <div className="w-1/2 flex flex-col justify-center gap-3 pl-4 border-l border-gray-100">
                        {data?.dadosGraficos?.tipoAtendimento?.map((item: any, idx: number) => {
                          const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-pink-500', 'bg-cyan-500', 'bg-amber-500'];
                          const colorClass = colors[idx % colors.length];
                          const total = data.dadosGraficos.tipoAtendimento.reduce((a:any, b:any) => a + b.valor, 0);
                          const percent = ((item.valor / total) * 100).toFixed(0);
                          return (
                            <div key={idx} className="flex items-center justify-between group cursor-default">
                              <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${colorClass} ring-2 ring-white shadow-sm`}></span>
                                <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">{item.categoria}</span>
                              </div>
                              <div className="text-right">
                                <span className="block text-xs font-bold text-gray-900">{item.valor}</span>
                                <span className="block text-[10px] text-gray-400">{percent}%</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* TENDÊNCIA DE DESEMPENHO SEMANAL */}
              <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
                <CardHeader className="border-b border-gray-50 flex flex-row items-center justify-between">
                  <CardTitle className="text-gray-700 flex items-center gap-2 font-bold">
                    <LineChart className="w-5 h-5 text-indigo-600" />
                    Tendência de Desempenho Semanal (Funil)
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px] pt-6"><canvas ref={chartRefs.desempenhoLinha}></canvas></CardContent>
              </Card>

              {/* VOLUME DE RESULTADOS SEMANAL */}
              <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
                <CardHeader className="border-b border-gray-50 flex flex-row items-center justify-between">
                  <CardTitle className="text-gray-700 flex items-center gap-2 font-bold">
                    <AreaChart className="w-5 h-5 text-emerald-600" />
                    Volume de Resultados Semanal (Visitas vs Negócios)
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px] pt-6"><canvas ref={chartRefs.volumeAtividadesSemanal}></canvas></CardContent>
              </Card>

              {/* TABELA SEMANAL */}
              <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
                <CardHeader className="px-6 py-5 border-b border-gray-100 bg-white flex flex-row items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <TableIcon size={18} />
                      </div>
                      Detalhamento Semanal
                    </CardTitle>
                  </div>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                      <tr>
                        <th className="py-4 px-6 font-semibold">Semana</th>
                        <th className="py-4 px-6 text-right font-semibold">Atendimentos</th>
                        <th className="py-4 px-6 text-right font-semibold">Visitas</th>
                        <th className="py-4 px-6 text-right font-semibold">Propostas</th>
                        <th className="py-4 px-6 text-right font-semibold">Negócios</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.funilDeVendasSemanal?.map((row: any, i: number) => {
                        const isTotal = row.semana === 'Total';
                        if (isTotal) return null; 
                        return (
                          <tr key={i} className="hover:bg-gray-50 transition-colors group">
                            <td className="py-4 px-6 font-medium text-gray-900">
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-indigo-500 transition-colors"></span>
                                {row.semana}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-right tabular-nums text-gray-600 group-hover:text-indigo-600 transition-colors">{row.atendimentos}</td>
                            <td className="py-4 px-6 text-right tabular-nums text-gray-600 group-hover:text-indigo-600 transition-colors">{row.visitas}</td>
                            <td className="py-4 px-6 text-right tabular-nums text-gray-600 group-hover:text-indigo-600 transition-colors">{row.propostas}</td>
                            <td className="py-4 px-6 text-right tabular-nums font-semibold text-gray-900">{row.negocios}</td>
                          </tr>
                        );
                      })}
                      {data.funilDeVendasSemanal?.filter((r:any) => r.semana === 'Total').map((row: any, i: number) => (
                         <tr key={'total'} className="bg-indigo-50/50 border-t border-indigo-100">
                            <td className="py-4 px-6 font-bold text-indigo-900">TOTAL</td>
                            <td className="py-4 px-6 text-right font-bold text-indigo-900 tabular-nums">{row.atendimentos}</td>
                            <td className="py-4 px-6 text-right font-bold text-indigo-900 tabular-nums">{row.visitas}</td>
                            <td className="py-4 px-6 text-right font-bold text-indigo-900 tabular-nums">{row.propostas}</td>
                            <td className="py-4 px-6 text-right font-bold text-indigo-900 tabular-nums">{row.negocios}</td>
                         </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

            </div>
          ) : (
             <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                <Database size={48} className="mb-4 opacity-20" />
                <p className="font-bold">Aguardando definição de filtros para carregar dados.</p>
             </div>
          )}
        </main>
      </div>
    </div>
  );
}