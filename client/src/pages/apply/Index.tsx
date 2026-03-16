import { useState } from 'react';
import GuestLayout from '@/layouts/GuestLayout';
import PrivacyNotice from './PrivacyNotice';
import AdmissionForm from './AdmissionForm';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';

const CONSENT_KEY = 'hnhs_apply_consent';
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

export default function Apply() {
  const [hasConsented, setHasConsented] = useState(() => {
    return sessionStorage.getItem(CONSENT_KEY) === 'true';
  });
  const { schoolName, logoUrl, accentForeground } = useSettingsStore();
  const strokeColor = accentForeground === '0 0% 0%' ? '000000' : 'ffffff';

  const handleAccept = () => {
    sessionStorage.setItem(CONSENT_KEY, 'true');
    setHasConsented(true);
  };

  return (
    <GuestLayout>
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: 'hsl(var(--accent))',
        }}
      >
        {/* Pixel grid */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect x='2' y='2' width='36' height='36' rx='2' fill='none' stroke='%23${strokeColor}' stroke-width='1.5'/%3E%3Crect x='42' y='2' width='36' height='36' rx='2' fill='none' stroke='%23${strokeColor}' stroke-width='1.5'/%3E%3Crect x='2' y='42' width='36' height='36' rx='2' fill='none' stroke='%23${strokeColor}' stroke-width='1.5'/%3E%3Crect x='42' y='42' width='36' height='36' rx='2' fill='none' stroke='%23${strokeColor}' stroke-width='1.5'/%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px',
          }}
        />
        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at center, hsl(var(--accent-foreground) / 0.1) 0%, transparent 70%)' }}
        />
      </div>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-[hsl(var(--card))] shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-24 flex items-center justify-center gap-4">
          {logoUrl ? (
            <img
              src={`${API_BASE}${logoUrl}`}
              alt={`${schoolName} logo`}
              className="h-14 w-14 shrink-0 object-contain"
            />
          ) : (
            <div className="h-14 w-14 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-base font-bold text-[hsl(var(--foreground))]">{schoolName.charAt(0)}</span>
            </div>
          )}
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight text-[hsl(var(--foreground))]">{schoolName}</span>
            <span className="text-xs font-medium tracking-wide uppercase text-[hsl(var(--muted-foreground))]">Online Admission Portal</span>
          </div>
        </div>
      </header>
      <div className={cn("min-h-screen", hasConsented ? "py-12 px-4 sm:px-6 lg:px-8" : "")}>
        <AnimatePresence mode="wait">
          {!hasConsented ? (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <PrivacyNotice onAccept={handleAccept} />
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <AdmissionForm />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GuestLayout>
  );
}
