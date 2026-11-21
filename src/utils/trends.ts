import { displayText } from './displayText';
import type { TrendGroups, TrendItem, TrendTab } from '../types/trends';

export function trendTab(item: Pick<TrendItem, 'status' | 'badge'>): TrendTab | null {
  if (item.status === 'PAST') return 'past';
  if (item.badge === 'FADING') return 'cooling';
  return item.badge === 'RISING' || item.badge === 'STEADY' ? 'hot' : null;
}

function readItem(value: unknown): TrendItem | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  if (!Number.isSafeInteger(row.trendItemId) || Number(row.trendItemId) <= 0 || typeof row.name !== 'string' || !row.name.trim() || !['ACTIVE','PAST'].includes(String(row.status))) return null;
  const name = displayText(row.name);
  if (!name) return null;
  const rawDate = row.trendUpdatedOn;
  const date = typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) && !Number.isNaN(Date.parse(rawDate)) && new Date(rawDate).toISOString().slice(0,10) === rawDate ? rawDate : null;
  return {
    trendItemId: Number(row.trendItemId), name, nameKo: typeof row.nameKo === 'string' ? displayText(row.nameKo) : '',
    description: typeof row.description === 'string' ? displayText(row.description) : '', category: typeof row.category === 'string' ? row.category : '',
    badge: ['RISING','STEADY','FADING'].includes(String(row.badge)) ? row.badge as TrendItem['badge'] : null,
    status: row.status as TrendItem['status'], resolvedLanguage: typeof row.resolvedLanguage === 'string' ? row.resolvedLanguage : 'ko',
    machineTranslated: row.machineTranslated === true, trendUpdatedOn: date,
  };
}

export function groupTrends(data: unknown): TrendGroups {
  if (!data || typeof data !== 'object') throw new Error('Invalid trend response');
  const { items, pastItems } = data as Record<string, unknown>;
  if (!Array.isArray(items) || !Array.isArray(pastItems)) throw new Error('Trend items are not supported by this server');
  const unique = new Map<number, TrendItem>();
  for (const value of [...items, ...pastItems]) { const item = readItem(value); if (item) unique.set(item.trendItemId, item); }
  const result: TrendGroups = {hot:[],cooling:[],past:[]};
  for (const item of unique.values()) { const tab = trendTab(item); if (tab) result[tab].push(item); }
  return result;
}

export function safeTrendUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try { const url = new URL(value); if (!['http:','https:'].includes(url.protocol) || url.username || url.password) return null; return url.href; } catch { return null; }
}

export function trendNewsSearch(item: Pick<TrendItem, 'nameKo' | 'name'>): string {
  return `https://search.naver.com/search.naver?${new URLSearchParams({where:'news',query:item.nameKo || item.name})}`;
}
