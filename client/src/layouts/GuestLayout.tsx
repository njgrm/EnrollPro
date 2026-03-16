import { Toaster } from 'sileo';
import type { ReactNode } from 'react';

export default function GuestLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen font-sans">
      <Toaster position="top-right" />
      {children}
    </div>
  );
}
