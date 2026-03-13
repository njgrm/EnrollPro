import { Toaster } from 'sileo';
import type { ReactNode } from 'react';

export default function GuestLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[hsl(var(--muted))]/40 font-sans">
      <Toaster position="top-right" />
      {children}
    </div>
  );
}
