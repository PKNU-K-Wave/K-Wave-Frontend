import { Parser } from 'htmlparser2';
import { decodeHTML } from 'entities';

const blocks = new Set(['p', 'div', 'section', 'article', 'header', 'footer', 'blockquote', 'li', 'ul', 'ol', 'tr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'hr']);
const hidden = new Set(['script', 'style', 'iframe', 'object', 'embed', 'template', 'head', 'noscript']);
const textFields = new Set(['title', 'name', 'originalName', 'nameKo', 'nameRomanized', 'categoryName', 'subtitle', 'description', 'summary', 'culturalBackground', 'lineText', 'biography', 'character', 'characterName', 'originalCharacterName', 'originalDirector', 'role', 'director', 'artistName', 'featuring', 'fandomName', 'fandomCulture', 'agency', 'ingredients', 'taste', 'howToEat', 'tip', 'imageAuthor', 'imageLicense', 'cookTime', 'difficulty', 'album', 'artist', 'text', 'relationReason', 'reason', 'line', 'knownFor']);
const textArrays = new Set(['tags', 'genres', 'famousLines', 'ingredients', 'steps', 'reasons']);

// Parse as text, never as a live DOM or HTML rendered by React.
export function displayText(value: string, trim = true): string {
  if (!/[<&]|\u00a0/.test(value)) return value;
  let decoded = value;
  for (let i = 0; i < 3; i++) {
    const next = decodeHTML(decoded);
    if (next === decoded) break;
    decoded = next;
  }
  const parts: string[] = [];
  const lineBreak = () => { if (!parts[parts.length - 1]?.endsWith('\n')) parts.push('\n'); };
  let suppressed = 0;
  const parser = new Parser({
    onopentag(name) {
      if (hidden.has(name)) { suppressed++; return; }
      if (suppressed) return;
      if (name === 'br' || blocks.has(name)) lineBreak();
      else if (name === 'td' || name === 'th') parts.push(' ');
    },
    ontext(text) { if (!suppressed) parts.push(parts[parts.length - 1]?.endsWith('\n') ? text.replace(/^[ \t]*\r?\n/, '') : text); },
    onclosetag(name) {
      if (hidden.has(name)) { suppressed = Math.max(0, suppressed - 1); return; }
      if (!suppressed && blocks.has(name)) lineBreak();
    },
  }, { decodeEntities: false });
  parser.end(decoded);
  const result = parts.join('').replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n').replace(/\n{3,}/g, '\n\n');
  return trim ? result.trim() : result;
}

// Only display fields are normalized: URLs, IDs, filter codes, auth data and answer citation offsets stay intact.
export function displayData<T>(value: T, key = ''): T {
  if (typeof value === 'string') return (textFields.has(key) || textArrays.has(key) || key === '' ? displayText(value) : value) as T;
  if (Array.isArray(value)) return value.map(item => displayData(item, key)) as T;
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([field, item]) => [field, displayData(item, field)])) as T;
  return value;
}

