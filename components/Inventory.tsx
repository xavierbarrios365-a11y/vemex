import React, { useState, useEffect } from 'react';
import { API_URL } from '../constants';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  stockVal: number;
  stockMin: number;
  stock: 'high' | 'low' | 'none';
  image: string;
}

const Inventory: React.FC = () => {
  const [materials, setMaterials] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    categoria: 'Perfiles',
    unidad: 'Tramo 6m',
    precio: '',
    stock: '',
    stockMin: '5'
  });

  const setDemoMaterials = () => {
    setMaterials([
      { id: 'MAT-001', name: 'PTR 2" Cal 14', category: 'perfil', unit: 'Tramo 6m', price: 700, stockVal: 25, stockMin: 5, stock: 'high', image: 'https://picsum.photos/seed/ptr2/200/200' },
      { id: 'MAT-002', name: 'PTR 1 1/2" Cal 14', category: 'perfil', unit: 'Tramo 6m', price: 550, stockVal: 3, stockMin: 5, stock: 'low', image: 'https://picsum.photos/seed/ptr15/200/200' },
      { id: 'MAT-003', name: 'Tubo 1" Céd 30', category: 'tubo', unit: 'Tramo 6m', price: 370, stockVal: 18, stockMin: 5, stock: 'high', image: 'https://picsum.photos/seed/tubo1/200/200' },
      { id: 'MAT-004', name: 'Lámina R-101 Galv.', category: 'lamina', unit: 'Pza', price: 520, stockVal: 12, stockMin: 5, stock: 'high', image: 'https://picsum.photos/seed/lamina/200/200' },
      { id: 'MAT-005', name: 'Disco de Corte 4.5"', category: 'consumible', unit: 'Pza', price: 28, stockVal: 2, stockMin: 10, stock: 'low', image: 'https://picsum.photos/seed/disco/200/200' },
      { id: 'MAT-006', name: 'Electrodo 6013 1/8"', category: 'consumible', unit: 'Kg', price: 125, stockVal: 0, stockMin: 5, stock: 'none', image: 'https://picsum.photos/seed/electrodo/200/200' },
    ]);
  };

  const cargarInventario = async () => {
    setLoading(true);
    // @ts-ignore
    const gContext = window.google;
    if (gContext && gContext.script && gContext.script.run) {
      gContext.script.run
        .withSuccessHandler((data: any) => {
          if (Array.isArray(data) && data.length > 0) setMaterials(data);
          else setDemoMaterials();
          setLoading(false);
        })
        .withFailureHandler(() => {
          setDemoMaterials();
          setLoading(false);
        })
        .getDataMateriales();
      return;
    }

    // HTTP fallback
    try {
      const response = await fetch(`${API_URL}?action=getMateriales`);
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setMaterials(data);
      } else {
        setDemoMaterials();
      }
    } catch {
      setDemoMaterials();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarInventario();
  }, []);

  const abrirModal = (item?: any) => {
    if (item) {
      setFormData({
        id: item.id,
        nombre: item.name,
        categoria: item.category,
        unidad: item.unit,
        precio: item.price.toString(),
        stock: item.stockVal.toString(),
        stockMin: item.stockMin?.toString() || '5'
      });
    } else {
      setFormData({ id: '', nombre: '', categoria: 'Perfiles', unidad: 'Tramo 6m', precio: '', stock: '', stockMin: '5' });
    }
    setIsModalOpen(true);
  };

  const guardarCambios = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // @ts-ignore
    const gContext = window.google;
    const action = formData.id ? 'actualizarMaterial' : 'agregarNuevoMaterial';

    if (gContext && gContext.script && gContext.script.run) {
      gContext.script.run
        .withSuccessHandler(() => {
          setIsModalOpen(false);
          setIsSaving(false);
          cargarInventario();
        })
        .withFailureHandler(() => setIsSaving(false))
      [action](formData);
    } else {
      // HTTP fallback
      try {
        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, data: formData }),
        });
        cargarInventario();
      } catch {
        // Local fallback
        const newMat: InventoryItem = {
          id: formData.id || 'MAT-' + Date.now(),
          name: formData.nombre,
          category: formData.categoria,
          unit: formData.unidad,
          price: parseFloat(formData.precio) || 0,
          stockVal: parseInt(formData.stock) || 0,
          stockMin: parseInt(formData.stockMin) || 5,
          stock: parseInt(formData.stock) > parseInt(formData.stockMin) ? 'high' : 'low',
          image: `https://picsum.photos/seed/${formData.nombre.slice(0, 5)}/200/200`
        };
        if (formData.id) {
          setMaterials(prev => prev.map(m => m.id === formData.id ? newMat : m));
        } else {
          setMaterials(prev => [...prev, newMat]);
        }
      }
      setIsModalOpen(false);
      setIsSaving(false);
    }
  };

  const filteredMaterials = materials.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-background-dark">
      <div className="px-4 py-4 sticky top-0 z-10 bg-background-dark/95 backdrop-blur-sm border-b border-white/5">
        <label className="relative flex items-center w-full group">
          <span className="material-symbols-outlined absolute left-4 text-slate-500 group-focus-within:text-primary transition-colors">search</span>
          <input
            className="w-full h-12 pl-12 pr-4 bg-card-dark border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary transition-all"
            placeholder="Buscar material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </label>
      </div>

      <main className="flex-1 p-4 space-y-3 pb-32">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4 opacity-50">
            <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-[10px] uppercase font-black tracking-widest">Sincronizando Almacén...</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-4 opacity-40">
            <span className="material-symbols-outlined text-4xl text-slate-500">search_off</span>
            <p className="text-[10px] uppercase font-black tracking-widest">Sin resultados para "{searchTerm}"</p>
          </div>
        ) : filteredMaterials.map(item => (
          <div key={item.id} className="bg-card-dark border border-slate-800 p-4 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all active:scale-[0.98]">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-xl bg-slate-900 overflow-hidden border border-slate-800 relative">
                <img className="object-cover w-full h-full opacity-60" src={item.image} alt={item.name} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">{item.name}</h3>
                <div className="flex items-center gap-2">
                  <p className="text-primary font-mono text-xs font-black">${item.price.toFixed(2)}</p>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">/ {item.unit}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <button onClick={() => abrirModal(item)} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-all">
                <span className="material-symbols-outlined text-lg">edit</span>
              </button>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md ${item.stock === 'high' ? 'bg-green-500/10' : item.stock === 'none' ? 'bg-red-500/10' : 'bg-yellow-500/10'
                }`}>
                <span className={`text-[9px] font-black uppercase ${item.stock === 'high' ? 'text-green-500' : item.stock === 'none' ? 'text-red-500' : 'text-yellow-500'
                  }`}>
                  STOCK: {item.stockVal}
                </span>
              </div>
            </div>
          </div>
        ))}
      </main>

      <div className="fixed bottom-24 right-4 z-30">
        <button onClick={() => abrirModal()} className="size-16 rounded-2xl bg-primary text-white shadow-xl flex items-center justify-center border-4 border-background-dark active:scale-90 transition-all">
          <span className="material-symbols-outlined text-4xl">add</span>
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background-dark/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-card-dark rounded-3xl p-8 border border-white/10 shadow-2xl">
            <h2 className="text-xl font-black text-white mb-6 italic">{formData.id ? 'EDITAR MATERIAL' : 'ALTA DE MATERIAL'}</h2>
            <form onSubmit={guardarCambios} className="space-y-4">
              <input required placeholder="Nombre" className="w-full h-14 bg-slate-900 border-white/5 border rounded-xl px-4 text-white" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" step="0.01" placeholder="Precio" className="w-full h-14 bg-slate-900 border-white/5 border rounded-xl px-4 text-white font-mono" value={formData.precio} onChange={e => setFormData({ ...formData, precio: e.target.value })} />
                <input required type="number" placeholder="Stock" className="w-full h-14 bg-slate-900 border-white/5 border rounded-xl px-4 text-white font-mono" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 border border-white/10 rounded-2xl font-black uppercase text-sm tracking-widest text-slate-400 hover:text-white transition-all">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-5 bg-primary hover:bg-primary/90 rounded-2xl font-black uppercase text-sm tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3">
                  {isSaving ? <div className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 'GUARDAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
