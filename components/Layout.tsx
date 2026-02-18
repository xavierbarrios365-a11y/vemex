
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiGet } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
}

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Resumen', subtitle: 'Panel de Control' },
  '/budget': { title: 'Ingeniería', subtitle: 'Cotizaciones y Presupuestos' },
  '/projects': { title: 'Taller', subtitle: 'Gestión de Proyectos' },
  '/inventory': { title: 'Almacén', subtitle: 'Control de Inventario' },
  '/finance': { title: 'Finanzas', subtitle: 'Ingresos y Egresos' },
};

interface Notif {
  id: string;
  icon: string;
  text: string;
  severity: 'danger' | 'warning' | 'info';
  path: string;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const meta = PAGE_META[location.pathname] || PAGE_META['/'];
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(apiGet('getKPIs'));
        const d = await res.json();
        if (d && !d.error) {
          const list: Notif[] = [];
          if (d.retrasosCriticos > 0) list.push({ id: 'r', icon: 'schedule', text: `${d.retrasosCriticos} proyecto(s) con entrega vencida`, severity: 'danger', path: '/projects' });
          if (d.stockBajoCount > 0) list.push({ id: 's', icon: 'package_2', text: `${d.stockBajoCount} material(es) en stock crítico`, severity: 'warning', path: '/inventory' });
          if (d.cotizacionesActivas > 0) list.push({ id: 'c', icon: 'description', text: `${d.cotizacionesActivas} cotización(es) pendiente(s)`, severity: 'info', path: '/budget' });
          setNotifs(list);
        }
      } catch { }
    };
    load();
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const sevColors = { danger: 'text-danger-red bg-danger-red/10', warning: 'text-safety-orange bg-safety-orange/10', info: 'text-primary bg-primary/10' };

  const navItems = [
    { id: 'dashboard', path: '/', label: 'Inicio', icon: 'home' },
    { id: 'budget', path: '/budget', label: 'Ingeniería', icon: 'architecture' },
    { id: 'projects', path: '/projects', label: 'Proyectos', icon: 'precision_manufacturing' },
    { id: 'inventory', path: '/inventory', label: 'Inventario', icon: 'inventory_2' },
    { id: 'finance', path: '/finance', label: 'Finanzas', icon: 'account_balance_wallet' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background-dark text-slate-100 industrial-grid">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-dark/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">dashboard</span>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{meta.subtitle}</p>
            <h1 className="text-lg font-bold leading-none">{meta.title}</h1>
          </div>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg bg-card-dark border border-slate-700 active:scale-90 transition-all"
            title="Notificaciones"
          >
            <span className="material-symbols-outlined text-slate-300">notifications</span>
            {notifs.length > 0 && (
              <span className="absolute -top-1 -right-1 size-4 bg-danger-red rounded-full text-[8px] font-black flex items-center justify-center text-white animate-pulse">
                {notifs.length}
              </span>
            )}
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-12 w-72 bg-card-dark border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100]">
              <div className="px-4 py-3 border-b border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Alertas Activas</p>
              </div>
              {notifs.length === 0 ? (
                <div className="p-6 text-center">
                  <span className="material-symbols-outlined text-3xl text-slate-700 mb-2">check_circle</span>
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Todo en orden</p>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto">
                  {notifs.map(n => (
                    <Link
                      key={n.id}
                      to={n.path}
                      onClick={() => setShowNotifs(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all"
                    >
                      <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${sevColors[n.severity]}`}>
                        <span className="material-symbols-outlined text-sm">{n.icon}</span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium">{n.text}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card-dark border-t border-slate-800 px-2 pb-6 pt-2 z-50">
        <div className="max-w-md mx-auto flex justify-around items-center">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex flex-col items-center gap-1 group px-3 py-1 rounded-xl transition-all ${isActive ? 'text-primary' : 'text-slate-500'
                  }`}
              >
                <span className={`material-symbols-outlined text-[26px] ${isActive ? 'fill-1' : ''}`}
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                  {item.icon}
                </span>
                <span className="text-[10px] font-black uppercase tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
