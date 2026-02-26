import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Conversation } from "../types/whatsapp.types";

export function EditClientNameModal() {
    const [open, setOpen] = useState(false);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [name, setName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const queryClient = useQueryClient();

    useEffect(() => {
        const handleOpenModal = (event: CustomEvent<{ conversation: Conversation }>) => {
            setConversation(event.detail.conversation);
            setName(event.detail.conversation.clientName || "");
            setOpen(true);
        };

        window.addEventListener("open-edit-client-name" as any, handleOpenModal);

        return () => {
            window.removeEventListener("open-edit-client-name" as any, handleOpenModal);
        };
    }, []);

    const handleSave = async () => {
        if (!conversation || !name.trim()) return;

        setIsSaving(true);
        try {
            // update clients where phone_number ends with conversation.phoneNumber
            const phoneDigits = conversation.phoneNumber.replace(/\D/g, "");
            const { error } = await supabase
                .from("clients")
                .update({ name: name.trim(), alterar_nome: false })
                .like("phone_number", `%${phoneDigits.slice(-10)}`);

            if (error) {
                throw error;
            }

            toast.success("Nome atualizado com sucesso!");
            setOpen(false);

            // refetch conversations
            queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations"] });
            // update local conversation object briefly as optimistic approach
            conversation.clientName = name.trim();
            conversation.alterarNome = false;
        } catch (e: any) {
            console.error(e);
            toast.error("Erro ao atualizar o nome do cliente.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!conversation) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Alterar Nome de "{conversation.clientName}"</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="name" className="text-left font-medium">
                            Novo Nome
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                            disabled={isSaving}
                            autoFocus
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button type="submit" onClick={handleSave} disabled={isSaving || !name.trim()}>
                        {isSaving ? "Salvando..." : "Salvar Alteração"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
