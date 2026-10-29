import { ContentImage } from "./ContentImage";
import { Link2, Loader2, Music2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { fetchVideoConnections, type ApiPage } from '../api/backend';
import type { KWaveContent, Language, VideoContent } from '../types/content';
import { relatedReason } from '../utils/videoPresentation';

const labels = {
  en: { related: 'Related videos', osts: 'Connected OST', more: 'Load more', empty: 'No connected content is available yet.', error: 'Could not load more content.', retry: 'Try again', shown: 'shown' },
  zh: { related: '相关作品', osts: '相关原声带', more: '加载更多', empty: '暂无关联内容。', error: '无法加载更多内容。', retry: '重试', shown: '已显示' },
  ja: { related: '関連作品', osts: '関連OST', more: 'もっと見る', empty: '関連コンテンツはまだありません。', error: '追加の読み込みに失敗しました。', retry: '再試行', shown: '表示中' },
};

export function VideoConnections({ item, kind, language, allContent, onOpen }: { item: VideoContent; kind: 'related' | 'osts'; language: Language; allContent: KWaveContent[]; onOpen: (item: KWaveContent) => void }) {
  const c = labels[language];
  const source = [...(item.connectedItems ?? []), ...allContent];
  const initial = kind === 'related'
    ? (item.connectedItems ?? []).filter(value => value.kind === 'movie' || value.kind === 'drama')
    : item.ostIds.map(id => source.find(value => value.id === id)).filter((value): value is KWaveContent => Boolean(value));
  const uniqueInitial = [...new Map(initial.map(value => [value.id, value])).values()];
  const total = kind === 'related' ? item.relatedCount : item.ostCount;
  const [localLimit, setLocalLimit] = useState(12);
  const [pages, setPages] = useState<ApiPage<KWaveContent>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const pending = useRef(false);
  useEffect(() => () => controller.current?.abort(), []);
  const modern = total !== undefined && item.contentId !== undefined;
  const initialVisible = uniqueInitial.slice(0, modern ? 12 : localLimit);
  const visible = [...new Map([...initialVisible, ...pages.flatMap(page => page.content)].map(value => [value.id, value])).values()];
  const last = pages[pages.length - 1];
  const nextPage = last ? last.number + 1 : initialVisible.length ? 1 : 0;
  const more = modern ? (last ? last.number + 1 < last.totalPages : (total ?? 0) > visible.length) && nextPage * 12 <= 10_000 : localLimit < uniqueInitial.length;
  const loadMore = () => {
    if (pending.current) return;
    if (!modern) { setLocalLimit(value => value + 12); return; }
    pending.current = true; setLoading(true); setError(false);
    const request = new AbortController(); controller.current = request;
    fetchVideoConnections(item.contentId!, kind, language, nextPage, request.signal).then(result => {
      if (!request.signal.aborted) setPages(current => [...current, result]);
    }).catch(() => { if (!request.signal.aborted) setError(true); }).finally(() => {
      if (!request.signal.aborted) { pending.current = false; setLoading(false); }
    });
  };
  const Icon = kind === 'osts' ? Music2 : Link2;
  return <section aria-label={c[kind]}>
    <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="flex items-center gap-2 text-lg font-black"><Icon className="h-4 w-4 text-sea" />{c[kind]}</h3>{visible.length > 0 && <span className="text-xs text-ink/55">{total !== undefined ? `${visible.length} / ${last?.totalElements ?? total}` : `${visible.length} ${c.shown}`}</span>}</div>
    {!visible.length && <p className="mt-3 text-sm text-ink/55">{c.empty}</p>}
    <div className="mt-4 grid gap-3 sm:grid-cols-2">{visible.map(value => {
      const reason = value.kind === 'movie' || value.kind === 'drama' ? relatedReason(value, language) : null;
      return <button key={value.id} onClick={() => onOpen(value)} className="flex min-w-0 items-center gap-3 rounded-lg bg-white p-3 text-left transition hover:bg-sea/10">
        <ContentImage src={value.thumbnailUrl || value.imageUrl} alt="" loading="lazy" decoding="async" className="h-16 w-12 shrink-0 rounded object-contain" />
        <span className="min-w-0 flex-1"><span className="block line-clamp-2 break-words text-sm font-bold">{value.title}</span>{kind === 'osts' && value.subtitle && <span className="mt-1 block break-words text-xs text-sea">{value.subtitle}</span>}{reason && <span className="mt-1 block break-words text-xs leading-5 text-sea">{reason}</span>}</span><Link2 className="h-4 w-4 shrink-0 text-ink/40" />
      </button>;
    })}</div>
    {error && <p role="alert" className="mt-3 text-sm text-ink/65">{c.error}</p>}
    {more && <button disabled={loading} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-sea disabled:opacity-50" onClick={loadMore}>{loading && <Loader2 className="h-4 w-4 animate-spin" />}{error ? c.retry : c.more}</button>}
  </section>;
}
