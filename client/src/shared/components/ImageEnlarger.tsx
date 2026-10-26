import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';
import { X, IdCard } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { getSignedMediaUrl, type MediaEntityType } from '@/shared/lib/secureMedia';

export interface ImageEnlargerProps {
  src: string;
  isOpen: boolean;
  onClose: () => void;
  alt?: string;
  caption?: string;
  subtitle?: string;
  entityType?: MediaEntityType;
  entityId?: string | number | null;
  modalTitle?: string;
}

export function ImageEnlarger({
  src,
  isOpen,
  onClose,
  alt = 'Enlarged photo',
  caption,
  subtitle,
  entityType = 'learner',
  entityId,
  modalTitle,
}: ImageEnlargerProps) {
  const isDirect = !src || src.startsWith('data:') || src.startsWith('blob:') || src.includes('sig=') || src.startsWith('http://') || src.startsWith('https://');
  const [asyncSignedUrl, setAsyncSignedUrl] = useState<string | null>(null);
  const activeSrc = isDirect ? src : (asyncSignedUrl || src);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const isImageLoaded = Boolean(activeSrc && loadedSrc === activeSrc);

  useEffect(() => {
    if (!isOpen || !src || isDirect) {
      return;
    }

    let cancelled = false;
    const fetchSigned = async () => {
      try {
        const id = entityId != null ? String(entityId) : src.replace(/^.*\/uploads\//, '');
        const signed = await getSignedMediaUrl(entityType, id, src);
        if (!cancelled && signed) {
          setAsyncSignedUrl(signed);
        }
      } catch {
        // Fallback to original
      }
    };
    void fetchSigned();

    return () => {
      cancelled = true;
    };
  }, [src, isOpen, isDirect, entityType, entityId]);

  const computedTitle = modalTitle || (entityType === 'personnel' || entityType === 'teacher' ? 'Personnel ID Photo' : 'Learner ID Photo');

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        showClose={false}
        className='p-0 overflow-hidden rounded-xl border border-border bg-card shadow-2xl w-full max-w-[420px] sm:max-w-[460px] flex flex-col gap-0 animate-in fade-in zoom-in-95 duration-200'
      >
        {/* DepEd Institutional Header Bar */}
        <div className='bg-primary text-primary-foreground px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between border-b border-primary/20 shrink-0 select-none'>
          <div className='flex items-center gap-2'>
            <IdCard className='h-5 w-5 text-primary-foreground opacity-90' />
            <DialogTitle className='text-sm sm:text-base font-extrabold uppercase tracking-wider text-primary-foreground leading-none'>
              {computedTitle}
            </DialogTitle>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='rounded-full p-1 text-primary-foreground/90 hover:text-primary-foreground hover:bg-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-white active:scale-95'
            aria-label='Close ID photo view'
          >
            <X strokeWidth={2.5} className='h-5 w-5' />
            <span className='sr-only'>Close</span>
          </button>
        </div>

        {/* Studio Photo Frame */}
        <div className='p-4 sm:p-6 bg-muted/20 flex items-center justify-center shrink-0'>
          <div className='relative w-full max-w-[320px] sm:max-w-[360px] h-[340px] sm:h-[390px] rounded-lg border-2 border-dashed border-primary/30 bg-muted/40 overflow-hidden flex items-center justify-center shadow-inner group'>
            {!isImageLoaded && (
              <Skeleton className='absolute inset-0 w-full h-full rounded-[inherit]' />
            )}
            <img
              src={activeSrc}
              alt={alt}
              onLoad={() => setLoadedSrc(activeSrc)}
              className={`w-full h-full object-contain select-none transition-all duration-300 ${isImageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            />
          </div>
        </div>

        {/* Structured Identity & Actions Footer */}
        <div className='p-4 sm:p-5 bg-card border-t border-border flex flex-col items-center justify-center text-center space-y-2 shrink-0'>
          {caption && (
            <h4 className='text-base sm:text-lg font-black uppercase text-foreground leading-snug tracking-tight break-words max-w-full'>
              {caption}
            </h4>
          )}
          {subtitle && (
            <span className='inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-extrabold tracking-wider bg-primary/10 text-primary border border-primary/20'>
              {subtitle}
            </span>
          )}
          <div className='pt-2 w-full flex justify-center'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              className='font-bold uppercase text-xs px-6 py-1.5 h-8 border-border hover:bg-muted'
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

