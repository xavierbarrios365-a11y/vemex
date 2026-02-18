import React, { useEffect, useState } from 'react';
import { API_URL } from '../constants';

const Kanban: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const setDemoProjects = () => {
    setProjects([
      { id: 'P-001', name: 'Portón Residencial Lomas', client: 'Arq. Martínez', status: 'En Producción', type: 'HERRERÍA' },
      { id: 'P-002', name: 'Reja Perimetral Nave 3', client: 'Industrial del Norte', status: 'Por Cotizar', type: 'CERRAMIENTO' },
      { id: 'P-003', name: 'Techo Estacionamiento', client: 'Plaza Comercial', status: 'En Producción', type: 'TECHUMBRE' },
      { id: 'P-004', name: 'Escalera Caracol Oficinas', client: 'Despacho Luna', status: 'Terminado', type: 'ESCALERA' },
    ]);
  };

  const cargarProyectos = async () => {
    setLoading(true);
    // @ts-ignore
    const gContext = window.google;
    if (gContext && gContext.script && gContext.script.run) {
      gContext.script.run
        .withSuccessHandler((data: any) => {
          if (Array.isArray(data) && data.length > 0) setProjects(data);
          else setDemoProjects();
          setLoading(false);
        })
        .withFailureHandler(() => {
          setDemoProjects();
          setLoading(false);
        })
        .getDataProyectos();
      return;
    }

    // HTTP fallback
    try {
      const response = await fetch(`${API_URL}?action=getProyectos`);
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setProjects(data);
      } else {
        setDemoProjects();
      }
    } catch {
      setDemoProjects();
    } finally {
      setLoading(false);
    }
  };

  const moverProyecto = async (id: string, nuevoEstatus: string) => {
    setUpdatingId(id);
    // @ts-ignore
    const gContext = window.google;
    if (gContext && gContext.script && gContext.script.run) {
      gContext.script.run
        .withSuccessHandler(() => {
          setUpdatingId(null);
          cargarProyectos();
        })
        .withFailureHandler(() => {
          // Fallback: update locally
          setProjects(prev => prev.map(p => p.id === id ? { ...p, status: nuevoEstatus } : p));
          setUpdatingId(null);
        })
        .actualizarEstatusProyecto({ id, nuevoEstatus });
    } else {
      // HTTP fallback
      try {
        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'actualizarEstatusProyecto', data: { id, nuevoEstatus } }),
        });
        cargarProyectos();
      } catch {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, status: nuevoEstatus } : p));
      }
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    cargarProyectos();
  }, []);

  const columns = [
    { id: 'Por Cotizar', title: 'Por Cotizar', color: 'slate' },
    { id: 'En Producción', title: 'Producción', color: 'primary' },
    { id: 'Terminado', title: 'Terminado', color: 'green' }
  ];

  const getSiguienteEstatus = (actual: string) => {
    if (actual === 'Por Cotizar') return 'En Producción';
    if (actual === 'En Producción') return 'Terminado';
    return null;
  };

  const getAnteriorEstatus = (actual: string) => {
    if (actual === 'Terminado') return 'En Producción';
    if (actual === 'En Producción') return 'Por Cotizar';
    return null;
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background-dark industrial-grid">
      <div className="flex gap-4 p-4 overflow-x-auto no-scrollbar snap-x snap-mandatory flex-1 items-start">
        {loading ? (
          <div className="w-full h-96 flex flex-col items-center justify-center gap-4 opacity-50">
            <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando Taller...</p>
          </div>
        ) : columns.map(col => (
          <div key={col.id} className="min-w-[85vw] md:min-w-[350px] flex flex-col snap-center h-full max-h-screen">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] italic flex items-center gap-2">
                <div className={`size-2 rounded-full bg-${col.color === 'primary' ? 'primary' : (col.color === 'green' ? 'green-500' : 'slate-500')} animate-pulse`}></div>
                {col.title}
                <span className="opacity-30 ml-1">({projects.filter(p => p.status === col.id).length})</span>
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-24">
              {projects.filter(p => p.status === col.id).map(p => (
                <div key={p.id} className={`bg-card-dark border border-white/5 p-5 rounded-3xl shadow-xl transition-all ${updatingId === p.id ? 'opacity-50 scale-95' : 'hover:border-primary/40'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[9px] font-black text-primary uppercase tracking-widest">{p.type || 'Industria'}</span>
                      <h4 className="font-black text-white italic tracking-tight">{p.name}</h4>
                      <span className="text-[9px] font-bold text-slate-500 uppercase">{p.client}</span>
                    </div>
                    <div className="size-10 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-500 text-lg">precision_manufacturing</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex gap-2">
                      {getAnteriorEstatus(p.status) && (
                        <button
                          onClick={() => moverProyecto(p.id, getAnteriorEstatus(p.status)!)}
                          className="size-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-700 active:scale-90"
                        >
                          <span className="material-symbols-outlined text-sm">arrow_back</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-slate-600 uppercase"># {p.id.slice(-4)}</span>
                      {getSiguienteEstatus(p.status) && (
                        <button
                          onClick={() => moverProyecto(p.id, getSiguienteEstatus(p.status)!)}
                          className="px-3 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all active:scale-90"
                        >
                          Avanzar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {projects.filter(p => p.status === col.id).length === 0 && (
                <div className="h-32 rounded-3xl border-2 border-dashed border-white/5 flex items-center justify-center">
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">Sin proyectos</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-24 right-4 z-40">
        <button className="size-16 rounded-2xl bg-safety-orange text-white shadow-2xl flex items-center justify-center border-4 border-background-dark active:scale-95 transition-all">
          <span className="material-symbols-outlined text-3xl">add_task</span>
        </button>
      </div>
    </div>
  );
};

export default Kanban;
