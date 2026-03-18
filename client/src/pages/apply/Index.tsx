import { useState } from 'react';
import depedLogo from '@/assets/Deped-logo.png';
import GuestLayout from '@/layouts/GuestLayout';
import PrivacyNotice from './PrivacyNotice';
import AdmissionForm from './AdmissionForm';
import TrackApplication from './Track';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';

const CONSENT_KEY = 'enrollpro_apply_consent';
const TAB_KEY = 'enrollpro_apply_active_tab';
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

export default function Apply() {
  const [hasConsented, setHasConsented] = useState(() => {
    return sessionStorage.getItem(CONSENT_KEY) === 'true';
  });
  const [activeTab, setActiveTab] = useState<'form' | 'monitor'>(() => {
    return (sessionStorage.getItem(TAB_KEY) as 'form' | 'monitor') || 'form';
  });

  const { schoolName, logoUrl, colorScheme, selectedAccentHsl } = useSettingsStore();

  const accentHsl = selectedAccentHsl ?? colorScheme?.accent_hsl;
  const currentHex = colorScheme?.palette?.find(p => p.hsl === accentHsl)?.hex;
  const isFefe01 = currentHex?.toLowerCase() === '#fefe01';

  // Fallback HSL check if hex not found
  const isFefe01Fallback = !currentHex && (() => {
    if (!accentHsl) return false;
    const parts = accentHsl.trim().split(/\s+/);
    const h = parseInt(parts[0]) || 0;
    const s = parseInt(parts[1]?.replace('%', '')) || 0;
    const l = parseInt(parts[2]?.replace('%', '')) || 0;
    return h === 60 && s >= 98 && s <= 100 && l >= 48 && l <= 52;
  })();

  const applyIsFefe01 = isFefe01 || isFefe01Fallback;

  const handleAccept = () => {
    sessionStorage.setItem(CONSENT_KEY, 'true');
    setHasConsented(true);
  };

  const handleReset = () => {
    sessionStorage.removeItem(CONSENT_KEY);
    setHasConsented(false);
  };

  const handleTabChange = (tab: 'form' | 'monitor') => {
    sessionStorage.setItem(TAB_KEY, tab);
    setActiveTab(tab);
  };

  return (
    <GuestLayout>
      <div
        className="relative min-h-screen"
        style={applyIsFefe01 ? {
          '--primary': '200 68% 9%',
          '--primary-foreground': '0 0% 100%',
        } as React.CSSProperties : {}}
      >
        <div
          className="fixed inset-0 -z-10"
          style={{
            background: 'hsl(var(--sidebar-background)/0.5)',
          }}
        >
          {/* Pixel grid */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="pixel-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <rect x="2" y="2" width="36" height="36" rx="2" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
                <rect x="42" y="2" width="36" height="36" rx="2" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
                <rect x="2" y="42" width="36" height="36" rx="2" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
                <rect x="42" y="42" width="36" height="36" rx="2" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pixel-grid)" />
          </svg>
          {/* Radial glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(circle at center, hsl(var(--primary)/0.05) 0%, transparent 70%)' }}
          />
        </div>

        <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-25 grid grid-cols-1 sm:grid-cols-3 items-center gap-3 sm:gap-6">
            {/* 1. School Logo - Hidden on mobile */}
            <div className="hidden sm:flex justify-end overflow-hidden">
              {logoUrl ? (
                <img
                  src={`${API_BASE}${logoUrl}`}
                  alt={`${schoolName} logo`}
                  className="h-14 w-14 sm:h-18 sm:w-30 shrink-0 object-contain"
                />
              ) : (
                <div className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg sm:text-xl font-bold text-foreground">{schoolName.charAt(0)}</span>
                </div>
              )}
            </div>
            
            {/* 2. School Name & Title - Compact but no truncation */}
            <div className="flex flex-col leading-tight text-center justify-center min-w-0">
              <span className="text-base sm:text-lg md:text-xl font-black tracking-tight text-foreground leading-none uppercase break-words">
                {schoolName}
              </span>
              <span className="text-[9px] sm:text-[10px] md:text-xs font-black tracking-[0.1em] sm:tracking-[0.15em] uppercase text-muted-foreground mt-1 break-words">
                Online Admission Portal
              </span>
            </div>

            {/* 3. DepEd Logo - Hidden on mobile */}
            <div className="hidden sm:flex justify-start overflow-hidden">
              <img 
                src={depedLogo} 
                alt="DepEd logo" 
                className="h-14 w-14 sm:h-50 sm:w-50 shrink-0 object-contain" 
              />
            </div>
          </div>
        </header>

        <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-10">
            
            {/* ── Tab Switcher (Placed at the top of the content area) ── */}
            <div className="flex justify-center">
              <div className="flex bg-white/80 p-1.5 rounded-2xl border-3 border-primary/80 w-full sm:w-auto shadow-inner">
                <button 
                  onClick={() => handleTabChange('form')}
                  className={cn(
                    "flex-1 sm:flex-none px-8 py-3 text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] rounded-xl transition-all duration-200",
                    activeTab === 'form' 
                      ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]" 
                      : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                  )}
                >
                  Application Form
                </button>
                <button 
                  onClick={() => handleTabChange('monitor')}
                  className={cn(
                    "flex-1 sm:flex-none px-8 py-3 text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] rounded-xl transition-all duration-200",
                    activeTab === 'monitor' 
                      ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]" 
                      : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                  )}
                >
                  Monitor Portal
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'monitor' ? (
                 <motion.div
                   key="monitor"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.98 }}
                   transition={{ duration: 0.3 }}
                 >
                   <TrackApplication />
                 </motion.div>
              ) : !hasConsented ? (
                <motion.div
                  key="privacy"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                >
                  <PrivacyNotice onAccept={handleAccept} />
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, scale: 1.02, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <AdmissionForm onReset={handleReset} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </GuestLayout>
  );
}
