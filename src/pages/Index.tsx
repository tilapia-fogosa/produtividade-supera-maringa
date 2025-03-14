
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Film, Copy, Play, Clock, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import VideoPlayer from "@/components/VideoPlayer";
import { fetchVideos, uploadVideo, deleteVideo, Video } from "@/integrations/supabase/video-service";

const Index = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Buscar vídeos do Supabase ao carregar a página
  useEffect(() => {
    loadVideos();
  }, []);
  
  const loadVideos = async () => {
    const videoList = await fetchVideos();
    setVideos(videoList);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Upload do vídeo para o Supabase
      const newVideo = await uploadVideo(file, file.name.replace(/\.[^/.]+$/, ""));
      
      if (newVideo) {
        setVideos(prev => [newVideo, ...prev]);
        
        // Atualizar status do vídeo periodicamente
        const checkStatus = setInterval(async () => {
          const updatedVideos = await fetchVideos();
          setVideos(updatedVideos);
          
          // Verificar se o vídeo atual está pronto ou com erro
          const currentVideo = updatedVideos.find(v => v.id === newVideo.id);
          if (currentVideo && (currentVideo.status === 'ready' || currentVideo.status === 'error')) {
            clearInterval(checkStatus);
            
            if (currentVideo.status === 'ready') {
              toast({
                title: "Vídeo processado com sucesso",
                description: `${file.name} está pronto para ser usado`
              });
            } else {
              toast({
                title: "Erro ao processar vídeo",
                description: "Ocorreu um erro durante o processamento",
                variant: "destructive"
              });
            }
          }
        }, 3000); // Verificar a cada 3 segundos
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer o upload do vídeo",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este vídeo?")) {
      const success = await deleteVideo(videoId);
      
      if (success) {
        setVideos(prev => prev.filter(video => video.id !== videoId));
        if (selectedVideo?.id === videoId) {
          setSelectedVideo(null);
        }
        toast({
          title: "Vídeo excluído",
          description: "O vídeo foi excluído com sucesso"
        });
      }
    }
  };

  const copyHlsUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "URL copiada",
      description: "URL do vídeo HLS copiada para a área de transferência"
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciador de Vídeos para Cursaeduca</CardTitle>
          <CardDescription>
            Faça upload, gerencie e obtenha os códigos HLS para seus vídeos de treinamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Input
                id="video-upload"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                disabled={isUploading}
                className="w-full max-w-md"
              />
              <Button disabled={isUploading}>
                <Upload className="mr-2" />
                {isUploading ? "Enviando..." : "Enviar Vídeo"}
              </Button>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Data de Upload</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {videos.map(video => (
                    <TableRow key={video.id}>
                      <TableCell className="font-medium">{video.name}</TableCell>
                      <TableCell>{new Date(video.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDuration(video.duration)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {video.status === 'uploading' && "Enviando..."}
                        {video.status === 'processing' && "Processando..."}
                        {video.status === 'ready' && "Pronto"}
                        {video.status === 'error' && "Erro"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => video.hls_url && copyHlsUrl(video.hls_url)}
                            disabled={video.status !== 'ready' || !video.hls_url}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedVideo(video)}
                            disabled={video.status !== 'ready' || !video.hls_url}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteVideo(video.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {videos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        Nenhum vídeo encontrado. Faça upload do seu primeiro vídeo.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedVideo && selectedVideo.hls_url && (
        <Card>
          <CardHeader>
            <CardTitle>Preview: {selectedVideo.name}</CardTitle>
            <CardDescription>
              URL HLS: <code className="bg-muted p-1 rounded">{selectedVideo.hls_url}</code>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2"
                onClick={() => selectedVideo.hls_url && copyHlsUrl(selectedVideo.hls_url)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VideoPlayer src={selectedVideo.hls_url} poster={selectedVideo.thumbnail_url} />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setSelectedVideo(null)}>
              Fechar
            </Button>
            <Button 
              variant="default"
              onClick={() => {
                // Copiar código de embed para inserir no Cursaeduca
                const embedCode = `<video-js class="vjs-default-skin" controls>
  <source src="${selectedVideo.hls_url}" type="application/x-mpegURL">
</video-js>`;
                navigator.clipboard.writeText(embedCode);
                toast({
                  title: "Código copiado",
                  description: "Código de embed copiado para a área de transferência"
                });
              }}
            >
              Copiar Código de Embed
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default Index;
