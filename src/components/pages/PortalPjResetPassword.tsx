import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/components/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
// Logo removed
import { Building2, KeyRound, CheckCircle2 } from "lucide-react";

const PortalPjResetPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Supabase sends recovery tokens via hash fragment
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error("Erro ao redefinir senha: " + error.message);
      return;
    }

    setSuccess(true);
    toast.success("Senha redefinida com sucesso!");
    setTimeout(() => navigate("/portal-pj/dashboard"), 2000);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 mx-auto text-primary" />
          <h1 className="text-2xl font-light">Senha Redefinida!</h1>
          <p className="text-muted-foreground">Redirecionando para o portal...</p>
        </div>
      </div>
    );
  }

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <KeyRound className="h-12 w-12 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-light">Link Inválido</h1>
          <p className="text-muted-foreground">Este link de recuperação é inválido ou já expirou.</p>
          <Button onClick={() => navigate("/portal-pj")}>Voltar ao Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">

          <div className="flex items-center justify-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-light">JLVIANA HUB PRO</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nova Senha</CardTitle>
            <CardDescription>Digite sua nova senha para o Portal do Cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nova Senha</Label>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="space-y-2">
                <Label>Confirmar Nova Senha</Label>
                <Input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repita a nova senha"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Salvando..." : "Redefinir Senha"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PortalPjResetPassword;



