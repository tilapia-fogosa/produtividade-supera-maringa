import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

interface Sala {
  id: string;
  nome: string;
  capacidade: number | null;
  cor_calendario: string | null;
  active: boolean;
}

const SalasManager = () => {
  const { activeUnit } = useActiveUnit();
  const unitId = activeUnit?.id;
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editCapacidade, setEditCapacidade] = useState<string>("");

  const [showNew, setShowNew] = useState(false);
  const [newNome, setNewNome] = useState("");
  const [newCapacidade, setNewCapacidade] = useState<string>("");

  const { data: salas, isLoading } = useQuery({
    queryKey: ["salas", unitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salas")
        .select("id, nome, capacidade, cor_calendario, active")
        .eq("unit_id", unitId!)
        .order("nome");
      if (error) throw error;
      return data as Sala[];
    },
    enabled: !!unitId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("salas").insert({
        nome: newNome.trim(),
        capacidade: newCapacidade ? Number(newCapacidade) : null,
        unit_id: unitId!,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salas", unitId] });
      setShowNew(false);
      setNewNome("");
      setNewCapacidade("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, nome, capacidade }: { id: string; nome: string; capacidade: number | null }) => {
      const { error } = await (supabase
        .from("salas")
        .update({ nome, capacidade, updated_at: new Date().toISOString() })
        .eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salas", unitId] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from("salas")
        .delete()
        .eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salas", unitId] });
    },
  });

  const startEdit = (sala: Sala) => {
    setEditingId(sala.id);
    setEditNome(sala.nome);
    setEditCapacidade(sala.capacidade?.toString() || "");
  };

  const confirmEdit = () => {
    if (!editingId || !editNome.trim()) return;
    updateMutation.mutate({
      id: editingId,
      nome: editNome.trim(),
      capacidade: editCapacidade ? Number(editCapacidade) : null,
    });
  };

  const activeSalas = salas?.filter((s) => s.active !== false) || [];
  const inactiveSalas = salas?.filter((s) => s.active === false) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-foreground">Salas da Unidade</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as salas disponíveis para aulas e eventos.
          </p>
        </div>
        {!showNew && (
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Sala
          </Button>
        )}
      </div>

      {/* Formulário de nova sala */}
      {showNew && (
        <Card className="p-4">
          <h4 className="text-sm font-medium mb-3">Nova Sala</h4>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Nome</label>
              <Input
                value={newNome}
                onChange={(e) => setNewNome(e.target.value)}
                placeholder="Ex: Sala Axônio"
                className="mt-1"
              />
            </div>
            <div className="w-32">
              <label className="text-xs text-muted-foreground">Capacidade</label>
              <Input
                type="number"
                value={newCapacidade}
                onChange={(e) => setNewCapacidade(e.target.value)}
                placeholder="Opcional"
                className="mt-1"
              />
            </div>
            <Button
              size="sm"
              onClick={() => createMutation.mutate()}
              disabled={!newNome.trim() || createMutation.isPending}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowNew(false);
                setNewNome("");
                setNewCapacidade("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Lista de salas */}
      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : activeSalas.length === 0 && !showNew ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">Nenhuma sala cadastrada para esta unidade.</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar primeira sala
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {activeSalas.map((sala) => (
            <Card key={sala.id} className="p-3">
              {editingId === sala.id ? (
                <div className="flex items-center gap-3">
                  <Input
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    className="flex-1 h-9"
                  />
                  <Input
                    type="number"
                    value={editCapacidade}
                    onChange={(e) => setEditCapacidade(e.target.value)}
                    placeholder="Capacidade"
                    className="w-28 h-9"
                  />
                  <Button size="sm" variant="ghost" onClick={confirmEdit} disabled={updateMutation.isPending}>
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-foreground">{sala.nome}</span>
                    {sala.capacidade && (
                      <Badge variant="secondary" className="text-xs">
                        {sala.capacidade} lugares
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(sala)}>
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(sala.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SalasManager;
