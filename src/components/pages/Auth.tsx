import { useState } from "react";
import { supabase } from "@/components/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Verifique seu e-mail para confirmar o cadastro.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-16 px-4 bg-background">
      {/* Branding (No Logo) */}
      <div className="flex flex-col items-center gap-2 mb-8">
        <h1 className="text-3xl font-light tracking-tight">
          <span className="text-gradient-brand">JLVIANA HUB PRO</span>
        </h1>
        <p className="text-xs font-light uppercase tracking-[0.3em] text-muted-foreground">
          POWERED BY JLVIANA
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Gestão financeira em um só lugar
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-5"
        >
          <div>
            <h2 className="text-2xl font-light text-foreground">
              {isLogin ? "Entrar" : "Cadastrar"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isLogin
                ? "Entre com suas credenciais para acessar a plataforma"
                : "Crie sua conta para começar"}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-foreground/80 font-light">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className="h-12 bg-background border-input text-foreground placeholder:text-muted-foreground/35 rounded-lg focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-foreground/80 font-light">Senha</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="h-12 bg-background border-input text-foreground placeholder:text-muted-foreground/35 rounded-lg pr-12 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {isLogin && (
              <div className="flex justify-end">
                <button type="button" className="text-xs text-primary hover:underline mt-1">
                  Esqueceu sua senha?
                </button>
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-light rounded-lg gradient-brand text-white hover:opacity-90 transition-opacity"
            disabled={loading}
          >
            {loading ? "Aguarde..." : isLogin ? "Entrar" : "Cadastrar"}
          </Button>

          <p className="text-center text-sm text-muted-foreground pt-1">
            {isLogin ? "Não tem uma conta?" : "Já tem conta?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline font-light"
            >
              {isLogin ? "Cadastre-se" : "Faça login"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
