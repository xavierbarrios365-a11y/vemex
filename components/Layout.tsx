
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

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
          <div className="relative">
            <div className="size-10 rounded-full bg-primary/20 border-2 border-primary overflow-hidden">
              <img
                alt="User profile"
                className="w-full h-full object-cover"
                src="https://picsum.photos/seed/sahel/100/100"
              />
            </div>
            <div className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-background-dark rounded-full"></div>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Vemex Industrial Systems</p>
            <h1 className="text-lg font-bold leading-none">Hola, Sahel</h1>
          </div>
        </div>
        <button
          onClick={() => alert('Sin notificaciones nuevas')}
          className="relative p-2 rounded-lg bg-card-dark border border-slate-700 active:scale-90 transition-all"
          title="Notificaciones"
        >
          <span className="material-symbols-outlined text-slate-300">notifications</span>
        </button>
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
