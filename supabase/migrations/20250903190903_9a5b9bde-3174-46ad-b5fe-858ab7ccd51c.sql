-- Adicionar entrada para o link do vídeo tutorial SGS na tabela dados_importantes  
INSERT INTO dados_importantes (key, data) 
VALUES ('video_tutorial_sgs_url', 'https://exemplo-pandavideo.com/hls/tutorial-sgs.m3u8')
WHERE NOT EXISTS (SELECT 1 FROM dados_importantes WHERE key = 'video_tutorial_sgs_url');