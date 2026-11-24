import { createContext, useContext } from 'react';
import type { KWaveContent } from '../types/content';

type SavedState = { items: KWaveContent[]; error: string | null; toggle: (item: KWaveContent) => void; signedIn: boolean; busy: boolean; loading: boolean };
export const SavedContentContext = createContext<SavedState>({ items: [], error: null, toggle: () => undefined, signedIn: false, busy: false, loading: false });
export const useSavedContent = () => useContext(SavedContentContext);
