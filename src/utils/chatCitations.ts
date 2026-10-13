import type { ChatCitation } from '../api/backend';

export type AnswerSegment = { text: string; url?: string; title?: string };

export function citedAnswerSegments(answer: string, citations: ChatCitation[] = []): AnswerSegment[] {
  const characters = Array.from(answer);
  const segments: AnswerSegment[] = [];
  let cursor = 0;
  let number = 0;
  for (const citation of [...citations].sort((a, b) => a.startIndex - b.startIndex)) {
    let safe = false;
    try {
      const url = new URL(citation.url);
      safe = ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
    } catch { /* Ignore malformed provider URLs. */ }
    const { startIndex: start, endIndex: end } = citation;
    if (!safe || !Number.isInteger(start) || !Number.isInteger(end) || start < cursor || end <= start || end > characters.length) continue;
    if (start > cursor) segments.push({ text: characters.slice(cursor, start).join('') });
    segments.push({ text: `[${++number}]`, url: citation.url, title: citation.title || citation.url });
    cursor = end;
  }
  if (cursor < characters.length) segments.push({ text: characters.slice(cursor).join('') });
  return segments;
}
