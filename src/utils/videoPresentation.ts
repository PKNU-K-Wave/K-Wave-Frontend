import type { Language, VideoContent } from '../types/content';

export function seasonLabel(season: NonNullable<VideoContent['seasons']>[number], language: Language): string {
  const name = season.name?.trim();
  if (name && !/^(시즌|season)\s*\d+$/i.test(name)) return name;
  return language === 'ja' ? `シーズン ${season.number}` : language === 'zh' ? `第 ${season.number} 季` : `Season ${season.number}`;
}

export function translationNotice(requested: Language, resolved?: string): string | null {
  if (!resolved || requested === resolved) return null;
  return requested === 'ja' ? '翻訳は準備中です。タイトルとあらすじは原文で表示しています。' : requested === 'zh' ? '翻译准备中，当前显示原文标题与简介。' : 'Translation pending. Showing the original title and synopsis.';
}

export function relatedReason(item: VideoContent, language: Language): string | null {
  const names = item.sharedActors?.map(actor => actor.name).filter(Boolean) ?? [];
  if (names.length) return `${language === 'ja' ? '共通の出演者' : language === 'zh' ? '共同演员' : 'Shared cast'}: ${names.join(', ')}`;
  if (item.relationType === 'CO_STAR') return language === 'ja' ? '共通の出演者' : language === 'zh' ? '共同演员' : 'Shared cast';
  return null;
}
