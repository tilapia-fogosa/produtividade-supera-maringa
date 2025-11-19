import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DevolutivaData {
  nome: string;
  fotoUrl: string;
  templateUrl: string;
  tamanhoFoto: number;
  posicaoX: number;
  posicaoY: number;
  tamanhoFonte: number;
  totalDesafios: number;
  totalExerciciosAbaco: number;
  totalExerciciosAH: number;
  versaoTemplate: 1 | 2;
  posicaoXExerciciosAbaco: number;
  posicaoXExerciciosAH: number;
  alturaExercicios: number;
  alturaNome: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: DevolutivaData = await req.json();
    console.log('📄 Gerando PDF para:', data.nome);

    // Construir HTML completo com estilos inline
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Abril+Fatface&display=swap" rel="stylesheet">
        <style>
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
          
          body { 
            width: 210mm; 
            height: 297mm; 
            margin: 0;
            padding: 0;
          }
          
          .a4-page {
            width: 210mm;
            height: 297mm;
            position: relative;
            overflow: hidden;
            background: white;
            margin: 0;
            padding: 0;
          }
          
          .foto-aluno-background {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: url(${data.fotoUrl});
            background-size: ${data.tamanhoFoto}%;
            background-position: ${data.posicaoX}% ${data.posicaoY}%;
            background-repeat: no-repeat;
            z-index: 1;
          }
          
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
          
          .nome-aluno {
            position: absolute;
            top: ${data.alturaNome}%;
            left: 50%;
            transform: translateX(-50%);
            z-index: 3;
            color: #1a1a1a;
            font-family: 'Abril Fatface', serif;
            font-size: ${data.tamanhoFonte}px;
            text-align: center;
            white-space: nowrap;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            pointer-events: none;
          }
          
          .total-desafios {
            position: absolute;
            top: 87%;
            left: 50%;
            transform: translateX(-50%);
            z-index: 3;
            color: #1a1a1a;
            font-family: 'Abril Fatface', serif;
            font-size: 38px;
            font-weight: 700;
            text-align: center;
            pointer-events: none;
          }
          
          .total-exercicios-abaco {
            position: absolute;
            top: ${data.alturaExercicios}%;
            left: ${data.posicaoXExerciciosAbaco}%;
            transform: translateX(-50%);
            z-index: 3;
            color: #1a1a1a;
            font-family: 'Abril Fatface', serif;
            font-size: 34px;
            font-weight: 700;
            text-align: center;
            pointer-events: none;
          }
          
          .total-exercicios-ah {
            position: absolute;
            top: ${data.alturaExercicios}%;
            left: ${data.posicaoXExerciciosAH}%;
            transform: translateX(-50%);
            z-index: 3;
            color: #1a1a1a;
            font-family: 'Abril Fatface', serif;
            font-size: 34px;
            font-weight: 700;
            text-align: center;
            pointer-events: none;
          }

          @page {
            size: A4 portrait;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="a4-page">
          <div class="foto-aluno-background"></div>
          <img src="${data.templateUrl}" class="template-overlay" alt="Template" />
          <div class="nome-aluno">${data.nome}</div>
          <div class="total-desafios">${data.totalDesafios}</div>
          <div class="total-exercicios-abaco">${data.totalExerciciosAbaco}</div>
          <div class="total-exercicios-ah">${data.totalExerciciosAH}</div>
        </div>
      </body>
      </html>
    `;

    console.log('🚀 Iniciando Puppeteer...');
    
    // Iniciar navegador headless
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();
    
    // Configurar viewport de alta resolução (A4 em 300 DPI)
    await page.setViewport({
      width: 2480,  // 210mm * 300dpi / 25.4
      height: 3508, // 297mm * 300dpi / 25.4
      deviceScaleFactor: 3, // 3x para garantir máxima qualidade
    });

    console.log('📝 Carregando HTML...');
    
    // Carregar HTML
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0', // Esperar todas as imagens e fontes carregarem
    });

    console.log('⏳ Aguardando renderização completa...');
    
    // Aguardar um pouco para garantir que tudo está renderizado
    await page.waitForTimeout(2000);

    console.log('📸 Gerando PDF...');
    
    // Gerar PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    });

    await browser.close();

    console.log('✅ PDF gerado com sucesso!');

    // Retornar PDF
    return new Response(pdf, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="devolutiva-${data.nome.replace(/\s+/g, '-')}.pdf"`,
      },
    });

  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao gerar PDF', 
        details: error.message 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
