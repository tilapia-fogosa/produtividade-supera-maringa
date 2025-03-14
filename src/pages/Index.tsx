
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Film, Copy, Play, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import VideoPlayer from "@/components/VideoPlayer";

// Tipo de vídeo para nossa aplicação
interface Video {
  id: string;
  name: string;
  createdAt: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  hlsUrl: string;
  duration: number;
}

const Index = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Simular carregamento de vídeos iniciais
  useEffect(() => {
    // Em uma implementação real, isso buscaria do armazenamento
    const mockVideos: Video[] = [
      {
        id: '1',
        name: 'Introdução ao Curso',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'ready',
        hlsUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
        duration: 3600,
      },
      {
        id: '2',
        name: 'Módulo 1 - Fundamentos',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'ready',
        hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        duration: 3600,
      }
    ];
    
    setVideos(mockVideos);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    // Adicionar vídeo em estado de uploading
    const newVideo: Video = {
      id: Date.now().toString(),
      name: file.name.replace(/\.[^/.]+$/, ""),
      createdAt: new Date().toISOString(),
      status: 'uploading',
      hlsUrl: '',
      duration: 0
    };

    setVideos(prev => [newVideo, ...prev]);

    // Simular upload e processamento
    setTimeout(() => {
      setVideos(prev => 
        prev.map(video => 
          video.id === newVideo.id 
            ? { ...video, status: 'processing' } 
            : video
        )
      );

      // Simular conclusão do processamento (HLS)
      setTimeout(() => {
        setVideos(prev => 
          prev.map(video => 
            video.id === newVideo.id 
              ? { 
                  ...video, 
                  status: 'ready',
                  hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
                  duration: 3600
                } 
              : video
          )
        );
        setIsUploading(false);
        toast({
          title: "Vídeo processado com sucesso",
          description: `${file.name} está pronto para ser usado`
        });
      }, 3000);
    }, 2000);
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
                      <TableCell>{new Date(video.createdAt).toLocaleDateString()}</TableCell>
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
                            onClick={() => copyHlsUrl(video.hlsUrl)}
                            disabled={video.status !== 'ready'}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedVideo(video)}
                            disabled={video.status !== 'ready'}
                          >
                            <Play className="h-4 w-4" />
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

      {selectedVideo && (
        <Card>
          <CardHeader>
            <CardTitle>Preview: {selectedVideo.name}</CardTitle>
            <CardDescription>
              URL HLS: <code className="bg-muted p-1 rounded">{selectedVideo.hlsUrl}</code>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2"
                onClick={() => copyHlsUrl(selectedVideo.hlsUrl)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VideoPlayer src={selectedVideo.hlsUrl} />
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
  <source src="${selectedVideo.hlsUrl}" type="application/x-mpegURL">
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
