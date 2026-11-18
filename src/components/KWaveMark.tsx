export function KWaveMark({ className = 'h-8 w-8' }: { className?: string }) {
  return <svg className={`shrink-0 ${className}`} viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <path d="M7 14L12 30C13 34 16 34 17.5 30L23 15C24 12 26 12 27 16L30 29C31 33 34 34 36 29L41 14" stroke="#fa8176" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M27 16L30 29C31 33 34 34 36 29L41 14" stroke="#8dd9cc" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}
