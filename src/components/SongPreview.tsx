import { Music2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Language } from '../types/content';

const labels = {
  en: { title: 'Song preview', unavailable: 'No preview is available for this song.', failed: 'The preview could not be played.', retry: 'Try again' },
  zh: { title: '歌曲试听', unavailable: '这首歌曲暂无试听。', failed: '无法播放试听。', retry: '重试' },
  ja: { title: '楽曲プレビュー', unavailable: 'この曲の試聴はありません。', failed: '試聴を再生できませんでした。', retry: '再試行' },
};

export function SongPreview({ url, title, language }: { url?: string; title: string; language: Language }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [failed, setFailed] = useState(false);
  const text = labels[language];
  let source: string | undefined;
  try {
    const parsed = new URL(url || '');
    if (parsed.protocol === 'https:' || (parsed.protocol === 'http:' && window.location.protocol === 'http:')) source = parsed.href;
  } catch { /* Missing or invalid preview URLs are not playable. */ }

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && source) audio.src = source;
    return () => {
      if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); }
    };
  }, [source]);

  return (
    <section className="min-w-0 border-y border-ink/10 py-5" aria-label={text.title}>
      <h3 className="flex items-center gap-2 text-lg font-black text-ink"><Music2 className="h-5 w-5 text-sea" />{text.title}</h3>
      {source ? <>
        <audio
          ref={audioRef}
          src={source}
          controls
          preload="none"
          aria-label={`${text.title}: ${title}`}
          className="mt-4 block h-12 w-full max-w-full"
          onError={() => setFailed(true)}
          onSeeking={event => {
            const audio = event.currentTarget;
            if (audio.currentTime >= 60) { audio.pause(); audio.currentTime = 0; }
          }}
          onTimeUpdate={event => {
            const audio = event.currentTarget;
            if (audio.currentTime >= 60) { audio.pause(); audio.currentTime = 0; }
          }}
        />
        {failed && <p role="alert" className="mt-3 text-sm text-ink/65">{text.failed} <button className="min-h-11 font-bold text-sea underline" onClick={() => { setFailed(false); audioRef.current?.load(); }}>{text.retry}</button></p>}
      </> : <p className="mt-3 text-sm text-ink/55">{text.unavailable}</p>}
    </section>
  );
}
