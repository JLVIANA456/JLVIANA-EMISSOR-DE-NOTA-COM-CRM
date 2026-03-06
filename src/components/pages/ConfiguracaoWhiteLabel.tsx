import { useState, useEffect, useRef } from "react";
import {
    Settings, Palette, Image as ImageIcon, Type, Save, RefreshCw,
    Upload, Trash2, CheckCircle2, AlertCircle, X, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ConfiguracaoWhiteLabel = () => {
    const [primaryColor, setPrimaryColor] = useState("#ef4444");
    const [systemName, setSystemName] = useState("JLVIANA HUB PRO");
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [logoRemoved, setLogoRemoved] = useState(false);
    const [previewTab, setPreviewTab] = useState<"sidebar" | "header">("sidebar");
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const savedColor = localStorage.getItem("whitelabel_primary_color");
        const savedName = localStorage.getItem("whitelabel_system_name");
        const savedLogo = localStorage.getItem("whitelabel_logo_url");
        const savedLogoRemoved = localStorage.getItem("whitelabel_logo_removed");

        if (savedColor) {
            setPrimaryColor(savedColor);
            document.documentElement.style.setProperty("--primary", hexToHSL(savedColor));
        }
        if (savedName) setSystemName(savedName);
        if (savedLogo) setLogoUrl(savedLogo);
        if (savedLogoRemoved === "true") setLogoRemoved(true);
    }, []);

    const hexToHSL = (hex: string) => {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) {
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        }
        r /= 255; g /= 255; b /= 255;
        let v = Math.max(r, g, b), c = v - Math.min(r, g, b), f = (1 - Math.abs(v + v - c - 1));
        let h = c && (v === r ? (g - b) / c : (v === g ? 2 + (b - r) / c : 4 + (r - g) / c));
        return `${Math.round(60 * (h < 0 ? h + 6 : h))} ${Math.round(f ? (c / f) * 100 : 0)}% ${Math.round((v + v - c) / 2 * 100)}%`;
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Por favor selecione um arquivo de imagem.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = ev.target?.result as string;
            setLogoUrl(result);
            setLogoRemoved(false);
            toast.success("Logo carregado! Salve para aplicar.");
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveLogo = () => {
        setLogoUrl(null);
        setLogoRemoved(true);
        toast.info("Logo removido. Salve para confirmar.");
    };

    const handleSave = () => {
        localStorage.setItem("whitelabel_primary_color", primaryColor);
        localStorage.setItem("whitelabel_system_name", systemName);
        localStorage.setItem("whitelabel_logo_removed", logoRemoved ? "true" : "false");

        if (logoUrl && !logoRemoved) {
            localStorage.setItem("whitelabel_logo_url", logoUrl);
        } else {
            localStorage.removeItem("whitelabel_logo_url");
        }

        document.documentElement.style.setProperty("--primary", hexToHSL(primaryColor));
        toast.success("Configurações salvas! Recarregue a página para ver todas as mudanças.");
    };

    const handleReset = () => {
        setPrimaryColor("#ef4444");
        setSystemName("JLVIANA HUB PRO");
        setLogoUrl(null);
        setLogoRemoved(false);
        localStorage.removeItem("whitelabel_primary_color");
        localStorage.removeItem("whitelabel_system_name");
        localStorage.removeItem("whitelabel_logo_url");
        localStorage.removeItem("whitelabel_logo_removed");
        document.documentElement.style.setProperty("--primary", "0 84.2% 60.2%");
        toast.info("Configurações restauradas para o padrão.");
    };

    const presetColors = [
        { name: "Vermelho JL", hex: "#ef4444" },
        { name: "Azul Navy", hex: "#3b82f6" },
        { name: "Esmeralda", hex: "#10b981" },
        { name: "Âmbar", hex: "#f59e0b" },
        { name: "Violeta", hex: "#8b5cf6" },
        { name: "Rosa", hex: "#ec4899" },
        { name: "Cinza", hex: "#6b7280" },
        { name: "Ciano", hex: "#06b6d4" },
    ];

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Settings className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-light tracking-tight text-foreground">Configurações do Sistema</h1>
                        <p className="text-sm text-muted-foreground font-light">Personalize a identidade visual e os parâmetros globais</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={handleReset} className="font-light border-border text-foreground">
                        <RefreshCw className="h-4 w-4 mr-2" /> Restaurar Padrão
                    </Button>
                    <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white font-light px-6">
                        <Save className="h-4 w-4 mr-2" /> Salvar Configurações
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left col - settings */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Color */}
                    <Card className="border-border shadow-sm overflow-hidden border-t-4 border-t-primary">
                        <CardHeader className="border-b border-border/50 bg-muted/10">
                            <CardTitle className="text-base font-light flex items-center gap-2">
                                <Palette className="h-4 w-4 text-primary" /> Cor Principal do Sistema
                            </CardTitle>
                            <CardDescription className="font-light text-xs">Afeta botões, ícones ativos e destaques do sistema</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {/* Color presets */}
                            <div className="space-y-3">
                                <Label className="text-xs font-light uppercase tracking-wider text-muted-foreground">Cores Predefinidas</Label>
                                <div className="flex flex-wrap gap-2">
                                    {presetColors.map((c) => (
                                        <button
                                            key={c.hex}
                                            title={c.name}
                                            onClick={() => setPrimaryColor(c.hex)}
                                            className={cn(
                                                "h-8 w-8 rounded-full border-2 transition-all duration-200 hover:scale-110",
                                                primaryColor.toLowerCase() === c.hex.toLowerCase()
                                                    ? "border-foreground scale-110 shadow-md"
                                                    : "border-transparent"
                                            )}
                                            style={{ backgroundColor: c.hex }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Custom color */}
                            <div className="space-y-3">
                                <Label className="text-xs font-light uppercase tracking-wider text-muted-foreground">Cor Personalizada</Label>
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-xl border border-border shadow-inner flex-shrink-0" style={{ backgroundColor: primaryColor }} />
                                    <div className="flex flex-col gap-2 flex-1">
                                        <input
                                            type="color"
                                            value={primaryColor}
                                            onChange={(e) => setPrimaryColor(e.target.value)}
                                            className="w-full h-10 rounded-lg border border-border cursor-pointer bg-muted/30 p-1"
                                        />
                                        <Input
                                            type="text"
                                            value={primaryColor}
                                            onChange={(e) => setPrimaryColor(e.target.value)}
                                            className="font-mono text-xs text-center bg-muted/20 border-border h-9"
                                            placeholder="#ef4444"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Logo */}
                    <Card className="border-border shadow-sm overflow-hidden">
                        <CardHeader className="border-b border-border/50 bg-muted/10">
                            <CardTitle className="text-base font-light flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-primary" /> Logotipo do Sistema
                            </CardTitle>
                            <CardDescription className="font-light text-xs">Substitui ou remove o logotipo exibido na barra lateral</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex items-start gap-6">
                                {/* Preview box */}
                                <div className="h-28 w-28 rounded-xl bg-muted/30 border border-dashed border-border flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                                    {logoRemoved ? (
                                        <div className="flex flex-col items-center gap-1 text-muted-foreground/30">
                                            <X className="h-8 w-8" />
                                            <span className="text-[9px]">Removido</span>
                                        </div>
                                    ) : logoUrl ? (
                                        <>
                                            <img src={logoUrl} alt="Logo" className="max-h-20 max-w-24 object-contain" />
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground/30">
                                            <ImageIcon className="h-8 w-8" />
                                            <span className="text-[9px]">Logo padrão</span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="space-y-3 flex-1">
                                    <div>
                                        <p className="text-xs font-light text-muted-foreground leading-relaxed mb-3">
                                            Formato: PNG ou SVG com fundo transparente.<br />
                                            Resolução ideal: <strong>240×80 px</strong>.
                                        </p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleLogoUpload}
                                    />
                                    <Button variant="secondary" size="sm" className="font-light w-full" onClick={() => fileInputRef.current?.click()}>
                                        <Upload className="h-3.5 w-3.5 mr-2" /> Fazer Upload do Logo
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="font-light w-full text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
                                        onClick={handleRemoveLogo}
                                        disabled={logoRemoved}
                                    >
                                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                                        {logoRemoved ? "Logo já removido" : "Remover Logo do Sistema"}
                                    </Button>
                                    {logoRemoved && (
                                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-orange-500/5 border border-orange-500/20">
                                            <AlertCircle className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                                            <p className="text-[10px] text-orange-600 font-light">A sidebar exibirá apenas o nome do sistema.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Name */}
                    <Card className="border-border shadow-sm overflow-hidden">
                        <CardHeader className="border-b border-border/50 bg-muted/10">
                            <CardTitle className="text-base font-light flex items-center gap-2">
                                <Type className="h-4 w-4 text-primary" /> Nome do Sistema
                            </CardTitle>
                            <CardDescription className="font-light text-xs">Aparece na sidebar e nos relatórios</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-light uppercase tracking-wider text-muted-foreground">Nome Comercial</Label>
                                <Input
                                    value={systemName}
                                    onChange={(e) => setSystemName(e.target.value)}
                                    className="bg-muted/10 border-border font-light h-11 text-base"
                                    placeholder="Ex: Hub Contábil Pro"
                                />
                                <p className="text-[10px] text-muted-foreground">Exibido abaixo do logo na barra lateral.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right col - preview */}
                <div className="space-y-4">
                    <Card className="border-border shadow-sm sticky top-4">
                        <CardHeader className="border-b border-border/50 bg-muted/10 pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-light flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-primary" /> Preview Live
                                </CardTitle>
                                <div className="flex gap-1">
                                    {(["sidebar", "header"] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setPreviewTab(tab)}
                                            className={cn(
                                                "text-[10px] uppercase tracking-wider px-2 py-1 rounded font-light transition-colors",
                                                previewTab === tab ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            {previewTab === "sidebar" ? (
                                <div className="rounded-xl overflow-hidden border border-sidebar-border shadow-lg bg-[#0c1427] p-3 space-y-3">
                                    {/* Simulated logo area */}
                                    <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                                        {!logoRemoved && logoUrl ? (
                                            <img src={logoUrl} alt="Logo" className="h-6 object-contain" />
                                        ) : logoRemoved ? (
                                            <span className="text-xs font-light text-white/70">{systemName}</span>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="h-5 w-16 bg-white/20 rounded animate-pulse" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[9px] text-white/30 uppercase tracking-widest font-light px-1">{systemName}</p>
                                    {["Overview", "Dashboard", "Clientes"].map((item, i) => (
                                        <div key={i} className={cn(
                                            "flex items-center gap-2 px-2 py-1.5 rounded-lg",
                                            i === 0 ? "bg-white/10" : "hover:bg-white/5"
                                        )}>
                                            <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: i === 0 ? primaryColor : "rgba(255,255,255,0.2)" }} />
                                            <span className="text-[10px] text-white/60 font-light">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-border bg-card p-3 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-light text-muted-foreground">Empresa Ativa</span>
                                        <div className="h-6 px-3 rounded-full flex items-center gap-1.5 border border-border text-[10px]" style={{ color: primaryColor, borderColor: `${primaryColor}40` }}>
                                            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                                            Cliente Selecionado
                                        </div>
                                    </div>
                                    <div className="h-8 rounded-lg flex items-center px-3 gap-2" style={{ backgroundColor: `${primaryColor}15` }}>
                                        <CheckCircle2 className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                                        <span className="text-xs font-light">Botão de Ação</span>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 p-3 rounded-lg bg-muted/20 border border-border/50 space-y-2">
                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-light">Resumo das Configurações</p>
                                <div className="flex items-center justify-between text-xs font-light">
                                    <span className="text-muted-foreground">Cor primária</span>
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: primaryColor }} />
                                        <span className="font-mono">{primaryColor}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-xs font-light">
                                    <span className="text-muted-foreground">Logo</span>
                                    <span>{logoRemoved ? "Removido" : logoUrl ? "Personalizado" : "Padrão JL"}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-light">
                                    <span className="text-muted-foreground">Nome</span>
                                    <span className="truncate max-w-24">{systemName}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ConfiguracaoWhiteLabel;
