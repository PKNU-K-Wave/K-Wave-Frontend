import { Globe2, Search } from 'lucide-react';
import type { Language } from '../types/content';

type HeaderProps = {
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
  onHomeClick: () => void;
};

const languages: Array<{ code: Language; label: string }> = [
  { code: 'en', label: 'EN' },
  { code: 'zh', label: 'ZH' },
  { code: 'ja', label: 'JA' },
];

export function Header({ selectedLanguage, onLanguageChange, onHomeClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
        <button
          className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-ink px-3 text-left text-white shadow-soft sm:h-auto sm:px-4 sm:py-2"
          onClick={onHomeClick}
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-coral text-sm font-black">K</span>
          <span className="text-base font-black tracking-normal sm:text-lg">K-Wave</span>
        </button>

        <div className="hidden flex-1 items-center rounded-full border border-ink/10 bg-white px-4 py-2 md:flex">
          <Search className="h-4 w-4 text-ink/45" />
          <input
            className="ml-3 w-full bg-transparent text-sm outline-none placeholder:text-ink/40"
            placeholder="Search movies, idols, songs, foods"
            type="search"
          />
        </div>

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
      </div>
    </header>
  );
}
