
import React, { useState, useEffect } from 'react';
import { apiGet, apiPostBody } from '../constants';

type TabId = 'operaciones' | 'reportes';

const Finance: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('operaciones');

  const [formData, setFormData] = useState({
    monto: '',
    categoria: 'Material',
    concepto: '',
    tipo: 'Egreso'
  });

  const fetchData = async () => {
    setLoading(true);
    // @ts-ignore
    const gContext = window.google;

    if (gContext && gContext.script && gContext.script.run) {
      gContext.script.run.withSuccessHandler((data: any) => setClients(Array.isArray(data) ? data : [])).getClientes();
      gContext.script.run.withSuccessHandler((data: any) => {
        setMovements(Array.isArray(data) ? data : []);
        setLoading(false);
      }).getMovimientos();
      return;
    }

    try {
      const resC = await fetch(apiGet('getClientes'));
      const dataC = await resC.json();
      setClients(Array.isArray(dataC) ? dataC : []);

      const resM = await fetch(apiGet('getMovimientos'));
      const dataM = await resM.json();
      setMovements(Array.isArray(dataM) ? dataM : []);
    } catch {
      // No connection — lists stay empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.monto || !formData.concepto) return;

    setIsSaving(true);
    // @ts-ignore
    const gContext = window.google;

    if (gContext && gContext.script && gContext.script.run) {
      gContext.script.run
        .withSuccessHandler(() => {
          setIsSaving(false);
          setFormData({ monto: '', categoria: 'Material', concepto: '', tipo: 'Egreso' });
          fetchData();
        })
        .withFailureHandler(() => {
          setIsSaving(false);
          alert('Error al registrar movimiento');
        })
        .registrarMovimiento(formData);
    } else {
      // HTTP fallback
      try {
        const response = await fetch(apiGet(''), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: apiPostBody('registrarMovimiento', formData),
        });
        const result = await response.json();
        if (result.success) {
          setFormData({ monto: '', categoria: 'Material', concepto: '', tipo: 'Egreso' });
          fetchData();
        } else {
          alert('Error: ' + (result.message || 'No se pudo registrar'));
        }
      } catch {
        alert('Sin conexión al servidor. Verifica tu red.');
      }
      setIsSaving(false);
    }
  };

  // --- Reportes calculations ---
  const totalIngresos = movements
    .filter(m => m.type === 'income')
    .reduce((acc, m) => acc + Number(m.amount || 0), 0);
  const totalEgresos = movements
    .filter(m => m.type !== 'income')
    .reduce((acc, m) => acc + Number(m.amount || 0), 0);
  const balance = totalIngresos - totalEgresos;
  const totalDeuda = clients.reduce((acc, c) => acc + Number(c.balance || 0), 0);

  return (
    <div className="flex flex-col h-full bg-background-dark p-4 space-y-6 pb-40">
      {/* Header Tabs */}
      <div className="flex p-1 bg-slate-900 rounded-xl border border-white/5">
        <button
          onClick={() => setActiveTab('operaciones')}
          className={`flex-1 py-2 text-xs font-black uppercase rounded-lg tracking-widest transition-all ${activeTab === 'operaciones'
            ? 'bg-primary text-white shadow-lg'
            : 'text-slate-500 hover:text-slate-300'
            }`}
        >
          Operaciones
        </button>
        <button
          onClick={() => setActiveTab('reportes')}
          className={`flex-1 py-2 text-xs font-black uppercase rounded-lg tracking-widest transition-all ${activeTab === 'reportes'
            ? 'bg-primary text-white shadow-lg'
            : 'text-slate-500 hover:text-slate-300'
            }`}
        >
          Reportes
        </button>
      </div>

      {/* ========== OPERACIONES TAB ========== */}
      {activeTab === 'operaciones' && (
        <>
          {/* Quick Entry Form */}
          <section className="bg-card-dark p-6 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <span className="material-symbols-outlined text-8xl">account_balance_wallet</span>
            </div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">payments</span>
              Registro de Caja
            </h2>
            <form onSubmit={handleRegister} className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="block text-[9px] font-black text-slate-500 mb-2 uppercase tracking-widest">Monto MXN</label>
                <input
                  required
                  className="w-full bg-slate-900 border-white/5 rounded-xl text-sm focus:ring-primary py-3 px-4 text-white font-mono"
                  placeholder="0.00"
                  type="number"
                  value={formData.monto}
                  onChange={e => setFormData({ ...formData, monto: e.target.value })}
                />
              </div>
              <div className="col-span-1">
                <label className="block text-[9px] font-black text-slate-500 mb-2 uppercase tracking-widest">Tipo</label>
                <select
                  className="w-full bg-slate-900 border-white/5 rounded-xl text-sm focus:ring-primary py-3 px-4 text-white font-bold"
                  value={formData.tipo}
                  onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                >
                  <option value="Egreso">GASTO (Egreso)</option>
                  <option value="Ingreso">PAGO (Ingreso)</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[9px] font-black text-slate-500 mb-2 uppercase tracking-widest">Descripción / Concepto</label>
                <input
                  required
                  className="w-full bg-slate-900 border-white/5 rounded-xl text-sm focus:ring-primary py-3 px-4 text-white"
                  placeholder="Ej: Pago de soldadura perfiles"
                  type="text"
                  value={formData.concepto}
                  onChange={e => setFormData({ ...formData, concepto: e.target.value })}
                />
              </div>
              <button
                disabled={isSaving}
                className="col-span-2 bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20"
              >
                {isSaving ? <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-sm">add_circle</span>}
                Sincronizar con Libro
              </button>
            </form>
          </section>

          {/* Debtors List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Cuentas por Cobrar</h3>
              <span className="text-[9px] text-primary font-black uppercase tracking-widest">Total: {clients.filter(c => c.balance > 0).length}</span>
            </div>
            {loading ? (
              <div className="animate-pulse flex flex-col gap-3">
                {[1, 2].map(i => <div key={i} className="h-20 bg-card-dark rounded-2xl"></div>)}
              </div>
            ) : clients.filter(c => c.balance > 0).length === 0 ? (
              <div className="bg-card-dark p-8 rounded-2xl border border-white/5 text-center">
                <span className="material-symbols-outlined text-3xl text-slate-700 mb-2">check_circle</span>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sin cuentas pendientes</p>
              </div>
            ) : clients.filter(c => c.balance > 0).map(client => (
              <div key={client.id} className="bg-card-dark p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-primary/40 transition-all active:scale-[0.98]">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-black text-white italic tracking-tight">{client.name}</span>
                  <div className="flex gap-2 items-center">
                    <span className="bg-danger-red/10 text-danger-red text-[9px] font-black px-2 py-0.5 rounded border border-danger-red/20 uppercase tracking-tighter">
                      DEUDA: ${client.balance.toLocaleString()}
                    </span>
                    {client.phone && client.phone !== 'S/T' && (
                      <span className="text-[9px] text-slate-600 font-mono">{client.phone}</span>
                    )}
                  </div>
                </div>
                {client.phone && client.phone !== 'S/T' ? (
                  <a
                    href={`tel:${client.phone}`}
                    className="size-12 bg-slate-800 text-green-500 rounded-2xl flex items-center justify-center border border-white/5 hover:bg-green-500 hover:text-white transition-all active:scale-90"
                    title={`Llamar a ${client.phone}`}
                  >
                    <span className="material-symbols-outlined text-xl">call</span>
                  </a>
                ) : (
                  <div className="size-12 bg-slate-800/50 text-slate-700 rounded-2xl flex items-center justify-center border border-white/5" title="Sin teléfono registrado">
                    <span className="material-symbols-outlined text-xl">phone_disabled</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Recent History */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Libro de Hoy</h3>
            <div className="bg-card-dark rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
              {loading ? (
                <div className="p-10 text-center text-slate-600 text-[10px] font-black uppercase animate-pulse">Cargando movimientos...</div>
              ) : movements.length > 0 ? (
                movements.map((move, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-5 ${idx !== movements.length - 1 ? 'border-b border-white/5' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`size-10 rounded-xl ${move.type === 'income' ? 'bg-green-500/10' : 'bg-danger-red/10'} flex items-center justify-center`}>
                        <span className={`material-symbols-outlined text-lg ${move.type === 'income' ? 'text-green-500' : 'text-danger-red'}`}>
                          {move.type === 'income' ? 'trending_up' : 'trending_down'}
                        </span>
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-white leading-tight uppercase tracking-tight">{move.description}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase">{move.category || 'General'}</p>
                      </div>
                    </div>
                    <span className={`${move.type === 'income' ? 'text-green-500' : 'text-danger-red'} text-xs font-black font-mono`}>
                      {move.type === 'income' ? '+' : '-'}${Number(move.amount).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-slate-600 text-[10px] font-black uppercase">No hay movimientos registrados</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ========== REPORTES TAB ========== */}
      {activeTab === 'reportes' && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card-dark p-5 rounded-2xl border border-white/5">
              <p className="text-[9px] font-black text-green-500 uppercase tracking-widest mb-1">Total Ingresos</p>
              <p className="text-2xl font-black text-white font-mono">${totalIngresos.toLocaleString()}</p>
            </div>
            <div className="bg-card-dark p-5 rounded-2xl border border-white/5">
              <p className="text-[9px] font-black text-danger-red uppercase tracking-widest mb-1">Total Egresos</p>
              <p className="text-2xl font-black text-white font-mono">${totalEgresos.toLocaleString()}</p>
            </div>
            <div className="bg-card-dark p-5 rounded-2xl border border-white/5">
              <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Balance Neto</p>
              <p className={`text-2xl font-black font-mono ${balance >= 0 ? 'text-green-500' : 'text-danger-red'}`}>
                {balance >= 0 ? '+' : ''}${balance.toLocaleString()}
              </p>
            </div>
            <div className="bg-card-dark p-5 rounded-2xl border border-white/5">
              <p className="text-[9px] font-black text-safety-orange uppercase tracking-widest mb-1">Cuentas x Cobrar</p>
              <p className="text-2xl font-black text-white font-mono">${totalDeuda.toLocaleString()}</p>
            </div>
          </div>

          {/* Transaction Breakdown */}
          <div className="bg-card-dark p-5 rounded-2xl border border-white/5">
            <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Resumen de Movimientos</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">Movimientos registrados</span>
                <span className="text-sm font-black text-white">{movements.length}</span>
              </div>
              <div className="h-[1px] bg-white/5"></div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">Clientes con deuda</span>
                <span className="text-sm font-black text-white">{clients.filter(c => c.balance > 0).length}</span>
              </div>
              <div className="h-[1px] bg-white/5"></div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">Clientes registrados</span>
                <span className="text-sm font-black text-white">{clients.length}</span>
              </div>
            </div>
          </div>

          {/* CxC Leaderboard */}
          {clients.filter(c => c.balance > 0).length > 0 && (
            <div className="bg-card-dark p-5 rounded-2xl border border-white/5">
              <h4 className="text-[9px] font-black text-safety-orange uppercase tracking-widest mb-4">Top Deudores</h4>
              <div className="space-y-3">
                {clients
                  .filter(c => c.balance > 0)
                  .sort((a, b) => b.balance - a.balance)
                  .slice(0, 5)
                  .map((c, i) => (
                    <div key={c.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-600 w-4">{i + 1}.</span>
                        <span className="text-[11px] font-black text-white">{c.name}</span>
                      </div>
                      <span className="text-xs font-black text-danger-red font-mono">${Number(c.balance).toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={fetchData}
            className="w-full py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">sync</span>
            Actualizar Datos
          </button>
        </div>
      )}
    </div>
  );
};

export default Finance;
