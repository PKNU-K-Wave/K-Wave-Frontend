import { ArrowUpRight, Bot, MessageCircle, MessageSquarePlus, Send, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  sendChatMessage,
  type ChatApiResponse,
  type ChatContextPayload,
  type ChatTurnPayload,
  type RecommendationApiResponse,
} from '../api/backend';
import type { KWaveContent, Language } from '../types/content';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  suggestions?: RecommendationApiResponse[];
};

type ChatWidgetProps = {
  isOpen: boolean;
  language: Language;
  contextItem: KWaveContent | null;
  allContent: KWaveContent[];
  onOpenChange: (isOpen: boolean) => void;
  onClearContext: () => void;
  onOpenContent: (item: KWaveContent) => void;
};

const copyByLanguage = {
  en: {
    welcome: 'Ask me about Korean movies, dramas, songs, or artists. I will search the K-Wave catalog for you.',
    placeholder: 'Ask about K-culture',
    context: 'Asking about',
    thinking: 'Searching the K-Wave catalog...',
    error: 'I could not reach the guide. I searched the content currently available on this device instead.',
    newChat: 'Start a new chat',
    prompts: ['Recommend a drama and its OST', 'Show me K-POP groups', 'What should I watch first?'],
  },
  zh: {
    welcome: '可以向我询问韩国电影、电视剧、歌曲或艺人。我会搜索 K-Wave 内容目录。',
    placeholder: '询问韩国文化',
    context: '正在询问',
    thinking: '正在搜索 K-Wave 内容目录...',
    error: '暂时无法连接向导。我改为搜索了此设备上现有的内容。',
    newChat: '开始新对话',
    prompts: ['推荐一部电视剧和它的 OST', '介绍一些 K-POP 组合', '我应该先看什么？'],
  },
  ja: {
    welcome: '韓国の映画、ドラマ、曲、アーティストについて質問できます。K-Waveのカタログから探します。',
    placeholder: '韓国文化について質問',
    context: '質問中のコンテンツ',
    thinking: 'K-Waveのカタログを検索中...',
    error: 'ガイドに接続できないため、この端末で利用できるコンテンツを検索しました。',
    newChat: '新しいチャットを開始',
    prompts: ['ドラマとOSTをおすすめして', 'K-POPグループを紹介して', '最初に何を観ればいい？'],
  },
} satisfies Record<Language, Record<string, string | string[]>>;

export function ChatWidget({
  isOpen,
  language,
  contextItem,
  allContent,
  onOpenChange,
  onClearContext,
  onOpenContent,
}: ChatWidgetProps) {
  const copy = copyByLanguage[language];
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage(language)]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    activeControllerRef.current?.abort();
    activeControllerRef.current = null;
    setMessages([welcomeMessage(language)]);
    setInput('');
    setIsSending(false);
  }, [language]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending]);

  const contextPayload = useMemo(() => (contextItem ? toChatContext(contextItem) : undefined), [contextItem]);

  const submit = async (event?: FormEvent, prompt?: string) => {
    event?.preventDefault();
    const message = (prompt ?? input).trim();
    if (!message || isSending) {
      return;
    }

    const userMessage: ChatMessage = { id: createId(), role: 'user', text: message };
    const history = toHistory(messages);
    setMessages((current) => [...current, userMessage]);
    setInput('');
    setIsSending(true);

    const controller = new AbortController();
    activeControllerRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);
    try {
      const response = await sendChatMessage({ message, language, context: contextPayload, history }, controller.signal);
      setMessages((current) => [...current, toAssistantMessage(response)]);
    } catch {
      if (activeControllerRef.current !== controller) {
        return;
      }
      const fallback = buildLocalResponse(message, language, contextItem, allContent);
      setMessages((current) => [
        ...current,
        { ...toAssistantMessage(fallback), text: `${copy.error}\n\n${fallback.answer}` },
      ]);
    } finally {
      window.clearTimeout(timeoutId);
      if (activeControllerRef.current === controller) {
        activeControllerRef.current = null;
        setIsSending(false);
      }
    }
  };

  const resetConversation = () => {
    activeControllerRef.current?.abort();
    activeControllerRef.current = null;
    setMessages([welcomeMessage(language)]);
    setInput('');
    setIsSending(false);
    onClearContext();
  };

  const openSuggestion = (suggestion: RecommendationApiResponse) => {
    const item = resolveSuggestion(suggestion, allContent);
    if (!item) {
      return;
    }
    onOpenChange(false);
    onOpenContent(item);
  };

  return (
    <>
      {!isOpen ? (
        <button
          className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-4 z-[45] grid h-14 w-14 place-items-center rounded-full bg-ink text-white shadow-soft transition hover:bg-coral focus:outline-none focus:ring-4 focus:ring-coral/25 md:bottom-6 md:right-6"
          onClick={() => onOpenChange(true)}
          aria-label="Ask K-Wave"
          title="Ask K-Wave"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-paper bg-citron" />
        </button>
      ) : null}

      {isOpen ? (
        <section
          className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-3 right-3 z-[60] flex h-[min(68dvh,40rem)] min-h-[22rem] flex-col overflow-hidden rounded-lg border border-ink/10 bg-paper shadow-soft md:bottom-6 md:left-auto md:right-6 md:h-[38rem] md:w-[24rem]"
          aria-label="Ask K-Wave chat"
        >
          <header className="flex h-16 shrink-0 items-center gap-3 border-b border-ink/10 bg-white px-4">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-citron">
              <Bot className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-black text-ink">Ask K-Wave</h2>
              <p className="text-xs font-semibold text-sea">K-Video · K-POP</p>
            </div>
            <span className="rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-black uppercase text-ink/55">
              {language}
            </span>
            <button
              className="grid h-9 w-9 place-items-center rounded-full text-ink/55 transition hover:bg-ink/5 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
              onClick={resetConversation}
              disabled={messages.length === 1 && !contextItem}
              aria-label={copy.newChat as string}
              title={copy.newChat as string}
            >
              <MessageSquarePlus className="h-5 w-5" />
            </button>
            <button
              className="grid h-9 w-9 place-items-center rounded-full text-ink/55 transition hover:bg-ink/5 hover:text-ink"
              onClick={() => onOpenChange(false)}
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          {contextItem ? (
            <div className="flex shrink-0 items-center gap-3 border-b border-ink/10 bg-citron/20 px-4 py-2.5">
              <img className="h-10 w-10 rounded-lg object-cover" src={contextItem.imageUrl} alt="" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase text-ink/40">{copy.context as string}</p>
                <p className="truncate text-xs font-black text-ink">{contextItem.title}</p>
              </div>
              <button className="grid h-8 w-8 place-items-center rounded-full hover:bg-white" onClick={onClearContext} aria-label="Clear context">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          <div ref={scrollRef} className="scrollbar-hide flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} onOpenSuggestion={openSuggestion} />
            ))}
            {messages.length === 1 ? (
              <div className="flex flex-wrap gap-2">
                {(copy.prompts as string[]).map((prompt) => (
                  <button
                    key={prompt}
                    className="rounded-full border border-ink/10 bg-white px-3 py-2 text-left text-xs font-bold leading-5 text-ink/65 transition hover:border-sea hover:text-sea"
                    onClick={() => void submit(undefined, prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ) : null}
            {isSending ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-ink/45">
                <Sparkles className="h-4 w-4 animate-pulse text-coral" />
                {copy.thinking as string}
              </div>
            ) : null}
          </div>

          <form className="flex shrink-0 items-end gap-2 border-t border-ink/10 bg-white p-3" onSubmit={(event) => void submit(event)}>
            <textarea
              className="max-h-28 min-h-11 flex-1 resize-none rounded-lg border border-ink/10 bg-paper px-3 py-3 text-sm leading-5 text-ink outline-none placeholder:text-ink/35 focus:border-sea"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void submit();
                }
              }}
              placeholder={copy.placeholder as string}
              rows={1}
              maxLength={800}
            />
            <button
              className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-coral text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-40"
              type="submit"
              disabled={!input.trim() || isSending}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      ) : null}
    </>
  );
}

function ChatBubble({ message, onOpenSuggestion }: { message: ChatMessage; onOpenSuggestion: (item: RecommendationApiResponse) => void }) {
  const isUser = message.role === 'user';
  return (
    <div className={isUser ? 'ml-10' : 'mr-4'}>
      <div className={`whitespace-pre-line rounded-lg px-3.5 py-3 text-sm leading-6 ${isUser ? 'bg-ink text-white' : 'bg-white text-ink/70'}`}>
        {message.text}
      </div>
      {message.suggestions && message.suggestions.length > 0 ? (
        <div className="mt-2 space-y-2">
          {message.suggestions.slice(0, 3).map((suggestion) => (
            <button
              key={suggestion.id}
              className="flex w-full items-center gap-3 rounded-lg border border-ink/10 bg-white p-2 text-left transition hover:border-coral/40"
              onClick={() => onOpenSuggestion(suggestion)}
            >
              <img className="h-12 w-12 rounded-lg object-cover" src={suggestion.imageUrl || ''} alt="" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-black text-ink">{suggestion.title}</span>
                <span className="mt-1 block truncate text-[11px] font-semibold text-sea">{suggestion.subtitle}</span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-ink/40" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function welcomeMessage(language: Language): ChatMessage {
  return { id: 'welcome', role: 'assistant', text: copyByLanguage[language].welcome };
}

function toAssistantMessage(response: ChatApiResponse): ChatMessage {
  return { id: createId(), role: 'assistant', text: response.answer, suggestions: response.suggestions };
}

function toHistory(messages: ChatMessage[]): ChatTurnPayload[] {
  return messages
    .filter((message) => message.id !== 'welcome')
    .slice(-6)
    .map((message) => ({ role: message.role, content: message.text }));
}

function toChatContext(item: KWaveContent): ChatContextPayload {
  const numericId = getNumericId(item.id);
  return {
    contentType: item.kind,
    domainId: Number.isFinite(numericId) ? numericId : undefined,
    contentId: item.contentId,
    title: item.title,
  };
}

function resolveSuggestion(suggestion: RecommendationApiResponse, allContent: KWaveContent[]): KWaveContent | undefined {
  return (
    allContent.find((item) => item.id === suggestion.id) ??
    allContent.find((item) => item.contentId === suggestion.contentId && matchesType(item, suggestion.contentType))
  );
}

function matchesType(item: KWaveContent, type: RecommendationApiResponse['contentType']): boolean {
  return item.kind === type || (type === 'idol' && item.kind === 'idol');
}

function buildLocalResponse(
  message: string,
  language: Language,
  contextItem: KWaveContent | null,
  allContent: KWaveContent[],
): ChatApiResponse {
  const normalized = message.toLowerCase();
  const wantsVideo = hasAny(normalized, ['movie', 'film', 'drama', '영화', '드라마', '电影', '电视剧', '映画', 'ドラマ']);
  const wantsKPop = hasAny(normalized, ['k-pop', 'kpop', 'song', 'music', 'ost', 'idol', '노래', '아이돌', '歌曲', '偶像', '音楽']);
  const pool = allContent.filter((item) => {
    if (wantsVideo && !wantsKPop) return item.kind === 'movie' || item.kind === 'drama';
    if (wantsKPop && !wantsVideo) return item.kind === 'song' || item.kind === 'idol';
    return item.kind !== 'food';
  });
  const tokens = normalized.split(/[^a-z0-9]+/).filter((token) => token.length >= 2);
  const ranked = pool
    .map((item, index) => {
      const searchable = `${item.title} ${item.subtitle} ${item.tags.join(' ')}`.toLowerCase();
      const score = tokens.reduce((total, token) => total + (searchable.includes(token) ? 2 : 0), 0) + (contextItem?.id === item.id ? 10 : 0);
      return { item, score, index };
    })
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, 3)
    .map(({ item }) => toLocalSuggestion(item));
  const titles = ranked.map((item) => item.title).join(', ');
  const answer =
    language === 'zh'
      ? `当前内容中可以先看看 ${titles}。点击卡片即可查看详情。`
      : language === 'ja'
        ? `現在のコンテンツでは ${titles} がおすすめです。カードを開くと詳細を確認できます。`
        : `From the content currently available, try ${titles}. Open a card to see the details.`;
  return { answer, suggestions: ranked, responseMode: 'catalog' };
}

function toLocalSuggestion(item: KWaveContent): RecommendationApiResponse {
  const numericId = getNumericId(item.id);
  return {
    id: item.id,
    contentType: item.kind === 'food' ? 'song' : item.kind,
    domainId: Number.isFinite(numericId) ? numericId : 0,
    contentId: item.contentId ?? 0,
    title: item.title,
    subtitle: item.subtitle,
    imageUrl: item.imageUrl,
    tags: item.tags,
    description: item.description,
    score: 1,
    reasons: ['Local catalog'],
  };
}

function hasAny(value: string, keywords: string[]): boolean {
  return keywords.some((keyword) => value.includes(keyword));
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getNumericId(id: string): number {
  const parts = id.split('-');
  return Number(parts[parts.length - 1]);
}
