import { useUI } from '../utils/ui';
export function ContentSkeleton({ count = 4 }: { count?: number }) {
  const t = useUI();
  return <div role="status" aria-label={t('Loading...')} className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"><span className="sr-only">{t('Loading...')}</span>{Array.from({ length: count }, (_, i) => <div key={i} className="overflow-hidden rounded-lg border border-ink/5 bg-white motion-safe:animate-pulse"><div className="aspect-[2/3] bg-ink/10" /><div className="space-y-3 p-4"><div className="h-4 w-3/4 bg-ink/10" /><div className="h-3 w-1/2 bg-ink/5" /></div></div>)}</div>;
}
