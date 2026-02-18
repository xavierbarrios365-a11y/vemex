import React, { useEffect, useState } from 'react';
import { apiGet, apiPostBody } from '../constants';

interface Project {
  id: string;
  name: string;
  client: string;
  status: string;
  type: string;
}

const TIPOS_PROYECTO = ['HERRERÍA', 'CERRAMIENTO', 'TECHUMBRE', 'ESCALERA', 'ESTRUCTURA', 'OTRO'];

const Kanban: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newProject, setNewProject] = useState({
    nombre: '',
    tipo: 'HERRERÍA',
    clienteId: '',
    fechaEntrega: ''
  });

  const cargarProyectos = async () => {
    setLoading(true);
    // @ts-ignore
    const gContext = window.google;
    if (gContext && gContext.script && gContext.script.run) {
      gContext.script.run
        .withSuccessHandler((data: any) => {
          if (Array.isArray(data)) setProjects(data);
          setLoading(false);
        })
        .withFailureHandler(() => {
          setLoading(false);
        })
        .getDataProyectos();
      return;
    }

    try {
      const response = await fetch(apiGet('getProyectos'));
      const data = await response.json();
      if (Array.isArray(data)) setProjects(data);
    } catch {
      // No connection — projects stay empty
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
          setProjects(prev => prev.map(p => p.id === id ? { ...p, status: nuevoEstatus } : p));
          setUpdatingId(null);
        })
        .actualizarEstatusProyecto({ id, nuevoEstatus });
    } else {
      try {
        await fetch(apiGet(''), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: apiPostBody('actualizarEstatusProyecto', { id, nuevoEstatus }),
        });
        cargarProyectos();
      } catch {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, status: nuevoEstatus } : p));
      }
      setUpdatingId(null);
    }
  };

  const crearProyecto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.nombre.trim()) return;
    setIsSaving(true);

    const data = { ...newProject };

    // @ts-ignore
    const gContext = window.google;
    if (gContext && gContext.script && gContext.script.run) {
      gContext.script.run
        .withSuccessHandler(() => {
          setIsSaving(false);
          setShowNewModal(false);
          setNewProject({ nombre: '', tipo: 'HERRERÍA', clienteId: '', fechaEntrega: '' });
          cargarProyectos();
        })
        .withFailureHandler(() => {
          setIsSaving(false);
          alert('Error al crear proyecto');
        })
        .agregarNuevoProyecto(data);
    } else {
      try {
        const response = await fetch(apiGet(''), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: apiPostBody('agregarNuevoProyecto', data),
        });
        const result = await response.json();
        if (result.success) {
          setShowNewModal(false);
          setNewProject({ nombre: '', tipo: 'HERRERÍA', clienteId: '', fechaEntrega: '' });
          cargarProyectos();
        }
      } catch {
        // Local fallback: add to state directly
        setProjects(prev => [...prev, {
          id: 'PRY-' + Date.now(),
          name: data.nombre,
          client: data.clienteId || 'Sin cliente',
          status: 'Por Cotizar',
          type: data.tipo
        }]);
        setShowNewModal(false);
        setNewProject({ nombre: '', tipo: 'HERRERÍA', clienteId: '', fechaEntrega: '' });
      }
      setIsSaving(false);
    }
  };

  const eliminarProyecto = async (project: Project) => {
    if (!confirm(`¿Eliminar "${project.name}"?\nEsta acción no se puede deshacer.`)) return;
    // @ts-ignore
    const gContext = window.google;
    if (gContext && gContext.script && gContext.script.run) {
      gContext.script.run
        .withSuccessHandler(() => cargarProyectos())
        .withFailureHandler(() => setProjects(prev => prev.filter(p => p.id !== project.id)))
        .eliminarProyecto({ id: project.id });
    } else {
      try {
        await fetch(apiGet(''), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: apiPostBody('eliminarProyecto', { id: project.id }),
        });
        cargarProyectos();
      } catch {
        setProjects(prev => prev.filter(p => p.id !== project.id));
      }
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
                      <button
                        onClick={() => eliminarProyecto(p)}
                        className="size-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-600 hover:text-danger-red hover:bg-danger-red/10 active:scale-90 transition-all"
                        title="Eliminar proyecto"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
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

      {/* FAB — New Project */}
      <div className="fixed bottom-24 right-4 z-40">
        <button
          onClick={() => setShowNewModal(true)}
          className="size-16 rounded-2xl bg-safety-orange text-white shadow-2xl flex items-center justify-center border-4 border-background-dark active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-3xl">add_task</span>
        </button>
      </div>

      {/* New Project Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background-dark/90 backdrop-blur-md" onClick={() => setShowNewModal(false)}></div>
          <div className="relative w-full max-w-md bg-card-dark rounded-3xl p-8 border border-white/10 shadow-2xl">
            <h2 className="text-xl font-black text-white mb-6 italic">NUEVO PROYECTO</h2>
            <form onSubmit={crearProyecto} className="space-y-4">
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase pl-1 block mb-1">Nombre del Proyecto *</label>
                <input
                  required
                  placeholder="Ej: Portón Residencial Lomas"
                  className="w-full h-14 bg-slate-900 border-white/5 border rounded-xl px-4 text-white"
                  value={newProject.nombre}
                  onChange={e => setNewProject({ ...newProject, nombre: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase pl-1 block mb-1">Tipo</label>
                  <select
                    className="w-full h-14 bg-slate-900 border-white/5 border rounded-xl px-4 text-white font-bold"
                    value={newProject.tipo}
                    onChange={e => setNewProject({ ...newProject, tipo: e.target.value })}
                  >
                    {TIPOS_PROYECTO.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase pl-1 block mb-1">Fecha Entrega</label>
                  <input
                    type="date"
                    className="w-full h-14 bg-slate-900 border-white/5 border rounded-xl px-4 text-white"
                    value={newProject.fechaEntrega}
                    onChange={e => setNewProject({ ...newProject, fechaEntrega: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase pl-1 block mb-1">ID Cliente (opcional)</label>
                <input
                  placeholder="Ej: CLI-001"
                  className="w-full h-14 bg-slate-900 border-white/5 border rounded-xl px-4 text-white"
                  value={newProject.clienteId}
                  onChange={e => setNewProject({ ...newProject, clienteId: e.target.value })}
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 py-5 border border-white/10 rounded-2xl font-black uppercase text-sm tracking-widest text-slate-400 hover:text-white transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-5 bg-safety-orange hover:bg-safety-orange/90 rounded-2xl font-black uppercase text-sm tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 text-white"
                >
                  {isSaving ? <div className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 'CREAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Kanban;
