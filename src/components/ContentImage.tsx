import { ImageOff } from 'lucide-react';
import { useState, type ImgHTMLAttributes } from 'react';
import { useUI } from '../utils/ui';

export function ContentImage({ src, className = '', ...props }: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & { src?: string | null }) {
  const t = useUI();
  const [failed, setFailed] = useState('');
  return src && failed !== src ? <img {...props} src={src} alt={props.alt ?? ''} loading={props.loading ?? 'lazy'} decoding="async" className={className} onError={() => setFailed(src)} /> : <span role="img" aria-label={t('Image unavailable')} className={`inline-flex items-center justify-center bg-ink/5 text-ink/25 ${className}`}><ImageOff className="h-7 w-7" aria-hidden="true" /></span>;
}
