import { Toaster } from 'sileo';
import type { ReactNode } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { selectedAccentHsl, colorScheme, accentForeground } = useSettingsStore();
  const accentHsl = selectedAccentHsl ?? (colorScheme as { accent_hsl?: string } | null)?.accent_hsl;
  const toastTheme = accentForeground === '0 0% 100%' ? 'light' : 'dark';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--muted))]/40 font-sans px-4">
      <Toaster
        position="top-right"
        theme={toastTheme}
        options={accentHsl ? { fill: `hsl(${accentHsl})` } : undefined}
      />
      {children}
    </div>
  );
}
