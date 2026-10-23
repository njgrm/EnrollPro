import React, { useEffect, useState, useCallback, useMemo } from "react";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  getSignedMediaUrl,
  invalidateMediaUrl,
  computeInitials,
  type MediaEntityType,
} from "@/shared/lib/secureMedia";

export interface SecureAvatarProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  entityType?: MediaEntityType;
  entityId?: string | number | null;
  photo?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  initials?: string | null;
  fallbackIcon?: React.ReactNode;
  containerClassName?: string;
  onEnlarge?: () => void;
}

/**
 * RA 10173 compliant SecureAvatar component.
 * Automatically fetches time-limited pre-signed URLs, displays shimmering
 * skeleton loaders while pending, handles silent retries on expiration, and
 * falls back to programmatic initial circles.
 */
export function SecureAvatar({
  entityType = "learner",
  entityId,
  photo,
  firstName,
  lastName,
  name,
  initials: explicitInitials,
  fallbackIcon,
  containerClassName,
  className,
  alt = "User avatar",
  onEnlarge,
  children,
  ...props
}: SecureAvatarProps) {
  const cleanPhoto = photo ? photo.trim() : null;
  const effectiveId = entityId || (cleanPhoto ? cleanPhoto.replace(/^\/uploads\//, "") : null);
  const hasPhoto = Boolean(cleanPhoto || effectiveId);

  const [signedSrc, setSignedSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(hasPhoto);
  const [hasError, setHasError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  const fallbackInitials = useMemo(() => {
    return computeInitials(firstName, lastName, name, explicitInitials);
  }, [firstName, lastName, name, explicitInitials]);

  const fetchUrl = useCallback(
    async (isRetry = false) => {
      // Direct local data, blob, or external web URLs (e.g. seeded mock portraits or remote CDN)
      if (
        cleanPhoto &&
        (cleanPhoto.startsWith("data:") ||
          cleanPhoto.startsWith("blob:") ||
          cleanPhoto.startsWith("http://") ||
          cleanPhoto.startsWith("https://"))
      ) {
        setSignedSrc(cleanPhoto);
        setIsLoading(false);
        setHasError(false);
        return;
      }

      if (!effectiveId && !cleanPhoto) {
        setIsLoading(false);
        setSignedSrc(null);
        return;
      }

      if (isRetry && effectiveId) {
        invalidateMediaUrl(entityType, effectiveId);
      }

      try {
        setIsLoading(true);
        const resolvedId = effectiveId || "temp";
        const url = await getSignedMediaUrl(entityType, resolvedId, cleanPhoto);

        if (url) {
          setSignedSrc(url);
          setHasError(false);
        } else {
          setSignedSrc(null);
          setHasError(true);
        }
      } catch {
        setSignedSrc(null);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [entityType, effectiveId, cleanPhoto]
  );

  useEffect(() => {
    setHasError(false);
    setRetryCount(0);
    void fetchUrl(false);
  }, [fetchUrl]);

  const handleImageError = () => {
    // Attempt one silent retry on error (e.g. 403 due to URL expiration during long session)
    if (
      retryCount === 0 &&
      effectiveId &&
      signedSrc &&
      !signedSrc.startsWith("http://") &&
      !signedSrc.startsWith("https://") &&
      !signedSrc.startsWith("data:") &&
      !signedSrc.startsWith("blob:")
    ) {
      setRetryCount(1);
      void fetchUrl(true);
    } else {
      setHasError(true);
    }
  };

  const showProgrammaticFallback = hasError || (!isLoading && !signedSrc);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted flex items-center justify-center shrink-0 select-none",
        onEnlarge && signedSrc && !hasError && "cursor-zoom-in hover:opacity-90 transition-opacity",
        containerClassName
      )}
      onClick={onEnlarge && signedSrc && !hasError ? onEnlarge : undefined}
    >
      {isLoading ? (
        // Circular shimmering UI skeleton loader matching avatar dimensions
        <Skeleton className="w-full h-full rounded-[inherit]" />
      ) : showProgrammaticFallback ? (
        // Programmatic initial-based fallback circle (e.g. "CR" for Camille Reyes)
        fallbackIcon || (
          <div className="w-full h-full rounded-[inherit] flex items-center justify-center font-bold text-white bg-primary text-xs sm:text-sm">
            {fallbackInitials}
          </div>
        )
      ) : (
        <img
          src={signedSrc ?? undefined}
          alt={alt}
          loading={props.loading ?? "lazy"}
          decoding="async"
          className={cn("w-full h-full object-cover rounded-[inherit]", className)}
          onError={handleImageError}
          {...props}
        />
      )}
      {children}
    </div>
  );
}
