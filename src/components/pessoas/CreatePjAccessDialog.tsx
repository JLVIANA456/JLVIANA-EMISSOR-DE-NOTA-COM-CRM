import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KeyRound, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Person {
  id: string;
  name: string;
  email: string | null;
  contract_type: string;
  is_active: boolean;
}

interface Props {
  people: Person[];
}

export function CreatePjAccessDialog({ people }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [email, setEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("Portal2025!");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const pjPeople = people.filter(
    (p) => ["pj", "prestacao_servicos_pj"].includes(p.contract_type) && p.is_active
  );

  const handlePersonChange = (personId: string) => {
    setSelectedPersonId(personId);
    const person = pjPeople.find((p) => p.id === personId);
    if (person?.email) {
      setEmail(person.email);
    }
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId || !email || !tempPassword) return;

    setLoading(true);
    setResult(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const response = await supabase.functions.invoke("create-pj-account", {
        body: {
          person_id: selectedPersonId,
          email,
          temp_password: tempPassword,
        },
      });

      if (response.error) {
        const errorMsg = response.error.message || "Erro ao criar acesso";
        toast.error(errorMsg);
        setResult({ success: false, message: errorMsg });
      } else {
        const data = response.data;
        if (data.error) {
          toast.error(data.error);
          setResult({ success: false, message: data.error });
        } else {
          toast.success(data.message || "Acesso criado com sucesso!");
          setResult({ success: true, message: data.message });
        }
      }
    } catch (err) {
      toast.error("Erro ao criar acesso");
      setResult({ success: false, message: "Erro inesperado" });
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    const person = pjPeople.find((p) => p.id === selectedPersonId);
    const text = `Portal do Colaborador - Decoding\n\nOlá ${person?.name},\n\nSeu acesso ao Portal do Colaborador foi criado.\n\nLink: ${window.location.origin}/portal-pj\nE-mail: ${email}\nSenha temporária: ${tempPassword}\n\nPor favor, altere sua senha no primeiro acesso.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Credenciais copiadas!");
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSelectedPersonId("");
      setEmail("");
      setTempPassword("Portal2025!");
      setResult(null);
      setCopied(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <KeyRound className="h-4 w-4" />
          Criar Acesso Portal PJ
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Acesso ao Portal PJ</DialogTitle>
          <DialogDescription>
            Selecione o colaborador PJ e defina as credenciais de acesso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Colaborador PJ</Label>
            <Select value={selectedPersonId} onValueChange={handlePersonChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um colaborador..." />
              </SelectTrigger>
              <SelectContent>
                {pjPeople.length === 0 ? (
                  <SelectItem value="_none" disabled>
                    Nenhum colaborador PJ ativo
                  </SelectItem>
                ) : (
                  pjPeople.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} {p.email ? `(${p.email})` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>E-mail de acesso</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@colaborador.com"
            />
          </div>

          <div className="space-y-2">
            <Label>Senha temporária</Label>
            <Input
              type="text"
              required
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              placeholder="Senha temporária"
            />
          </div>

          {result && (
            <div
              className={`rounded-lg p-3 text-sm ${
                result.success
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              }`}
            >
              {result.message}
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !selectedPersonId} className="flex-1">
              {loading ? "Criando..." : "Criar Acesso"}
            </Button>
            {result?.success && (
              <Button type="button" variant="outline" onClick={copyCredentials} className="gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}



