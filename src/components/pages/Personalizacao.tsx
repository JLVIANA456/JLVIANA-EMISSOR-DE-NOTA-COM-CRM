import { useState, useEffect } from "react";
import { Palette, Type, Image as ImageIcon, RotateCcw, Save, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePersonalization } from "@/components/contexts/PersonalizationContext";
import { toast } from "sonner";

const ConfiguracoesDesign = () => {
    const { settings, updateSettings, resetSettings } = usePersonalization();
    const [localSettings, setLocalSettings] = useState(settings);

    // Sync local state if context changes (e.g. from another tab or reset)
    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                toast.error("O logo deve ter menos de 1MB");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalSettings(prev => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        updateSettings(localSettings);
        toast.success("Configurações salvas com sucesso!");
    };

    const presets = [
        { name: "Vermelho", value: "#e60000" },
        { name: "Azul", value: "#0ea5e9" },
        { name: "Verde", value: "#10b981" },
        { name: "Roxo", value: "#8b5cf6" },
        { name: "Laranja", value: "#f97316" },
        { name: "Preto", value: "#1a1a1a" },
    ];

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <SettingsIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-light tracking-tight">Configurações do Sistema</h1>
                    <p className="text-sm text-muted-foreground">Personalize a identidade visual e as preferências da plataforma</p>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Identidade */}
                <Card className="border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-light flex items-center gap-2">
                            <Type className="h-4 w-4" /> Nome do Sistema
                        </CardTitle>
                        <CardDescription>O nome que aparecerá no topo do sidebar e na aba do navegador.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="appName">Nome da Plataforma</Label>
                            <Input
                                id="appName"
                                value={localSettings.appName}
                                onChange={e => setLocalSettings({ ...localSettings, appName: e.target.value })}
                                placeholder="Ex: Minha Empresa Hub"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Logo */}
                <Card className="border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-light flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" /> Logotipo Whitelabel
                        </CardTitle>
                        <CardDescription>Substitua o logo padrão pela marca da sua empresa.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-6 p-4 rounded-xl bg-secondary/30 border border-dashed">
                            <div className="h-20 w-40 bg-white rounded-lg border flex items-center justify-center p-2 overflow-hidden">
                                <img src={localSettings.logo} alt="Preview" className="max-h-full max-w-full object-contain" />
                            </div>
                            <div className="space-y-2 flex-1">
                                <Label htmlFor="logo">Carregar nova imagem</Label>
                                <Input id="logo" type="file" accept="image/*" onChange={handleLogoUpload} className="cursor-pointer" />
                                <p className="text-[10px] text-muted-foreground">PNG ou SVG recomendado. Máximo 1MB.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Cores */}
                <Card className="border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-light flex items-center gap-2">
                            <Palette className="h-4 w-4" /> Cor Predominante (Hexadecimal)
                        </CardTitle>
                        <CardDescription>Escolha qualquer cor usando o código Hexadecimal ou selecione um dos padrões.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <div className="flex items-center gap-3">
                                <div
                                    className="h-12 w-12 rounded-lg border shadow-sm"
                                    style={{ backgroundColor: localSettings.primaryColor }}
                                />
                                <div className="space-y-1">
                                    <Label htmlFor="hexColor">Código Hexadecimal</Label>
                                    <Input
                                        id="hexColor"
                                        value={localSettings.primaryColor}
                                        onChange={e => setLocalSettings({ ...localSettings, primaryColor: e.target.value })}
                                        className="w-32 uppercase font-mono"
                                        maxLength={7}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2 sm:pt-6">
                                {presets.map((color) => (
                                    <button
                                        key={color.value}
                                        onClick={() => setLocalSettings({ ...localSettings, primaryColor: color.value })}
                                        className={`h-8 w-8 rounded-full border transition-all hover:scale-110 ${localSettings.primaryColor.toLowerCase() === color.value.toLowerCase() ? "ring-2 ring-primary ring-offset-2" : ""
                                            }`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center justify-between pt-4">
                    <Button variant="ghost" className="gap-2 font-light text-muted-foreground" onClick={() => {
                        resetSettings();
                        toast.info("Configurações resetadas");
                    }}>
                        <RotateCcw className="h-4 w-4" /> Restaurar Padrão
                    </Button>
                    <Button className="gap-2 gradient-brand shadow-lg px-8" onClick={handleSave}>
                        <Save className="h-4 w-4" /> Salvar Alterações
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfiguracoesDesign;
