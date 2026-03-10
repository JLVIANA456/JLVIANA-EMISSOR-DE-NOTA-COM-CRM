import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Link2, Check } from "lucide-react";
import { toast } from "sonner";

export function ShareLinkGenerator() {
  const [copied, setCopied] = useState(false);
  
  const baseUrl = window.location.origin;
  const shareUrl = `${baseUrl}/enviar-nota`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Link2 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-light">Link Compartilhado para Fornecedores</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Compartilhe este link com fornecedores para que enviem notas fiscais diretamente, sem precisar de login.
      </p>
      <div className="flex gap-2">
        <Input value={shareUrl} readOnly className="text-xs" />
        <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0 gap-1.5">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copiado' : 'Copiar'}
        </Button>
      </div>
    </div>
  );
}



