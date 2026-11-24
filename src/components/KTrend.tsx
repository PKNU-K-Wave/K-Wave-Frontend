import { useContext, useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight, Clapperboard, Flame, History, Music2, Newspaper, RefreshCw } from 'lucide-react';
import { ApiError, fetchTrendReference, fetchTrendFeed } from '../api/backend';
import type { TrendTab } from '../types/trends';
import { trendNewsSearch } from '../utils/trends';
import { UIContext, useUI } from '../utils/ui';

const tabs = [
  {value:'hot',label:'Hot now',icon:Flame},
  {value:'past',label:'Past trends',icon:History},
] as const;

export function KTrend() {
  const t = useUI();
  const language = useContext(UIContext);
  const id = useId();
  const [tab, setTab] = useState<TrendTab>('hot');
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchTrendFeed>> | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<'unavailable' | 'error' | null>(null);
  const [retry, setRetry] = useState(0);
  const [links, setLinks] = useState<Record<string, string | null>>({});
  const linkCache = useRef(new Map<string,string | null>());
  const linkPool = useRef<{active:number;queue:Array<()=>void>}>({active:0,queue:[]});
  useEffect(() => {
    const controller = new AbortController();
    setData(null);setLoading(true);setFailed(null);
    fetchTrendFeed(language,controller.signal).then(result=>{if(!controller.signal.aborted)setData(result);}).catch(error=>{if(!controller.signal.aborted)setFailed(error instanceof ApiError && error.status===404?'unavailable':'error');}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[language,retry]);
  const items = data?.[tab] ?? [];
  const shown = items;
  const charts = tab === 'hot' ? data?.charts ?? [] : [];
  const ids = shown.map(item=>item.trendItemId).join(',');
  useEffect(() => {
    if(!ids)return;
    const controller=new AbortController();
    const pending=ids.split(',').map(Number);
    const load=async()=>{
      // Keep one pool across tab changes; finish in-flight reads instead of starting another batch.
      const acquire=async()=>{const pool=linkPool.current;if(pool.active<3){pool.active++;return;}await new Promise<void>(resolve=>pool.queue.push(resolve));};
      const release=()=>{const pool=linkPool.current;const next=pool.queue.shift();if(next)next();else pool.active--;};
      await Promise.all(Array.from({length:Math.min(3,pending.length)},async()=>{
        while(pending.length&&!controller.signal.aborted){
          const itemId=pending.shift()!;const key=`${language}:${itemId}`;
          let url=linkCache.current.get(key);
          if(!linkCache.current.has(key)){
            await acquire();
            const requestController=new AbortController();
            const timeout=window.setTimeout(()=>requestController.abort(),10000);
            try{
              if(controller.signal.aborted)return;
              if(linkCache.current.has(key))url=linkCache.current.get(key);
              else {url=await fetchTrendReference(itemId,language,requestController.signal);linkCache.current.set(key,url);}
            }catch{url=null;}
            finally{window.clearTimeout(timeout);release();}
          }
          if(!controller.signal.aborted)setLinks(current=>({...current,[key]:url??null}));
        }
      }));
    };
    void load();return()=>controller.abort();
  },[ids,language,retry]);
  const changeTab=(value:TrendTab)=>{setTab(value);list.current?.scrollTo({top:0});};
  return <section aria-labelledby={`${id}-heading`} className="mt-7 border-y border-ink/10 py-5 sm:mt-9 sm:py-6">
    <div><h2 id={`${id}-heading`} className="flex items-center gap-2 text-xl font-black sm:text-2xl"><Flame className="h-5 w-5 text-coral" />K-Trend</h2><p className="mt-1 text-xs leading-6 text-ink/55">{t('What is catching on in Korea?')}</p></div>
    <div role="tablist" aria-label={t('K-Trend categories')} className="mt-3 grid grid-cols-2 border-b border-ink/10 sm:flex sm:gap-5">{tabs.map((option,index)=>{const Icon=option.icon;return <button key={option.value} id={`${id}-tab-${option.value}`} role="tab" aria-selected={tab===option.value} aria-controls={`${id}-panel`} tabIndex={tab===option.value?0:-1} onClick={()=>changeTab(option.value)} onKeyDown={event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?1:(index+1)%2;changeTab(tabs[next].value);document.getElementById(`${id}-tab-${tabs[next].value}`)?.focus();}} className={`inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 border-b-2 px-1 py-2 text-xs font-bold sm:gap-2 sm:px-2 sm:text-sm ${tab===option.value?'border-sea text-sea':'border-transparent text-ink/50 hover:text-ink'}`}><Icon className="h-3.5 w-3.5 shrink-0" /><span>{t(option.label)}</span></button>;})}</div>
    <div ref={list} id={`${id}-panel`} role="tabpanel" tabIndex={0} aria-labelledby={`${id}-tab-${tab}`} aria-busy={loading} className="min-h-36 max-h-[216px] overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-sea">
      {loading?<div role="status" aria-label={t('Loading trends...')} className="space-y-4 py-5">{[0,1,2].map(value=><div key={value} className="h-5 animate-pulse rounded bg-ink/5 motion-reduce:animate-none" style={{width:`${85-value*12}%`}} />)}</div>:failed?<div role="status" className="flex min-h-36 flex-wrap items-center justify-between gap-3 py-5"><p className="max-w-xl text-sm leading-6 text-ink/55">{t(failed==='unavailable'?'K-Trend will be available after the server update.':'Could not load trends right now.')}</p><button onClick={()=>setRetry(value=>value+1)} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-sea"><RefreshCw className="h-4 w-4" />{t('Try again')}</button></div>:!shown.length&&!charts.length?<div role="status" className="flex min-h-36 flex-wrap items-center justify-between gap-3 py-5"><p className="text-sm text-ink/50">{t('No verified trends in this category yet.')}</p><button onClick={()=>setRetry(value=>value+1)} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-sea"><RefreshCw className="h-4 w-4" />{t('Refresh trends')}</button></div>:<ul className="divide-y divide-ink/10">{shown.map(item=>{
        const reference=links[`${language}:${item.trendItemId}`];
        const isSource=Boolean(reference);
        return <li key={item.trendItemId}><a href={reference||trendNewsSearch(item)} target="_blank" rel="noopener noreferrer" className="group flex h-[72px] items-center gap-3 py-3 text-left transition hover:bg-sea/5 sm:gap-5 sm:px-1" aria-label={`${item.name} — ${t(isSource?'Read source (new tab)':'Search related news (new tab)')}`}>
          <span className="min-w-0 flex-1"><span className="flex min-w-0 items-center gap-2 text-sm font-black text-ink group-hover:text-sea sm:text-base"><Newspaper aria-label={t('News article')} role="img" className="h-3.5 w-3.5 shrink-0 text-ink/45" /><span className="truncate">{item.name}</span>{item.badge==='RISING'&&<span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-coral sm:text-xs"><Flame aria-hidden="true" className="h-3 w-3" />{t('Rising')}</span>}</span>{item.description&&<span className="mt-1 block truncate text-xs leading-5 text-ink/60 sm:text-sm">{item.description}</span>}</span>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-sea transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </a></li>;
      })}{charts.map(chart=><li key={chart.key}><a href={chart.url} target="_blank" rel="noopener noreferrer" className="group flex h-[72px] items-center gap-3 py-3 text-left transition hover:bg-sea/5 sm:gap-5 sm:px-1"><span className="min-w-0 flex-1"><span className="flex min-w-0 items-center gap-2 text-sm font-black group-hover:text-sea sm:text-base">{chart.key.startsWith('songs:') ? <Music2 aria-label={t('Song')} role="img" className="h-3.5 w-3.5 shrink-0 text-ink/45" /> : <Clapperboard aria-label={t('Video')} role="img" className="h-3.5 w-3.5 shrink-0 text-ink/45" />}<span className="truncate">{chart.name}</span></span><span className="mt-1 block truncate text-xs leading-5 text-ink/60 sm:text-sm">{chart.source}{chart.description ? ` · ${chart.description}` : ''}</span></span><ArrowUpRight className="h-4 w-4 shrink-0 text-sea" /></a></li>)}</ul>}
    </div>
    <p className="mt-3 text-[10px] leading-5 text-ink/45 sm:text-xs">{t('Naver DataLab · Weekly search trends. Sources may be in Korean.')}</p>
  </section>;
}
