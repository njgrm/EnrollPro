import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useLocation, Link } from 'react-router';
import { Toaster } from 'sileo';
import {
  LayoutDashboard,
  FileText,
  Users,
  Grid3X3,
  Settings,
  ScrollText,
  LogOut,
  BookOpen,
  ChevronsUpDown,
  Calendar,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import api from '@/api/axiosInstance';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

interface AcademicYearItem {
  id: number;
  yearLabel: string;
  status: string;
  isActive: boolean;
}

// ...existing code...

// ...existing code...

function AYSwitcher() {
  const { activeAcademicYearId, viewingAcademicYearId, setViewingAY } = useSettingsStore();
  const [years, setYears] = useState<AcademicYearItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get('/academic-years').then((r) => setYears(r.data.years)).catch(() => {});
  }, []);

  const currentId = viewingAcademicYearId ?? activeAcademicYearId;
  const currentLabel = years.find((y) => y.id === currentId)?.yearLabel ?? 'No School Year Set';
  const isOverride = viewingAcademicYearId && viewingAcademicYearId !== activeAcademicYearId;

  if (years.length === 0) return null;

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs font-medium"
        onClick={() => setOpen(!open)}
      >
        <Calendar className="size-3.5" />
        <span className={isOverride ? 'text-[hsl(var(--destructive))]' : ''}>{currentLabel}</span>
        <ChevronsUpDown className="size-3 opacity-50" />
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-45 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--popover))] p-1 shadow-md">
          {years.map((y) => (
            <button
              key={y.id}
              onClick={() => {
                setViewingAY(y.id === activeAcademicYearId ? null : y.id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--accent-foreground))] ${
                y.id === currentId ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]' : ''
              }`}
            >
              <span className="flex-1 text-left">{y.yearLabel}</span>
              <span className={`rounded px-1 py-0.5 text-[10px] font-medium ${
                y.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                y.status === 'UPCOMING' ? 'bg-blue-100 text-blue-700' :
                y.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {y.status}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const registrarNavItems = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Applications', href: '/applications', icon: FileText },
  { title: 'Students', href: '/students', icon: Users },
  { title: 'Sections', href: '/sections', icon: Grid3X3 },
  { title: 'Audit Logs', href: '/audit-logs', icon: ScrollText },
  { title: 'Settings', href: '/settings', icon: Settings },
];

const teacherNavItems = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'My Sections', href: '/my-sections', icon: BookOpen },
];

import { ConfirmationModal } from '@/components/ui/confirmation-modal';

function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const { schoolName, logoUrl } = useSettingsStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navItems = user?.role === 'TEACHER' ? teacherNavItems : registrarNavItems;

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <>
      <Sidebar collapsible="icon">
        {/* ── Header: School Identity ── */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="data-[state=open]:bg-[hsl(var(--sidebar-accent))]" tooltip={schoolName}>
                {logoUrl ? (
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                    <img
                      src={`${API_BASE}${logoUrl}`}
                      alt="Logo"
                      className="size-8 object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
                    <span className="text-xs font-bold">E</span>
                  </div>
                )}
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{schoolName}</span>
                  <span className="truncate text-xs text-[hsl(var(--muted-foreground))]">Enrollment System</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarSeparator />

        {/* ── Navigation ── */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel></SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <Link to={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* ── Footer: User ── */}
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                tooltip={user?.name ?? 'User'}
                onClick={() => setShowLogoutConfirm(true)}
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]">
                  <span className="text-xs font-semibold">
                    {user?.name?.charAt(0).toUpperCase() ?? 'U'}
                  </span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user?.name}</span>
                  <span className="truncate text-xs text-[hsl(var(--muted-foreground))]">{user?.email}</span>
                </div>
                <LogOut className="ml-auto size-4 text-[hsl(var(--muted-foreground))]" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <ConfirmationModal
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Sign Out"
        description="Are you sure you want to sign out of your account?"
        confirmText="Sign Out"
        onConfirm={handleLogout}
      />
    </>
  );
}

import { motion, AnimatePresence } from 'motion/react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { selectedAccentHsl, colorScheme, accentForeground } = useSettingsStore();
  const accentHsl = selectedAccentHsl ?? (colorScheme as { accent_hsl?: string } | null)?.accent_hsl;
  const location = useLocation();

  // Compute toast theme based on accent foreground
  // fg === '0 0% 100%' (white) means background is dark -> Sileo theme="light" (white text on dark bg)
  // fg === '0 0% 0%' (black) means background is light -> Sileo theme="dark" (black text on light bg)
  const toastTheme = accentForeground === '0 0% 100%' ? 'light' : 'dark';

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Toaster
          position="top-right"
          theme={toastTheme}
          options={accentHsl ? { fill: `hsl(${accentHsl})` } : undefined}
        />

        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4!" />
          <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">EnrollPro</span>
          <div className="ml-auto">
            <AYSwitcher />
          </div>
        </header>

        {/* Page content */}
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-auto p-4 md:p-6"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </SidebarInset>
    </SidebarProvider>
  );
}
