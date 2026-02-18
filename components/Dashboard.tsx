
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../constants';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState({
    porCobrar: 0,
    proyectosActivos: 0,
    gastosMes: 0,
    retrasosCriticos: 0,
    stockBajoCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const cargarKPIs = async () => {
    setLoading(true);
    setIsDemoMode(false);

    // @ts-ignore
    const gContext = window.google;

    if (gContext && gContext.script && gContext.script.run) {
      gContext.script.run
        .withSuccessHandler((data: any) => {
          if (data && !data.error) {
            setKpis(data);
          } else {
            console.error("Backend error:", data?.error);
            setDemoData();
          }
          setLoading(false);
        })
        .withFailureHandler((err: any) => {
          console.error("Connection error:", err);
          setDemoData();
          setLoading(false);
        })
        .getKPIs();
      return;
    }

    try {
      const response = await fetch(apiGet('getKPIs'));
      const data = await response.json();
      if (data && !data.error) {
        setKpis(data);
      } else {
        throw new Error("Data format error");
      }
    } catch (err: any) {
      setIsDemoMode(true);
      setDemoData();
    } finally {
      setLoading(false);
    }
  };

  const setDemoData = () => {
    setIsDemoMode(true);
  };

  useEffect(() => {
    cargarKPIs();
  }, []);

  return (
    <div className="p-4 space-y-6">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {isDemoMode ? (
            <div className="bg-primary/10 border border-primary/30 px-3 py-1 rounded-full flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[10px]">cloud_off</span>
              <p className="text-[10px] text-primary font-black uppercase tracking-widest">Modo Local (Sin Red)</p>
            </div>
          ) : (
            <div className="bg-green-500/10 border border-green-500/30 px-3 py-1 rounded-full flex items-center gap-2">
              <div className="size-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-[10px] text-green-500 font-black uppercase tracking-widest">Planta Conectada</p>
            </div>
          )}
        </div>
        <button onClick={cargarKPIs} className="p-2 bg-card-dark border border-white/5 rounded-xl text-slate-400 active:rotate-180 transition-all duration-500">
          <span className="material-symbols-outlined text-sm">sync</span>
        </button>
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card-dark border-l-4 border-primary p-6 rounded-2xl shadow-xl">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 opacity-80 italic">Saldo por Cobrar</p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-black text-white tracking-tighter">
              {loading && !isDemoMode ? "..." : `$${(kpis.porCobrar || 0).toLocaleString()}`}
            </p>
            <small className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">mxn</small>
          </div>
        </div>
        <div className="bg-card-dark border-l-4 border-slate-600 p-6 rounded-2xl shadow-xl">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 opacity-80 italic">Proyectos Activos</p>
          <p className="text-3xl font-black text-white tracking-tighter">
            {loading && !isDemoMode ? "..." : kpis.proyectosActivos}
          </p>
        </div>
        <div className="bg-card-dark border-l-4 border-safety-orange p-6 rounded-2xl shadow-xl">
          <p className="text-[10px] font-black text-safety-orange uppercase tracking-[0.2em] mb-2 opacity-80 italic">Gastos del Mes</p>
          <p className="text-3xl font-black text-white tracking-tighter">
            {loading && !isDemoMode ? "..." : `$${(kpis.gastosMes || 0).toLocaleString()}`}
          </p>
        </div>
      </section>

      {/* Critical Alerts */}
      <section>
        <div className="bg-danger-red/5 border border-danger-red/20 rounded-3xl overflow-hidden shadow-2xl">
          <div className="bg-danger-red px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-white text-xl">gavel</span>
              <h2 className="text-white text-xs font-black uppercase tracking-[0.3em]">Estado de Planta</h2>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div
              onClick={() => navigate('/projects')}
              className={`flex items-center justify-between group cursor-pointer p-3 hover:bg-white/5 rounded-2xl transition-all ${kpis.retrasosCriticos > 0 ? 'opacity-100' : 'opacity-30'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`size-12 rounded-2xl ${kpis.retrasosCriticos > 0 ? 'bg-danger-red/20' : 'bg-slate-800'} flex items-center justify-center`}>
                  <span className={`material-symbols-outlined ${kpis.retrasosCriticos > 0 ? 'text-danger-red animate-pulse' : 'text-slate-600'}`}>schedule</span>
                </div>
                <div>
                  <p className="text-sm font-black text-white italic">{kpis.retrasosCriticos} Retrasos Críticos</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    {kpis.retrasosCriticos > 0 ? 'Entrega vencida hoy' : 'Sin retrasos pendientes'}
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-700">chevron_right</span>
            </div>

            <div className="h-[1px] bg-white/5 w-full"></div>

            <div
              onClick={() => navigate('/inventory')}
              className={`flex items-center justify-between group cursor-pointer p-3 hover:bg-white/5 rounded-2xl transition-all ${kpis.stockBajoCount > 0 ? 'opacity-100' : 'opacity-30'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`size-12 rounded-2xl ${kpis.stockBajoCount > 0 ? 'bg-danger-red/20' : 'bg-slate-800'} flex items-center justify-center`}>
                  <span className={`material-symbols-outlined ${kpis.stockBajoCount > 0 ? 'text-danger-red' : 'text-slate-600'}`}>package_2</span>
                </div>
                <div>
                  <p className="text-sm font-black text-white italic">{kpis.stockBajoCount} Materiales en Stock Crítico</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Insumos bajo el nivel mínimo</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-700">chevron_right</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-5 pl-1 italic">Operación Rápida</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Ingeniería', icon: 'architecture', path: '/budget', color: 'primary' },
            { label: 'Clientes', icon: 'person_add', path: '/finance', color: 'primary' },
            { label: 'Gasto', icon: 'payments', path: '/finance', color: 'safety-orange' },
          ].map(action => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center justify-center aspect-square bg-card-dark border border-white/5 rounded-3xl active:scale-90 transition-all hover:border-primary/40 group relative overflow-hidden"
            >
              <div className={`size-14 rounded-2xl bg-${action.color}/5 group-hover:bg-${action.color}/20 flex items-center justify-center mb-3 transition-colors`}>
                <span className={`material-symbols-outlined text-${action.color} text-3xl`}>{action.icon}</span>
              </div>
              <span className="text-[9px] font-black text-center leading-tight uppercase tracking-widest text-slate-400 group-hover:text-white">{action.label}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
