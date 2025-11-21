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
      if (images.length === 0) return true;
      return images.every(img => img.complete && img.naturalHeight !== 0);
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
    
    // Gerar HTML completo
    const htmlContent = generateHTML(data);
    console.log('HTML gerado, tamanho:', htmlContent.length, 'caracteres');
    
    // Chamar PDFShift API
    const pdfShiftApiKey = Deno.env.get('PDFSHIFT_API_KEY');
    if (!pdfShiftApiKey) {
      throw new Error('PDFSHIFT_API_KEY não configurada');
    }
    
    console.log('Chamando PDFShift API...');
    console.log('Template URL:', data.versaoTemplate === 2 ? 'v2.png' : 'v1.png');
    console.log('Foto URL:', data.fotoUrl);
    
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
        delay: 3000,
        wait_for: 'imagesLoaded',
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
