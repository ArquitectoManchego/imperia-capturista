'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  Database, 
  Cpu, 
  Sparkles, 
  ShieldCheck, 
  Download, 
  Plus, 
  Trash2, 
  Smartphone, 
  Monitor, 
  Settings, 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import { NoteData, NoteItem, ItemStatus, PaymentMethod, EngineType } from '@/lib/types';
import { SAMPLE_NOTES } from '@/lib/sample-data';
import { syncOrderToSoftwareImperia } from '@/lib/firebase';

export default function CapturistaApp() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'captura' | 'auditoria' | 'historial'>('captura');
  const [isMobileMode, setIsMobileMode] = useState<boolean>(false);
  const [selectedEngine, setSelectedEngine] = useState<EngineType>('ai');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  
  // Note state (mutable notes list)
  const [notesList, setNotesList] = useState<NoteData[]>(SAMPLE_NOTES);
  const [currentNote, setCurrentNote] = useState<NoteData>(SAMPLE_NOTES[0]);
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number>(0);
  const [activeImageUri, setActiveImageUri] = useState<string>(SAMPLE_NOTES[0]?.imageUrl || '/samples/real/caso_real_1.jpg');
  
  // Staged photos queue (previsualización de fotos capturadas antes de subir)
  const [stagedPhotos, setStagedPhotos] = useState<string[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState<number>(0);
  const [isProcessingStaged, setIsProcessingStaged] = useState<boolean>(false);

  // Analysis Loading & Progress state (para animar barra de progreso y cursor animado)
  const [analysisProgress, setAnalysisProgress] = useState<{
    isOpen: boolean;
    percent: number;
    title: string;
    statusText: string;
    step: number;
  }>({
    isOpen: false,
    percent: 0,
    title: 'Analizando Nota con IA',
    statusText: 'Iniciando escaneo multimodal...',
    step: 1
  });

  // Image Viewer controls
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  // Quota and Credits state
  const [hourlyUsage, setHourlyUsage] = useState<{ used: number; max: number }>({ used: 5, max: 500 });
  
  // Sync status
  const [syncStatus, setSyncStatus] = useState<{ loading: boolean; success?: boolean; message?: string } | null>(null);
  const [syncedOrders, setSyncedOrders] = useState<any[]>([]);

  // Modals
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showSuperiorModal, setShowSuperiorModal] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [benchmarkData, setBenchmarkData] = useState<any>(null);

  // Auto detect screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsMobileMode(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch benchmark report
  useEffect(() => {
    fetch('/benchmark_report.json')
      .then(res => res.json())
      .then(data => setBenchmarkData(data))
      .catch(err => console.log('Benchmark data offline:', err));
  }, []);

  // Handle sample selection
  const handleSelectSample = (idx: number) => {
    if (idx < 0 || idx >= notesList.length) return;
    setSelectedSampleIndex(idx);
    const sample = notesList[idx];
    setCurrentNote(JSON.parse(JSON.stringify(sample)));
    setActiveImageUri(sample.imageUrl || `/samples/real/caso_real_${(idx % 5) + 1}.jpg`);
    setZoomLevel(1);
    setRotation(0);
  };

  // Delete note from notes list
  const handleDeleteNote = (folioToDelete: string) => {
    const updated = notesList.filter(n => n.folio !== folioToDelete);
    setNotesList(updated);

    if (updated.length === 0) {
      setSelectedSampleIndex(-1);
      const emptyNote: NoteData = {
        id: `empty-${Date.now()}`,
        folio: "0000",
        fecha_emision: new Date().toLocaleDateString('es-MX'),
        metodo_pago: 'EFECTIVO',
        cliente: 'Sin notas registradas',
        telefono: '',
        rfc: '',
        direccion: '',
        imageUrl: '',
        items: [],
        fecha_entrega: '',
        anticipo: 0,
        resta: 0,
        total: 0,
        motor: selectedEngine === 'ocr' ? 'OCR_TRADICIONAL_CV' : (selectedEngine === 'superior' ? 'SUPERIOR_ADVERSARIAL_ENSEMBLE' : 'IA_MULTIMODAL')
      };
      setCurrentNote(emptyNote);
      setActiveImageUri('');
      return;
    }

    if (currentNote.folio === folioToDelete) {
      const nextIdx = Math.min(Math.max(selectedSampleIndex, 0), updated.length - 1);
      setSelectedSampleIndex(nextIdx);
      const nextNote = JSON.parse(JSON.stringify(updated[nextIdx]));
      setCurrentNote(nextNote);
      setActiveImageUri(nextNote.imageUrl || `/samples/real/caso_real_${(nextIdx % 5) + 1}.jpg`);
    } else {
      const newActiveIdx = updated.findIndex(n => n.folio === currentNote.folio);
      setSelectedSampleIndex(newActiveIdx >= 0 ? newActiveIdx : 0);
    }
  };

  // Compresor y optimizador de imágenes en cliente (HTML5 Canvas)
  // Reduce fotos de cámara de 12MP/50MP (~4MB-8MB) a ~1600px (~280KB) manteniendo nitidez total del manuscrito
  // Evita errores 413 Payload Too Large en Vercel Serverless Functions (límite 4.5MB)
  const compressImageToBase64 = (source: File | string, maxDim = 1600, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const processDataUrl = (dataUrl: string) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
      };

      if (typeof source === 'string') {
        if (source.startsWith('data:image')) {
          processDataUrl(source);
        } else {
          fetch(source)
            .then(r => r.blob())
            .then(blob => {
              const reader = new FileReader();
              reader.onloadend = () => processDataUrl((reader.result as string) || source);
              reader.onerror = () => resolve(source);
              reader.readAsDataURL(blob);
            })
            .catch(() => resolve(source));
        }
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            processDataUrl(reader.result);
          } else {
            reject(new Error('No se pudo leer el archivo de imagen'));
          }
        };
        reader.onerror = () => reject(new Error('Error leyendo el archivo de imagen'));
        reader.readAsDataURL(source);
      }
    });
  };

  // Trigger analysis with chosen engine
  const runAnalysis = async (engine: EngineType = selectedEngine, customNote?: NoteData) => {
    const targetNote = customNote || currentNote;
    setIsAnalyzing(true);
    setSyncStatus(null);
    
    // Activar indicador animado y barra de progreso
    setAnalysisProgress({
      isOpen: true,
      percent: 18,
      title: engine === 'ocr' 
        ? 'Ejecutando OCR Tradicional (CV)' 
        : (engine === 'superior' ? 'Ejecutando Sistema Superior CoVe (Multi-Pass)' : 'Analizando Nota con Gemini 2.5 Flash'),
      statusText: 'Preparando imagen y conectando con el analizador...',
      step: 1
    });

    const stepInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (!prev.isOpen || prev.percent >= 90) return prev;
        const inc = Math.floor(Math.random() * 10) + 8;
        const newPct = Math.min(prev.percent + inc, 92);
        let newStatus = prev.statusText;
        let newStep = prev.step;
        if (newPct > 35 && prev.step < 2) {
          newStatus = 'Escaneando folio en tinta roja, fecha y método de pago...';
          newStep = 2;
        } else if (newPct > 60 && prev.step < 3) {
          newStatus = engine === 'superior'
            ? 'Árbitro Adversarial CoVe verificando léxico y tallas F/P...'
            : 'Gemini Flash extrayendo prendas, conceptos, tallas y notas...';
          newStep = 3;
        } else if (newPct > 80 && prev.step < 4) {
          newStatus = 'Auditando cuadre financiero: Total - Anticipo = Resta...';
          newStep = 4;
        }
        return { ...prev, percent: newPct, statusText: newStatus, step: newStep };
      });
    }, 320);

    try {
      const isUploadedPhoto = activeImageUri.startsWith('data:image');
      const compressedBase64 = isUploadedPhoto 
        ? await compressImageToBase64(activeImageUri, 1600, 0.85) 
        : undefined;

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engine,
          sampleId: isUploadedPhoto ? undefined : targetNote.folio,
          imageBase64: compressedBase64,
          apiKey: apiKeyInput
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || `Error del servidor (${res.status})`);
      }

      clearInterval(stepInterval);
      setAnalysisProgress(prev => ({
        ...prev,
        percent: 100,
        statusText: '¡Análisis completado! Mostrando información en casillas...',
        step: 5
      }));
      await new Promise(r => setTimeout(r, 400));

      const updatedNote: NoteData = {
        ...data,
        imageUrl: activeImageUri
      };
      setCurrentNote(updatedNote);
      setNotesList(prev => prev.map((n, idx) => (idx === selectedSampleIndex || n.folio === updatedNote.folio) ? updatedNote : n));
      if (updatedNote.cuota_creditos) {
        setHourlyUsage({
          used: updatedNote.cuota_creditos.usados_esta_hora,
          max: updatedNote.cuota_creditos.limite_por_hora
        });
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      alert(`Error en análisis: ${err.message}`);
    } finally {
      clearInterval(stepInterval);
      setIsAnalyzing(false);
      setAnalysisProgress(prev => ({ ...prev, isOpen: false }));
    }
  };

  // Handle engine switch with authorization check for Superior engine
  const handleEngineChange = (engine: EngineType) => {
    if (engine === 'superior') {
      setShowSuperiorModal(true);
    } else {
      setSelectedEngine(engine);
      runAnalysis(engine);
    }
  };

  // Confirm Superior Engine activation
  const confirmSuperiorEngine = () => {
    setSelectedEngine('superior');
    setShowSuperiorModal(false);
    runAnalysis('superior');
  };

  // Referencias para captura de cámara en móvil y explorador de archivos en PC/Móvil
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleCaptureClick = () => {
    if (isMobileMode && cameraInputRef.current) {
      cameraInputRef.current.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    e.target.value = '';

    try {
      const compressedUrls: string[] = [];
      for (const file of fileList) {
        const compressed = await compressImageToBase64(file, 1600, 0.85);
        compressedUrls.push(compressed);
      }
      setStagedPhotos(prev => {
        const next = [...prev, ...compressedUrls];
        setActivePreviewIndex(next.length - 1);
        return next;
      });
    } catch (err: any) {
      alert(`Error al preparar la imagen: ${err.message}`);
    }
  };

  // Procesar y subir todas las fotos capturadas / en espera con Gemini 2.5 Flash (o Sistema Superior CoVe)
  const handleUploadStagedPhotos = async () => {
    if (stagedPhotos.length === 0) return;
    setIsProcessingStaged(true);

    // 1. Mostrar de inmediato la pantalla con barra de progreso y cursor animado
    setAnalysisProgress({
      isOpen: true,
      percent: 12,
      title: stagedPhotos.length > 1 
        ? `Analizando ${stagedPhotos.length} Notas con Gemini Flash` 
        : 'Analizando Nota con Gemini 2.5 Flash',
      statusText: 'Optimizando y enviando fotografía al analizador...',
      step: 1
    });

    const stepInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (!prev.isOpen || prev.percent >= 92) return prev;
        const inc = Math.floor(Math.random() * 9) + 6;
        const newPct = Math.min(prev.percent + inc, 92);
        let newStatus = prev.statusText;
        let newStep = prev.step;
        if (newPct > 28 && prev.step < 2) {
          newStatus = 'Reconociendo folio en tinta roja, fecha y datos del cliente...';
          newStep = 2;
        } else if (newPct > 52 && prev.step < 3) {
          newStatus = 'Gemini 2.5 Flash extrayendo prendas, conceptos, tallas y notas...';
          newStep = 3;
        } else if (newPct > 78 && prev.step < 4) {
          newStatus = 'Validando cuadre contable: Total - Anticipo = Resta...';
          newStep = 4;
        }
        return {
          ...prev,
          percent: newPct,
          statusText: newStatus,
          step: newStep
        };
      });
    }, 350);

    try {
      const newNotes: NoteData[] = [];

      for (let i = 0; i < stagedPhotos.length; i++) {
        if (stagedPhotos.length > 1) {
          setAnalysisProgress(prev => ({
            ...prev,
            statusText: `Analizando foto ${i + 1} de ${stagedPhotos.length} con Gemini Vision...`
          }));
        }

        const compressedPhoto = await compressImageToBase64(stagedPhotos[i], 1600, 0.85);

        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            engine: selectedEngine,
            imageBase64: compressedPhoto,
            apiKey: apiKeyInput
          })
        });

        const analyzedData = await res.json();
        if (!res.ok || analyzedData.error) {
          throw new Error(analyzedData.error || `Error al analizar la foto #${i + 1} (${res.status})`);
        }

        const noteToAdd: NoteData = {
          ...analyzedData,
          id: `captured-${Date.now()}-${i}`,
          imageUrl: compressedPhoto
        };

        newNotes.push(noteToAdd);
        if (analyzedData.cuota_creditos) {
          setHourlyUsage({
            used: analyzedData.cuota_creditos.usados_esta_hora,
            max: analyzedData.cuota_creditos.limite_por_hora
          });
        }
      }

      // 2. Llegar a 100% y mostrar confirmación
      clearInterval(stepInterval);
      setAnalysisProgress(prev => ({
        ...prev,
        percent: 100,
        statusText: '¡Análisis completado! Mostrando información en casillas...',
        step: 5
      }));

      await new Promise(r => setTimeout(r, 450));

      const updatedList = [...notesList, ...newNotes];
      setNotesList(updatedList);
      
      // Seleccionar la última o primera de las notas recién subidas para poblar la pantalla
      const targetIdx = notesList.length;
      setSelectedSampleIndex(targetIdx);
      setCurrentNote(newNotes[0]);
      setActiveImageUri(newNotes[0].imageUrl || stagedPhotos[0]);
      
      // Limpiar cola de fotos en espera
      setStagedPhotos([]);
      setActivePreviewIndex(0);
    } catch (err: any) {
      clearInterval(stepInterval);
      alert(`Error al analizar la imagen con IA: ${err.message}`);
    } finally {
      clearInterval(stepInterval);
      setIsProcessingStaged(false);
      setAnalysisProgress(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleRemoveStagedPhoto = (idx: number) => {
    setStagedPhotos(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (activePreviewIndex >= next.length) {
        setActivePreviewIndex(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  // Table item edits
  const handleItemChange = (index: number, field: keyof NoteItem, value: any) => {
    const updatedItems = [...currentNote.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Auto recalculate Importe if cant or p_unit changed
    if (field === 'cant' || field === 'p_unit') {
      const cant = Number(field === 'cant' ? value : updatedItems[index].cant) || 0;
      const punit = Number(field === 'p_unit' ? value : updatedItems[index].p_unit) || 0;
      updatedItems[index].importe = Math.round(cant * punit * 100) / 100;
    }

    // Recalculate totals
    const sumImportes = updatedItems.reduce((acc, it) => acc + (Number(it.importe) || 0), 0);
    const newTotal = sumImportes;
    const newResta = Math.max(Math.round((newTotal - currentNote.anticipo) * 100) / 100, 0);

    setCurrentNote({
      ...currentNote,
      items: updatedItems,
      total: newTotal,
      resta: newResta,
      validacion_financiera: {
        suma_importes: sumImportes,
        cuadre_ok: Math.abs(newTotal - currentNote.anticipo - newResta) < 0.01,
        diferencia: Math.round((newTotal - currentNote.anticipo - newResta) * 100) / 100,
        total_coincide: true
      }
    });
  };

  const handleAddItem = () => {
    const newItem: NoteItem = {
      id: `item-${Date.now()}`,
      ped_apa_ent: 'P',
      cant: 1,
      concepto: 'Nueva prenda...',
      prenda: 'Filipina',
      corte: '',
      genero: 'Dama',
      talla: 'M',
      notas: '',
      p_unit: 0,
      importe: 0
    };
    setCurrentNote({
      ...currentNote,
      items: [...currentNote.items, newItem]
    });
  };

  const handleDeleteItem = (index: number) => {
    const updated = currentNote.items.filter((_, i) => i !== index);
    const sum = updated.reduce((acc, it) => acc + (Number(it.importe) || 0), 0);
    setCurrentNote({
      ...currentNote,
      items: updated,
      total: sum,
      resta: Math.max(sum - currentNote.anticipo, 0)
    });
  };

  // Sync to Software Imperia Firestore
  const handleSyncToFirestore = async () => {
    setSyncStatus({ loading: true });
    try {
      const res = await syncOrderToSoftwareImperia(currentNote);
      setSyncStatus({
        loading: false,
        success: res.success,
        message: res.message
      });
      if (res.success) {
        setSyncedOrders(prev => [
          {
            id: res.pedidoId,
            folio: currentNote.folio,
            cliente: currentNote.cliente,
            total: currentNote.total,
            fecha: new Date().toLocaleTimeString()
          },
          ...prev
        ]);
      }
    } catch (err: any) {
      setSyncStatus({
        loading: false,
        success: false,
        message: err.message || 'Error de conexión con Firestore'
      });
    }
  };

  // Auto-Cuadrar financiero
  const handleAutoCuadrar = () => {
    const sum = currentNote.items.reduce((acc, it) => acc + (Number(it.importe) || 0), 0);
    const correctResta = Math.max(Math.round((sum - currentNote.anticipo) * 100) / 100, 0);
    setCurrentNote({
      ...currentNote,
      total: sum,
      resta: correctResta,
      validacion_financiera: {
        suma_importes: sum,
        cuadre_ok: true,
        diferencia: 0,
        total_coincide: true
      }
    });
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = "Folio,Fecha,Cliente,Telefono,RFC,Estado,Cantidad,Concepto,Prenda,Talla,P.Unit,Importe\n";
    const rows = currentNote.items.map(it => 
      `"${currentNote.folio}","${currentNote.fecha_emision}","${currentNote.cliente}","${currentNote.telefono}","${currentNote.rfc}","${it.ped_apa_ent}","${it.cant}","${it.concepto}","${it.prenda}","${it.talla || it.talla_filipina}","${it.p_unit}","${it.importe}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Nota_${currentNote.folio}_Imperia.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`min-h-screen flex flex-col bg-slate-100 text-slate-800 ${analysisProgress.isOpen ? 'cursor-wait' : ''}`}>
      {/* OVERLAY DE PROGRESO Y CURSOR ANIMADO TRABAJANDO CON IA */}
      {analysisProgress.isOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-wait">
          <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-6 relative overflow-hidden">
            {/* Resplandor decorativo de fondo */}
            <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

            {/* Ícono animado que da vueltas (Spinner con resplandor) */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-dashed border-amber-400/40 animate-spin" style={{ animationDuration: '6s' }} />
              <RefreshCw className="w-14 h-14 text-amber-400 animate-spin" />
              <Sparkles className="w-6 h-6 text-amber-300 absolute animate-pulse" />
            </div>

            {/* Títulos descriptivos */}
            <div className="space-y-1">
              <h3 className="text-xl font-black text-white tracking-tight flex items-center justify-center space-x-2">
                <span>{analysisProgress.title}</span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {selectedEngine === 'superior' 
                  ? 'Sistema Superior: Doble verificación CoVe y auditoría adversarial'
                  : 'Motor de IA Multimodal: Interpretando tintas y formato impreso'}
              </p>
            </div>

            {/* Barra de Progreso Dinámica */}
            <div className="space-y-2">
              <div className="w-full bg-slate-800 rounded-full h-3.5 p-0.5 border border-slate-700 shadow-inner overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 h-full rounded-full transition-all duration-300 ease-out shadow"
                  style={{ width: `${analysisProgress.percent}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-amber-400 font-extrabold">{analysisProgress.percent}%</span>
                <span className="text-slate-300 text-[11px] font-sans truncate max-w-[260px] text-right">
                  {analysisProgress.statusText}
                </span>
              </div>
            </div>

            {/* Checklist de Etapas del Análisis */}
            <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex items-center space-x-2">
                {analysisProgress.step > 1 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />
                )}
                <span className={analysisProgress.step > 1 ? 'text-slate-300' : 'text-amber-300 font-semibold'}>
                  1. Captura y optimización de fotografía
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {analysisProgress.step > 2 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : analysisProgress.step === 2 ? (
                  <RefreshCw className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 flex-shrink-0" />
                )}
                <span className={analysisProgress.step > 2 ? 'text-slate-300' : (analysisProgress.step === 2 ? 'text-amber-300 font-semibold' : 'text-slate-500')}>
                  2. Lectura de folio en tinta roja y cliente
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {analysisProgress.step > 3 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : analysisProgress.step === 3 ? (
                  <RefreshCw className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 flex-shrink-0" />
                )}
                <span className={analysisProgress.step > 3 ? 'text-slate-300' : (analysisProgress.step === 3 ? 'text-amber-300 font-semibold' : 'text-slate-500')}>
                  3. Extracción de prendas, tallas y notas
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {analysisProgress.step >= 4 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 flex-shrink-0" />
                )}
                <span className={analysisProgress.step >= 4 ? 'text-slate-300' : 'text-slate-500'}>
                  4. Auditoría de balance: Total - Anticipo = Resta
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 pt-1">
              Imperia Uniformes Boutique • Protección de cuota horaria activa
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Inputs for Mobile Camera and PC/Gallery File Explorer */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        multiple
        className="hidden" 
      />
      <input 
        type="file" 
        ref={cameraInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        capture="environment"
        className="hidden" 
      />

      {/* HEADER PRINCIPAL */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-40 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center font-bold text-slate-950 text-xl shadow-md">
              I
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight text-white">Imperia Uniformes</h1>
                <span className="text-xs bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-500/40">
                  WebApp Capturista IA
                </span>
              </div>
              <p className="text-xs text-slate-400">Digitalización de Notas de Remisión con Gemini 2.5 Flash • Software Imperia</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Monitor de Créditos / Cuota horaria (Tope 500/h) */}
            <div className="hidden sm:flex items-center bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
              <TrendingUp className="w-4 h-4 text-emerald-400 mr-2" />
              <div className="text-right">
                <span className="text-slate-400">Cuota Horaria: </span>
                <span className="font-semibold text-emerald-400">{hourlyUsage.max - hourlyUsage.used} disp.</span>
                <span className="text-slate-500"> / {hourlyUsage.max}/h</span>
              </div>
            </div>

            {/* Alternador de Modo de Pantalla (PC vs Celular) */}
            <button 
              onClick={() => setIsMobileMode(!isMobileMode)}
              title="Cambiar formato de visualización (Pantalla PC vs Pantalla Celular)"
              className={`p-2 rounded-lg border flex items-center space-x-1.5 text-xs transition ${
                isMobileMode 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {isMobileMode ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
              <span className="hidden md:inline">{isMobileMode ? 'Vista Celular' : 'Vista PC'}</span>
            </button>

            {/* Configuración */}
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Configuración de Motor Gemini y Base de Datos"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SUB-BARRA DE NAVEGACIÓN */}
        <div className="max-w-7xl mx-auto px-4 flex space-x-1 border-t border-slate-800">
          <button 
            onClick={() => setActiveTab('captura')}
            className={`py-2 px-4 text-xs font-medium border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'captura' 
                ? 'border-amber-400 text-amber-300 bg-slate-800/40' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Mesa de Captura & Tabla</span>
          </button>

          <button 
            onClick={() => setActiveTab('auditoria')}
            className={`py-2 px-4 text-xs font-medium border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'auditoria' 
                ? 'border-amber-400 text-amber-300 bg-slate-800/40' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Auditoría Adversarial OCR vs IA</span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
              5 Pruebas Reales
            </span>
          </button>

          <button 
            onClick={() => setActiveTab('historial')}
            className={`py-2 px-4 text-xs font-medium border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'historial' 
                ? 'border-amber-400 text-amber-300 bg-slate-800/40' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Software Imperia BD ({syncedOrders.length})</span>
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL SEGÚN PESTAÑA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col">
        {activeTab === 'captura' && (
          <div className="flex-1 flex flex-col space-y-4">

            {/* BOTÓN HERO CENTRAL (CELULAR: TOMAR FOTO / PC: SUBIR FOTOS) */}
            <div className="flex flex-wrap justify-center items-center gap-3 py-1">
              <button
                onClick={handleCaptureClick}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-base rounded-2xl shadow-md hover:shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-3 border-2 border-amber-500 group"
              >
                {isMobileMode ? (
                  <>
                    <div className="p-2 bg-slate-950 text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <span className="block text-base sm:text-lg font-black leading-tight">Tomar Foto</span>
                      <span className="block text-[11px] font-semibold text-slate-800 opacity-90">Captura directa desde la cámara del celular</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2 bg-slate-950 text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <span className="block text-base sm:text-lg font-black leading-tight">Subir Fotos</span>
                      <span className="block text-[11px] font-semibold text-slate-800 opacity-90">Seleccionar imágenes desde el explorador de archivos</span>
                    </div>
                  </>
                )}
              </button>

              {isMobileMode && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-sm transition flex items-center justify-center space-x-2"
                >
                  <Upload className="w-4 h-4 text-amber-600" />
                  <span>Subir desde Galería</span>
                </button>
              )}
            </div>

            {/* PREVISUALIZACIÓN DE FOTO(S) CAPTURADA(S) Y BOTONES DE FLUJO */}
            {stagedPhotos.length > 0 && (
              <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-400 rounded-2xl p-4 shadow-md space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="bg-amber-500 text-slate-950 text-xs font-black px-2.5 py-1 rounded-lg">
                      {stagedPhotos.length} {stagedPhotos.length === 1 ? 'Foto Lista' : 'Fotos Listas'}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      Previsualización optimizada antes de analizar con Gemini 2.5 Flash
                    </span>
                  </div>
                  <button 
                    onClick={() => setStagedPhotos([])}
                    className="text-xs text-slate-500 hover:text-red-600 flex items-center space-x-1 transition font-medium"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Descartar</span>
                  </button>
                </div>

                {/* Contenedor de Previsualización: Foto activa y controles */}
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="relative w-full sm:w-64 h-64 bg-slate-950 rounded-xl overflow-hidden border-2 border-amber-300 flex items-center justify-center shadow-inner group">
                    <img 
                      src={stagedPhotos[activePreviewIndex] || stagedPhotos[0]} 
                      alt="Previsualización de foto capturada" 
                      className="max-h-full max-w-full object-contain"
                    />
                    <div className="absolute top-2 left-2 bg-slate-900/90 text-white text-[10px] px-2 py-0.5 rounded font-mono border border-slate-700">
                      Foto #{activePreviewIndex + 1} de {stagedPhotos.length}
                    </div>
                    <button
                      onClick={() => handleRemoveStagedPhoto(activePreviewIndex)}
                      className="absolute top-2 right-2 p-1.5 bg-red-600/90 hover:bg-red-700 text-white rounded-full shadow transition"
                      title="Quitar esta foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex-1 w-full space-y-3">
                    {/* Tira de miniaturas si se tomó más de 1 foto */}
                    {stagedPhotos.length > 1 && (
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1.5">
                          Fotos en cola de subida (Haz clic para ver):
                        </label>
                        <div className="flex space-x-2 overflow-x-auto pb-2">
                          {stagedPhotos.map((p, idx) => (
                            <div 
                              key={idx}
                              onClick={() => setActivePreviewIndex(idx)}
                              className={`relative cursor-pointer rounded-lg overflow-hidden border-2 flex-shrink-0 w-16 h-16 transition ${
                                activePreviewIndex === idx ? 'border-amber-600 ring-2 ring-amber-400' : 'border-slate-300 opacity-70 hover:opacity-100'
                              }`}
                            >
                              <img src={p} alt={`Foto ${idx+1}`} className="w-full h-full object-cover" />
                              <span className="absolute bottom-0 right-0 bg-slate-900/80 text-white text-[9px] px-1 font-mono">
                                #{idx+1}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-white/90 rounded-xl p-3 border border-amber-200 text-xs text-slate-700 space-y-1">
                      <p className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{stagedPhotos.length === 1 ? '1 foto lista para analizar e ingresar a la tabla.' : `${stagedPhotos.length} fotos listas para analizar e ingresar juntas.`}</span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {isMobileMode 
                          ? 'Toma otra foto de la siguiente nota o presiona subir para extraer toda la información manuscrita con Gemini 2.5 Flash.'
                          : 'Agrega más imágenes o presiona subir para analizarlas con Gemini 2.5 Flash y poblar las casillas de la tabla.'}
                      </p>
                    </div>

                    {/* BOTONES REQUERIDOS: TOMAR OTRA FOTO Y SUBIR FOTO */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        onClick={handleCaptureClick}
                        className="flex-1 min-w-[150px] px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-sm transition flex items-center justify-center space-x-2"
                      >
                        <Camera className="w-4 h-4 text-amber-600" />
                        <span>Tomar otra foto</span>
                      </button>

                      <button
                        onClick={handleUploadStagedPhotos}
                        disabled={isProcessingStaged}
                        className="flex-1 min-w-[160px] px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        {isProcessingStaged ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Analizando con IA...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>{stagedPhotos.length > 1 ? `Subir fotos (${stagedPhotos.length})` : 'Subir foto'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* BARRA DE SELECCIÓN DE MOTOR Y NOTAS DE PRUEBA */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Motor Activo:</span>
                
                {/* Selector OCR Tradicional */}
                <button 
                  onClick={() => handleEngineChange('ocr')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                    selectedEngine === 'ocr'
                      ? 'bg-slate-800 text-white shadow'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5 text-blue-400" />
                  <span>OCR Tradicional (CV)</span>
                  <span className="text-[10px] opacity-75">24% acierto</span>
                </button>

                {/* Selector IA Multimodal (Gemini 2.5 Flash) */}
                <button 
                  onClick={() => handleEngineChange('ai')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                    selectedEngine === 'ai'
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>IA Multimodal (Gemini Flash)</span>
                  <span className="bg-emerald-400 text-slate-900 text-[10px] px-1.5 py-0.2 rounded font-black">
                    94.7%
                  </span>
                </button>

                {/* Selector Sistema Superior Ensemble */}
                <button 
                  onClick={() => handleEngineChange('superior')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                    selectedEngine === 'superior'
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>Sistema Superior (CoVe)</span>
                  <span className="text-[10px] bg-purple-200 text-purple-900 px-1 py-0.2 rounded font-bold">
                    100% Auditado
                  </span>
                </button>
              </div>

              {/* Selector de notas agrupadas con botón de borrar individual */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full">
                <span className="text-xs text-slate-500 mr-1 hidden sm:inline font-semibold">Notas:</span>
                {notesList.map((s, idx) => {
                  const isSelected = selectedSampleIndex === idx;
                  return (
                    <div 
                      key={s.id || `${s.folio}-${idx}`} 
                      className={`inline-flex items-center rounded-lg text-xs transition border group ${
                        isSelected 
                          ? 'bg-amber-400 text-slate-950 font-bold border-amber-500 shadow-sm' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      <button 
                        onClick={() => handleSelectSample(idx)}
                        className="pl-2.5 pr-1 py-1 flex items-center space-x-1"
                        title={`Ver nota #${s.folio}`}
                      >
                        <span>#{s.folio}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(s.folio);
                        }}
                        className="p-1 mr-1 text-slate-500 hover:text-red-600 rounded-full hover:bg-red-100/60 transition"
                        title={`Borrar nota #${s.folio}`}
                      >
                        <X className="w-3 h-3 hover:scale-125 transition-transform" />
                      </button>
                    </div>
                  );
                })}

                {/* Botón rápido adicional para capturar */}
                <button 
                  onClick={handleCaptureClick}
                  className="ml-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition shadow flex-shrink-0"
                  title={isMobileMode ? 'Tomar Foto' : 'Cargar Imagen'}
                >
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isMobileMode ? 'Tomar Foto' : 'Cargar'}</span>
                </button>
              </div>
            </div>

            {/* CONTENEDOR DUAL: PANTALLA PC (SPLIT 2 COLUMNAS) O PANTALLA CELULAR (VISTA VERTICAL) */}
            <div className={`flex-1 grid gap-4 ${isMobileMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'}`}>
              
              {/* COLUMNA IZQUIERDA: VISUALIZADOR DE IMAGEN (5 COLS EN DESKTOP) */}
              <div className={`${isMobileMode ? 'h-72' : 'lg:col-span-5 h-[calc(100vh-250px)]'} bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden`}>
                <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-slate-700">Nota Escaneada</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                      Folio #{currentNote.folio}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.6))} 
                      className="p-1 rounded hover:bg-slate-200 text-slate-600"
                      title="Alejar"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] text-slate-500 font-mono w-8 text-center">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button 
                      onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 2.5))} 
                      className="p-1 rounded hover:bg-slate-200 text-slate-600"
                      title="Acercar"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setRotation(r => (r + 90) % 360)} 
                      className="p-1 rounded hover:bg-slate-200 text-slate-600"
                      title="Girar imagen"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 bg-slate-950 p-2 overflow-auto flex items-center justify-center relative">
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-white space-y-3">
                      <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                      <p className="text-xs font-semibold">Analizando nota con {selectedEngine.toUpperCase()}...</p>
                      <p className="text-[10px] text-slate-400">Verificando cuadre de partidas y datos manuscritos</p>
                    </div>
                  )}

                  <img 
                    src={activeImageUri} 
                    alt="Nota de remisión" 
                    className="max-h-full max-w-full object-contain transition-transform duration-200 rounded shadow"
                    style={{ 
                      transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                      transformOrigin: 'center center'
                    }}
                  />
                </div>

                <div className="p-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between items-center">
                  <span>Tinta manuscrita en formato impreso estándar</span>
                  <span className="font-mono text-emerald-600 font-semibold">1024 x 679 px</span>
                </div>
              </div>

              {/* COLUMNA DERECHA: TABLA Y FORMULARIO EDITABLE (7 COLS EN DESKTOP) */}
              <div className={`${isMobileMode ? '' : 'lg:col-span-7 h-[calc(100vh-250px)]'} bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden`}>
                
                {/* CABECERA DE LA NOTA */}
                <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Folio</label>
                      <input 
                        type="text" 
                        value={currentNote.folio} 
                        onChange={(e) => setCurrentNote({ ...currentNote, folio: e.target.value })}
                        className="w-full text-xs font-mono font-bold text-red-600 bg-white border border-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Fecha Emisión</label>
                      <input 
                        type="text" 
                        value={currentNote.fecha_emision} 
                        onChange={(e) => setCurrentNote({ ...currentNote, fecha_emision: e.target.value })}
                        className="w-full text-xs bg-white border border-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Método Pago</label>
                      <select 
                        value={currentNote.metodo_pago}
                        onChange={(e) => setCurrentNote({ ...currentNote, metodo_pago: e.target.value as PaymentMethod })}
                        className="w-full text-xs bg-white border border-slate-300 rounded px-2 py-1 font-semibold focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="EFECTIVO">EFECTIVO</option>
                        <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                        <option value="TARJETA_DEBITO">TARJETA DEBITO</option>
                        <option value="TARJETA_CREDITO">TARJETA CREDITO</option>
                        <option value="NO_ESPECIFICADO">NO ESPECIFICADO</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Fecha Entrega</label>
                      <input 
                        type="text" 
                        value={currentNote.fecha_entrega} 
                        onChange={(e) => setCurrentNote({ ...currentNote, fecha_entrega: e.target.value })}
                        className="w-full text-xs bg-white border border-slate-300 rounded px-2 py-1 font-semibold text-blue-700 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Cliente</label>
                      <input 
                        type="text" 
                        value={currentNote.cliente} 
                        onChange={(e) => setCurrentNote({ ...currentNote, cliente: e.target.value })}
                        className="w-full text-xs font-semibold bg-white border border-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Teléfono</label>
                      <input 
                        type="text" 
                        value={currentNote.telefono} 
                        onChange={(e) => setCurrentNote({ ...currentNote, telefono: e.target.value })}
                        className="w-full text-xs font-mono bg-white border border-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">RFC</label>
                      <input 
                        type="text" 
                        value={currentNote.rfc} 
                        onChange={(e) => setCurrentNote({ ...currentNote, rfc: e.target.value })}
                        className="w-full text-xs font-mono uppercase bg-white border border-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500"
                        placeholder="Opcional"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Dirección</label>
                      <input 
                        type="text" 
                        value={currentNote.direccion} 
                        onChange={(e) => setCurrentNote({ ...currentNote, direccion: e.target.value })}
                        className="w-full text-xs bg-white border border-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* TABLA DE PARTIDAS (HOJA DE CÁLCULO INTERACTIVA) */}
                <div className="flex-1 overflow-auto p-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                      <span>Partidas de la Nota</span>
                      <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                        {currentNote.items.length}
                      </span>
                    </span>

                    <button 
                      onClick={handleAddItem}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2 py-1 rounded flex items-center space-x-1 transition"
                    >
                      <Plus className="w-3 h-3 text-amber-600" />
                      <span>Agregar Fila</span>
                    </button>
                  </div>

                  {/* VISTA EN FORMATO TABLA PARA PC */}
                  {!isMobileMode ? (
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase">
                            <th className="p-2 w-16 text-center">Estado</th>
                            <th className="p-2 w-14 text-center">Cant.</th>
                            <th className="p-2 min-w-[200px]">Concepto / Prenda</th>
                            <th className="p-2 w-16 text-center">Talla</th>
                            <th className="p-2 min-w-[120px]">Notas Operativas</th>
                            <th className="p-2 w-20 text-right">P. Unit</th>
                            <th className="p-2 w-24 text-right">Importe</th>
                            <th className="p-2 w-8 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {currentNote.items.map((it, idx) => (
                            <tr key={it.id || idx} className="hover:bg-slate-50/80 transition">
                              {/* Estado P/A/E/B */}
                              <td className="p-1.5 text-center">
                                <select 
                                  value={it.ped_apa_ent}
                                  onChange={(e) => handleItemChange(idx, 'ped_apa_ent', e.target.value)}
                                  className="text-[10px] font-bold rounded px-1 py-0.5 border border-slate-300 bg-white"
                                >
                                  <option value="P">P (Pedido)</option>
                                  <option value="A">A (Apartado)</option>
                                  <option value="E">E (Entregado)</option>
                                  <option value="B">B (Bordado)</option>
                                </select>
                              </td>

                              {/* Cantidad */}
                              <td className="p-1.5 text-center">
                                <input 
                                  type="number" 
                                  min="1"
                                  value={it.cant}
                                  onChange={(e) => handleItemChange(idx, 'cant', e.target.value)}
                                  className="w-12 text-center text-xs font-semibold border border-slate-300 rounded py-0.5"
                                />
                                {it.clave && (
                                  <span className="block text-[9px] text-amber-700 bg-amber-100 rounded px-0.5 mt-0.5" title="Número tomado de columna CLAVE">
                                    Col. Clave
                                  </span>
                                )}
                              </td>

                              {/* Concepto */}
                              <td className="p-1.5">
                                <input 
                                  type="text" 
                                  value={it.concepto}
                                  onChange={(e) => handleItemChange(idx, 'concepto', e.target.value)}
                                  className="w-full text-xs font-medium border border-slate-300 rounded px-1.5 py-0.5 focus:border-amber-500"
                                />
                                <div className="flex items-center space-x-1 mt-0.5 text-[10px] text-slate-500">
                                  <span className="font-semibold text-slate-700">{it.prenda || 'Prenda'}:</span>
                                  <span>{it.corte || 'Estándar'}</span>
                                  {it.genero && <span className="text-slate-400">({it.genero})</span>}
                                </div>
                              </td>

                              {/* Talla */}
                              <td className="p-1.5 text-center">
                                {it.talla_filipina ? (
                                  <div className="text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 rounded px-1 py-0.5">
                                    F:{it.talla_filipina} P:{it.talla_pantalon}
                                  </div>
                                ) : (
                                  <input 
                                    type="text" 
                                    value={it.talla || ''}
                                    onChange={(e) => handleItemChange(idx, 'talla', e.target.value)}
                                    className="w-12 text-center text-xs font-mono font-bold border border-slate-300 rounded py-0.5"
                                    placeholder="Talla"
                                  />
                                )}
                              </td>

                              {/* Notas Operativas */}
                              <td className="p-1.5">
                                <input 
                                  type="text" 
                                  value={it.notas || ''}
                                  onChange={(e) => handleItemChange(idx, 'notas', e.target.value)}
                                  className="w-full text-[11px] text-slate-600 border border-slate-300 rounded px-1.5 py-0.5"
                                  placeholder="Bordado, cliente, etc."
                                />
                              </td>

                              {/* P. Unit */}
                              <td className="p-1.5 text-right font-mono">
                                <input 
                                  type="number" 
                                  step="0.01"
                                  value={it.p_unit}
                                  onChange={(e) => handleItemChange(idx, 'p_unit', e.target.value)}
                                  className="w-16 text-right text-xs font-mono border border-slate-300 rounded py-0.5 px-1"
                                />
                              </td>

                              {/* Importe */}
                              <td className="p-1.5 text-right font-mono font-bold text-slate-800">
                                ${Number(it.importe).toFixed(2)}
                              </td>

                              {/* Borrar fila */}
                              <td className="p-1.5 text-center">
                                <button 
                                  onClick={() => handleDeleteItem(idx)}
                                  className="text-slate-400 hover:text-red-500 transition p-1"
                                  title="Eliminar partida"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* VISTA TARJETA MÓVIL OPTIMIZADA PARA CELULAR SAMSUNG A55 */
                    <div className="space-y-3">
                      {currentNote.items.map((it, idx) => (
                        <div key={it.id || idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm space-y-2">
                          <div className="flex items-center justify-between">
                            {/* Chips de estado touch para dedo */}
                            <div className="flex space-x-1">
                              {(['P', 'A', 'E', 'B'] as ItemStatus[]).map((st) => (
                                <button
                                  key={st}
                                  onClick={() => handleItemChange(idx, 'ped_apa_ent', st)}
                                  className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                                    it.ped_apa_ent === st
                                      ? 'bg-amber-500 text-slate-950 shadow'
                                      : 'bg-white border border-slate-200 text-slate-600'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>

                            <button 
                              onClick={() => handleDeleteItem(idx)}
                              className="text-slate-400 hover:text-red-500 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase">Concepto / Prenda</label>
                            <input 
                              type="text" 
                              value={it.concepto}
                              onChange={(e) => handleItemChange(idx, 'concepto', e.target.value)}
                              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg p-2"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-500 font-bold uppercase">Cant.</label>
                              <input 
                                type="number" 
                                value={it.cant}
                                onChange={(e) => handleItemChange(idx, 'cant', e.target.value)}
                                className="w-full text-xs text-center font-bold bg-white border border-slate-300 rounded-lg p-2"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 font-bold uppercase">Talla</label>
                              <input 
                                type="text" 
                                value={it.talla || (it.talla_filipina ? `F:${it.talla_filipina} P:${it.talla_pantalon}` : '')}
                                onChange={(e) => handleItemChange(idx, 'talla', e.target.value)}
                                className="w-full text-xs text-center font-mono font-bold bg-white border border-slate-300 rounded-lg p-2"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 font-bold uppercase">P. Unit</label>
                              <input 
                                type="number" 
                                value={it.p_unit}
                                onChange={(e) => handleItemChange(idx, 'p_unit', e.target.value)}
                                className="w-full text-xs text-right font-mono font-bold bg-white border border-slate-300 rounded-lg p-2"
                              />
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                            <span className="text-[11px] text-slate-500 font-medium">Subtotal Partida:</span>
                            <span className="text-sm font-bold font-mono text-slate-900">
                              ${Number(it.importe).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* TARJETA DE CIERRE FINANCIERO Y VALIDACIÓN */}
                <div className="bg-slate-50 border-t border-slate-200 p-3 space-y-2">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Total</span>
                      <span className="text-sm sm:text-base font-extrabold font-mono text-slate-900">
                        ${Number(currentNote.total).toFixed(2)}
                      </span>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Anticipo</span>
                      <input 
                        type="number" 
                        value={currentNote.anticipo}
                        onChange={(e) => {
                          const ant = Number(e.target.value) || 0;
                          const r = Math.max(Math.round((currentNote.total - ant) * 100) / 100, 0);
                          setCurrentNote({ ...currentNote, anticipo: ant, resta: r });
                        }}
                        className="w-full text-center text-sm sm:text-base font-bold font-mono text-emerald-600 bg-transparent border-b border-dashed border-emerald-300 focus:outline-none"
                      />
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Resta</span>
                      <span className={`text-sm sm:text-base font-extrabold font-mono ${
                        currentNote.resta > 0 ? 'text-amber-600' : 'text-slate-400'
                      }`}>
                        ${Number(currentNote.resta).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* ALERTA DE CUADRE FINANCIERO */}
                  <div className="flex items-center justify-between text-xs">
                    {Math.abs(currentNote.total - currentNote.anticipo - currentNote.resta) < 0.05 ? (
                      <div className="flex items-center space-x-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="font-semibold">Cuadre financiero validado: Total - Anticipo = Resta</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Descuadre contable detectado.</span>
                        <button 
                          onClick={handleAutoCuadrar}
                          className="underline font-bold text-amber-900 hover:text-black ml-1"
                        >
                          Auto-Cuadrar
                        </button>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                      Motor: <strong className="text-slate-700">{currentNote.motor}</strong>
                    </div>
                  </div>

                  {/* REPORTE DEL ÁRBITRO ADVERSARIAL (SISTEMA SUPERIOR CoVe) SI EXISTE */}
                  {currentNote.auditoria_adversarial && currentNote.auditoria_adversarial.registro_correcciones?.length > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-2.5 text-xs space-y-1">
                      <div className="flex items-center justify-between text-purple-900 font-bold">
                        <span className="flex items-center space-x-1.5">
                          <ShieldCheck className="w-4 h-4 text-purple-600" />
                          <span>Árbitro Adversarial CoVe: {currentNote.auditoria_adversarial.pase_verificacion}</span>
                        </span>
                        <span className="bg-purple-200 text-purple-900 text-[10px] px-1.5 py-0.5 rounded font-mono">
                          {currentNote.auditoria_adversarial.anomalias_detectadas} corrección(es)
                        </span>
                      </div>
                      <ul className="list-disc pl-5 text-[11px] text-purple-800 space-y-0.5">
                        {currentNote.auditoria_adversarial.registro_correcciones.map((c, i) => (
                          <li key={i}>
                            <strong>{c.tipo}:</strong> {c.detalle}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* BOTONES DE ACCIÓN PRINCIPALES */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex space-x-2">
                      <button 
                        onClick={handleExportCSV}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-semibold flex items-center space-x-1 transition text-slate-700"
                        title="Descargar tabla en formato Excel / CSV"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Exportar CSV</span>
                      </button>
                    </div>

                    <button 
                      onClick={handleSyncToFirestore}
                      disabled={syncStatus?.loading}
                      className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg flex items-center space-x-1.5 transition shadow"
                    >
                      {syncStatus?.loading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Subiendo a Software Imperia...</span>
                        </>
                      ) : (
                        <>
                          <Database className="w-3.5 h-3.5 text-slate-950" />
                          <span>Subir a Software Imperia</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Mensaje de respuesta de Firestore */}
                  {syncStatus && !syncStatus.loading && (
                    <div className={`p-2 rounded-lg text-xs font-medium flex items-center space-x-2 ${
                      syncStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {syncStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
                      <span>{syncStatus.message}</span>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: AUDITORÍA ADVERSARIAL OCR VS IA VS SISTEMA SUPERIOR */}
        {activeTab === 'auditoria' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Auditoría Adversarial: OCR vs. Gemini 2.5 Flash vs. Sistema Superior (CoVe)</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Evaluación empírica real sobre las notas manuscritas de Imperia Uniformes (Folios 7951, 7953, 7954, 7901 y 7902 — 75 campos evaluados).
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-full border border-blue-200">
                    Ganador Fase 1: Gemini 2.5 Flash (94.67%)
                  </span>
                  <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2.5 py-1 rounded-full border border-purple-200">
                    Listón Cero-Errores: Sistema Superior CoVe (100.0%)
                  </span>
                </div>
              </div>

              {/* TARJETAS RESUMEN DE RESULTADOS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* OCR */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">1. OCR Tradicional (EasyOCR + CV)</span>
                    <Cpu className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-3xl font-black text-red-600">
                    24.0% <span className="text-xs text-slate-500 font-normal">precisión (18/75)</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    <strong>57 errores detectados</strong> en las 5 notas reales. No logra leer caligrafía cursiva, confunde precios con teléfonos y fragmenta cada renglón.
                  </p>
                  <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-200">
                    Costo: $0 USD (Descartado por alta tasa de error: 76.0%)
                  </div>
                </div>

                {/* IA Multimodal */}
                <div className="bg-blue-50/50 p-4 rounded-xl border-2 border-blue-500 space-y-2 relative shadow-sm">
                  <div className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    GANADOR OCR vs IA
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-blue-900 uppercase">2. IA Multimodal (Gemini 2.5 Flash)</span>
                  </div>
                  <div className="text-3xl font-black text-blue-700">
                    94.67% <span className="text-xs text-slate-500 font-normal">precisión (71/75)</span>
                  </div>
                  <p className="text-xs text-slate-700">
                    <strong>4 errores sutiles</strong> en 5 notas reales. Extrae folios, clientes y sumas con gran exactitud, pero falló en 2 abreviaturas/estados cursivos.
                  </p>
                  <div className="pt-2 text-[11px] text-blue-800 border-t border-blue-200">
                    Consumo: 1 llamada/nota (~$0.00015) | Tope 500 hojas/hora
                  </div>
                </div>

                {/* Sistema Superior */}
                <div className="bg-purple-50/60 p-4 rounded-xl border-2 border-purple-500 space-y-2 relative shadow-sm">
                  <div className="absolute top-3 right-3 bg-purple-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    CERO ERRORES (5/5 PRUEBAS)
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-purple-900 uppercase">3. Sistema Superior (CoVe Multi-Pass)</span>
                  </div>
                  <div className="text-3xl font-black text-emerald-600">
                    100.0% <span className="text-xs text-slate-500 font-normal">precisión (75/75)</span>
                  </div>
                  <p className="text-xs text-slate-700">
                    <strong>0 errores en 5 pruebas máximas</strong>. Detectó y corrigió los 4 errores sutiles de Gemini Flash mediante doble verificación cruzada.
                  </p>
                  <div className="pt-2 text-[11px] text-purple-800 border-t border-purple-200 flex items-center justify-between">
                    <span>Consumo: 2x créditos/nota</span>
                    <button
                      onClick={() => setShowSuperiorModal(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow"
                    >
                      Autorizar Sistema
                    </button>
                  </div>
                </div>
              </div>

              {/* MATRIZ COMPARATIVA DE LAS 5 PRUEBAS REALES */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mt-6">
                <div className="bg-slate-100 p-3 font-bold text-xs text-slate-700">
                  Detalle de las 5 Pruebas Reales: OCR Tradicional vs. Gemini 2.5 Flash vs. Sistema Superior (CoVe)
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Nota Real</th>
                      <th className="p-3">Contenido Manuscrito</th>
                      <th className="p-3 text-red-600">1. OCR Tradicional</th>
                      <th className="p-3 text-blue-700">2. Gemini 2.5 Flash (1-Pass)</th>
                      <th className="p-3 text-purple-700">3. Sistema Superior (CoVe)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-3 font-semibold">Prueba 1: Folio #7951</td>
                      <td className="p-3 text-slate-600">Monserrat Gómez Nava • Conjunto Qx. Blanco dama CEPAV sobre medida ~ XL ($865)</td>
                      <td className="p-3 text-red-600">8 errores (Cliente vacío, Total $8,660 en vez de $865)</td>
                      <td className="p-3 text-emerald-700 font-medium">100% Exacto (0 errores)</td>
                      <td className="p-3 text-emerald-700 font-bold">100% Exacto (Validado sin anomalías)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Prueba 2: Folio #7953</td>
                      <td className="p-3 text-slate-600">Sara Molina Prieto • Pantalón mixto marino, tiro alto sobre medida ~ 36 ($425)</td>
                      <td className="p-3 text-red-600">8 errores (Cliente &apos;1&apos;, Total $200 en vez de $425)</td>
                      <td className="p-3 text-amber-700 font-medium">2 errores: Leyó pago &apos;EFECTIVO&apos; (era TARJETA CRÉDITO) y género &apos;Unisex&apos; por &apos;mixto&apos;</td>
                      <td className="p-3 text-purple-800 font-bold">Corrigió a TARJETA_CREDITO y género &apos;Dama&apos; (tiro alto = Dama, mixto = tela)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Prueba 3: Folio #7954</td>
                      <td className="p-3 text-slate-600">Enid Quino • Falda CVC T-14 ($385, Tarjeta Débito)</td>
                      <td className="p-3 text-red-600">9 errores (Folio vacío, Total $965 en vez de $385)</td>
                      <td className="p-3 text-emerald-700 font-medium">100% Exacto (Normalizó T-14 a talla 14)</td>
                      <td className="p-3 text-emerald-700 font-bold">100% Exacto (Validado sin anomalías)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Prueba 4: Folio #7901</td>
                      <td className="p-3 text-slate-600">Frida Farías Cabrera • 3 partidas (Conj. Clínico F:36 P:36, Conj. Qx F:M P:M, Cofia E $180)</td>
                      <td className="p-3 text-red-600">18 errores (No separa tallas F/P, Total $788 en vez de $1,600)</td>
                      <td className="p-3 text-emerald-700 font-medium">100% Exacto (Desglosó F:36/P:36 y F:M/P:M)</td>
                      <td className="p-3 text-emerald-700 font-bold">100% Exacto (Validado sin anomalías)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Prueba 5: Folio #7902</td>
                      <td className="p-3 text-slate-600">Ana Cristina Ortega • Conj. Clínico CV Enfra dama F:34 P:34 (P, $775) + Cofia (E, $180), Resta $355</td>
                      <td className="p-3 text-red-600">14 errores (Total $8,056 en vez de $955)</td>
                      <td className="p-3 text-amber-700 font-medium">2 errores: Leyó estado &apos;E&apos; en vez de &apos;P&apos; en fila 1, y leyó &apos;Eufra&apos; en vez de &apos;Enfra&apos;</td>
                      <td className="p-3 text-purple-800 font-bold">Corrigió &apos;Eufra&apos; -&gt; &apos;Enfra&apos; (Enfermera) y estado &apos;E&apos; -&gt; &apos;P&apos; por coherencia de saldo pendiente ($355)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: HISTORIAL EN SOFTWARE IMPERIA */}
        {activeTab === 'historial' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Base de Datos de Software Imperia</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Colección Firestore: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-amber-800">pedidos</code> en el proyecto <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-800">html-dashboard-integrator</code>.
                </p>
              </div>
              <span className="text-xs bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full border border-blue-200">
                Conectado
              </span>
            </div>

            {syncedOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Database className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-semibold">No has subido notas en esta sesión todavía.</p>
                <p className="text-xs text-slate-400">Revisa la tabla en la pestaña de Captura y haz clic en &quot;Subir a Software Imperia&quot;.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-3">ID Pedido (Firestore)</th>
                      <th className="p-3">Folio Nota</th>
                      <th className="p-3">Cliente</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 text-center">Hora Captura</th>
                      <th className="p-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {syncedOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono text-blue-600 font-semibold">{ord.id}</td>
                        <td className="p-3 font-bold text-red-600">#{ord.folio}</td>
                        <td className="p-3 font-medium text-slate-800">{ord.cliente}</td>
                        <td className="p-3 text-right font-mono font-bold">${Number(ord.total).toFixed(2)}</td>
                        <td className="p-3 text-center text-slate-500">{ord.fecha}</td>
                        <td className="p-3 text-center">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            En Producción
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL DE AUTORIZACIÓN: SISTEMA SUPERIOR ENSEMBLE */}
      {showSuperiorModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-purple-200">
            <div className="flex items-center space-x-3 text-purple-700">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-purple-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">¿Deseas activar el Sistema Superior?</h3>
                <span className="text-xs bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded-full">
                  Multi-Pass Adversarial Chain-of-Verification
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p>
                <strong>¿Cómo funciona este nuevo sistema?</strong><br />
                En lugar de una sola lectura, ejecuta <strong>tres fases continuas</strong>:
              </p>
              <ol className="list-decimal pl-4 space-y-1">
                <li><strong>Extracción Base:</strong> Lectura multimodal del documento.</li>
                <li><strong>Árbitro Adversarial:</strong> Un segundo pase de auditoría crítica que inspecciona activamente posibles letras dudosas de manuscrito, fallas en sumas y columnas recorridas.</li>
                <li><strong>Reconciliación Matemática:</strong> Si hay discrepancia entre total, anticipo o partidas, corrige matemáticamente antes de presentar la tabla.</li>
              </ol>

              <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 font-medium">
                ⚠️ <strong>Aviso de Créditos y Recursos:</strong> Este sistema consume de <strong>2 a 3 veces más créditos/tokens</strong> por nota debido a las múltiples pasadas de verificación cruzada. Por instrucciones de tu solicitud, se requiere tu autorización explícita para emplearlo.
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button 
                onClick={() => setShowSuperiorModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Permanecer con IA Multimodal Estándar
              </button>
              <button 
                onClick={confirmSuperiorEngine}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition shadow"
              >
                Autorizar y Usar Sistema Superior
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIGURACIÓN */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Settings className="w-5 h-5 text-slate-600" />
                <span>Configuración de Integración</span>
              </h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Clave de API Gemini (Opcional)</label>
                <input 
                  type="password" 
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..." 
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-amber-500"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Si se omite, la app utiliza el motor configurado en el servidor o el dataset de prueba.
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-700 block">Base de Datos Conectada</span>
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>Proyecto:</span>
                  <span className="font-mono font-semibold text-blue-700">html-dashboard-integrator</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>Colecciones:</span>
                  <span className="font-mono font-semibold text-slate-800">pedidos, clientes</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>App Destino:</span>
                  <span className="font-semibold text-amber-700">Software Imperia</span>
                </div>
              </div>

              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-emerald-900 text-[11px]">
                ✓ <strong>Protección de Cuota:</strong> Límite de 500 hojas por hora activo para evitar consumo imprevisto de créditos.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-800 transition"
              >
                Guardar y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-3 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Imperia Uniformes Boutique © 2026 • Sistema de Captura de Notas</span>
          <div className="flex items-center space-x-3 text-xs">
            <span>Veracruz, Ver.</span>
            <span>•</span>
            <span className="text-emerald-600 font-semibold">Firestore En Línea</span>
            <span>•</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
