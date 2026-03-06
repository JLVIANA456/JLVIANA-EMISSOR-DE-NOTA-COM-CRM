import { FileUser, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Rpa = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 space-y-6 animate-in fade-in duration-700">
            <div className="relative">
                <div className="h-24 w-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary shadow-2xl shadow-primary/20 -rotate-12 transition-transform duration-500">
                    <FileUser className="h-12 w-12" />
                </div>
                <div className="absolute -top-2 -right-2 h-10 w-10 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-lg border border-border">
                    <Clock className="h-5 w-5 text-amber-500" />
                </div>
            </div>

            <div className="space-y-3 max-w-md">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em]">
                    Módulo em Manutenção
                </Badge>
                <h1 className="text-4xl font-light tracking-tight text-foreground/90">RPA (Autônomo)</h1>
                <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    A estrutura de Recibo de Pagamento Autônomo está sendo simplificada.
                    O conteúdo anterior foi removido conforme sua solicitação.
                </p>
            </div>
        </div>
    );
};

export default Rpa;
