import { FileText } from "lucide-react";

const PadroesLancamento = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
        <FileText className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-light tracking-tight">Padrões de Lançamento</h1>
        <p className="text-sm text-muted-foreground">Defina como cada tipo de nota fiscal deve ser lançado</p>
      </div>
    </div>
    <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
      <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
      <p className="font-light">Módulo em desenvolvimento</p>
      <p className="text-sm mt-1">Templates de lançamento, compartilhamento com analista e histórico de mudanças.</p>
    </div>
  </div>
);

export default PadroesLancamento;



