import { useEffect, useSyncExternalStore } from 'react';
import { getAuthSnapshot, initializeAuth, subscribeAuth } from '../api/auth';

export function useAuth() {
  const auth = useSyncExternalStore(subscribeAuth, getAuthSnapshot);
  useEffect(() => { void initializeAuth(); }, []);
  return auth;
}
