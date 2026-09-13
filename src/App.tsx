import { useCallback, useEffect, useState } from 'react';
import { Clapperboard, Home, Music2, Soup, Sparkles, type LucideIcon } from 'lucide-react';
import { fetchContentDetail, resolveVideoRelations } from './api/backend';
import { DetailModal } from './components/DetailModal';
import { ChatWidget } from './components/ChatWidget';
import { Header } from './components/Header';
import { useKWaveContent } from './hooks/useKWaveContent';
import { CategoryPage } from './pages/CategoryPage';
import { HomePage } from './pages/HomePage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { SearchPage } from './pages/SearchPage';
import { VideoPage } from './pages/VideoPage';
import type { KWaveContent, Language } from './types/content';

type CategoryView = 'video' | 'kpop' | 'food';
type View = 'home' | CategoryView | 'recommendations' | 'search';

const navItems: Array<{ view: View; label: string; icon: LucideIcon }> = [
  { view: 'home', label: 'Home', icon: Home },
  { view: 'video', label: 'K-Video', icon: Clapperboard },
  { view: 'kpop', label: 'K-POP', icon: Music2 },
  { view: 'food', label: 'K-Food', icon: Soup },
  { view: 'recommendations', label: 'For You', icon: Sparkles },
];

function App() {
  const [view, setView] = useState<View>('home');
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [fromSearch, setFromSearch] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [selectedItem, setSelectedItem] = useState<KWaveContent | null>(null);
  const [detailRequest, setDetailRequest] = useState<KWaveContent | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [detailRetry, setDetailRetry] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState<KWaveContent | null>(null);
  const content = useKWaveContent(language);
  const openSearchItem = useCallback((item: KWaveContent) => {
    setSelectedItem(item);
    setDetailRequest(item);
    setView(getCategoryView(item));
    setFromSearch(true);
  }, []);

  const openItem = useCallback((item: KWaveContent) => {
    setSelectedItem(item);
    setDetailRequest(item);
  }, []);

  useEffect(() => {
    if (!detailRequest) return;
    const controller = new AbortController();
    setDetailLoading(true); setDetailError(false);
    fetchContentDetail(detailRequest, language, controller.signal).then(detail => {
      if (!controller.signal.aborted) setSelectedItem(detail.kind === 'movie' || detail.kind === 'drama' ? resolveVideoRelations(detail, content.allContent) : detail);
    }).catch(() => { if (!controller.signal.aborted) setDetailError(true); }).finally(() => { if (!controller.signal.aborted) setDetailLoading(false); });
    return () => controller.abort();
  }, [detailRequest, language, detailRetry, content.allContent]);

  const openRecommendedItem = (item: KWaveContent) => {
    setView(getCategoryView(item));
    openItem(item);
  };

  const askAboutItem = (item: KWaveContent) => {
    setSelectedItem(null);
    setDetailRequest(null);
    setChatContext(item);
    setIsChatOpen(true);
  };

  useEffect(() => {
    if (!selectedItem && !isChatOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedItem, isChatOpen]);

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <Header selectedLanguage={language} onLanguageChange={setLanguage} onHomeClick={() => { setView('home'); setFromSearch(false); }} query={query} onQueryChange={setQuery} onSearch={() => { setSubmittedQuery(query.trim()); setView('search'); setFromSearch(false); }} />

      <nav className="mx-auto hidden max-w-7xl gap-2 overflow-x-auto px-4 py-4 sm:px-6 md:flex lg:px-8">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = view === item.view;

          return (
            <button
              key={item.view}
              className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-black transition ${
                isActive ? 'bg-coral text-white shadow-soft' : 'bg-white text-ink/65 ring-1 ring-ink/10 hover:text-ink'
              }`}
              onClick={() => setView(item.view)}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {fromSearch && view !== 'search' && <div className="mx-auto max-w-7xl px-4"><button className="min-h-11 text-sm font-bold text-sea" onClick={() => { setView('search'); setFromSearch(false); }}>{language === 'ja' ? '検索に戻る' : language === 'zh' ? '返回搜索' : 'Back to search'}</button></div>}
      <div hidden={view !== 'search'}>
        <SearchPage key={`${submittedQuery}:${language}`} active={view === 'search'} query={submittedQuery} language={language} fallbackContent={content.allContent} onOpen={openSearchItem} />
      </div>
      {view === 'search' ? null : view === 'home' ? (
        <HomePage content={content} onOpen={openItem} onSelectCategory={setView} />
      ) : view === 'recommendations' ? (
        <RecommendationsPage content={content} onOpenRecommendation={openRecommendedItem} />
      ) : view === 'video' ? (
        <VideoPage language={language} onOpen={openItem} />
      ) : (
        <CategoryPage category={view} content={content} onOpen={openItem} />
      )}

      <DetailModal
        key={selectedItem?.id ?? 'closed'}
        language={language}
        loading={detailLoading}
        error={detailError}
        onRetry={() => setDetailRetry(detailRetry + 1)}
        item={selectedItem}
        allContent={content.allContent}
        onClose={() => { setSelectedItem(null); setDetailRequest(null); }}
        onOpenRelated={openItem}
        onAsk={askAboutItem}
      />

      <ChatWidget
        isOpen={isChatOpen}
        language={language}
        contextItem={chatContext}
        allContent={content.allContent}
        onOpenChange={setIsChatOpen}
        onClearContext={() => setChatContext(null)}
        onOpenContent={openRecommendedItem}
      />

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-paper/95 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-16px_40px_rgba(20,21,31,0.12)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = view === item.view;

            return (
              <button
                key={item.view}
                className={`flex h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-black transition ${
                  isActive ? 'bg-ink text-white' : 'text-ink/55 hover:bg-white hover:text-ink'
                }`}
                onClick={() => setView(item.view)}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-citron' : ''}`} />
                <span className="max-w-full truncate px-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default App;

function getCategoryView(item: KWaveContent): CategoryView {
  if (item.kind === 'movie' || item.kind === 'drama') {
    return 'video';
  }

  if (item.kind === 'song' || item.kind === 'idol') {
    return 'kpop';
  }

  return 'food';
}
