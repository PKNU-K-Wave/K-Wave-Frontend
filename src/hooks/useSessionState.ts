import { useEffect, useState } from 'react';
import { readState, writeState } from '../utils/browserState';

export function useSessionState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readState(key, fallback));
  useEffect(() => { writeState(key, value); }, [key, value]);
  return [value, setValue] as const;
}
