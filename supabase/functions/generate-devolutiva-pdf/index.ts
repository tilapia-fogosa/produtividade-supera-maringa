import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

interface DevolutivaData {
  alunoId: string;
  nome: string;
  fotoUrl: string;
  tamanhoFoto: number;
  posicaoX: number;
  posicaoY: number;
  tamanhoFonte: number;
  alturaNome: number;
  alturaExercicios: number;
  posicaoXExerciciosAbaco: number;
  posicaoXExerciciosAH: number;
  totalDesafios: number;
  totalExerciciosAbaco: number;
  totalExerciciosAH: number;
  versaoTemplate: number;
  templateUrl?: string;
}

const CSS_INLINE = `
/* Wrapper principal */
.devolutiva-fim-ano-wrapper {
  width: 100%;
  min-height: 100vh;
}

/* Container principal */
.devolutiva-fim-ano-container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: white;
  padding: 0;
}

/* Página A4 */
.a4-page {
  width: 210mm;
  height: 297mm;
  background: white;
  position: relative;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

/* Camada de fundo com a foto do aluno */
.foto-aluno-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-repeat: no-repeat;
  z-index: 1;
}

/* Camada de overlay com o template */
.template-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 2;
  pointer-events: none;
}

/* Textos sobre o template */
.texto-overlay {
  position: absolute;
  z-index: 3;
  color: white;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
}
`;

function generateHTML(data: DevolutivaData): string {
  const templateUrl = data.templateUrl || (data.versaoTemplate === 2
    ? 'https://hkvjdxxndapxpslovrlc.supabase.co/storage/v1/object/public/devolutivas/v2.png'
    : 'https://hkvjdxxndapxpslovrlc.supabase.co/storage/v1/object/public/devolutivas/v1.png');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Devolutiva Fim de Ano - ${data.nome}</title>
  <style>${CSS_INLINE}</style>
  <script>
    function imagesLoaded() {
      const images = Array.from(document.images);
      console.log('Checking images:', images.length);
      if (images.length === 0) {
        console.log('No images found');
        return false;
      }
      const allLoaded = images.every(img => {
        console.log('Image:', img.src, 'complete:', img.complete, 'height:', img.naturalHeight);
        return img.complete && img.naturalHeight !== 0;
      });
      console.log('All images loaded:', allLoaded);
      return allLoaded;
    }
  </script>
</head>
<body>
  <div class="devolutiva-fim-ano-wrapper">
    <div class="devolutiva-fim-ano-container">
      <div class="a4-page">
        <!-- Foto do aluno como background -->
        <div class="foto-aluno-background" style="
          background-image: url('${data.fotoUrl}');
          background-size: ${data.tamanhoFoto}mm ${data.tamanhoFoto}mm;
          background-position: ${data.posicaoX}mm ${data.posicaoY}mm;
        "></div>
        
        <!-- Template overlay -->
        <img 
          src="${templateUrl}" 
          alt="Template" 
          class="template-overlay"
        />
        
        <!-- Nome do aluno -->
        <div class="texto-overlay" style="
          top: ${data.alturaNome}mm;
          left: 50%;
          transform: translateX(-50%);
          font-size: ${data.tamanhoFonte}px;
          text-align: center;
          width: 80%;
        ">
          ${data.nome}
        </div>
        
        <!-- Total de Desafios -->
        <div class="texto-overlay" style="
          top: ${data.alturaExercicios}mm;
          left: 50%;
          transform: translateX(-50%);
          font-size: ${data.tamanhoFonte * 0.8}px;
          text-align: center;
        ">
          ${data.totalDesafios}
        </div>
        
        <!-- Total de Exercícios Ábaco -->
        <div class="texto-overlay" style="
          top: ${data.alturaExercicios}mm;
          left: ${data.posicaoXExerciciosAbaco}mm;
          font-size: ${data.tamanhoFonte * 0.8}px;
          text-align: center;
        ">
          ${data.totalExerciciosAbaco}
        </div>
        
        <!-- Total de Exercícios AH -->
        <div class="texto-overlay" style="
          top: ${data.alturaExercicios}mm;
          left: ${data.posicaoXExerciciosAH}mm;
          font-size: ${data.tamanhoFonte * 0.8}px;
          text-align: center;
        ">
          ${data.totalExerciciosAH}
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: DevolutivaData = await req.json();
    
    console.log('Gerando PDF para:', data.nome);
    console.log('Dados recebidos:', JSON.stringify(data, null, 2));
    
    // Preparar dados para enviar ao webhook do n8n
    const templateUrl = data.versaoTemplate === 2
      ? 'https://hkvjdxxndapxpslovrlc.supabase.co/storage/v1/object/public/devolutivas/v2.png'
      : 'https://hkvjdxxndapxpslovrlc.supabase.co/storage/v1/object/public/devolutivas/v1.png';

    const webhookData = {
      nome: data.nome,
      fotoUrl: data.fotoUrl,
      tamanhoFoto: data.tamanhoFoto,
      posicaoX: data.posicaoX,
      posicaoY: data.posicaoY,
      tamanhoFonte: data.tamanhoFonte,
      alturaNome: data.alturaNome,
      alturaExercicios: data.alturaExercicios,
      posicaoXExerciciosAbaco: data.posicaoXExerciciosAbaco,
      posicaoXExerciciosAH: data.posicaoXExerciciosAH,
      totalDesafios: data.totalDesafios,
      totalExerciciosAbaco: data.totalExerciciosAbaco,
      totalExerciciosAH: data.totalExerciciosAH,
      versaoTemplate: data.versaoTemplate,
      templateUrl: templateUrl,
    };
    
    console.log('Enviando dados para o webhook n8n...');
    console.log('Webhook URL: https://webhookn8n.agenciakadin.com.br/webhook/pdf');
    
    // Chamar webhook do n8n
    const webhookResponse = await fetch('https://webhookn8n.agenciakadin.com.br/webhook/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
    });
    
    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('Erro no webhook n8n:', errorText);
      throw new Error(`Webhook n8n error: ${webhookResponse.status} - ${errorText}`);
    }
    
    console.log('Resposta recebida do webhook n8n');
    
    // Espera-se que o n8n retorne JSON com o PDF em base64
    const contentType = webhookResponse.headers.get('content-type');
    console.log('Content-Type da resposta:', contentType);
    
    if (!contentType?.includes('application/json')) {
      throw new Error('n8n deve retornar application/json com o PDF em base64');
    }
    
    const responseData = await webhookResponse.json();
    console.log('Resposta JSON recebida do n8n');
    
    if (!responseData.pdf) {
      throw new Error('Resposta do n8n não contém o campo "pdf" com o base64');
    }
    
    // Remover prefixo data:application/pdf;base64, se existir
    const base64Pdf = responseData.pdf.replace(/^data:application\/pdf;base64,/, '');
    console.log('Base64 recebido do n8n, tamanho:', base64Pdf.length, 'caracteres');
    
    // Converter base64 para ArrayBuffer para fazer upload no Storage
    const binaryString = atob(base64Pdf);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    console.log('PDF convertido para bytes, fazendo upload no Storage...');
    
    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Nome do arquivo
    const fileName = `${data.alunoId}/${Date.now()}-devolutiva-${data.nome.replace(/\s+/g, '-')}.pdf`;
    
    // Fazer upload do PDF no bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('devolutivas-pdf')
      .upload(fileName, bytes.buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });
    
    if (uploadError) {
      console.error('Erro ao fazer upload do PDF:', uploadError);
      throw new Error(`Erro ao fazer upload do PDF: ${uploadError.message}`);
    }
    
    console.log('PDF uploaded com sucesso:', uploadData.path);
    
    // Obter URL pública do PDF
    const { data: urlData } = supabase.storage
      .from('devolutivas-pdf')
      .getPublicUrl(fileName);
    
    const pdfUrl = urlData.publicUrl;
    console.log('URL pública do PDF:', pdfUrl);
    
    // Atualizar tabela alunos com a URL do PDF
    const { error: updateError } = await supabase
      .from('alunos')
      .update({ pdf_devolutiva_url: pdfUrl })
      .eq('id', data.alunoId);
    
    if (updateError) {
      console.error('Erro ao atualizar aluno com URL do PDF:', updateError);
      throw new Error(`Erro ao atualizar aluno: ${updateError.message}`);
    }
    
    console.log('Aluno atualizado com URL do PDF');
    
    return new Response(JSON.stringify({ 
      success: true, 
      pdfUrl: pdfUrl 
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao gerar PDF',
        details: error.toString()
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
