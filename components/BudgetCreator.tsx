
import React, { useState, useEffect, useMemo } from 'react';
import { Material } from '../types';
import {
  TipoTrabajo,
  ConfigCalculo,
  CATALOGO_TIPOS,
  calcularMaterialesUniversal,
  getDefaultConfig,
  getGrupo,
  LineaMaterial,
  ResultadoCalculo,
} from '../engineCalc';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MATERIAL_DATABASE } from '../materialDatabase';

// ─── MATERIAL ASSIGNMENT ─────────────────────────────────────────
interface MaterialAssignment {
  concepto: string;
  materialId: string;
  manualPrice?: number;
}

interface ExtraItem {
  id: string; // unique local id
  materialId: string;
  quantity: number;
  manualPrice?: number;
}

const BudgetCreator: React.FC = () => {
  // ─── STATE ───────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [nombreProyecto, setNombreProyecto] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteEmpresa, setClienteEmpresa] = useState('');
  const [proyectoUbicacion, setProyectoUbicacion] = useState('');
  const [folio, setFolio] = useState(() => `COT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);

  const [tipoTrabajo, setTipoTrabajo] = useState<TipoTrabajo | null>(null);
  const [alto, setAlto] = useState<number>(0);
  const [ancho, setAncho] = useState<number>(0);
  const [config, setConfig] = useState<ConfigCalculo>({});
  const [assignments, setAssignments] = useState<MaterialAssignment[]>([]);
  const [extraItems, setExtraItems] = useState<ExtraItem[]>([]);
  const [showAddExtra, setShowAddExtra] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'none' }>({ text: '', type: 'none' });
  const [manoObraFactor, setManoObraFactor] = useState(0.45);
  const [step, setStep] = useState<'tipo' | 'config' | 'resultado'>('tipo');

  // ─── FETCH MATERIALS ─────────────────────────────────────────
  // Using universal static database instead of fetching from backend
  const materials = MATERIAL_DATABASE;

  // ─── SELECT TIPO ─────────────────────────────────────────────
  const selectTipo = (tipo: TipoTrabajo) => {
    setTipoTrabajo(tipo);
    setConfig(getDefaultConfig(tipo));
    setAlto(0);
    setAncho(0);
    setAssignments([]);
    setExtraItems([]);
    setStatusMessage({ text: '', type: 'none' });
    setStep('config');
  };

  // ─── CÁLCULO REACTIVO ────────────────────────────────────────
  const resultado: ResultadoCalculo | null = useMemo(() => {
    if (!tipoTrabajo || alto <= 0 || ancho <= 0) return null;
    return calcularMaterialesUniversal(tipoTrabajo, ancho, alto, config);
  }, [tipoTrabajo, ancho, alto, config]);

  // Auto-assign materials based on suggestions
  useEffect(() => {
    if (!resultado) return;
    setAssignments(
      resultado.lineas.map(l => ({
        concepto: l.concepto,
        materialId: autoMatchMaterial(l.materialSugerido),
      }))
    );
  }, [resultado]);

  function autoMatchMaterial(sugerido: string): string {
    const match = materials.find(m => m.name.toLowerCase().includes(sugerido.toLowerCase().slice(0, 8)));
    return match?.id || '';
  }

  // ─── PRECIO TOTAL ────────────────────────────────────────────
  const costoMaterialesBase = useMemo(() => {
    if (!resultado) return 0;
    return resultado.lineas.reduce((total, linea, idx) => {
      const asignado = assignments[idx];
      if (!asignado?.materialId) return total;
      const mat = materials.find(m => m.id === asignado.materialId);
      if (!mat) return total;

      const priceToUse = asignado.manualPrice !== undefined ? asignado.manualPrice : mat.priceBase;

      if (linea.esPieza) return total + (linea.piezas * priceToUse);
      return total + (linea.tramosNecesarios * priceToUse);
    }, 0);
  }, [resultado, assignments, materials]);

  const costoExtraItems = useMemo(() => {
    return extraItems.reduce((total, item) => {
      const mat = materials.find(m => m.id === item.materialId);
      if (!mat) return total;
      const priceToUse = item.manualPrice !== undefined ? item.manualPrice : mat.priceBase;
      return total + (item.quantity * priceToUse);
    }, 0);
  }, [extraItems, materials]);

  const costoMateriales = costoMaterialesBase + costoExtraItems;
  const costoManoObra = costoMateriales * manoObraFactor;
  const costoTotal = costoMateriales + costoManoObra;

  // ─── GUARDAR ─────────────────────────────────────────────────
  const guardarCotizacion = async () => {
    if (!nombreProyecto || !resultado) {
      setStatusMessage({ text: 'Ingresar nombre y medidas', type: 'error' });
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

    const partidasExtractras = extraItems.map((item) => {
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
      nombreProyecto,
      clienteId: 'VAR-001',
      tipoTrabajo: tipoTrabajo,
      subtotalMateriales: costoMateriales,
      manoObra: costoManoObra,
      gastosExtra: 0,
      totalFinal: costoTotal,
      partidas: [...partidasAutomaticas, ...partidasExtractras],
    };

    // @ts-ignore
    const gContext = window.google;
    if (gContext?.script?.run) {
      gContext.script.run
        .withSuccessHandler((resp: any) => {
          setLoading(false);
          setStatusMessage(resp.success ? { text: '✓ Orden: ' + resp.id, type: 'success' } : { text: resp.message, type: 'error' });
        })
        .guardarCotizacionCompleta(data);
    } else {
      setTimeout(() => {
        setLoading(false);
        setStatusMessage({ text: '✓ Demo guardado localmente', type: 'success' });
      }, 1200);
    }
  };

  // ─── EXPORT PDF ──────────────────────────────────────────────
  const exportPDF = () => {
    if (!resultado) return;
    const doc = new jsPDF();
    const vemexBlue: [number, number, number] = [0, 74, 173]; // #004aad
    const darkGrey: [number, number, number] = [44, 62, 80];  // #2c3e50

    // --- HEADER / MEMBRETE ---
    doc.setFillColor(vemexBlue[0], vemexBlue[1], vemexBlue[2]);
    doc.rect(0, 0, 210, 3, 'F'); // Top accent bar

    // Logo & Brand Name
    doc.setTextColor(darkGrey[0], darkGrey[1], darkGrey[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Balconería y Muebles', 20, 20);

    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(vemexBlue[0], vemexBlue[1], vemexBlue[2]);
    doc.text('VEMEX', 20, 30);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(['Dirección: Bulevar Donaldo Colosio 37', 'Colonia El Progreso.'], 20, 38);

    // Invoice Meta (Folio, Date)
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(18);
    doc.text('COTIZACIÓN', 190, 25, { align: 'right' });

    doc.setTextColor(vemexBlue[0], vemexBlue[1], vemexBlue[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Folio:', 150, 35);
    doc.text('Fecha:', 150, 40);
    doc.text('Vigencia:', 150, 45);

    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'normal');
    doc.text(`#${folio}`, 190, 35, { align: 'right' });
    doc.text(new Date().toLocaleDateString(), 190, 40, { align: 'right' });
    doc.text('7 Días', 190, 45, { align: 'right' });

    // --- CLIENT SECTION ---
    doc.setFillColor(248, 249, 250); // Light grey bg
    doc.rect(20, 55, 170, 20, 'F');
    doc.setDrawColor(vemexBlue[0], vemexBlue[1], vemexBlue[2]);
    doc.setLineWidth(1);
    doc.line(20, 55, 20, 75); // Border-left

    doc.setTextColor(vemexBlue[0], vemexBlue[1], vemexBlue[2]);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE', 25, 62);
    doc.text('PROYECTO / UBICACIÓN', 185, 62, { align: 'right' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(clienteNombre || 'Cliente Particular', 25, 68);
    doc.text(proyectoUbicacion || 'Obra Local', 185, 68, { align: 'right' });

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(clienteEmpresa || '', 25, 72);

    // --- ITEMS TABLE ---
    const tableHeaders = [['DESCRIPCIÓN DE LA CHAMBA', 'CANT.', 'P. UNITARIO', 'TOTAL']];
    const tableData = [
      ...resultado.lineas.map((l, idx) => {
        const asignado = assignments[idx];
        const mat = materials.find(m => m.id === asignado?.materialId);
        const price = asignado?.manualPrice !== undefined ? asignado.manualPrice : (mat?.priceBase || 0);
        const qty = l.esPieza ? l.piezas : l.tramosNecesarios;

        // Formatear descripción técnica
        const specs = `• Material: ${mat?.name || l.materialSugerido}\n• Clasificación: ${l.categoriaRol.toUpperCase()}\n• Medida: ${l.esPieza ? 'Unidad' : 'Tramo 6m'}`;

        return [
          { content: `${l.concepto}\n${specs}`, styles: { cellPadding: 5 } },
          qty,
          `$${price.toLocaleString()}`,
          `$${(qty * price).toLocaleString()}`
        ];
      }),
      ...extraItems.map(item => {
        const mat = materials.find(m => m.id === item.materialId);
        const price = item.manualPrice !== undefined ? item.manualPrice : (mat?.priceBase || 0);
        return [
          { content: `Material Adicional: ${mat?.name}\n• Cantidad manual solicitada por el cliente.`, styles: { cellPadding: 5 } },
          item.quantity,
          `$${price.toLocaleString()}`,
          `$${(item.quantity * price).toLocaleString()}`
        ];
      })
    ];

    autoTable(doc, {
      startY: 85,
      head: tableHeaders,
      body: tableData,
      headStyles: { fillColor: vemexBlue, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: 50 },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'right', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 30, fontStyle: 'bold' }
      },
      margin: { left: 20, right: 20 },
      theme: 'striped'
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const subtotalCost = costoMateriales;
    const iva = subtotalCost * 0.16;
    const totalFinal = subtotalCost + iva;

    // --- TOTALS ---
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text('Subtotal:', 150, finalY);
    doc.text(`$${subtotalCost.toLocaleString()}`, 190, finalY, { align: 'right' });

    doc.text('IVA (16%):', 150, finalY + 7);
    doc.text(`$${iva.toLocaleString()}`, 190, finalY + 7, { align: 'right' });

    doc.setFillColor(vemexBlue[0], vemexBlue[1], vemexBlue[2]);
    doc.rect(140, finalY + 12, 50, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', 145, finalY + 19);
    doc.text(`$${totalFinal.toLocaleString()} MXN`, 185, finalY + 19, { align: 'right' });

    // --- TERMS & BANKING ---
    const termsY = Math.max(finalY + 35, 220);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, termsY, 190, termsY);

    doc.setTextColor(vemexBlue[0], vemexBlue[1], vemexBlue[2]);
    doc.setFontSize(8);
    doc.text('CONDICIONES DE PAGO', 20, termsY + 8);
    doc.text('INFORMACIÓN BANCARIA', 110, termsY + 8);

    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'normal');
    doc.text(['• 60% de Anticipo para compra de materiales.', '• 40% Contra-entrega instalada.'], 20, termsY + 14);
    doc.text(['Banco: BBVA Bancomer', 'Titular: Alexander Barrios', 'CLABE: 012 345 6789012345 6'], 110, termsY + 14);

    // --- SIGNATURE ---
    doc.setDrawColor(0, 0, 0);
    doc.line(80, 270, 130, 270);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('ELABORADO POR ALEXANDER BARRIOS', 105, 275, { align: 'center' });
    doc.setTextColor(vemexBlue[0], vemexBlue[1], vemexBlue[2]);
    doc.text('TEL: +52 967 192 7631', 105, 280, { align: 'center' });

    doc.save(`Cotizacion_VEMEX_${nombreProyecto.replace(/ /g, '_') || folio}.pdf`);
  };

  // ─── UPDATE CONFIG HELPER ────────────────────────────────────
  const updateConfig = (key: keyof ConfigCalculo, val: any) => {
    setConfig(prev => ({ ...prev, [key]: val }));
  };

  // ─── ADD EXTRA ITEM ──────────────────────────────────────────
  const addNewExtraItem = (matId: string) => {
    const mat = materials.find(m => m.id === matId);
    if (!mat) return;
    setExtraItems(prev => [
      ...prev,
      { id: Math.random().toString(36).substr(2, 9), materialId: matId, quantity: 1 }
    ]);
    setShowAddExtra(false);
  };

  // ─── GRUPO COLORS ────────────────────────────────────────────
  const grupoColors: Record<string, string> = {
    cerramientos: '#4682b4',
    lineales: '#ff6700',
    techumbres: '#22c55e',
    escaleras: '#a855f7',
  };

  const tipoMeta = tipoTrabajo ? CATALOGO_TIPOS.find(t => t.id === tipoTrabajo) : null;
  const grupoColor = tipoMeta ? grupoColors[tipoMeta.grupo] : '#4682b4';

  // ═══════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="p-4 bg-background-dark min-h-screen pb-40 space-y-6 industrial-grid">
      {/* ─── HEADER ─────────────────────────────────────────── */}
      <header className="bg-card-dark p-6 rounded-3xl border border-white/5 shadow-2xl">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black italic text-white tracking-tighter uppercase leading-none">
              Vemex Pro-Engineering
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <input
                className="bg-transparent border-none p-0 text-[10px] font-black text-slate-500 uppercase tracking-widest outline-none focus:text-primary"
                placeholder="NOMBRE DEL PROYECTO..."
                value={nombreProyecto}
                onChange={e => setNombreProyecto(e.target.value)}
              />
              <span className="bg-slate-800 text-slate-500 text-[7px] font-black px-2 py-0.5 rounded-md uppercase">v3.0 Universal</span>
            </div>
          </div>
          <div className="size-12 rounded-2xl border border-white/10 flex items-center justify-center relative"
            style={{ backgroundColor: `${grupoColor}15`, borderColor: `${grupoColor}30` }}>
            <span className="material-symbols-outlined" style={{ color: grupoColor }}>precision_manufacturing</span>
            {loading && <div className="absolute inset-0 border-2 border-t-transparent rounded-2xl animate-spin" style={{ borderColor: `${grupoColor}40`, borderTopColor: 'transparent' }}></div>}
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        {tipoTrabajo && (
          <div className="flex items-center gap-2 mt-4 text-[9px] font-black uppercase tracking-widest">
            <button onClick={() => { setStep('tipo'); setTipoTrabajo(null); }} className="text-slate-500 hover:text-white transition-colors">Tipos</button>
            <span className="text-slate-700">›</span>
            <button onClick={() => setStep('config')} className="transition-colors" style={{ color: step === 'config' ? grupoColor : '#64748b' }}>{tipoMeta?.label}</button>
            {step === 'resultado' && (
              <>
                <span className="text-slate-700">›</span>
                <span style={{ color: grupoColor }}>Resultado</span>
              </>
            )}
          </div>
        )}
      </header>

      {/* Status Message */}
      {statusMessage.type !== 'none' && (
        <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center ${statusMessage.type === 'success' ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-red-500/20 text-red-500 border border-red-500/30'}`}>
          {statusMessage.text}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  STEP 1: SELECTOR DE TIPO DE TRABAJO                  */}
      {/* ═══════════════════════════════════════════════════════ */}
      {step === 'tipo' && (
        <section className="space-y-4">
          {['cerramientos', 'lineales', 'techumbres', 'escaleras'].map(grupo => {
            const items = CATALOGO_TIPOS.filter(t => t.grupo === grupo);
            const color = grupoColors[grupo];
            return (
              <div key={grupo}>
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 pl-1 italic flex items-center gap-2" style={{ color }}>
                  <div className="size-1.5 rounded-full" style={{ backgroundColor: color }}></div>
                  {items[0].grupoLabel}
                  <span className="text-slate-600 font-normal not-italic">({items.length})</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {items.map(t => (
                    <button
                      key={t.id}
                      onClick={() => selectTipo(t.id)}
                      className="flex items-center gap-2 bg-card-dark border border-white/5 rounded-xl px-3 py-2.5 active:scale-95 transition-all hover:border-opacity-40 group text-left"
                    >
                      <div className="size-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
                        <span className="material-symbols-outlined text-base" style={{ color }}>{t.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-black uppercase tracking-wide text-slate-300 group-hover:text-white block truncate">{t.label}</span>
                        <span className="text-[7px] text-slate-600 block truncate">{t.descripcion}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  STEP 2: CONFIGURACIÓN DE MEDIDAS Y PARÁMETROS        */}
      {/* ═══════════════════════════════════════════════════════ */}
      {step === 'config' && tipoTrabajo && (
        <section className="space-y-4">
          {/* Tipo Badge */}
          <div className="flex items-center gap-3 p-4 bg-card-dark rounded-2xl border border-white/5">
            <div className="size-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${grupoColor}15` }}>
              <span className="material-symbols-outlined text-3xl" style={{ color: grupoColor }}>{tipoMeta?.icon}</span>
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase italic">{tipoMeta?.label}</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{tipoMeta?.grupoLabel} — {tipoMeta?.descripcion}</p>
            </div>
          </div>

          {/* Medidas Base */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card-dark p-4 rounded-3xl border border-white/5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                {getGrupo(tipoTrabajo) === 'lineales' ? 'Longitud (m)' : getGrupo(tipoTrabajo) === 'escaleras' ? 'Ancho Peldaño (m)' : 'Ancho (m)'}
              </label>
              <input type="number" step="0.01" className="w-full bg-slate-900 border-none rounded-xl h-12 px-4 text-white font-mono text-xl font-bold" value={ancho || ''} onChange={e => setAncho(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="bg-card-dark p-4 rounded-3xl border border-white/5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                {getGrupo(tipoTrabajo) === 'techumbres' ? 'Largo/Caída (m)' : 'Alto (m)'}
              </label>
              <input type="number" step="0.01" className="w-full bg-slate-900 border-none rounded-xl h-12 px-4 text-white font-mono text-xl font-bold" value={alto || ''} onChange={e => setAlto(parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          {/* Datos del Cliente */}
          <div className="bg-card-dark p-5 rounded-3xl border border-white/5 space-y-4">
            <h4 className="text-[9px] font-black uppercase tracking-widest italic" style={{ color: grupoColor }}>
              <span className="material-symbols-outlined text-sm align-middle mr-1">person</span>
              Datos del Cliente y Proyecto
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-[8px] font-black text-slate-500 uppercase pl-1">Nombre del Cliente</label>
                <input type="text" className="w-full bg-slate-900 rounded-xl h-9 px-3 text-xs text-white" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} placeholder="Ej. Arq. Felipe Martínez" />
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase pl-1">Empresa (Opcional)</label>
                <input type="text" className="w-full bg-slate-900 rounded-xl h-9 px-3 text-xs text-white" value={clienteEmpresa} onChange={e => setClienteEmpresa(e.target.value)} placeholder="Ej. Constructora del Norte" />
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase pl-1">Ubicación / Proyecto</label>
                <input type="text" className="w-full bg-slate-900 rounded-xl h-9 px-3 text-xs text-white" value={proyectoUbicacion} onChange={e => setProyectoUbicacion(e.target.value)} placeholder="Ej. Residencial Lomas Verdes" />
              </div>
            </div>
          </div>

          {/* Parámetros Específicos del Grupo */}
          <div className="bg-card-dark p-5 rounded-3xl border border-white/5 space-y-4">
            <h4 className="text-[9px] font-black uppercase tracking-widest italic" style={{ color: grupoColor }}>
              <span className="material-symbols-outlined text-sm align-middle mr-1">tune</span>
              Parámetros de Ingeniería
            </h4>

            {/* CERRAMIENTOS */}
            {getGrupo(tipoTrabajo) === 'cerramientos' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase pl-1">Sep. Barrotes (m)</label>
                  <input type="number" step="0.01" className="w-full bg-slate-900 rounded-xl h-9 px-3 text-xs text-white" value={config.separacionBarrotes ?? 0.12} onChange={e => updateConfig('separacionBarrotes', parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase pl-1">Grosor Marco (m)</label>
                  <input type="number" step="0.001" className="w-full bg-slate-900 rounded-xl h-9 px-3 text-xs text-white" value={config.grosorMarco ?? 0.038} onChange={e => updateConfig('grosorMarco', parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase pl-1">Relleno</label>
                  <select className="w-full bg-slate-900 rounded-xl h-9 px-3 text-xs text-white" value={config.rellenoTipo ?? 'barrotes'} onChange={e => updateConfig('rellenoTipo', e.target.value)}>
                    <option value="barrotes">Barrotes</option>
                    <option value="lamina">Lámina</option>
                  </select>
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase pl-1">Refuerzos Int.</label>
                  <input type="number" className="w-full bg-slate-900 rounded-xl h-9 px-3 text-xs text-white" value={config.refuerzosInternos ?? 0} onChange={e => updateConfig('refuerzosInternos', parseInt(e.target.value) || 0)} />
                </div>
              </div>
            )}

            {/* LINEALES */}
            {getGrupo(tipoTrabajo) === 'lineales' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase pl-1">Sep. Postes (m)</label>
                  <input type="number" step="0.1" className="w-full bg-slate-900 rounded-xl h-9 px-3 text-xs text-white" value={config.separacionPostes ?? 1.5} onChange={e => updateConfig('separacionPostes', parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase pl-1">Líneas Horiz.</label>
                  <input type="number" className="w-full bg-slate-900 rounded-xl h-9 px-3 text-xs text-white" value={config.lineasHorizontales ?? 3} onChange={e => updateConfig('lineasHorizontales', parseInt(e.target.value) || 0)} />
                </div>
              </div>
            )}

            {/* TECHUMBRES */}
            {getGrupo(tipoTrabajo) === 'techumbres' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase pl-1">Sep. Vigas (m)</label>
                  <input type="number" step="0.5" className="w-full bg-slate-900 rounded-xl h-9 px-3 text-xs text-white" value={config.separacionVigas ?? 3} onChange={e => updateConfig('separacionVigas', parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase pl-1">Sep. Montenes (m)</label>
                  <input type="number" step="0.5" className="w-full bg-slate-900 rounded-xl h-9 px-3 text-xs text-white" value={config.separacionMontenes ?? 1} onChange={e => updateConfig('separacionMontenes', parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase pl-1">Vuelo/Alero (m)</label>
                  <input type="number" step="0.05" className="w-full bg-slate-900 rounded-xl h-9 px-3 text-xs text-white" value={config.vueloTecho ?? 0.3} onChange={e => updateConfig('vueloTecho', parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase pl-1">Largo Lámina (m)</label>
                  <input type="number" step="0.01" className="w-full bg-slate-900 rounded-xl h-9 px-3 text-xs text-white" value={config.largoLamina ?? 3.66} onChange={e => updateConfig('largoLamina', parseFloat(e.target.value) || 0)} />
                </div>
              </div>
            )}

            {/* ESCALERAS */}
            {getGrupo(tipoTrabajo) === 'escaleras' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase pl-1">Altura Paso (m)</label>
                  <input type="number" step="0.01" className="w-full bg-slate-900 rounded-xl h-9 px-3 text-xs text-white" value={config.alturaPaso ?? 0.18} onChange={e => updateConfig('alturaPaso', parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase pl-1">Huella (m)</label>
                  <input type="number" step="0.01" className="w-full bg-slate-900 rounded-xl h-9 px-3 text-xs text-white" value={config.huellaEscalon ?? 0.28} onChange={e => updateConfig('huellaEscalon', parseFloat(e.target.value) || 0)} />
                </div>
              </div>
            )}
          </div>

          {/* Botón Calcular */}
          <button
            onClick={() => setStep('resultado')}
            disabled={alto <= 0 || ancho <= 0}
            className="w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest italic shadow-xl active:scale-[0.98] transition-all disabled:opacity-30 text-white flex items-center justify-center gap-3"
            style={{ backgroundColor: grupoColor }}
          >
            <span className="material-symbols-outlined">calculate</span>
            Calcular Materiales
          </button>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  STEP 3: RESULTADO — EXPLOSIÓN DE MATERIALES          */}
      {/* ═══════════════════════════════════════════════════════ */}
      {step === 'resultado' && resultado && (
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Summary Badge */}
          <div className="p-4 rounded-2xl border flex items-center gap-4"
            style={{ backgroundColor: `${grupoColor}08`, borderColor: `${grupoColor}25` }}>
            <div className="size-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${grupoColor}20` }}>
              <span className="material-symbols-outlined text-2xl" style={{ color: grupoColor }}>{tipoMeta?.icon}</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-black text-white uppercase italic">{resultado.descripcion}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                {resultado.lineas.length} conceptos • {resultado.desperdicioAplicado}% desperdicio • {resultado.metrosTotales.toFixed(1)}m totales
              </p>
            </div>
          </div>

          {/* ─── EXPLOSION TABLE (White Card) ─────────────── */}
          <div className="bg-white text-background-dark rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-6 flex justify-between items-center" style={{ backgroundColor: grupoColor }}>
              <div className="text-white">
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-80">Motor Universal v3</h4>
                <p className="text-xl font-black italic tracking-tighter uppercase leading-none mt-1">Hoja de Insumos</p>
              </div>
              <span className="material-symbols-outlined text-4xl text-white/20">fact_check</span>
            </div>

            <div className="p-6 space-y-4">
              {resultado.lineas.map((item, idx) => {
                const asignado = assignments[idx];
                const mat = asignado?.materialId ? materials.find(m => m.id === asignado.materialId) : null;
                const precioUnitario = asignado?.manualPrice !== undefined ? asignado.manualPrice : (mat?.priceBase || 0);
                const costoLinea = precioUnitario > 0 ? (item.esPieza ? item.piezas * precioUnitario : item.tramosNecesarios * precioUnitario) : 0;

                return (
                  <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                    {/* Concept & Quantities */}
                    <div className="flex justify-between items-start">
                      <div className="max-w-[60%]">
                        <p className="text-[11px] font-black text-slate-800 uppercase italic leading-tight">{item.concepto}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">
                          {item.esPieza ? `${item.piezas} Pza(s) directas` : `${item.metrosLineales.toFixed(2)}m (+${resultado.desperdicioAplicado}% desp.)`}
                        </p>
                        <p className="text-[8px] text-slate-400 mt-0.5">
                          <span className="italic">Sugerido:</span> {item.materialSugerido}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black leading-none" style={{ color: grupoColor }}>
                          {item.esPieza ? item.piezas : item.tramosNecesarios}
                          <span className="text-[10px] ml-0.5">{item.esPieza ? 'Pzas' : 'Tramos'}</span>
                        </p>
                        {costoLinea > 0 && (
                          <p className="text-[10px] font-black text-slate-400 mt-1">${costoLinea.toLocaleString()}</p>
                        )}
                      </div>
                    </div>

                    {/* Material Assignment & Price Override */}
                    <div className="flex gap-2">
                      <select
                        className="flex-1 bg-white border border-slate-200 rounded-xl h-9 px-3 text-[10px] font-bold text-slate-600 outline-none focus:border-blue-400"
                        value={asignado?.materialId || ''}
                        onChange={e => {
                          const next = [...assignments];
                          next[idx] = { ...next[idx], materialId: e.target.value, manualPrice: undefined };
                          setAssignments(next);
                        }}
                      >
                        <option value="">-- Asignar Material --</option>
                        {materials.map(m => <option key={m.id} value={m.id}>{m.name} — ${m.priceBase}/{m.unit}</option>)}
                      </select>

                      <div className="w-24 relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">$</span>
                        <input
                          type="number"
                          className={`w-full bg-white border rounded-xl h-9 pl-4 pr-2 text-[10px] font-black outline-none transition-colors ${asignado?.manualPrice !== undefined ? 'border-primary text-primary' : 'border-slate-200 text-slate-600'}`}
                          value={asignado?.manualPrice !== undefined ? asignado.manualPrice : (mat?.priceBase || '')}
                          placeholder="Precio"
                          onChange={e => {
                            const next = [...assignments];
                            next[idx] = { ...next[idx], manualPrice: parseFloat(e.target.value) || 0 };
                            setAssignments(next);
                          }}
                        />
                        {asignado?.manualPrice !== undefined && (
                          <button
                            className="absolute -top-1.5 -right-1.5 size-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm"
                            onClick={() => {
                              const next = [...assignments];
                              const { manualPrice, ...rest } = next[idx];
                              next[idx] = rest;
                              setAssignments(next);
                            }}
                          >
                            <span className="material-symbols-outlined text-[10px]">close</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Sobrante Bar */}
                    {!item.esPieza && item.sobrante > 0 && (
                      <div className="pt-2 border-t border-slate-200">
                        <div className="flex justify-between text-[9px] font-black uppercase mb-1">
                          <span className="text-slate-400 italic">Optimización de Corte:</span>
                          <span className="text-green-600 font-mono">+{item.sobrante.toFixed(2)}m sobrante</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 transition-all duration-1000"
                            style={{ width: `${Math.max(5, (item.sobrante / (item.tramosNecesarios * 6)) * 100)}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ─── EXTRA ITEMS SECTION ─────────────────────────── */}
              {extraItems.length > 0 && (
                <div className="pt-4 border-t-2 border-slate-100 space-y-4">
                  <h5 className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-1">Materiales Adicionales</h5>
                  {extraItems.map((item, eIdx) => {
                    const mat = materials.find(m => m.id === item.materialId);
                    const priceToUse = item.manualPrice !== undefined ? item.manualPrice : (mat?.priceBase || 0);
                    return (
                      <div key={item.id} className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex justify-between items-center group">
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-blue-900 uppercase italic">{mat?.name || 'Material Extra'}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <input
                              type="number"
                              className="w-12 bg-white border border-blue-200 rounded-lg text-[10px] font-black px-2 py-1 text-center"
                              value={item.quantity}
                              onChange={e => {
                                const next = [...extraItems];
                                next[eIdx].quantity = Math.max(1, parseInt(e.target.value) || 1);
                                setExtraItems(next);
                              }}
                            />
                            <span className="text-[8px] font-bold text-blue-400">Pzas × ${priceToUse.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <p className="text-sm font-black text-blue-900">${(item.quantity * priceToUse).toLocaleString()}</p>
                          <button
                            className="size-6 bg-red-100 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                            onClick={() => setExtraItems(prev => prev.filter(ei => ei.id !== item.id))}
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Botón Agregar Extra */}
              <div className="relative">
                {!showAddExtra ? (
                  <button
                    onClick={() => setShowAddExtra(true)}
                    className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">add_circle</span>
                    Agregar Material Manual
                  </button>
                ) : (
                  <div className="bg-slate-100 p-4 rounded-3xl border border-slate-200 animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-3">
                      <h6 className="text-[10px] font-black uppercase text-slate-600">Catálogo Universal</h6>
                      <button onClick={() => setShowAddExtra(false)} className="text-slate-400 hover:text-red-500"><span className="material-symbols-outlined text-sm">close</span></button>
                    </div>
                    <select
                      className="w-full bg-white border border-slate-200 rounded-xl h-10 px-3 text-[10px] font-bold outline-none mb-2"
                      onChange={(e) => e.target.value && addNewExtraItem(e.target.value)}
                      defaultValue=""
                    >
                      <option value="">Selecciona material para añadir...</option>
                      {materials.map(m => (
                        <option key={m.id} value={m.id}>{m.name} — ${m.priceBase}/{m.unit}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* ─── TOTALES ──────────────────────────────────── */}
              <div className="pt-6 border-t-2 border-dashed border-slate-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Subtotal Materiales</p>
                    <p className="text-3xl font-black italic tracking-tighter text-background-dark">${costoMateriales.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={exportPDF}
                    className="size-14 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex flex-col items-center justify-center active:scale-90 transition-all"
                  >
                    <span className="material-symbols-outlined">picture_as_pdf</span>
                    <span className="text-[7px] font-black uppercase mt-1">PDF</span>
                  </button>
                </div>

                {/* Mano de Obra */}
                <div className="mt-4 p-4 bg-slate-100 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase text-slate-500">Mano de Obra</span>
                      <select className="bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-500 px-2 py-0.5" value={manoObraFactor} onChange={e => setManoObraFactor(parseFloat(e.target.value))}>
                        <option value="0.35">35%</option>
                        <option value="0.40">40%</option>
                        <option value="0.45">45%</option>
                        <option value="0.50">50%</option>
                        <option value="0.55">55%</option>
                        <option value="0.60">60%</option>
                      </select>
                    </div>
                    <span className="text-[10px] font-black text-slate-500">${costoManoObra.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-200 pt-3">
                    <span className="text-sm font-black uppercase text-slate-800">Presupuesto Final</span>
                    <span className="text-xl font-black" style={{ color: grupoColor }}>${costoTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Generar Orden */}
                <button
                  onClick={guardarCotizacion}
                  disabled={loading || costoMateriales === 0}
                  className="w-full mt-4 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest italic shadow-xl active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-3 text-white"
                  style={{ backgroundColor: '#15191d' }}
                >
                  <span className="material-symbols-outlined">{loading ? 'hourglass_empty' : 'receipt_long'}</span>
                  {loading ? 'Procesando...' : 'Generar Orden de Compra'}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default BudgetCreator;
