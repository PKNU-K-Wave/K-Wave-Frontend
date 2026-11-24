import { useEffect, useRef, useState } from 'react';
import { fetchPresentationCards } from '../api/presentationCards';
import type { KWaveContent, Language } from '../types/content';

export function usePresentationCards(items: KWaveContent[], language: Language) {
  const source = useRef(items);
  source.current = items;
  const key = `${language}:${items.map(item => `${item.id}:${item.contentId ?? ''}`).join(',')}`;
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState({ key: '', items: [] as KWaveContent[], loading: true, failed: false });
  useEffect(() => {
    const controller = new AbortController();
    setState({ key, items: [], loading: true, failed: false });
    void fetchPresentationCards(source.current, language, controller.signal).then(result => {
      if (!controller.signal.aborted) setState({ key, ...result, loading: false });
    }).catch(() => {
      if (!controller.signal.aborted) setState({ key, items: [], loading: false, failed: true });
    });
    return () => controller.abort();
  }, [key, language, retry]);
  return { ...(state.key === key ? state : { items: [], loading: true, failed: false }), retry: () => setRetry(value => value + 1) };
}
