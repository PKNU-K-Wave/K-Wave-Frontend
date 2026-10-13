import { Globe2, LogIn, Search } from 'lucide-react';
import type { Language } from '../types/content';

type HeaderProps = {
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
  onHomeClick: () => void;
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  onLoginClick: () => void;
  isLoginView: boolean;
};

const languages: Array<{ code: Language; label: string }> = [
  { code: 'en', label: 'EN' },
  { code: 'zh', label: 'ZH' },
  { code: 'ja', label: 'JA' },
];

export function Header({ selectedLanguage, onLanguageChange, onHomeClick, query, onQueryChange, onSearch, onLoginClick, isLoginView }: HeaderProps) {
  const searchInput = <form role="search" className="flex h-11 w-full items-center rounded-full border border-ink/10 bg-white px-3" onSubmit={(event) => { event.preventDefault(); onSearch(); }}>
    <input aria-label="Search K-Wave" value={query} onChange={(event) => onQueryChange(event.target.value)} className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" placeholder="Search K-Wave" type="search" />
    <button type="submit" aria-label="Search" title="Search" className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-ink/5"><Search className="h-5 w-5 text-ink/60" /></button>
  </form>;
  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 pt-3 sm:gap-4 sm:px-6 sm:py-3 lg:px-8">
        <button
          className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-ink px-3 text-left text-white shadow-soft sm:h-auto sm:px-4 sm:py-2"
          onClick={onHomeClick}
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-coral text-sm font-black">K</span>
          <span className="text-base font-black tracking-normal sm:text-lg">K-Wave</span>
        </button>

        {!isLoginView && <div className="hidden flex-1 md:flex">{searchInput}</div>}

        <div className="ml-auto flex items-center gap-1 rounded-full border border-ink/10 bg-white p-1 sm:gap-2">
          <Globe2 className="ml-1 h-4 w-4 text-ink/50 sm:ml-2" />
          {languages.map((language) => (
            <button
              key={language.code}
              className={`h-8 rounded-full px-2.5 text-xs font-bold transition sm:px-3 ${
                selectedLanguage === language.code ? 'bg-sea text-white' : 'text-ink/55 hover:bg-ink/5'
              }`}
              onClick={() => onLanguageChange(language.code)}
            >
              {language.label}
            </button>
          ))}
        </div>
        {!isLoginView && <button onClick={onLoginClick} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink/10 bg-white text-ink/65 transition hover:bg-ink hover:text-white" aria-label="Sign in" title="Sign in"><LogIn className="h-4 w-4" /></button>}
      </div>
      {!isLoginView && <div className="mx-auto max-w-7xl px-4 pb-3 pt-2 sm:px-6 md:hidden">{searchInput}</div>}
    </header>
  );
}
