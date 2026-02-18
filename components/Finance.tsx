
import React, { useState, useEffect } from 'react';
import { API_URL } from '../constants';

const Finance: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
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
      gContext.script.run.withSuccessHandler((data: any) => setClients(data)).getClientes();
      gContext.script.run.withSuccessHandler((data: any) => {
        setMovements(data);
        setLoading(false);
      }).getMovimientos();
      return;
    }

    try {
      const resC = await fetch(`${API_URL}?action=getClientes`);
      const dataC = await resC.json();
      setClients(dataC);

      const resM = await fetch(`${API_URL}?action=getMovimientos`);
      const dataM = await resM.json();
      setMovements(dataM);
    } catch (e) {
      console.warn("Using demo data for Finance");
      setClients([{id: '1', name: 'Cliente Demo', balance: 5000}]);
      setMovements([{id: '1', description: 'Gasto Demo', amount: 1200, type: 'expense', category: 'General'}]);
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
      gContext.script.run.withSuccessHandler(() => {
        setIsSaving(false);
        setFormData({ monto: '', categoria: 'Material', concepto: '', tipo: 'Egreso' });
        fetchData();
      }).registrarMovimiento(formData);
    } else {
      setTimeout(() => {
        alert("Modo Demo: Movimiento registrado");
        setIsSaving(false);
        fetchData();
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-dark p-4 space-y-6 pb-40">
      {/* Header Tabs */}
      <div className="flex p-1 bg-slate-900 rounded-xl border border-white/5">
        <button className="flex-1 py-2 text-xs font-black uppercase rounded-lg bg-primary text-white shadow-lg tracking-widest">Operaciones</button>
        <button className="flex-1 py-2 text-xs font-black uppercase text-slate-500 tracking-widest">Reportes</button>
      </div>

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
              onChange={e => setFormData({...formData, monto: e.target.value})}
            />
          </div>
          <div className="col-span-1">
            <label className="block text-[9px] font-black text-slate-500 mb-2 uppercase tracking-widest">Tipo</label>
            <select 
              className="w-full bg-slate-900 border-white/5 rounded-xl text-sm focus:ring-primary py-3 px-4 text-white font-bold"
              value={formData.tipo}
              onChange={e => setFormData({...formData, tipo: e.target.value})}
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
              onChange={e => setFormData({...formData, concepto: e.target.value})}
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
          <span className="text-[9px] text-primary font-black uppercase tracking-widest">Total: {clients.length}</span>
        </div>
        {loading ? (
          <div className="animate-pulse flex flex-col gap-3">
            {[1,2].map(i => <div key={i} className="h-20 bg-card-dark rounded-2xl"></div>)}
          </div>
        ) : clients.filter(c => c.balance > 0).map(client => (
          <div key={client.id} className="bg-card-dark p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-primary/40 transition-all active:scale-[0.98]">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-black text-white italic tracking-tight">{client.name}</span>
              <div className="flex">
                <span className="bg-danger-red/10 text-danger-red text-[9px] font-black px-2 py-0.5 rounded border border-danger-red/20 uppercase tracking-tighter">
                  DEUDA: ${client.balance.toLocaleString()}
                </span>
              </div>
            </div>
            <button className="size-12 bg-slate-800 text-primary rounded-2xl flex items-center justify-center border border-white/5 hover:bg-primary hover:text-white transition-all">
              <span className="material-symbols-outlined text-xl">call</span>
            </button>
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
            <div className="p-10 text-center text-slate-600 text-[10px] font-black uppercase">No hay movimientos registrados hoy</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Finance;
