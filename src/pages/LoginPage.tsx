import { useUI } from "../utils/ui";
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';

type LoginPageProps = {
  onBack: () => void;
  onGoogleLogin: () => void;
  busy?: boolean;
  error?: string | null;
  onRetrySession?: () => void;
};

export function LoginPage({ onBack, onGoogleLogin, busy = false, error, onRetrySession }: LoginPageProps) {
  const t = useUI();
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-11rem)] max-w-7xl items-center px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <section className="grid w-full overflow-hidden rounded-lg border border-ink/10 bg-white shadow-soft lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-ink px-6 py-10 text-white sm:px-10 sm:py-14">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-citron">
            <Sparkles className="h-4 w-4" />
            {t("K-Wave for you")}</p>
          <h1 className="mt-5 max-w-lg text-3xl font-black leading-tight sm:text-5xl">
            {t("Keep your Korean culture picks personal.")}</h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/70 sm:text-base">
            {t("Save the categories and tastes you choose, then return to recommendations that fit you.")}</p>
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-10">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-coral">{t("Welcome back")}</p>
          <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">{t("Sign in to K-Wave")}</h2>
          <p className="mt-3 text-sm leading-6 text-ink/60">{t("Use your Google account to save your For You preferences.")}</p>

          <button
            className="mt-8 flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-ink/15 bg-white px-4 text-sm font-black text-ink transition hover:bg-ink hover:text-white"
            onClick={onGoogleLogin}
            disabled={busy}
            aria-label={busy ? t("Signing you in") : t("Continue with Google")}
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-sm font-black text-[#4285f4] shadow-sm">{t("G")}</span>
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" />{t("Signing you in...")}</> : t("Continue with Google")}
          </button>
          {error && <p role="alert" className="mt-4 text-sm leading-6 text-red-700">{t(error)}</p>}
          {error && onRetrySession && <button disabled={busy} onClick={onRetrySession} className="mt-2 min-h-11 text-sm font-bold text-sea">{t("Retry saved sign-in")}</button>}

          <button className="mt-5 inline-flex min-h-11 w-fit items-center gap-2 text-sm font-bold text-sea" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            {t("Continue exploring")}</button>
        </div>
      </section>
    </main>
  );
}
