
export type Tab = 'dashboard' | 'projects' | 'inventory' | 'finance' | 'budget';

export interface Project {
  id: string;
  name: string;
  client: string;
  status: 'pending' | 'production' | 'completed' | 'paid';
  type: string;
  progress: {
    corte: number;
    soldadura: number;
    pintura: number;
  };
  total: number;
  balance: number;
  dueDate: string;
}

export interface Material {
  id: string;
  name: string;
  category: 'steel' | 'consumable' | 'paint' | 'tool';
  price: number;
  unit: string;
  stock: 'high' | 'low' | 'none';
  stockVal?: number;
  image: string;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
}
