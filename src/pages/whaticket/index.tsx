import { useState } from "react";
import { Copy, ExternalLink, Terminal, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function WhaticketIntegration() {
    const { toast } = useToast();

    // URL local do whaticket (geralmente ele roda na 3000 por padrão) ou URL de deploy
    const [whaticketUrl, setWhaticketUrl] = useState("http://localhost:3000");
    const [activeTab, setActiveTab] = useState("iframe");

    const copyToClipboard = (text: string, title: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title,
            description: "Copiado para a área de transferência",
        });
    };

    return (
        <div className="h-[calc(100vh-theme(spacing.16))] w-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Whaticket (Teste Comparativo)</h1>
                    <p className="text-muted-foreground text-sm">
                        Ambiente de avaliação do CRM Open-Source maduro para atendimento WhatsApp.
                    </p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col h-full">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                    <TabsTrigger
                        value="iframe"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                    >
                        Acessar Painel (Web)
                    </TabsTrigger>
                    <TabsTrigger
                        value="setup"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                    >
                        Guia de Instalação (Servidor)
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="iframe" className="flex-1 mt-4 h-full">
                    <Card className="h-full flex flex-col border-none shadow-none">
                        <CardHeader className="py-3 px-0">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 max-w-md flex items-center gap-2">
                                    <Label htmlFor="url" className="sr-only">URL do Whaticket</Label>
                                    <Input
                                        id="url"
                                        value={whaticketUrl}
                                        onChange={(e) => setWhaticketUrl(e.target.value)}
                                        placeholder="https://seu-vps-whaticket.com.br"
                                        className="h-8"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(whaticketUrl, '_blank')}
                                    className="gap-2 h-8"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Abrir Nova Guia
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 relative border rounded-lg overflow-hidden bg-muted/20">
                            {whaticketUrl ? (
                                <iframe
                                    src={whaticketUrl}
                                    className="absolute inset-0 w-full h-full border-0"
                                    title="Whaticket Panel"
                                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground flex-col gap-4">
                                    <Server className="h-12 w-12 opacity-50" />
                                    <p>Insira a URL do seu servidor Whaticket acima para carregar o painel.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="setup" className="flex-1 mt-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="col-span-full">
                            <CardHeader>
                                <CardTitle>Passo a Passo de Instalação (Ubuntu 20.04+)</CardTitle>
                                <CardDescription>
                                    Para rodar o Whaticket de verdade, você precisará alugar uma máquina Virtual (VPS) na Nuvem (Hetzner, DigitalOcean, Contabo) com pelo menos 2GB de RAM e 2 vCPUs.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">

                                <div className="space-y-4">
                                    <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                                        <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                                        Acesse via SSH
                                    </h3>
                                    <p className="text-sm text-muted-foreground">Logue no servidor recém criado com acesso root.</p>
                                    <div className="relative group">
                                        <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto border">
                                            <code>ssh root@ip-da-sua-vps</code>
                                        </pre>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                                        <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                                        Atualize os Pacotes Iniciais
                                    </h3>
                                    <div className="relative group">
                                        <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto border">
                                            <code>sudo apt update && sudo apt upgrade -y</code>
                                        </pre>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                                        <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                                        Rode o Instalador Automático (Docker)
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Existem dezenas de instaladores validados pela comunidade. O mais famoso e rápido usa o script do <strong>DeployZ</strong> ou do <strong>Ruaticket</strong>. O script abaixo instala Docker, Nginx, MySQL e o código do Whaticket sozinho.
                                    </p>
                                    <div className="relative group">
                                        <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto border">
                                            <code>sudo su -{"\n"}bash &lt;(curl -s https://raw.githubusercontent.com/rtenorioh/DeployZ/master/deployz.sh)</code>
                                        </pre>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => copyToClipboard('sudo su -\nbash <(curl -s https://raw.githubusercontent.com/rtenorioh/DeployZ/master/deployz.sh)', 'Script de Auto-Deploy Copiado')}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-md text-sm flex gap-3 text-yellow-700 dark:text-yellow-400">
                                        <Terminal className="h-5 w-5 shrink-0" />
                                        <p>O instalador pedirá algumas informações na tela preta: A senha do MYSQL que deseja criar, o Domínio do Frontend (painel.seusite.com.br) e o Domínio do Backend/API (api.seusite.com.br). Tenha esses subdomínios já apontados no seu registro de DNS (Cloudflare/RegistroBR) para o IP da sua VPS antes de apertar Enter.</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                                        <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">4</span>
                                        Acesso Inicial
                                    </h3>
                                    <p className="text-sm text-muted-foreground">Após cerca de 10 minutos de instalação, acesse a URL que você definiu para o frontend no navegador ou coloque-a na aba "Acessar Painel" no topo desta página.</p>
                                    <ul className="text-sm list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                                        <li><strong>E-mail padrão:</strong> admin@admin.com</li>
                                        <li><strong>Senha padrão:</strong> 123456</li>
                                    </ul>
                                    <p className="text-sm border-l-4 border-primary pl-3 py-1 font-medium mt-2">Vá na aba 'Conexões' e leia seu QR Code com o WhatsApp para começar a testar.</p>
                                </div>

                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
