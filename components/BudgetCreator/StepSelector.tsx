import React from 'react';
import { TipoTrabajo, CATALOGO_TIPOS } from '../../engineCalc';

interface StepSelectorProps {
    onSelect: (tipo: TipoTrabajo) => void;
    grupoColors: Record<string, string>;
}

export const StepSelector: React.FC<StepSelectorProps> = ({ onSelect, grupoColors }) => {
    return (
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
                                    onClick={() => onSelect(t.id)}
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
    );
};
