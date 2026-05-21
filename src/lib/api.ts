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

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    let errorData: any = {};
    try {
      errorData = JSON.parse(errorText);
    } catch {
      console.error("Non-JSON API error response:", errorText);
    }
    
    throw new Error(errorData.error || errorData.details || (response.statusText ? `Erro na requisição: ${response.statusText}` : `Erro HTTP ${response.status} ao acessar a API`));
  }

  return response.json();
}
