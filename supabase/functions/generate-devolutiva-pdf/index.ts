import { corsHeaders } from '../_shared/cors.ts';

interface DevolutivaData {
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

interface DevolutivaDataWithBase64 extends DevolutivaData {
  templateUrl?: string;
}

function generateHTML(data: DevolutivaDataWithBase64): string {
  const templateUrl = data.templateUrl || (data.versaoTemplate === 2
    ? 'https://hkvjdxxndapxpslovrlc.supabase.co/storage/v1/object/public/devolutivas/devolutiva-fim-ano-template-v2.png'
    : 'https://hkvjdxxndapxpslovrlc.supabase.co/storage/v1/object/public/devolutivas/devolutiva-fim-ano-template-v3.png');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Devolutiva Fim de Ano - ${data.nome}</title>
  <style>${CSS_INLINE}</style>
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

async function imageToBase64(url: string): Promise<string> {
  try {
    console.log('Baixando imagem:', url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro ao baixar imagem: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Converter para base64 em chunks para evitar stack overflow
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    const base64 = btoa(binary);
    console.log('Imagem convertida para base64, tamanho:', base64.length);
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('Erro ao converter imagem para base64:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: DevolutivaData = await req.json();
    
    console.log('Gerando PDF para:', data.nome);
    console.log('Dados recebidos:', {
      nome: data.nome,
      fotoUrl: data.fotoUrl,
      tamanhoFoto: data.tamanhoFoto,
      posicaoX: data.posicaoX,
      posicaoY: data.posicaoY,
      versaoTemplate: data.versaoTemplate,
      totalDesafios: data.totalDesafios,
      totalExerciciosAbaco: data.totalExerciciosAbaco,
      totalExerciciosAH: data.totalExerciciosAH
    });
    
    // Converter imagens para base64
    console.log('Convertendo foto do aluno para base64...');
    const fotoBase64 = await imageToBase64(data.fotoUrl);
    
    const templateUrl = data.versaoTemplate === 2
      ? 'https://hkvjdxxndapxpslovrlc.supabase.co/storage/v1/object/public/devolutivas/devolutiva-fim-ano-template-v2.png'
      : 'https://hkvjdxxndapxpslovrlc.supabase.co/storage/v1/object/public/devolutivas/devolutiva-fim-ano-template-v3.png';
    
    console.log('Convertendo template para base64...');
    const templateBase64 = await imageToBase64(templateUrl);
    
    // Criar objeto com URLs base64
    const dataWithBase64 = {
      ...data,
      fotoUrl: fotoBase64,
      templateUrl: templateBase64
    };
    
    // Gerar HTML completo com imagens base64
    const htmlContent = generateHTML(dataWithBase64);
    console.log('HTML gerado com imagens base64 (primeiros 500 caracteres):', htmlContent.substring(0, 500));
    console.log('Tamanho total do HTML:', htmlContent.length, 'caracteres');
    
    // Chamar PDFShift API
    const pdfShiftApiKey = Deno.env.get('PDFSHIFT_API_KEY');
    if (!pdfShiftApiKey) {
      throw new Error('PDFSHIFT_API_KEY não configurada');
    }
    
    console.log('Chamando PDFShift API...');
    const pdfShiftResponse = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`api:${pdfShiftApiKey}`)}`,
      },
      body: JSON.stringify({
        source: htmlContent,
        format: 'A4',
        margin: 0,
        use_print: true,
        sandbox: false,
      }),
    });
    
    if (!pdfShiftResponse.ok) {
      const errorText = await pdfShiftResponse.text();
      console.error('Erro PDFShift:', errorText);
      throw new Error(`PDFShift API error: ${pdfShiftResponse.status} - ${errorText}`);
    }
    
    const pdfBlob = await pdfShiftResponse.arrayBuffer();
    
    console.log('PDF gerado com sucesso');
    
    return new Response(pdfBlob, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="devolutiva-${data.nome.replace(/\s+/g, '-')}.pdf"`,
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
