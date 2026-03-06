import { useState, useEffect } from "react";
import {
    Info,
    ChevronRight,
    TrendingUp,
    ShieldCheck,
    Target,
    Zap,
    Users,
    Wallet,
    PieChart,
    LayoutDashboard,
    ArrowUpRight,
    FileText,
    Building2,
    RefreshCw,
    CheckCircle2
} from "lucide-react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

// Carousel com imagens financeiras do Unsplash
const carouselSlides = [
    {
        imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=1920",
        accent: "#ef4444",
        icon: TrendingUp,
        tag: "BPO Financeiro",
        title: "Monitoramento em Tempo Real",
        description: "Visualize KPIs financeiros de cada empresa com precisão absoluta. Dashboards executivos e dados consolidados para decisões assertivas.",
        stats: [
            { label: "Empresas Ativas", value: "Multi-tenant" },
            { label: "Atualização", value: "Tempo real" },
        ]
    },
    {
        imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1920",
        accent: "#22c55e",
        icon: Building2,
        tag: "Gestão de Portfólio",
        title: "Multi-Empresa com Isolamento Total",
        description: "Gerencie dezenas de clientes com um único acesso. Cada empresa vive em seu próprio contexto — dados nunca se misturam.",
        stats: [
            { label: "Isolamento", value: "Lógico (Tenant)" },
            { label: "Troca de Contexto", value: "Instantânea" },
        ]
    },
    {
        imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=1920",
        accent: "#a855f7",
        icon: FileText,
        tag: "Emissão de Notas",
        title: "NFe & RPS com Validação Automática",
        description: "Emita, receba e valide notas fiscais integrando com a Receita Federal. CNPJ, CNAE e retenções calculados automaticamente.",
        stats: [
            { label: "Integração", value: "Receita Federal" },
            { label: "Validação", value: "Automática" },
        ]
    },
    {
        imageUrl: "https://images.unsplash.com/photo-1642790551116-18e150f248e3?auto=format&fit=crop&q=80&w=1920",
        accent: "#f59e0b",
        icon: RefreshCw,
        tag: "Conciliação Bancária",
        title: "Conciliação Bancária Inteligente",
        description: "Reconcilie extrato bancário com lançamentos do sistema em segundos. Identifique divergências e mantenha o caixa sempre saudável.",
        stats: [
            { label: "Módulo CCI", value: "Integrado" },
            { label: "Divergências", value: "Auto-detectadas" },
        ]
    },
];

const systemFeatures = [
    {
        icon: LayoutDashboard,
        title: "Dashboard Executivo",
        description: "Visão 360º da saúde financeira de cada empresa.",
        tooltip: "Principais indicadores: Saldo, Margem, Receita e Burn Rate em tempo real.",
        color: "text-red-400",
        bg: "bg-red-500/5",
        href: "/"
    },
    {
        icon: Users,
        title: "Gestão Multi-Empresa",
        description: "Isole dados de clientes com um único login.",
        tooltip: "Troque o cliente no seletor superior para mudar o contexto inteiro do sistema.",
        color: "text-blue-400",
        bg: "bg-blue-500/5",
        href: "/geral/clientes"
    },
    {
        icon: Wallet,
        title: "Contas & Lançamentos",
        description: "Pagar, receber e lançar com categorias e centros.",
        tooltip: "Controle total de Contas a Pagar, Receber e Lançamentos categorizados.",
        color: "text-green-400",
        bg: "bg-green-500/5",
        href: "/financeiro/contas-pagar"
    },
    {
        icon: FileText,
        title: "Emissão de Notas",
        description: "NFe e RPS com consulta automática via CNPJ.",
        tooltip: "Emita notas com dados da Receita Federal preenchidos automaticamente.",
        color: "text-purple-400",
        bg: "bg-purple-500/5",
        href: "/emissao-notas"
    },
    {
        icon: ShieldCheck,
        title: "Segurança & RLS",
        description: "Dados com isolamento lógico total por tenant.",
        tooltip: "Row Level Security no Supabase garante que seus dados nunca se cruzem.",
        color: "text-yellow-400",
        bg: "bg-yellow-500/5",
        href: "/configuracoes"
    },
    {
        icon: TrendingUp,
        title: "Projeção de Caixa",
        description: "Analise viabilidade com fluxo futuro projetado.",
        tooltip: "Simule cenários de receita e despesa com base nos dados históricos.",
        color: "text-cyan-400",
        bg: "bg-cyan-500/5",
        href: "/projecao-caixa"
    },
    {
        icon: RefreshCw,
        title: "Conciliação (CCI)",
        description: "Reconcilie extratos com lançamentos do sistema.",
        tooltip: "Módulo CCI integrado: identifique divergências bancárias automaticamente.",
        color: "text-orange-400",
        bg: "bg-orange-500/5",
        href: "/financeiro/conciliacao"
    },
    {
        icon: PieChart,
        title: "CFO Digital",
        description: "Inteligência estratégica para o gestor financeiro.",
        tooltip: "Indicadores avançados: EBITDA, Margem Líquida e análise de rentabilidade.",
        color: "text-pink-400",
        bg: "bg-pink-500/5",
        href: "/cfo-digital"
    },
];

const Overview = () => {
    const navigate = useNavigate();
    const [activeSlide, setActiveSlide] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveSlide(prev => (prev + 1) % carouselSlides.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-10 pb-10">
            {/* Hero Section */}
            {/* Hero Section - Minimalist White Design */}
            <section className="relative overflow-hidden rounded-3xl bg-white p-8 md:p-12 text-slate-900 shadow-sm border border-border">
                <div className="relative z-10 max-w-3xl">
                    <Badge className="mb-5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 font-medium tracking-widest px-3 py-1 text-[10px]">
                        ✦ BEM-VINDO AO JLVIANA HUB PRO
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-light tracking-tight leading-tight mb-6 text-slate-900">
                        Sua central de inteligência para{" "}
                        <span className="text-primary font-normal italic">BPO Financeiro</span>.
                    </h1>
                    <p className="text-lg text-muted-foreground font-light mb-8 max-w-2xl leading-relaxed">
                        O JLVIANA HUB PRO foi desenhado para contadores e gestores que buscam excelência operacional,
                        proporcionando uma visão clara e estratégica de cada empresa sob sua gestão.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Button
                            size="lg"
                            className="rounded-full px-8 font-light shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
                            onClick={() => navigate("/")}
                        >
                            Acessar Dashboard <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="rounded-full px-8 bg-muted/50 border-border hover:bg-muted text-slate-900 font-light"
                            onClick={() => navigate("/geral/clientes")}
                        >
                            Cadastrar Empresa
                        </Button>
                    </div>

                    {/* Quick stats */}
                    <div className="flex flex-wrap gap-6 mt-10 pt-8 border-t border-border">
                        {[
                            { icon: CheckCircle2, label: "Multi-Empresa", value: "Suporte Nativo" },
                            { icon: ShieldCheck, label: "Segurança RLS", value: "Row Level Security" },
                            { icon: Zap, label: "Performance", value: "99.9% Uptime" },
                        ].map((s, i) => (
                            <div key={i} className="flex items-center gap-2 text-muted-foreground">
                                <s.icon className="h-4 w-4 text-primary/70" />
                                <span className="text-xs font-light">{s.label}:</span>
                                <span className="text-xs font-medium text-slate-900">{s.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-primary/5 blur-[80px] pointer-events-none" />

                {/* Floating card preview */}
                <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-2 w-52 opacity-80">
                    {["Contas a Pagar", "Emissão de NF", "Conciliação"].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 bg-muted/30 backdrop-blur-sm border border-border rounded-xl px-4 py-2.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            <span className="text-xs text-muted-foreground font-light">{item}</span>
                            <ArrowUpRight className="h-3 w-3 ml-auto text-muted-foreground/30" />
                        </div>
                    ))}
                </div>
            </section>

            {/* Carousel — Themed slides */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-light tracking-tight flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-primary" /> Módulos em Destaque
                    </h2>
                    <div className="flex gap-1.5">
                        {carouselSlides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveSlide(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === activeSlide ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"}`}
                            />
                        ))}
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl">
                    <div
                        className="flex transition-transform duration-700 ease-in-out"
                        style={{ transform: `translateX(-${activeSlide * 100}%)` }}
                    >
                        {carouselSlides.map((slide, index) => {
                            const Icon = slide.icon;
                            return (
                                <div key={index} className="min-w-full">
                                    <div
                                        className="rounded-2xl text-white relative overflow-hidden min-h-[320px] md:min-h-[360px] flex flex-col justify-between"
                                        style={{
                                            backgroundImage: `url(${slide.imageUrl})`,
                                            backgroundSize: "cover",
                                            backgroundPosition: "center"
                                        }}
                                    >
                                        {/* Dark overlay for text readability */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30 z-0" />
                                        {/* Accent color tint top-right */}
                                        <div className="absolute top-0 right-0 h-full w-1/3 opacity-20 z-0" style={{ background: `linear-gradient(to left, ${slide.accent}40, transparent)` }} />

                                        <div className="relative z-10 p-8 md:p-12">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="h-10 w-10 rounded-xl backdrop-blur-sm flex items-center justify-center border border-white/20" style={{ backgroundColor: `${slide.accent}30` }}>
                                                    <Icon className="h-5 w-5" style={{ color: slide.accent }} />
                                                </div>
                                                <span className="text-xs font-light uppercase tracking-widest px-3 py-1 rounded-full border border-white/20 backdrop-blur-sm" style={{ color: slide.accent, backgroundColor: `${slide.accent}15` }}>
                                                    {slide.tag}
                                                </span>
                                            </div>
                                            <h3 className="text-2xl md:text-3xl font-light mb-3 tracking-tight drop-shadow-lg">{slide.title}</h3>
                                            <p className="text-white/70 font-light max-w-xl text-sm leading-relaxed">{slide.description}</p>
                                        </div>

                                        <div className="relative z-10 flex gap-8 px-8 md:px-12 pb-8 md:pb-10 border-t border-white/10 pt-4 mt-4 backdrop-blur-sm">
                                            {slide.stats.map((stat, si) => (
                                                <div key={si} className="space-y-1">
                                                    <p className="text-[10px] uppercase tracking-widest text-white/40 font-light">{stat.label}</p>
                                                    <p className="text-sm font-semibold text-white">{stat.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="space-y-4">
                <h2 className="text-xl font-light tracking-tight px-2">Recursos do Sistema</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <TooltipProvider delayDuration={0}>
                        {systemFeatures.map((feature, index) => (
                            <Tooltip key={index}>
                                <TooltipTrigger asChild>
                                    <Card
                                        className="group hover:border-primary/40 transition-all duration-300 cursor-pointer bg-card border-border shadow-sm hover:shadow-lg hover:-translate-y-0.5"
                                        onClick={() => navigate(feature.href)}
                                    >
                                        <CardContent className="p-5 space-y-3">
                                            <div className={`h-11 w-11 rounded-2xl ${feature.bg} flex items-center justify-center ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                                                <feature.icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium tracking-tight mb-1 flex items-center gap-1.5">
                                                    {feature.title}
                                                    <Info className="h-3 w-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </h4>
                                                <p className="text-xs text-muted-foreground font-light leading-relaxed">
                                                    {feature.description}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[10px] font-light">Acessar</span>
                                                <ArrowUpRight className="h-3 w-3" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TooltipTrigger>
                                <TooltipContent className="bg-popover text-popover-foreground border-border p-3 max-w-[200px] shadow-xl">
                                    <p className="text-[11px] font-light leading-relaxed">{feature.tooltip}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </TooltipProvider>
                </div>
            </section>

            {/* CTA Bottom */}
            <section className="bg-card border border-border/60 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 space-y-3 text-center md:text-left">
                    <h3 className="text-2xl font-light tracking-tight">Pronto para otimizar sua gestão?</h3>
                    <p className="text-sm text-muted-foreground font-light max-w-lg leading-relaxed">
                        Selecione uma empresa no topo do sistema e navegue pelos módulos.
                        Cada ação realizada está vinculada ao cliente selecionado, garantindo total rastreabilidade.
                    </p>
                </div>
                <div className="flex gap-4 shrink-0">
                    <div className="flex flex-col items-center gap-1.5 p-5 bg-muted/30 rounded-2xl border border-border w-28 text-center">
                        <Target className="h-5 w-5 text-primary mb-1" />
                        <span className="text-xl font-semibold">10x</span>
                        <span className="text-[10px] text-muted-foreground font-light uppercase tracking-tighter">Agilidade</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 p-5 bg-muted/30 rounded-2xl border border-border w-28 text-center">
                        <Zap className="h-5 w-5 text-yellow-500 mb-1" />
                        <span className="text-xl font-semibold">99.9%</span>
                        <span className="text-[10px] text-muted-foreground font-light uppercase tracking-tighter">Uptime</span>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Overview;
