import { Platform } from 'react-native';
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');
// Fail closed: an unconfigured/store binary never shows external payment instructions.
export const manualChannel = (Platform.OS === 'android' && process.env.EXPO_PUBLIC_DISTRIBUTION === 'direct') ||
  (Platform.OS === 'web' && process.env.EXPO_PUBLIC_DISTRIBUTION === 'web');
let token: string | null = null;
export function setToken(value: string | null) { token = value; }
export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  if (!API_URL) throw new Error('Le service est indisponible pour le moment.');
  if (!__DEV__ && !API_URL.startsWith('https://')) throw new Error('Une connexion sécurisée au service est nécessaire.');
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${API_URL}${path}`, { method, signal: controller.signal,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    const data = await response.json();
    if (!response.ok) throw new ApiError(response.status, data.error || 'La demande a échoué.');
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error('Connexion au service impossible. Vérifiez votre connexion et réessayez.');
  } finally { clearTimeout(timeout); }
}
