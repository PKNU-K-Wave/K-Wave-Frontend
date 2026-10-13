import { ArrowLeft, Sparkles } from 'lucide-react';

type LoginPageProps = {
  onBack: () => void;
  onGoogleLogin: () => void;
};

export function LoginPage({ onBack, onGoogleLogin }: LoginPageProps) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid w-full overflow-hidden rounded-lg border border-ink/10 bg-white shadow-soft lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-ink px-6 py-10 text-white sm:px-10 sm:py-14">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-citron">
            <Sparkles className="h-4 w-4" />
            K-Wave for you
          </p>
          <h1 className="mt-5 max-w-lg text-3xl font-black leading-tight sm:text-5xl">
            Keep your Korean culture picks personal.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/70 sm:text-base">
            Save the categories and tastes you choose, then return to recommendations that fit you.
          </p>
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-10">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-coral">Welcome back</p>
          <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Sign in to K-Wave</h2>
          <p className="mt-3 text-sm leading-6 text-ink/60">Use your Google account to save your For You preferences.</p>

          <button
            className="mt-8 flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-ink/15 bg-white px-4 text-sm font-black text-ink transition hover:bg-ink hover:text-white"
            onClick={onGoogleLogin}
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-sm font-black text-[#4285f4] shadow-sm">G</span>
            Continue with Google
          </button>

          <button className="mt-5 inline-flex min-h-11 w-fit items-center gap-2 text-sm font-bold text-sea" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Continue exploring
          </button>
        </div>
      </section>
    </main>
  );
}
