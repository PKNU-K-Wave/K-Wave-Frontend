import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useUI } from '../utils/ui';

export function TimelineYearPicker({ value, years, onChange }: { value: number; years: number[]; onChange: (year: number) => void }) {
  const t = useUI();
  const [open, setOpen] = useState(false);
  const [decade, setDecade] = useState(Math.floor(value / 10) * 10);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const selected = useRef<HTMLButtonElement>(null);
  const id = useId();
  const options = new Set([...years, value]);
  const decades = [...new Set([...options].map(year => Math.floor(year / 10) * 10))].sort((a,b) => a-b);
  const index = decades.indexOf(decade);
  const close = () => setOpen(false);
  useEffect(() => {
    if (!open) return;
    const root = document.getElementById('root');
    const returnFocus = trigger.current;
    const previousInert = root?.inert ?? false;
    const previousOverflow = document.body.style.overflow;
    if (root) root.inert = true;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => (selected.current ?? panel.current)?.focus({preventScroll:true}), 0);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {event.preventDefault();setOpen(false);}
      if (event.key !== 'Tab') return;
      const nodes = [...(panel.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])];
      const first = nodes[0], last = nodes[nodes.length-1];
      if (event.shiftKey && (document.activeElement === first || !nodes.includes(document.activeElement as HTMLButtonElement))) {event.preventDefault();last?.focus();}
      else if (!event.shiftKey && (document.activeElement === last || !nodes.includes(document.activeElement as HTMLButtonElement))) {event.preventDefault();first?.focus();}
    };
    document.addEventListener('keydown',onKey);
    return () => {window.clearTimeout(timer);document.removeEventListener('keydown',onKey);if(root)root.inert=previousInert;document.body.style.overflow=previousOverflow;returnFocus?.focus({preventScroll:true});};
  }, [open]);
  return <>
    <button ref={trigger} type="button" aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined} aria-label={`${t('Choose a year')}: ${value}`} onClick={()=>{setDecade(Math.floor(value/10)*10);setOpen(true);}} className="inline-flex min-h-20 items-center gap-3 text-sea sm:gap-4">
      <span key={value} className="timeline-year-swap text-6xl font-black tabular-nums leading-none md:text-7xl">{value}</span><ChevronDown className={`h-6 w-6 transition-transform ${open?'rotate-180':''}`} />
    </button>
    {open && createPortal(<div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/35 p-3 backdrop-blur-sm md:items-center md:p-6" onClick={close}>
      <div ref={panel} id={id} role="dialog" aria-modal="true" aria-label={t('Choose a year')} tabIndex={-1} onClick={event=>event.stopPropagation()} className="timeline-year-menu mb-[env(safe-area-inset-bottom)] w-full max-w-sm rounded-lg border border-ink/10 bg-white p-4 shadow-2xl md:mb-0 md:p-5">
        <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-base font-black">{t('Choose a year')}</h2><button type="button" onClick={close} aria-label={t('Close year picker')} title={t('Close year picker')} className="grid h-11 w-11 place-items-center rounded-lg text-ink/50 hover:bg-ink/5"><X className="h-5 w-5" /></button></div>
        <div className="mb-4 flex items-center justify-between border-y border-ink/10 py-2">
          <button type="button" disabled={index<=0} onClick={()=>setDecade(decades[index-1])} aria-label={t('Previous decade')} title={t('Previous decade')} className="grid h-11 w-11 place-items-center rounded-lg text-sea hover:bg-sea/5 disabled:opacity-25"><ChevronLeft className="h-5 w-5" /></button>
          <p className="text-sm font-bold tabular-nums text-ink/65" aria-live="polite">{decade} - {decade+9}</p>
          <button type="button" disabled={index>=decades.length-1} onClick={()=>setDecade(decades[index+1])} aria-label={t('Next decade')} title={t('Next decade')} className="grid h-11 w-11 place-items-center rounded-lg text-sea hover:bg-sea/5 disabled:opacity-25"><ChevronRight className="h-5 w-5" /></button>
        </div>
        <div key={decade} className="timeline-year-menu grid grid-cols-5 gap-2" onKeyDown={event=>{
          const moves: Record<string,number>={ArrowRight:1,ArrowLeft:-1,ArrowDown:5,ArrowUp:-5};
          const buttons=Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button'));
          const current=buttons.indexOf(document.activeElement as HTMLButtonElement);
          if (!(event.key in moves) && event.key!=='Home' && event.key!=='End') return;
          event.preventDefault();
          let next=event.key==='Home'?0:event.key==='End'?9:current+moves[event.key];
          const step=event.key==='End'?-1:Math.sign(moves[event.key]??1);
          while(next>=0&&next<buttons.length&&buttons[next].disabled)next+=step;
          buttons[next]?.focus();
        }}>{Array.from({length:10},(_,i)=>decade+i).map(year=><button key={year} ref={year===value?selected:undefined} type="button" disabled={!options.has(year)} aria-pressed={year===value} onClick={()=>{onChange(year);close();}} className={`relative min-h-12 rounded-lg border text-sm font-bold tabular-nums transition disabled:opacity-25 ${year===value?'border-sea bg-sea text-white':'border-ink/10 bg-white text-ink/70 enabled:hover:border-sea enabled:hover:bg-sea/5'}`}>{year}{year===value&&<Check className="absolute right-1 top-1 h-2.5 w-2.5" aria-hidden="true" />}</button>)}</div>
      </div>
    </div>,document.body)}
  </>;
}
