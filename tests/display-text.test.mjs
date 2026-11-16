import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTypescript } from './load-typescript.mjs';
const { displayText, displayData } = await loadTypescript('../src/utils/displayText.ts');

test('recipe line-break markup becomes real line breaks including escaped variants', () => {
  assert.equal(displayText('1인분 기준<br>[주재료] 열무(30g)<BR />[양념] 간장'), '1인분 기준\n[주재료] 열무(30g)\n[양념] 간장');
  assert.equal(displayText('a&lt;br&gt;b'), 'a\nb');
  assert.equal(displayText('a&amp;lt;br&amp;gt;b'), 'a\nb');
  assert.equal(displayText('a<br>\r\nb'), 'a\nb');
});
test('named and numeric entities are decoded without damaging ordinary comparisons', () => {
  assert.equal(displayText('BTS &amp; aespa&nbsp;&quot;Live&quot; &#39;OST&#39; &#x1F3B5;'), 'BTS & aespa "Live" \'OST\' 🎵');
  assert.equal(displayText('온도 < 100°C, 2 > 1, I <3 K-pop'), '온도 < 100°C, 2 > 1, I <3 K-pop');
  assert.equal(displayText('恋愛・音乐・한국어'), '恋愛・音乐・한국어');
});
test('block and list structure is readable and unsafe element contents are dropped', () => {
  assert.equal(displayText('<p>Hello <b>world</b></p><ul><li>One</li><li>Two</li></ul>'), 'Hello world\nOne\nTwo');
  assert.equal(displayText('Safe<script>alert(1)</script><style>body{display:none}</style><iframe src=x>hidden</iframe><img src=x onerror=alert(2)> text'), 'Safe text');
  assert.equal(displayText('A<!-- comment -->B'), 'AB');
});
test('display data normalizes nested prose but not IDs, URLs, filter codes or citation positions', () => {
  const input = { title: 'A &amp; B', ingredients: 'Rice<br>Egg', steps: [{ order: 1, description: 'Wash&lt;br&gt;Cook' }], tags: ['Rock &amp; Roll'], imageUrl: 'https://example.test/?a=1&amp;b=2', contentId: 42, categoryCode: 'A&amp;B', answer: 'A<br>B', citations: [{ startIndex: 1, endIndex: 4, url: 'https://example.test/?x=1&amp;y=2' }] };
  const result = displayData(input);
  assert.equal(result.title, 'A & B');
  assert.equal(result.ingredients, 'Rice\nEgg');
  assert.equal(result.steps[0].description, 'Wash\nCook');
  assert.deepEqual(result.tags, ['Rock & Roll']);
  for (const field of ['imageUrl', 'contentId', 'categoryCode', 'answer', 'citations']) assert.deepEqual(result[field], input[field]);
  assert.equal(input.title, 'A &amp; B');
});
test('normalization is stable for typical source markup and preserves segment spacing when requested', () => {
  for (const value of ['A<br>B', 'A &amp; B', '<p>Hello</p>', '열무 &nbsp; 톳', 'I <3 K-pop']) assert.equal(displayText(displayText(value)), displayText(value));
  assert.equal(displayText('Hello<br>world ', false), 'Hello\nworld ');
});

