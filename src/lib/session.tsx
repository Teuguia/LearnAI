import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform, AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api, ApiError, setToken } from './api';
import { Me } from './types';
const key = 'learnai.session.v2';
type Session = { me: Me | null; ready: boolean; error: string; refresh: () => Promise<void>; signIn: (token: string) => Promise<void>; signOut: () => Promise<void> };
const Context = createContext<Session | null>(null);
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null), [ready, setReady] = useState(false), [error, setError] = useState('');
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const current = generation.current;
    try { const data = await api<Me>('/me'); if (current === generation.current) { setMe(data); setError(''); } }
    catch (e) {
      if (current !== generation.current) return;
      if (e instanceof ApiError && e.status === 401) { setMe(null); setToken(null); if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(key); }
      throw e;
    }
  }, []);
  useEffect(() => { (async () => {
    try { const stored = Platform.OS === 'web' ? null : await SecureStore.getItemAsync(key); if (stored) { setToken(stored); await refresh(); } }
    catch (e) { setError((e as Error).message); }
    finally { setReady(true); }
  })(); }, [refresh]);
  useEffect(() => { if (!me) return; const sub = AppState.addEventListener('change', state => { if (state === 'active') refresh().catch(e => setError(e.message)); }); return () => sub.remove(); }, [me, refresh]);
  const signIn = async (value: string) => {
    generation.current++; setToken(value);
    // Check the session before persisting it.
    await refresh();
    if (Platform.OS !== 'web') await SecureStore.setItemAsync(key, value);
  };
  const signOut = async () => {
    // Logout succeeds locally even when offline; the remote token expires in seven days.
    try { await api('/auth/logout', 'POST', {}); } catch { /* local cleanup is mandatory */ }
    generation.current++; setToken(null); setMe(null);
    if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(key);
  };
  return <Context.Provider value={{ me, ready, error, refresh, signIn, signOut }}>{children}</Context.Provider>;
}
export function useSession() { const value = useContext(Context); if (!value) throw Error('SessionProvider missing'); return value; }
