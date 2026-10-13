import type { ChatApiResponse } from '../api/backend';
import type { KWaveContent, Language } from '../types/content';

export function clarifyCatalogAnswer(response: ChatApiResponse, message: string, language: Language, context: KWaveContent | null): ChatApiResponse {
  if (response.responseMode !== 'catalog' || !context || !['movie', 'drama'].includes(context.kind)) return response;
  const asksLocation = /\b(places?|locations?|filming|where|settings?)\b|촬영지|촬영 장소|배경 장소|어디|ロケ地|撮影場所|場所|拍摄地|拍攝地|取景地|地点|地點/iu.test(message);
  if (!asksLocation) return response;
  const answers: Record<Language, string> = {
    en: `I don't currently have verified filming locations or place details for “${context.title}” in the K-Wave catalog. I can't confirm where it was filmed or give an address from the available information. Would you like to ask about its story, cast, or OST instead?`,
    zh: `K-Wave 目前没有《${context.title}》的已核实拍摄地或地点资料，因此无法确认拍摄地点或提供地址。您想了解剧情、演员或 OST 吗？`,
    ja: `K-Wave には現在「${context.title}」の確認済みのロケ地・場所情報がないため、撮影場所や住所をお伝えできません。あらすじ、出演者、OST について聞いてみますか？`,
  };
  return { ...response, answer: answers[language], suggestions: [] };
}
