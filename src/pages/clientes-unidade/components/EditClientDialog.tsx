import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface EditClientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    client: any;
}

export function EditClientDialog({ open, onOpenChange, client }: EditClientDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [name, setName] = useState("");
    const [phone_number, setPhoneNumber] = useState("");

    useEffect(() => {
        if (client) {
            setName(client.name || "");
            setPhoneNumber(client.phone_number || "");
        }
    }, [client]);

    const editClientMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from('clients')
                .update({ name, phone_number })
                .eq('id', client.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['unit-clients'] });
            toast({
                title: "Sucesso",
                description: "Dados do cliente atualizados.",
            });
            onOpenChange(false);
        },
        onError: (error) => {
            console.error("Erro ao atualizar cliente:", error);
            toast({
                title: "Erro",
                description: "Não foi possível atualizar o cliente.",
                variant: "destructive",
            });
        }
    });

    const handleSave = () => {
        if (!name.trim()) {
            toast({ title: "Aviso", description: "O nome é obrigatório.", variant: "destructive" });
            return;
        }
        editClientMutation.mutate();
    };

    if (!client) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Cliente</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nome do Cliente</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nome completo"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                            id="phone"
                            value={phone_number}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="(11) 99999-9999"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button
                        onClick={handleSave}
                        disabled={editClientMutation.isPending}
                    >
                        {editClientMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
