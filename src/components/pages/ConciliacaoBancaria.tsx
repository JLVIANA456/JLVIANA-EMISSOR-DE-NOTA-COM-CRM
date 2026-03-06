import React from "react";
import ConciliadorApp from "../conciliacao-cci/ConciliadorApp";

interface State { hasError: boolean; error?: Error }

class CciErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center h-full p-12 text-center">
                    <div className="space-y-4 max-w-lg">
                        <div className="text-5xl">⚠️</div>
                        <h2 className="text-xl font-light">Erro ao carregar o Módulo de Conciliação</h2>
                        <p className="text-sm text-muted-foreground font-light">{this.state.error?.message}</p>
                        <button
                            onClick={() => this.setState({ hasError: false })}
                            className="mt-4 px-4 py-2 bg-primary text-white text-sm rounded-lg font-light"
                        >
                            Tentar novamente
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

const ConciliacaoBancaria = () => {
    return (
        <div style={{ margin: "-1.5rem", height: "calc(100vh - 4rem)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <CciErrorBoundary>
                <ConciliadorApp />
            </CciErrorBoundary>
        </div>
    );
};

export default ConciliacaoBancaria;
