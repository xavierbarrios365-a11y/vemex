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

/**
 * Helper: numeric input that shows empty placeholder by default,
 * allows clearing, and only commits the parsed number on blur.
 */
const NumInput: React.FC<{
    value: number | undefined;
    onChange: (n: number) => void;
    step?: string;
    placeholder?: string;
    className?: string;
    min?: number;
}> = ({ value, onChange, step = '0.01', placeholder = '0', className = '', min }) => {
    const [localVal, setLocalVal] = React.useState<string>(value != null && value !== 0 ? String(value) : '');

    React.useEffect(() => {
        setLocalVal(value != null && value !== 0 ? String(value) : '');
    }, [value]);

    return (
        <input
            type="number"
            step={step}
            min={min}
            placeholder={placeholder}
            className={className}
            value={localVal}
            onChange={e => setLocalVal(e.target.value)}
            onBlur={() => {
                const parsed = parseFloat(localVal);
                onChange(isNaN(parsed) ? 0 : parsed);
            }}
        />
    );
};

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
    const inputCls = 'w-full bg-slate-900 rounded-xl h-9 px-3 text-xs text-white';
    const bigInputCls = 'w-full bg-slate-900 border-none rounded-xl h-12 px-4 text-white font-mono text-xl font-bold';

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
                    <NumInput value={ancho} onChange={setAncho} className={bigInputCls} placeholder="0.00" />
                </div>
                <div className="bg-card-dark p-4 rounded-3xl border border-white/5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                        {grupo === 'techumbres' ? 'Largo/Caída (m)' : 'Alto (m)'}
                    </label>
                    <NumInput value={alto} onChange={setAlto} className={bigInputCls} placeholder="0.00" />
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
                            <NumInput value={config.separacionBarrotes ?? 0.12} onChange={v => updateConfig('separacionBarrotes', v)} className={inputCls} placeholder="0.12" />
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-500 uppercase pl-1">Grosor Marco (m)</label>
                            <NumInput step="0.001" value={config.grosorMarco ?? 0.038} onChange={v => updateConfig('grosorMarco', v)} className={inputCls} placeholder="0.038" />
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-500 uppercase pl-1">Relleno</label>
                            <select className={inputCls} value={config.rellenoTipo ?? 'barrotes'} onChange={e => updateConfig('rellenoTipo', e.target.value as any)}>
                                <option value="barrotes">Barrotes</option>
                                <option value="lamina">Lámina</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-500 uppercase pl-1">Refuerzos Int.</label>
                            <NumInput step="1" value={config.refuerzosInternos ?? 0} onChange={v => updateConfig('refuerzosInternos', Math.round(v))} className={inputCls} placeholder="0" />
                        </div>
                    </div>
                )}

                {/* LINEALES */}
                {grupo === 'lineales' && (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[8px] font-black text-slate-500 uppercase pl-1">Sep. Postes (m)</label>
                            <NumInput step="0.1" value={config.separacionPostes ?? 1.5} onChange={v => updateConfig('separacionPostes', v)} className={inputCls} placeholder="1.5" />
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-500 uppercase pl-1">Líneas Horiz.</label>
                            <NumInput step="1" value={config.lineasHorizontales ?? 3} onChange={v => updateConfig('lineasHorizontales', Math.round(v))} className={inputCls} placeholder="3" />
                        </div>
                    </div>
                )}

                {/* TECHUMBRES */}
                {grupo === 'techumbres' && (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[8px] font-black text-slate-500 uppercase pl-1">Sep. Vigas (m)</label>
                            <NumInput step="0.5" value={config.separacionVigas ?? 3} onChange={v => updateConfig('separacionVigas', v)} className={inputCls} placeholder="3" />
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-500 uppercase pl-1">Sep. Montenes (m)</label>
                            <NumInput step="0.5" value={config.separacionMontenes ?? 1} onChange={v => updateConfig('separacionMontenes', v)} className={inputCls} placeholder="1" />
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-500 uppercase pl-1">Vuelo/Alero (m)</label>
                            <NumInput step="0.05" value={config.vueloTecho ?? 0.3} onChange={v => updateConfig('vueloTecho', v)} className={inputCls} placeholder="0.3" />
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-500 uppercase pl-1">Largo Lámina (m)</label>
                            <NumInput value={config.largoLamina ?? 3.66} onChange={v => updateConfig('largoLamina', v)} className={inputCls} placeholder="3.66" />
                        </div>
                    </div>
                )}

                {/* ESCALERAS */}
                {grupo === 'escaleras' && (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[8px] font-black text-slate-500 uppercase pl-1">Altura Paso (m)</label>
                            <NumInput value={config.alturaPaso ?? 0.18} onChange={v => updateConfig('alturaPaso', v)} className={inputCls} placeholder="0.18" />
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-500 uppercase pl-1">Huella (m)</label>
                            <NumInput value={config.huellaEscalon ?? 0.28} onChange={v => updateConfig('huellaEscalon', v)} className={inputCls} placeholder="0.28" />
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
