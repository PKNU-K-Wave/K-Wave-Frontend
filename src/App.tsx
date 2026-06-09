import { useEffect, useState } from 'react';
import { Clapperboard, Home, Music2, Soup } from 'lucide-react';
import { DetailModal } from './components/DetailModal';
import { Header } from './components/Header';
import { CategoryPage } from './pages/CategoryPage';
import { HomePage } from './pages/HomePage';
import type { KWaveContent, Language } from './types/content';

type View = 'home' | 'video' | 'kpop' | 'food';

const navItems: Array<{ view: View; label: string; icon: typeof Home }> = [
  { view: 'home', label: 'Home', icon: Home },
  { view: 'video', label: 'K-Video', icon: Clapperboard },
  { view: 'kpop', label: 'K-POP', icon: Music2 },
  { view: 'food', label: 'K-Food', icon: Soup },
];

function App() {
  const [view, setView] = useState<View>('home');
  const [language, setLanguage] = useState<Language>('en');
  const [selectedItem, setSelectedItem] = useState<KWaveContent | null>(null);

  const openItem = (item: KWaveContent) => {
    setSelectedItem(item);
  };

  useEffect(() => {
    if (!selectedItem) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedItem]);

  return (
    <div className="min-h-screen">
      <Header selectedLanguage={language} onLanguageChange={setLanguage} />

      <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-4 sm:px-6 lg:px-8">
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

      {view === 'home' ? (
        <HomePage onOpen={openItem} onSelectCategory={setView} />
      ) : (
        <CategoryPage category={view} onOpen={openItem} />
      )}

      <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} onOpenRelated={openItem} />
    </div>
  );
}

export default App;
