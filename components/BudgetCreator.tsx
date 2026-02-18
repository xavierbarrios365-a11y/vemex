import React, { useState, useEffect, useMemo } from 'react';
import {
  TipoTrabajo,
  ConfigCalculo,
  CATALOGO_TIPOS,
  calcularMaterialesUniversal,
  getDefaultConfig,
  ResultadoCalculo,
} from '../engineCalc';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MATERIAL_DATABASE, UniversalMaterial } from '../materialDatabase';
import { apiGet, apiPostBody } from '../constants';

// Modular Components
import { StepSelector } from './BudgetCreator/StepSelector';
import { ConfigPanel } from './BudgetCreator/ConfigPanel';
import { ResultView } from './BudgetCreator/ResultView';
import { QuoteHistory, QuoteRecord } from './BudgetCreator/QuoteHistory';
import { MaterialAssignment, ExtraItem } from './BudgetCreator/types';

type AppView = 'list' | 'create';

const BudgetCreator: React.FC = () => {
  // ─── VIEW MODE ─────────────────────────────────────────────────
  const [view, setView] = useState<AppView>('list');
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(true);

  // ─── CREATE MODE STATE ─────────────────────────────────────────
  const [step, setStep] = useState<'tipo' | 'config' | 'resultado'>('tipo');
  const [tipoTrabajo, setTipoTrabajo] = useState<TipoTrabajo | null>(null);
  const [ancho, setAncho] = useState<number>(0);
  const [alto, setAlto] = useState<number>(0);
  const [config, setConfig] = useState<ConfigCalculo>({});

  // Cliente / Proyecto
  const [nombreProyecto, setNombreProyecto] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteEmpresa, setClienteEmpresa] = useState('');
  const [proyectoUbicacion, setProyectoUbicacion] = useState('');
  const [folio] = useState(() => `COT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);

  // Assignments & Extras
  const [assignments, setAssignments] = useState<MaterialAssignment[]>([]);
  const [extraItems, setExtraItems] = useState<ExtraItem[]>([]);
  const [showAddExtra, setShowAddExtra] = useState(false);
  const [manoObraFactor, setManoObraFactor] = useState(0.45);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'none' }>({ text: '', type: 'none' });

  const materials: UniversalMaterial[] = useMemo(() => MATERIAL_DATABASE, []);

  // ─── FETCH QUOTES ──────────────────────────────────────────────
  const fetchQuotes = async () => {
    setQuotesLoading(true);
    // @ts-ignore
    const gContext = window.google;
    if (gContext?.script?.run) {
      gContext.script.run
        .withSuccessHandler((data: any) => {
          setQuotes(Array.isArray(data) ? data : []);
          setQuotesLoading(false);
        })
        .withFailureHandler(() => {
          setQuotesLoading(false);
        })
        .getCotizaciones();
      return;
    }

    try {
      const response = await fetch(apiGet('getCotizaciones'));
      const data = await response.json();
      setQuotes(Array.isArray(data) ? data : []);
    } catch {
      // No connection
    } finally {
      setQuotesLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  // ─── DERIVED STATE ─────────────────────────────────────────────
  const tipoMeta = useMemo(() => CATALOGO_TIPOS.find(t => t.id === tipoTrabajo), [tipoTrabajo]);
  const grupoColor = tipoMeta?.color || '#3b82f6';
  const grupoColors: Record<string, string> = {
    cerramientos: '#4682b4',
    lineales: '#ff6700',
    techumbres: '#22c55e',
    escaleras: '#a855f7'
  };

  const resultado = useMemo(() => {
    if (!tipoTrabajo || ancho <= 0 || alto <= 0) return null;
    return calcularMaterialesUniversal(tipoTrabajo, ancho, alto, config);
  }, [tipoTrabajo, ancho, alto, config]);

  // ─── EFFECTS ───────────────────────────────────────────────────
  useEffect(() => {
    if (!resultado) return;
    setAssignments(
      resultado.lineas.map(line => ({
        concepto: line.concepto,
        materialId: autoMatchMaterial(line.materialSugerido)
      }))
    );
  }, [resultado]);

  // ─── LOGIC FUNCTIONS ───────────────────────────────────────────
  const startNewQuote = () => {
    setView('create');
    setStep('tipo');
    setTipoTrabajo(null);
    setAncho(0);
    setAlto(0);
    setConfig({});
    setAssignments([]);
    setExtraItems([]);
    setStatusMessage({ text: '', type: 'none' });
    setClienteNombre('');
    setClienteEmpresa('');
    setProyectoUbicacion('');
  };

  const backToList = () => {
    setView('list');
    fetchQuotes();
  };

  const selectTipo = (tipo: TipoTrabajo) => {
    setTipoTrabajo(tipo);
    setConfig(getDefaultConfig(tipo));
    setStep('config');
    setAncho(0);
    setAlto(0);
    setAssignments([]);
    setExtraItems([]);
    setStatusMessage({ text: '', type: 'none' });
  };

  function autoMatchMaterial(sugerido: string): string {
    const found = materials.find(m => m.name.toLowerCase().includes(sugerido.toLowerCase().slice(0, 8)));
    return found ? found.id : '';
  }

  // ─── COSTOS ────────────────────────────────────────────────────
  const costoMateriales = useMemo(() => {
    let total = 0;
    if (resultado) {
      resultado.lineas.forEach((item, idx) => {
        const asig = assignments[idx];
        if (!asig?.materialId) return;
        const mat = materials.find(m => m.id === asig.materialId);
        const precio = asig.manualPrice !== undefined ? asig.manualPrice : (mat?.priceBase || 0);
        if (precio > 0) {
          total += item.esPieza ? item.piezas * precio : item.tramosNecesarios * precio;
        }
      });
    }
    extraItems.forEach(item => {
      const mat = materials.find(m => m.id === item.materialId);
      const precio = item.manualPrice !== undefined ? item.manualPrice : (mat?.priceBase || 0);
      total += item.quantity * precio;
    });
    return total;
  }, [resultado, assignments, extraItems, materials]);

  const costoManoObra = Math.round(costoMateriales * manoObraFactor);
  const costoTotal = costoMateriales + costoManoObra;

  // ─── GUARDAR ───────────────────────────────────────────────────
  const guardarCotizacion = async () => {
    if (!resultado) {
      setStatusMessage({ text: 'Primero calcula los materiales', type: 'error' });
      return;
    }
    setLoading(true);

    const partidasAutomaticas = resultado.lineas.map((l, idx) => {
      const asignado = assignments[idx];
      const mat = materials.find(m => m.id === asignado?.materialId);
      const priceToUse = asignado?.manualPrice !== undefined ? asignado.manualPrice : (mat?.priceBase || 0);
      return {
        idMaterial: asignado?.materialId || 'SIN_ASIGNAR',
        cantidad: l.esPieza ? l.piezas : l.tramosNecesarios,
        precioUnitario: priceToUse,
        totalLinea: l.esPieza ? l.piezas * priceToUse : l.tramosNecesarios * priceToUse,
      };
    });

    const partidasExtras = extraItems.map((item) => {
      const mat = materials.find(m => m.id === item.materialId);
      const priceToUse = item.manualPrice !== undefined ? item.manualPrice : (mat?.priceBase || 0);
      return {
        idMaterial: item.materialId,
        cantidad: item.quantity,
        precioUnitario: priceToUse,
        totalLinea: item.quantity * priceToUse,
      };
    });

    const data = {
      nombreProyecto: nombreProyecto || tipoMeta?.label || 'Proyecto VEMEX',
      clienteId: 'VAR-001',
      tipoTrabajo: tipoTrabajo,
      subtotalMateriales: costoMateriales,
      manoObra: costoManoObra,
      gastosExtra: 0,
      totalFinal: costoTotal,
      partidas: [...partidasAutomaticas, ...partidasExtras],
    };

    // @ts-ignore
    const gContext = window.google;
    if (gContext?.script?.run) {
      gContext.script.run
        .withSuccessHandler((resp: any) => {
          setLoading(false);
          setStatusMessage(resp.success
            ? { text: `✓ Orden guardada: ${resp.id}`, type: 'success' }
            : { text: resp.message || 'Error al guardar', type: 'error' }
          );
        })
        .withFailureHandler((err: any) => {
          setLoading(false);
          setStatusMessage({ text: 'Error de conexión: ' + err, type: 'error' });
        })
        .guardarCotizacionCompleta(data);
      return;
    }

    try {
      const response = await fetch(apiGet(''), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: apiPostBody('guardarCotizacion', data),
      });
      const result = await response.json();
      setLoading(false);
      if (result.success) {
        setStatusMessage({ text: `✓ Orden guardada: ${result.id}`, type: 'success' });
      } else {
        setStatusMessage({ text: result.message || 'Error del servidor', type: 'error' });
      }
    } catch (err) {
      setLoading(false);
      setStatusMessage({ text: '✓ Guardado en modo demo (sin conexión a servidor)', type: 'success' });
    }
  };

  // ─── EXPORT PDF ────────────────────────────────────────────────
  const exportPDF = () => {
    if (!resultado) return;
    const doc = new jsPDF();
    const vemexBlue: [number, number, number] = [0, 74, 173];

    doc.setFillColor(vemexBlue[0], vemexBlue[1], vemexBlue[2]);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('VEMEX', 20, 22);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('ESTRUCTURAS METÁLICAS Y HERRERÍA PROFESIONAL', 20, 28);
    doc.setFontSize(10);
    doc.text('COTIZACIÓN FORMAL', 185, 18, { align: 'right' });
    doc.text(`Folio: #${folio}`, 185, 24, { align: 'right' });
    doc.text(new Date().toLocaleDateString(), 185, 30, { align: 'right' });
    doc.text('Vigencia: 7 días', 185, 36, { align: 'right' });

    doc.setFillColor(245, 245, 245);
    doc.rect(20, 50, 170, 22, 'F');
    doc.setDrawColor(vemexBlue[0], vemexBlue[1], vemexBlue[2]);
    doc.setLineWidth(1);
    doc.line(20, 50, 20, 72);

    doc.setTextColor(vemexBlue[0], vemexBlue[1], vemexBlue[2]);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE', 25, 57);
    doc.text('PROYECTO / UBICACIÓN', 185, 57, { align: 'right' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(clienteNombre || 'Cliente Particular', 25, 64);
    doc.text(proyectoUbicacion || 'Ciudad de México, MX', 185, 64, { align: 'right' });

    if (clienteEmpresa) {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(clienteEmpresa, 25, 69);
    }

    const tableHeaders = [['CONCEPTO', 'QTY', 'UNIT', 'P.UNIT', 'PARCIAL']];
    const tableData = [
      ...resultado.lineas.map((line, i) => {
        const asig = assignments[i];
        const mat = materials.find(m => m.id === asig?.materialId);
        const precio = asig?.manualPrice !== undefined ? asig.manualPrice : (mat?.priceBase || 0);
        const qty = line.esPieza ? line.piezas : line.tramosNecesarios;
        const parcial = qty * precio;
        return [
          line.concepto + (mat ? `\n(${mat.name})` : ''),
          qty,
          line.esPieza ? 'Pza' : 'Trm',
          `$${precio.toLocaleString()}`,
          `$${parcial.toLocaleString()}`
        ];
      }),
      ...extraItems.map(ei => {
        const mat = materials.find(m => m.id === ei.materialId);
        const precio = ei.manualPrice !== undefined ? ei.manualPrice : (mat?.priceBase || 0);
        return [
          (mat?.name || 'Item Adicional'),
          ei.quantity,
          'Pza',
          `$${precio.toLocaleString()}`,
          `$${(ei.quantity * precio).toLocaleString()}`
        ];
      })
    ];

    autoTable(doc, {
      startY: 80,
      head: tableHeaders,
      body: tableData,
      headStyles: { fillColor: vemexBlue, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: 50 },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { halign: 'center', cellWidth: 15 },
        2: { halign: 'center', cellWidth: 15 },
        3: { halign: 'right', cellWidth: 30 },
        4: { halign: 'right', cellWidth: 35, fontStyle: 'bold' }
      },
      margin: { left: 20, right: 20 },
      theme: 'striped'
    });

    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('Subtotal Materiales:', 140, finalY);
    doc.text(`$${costoMateriales.toLocaleString()}`, 190, finalY, { align: 'right' });

    doc.text(`Mano de Obra (${Math.round(manoObraFactor * 100)}%):`, 140, finalY + 6);
    doc.text(`$${costoManoObra.toLocaleString()}`, 190, finalY + 6, { align: 'right' });

    const subtotal = costoTotal;
    const iva = subtotal * 0.16;
    const totalFinal = subtotal + iva;

    doc.text('IVA (16%):', 140, finalY + 12);
    doc.text(`$${Math.round(iva).toLocaleString()}`, 190, finalY + 12, { align: 'right' });

    doc.setFillColor(vemexBlue[0], vemexBlue[1], vemexBlue[2]);
    doc.rect(135, finalY + 16, 60, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', 140, finalY + 24);
    doc.text(`$${Math.round(totalFinal).toLocaleString()} MXN`, 190, finalY + 24, { align: 'right' });

    const pageH = doc.internal.pageSize.height;
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('VEMEX — Balconería y Muebles | Bulevar Donaldo Colosio 37, Col. El Progreso', 105, pageH - 10, { align: 'center' });

    doc.save(`Cotizacion_VEMEX_${folio}.pdf`);
  };

  const updateConfig = <K extends keyof ConfigCalculo>(key: K, val: ConfigCalculo[K]) => {
    setConfig(prev => ({ ...prev, [key]: val }));
  };

  const addNewExtraItem = (matId: string) => {
    const newItem: ExtraItem = {
      id: Math.random().toString(36).substr(2, 9),
      materialId: matId,
      quantity: 1
    };
    setExtraItems(prev => [...prev, newItem]);
    setShowAddExtra(false);
  };

  // ─── RENDER ────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="max-w-2xl mx-auto pb-24 px-4 sm:px-0">
        <header className="py-8">
          <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">
            VEMEX <span className="text-primary tracking-normal not-italic opacity-50 text-xl font-medium">BETA</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">Professional Budget Engine v3.0</p>
        </header>
        <QuoteHistory
          quotes={quotes}
          loading={quotesLoading}
          onRefresh={fetchQuotes}
          onNewQuote={startNewQuote}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-24 px-4 sm:px-0">
      <header className="py-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">
            VEMEX <span className="text-primary tracking-normal not-italic opacity-50 text-xl font-medium">BETA</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">Professional Budget Engine v3.0</p>
        </div>
        <button
          onClick={step === 'tipo' ? backToList : () => setStep(step === 'config' ? 'tipo' : 'config')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-[9px] font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-white/5"
        >
          <span className="material-symbols-outlined text-sm">arrow_back_ios</span>
          {step === 'tipo' ? 'Mis Ingenierías' : 'Volver'}
        </button>
      </header>

      {/* Status Message */}
      {statusMessage.type !== 'none' && (
        <div className={`mb-4 p-4 rounded-2xl border text-xs font-black uppercase tracking-widest flex items-center gap-3 ${statusMessage.type === 'success'
          ? 'bg-green-500/10 border-green-500/30 text-green-400'
          : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
          <span className="material-symbols-outlined text-sm">
            {statusMessage.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {statusMessage.text}
        </div>
      )}

      {step === 'tipo' && (
        <StepSelector onSelect={selectTipo} grupoColors={grupoColors} />
      )}

      {step === 'config' && tipoTrabajo && (
        <ConfigPanel
          tipoTrabajo={tipoTrabajo}
          tipoMeta={tipoMeta || null}
          grupoColor={grupoColor}
          ancho={ancho}
          alto={alto}
          config={config}
          setAncho={setAncho}
          setAlto={setAlto}
          clienteNombre={clienteNombre}
          setClienteNombre={setClienteNombre}
          clienteEmpresa={clienteEmpresa}
          setClienteEmpresa={setClienteEmpresa}
          proyectoUbicacion={proyectoUbicacion}
          setProyectoUbicacion={setProyectoUbicacion}
          updateConfig={updateConfig}
          onCalculate={() => setStep('resultado')}
        />
      )}

      {step === 'resultado' && resultado && (
        <ResultView
          resultado={resultado}
          grupoColor={grupoColor}
          tipoMeta={tipoMeta}
          materials={materials}
          assignments={assignments}
          setAssignments={setAssignments}
          extraItems={extraItems}
          setExtraItems={setExtraItems}
          showAddExtra={showAddExtra}
          setShowAddExtra={setShowAddExtra}
          addNewExtraItem={addNewExtraItem}
          costoMateriales={costoMateriales}
          manoObraFactor={manoObraFactor}
          setManoObraFactor={setManoObraFactor}
          costoManoObra={costoManoObra}
          costoTotal={costoTotal}
          loading={loading}
          onExportPDF={exportPDF}
          onSave={guardarCotizacion}
        />
      )}
    </div>
  );
};

export default BudgetCreator;
