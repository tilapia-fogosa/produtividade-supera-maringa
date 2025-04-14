
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Função para obter token de acesso usando OAuth2
export async function getAccessToken(credentials: any): Promise<string | null> {
  try {
    console.log('Iniciando obtenção de token de acesso...');
    
    const tokenEndpoint = 'https://oauth2.googleapis.com/token';
    const scopes = ['https://www.googleapis.com/auth/spreadsheets'];
    
    // Função para codificar objeto em base64url
    function base64UrlEncode(obj: any) {
      const json = JSON.stringify(obj);
      const base64 = btoa(json);
      return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    const now = Math.floor(Date.now() / 1000);
    
    // Criar cabeçalho JWT
    const jwtHeader = {
      alg: 'RS256',
      typ: 'JWT'
    };
    
    // Criar payload JWT
    const jwtClaimSet = {
      iss: credentials.client_email,
      scope: scopes.join(' '),
      aud: tokenEndpoint,
      exp: now + 3600,
      iat: now
    };
    
    console.log('JWT payload preparado:', { ...jwtClaimSet, privateKey: 'REDACTED' });
    
    // Formar a parte de cabeçalho e payload do JWT
    const encodedHeader = base64UrlEncode(jwtHeader);
    const encodedClaimSet = base64UrlEncode(jwtClaimSet);
    const signatureInput = `${encodedHeader}.${encodedClaimSet}`;
    
    // Usar a chave privada das credenciais para assinar
    const privateKey = credentials.private_key.replace(/\\n/g, '\n');
    
    try {
      // Importar a chave para WebCrypto
      const importedKey = await crypto.subtle.importKey(
        'pkcs8',
        new TextEncoder().encode(privateKey).buffer,
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256'
        },
        false,
        ['sign']
      );
      
      console.log('Chave privada importada com sucesso');
      
      // Assinar o JWT
      const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        importedKey,
        new TextEncoder().encode(signatureInput)
      );
      
      console.log('JWT assinado com sucesso');
      
      // Converter a assinatura para base64url
      const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
      const encodedSignature = signatureBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      
      // Formar o JWT completo
      const jwt = `${signatureInput}.${encodedSignature}`;
      
      console.log('JWT completo gerado, solicitando token...');
      
      // Usar o JWT para solicitar um token de acesso
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta do token OAuth:', errorText);
        throw new Error(`Falha ao obter token: ${response.status} - ${errorText}`);
      }
      
      const tokenData = await response.json();
      console.log('Token de acesso obtido com sucesso');
      return tokenData.access_token;
    } catch (cryptoError) {
      console.error('Erro ao processar operações criptográficas:', cryptoError);
      throw cryptoError;
    }
  } catch (error) {
    console.error('Erro ao obter token de acesso:', error);
    console.error('Stack trace:', error.stack);
    return null;
  }
}

// Função para enviar dados para o Google Sheets
export async function enviarParaGoogleSheets(
  accessToken: string, 
  spreadsheetId: string, 
  sheetData: any[]
): Promise<boolean> {
  try {
    console.log('Iniciando envio para Google Sheets...');
    console.log('Dados a serem enviados:', JSON.stringify(sheetData, null, 2));
    
    const sheetsEndpoint = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Respostas ao formulário 1:append?valueInputOption=USER_ENTERED`;
    
    console.log('Endpoint Google Sheets:', sheetsEndpoint);
    
    const sheetsResponse = await fetch(sheetsEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [sheetData]
      })
    });
    
    if (!sheetsResponse.ok) {
      const errorText = await sheetsResponse.text();
      console.error('Erro ao enviar para Google Sheets:', errorText);
      console.error('Status:', sheetsResponse.status);
      console.error('Headers:', Object.fromEntries(sheetsResponse.headers.entries()));
      throw new Error(`Erro ao registrar no Google Sheets: ${sheetsResponse.status} - ${errorText}`);
    }
    
    const responseData = await sheetsResponse.json();
    console.log('Dados registrados com sucesso no Google Sheets:', responseData);
    return true;
  } catch (error) {
    console.error('Erro ao enviar dados para o Google Sheets:', error);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Função para preparar os dados para o Google Sheets
export function prepararDadosParaSheets(data: any): any[] {
  console.log('Preparando dados para Google Sheets...');
  console.log('Dados recebidos:', JSON.stringify(data, null, 2));
  
  const dataAtual = new Date().toLocaleString('pt-BR');
  
  const dadosPreparados = [
    dataAtual,                           // Carimbo de data/hora
    data.aluno_nome,                     // Nome do Aluno
    data.data_registro.split('T')[0],    // Data
    data.apostila_abaco || '',           // Qual Apostila de Ábaco?
    data.pagina_abaco || '',             // Ábaco - Página
    data.exercicios_abaco || '',         // Ábaco - Exercícios Realizados
    data.erros_abaco || '',              // Ábaco - Nº de Erros
    data.fez_desafio ? 'Sim' : 'Não',    // Fez Desafio?
    data.comentario || '',               // Comentário, observação ou Situação
    data.presente ? 'Presente' : 'Faltoso', // Tipo de Situação
    data.is_reposicao ? 'Sim' : 'Não'    // É reposição?
  ];
  
  console.log('Dados preparados para Google Sheets:', dadosPreparados);
  return dadosPreparados;
}

