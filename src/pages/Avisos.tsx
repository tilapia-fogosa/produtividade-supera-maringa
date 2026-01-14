import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Trash2, Upload, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { compressImageIfNeeded } from "@/services/imageCompressionService";

const MARINGA_UNIT_ID = "0df79a04-444e-46ee-b218-59e4b1835f4a";

interface Aviso {
  id: string;
  nome: string;
  imagem_url: string;
  data_inicio: string;
  data_fim: string;
  ativo: boolean;
  unit_id: string;
  created_at: string;
}

export default function Avisos() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAviso, setEditingAviso] = useState<Aviso | null>(null);
  const [nome, setNome] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: avisos, isLoading } = useQuery({
    queryKey: ["avisos", MARINGA_UNIT_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("avisos")
        .select("*")
        .eq("unit_id", MARINGA_UNIT_ID)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Aviso[];
    },
  });

  const createAviso = useMutation({
    mutationFn: async (data: {
      nome: string;
      imagem_url: string;
      data_inicio: string;
      data_fim: string;
    }) => {
      const { error } = await supabase.from("avisos").insert({
        nome: data.nome,
        imagem_url: data.imagem_url,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim,
        unit_id: MARINGA_UNIT_ID,
        ativo: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avisos"] });
      resetForm();
      setModalOpen(false);
    },
  });

  const updateAviso = useMutation({
    mutationFn: async (data: {
      id: string;
      nome: string;
      imagem_url: string;
      data_inicio: string;
      data_fim: string;
    }) => {
      const { error } = await supabase
        .from("avisos")
        .update({
          nome: data.nome,
          imagem_url: data.imagem_url,
          data_inicio: data.data_inicio,
          data_fim: data.data_fim,
        })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avisos"] });
      resetForm();
      setModalOpen(false);
    },
  });

  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("avisos")
        .update({ ativo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avisos"] });
    },
  });

  const deleteAviso = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("avisos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avisos"] });
    },
  });

  const resetForm = () => {
    setNome("");
    setDataInicio("");
    setDataFim("");
    setImagemFile(null);
    setImagemPreview(null);
    setEditingAviso(null);
  };

  const handleImagemChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImageIfNeeded(file);
      setImagemFile(compressed);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagemPreview(reader.result as string);
      };
      reader.readAsDataURL(compressed);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !dataInicio || !dataFim) return;

    setUploading(true);
    let imagemUrl = editingAviso?.imagem_url || "";

    try {
      if (imagemFile) {
        // Sanitizar o nome do arquivo removendo caracteres especiais
        const fileExtension = imagemFile.name.split('.').pop() || 'png';
        const sanitizedName = imagemFile.name
          .replace(/\.[^/.]+$/, '') // Remove extensão
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .replace(/[^a-zA-Z0-9]/g, '_') // Substitui caracteres especiais por underscore
          .substring(0, 50); // Limita tamanho
        const fileName = `${Date.now()}-${sanitizedName}.${fileExtension}`;
        
        const { error: uploadError } = await supabase.storage
          .from("avisos-imagens")
          .upload(fileName, imagemFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("avisos-imagens")
          .getPublicUrl(fileName);
        imagemUrl = urlData.publicUrl;
      }

      if (!imagemUrl) {
        alert("Por favor, selecione uma imagem");
        setUploading(false);
        return;
      }

      if (editingAviso) {
        await updateAviso.mutateAsync({
          id: editingAviso.id,
          nome,
          imagem_url: imagemUrl,
          data_inicio: dataInicio,
          data_fim: dataFim,
        });
      } else {
        await createAviso.mutateAsync({
          nome,
          imagem_url: imagemUrl,
          data_inicio: dataInicio,
          data_fim: dataFim,
        });
      }
    } catch (error) {
      console.error("Erro ao salvar aviso:", error);
    } finally {
      setUploading(false);
    }
  };

  const openEditModal = (aviso: Aviso) => {
    setEditingAviso(aviso);
    setNome(aviso.nome);
    setDataInicio(aviso.data_inicio);
    setDataFim(aviso.data_fim);
    setImagemPreview(aviso.imagem_url);
    setModalOpen(true);
  };

  const openNewModal = () => {
    resetForm();
    setModalOpen(true);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Avisos</h1>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewModal}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Aviso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAviso ? "Editar Aviso" : "Novo Aviso"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Aviso</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Promoção de Janeiro"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_inicio">Data de Início</Label>
                <Input
                  id="data_inicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_fim">Data de Fim</Label>
                <Input
                  id="data_fim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imagem">Imagem do Aviso</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="imagem"
                    type="file"
                    accept="image/*"
                    onChange={handleImagemChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("imagem")?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar Imagem
                  </Button>
                </div>
                {imagemPreview && (
                  <div className="mt-2">
                    <img
                      src={imagemPreview}
                      alt="Preview"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={uploading || createAviso.isPending || updateAviso.isPending}
              >
                {uploading
                  ? "Enviando..."
                  : editingAviso
                  ? "Salvar Alterações"
                  : "Criar Aviso"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : avisos && avisos.length > 0 ? (
        <div className="space-y-4">
          {avisos.map((aviso) => (
            <Card key={aviso.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <img
                    src={aviso.imagem_url}
                    alt={aviso.nome}
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">
                      {aviso.nome}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(aviso.data_inicio), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}{" "}
                      até{" "}
                      {format(new Date(aviso.data_fim), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Switch
                        checked={aviso.ativo}
                        onCheckedChange={(checked) =>
                          toggleAtivo.mutate({ id: aviso.id, ativo: checked })
                        }
                      />
                      <span className="text-sm">
                        {aviso.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditModal(aviso)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Aviso</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir este aviso? Esta ação
                            não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteAviso.mutate(aviso.id)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum aviso cadastrado
        </div>
      )}
    </div>
  );
}
