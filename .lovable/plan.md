
# Correção: Transcrição de áudio com alucinações do Whisper

## Problema Identificado
O Whisper está retornando textos sem sentido como "Legendas pela comunidade Amara.org" e "Puxa. Puxa. Puxa. Puxa." - isso sao **alucinacoes** conhecidas do modelo Whisper que acontecem quando:
1. O audio enviado e muito curto ou silencioso
2. O `MediaRecorder` nao gera chunks intermediarios (so gera ao parar), podendo resultar em audio vazio
3. Falta um `prompt` para guiar o Whisper no contexto correto
4. O tamanho do audio nao e validado antes do envio

## Solucao
Aplicar melhorias em dois arquivos:

### 1. Edge Function (`supabase/functions/transcribe-audio/index.ts`)
- Adicionar log do tamanho do arquivo de audio recebido para debug
- Validar que o arquivo tem tamanho minimo (rejeitar audios muito pequenos)
- Adicionar parametro `prompt` ao Whisper para reduzir alucinacoes - o prompt contextualiza que se trata de anotacoes sobre alunos em portugues
- Adicionar `temperature` baixa (0.0) para respostas mais determinisicas

### 2. Componente de gravacao (`src/components/ui/audio-transcribe-button.tsx`)
- Usar `mediaRecorder.start(1000)` com timeslice de 1 segundo para garantir que chunks intermediarios sejam gerados durante a gravacao
- Validar o tamanho minimo do blob de audio antes de enviar (minimo ~1KB)
- Adicionar log no console do tamanho do audio capturado para facilitar debug

## Detalhes Tecnicos

### Arquivo: `supabase/functions/transcribe-audio/index.ts`
- Apos obter o `audioFile` do formData, logar seu tamanho: `console.log('Audio file size:', audioFile.size)`
- Rejeitar audios menores que 1000 bytes com erro 400
- Ao montar o `whisperFormData`, adicionar:
  - `whisperFormData.append('prompt', 'Transcrição de anotações sobre alunos, avaliações e observações pedagógicas em português brasileiro.')` 
  - `whisperFormData.append('temperature', '0')` 

### Arquivo: `src/components/ui/audio-transcribe-button.tsx`
- Alterar `mediaRecorder.start()` para `mediaRecorder.start(1000)` (timeslice de 1s)
- Antes de enviar para a edge function, verificar `audioBlob.size > 1000` 
- Se o audio for muito pequeno, ignorar silenciosamente (nao enviar)
- Adicionar `console.log` do tamanho do audio capturado

Apos as alteracoes, a edge function sera reimplantada automaticamente.
