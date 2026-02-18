import React from 'react';
import { ResultadoCalculo, LineaMaterial } from '../../engineCalc';
import { UniversalMaterial } from '../../materialDatabase';
import { MaterialAssignment, ExtraItem } from './types';

interface ResultViewProps {
    resultado: ResultadoCalculo;
    grupoColor: string;
    tipoMeta: any;
    materials: UniversalMaterial[];
    assignments: MaterialAssignment[];
    setAssignments: (val: MaterialAssignment[]) => void;
    extraItems: ExtraItem[];
    setExtraItems: (val: ExtraItem[] | ((prev: ExtraItem[]) => ExtraItem[])) => void;
    showAddExtra: boolean;
    setShowAddExtra: (val: boolean) => void;
    addNewExtraItem: (matId: string) => void;
    costoMateriales: number;
    manoObraFactor: number;
    setManoObraFactor: (val: number) => void;
    costoManoObra: number;
    costoTotal: number;
    loading: boolean;
    onExportPDF: () => void;
    onSave: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
    resultado,
    grupoColor,
    tipoMeta,
    materials,
    assignments,
    setAssignments,
    extraItems,
    setExtraItems,
    showAddExtra,
    setShowAddExtra,
    addNewExtraItem,
    costoMateriales,
    manoObraFactor,
    setManoObraFactor,
    costoManoObra,
    costoTotal,
    loading,
    onExportPDF,
    onSave
}) => {
    return (
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
                                onClick={onExportPDF}
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
                            onClick={onSave}
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
    );
};
