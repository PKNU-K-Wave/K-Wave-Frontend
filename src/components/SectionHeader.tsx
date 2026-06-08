type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-coral">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-black tracking-normal text-ink sm:text-3xl">{title}</h2>
      </div>
      <p className="max-w-xl text-sm leading-6 text-ink/60">{description}</p>
    </div>
  );
}
