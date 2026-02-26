import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientsTable } from "./components/ClientsTable";
import { NewClientDrawer } from "@/pages/whatsapp-comercial/components/NewClientDrawer";

export default function ClientesUnidade() {
    const [isNewClientDrawerOpen, setIsNewClientDrawerOpen] = useState(false);

    return (
        <div className="container mx-auto py-6 space-y-6 max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Clientes da Unidade</h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie todos os clientes da sua unidade e visualize o histórico de atividades.
                    </p>
                </div>
                <Button onClick={() => setIsNewClientDrawerOpen(true)} className="w-full md:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Cliente
                </Button>
            </div>

            <ClientsTable />

            <NewClientDrawer
                open={isNewClientDrawerOpen}
                onOpenChange={setIsNewClientDrawerOpen}
                phoneNumber=""
            />
        </div>
    );
}
