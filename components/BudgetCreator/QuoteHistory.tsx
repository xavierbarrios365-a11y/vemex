import React from 'react';

export interface QuoteRecord {
    id: string;
    clienteId: string;
    clienteNombre: string;
    tipoTrabajo: string;
    fecha: string;
    total: number;
    estado: string;
}

interface QuoteHistoryProps {
    quotes: QuoteRecord[];
    loading: boolean;
    onRefresh: () => void;
    onNewQuote: () => void;
}

const statusColors: Record<string, string> = {
    'Pendiente': 'text-safety-orange bg-safety-orange/10 border-safety-orange/20',
    'Aprobada': 'text-green-500 bg-green-500/10 border-green-500/20',
    'Rechazada': 'text-danger-red bg-danger-red/10 border-danger-red/20',
    'Vencida': 'text-slate-500 bg-slate-500/10 border-slate-500/20',
};

export const QuoteHistory: React.FC<QuoteHistoryProps> = ({ quotes, loading, onRefresh, onNewQuote }) => {

    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch { return dateStr; }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-black text-white italic tracking-tight">Mis Ingenierías</h2>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{quotes.length} cotizaciones registradas</p>
                </div>
                <button
                    onClick={onRefresh}
                    className="p-2 bg-card-dark border border-white/5 rounded-xl text-slate-400 active:rotate-180 transition-all duration-500"
                >
                    <span className="material-symbols-outlined text-sm">sync</span>
                </button>
            </div>

            {/* New Button */}
            <button
                onClick={onNewQuote}
                className="w-full py-5 rounded-2xl bg-primary font-black uppercase text-xs tracking-widest italic shadow-xl active:scale-[0.98] transition-all text-white flex items-center justify-center gap-3"
            >
                <span className="material-symbols-outlined">add_circle</span>
                Nueva Ingeniería
            </button>

            {/* Loading */}
            {loading && (
                <div className="py-16 flex flex-col items-center gap-4 opacity-50">
                    <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest">Cargando cotizaciones...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && quotes.length === 0 && (
                <div className="py-16 flex flex-col items-center gap-4 opacity-40">
                    <span className="material-symbols-outlined text-5xl text-slate-600">architecture</span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-center">
                        Sin ingenierías registradas<br />
                        <span className="text-slate-600">Crea tu primera cotización</span>
                    </p>
                </div>
            )}

            {/* Quotes List */}
            {!loading && quotes.map(q => {
                const stColors = statusColors[q.estado] || statusColors['Pendiente'];
                return (
                    <div key={q.id} className="bg-card-dark border border-white/5 p-5 rounded-3xl shadow-xl hover:border-primary/30 transition-all active:scale-[0.98]">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <span className="text-[9px] font-black text-primary uppercase tracking-widest">{q.tipoTrabajo}</span>
                                <h4 className="font-black text-white italic tracking-tight text-sm">{q.clienteNombre}</h4>
                                <span className="text-[9px] font-bold text-slate-500">{formatDate(q.fecha)}</span>
                            </div>
                            <div className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${stColors}`}>
                                {q.estado}
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">#{q.id}</span>
                            <span className="text-lg font-black text-white font-mono">${q.total.toLocaleString()}<small className="text-[9px] text-slate-500 ml-1">MXN</small></span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
