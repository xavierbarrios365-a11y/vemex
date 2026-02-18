import React from 'react';
import { TipoTrabajo, ConfigCalculo, getGrupo, TipoTrabajoMeta } from '../../engineCalc';

interface ConfigPanelProps {
    tipoTrabajo: TipoTrabajo;
    tipoMeta: TipoTrabajoMeta | null;
    grupoColor: string;
    ancho: number;
    alto: number;
    config: ConfigCalculo;
    setAncho: (val: number) => void;
    setAlto: (val: number) => void;
    clienteNombre: string;
    setClienteNombre: (val: string) => void;
    clienteEmpresa: string;
    setClienteEmpresa: (val: string) => void;
    proyectoUbicacion: string;
    setProyectoUbicacion: (val: string) => void;
    updateConfig: <K extends keyof ConfigCalculo>(key: K, val: ConfigCalculo[K]) => void;
    onCalculate: () => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
    tipoTrabajo,
    tipoMeta,
    grupoColor,
    ancho,
    alto,
    config,
    setAncho,
    setAlto,
    clienteNombre,
    setClienteNombre,
    clienteEmpresa,
    setClienteEmpresa,
    proyectoUbicacion,
    setProyectoUbicacion,
    updateConfig,
    onCalculate
}) => {
    const grupo = getGrupo(tipoTrabajo);

    return (
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
                        {grupo === 'lineales' ? 'Longitud (m)' : grupo === 'escaleras' ? 'Ancho Peldaño (m)' : 'Ancho (m)'}
                    </label>
                    <input type="number" step="0.01" className="w-full bg-slate-900 border-none rounded-xl h-12 px-4 text-white font-mono text-xl font-bold" value={ancho || ''} onChange={e => setAncho(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="bg-card-dark p-4 rounded-3xl border border-white/5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                        {grupo === 'techumbres' ? 'Largo/Caída (m)' : 'Alto (m)'}
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
                {grupo === 'cerramientos' && (
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
                            <select className="w-full bg-slate-900 rounded-xl h-9 px-3 text-xs text-white" value={config.rellenoTipo ?? 'barrotes'} onChange={e => updateConfig('rellenoTipo', e.target.value as any)}>
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
                {grupo === 'lineales' && (
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
                {grupo === 'techumbres' && (
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
                {grupo === 'escaleras' && (
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
                onClick={onCalculate}
                disabled={alto <= 0 || ancho <= 0}
                className="w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest italic shadow-xl active:scale-[0.98] transition-all disabled:opacity-30 text-white flex items-center justify-center gap-3"
                style={{ backgroundColor: grupoColor }}
            >
                <span className="material-symbols-outlined">calculate</span>
                Calcular Materiales
            </button>
        </section>
    );
};
