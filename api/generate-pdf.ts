import type { VercelRequest, VercelResponse } from '@vercel/node';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// Configuração importante para Vercel
export const config = {
  maxDuration: 60, // 60 segundos timeout
  memory: 3008, // Máxima memória disponível
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Apenas aceitar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { url, filename } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL é obrigatória' });
    }

    console.log('🚀 Iniciando geração de PDF para:', url);

    // Configurar Chromium para Vercel
    const options = {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    };

    // Lançar navegador
    const browser = await puppeteer.launch(options);
    const page = await browser.newPage();

    // Configurar viewport A4
    await page.setViewport({
      width: 794,  // A4 width em pixels
      height: 1123, // A4 height em pixels
      deviceScaleFactor: 2, // Alta resolução
    });

    console.log('📄 Acessando página...');
    
    // Acessar a URL
    await page.goto(url, {
      waitUntil: 'networkidle0', // Esperar tudo carregar
      timeout: 30000, // 30 segundos timeout
    });

    console.log('📸 Gerando PDF...');

    // Gerar PDF com alta qualidade
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

    console.log('✅ PDF gerado com sucesso:', pdf.length, 'bytes');

    // Retornar o PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename || 'document.pdf'}"`
    );
    res.status(200).send(pdf);

  } catch (error: any) {
    console.error('❌ Erro ao gerar PDF:', error);
    
    res.status(500).json({
      error: 'Erro ao gerar PDF',
      message: error.message,
    });
  }
}

