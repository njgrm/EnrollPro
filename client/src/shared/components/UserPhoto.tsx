import React from "react";
import { SecureAvatar } from "./SecureAvatar";
import type { MediaEntityType } from "@/shared/lib/secureMedia";

export interface UserPhotoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  photo: string | null | undefined;
  fallbackIcon?: React.ReactNode;
  containerClassName?: string;
  onEnlarge?: () => void;
  children?: React.ReactNode;
  entityType?: MediaEntityType;
  entityId?: string | number | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  initials?: string | null;
}

/**
 * A consistent, RA 10173 compliant component for displaying student or teacher photos.
 * Uses SecureAvatar under the hood to ensure time-limited pre-signed URL retrieval,
 * circular shimmering skeleton loading, silent retry on 403/expiration,
 * and programmatic initial-based fallback circles.
 */
export function UserPhoto({
  photo,
  fallbackIcon,
  containerClassName,
  className,
  alt = "User photo",
  onEnlarge,
  children,
  entityType = "learner",
  entityId,
  firstName,
  lastName,
  name,
  initials,
  ...props
}: UserPhotoProps) {
  return (
    <SecureAvatar
      photo={photo}
      entityType={entityType}
      entityId={entityId}
      firstName={firstName}
      lastName={lastName}
      name={name || (alt && alt !== "User photo" ? alt : undefined)}
      initials={initials}
      fallbackIcon={fallbackIcon}
      containerClassName={containerClassName}
      className={className}
      alt={alt}
      onEnlarge={onEnlarge}
      {...props}
    >
      {children}
    </SecureAvatar>
  );
}
