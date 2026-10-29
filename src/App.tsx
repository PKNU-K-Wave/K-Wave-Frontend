import { useCallback, useEffect, useRef, useState } from 'react';
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
import { KPopPage } from './pages/KPopPage';
import { LoginPage } from './pages/LoginPage';
import { PreferenceSetupPage } from './pages/PreferenceSetupPage';
import { useAuth } from './hooks/useAuth';
import { SavedContentProvider } from './hooks/useSavedContent';
import { canRestoreSession, isGoogleCallback, isGoogleSignInEntry, retrySession, signOut, startGoogleSignIn } from './api/auth';
import type { KWaveContent, Language } from './types/content';
import { useNavigation } from './hooks/useNavigation';
import { detailSeed, storedLanguage, type View } from './utils/navigation';
import { readState, writeState } from './utils/browserState';
import { UIContext, translateUI } from './utils/ui';

type CategoryView = 'video' | 'kpop' | 'food';

const navItems: Array<{ view: View; label: string; icon: LucideIcon }> = [
  { view: 'home', label: 'Home', icon: Home },
  { view: 'video', label: 'K-Video', icon: Clapperboard },
  { view: 'kpop', label: 'K-POP', icon: Music2 },
  { view: 'food', label: 'K-Food', icon: Soup },
  { view: 'recommendations', label: 'For You', icon: Sparkles },
];

function App() {
  const auth = useAuth();
  const { route, navigate } = useNavigation();
  const view = isGoogleCallback && auth.status === 'loading' || isGoogleSignInEntry && auth.status === 'loading' ? 'login' : route.view;
  const setView = useCallback((next: View) => { if (view === 'login' && next !== 'login') writeState('save-intent', null); setFromSearch(false); setIsChatOpen(false); navigate({ view: next, query: '', detail: null }); }, [navigate, view]);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [query, setQuery] = useState(route.query);
  const submittedQuery = route.view === 'search' ? route.query : readState('last-query', '');
  const [fromSearch, setFromSearch] = useState(false);
  const [language, updateLanguage] = useState<Language>(storedLanguage);
  const setLanguage = (value: Language) => { try { localStorage.setItem('kwave-language', value); } catch { /* Optional preference storage. */ } updateLanguage(value); };
  const [selectedItem, setSelectedItem] = useState<KWaveContent | null>(null);
  const [detailRequest, setDetailRequest] = useState<KWaveContent | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [detailRetry, setDetailRetry] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState<KWaveContent | null>(null);
  const [visited, setVisited] = useState<View[]>([route.view]);
  const itemCache = useRef(new Map<string, KWaveContent>());
  const completedLogin = useRef(false);
  const content = useKWaveContent(language);
  const allContentRef = useRef(content.allContent);
  allContentRef.current = content.allContent;
  const isSignedIn = auth.status === 'signed-in' && auth.session !== null;
  const userId = auth.session?.user.userId;
  const isAuthView = view === 'login' || view === 'onboarding';
  const openLogin = () => { setLoginError(null); setIsChatOpen(false); setSelectedItem(null); setDetailRequest(null); setView('login'); setFromSearch(false); };
  const openForYou = () => {
    setView(auth.status === 'loading' || isSignedIn ? 'recommendations' : 'login');
    setLoginError(null); setIsChatOpen(false); setFromSearch(false);
  };
  const logout = () => { setView('home'); setFromSearch(false); setIsChatOpen(false); void signOut(); };
  const loginWithGoogle = () => {
    setLoginError(null);
    try { startGoogleSignIn(); } catch (error) { setLoginError(error instanceof Error ? error.message : 'Google sign-in is unavailable.'); }
  };
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  useEffect(() => { setVisited(current => current.includes(view) ? current : [...current, view]); }, [view]);
  useEffect(() => { if (view === 'search') { setQuery(route.query); writeState('last-query', route.query); } }, [view, route.query]);
  useEffect(() => {
    if (auth.status === 'signed-in' && userId) {
      if ((auth.completedGoogleLogin && !completedLogin.current) || view === 'login') {
        completedLogin.current = true;
        const pending = readState<{ item: KWaveContent; route: typeof route; createdAt: number } | null>('save-intent', null);
        if (pending && Date.now() - pending.createdAt < 30 * 60_000 && pending.createdAt <= Date.now()) { itemCache.current.set(pending.item.id, pending.item); navigate(pending.route, true); }
        else setView('recommendations');
      }
    } else if (auth.status === 'guest') {
      completedLogin.current = false;
      if (view === 'recommendations' || view === 'onboarding') navigate({ ...route, view: 'login' }, true);
    }
  }, [auth.status, userId, auth.completedGoogleLogin, view, navigate, setView, route]);
  const openSearchItem = useCallback((item: KWaveContent) => {
    itemCache.current.set(item.id, item);
    setSelectedItem(item);
    setDetailRequest(item);
    navigate({ view: getCategoryView(item), query: '', detail: item.id, contentId: item.contentId });
    setFromSearch(true);
  }, [navigate]);

  const openItem = useCallback((item: KWaveContent) => {
    itemCache.current.set(item.id, item);
    setSelectedItem(item);
    navigate({ ...route, detail: item.id, contentId: item.contentId });
  }, [navigate, route]);

  useEffect(() => {
    if (!route.detail) { setSelectedItem(null); setDetailRequest(null); return; }
    const item = itemCache.current.get(route.detail) ?? content.allContent.find(item => item.id === route.detail) ?? detailSeed(route.detail, route.contentId);
    setSelectedItem(item); setDetailRequest(item);
  // A detail route, not a home feed refresh, owns the active request.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.detail, route.contentId]);

  useEffect(() => {
    if (!detailRequest) return;
    const controller = new AbortController();
    setDetailLoading(true); setDetailError(false);
    fetchContentDetail(detailRequest, language, controller.signal).then(detail => {
      if (!controller.signal.aborted) setSelectedItem(detail.kind === 'movie' || detail.kind === 'drama' ? resolveVideoRelations(detail, allContentRef.current) : detail);
    }).catch(() => { if (!controller.signal.aborted) setDetailError(true); }).finally(() => { if (!controller.signal.aborted) setDetailLoading(false); });
    return () => controller.abort();
  }, [detailRequest, language, detailRetry]);

  const openRecommendedItem = (item: KWaveContent) => {
    itemCache.current.set(item.id, item);
    navigate({ view: getCategoryView(item), query: '', detail: item.id, contentId: item.contentId });
  };

  const askAboutItem = (item: KWaveContent) => {
    navigate({ ...route, detail: null, contentId: undefined }, true);
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
    <UIContext.Provider value={language}><SavedContentProvider key={userId ?? 'guest'} userId={userId} onLogin={openLogin} returnRoute={route}>
    <div className="min-h-screen pb-24 md:pb-0">
      <Header selectedLanguage={language} onLanguageChange={setLanguage} onHomeClick={() => { setView('home'); setFromSearch(false); }} query={query} onQueryChange={setQuery} onSearch={() => { writeState('last-query', query.trim()); navigate({ view: 'search', query: query.trim(), detail: null }); setFromSearch(false); }} isLoginView={isAuthView} onChat={() => setIsChatOpen(true)} />

      <nav aria-label={translateUI('Main navigation', language)} className="mx-auto hidden max-w-7xl gap-2 overflow-x-auto px-4 py-4 sm:px-6 md:flex lg:px-8">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = view === item.view || (isAuthView && item.view === 'recommendations');

          return (
            <button
              key={item.view}
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-black transition ${
                isActive ? 'bg-coral text-white shadow-soft' : 'bg-white text-ink/65 ring-1 ring-ink/10 hover:text-ink'
              }`}
              onClick={() => item.view === 'recommendations' ? openForYou() : setView(item.view)}
            >
              <Icon className="h-4 w-4" />
              {translateUI(item.label, language)}
            </button>
          );
        })}
      </nav>

      {fromSearch && view !== 'search' && <div className="mx-auto max-w-7xl px-4"><button className="min-h-11 text-sm font-bold text-sea" onClick={() => { navigate({ view: 'search', query: readState('last-query', ''), detail: null }); setFromSearch(false); }}>{language === 'ja' ? '検索に戻る' : language === 'zh' ? '返回搜索' : 'Back to search'}</button></div>}
      <div hidden={view !== 'search'}>
        <SearchPage key={`${submittedQuery}:${language}`} active={view === 'search'} query={submittedQuery} language={language} fallbackContent={content.allContent} onOpen={openSearchItem} onSearchQuery={value => { setQuery(value); writeState('last-query', value); navigate({ view: 'search', query: value, detail: null }); }} />
      </div>
      {view === 'login' || ((view === 'onboarding' || view === 'recommendations') && !isSignedIn) ? <LoginPage onBack={() => setView('home')} onGoogleLogin={loginWithGoogle} busy={auth.status === 'loading'} error={loginError ?? auth.error} onRetrySession={canRestoreSession() ? () => { void retrySession(); } : undefined} /> : view === 'onboarding' && userId ? (
        <PreferenceSetupPage key={userId} userId={userId} onComplete={() => setView('recommendations')} onSkip={() => setView('home')} />
      ) : view === 'recommendations' && userId ? (
        <RecommendationsPage key={userId} userId={userId} content={content} language={language} onOpenRecommendation={openRecommendedItem} onLogout={logout} />
      ) : null}

      {visited.includes('home') && <div hidden={view !== 'home'}><HomePage content={content} onOpen={openItem} onSelectCategory={setView} /></div>}
      {visited.includes('video') && <div hidden={view !== 'video'}><VideoPage language={language} active={view === 'video' && !route.detail} onOpen={openItem} /></div>}
      {visited.includes('kpop') && <div hidden={view !== 'kpop'}><KPopPage onOpen={openItem} /></div>}
      {visited.includes('food') && <div hidden={view !== 'food'}><CategoryPage category="food" content={content} onOpen={openItem} /></div>}

      <DetailModal
        key={selectedItem?.id ?? 'closed'}
        language={language}
        loading={detailLoading}
        error={detailError}
        onRetry={() => setDetailRetry(detailRetry + 1)}
        item={selectedItem}
        allContent={content.allContent}
        onClose={() => { if (window.history.state?.detailEntry) window.history.back(); else navigate({ ...route, detail: null, contentId: undefined }, true); }}
        onOpenRelated={openItem}
        onAsk={askAboutItem}
      />

      {!isAuthView && <ChatWidget
        isOpen={isChatOpen}
        language={language}
        contextItem={chatContext}
        allContent={content.allContent}
        onOpenChange={setIsChatOpen}
        onClearContext={() => setChatContext(null)}
        onOpenContent={openRecommendedItem}
      />}

      <nav aria-label={translateUI('Main navigation', language)} className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-paper/95 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-16px_40px_rgba(20,21,31,0.12)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = view === item.view || (isAuthView && item.view === 'recommendations');

            return (
              <button
                key={item.view}
                aria-current={isActive ? 'page' : undefined}
                className={`flex h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-black transition ${
                  isActive ? 'bg-ink text-white' : 'text-ink/55 hover:bg-white hover:text-ink'
                }`}
                onClick={() => item.view === 'recommendations' ? openForYou() : setView(item.view)}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-citron' : ''}`} />
                <span className="max-w-full truncate px-1">{translateUI(item.label, language)}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
    </SavedContentProvider></UIContext.Provider>
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
