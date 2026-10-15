import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LogOut,
  AlertTriangle,
  Sun,
  Moon,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/shared/lib/utils";
import { useLearnerAuthStore } from "@/store/learner-auth.slice";
import { useThemeStore } from "@/store/theme.slice";
import axios from "axios";
import { Toaster, sileo } from "sileo";
import { getLearnerApi } from "@/shared/api/axiosInstance";
import { Button } from "@/shared/ui/button";
import { PageLoadingSkeleton } from "@/shared/components/PageLoadingSkeleton";
import { ConfirmationModal } from "@/shared/ui/confirmation-modal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { ProfileHeader } from "@/features/learner/components/ProfileHeader";
import { HistoricalAcademicRecords } from "@/features/learner/components/HistoricalAcademicRecords";
import { OfficialLearnerProfile } from "@/features/learner/components/OfficialLearnerProfile";
import type { LearnerDashboardResponse } from "@/features/learner/types";

export default function LearnerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tab } = useParams<{ tab?: string }>();
  const { user, token, clearAuth } = useLearnerAuthStore();
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Active tab synchronized with URL param
  const activeTab = tab === "sf1" ? "sf1" : "sf9";

  const handleTabChange = (newTab: string) => {
    navigate(`/learner/profile/${newTab}`);
  };

  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["learner", "dashboard-unified", user?.lrn],
    queryFn: async () => {
      const api = getLearnerApi(token!);
      const res = await api.get<LearnerDashboardResponse>("/learner/dashboard-unified");
      return res.data;
    },
    enabled: Boolean(token && user),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const error = queryError
    ? axios.isAxiosError(queryError) && queryError.response?.status === 401
      ? null
      : "Failed to load dashboard data. Please try again later."
    : null;

  useEffect(() => {
    if (queryError && axios.isAxiosError(queryError) && queryError.response?.status === 401) {
      clearAuth();
      navigate("/learner/login", { replace: true });
    }
  }, [queryError, clearAuth, navigate]);

  // Handle welcome toast upon initial login redirect
  const welcomeToastTriggered = useRef(false);

  useEffect(() => {
    if (welcomeToastTriggered.current) return;

    let toastData: { title: string; description: string } | null = null;

    const navToast = (
      location.state as { welcomeToast?: { title: string; description: string } }
    )?.welcomeToast;

    if (navToast?.title) {
      toastData = navToast;
      window.history.replaceState({ ...window.history.state, usr: null }, "");
    } else {
      const pending = sessionStorage.getItem("pendingWelcomeToast");
      if (pending) {
        sessionStorage.removeItem("pendingWelcomeToast");
        try {
          toastData = JSON.parse(pending) as { title: string; description: string };
        } catch {
          // ignore json parse error
        }
      }
    }

    if (!toastData) return;

    welcomeToastTriggered.current = true;
    sessionStorage.removeItem("pendingWelcomeToast");

    window.setTimeout(() => {
      sileo.success({
        title: toastData.title,
        description: toastData.description,
      });
    }, 350);
  }, [location.state]);

  if (!user || !token) {
    return <Navigate to="/learner/login" replace />;
  }

  const handleLogout = () => {
    clearAuth();
    sessionStorage.clear();
    Object.keys(localStorage).forEach((key) => {
      if (
        key.includes("filter") ||
        key.includes("pagination") ||
        key.includes("search") ||
        key.includes("table") ||
        key.includes("limit")
      ) {
        localStorage.removeItem(key);
      }
    });
    navigate("/learner/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20">
      <Toaster position="top-right" theme="light" />

      {/* Decorative pixel grid background */}
      <div className="fixed inset-0 pointer-events-none z-0 print:hidden overflow-hidden" aria-hidden="true">
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.09] dark:opacity-[0.05]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="learner-dashboard-pixel-grid"
              x="0"
              y="0"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              <rect
                x="2"
                y="2"
                width="36"
                height="36"
                rx="2"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
              />
              <rect
                x="42"
                y="2"
                width="36"
                height="36"
                rx="2"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
              />
              <rect
                x="2"
                y="42"
                width="36"
                height="36"
                rx="2"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
              />
              <rect
                x="42"
                y="42"
                width="36"
                height="36"
                rx="2"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#learner-dashboard-pixel-grid)" />
        </svg>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 10%, hsl(var(--primary)/0.06) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Portal Top Header Bar */}
      <header className="sticky top-0 z-40 w-full bg-muted/80 backdrop-blur-md border-b border-border shadow-xs print:hidden">
        <div className="w-full max-w-5xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {data?.schoolLogoUrl ? (
              <img
                src={data.schoolLogoUrl}
                alt="School Seal"
                className="h-8 w-8 object-contain shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary-foreground uppercase">
                  {(data?.schoolAcronym || user?.schoolAcronym)?.slice(0, 2) || "EP"}
                </span>
              </div>
            )}
            <span className="font-bold text-base sm:text-lg text-foreground tracking-tight leading-tight truncate">
              {data?.schoolAcronym || user?.schoolAcronym
                ? `${data?.schoolAcronym || user?.schoolAcronym} `
                : ""}
              Learner Information System
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 text-foreground hover:bg-muted transition-colors relative"
              aria-label="Toggle theme lighting mode"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-primary" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-slate-200" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowLogoutConfirm(true)}
              className="h-9 w-9 text-primary hover:text-primary hover:bg-primary/10 transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Single-Column Stacked Responsive Container */}
      <div className="relative z-10 w-full min-h-[calc(100vh-56px)] bg-transparent">
        {error && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3 shadow-xs">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <p className="text-sm font-semibold text-destructive">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <PageLoadingSkeleton variant="learnerProfile" className="w-full" />
          </div>
        ) : error ? (
          <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
            <div className="bg-card border border-border p-8 rounded-xl max-w-md text-center shadow-xs space-y-4">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
              <h2 className="text-lg font-bold text-foreground">Portal Connection Error</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{error}</p>
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="font-bold w-full"
              >
                Refresh Portal
              </Button>
            </div>
          </div>
        ) : data && (
          <main className="w-full max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6 pb-16">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Learner Profile
              </h1>
              <p className="text-xs sm:text-sm">
                Official student record, academic progress reports, and enrollment verification.
              </p>
            </div>

            {/* 1. Mobile-First Compact Learner Header with Sidepanel Integration */}
            <ProfileHeader data={data} />

            {/* 2. Full-Page Routing with Standard Design System Navigation Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full space-y-6"
            >
              <TabsList className="w-full flex flex-col sm:flex-row h-auto gap-1 mb-4 p-1 bg-muted border border-border rounded-xl relative shadow-sm">
                <TabsTrigger
                  value="sf9"
                  className="w-full sm:flex-1 min-w-25 font-bold transition-all relative z-10 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-lg py-2"
                >
                  {activeTab === "sf9" && (
                    <motion.div
                      layoutId="learner-profile-active-pill"
                      className="absolute inset-0 bg-primary shadow-sm rounded-lg"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <span
                    className={cn(
                      "relative z-20 uppercase text-sm sm:text-base",
                      activeTab === "sf9" ? "text-primary-foreground" : "text-foreground",
                    )}
                  >
                    Historical Academic Records (SF9)
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="sf1"
                  className="w-full sm:flex-1 min-w-25 font-bold transition-all relative z-10 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-lg py-2"
                >
                  {activeTab === "sf1" && (
                    <motion.div
                      layoutId="learner-profile-active-pill"
                      className="absolute inset-0 bg-primary shadow-sm rounded-lg"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <span
                    className={cn(
                      "relative z-20 uppercase text-sm sm:text-base",
                      activeTab === "sf1" ? "text-primary-foreground" : "text-foreground",
                    )}
                  >
                    Official Learner Profile (SF1)
                  </span>
                </TabsTrigger>
              </TabsList>

              {/* 3. Refactored SF9 View */}
              <TabsContent value="sf9" className="mt-0 focus-visible:outline-none ring-0">
                <HistoricalAcademicRecords
                  academicHistory={data.academicHistory}
                  activeSchoolYear={data.activeSchoolYear}
                />
              </TabsContent>

              {/* 4. Refactored SF1 View */}
              <TabsContent value="sf1" className="mt-0 focus-visible:outline-none ring-0">
                <OfficialLearnerProfile data={data} />
              </TabsContent>
            </Tabs>
          </main>
        )}
      </div>

      <ConfirmationModal
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Sign Out"
        description="Are you sure you want to sign out of the learner information system?"
        confirmText="Sign Out"
        onConfirm={handleLogout}
        variant="primary"
        icon={LogOut}
      />
    </div>
  );
}
