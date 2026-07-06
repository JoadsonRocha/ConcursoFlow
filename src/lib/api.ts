import { auth } from './firebase';

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Usuário não autenticado.');
  }

  const token = await user.getIdToken();
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Prepend VITE_API_URL if it's defined and the URL is relative
  const apiUrl = import.meta.env.VITE_API_URL;
  const finalUrl = (apiUrl && url.startsWith('/')) ? `${apiUrl}${url}` : url;

  const response = await fetch(finalUrl, { ...options, headers });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    let errorData: any = {};
    try {
      errorData = JSON.parse(errorText);
    } catch {
      console.error("Non-JSON API error response:", errorText);
    }
    
    let errorMessage = '';
    if (errorData.error) {
      errorMessage = errorData.details ? `${errorData.error} (Detalhes: ${errorData.details})` : errorData.error;
    } else {
      errorMessage = errorData.details || (response.statusText ? `Erro na requisição: ${response.statusText}` : `Erro HTTP ${response.status} ao acessar a API`);
    }
    
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text().catch(() => "");
    console.error(`[API] Expected JSON but received non-JSON: ${contentType} for URL: ${finalUrl}. Starting:`, text.substring(0, 300));
    throw new Error(`O servidor retornou uma resposta não-JSON (URL: ${url}). Verifique a conectividade da API.`);
  }

  return response.json();
}
