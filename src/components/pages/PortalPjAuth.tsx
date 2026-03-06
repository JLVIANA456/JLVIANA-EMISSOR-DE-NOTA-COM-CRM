import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/components/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

import { Building2 } from "lucide-react";

const PortalPjAuth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setLoading(false);
    if (error) {
      toast.error("Erro ao entrar: " + error.message);
      return;
    }

    // Check if user has a PJ profile
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("pj_portal_profiles" as any)
      .select("id")
      .eq("auth_user_id", user?.id)
      .single();

    if (!profile) {
      // Try to auto-link by email
      const { data: person } = await supabase
        .from("people")
        .select("id")
        .eq("email", loginEmail.toLowerCase())
        .in("contract_type", ["pj", "prestacao_servicos_pj"])
        .eq("is_active", true)
        .single();

      if (person) {
        if (user) {
          await supabase.from("pj_portal_profiles" as any).insert({
            auth_user_id: user.id,
            person_id: (person as any).id,
          });
        }
      } else {
        await supabase.auth.signOut();
        toast.error("Seu e-mail não está vinculado a nenhum colaborador PJ ativo.");
        return;
      }
    }

    toast.success("Bem-vindo ao Portal PJ!");
    navigate("/portal-pj/dashboard");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: window.location.origin + "/portal-pj/reset-password",
    });
    setForgotLoading(false);
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    toast.success("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
    setShowForgot(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword !== signupConfirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (signupPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    // Check if email exists as active PJ
    const { data: person } = await supabase
      .from("people")
      .select("id, name")
      .eq("email", signupEmail.toLowerCase())
      .in("contract_type", ["pj", "prestacao_servicos_pj"])
      .eq("is_active", true)
      .single();

    if (!person) {
      setLoading(false);
      toast.error("Este e-mail não está cadastrado como colaborador PJ ativo. Entre em contato com o financeiro.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        emailRedirectTo: window.location.origin + "/portal-pj/dashboard",
      },
    });
    setLoading(false);

    if (error) {
      toast.error("Erro ao criar conta: " + error.message);
      return;
    }

    if (data.user && data.session) {
      // Auto-link profile
      await supabase.from("pj_portal_profiles" as any).insert({
        auth_user_id: data.user.id,
        person_id: (person as any).id,
      });
      toast.success("Conta criada! Bem-vindo ao Portal PJ!");
      navigate("/portal-pj/dashboard");
    } else {
      toast.success("Conta criada! Verifique seu e-mail para confirmar o cadastro.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">JLVIANA HUB PRO</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Acesse seus documentos, envie NFs e acompanhe pagamentos
          </p>
        </div>

        <Card>
          <Tabs defaultValue="login">
            <CardHeader className="pb-3">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar Conta</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Senha</Label>
                    <Input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="text-xs text-primary hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                </form>

                {showForgot && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <p className="text-sm font-light">Recuperar Senha</p>
                    <form onSubmit={handleForgotPassword} className="space-y-3">
                      <div className="space-y-2">
                        <Label>E-mail cadastrado</Label>
                        <Input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="seu@email.com"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={forgotLoading} className="flex-1">
                          {forgotLoading ? "Enviando..." : "Enviar Link"}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setShowForgot(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <CardDescription className="mb-4 text-xs">
                  Use o mesmo e-mail cadastrado pela empresa. Apenas colaboradores PJ ativos podem criar conta.
                </CardDescription>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label>E-mail Corporativo</Label>
                    <Input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Senha</Label>
                    <Input
                      type="password"
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmar Senha</Label>
                    <Input
                      type="password"
                      required
                      value={signupConfirm}
                      onChange={(e) => setSignupConfirm(e.target.value)}
                      placeholder="Repita a senha"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Criando..." : "Criar Conta"}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default PortalPjAuth;



