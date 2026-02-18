import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-card-dark rounded-[3rem] border border-red-500/20 shadow-2xl">
                    <div className="size-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-4xl text-red-500">report</span>
                    </div>
                    <h2 className="text-xl font-black text-white uppercase italic mb-2">Algo salió mal</h2>
                    <p className="text-xs text-slate-400 max-w-xs mb-8 uppercase tracking-widest font-bold">
                        El motor de cálculo encontró un error crítico. Por favor intenta reiniciar la aplicación.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl"
                    >
                        Reiniciar Aplicación
                    </button>
                    <div className="mt-8 p-4 bg-slate-900 rounded-xl border border-white/5 text-left overflow-auto max-w-full">
                        <p className="text-[10px] font-mono text-red-400">{this.state.error?.toString()}</p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
