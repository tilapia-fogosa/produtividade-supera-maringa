-- Resetar a sequence para o valor correto
SELECT setval('dados_importantes_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM dados_importantes), false);

-- Inserir o webhook de Aula Zero na tabela dados_importantes
INSERT INTO dados_importantes (key, data) 
VALUES ('webhook_aula_zero', 'https://hook.us1.make.com/rhla45qk19cwlcq3jnekoirj1zatazfn')
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;