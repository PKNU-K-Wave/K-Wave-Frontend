import { createContext, useContext } from 'react';
import type { KWaveContent } from '../types/content';

type SavedState = { items: KWaveContent[]; error: string | null; toggle: (item: KWaveContent) => void; signedIn: boolean };
export const SavedContentContext = createContext<SavedState>({ items: [], error: null, toggle: () => undefined, signedIn: false });
export const useSavedContent = () => useContext(SavedContentContext);
