import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { isAxiosError } from "axios";
import { sileo } from "sileo";
import {
  AlertCircle,
  Award,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  HelpCircle,
  Loader2,
  Lock,
  LogIn,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";

import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Checkbox } from "@/shared/ui/checkbox";
import { Skeleton } from "@/shared/ui/skeleton";
import { Button } from "@/shared/ui/button";
import api from "@/shared/api/axiosInstance";
import { toastApiError } from "@/shared/hooks/useApiToast";
import { useLearnerAuthStore } from "@/store/learner-auth.slice";
import { cn } from "@/shared/lib/utils";

import educationSvg from "@/assets/Department_of_Education.svg";
import bagongPilipinasLogo from "@/assets/bagong-pilipinas.png";

interface PublicConfig {
  schoolName: string;
  schoolAcronym: string;
  logoUrl: string | null;
  depedSchoolId: string | null;
  region: string | null;
  division: string | null;
  globalDefaultPassword: string | null;
  activeSchoolYear?: string | null;
  systemPhase?: string | null;
}

interface LearnerResponse {
  id: number;
  lrn: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
}

interface AuthResponse {
  token: string;
  requiresPasswordReset: boolean;
  schoolName: string;
  schoolAcronym: string;
  gradeLevelName: string | null;
  sectionName: string | null;
  learner: LearnerResponse;
}

const DEFAULT_CONFIG: PublicConfig = {
  schoolName: "Enriqueta Montilla de Esteban Memorial High School",
  schoolAcronym: "EMEMHS",
  logoUrl: null,
  depedSchoolId: "302685",
  region: "Region VI – Western Visayas",
  division: "Schools Division of Negros Occidental",
  globalDefaultPassword: "DepEd2026!",
  activeSchoolYear: "2026-2027",
  systemPhase: "OFFICIAL_ENROLLMENT",
};

function formatPhaseLabel(phase?: string | null): string {
  if (!phase) return "Official Enrollment Active";
  switch (phase) {
    case "OFFICIAL_ENROLLMENT":
      return "Official Enrollment Active";
    case "CLASSES_ONGOING":
      return "Classes Ongoing";
    case "EOSY_CLOSING":
      return "EOSY Closing";
    default:
      return phase.replace(/_/g, " ");
  }
}

export default function LearnerLogin() {
  const navigate = useNavigate();
  const {
    user,
    requiresPasswordReset,
    sessionExpired,
    setAuth,
    setRequiresPasswordReset,
    setSessionExpired,
  } = useLearnerAuthStore();

  const [publicConfig, setPublicConfig] = useState<PublicConfig>(DEFAULT_CONFIG);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [lrn, setLrn] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const redirectTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const savedLrn = localStorage.getItem("rememberedLearnerLrn");
    if (savedLrn) {
      setLrn(savedLrn);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.get<PublicConfig>("/system/public-config", { timeout: 10000 })
      .then((res) => {
        if (!cancelled) {
          setPublicConfig(res.data);
          setConfigLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setConfigLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const apiBase = import.meta.env.VITE_API_URL?.replace("/api", "") || "";

  const fullLogoUrl = useMemo(() => {
    if (!publicConfig.logoUrl) return null;
    if (
      publicConfig.logoUrl.startsWith("http://") ||
      publicConfig.logoUrl.startsWith("https://")
    ) {
      return publicConfig.logoUrl;
    }
    return `${apiBase}${publicConfig.logoUrl}`;
  }, [apiBase, publicConfig.logoUrl]);

  useEffect(() => {
    setLogoLoadFailed(false);
  }, [publicConfig.logoUrl]);

  const handleLrnChange = useCallback((value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    const truncated = digitsOnly.slice(0, 12);
    setLrn(truncated);
    setError(null);
  }, []);

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
    setError(null);
  }, []);

  useEffect(() => {
    if (!sessionExpired) return;
    setSessionExpired(false);
    const timeout = window.setTimeout(() => {
      sileo.warning({
        title: "Session Expired",
        description: "Your session has expired. Please sign in again to continue.",
      });
    }, 120);
    return () => window.clearTimeout(timeout);
  }, [sessionExpired, setSessionExpired]);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const completeLogin = useCallback(
    (payload: AuthResponse) => {
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }

      setAuth(
        {
          id: payload.learner.id,
          lrn: payload.learner.lrn,
          firstName: payload.learner.firstName,
          lastName: payload.learner.lastName,
          middleName: payload.learner.middleName,
          schoolName: payload.schoolName,
          schoolAcronym: payload.schoolAcronym,
          gradeLevelName: payload.gradeLevelName,
          sectionName: payload.sectionName,
        },
        payload.token,
      );

      if (rememberMe) {
        localStorage.setItem("rememberedLearnerLrn", payload.learner.lrn);
      } else {
        localStorage.removeItem("rememberedLearnerLrn");
      }

      setError(null);
      setSuccess("Login successful! Redirecting to learner dashboard...");

      sileo.success({
        title: "Welcome",
        description: `Signed in as ${payload.learner.firstName} ${payload.learner.lastName}`,
      });

      if (payload.requiresPasswordReset) {
        setRequiresPasswordReset(true);
        setSuccess("First-time login detected. Setting up your new password...");
        redirectTimeoutRef.current = window.setTimeout(() => {
          navigate("/learner/change-password", { state: { isForcedReset: true }, replace: true });
        }, 800);
        return;
      }

      redirectTimeoutRef.current = window.setTimeout(() => {
        navigate("/learner/portal", { replace: true });
      }, 800);
    },
    [navigate, setAuth, rememberMe, setRequiresPasswordReset],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (lrn.length !== 12) {
      setError("Invalid LRN: Must be exactly 12 digits.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post<AuthResponse>("/learner/auth", {
        lrn,
        password,
      });
      completeLogin(response.data);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError("Invalid LRN or password. Please verify your credentials.");
        } else {
          toastApiError(err);
        }
      } else {
        toastApiError(err as never);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (user && !success) {
    if (requiresPasswordReset) {
      return <Navigate to="/learner/change-password" state={{ isForcedReset: true }} replace />;
    }
    return <Navigate to="/learner/portal" replace />;
  }

  if (!configLoaded) {
    return (
      <div className="h-screen w-full flex flex-col lg:flex-row bg-background overflow-hidden">
        <div className="hidden lg:flex lg:w-1/2 xl:w-[48%] h-full p-6 xl:p-10 bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground flex-col justify-between">
          <div className="space-y-4">
            <Skeleton className="h-16 w-48 bg-white/10" />
            <Skeleton className="h-6 w-72 bg-white/10" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-64 bg-white/10" />
            <Skeleton className="h-12 w-full max-w-md bg-white/10" />
          </div>
          <Skeleton className="h-5 w-64 bg-white/10" />
        </div>
        <div className="w-full lg:w-1/2 xl:w-[52%] h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <Card className="w-full max-w-md rounded-2xl shadow-xl border p-6 space-y-6">
            <div className="flex flex-col items-center space-y-3">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="space-y-4 pt-2">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-background selection:bg-primary/20 overflow-hidden">
      {/* 1. Left Pane: Brand Hero Section (Desktop) */}
      <section className="hidden lg:flex lg:w-1/2 xl:w-[48%] h-full flex-col justify-between p-6 xl:p-10 2xl:p-12 relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground select-none">
        {/* Subtle Institutional Overlay & Ambient Lighting */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.4) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.3) 2%, transparent 0%)`,
            backgroundSize: "100px 100px",
          }}
        />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Institutional Badging */}
        <div className="relative z-10 space-y-4 xl:space-y-5">
          <div className="flex items-center gap-3">
            <img
              src={educationSvg}
              alt="Department of Education"
              className="h-12 w-12 xl:h-14 xl:w-14 object-contain filter drop-shadow-md bg-white/10 rounded-full p-1 border border-white/20"
            />
            {fullLogoUrl ? (
              <img
                src={fullLogoUrl}
                alt={publicConfig.schoolName}
                className="h-12 w-12 xl:h-14 xl:w-14 object-contain filter drop-shadow-md bg-white/10 rounded-full p-1 border border-white/20"
              />
            ) : (
              <div className="h-12 w-12 xl:h-14 xl:w-14 rounded-full bg-white/15 border border-white/20 flex items-center justify-center font-extrabold text-base xl:text-lg text-white">
                {publicConfig.schoolAcronym}
              </div>
            )}
            <img
              src={bagongPilipinasLogo}
              alt="Bagong Pilipinas"
              className="h-12 w-12 xl:h-14 xl:w-14 object-contain filter drop-shadow-md bg-white/10 rounded-full p-1 border border-white/20"
            />
          </div>

          <div className="space-y-0.5 border-l-2 border-white/30 pl-3.5">
            <p className="text-xs xl:text-sm uppercase tracking-widest text-white font-bold">
              Republic of the Philippines
            </p>
            <p className="text-xs xl:text-sm uppercase tracking-wider text-white font-bold">
              Department of Education
            </p>
            <p className="text-xs xl:text-sm uppercase tracking-wide text-white font-bold">
              {publicConfig.region || "Region VI – Western Visayas"}
            </p>
            <p className="text-xs xl:text-sm uppercase tracking-wide text-white font-bold">
              {publicConfig.division || "Schools Division of Negros Occidental"}
            </p>
            <h2 className="font-extrabold text-white uppercase tracking-tight pt-1 text-2xl">
              {publicConfig.schoolName || "Enriqueta Montilla de Esteban Memorial High School"}
            </h2>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-bold bg-white/15 text-white border border-white/25">
                DepEd School ID: {publicConfig.depedSchoolId || "302685"}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Welcome Messaging & Academic Badging */}
        <div className="relative z-10 py-3 xl:py-6 space-y-4 xl:space-y-5">
          <div className="space-y-2">
            <h1 className="text-2xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Welcome to the Learner Portal
            </h1>
            <p className="text-white text-xs xl:text-sm leading-relaxed max-w-lg">
              Securely access your official school records, track your quarterly grades, and view your class assignments in one centralized platform.
            </p>
          </div>

          {/* Key Highlights */}
          <div className="grid grid-cols-1 gap-2 pt-1 max-w-lg">
            <div className="flex items-center gap-3 p-2.5 xl:p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-white font-bold">
              <Award className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Official DepEd Form 9 (SF9) Grades</span>
            </div>
            <div className="flex items-center gap-3 p-2.5 xl:p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-white font-bold">
              <FileText className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Official Enrollment Status & Academic History</span>
            </div>
            <div className="flex items-center gap-3 p-2.5 xl:p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-white font-bold">
              <Users className="w-4 h-4 text-blue-300 shrink-0" />
              <span>Class Section & Adviser Information</span>
            </div>
          </div>
        </div>

        {/* Bottom: Institutional Motto */}
        <div className="relative z-10 pt-3 border-t border-white/15 flex items-center justify-end text-white font-bold text-xs xl:text-sm">
          <span>Region VI</span>
        </div>
      </section>

      {/* 2. Right Pane: Form Container (Desktop & Mobile) */}
      <main className="w-full lg:w-1/2 xl:w-[52%] h-full flex flex-col justify-between items-center px-4 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-4 overflow-y-auto lg:overflow-hidden bg-slate-50 dark:bg-zinc-950 relative">
        {/* Pixel Grid Background Pattern */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.08] dark:opacity-[0.04]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="learner-login-pixel-grid"
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
            <rect width="100%" height="100%" fill="url(#learner-login-pixel-grid)" />
          </svg>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at center, hsl(var(--primary)/0.05) 0%, transparent 70%)",
            }}
          />
        </div>

        <div className="w-full max-w-md mx-auto my-auto relative z-10 py-1">
          {/* Mobile-Only Institutional Header */}
          <div className="lg:hidden flex flex-col items-center text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <img
                src={educationSvg}
                alt="DepEd"
                className="h-10 w-10 object-contain"
              />
              {fullLogoUrl ? (
                <img
                  src={fullLogoUrl}
                  alt={publicConfig.schoolName}
                  className="h-12 w-12 object-contain rounded-full border border-border p-0.5 bg-card"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm text-primary">
                  {publicConfig.schoolAcronym}
                </div>
              )}
              <img
                src={bagongPilipinasLogo}
                alt="Bagong Pilipinas"
                className="h-10 w-10 object-contain"
              />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Department of Education • Region VI
            </p>
            <h2 className="text-sm font-extrabold uppercase text-foreground px-4 mt-0.5">
              {publicConfig.schoolName}
            </h2>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold border border-primary/20">
              <span>School Year {publicConfig.activeSchoolYear || "2026–2027"}</span>
              <span>•</span>
              <span>{formatPhaseLabel(publicConfig.systemPhase)}</span>
            </div>
          </div>

          {/* Elevated Centered Form Card */}
          <Card className="bg-card text-card-foreground shadow-xl sm:shadow-2xl rounded-2xl border border-border/70 overflow-hidden">
            <CardContent className="p-5 sm:p-6 space-y-4 sm:space-y-4.5">
              {/* Form Title & Subtitle */}
              <div className="text-center space-y-2">
                {/* School Emblem Badge (School Logo Only) */}
                <div className="flex justify-center pb-0.5">
                  {!configLoaded ? (
                    <Skeleton className="h-14 w-14 sm:h-16 sm:w-16 rounded-full" />
                  ) : fullLogoUrl && !logoLoadFailed ? (
                    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-background border border-border/80 shadow-md flex items-center justify-center p-1.5 ring-4 ring-primary/5 transition-transform hover:scale-105 duration-200">
                      <img
                        src={fullLogoUrl}
                        alt={publicConfig.schoolName}
                        className="h-full w-full object-contain select-none"
                        onError={() => setLogoLoadFailed(true)}
                      />
                    </div>
                  ) : (
                    <div
                      className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-xs flex items-center justify-center font-bold text-sm sm:text-base select-none"
                      title={publicConfig.schoolName}
                    >
                      {publicConfig.schoolAcronym || "EMEMHS"}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                    Learner Portal
                  </h1>
                  <p className="text-sm sm:text-sm text-foreground">
                    Sign in with your 12-digit Learner Reference Number
                  </p>
                </div>
              </div>

              {/* Status Notifications */}
              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-2.5 animate-in fade-in zoom-in-95 duration-200">
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm sm:text-sm font-semibold text-destructive leading-tight">
                    {error}
                  </p>
                </div>
              )}

              {success && (
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-2.5 animate-in fade-in zoom-in-95 duration-200">
                  <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm sm:text-sm font-semibold text-primary leading-tight">
                    {success}
                  </p>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
                {/* A. LRN Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="lrn"
                      className="text-sm sm:text-sm font-bold text-foreground flex items-center gap-1"
                    >
                      Learner Reference Number (LRN) <span className="text-destructive">*</span>
                    </Label>
                    <span
                      className={cn(
                        "text-sm font-bold tabular-nums transition-colors",
                        lrn.length === 12
                          ? "text-emerald-600 dark:text-emerald-400 font-bold"
                          : "text-muted-foreground",
                      )}
                    >
                      {lrn.length} / 12 digits
                    </span>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none z-10">
                      <GraduationCap className="w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    </div>
                    <Input
                      id="lrn"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="12-digit LRN (e.g. 109876543210)"
                      value={lrn}
                      onChange={(e) => handleLrnChange(e.target.value)}
                      className="pl-10 h-10 sm:h-11 bg-background border-border hover:border-border/80 focus-visible:ring-2 focus-visible:ring-primary rounded-xl transition-all placeholder:text-muted-foreground/70 text-foreground font-bold"
                      autoComplete="username"
                      maxLength={12}
                      required
                    />
                  </div>
                </div>

                {/* B. Password / Portal PIN Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-sm sm:text-sm font-bold text-foreground flex items-center gap-1"
                    >
                      Password <span className="text-destructive">*</span>
                    </Label>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none z-10">
                      <Lock className="w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password or PIN"
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      className="pl-10 pr-10 h-10 sm:h-11 bg-background border-border hover:border-border/80 focus-visible:ring-2 focus-visible:ring-primary rounded-xl transition-all placeholder:text-muted-foreground/70 text-foreground font-bold"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* C. Session Options & Security (Remember Me) */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="rememberMe"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                      className="rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label
                      htmlFor="rememberMe"
                      className="text-sm sm:text-sm font-bold text-foreground cursor-pointer select-none"
                    >
                      Remember my LRN on this device
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground leading-normal ml-6 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    Do not check this on shared devices, internet cafes, or computer laboratories.
                  </p>
                </div>

                {/* D. Primary Call-to-Action (Sign In Button) */}
                <div className="pt-1.5 sm:pt-2">
                  <Button
                    type="submit"
                    disabled={isLoading || lrn.length !== 12 || !password.trim()}
                    className="w-full h-10 sm:h-11 font-bold text-sm sm:text-base rounded-xl transition-all duration-200 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Authenticating learner...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <LogIn className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {/* 3. Support & Account Recovery Banner */}
              <div className="rounded-xl border border-blue-200/80 bg-blue-50/80 p-3 sm:p-3.5 dark:border-blue-900/50 dark:bg-blue-950/30 flex items-start gap-2.5 text-sm text-blue-950 dark:text-blue-200 leading-relaxed shadow-xs">
                <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-1" />
                <div className="space-y-0.5">
                  <p className="font-bold text-blue-950 dark:text-blue-100">
                    Need help accessing your account?
                  </p>
                  <p className="text-blue-900/90 dark:text-blue-200/90">
                    For first-time login, use your default portal password provided during enrollment. For password resets, contact your Class Adviser or the School ICT Coordinator.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
}
