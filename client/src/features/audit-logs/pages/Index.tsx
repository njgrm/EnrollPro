import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { AnimatedNumber } from "@/shared/components/AnimatedNumber";
import { useSearchParams } from "react-router";
import { sileo } from "sileo";
import {
  Download,
  RefreshCw,
  ShieldAlert,
  AlertTriangle,
  History,
  Activity,
  ChevronDown,
  Bot,
  User,
  SlidersHorizontal,
} from "lucide-react";
import api from "@/shared/api/axiosInstance";
import { useAuthStore } from "@/store/auth.slice";
import { toastApiError } from "@/shared/hooks/useApiToast";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";
import { cn, formatUserRole, getMockedSystemDate } from "@/shared/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useRealtimeRefresh } from "@/shared/hooks/useRealtimeRefresh";
import type { RealtimeInvalidationTopic } from "@enrollpro/shared";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/shared/ui/data-table";
import { DataTableColumnHeader } from "@/shared/ui/data-table-column-header";
import { PaginationBar } from "@/shared/components/PaginationBar";
import { usePaginationLimit } from "@/shared/hooks/usePaginationLimit";
import { HybridDatePicker } from "@/shared/components/HybridDatePicker";
import { useHeaderStore } from "@/store/header.slice";
import { AuditLogsSkeleton } from "@/shared/components/PageLoadingSkeleton";

interface AuditUser {
  id: number;
  firstName: string;
  lastName: string;
  roles: string[];
  employeeId?: string;
  accountName?: string;
}

interface AuditLogRow {
  id: number;
  userId: number | null;
  actionType: string;
  description: string;
  subjectType: string | null;
  recordId: number | null;
  resolvedSubject: string | null;
  ipAddress: string;
  userAgent: string | null;
  createdAt: string;
  user: AuditUser | null;
  metadata?: unknown;
  newValue?: string | null;
  oldValue?: string | null;
}

interface FilterMetadata {
  actionTypes: string[];
  actors: { id: number; name: string; roles: string[] }[];
}

const DEFAULT_PAGE_SIZE = 20;
const AUDIT_LOG_REALTIME_TOPICS: RealtimeInvalidationTopic[] = [
  "audit-logs:list",
];

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

const ACTION_MAP: Record<string, string> = {
  SY_CREATED: "Created School Year",
  SY_UPDATED: "Updated School Year",
  SY_DELETED: "Deleted School Year",
  SY_ARCHIVED: "Archived School Year",
  SY_ROLLOVER: "Rolled Over School Year",
  TERM_DATES_UPDATED: "Updated Term Dates",
  ENROLLMENT_DATES_UPDATED: "Updated Enrollment Dates",
  BOSY_LOCKED: "Locked BOSY",
  BOSY_UNLOCKED: "Unlocked BOSY",
  EOSY_FINALIZED: "Finalized EOSY",
  ENROLLMENT_CREATED: "Created Enrollment",
  ENROLLMENT_UPDATED: "Updated Enrollment",
  ENROLLMENT_DELETED: "Deleted Enrollment",
  ENROLLMENT_VERIFIED: "Verified Enrollment",
  ENROLLMENT_REJECTED: "Rejected Enrollment",
  STUDENT_CREATED: "Added Learner",
  STUDENT_UPDATED: "Updated Learner",
  STUDENT_DELETED: "Deleted Learner",
  SECTION_CREATED: "Created Section",
  SECTION_UPDATED: "Updated Section",
  SECTION_DELETED: "Deleted Section",
  USER_CREATED: "Added Staff Member",
  USER_UPDATED: "Updated Staff Member",
  USER_DELETED: "Deleted Staff Member",
  LOGIN: "Logged In",
  LOGOUT: "Logged Out",
  FAILED_LOGIN: "Failed Login Attempt",
  SECTION_ASSIGNMENT: "Section Assign",
  BULK_SECTION_ASSIGNMENT: "Bulk Section Assign",
};

function toTitleCase(str: string) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

function actionLabel(actionType: string) {
  const upper = actionType.toUpperCase();
  if (ACTION_MAP[upper]) return ACTION_MAP[upper];

  const parts = upper.split("_");
  const verbMap: Record<string, string> = {
    CREATED: "Created",
    UPDATED: "Updated",
    DELETED: "Deleted",
    REMOVED: "Removed",
    ADDED: "Added",
    ARCHIVED: "Archived",
    RESTORED: "Restored",
  };
  const nounMap: Record<string, string> = {
    SY: "School Year",
    STUDENT: "Learner",
    USER: "Staff Member",
    SECTION: "Class Section",
    SCHOOLYEAR: "School Year",
    SCHOOLSETTING: "School Profile Settings",
    ENROLLMENTAPPLICATION: "Enrollment Application",
  };

  if (parts.length === 2 && verbMap[parts[1]]) {
    const noun = nounMap[parts[0]] || toTitleCase(parts[0]);
    return `${verbMap[parts[1]]} ${noun}`;
  }

  if (parts.length === 2 && verbMap[parts[0]]) {
    const noun = nounMap[parts[1]] || toTitleCase(parts[1]);
    return `${verbMap[parts[0]]} ${noun}`;
  }

  const label = actionType.replaceAll("_", " ");
  return toTitleCase(label)
    .replace(/Schoolyear/ig, "School Year")
    .replace(/Schoolsetting/ig, "School Profile Settings")
    .replace(/Enrollmentapplication/ig, "Enrollment Application")
    .replace(/Enrollment Application/ig, "Enrollment Application");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function parseRecord(value: string | null | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    return asRecord(JSON.parse(value)) ?? {};
  } catch {
    return {};
  }
}

function getDiffs(log: AuditLogRow) {
  const metadata = asRecord(log.metadata);
  const previousData = asRecord(metadata?.previousData);
  const newData = asRecord(metadata?.newData);

  if (previousData && newData) {
    return { old: previousData, new: newData };
  }
  if (log.oldValue || log.newValue) {
    return {
      old: parseRecord(log.oldValue),
      new: parseRecord(log.newValue),
    };
  }
  return null;
}

function parseUserAgent(ua: string) {
  if (!ua) return "Unknown Device/Browser";
  let browser = "Unknown Browser";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";

  let os = "Unknown OS";
  if (ua.includes("Win")) os = "Windows";
  else if (ua.includes("Mac")) os = "MacOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("like Mac OS X")) os = "iOS";

  return `${browser} on ${os}`;
}

const FIELD_MAP: Record<string, string> = {
  spsEnabled: "Special Program in Sports (SPS) Status",
  spaEnabled: "Special Program in the Arts (SPA) Status",
  steEnabled: "Science, Technology, and Engineering (STE) Status",
  hasPsaBirthCertificate: "PSA Birth Certificate",
};

function formatKeyName(key: string) {
  if (FIELD_MAP[key]) return FIELD_MAP[key];
  const spaced = key.replace(/([A-Z])/g, " $1");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Forensic UI Upgrade: Shift from "Pretty UI" to "Forensic Usability"
 */
interface AuditLogsProps {
  selfOnly?: boolean;
}

export default function AuditLogs({ selfOnly = false }: AuditLogsProps) {
  const { user } = useAuthStore();
  const isSystemAdmin = user?.roles?.includes("SYSTEM_ADMIN");
  const canViewAllActivity = Boolean(isSystemAdmin && !selfOnly);
  const [searchParams, setSearchParams] = useSearchParams();

  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  const [page, setPage] = useState(() => Number(searchParams.get("page")) || 1);
  const [limit, setLimit] = usePaginationLimit(
    Number(searchParams.get("limit")) || DEFAULT_PAGE_SIZE,
  );
  const [total, setTotal] = useState(0);
  const [meta, setMeta] = useState({ criticalCount: 0, activeActors: 0 });

  const [actionType, setActionType] = useState(() => searchParams.get("actionType") || "all");
  const [actorId, setActorId] = useState(() => searchParams.get("actorId") || "all");
  const [dateFrom, setDateFrom] = useState(() => searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(() => searchParams.get("dateTo") || "");

  const updateUrlParams = useCallback(
    (newParams: Record<string, string | number | undefined>) => {
      const current = Object.fromEntries(searchParams.entries());
      const updated = { ...current, ...newParams };

      Object.keys(updated).forEach((key) => {
        if (updated[key] === undefined || updated[key] === null || updated[key] === "" || updated[key] === "all") {
          delete updated[key];
        }
      });

      setSearchParams(updated as Record<string, string>, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setExpandedRowId(null);
    updateUrlParams({ page: newPage });
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    setExpandedRowId(null);
    updateUrlParams({ page: 1, limit: newLimit });
  };

  const [filterMeta, setFilterMeta] = useState<FilterMetadata>({
    actionTypes: [],
    actors: [],
  });

  const fetchFilterMeta = useCallback(async () => {
    try {
      const res = await api.get(
        selfOnly ? "/audit-logs/me/filters" : "/audit-logs/filters",
      );
      setFilterMeta(res.data);
    } catch (err) {
      console.error("Failed to fetch filter metadata", err);
    }
  }, [selfOnly]);

  const handlePresetDate = (daysBack: number | null) => {
    const today = getMockedSystemDate() ?? new Date();
    const to = today.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
    const from = daysBack !== null
      ? new Date(today.getTime() - daysBack * 24 * 60 * 60 * 1000)
        .toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })
      : `${today
        .toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })
        .slice(0, 7)}-01`;
    setDateFrom(from);
    setDateTo(to);
    setPage(1);
    updateUrlParams({ dateFrom: from, dateTo: to, page: 1 });
  };

  useEffect(() => {
    if (canViewAllActivity || selfOnly) {
      fetchFilterMeta();
    }
  }, [canViewAllActivity, fetchFilterMeta, selfOnly]);

  const columns = useMemo<ColumnDef<AuditLogRow>[]>(
    () => [
      {
        accessorKey: "createdAt",
        size: 170,
        minSize: 150,
        maxSize: 200,
        meta: { skeletonClassName: "w-[140px] mx-auto", className: "text-center", headerClassName: "text-center" },
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Timestamp"
            className="justify-center [&_button]:!m-0"
          />
        ),
        cell: ({ row }) => (
          <div className="flex w-full justify-center py-2.5">
            <span className="whitespace-nowrap text-sm sm:text-sm font-semibold tabular-nums text-foreground">
              {formatTimestamp(row.original.createdAt)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "user",
        size: 260,
        minSize: 210,
        maxSize: 360,
        meta: { skeletonClassName: "w-[150px]" },
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Staff Member"
          />
        ),
        cell: ({ row }) => {
          const log = row.original;

          if (!log.user) {
            return (
              <div className="flex min-w-0 flex-col text-left py-2 pl-2">
                <div className="flex items-center gap-1.5">
                  <div className="flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground border border-border/70">
                    <Bot className="size-3.5" />
                  </div>
                  <span className="text-sm font-bold text-muted-foreground uppercase tracking-tight">
                    System / Guest
                  </span>
                </div>
                <span className="text-sm text-muted-foreground/80 pl-6.5 font-medium mt-0.5">
                  Automated System Action
                </span>
              </div>
            );
          }

          return (
            <div className="flex min-w-0 flex-col text-left py-2 pl-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary border border-primary/20">
                  <User className="size-3.5" />
                </div>
                <span className="text-sm font-extrabold text-foreground uppercase tracking-tight truncate">
                  {log.user.lastName}, {log.user.firstName}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 pl-6.5 text-sm text-muted-foreground font-semibold truncate">
                <span>ID: {log.user.employeeId || log.user.id}</span>
                {log.user.roles?.[0] && (
                  <>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="truncate">{formatUserRole(log.user.roles[0])}</span>
                  </>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "systemModule",
        size: 200,
        minSize: 160,
        maxSize: 250,
        meta: { skeletonClassName: "w-[140px] mx-auto", className: "text-center", headerClassName: "text-center" },
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="System Module"
            className="justify-center [&_button]:!m-0"
          />
        ),
        cell: ({ row }) => {
          const log = row.original;
          const type = log.subjectType ? log.subjectType.charAt(0) + log.subjectType.slice(1).toLowerCase() : "System";

          let displayType = type;
          if (type === "Schoolyear") displayType = "School Year";
          if (type === "Schoolsetting") displayType = "School Profile Settings";
          if (type === "Enrollment") displayType = "Enrollment";
          if (type === "Enrollmentapplication") displayType = "Enrollment Application";
          if (type === "Student") displayType = "Learner Directory";
          if (type === "User") displayType = "Personnel Management";
          if (type === "Section") displayType = "Section Assignment";

          let badgeStyles = "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
          if (displayType === "School Profile Settings") {
            badgeStyles = "bg-cyan-50 text-cyan-800 border-cyan-300 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800";
          } else if (displayType === "School Year") {
            badgeStyles = "bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800";
          } else if (displayType === "Learner Directory") {
            badgeStyles = "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
          } else if (displayType === "Enrollment" || displayType === "Enrollment Application") {
            badgeStyles = "bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800";
          } else if (displayType === "Personnel Management") {
            badgeStyles = "bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800";
          } else if (displayType === "Section Assignment") {
            badgeStyles = "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
          }

          return (
            <div className="flex w-full justify-center py-2.5">
              <Badge
                variant="outline"
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-sm font-bold uppercase tracking-wider",
                  badgeStyles,
                )}
              >
                {displayType}
              </Badge>
            </div>
          );
        },
      },
      {
        id: "recordedAction",
        size: 420,
        minSize: 320,
        maxSize: 640,
        meta: { skeletonClassName: "w-[250px]" },
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Recorded Action"
          />
        ),
        cell: ({ row }) => {
          const action = row.original.actionType;
          let description = row.original.description;
          if (description && description.includes("User null")) {
            const user = row.original.user;
            const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : "";
            const identifier = user ? (user.employeeId || user.accountName || user.id) : "";
            const userLabel = fullName && identifier ? `${fullName} (${identifier})` : (fullName || String(identifier || ""));
            description = description.replace("User null", userLabel ? `User ${userLabel}` : "User");
          }
          return (
            <div className="flex min-w-0 flex-col text-left py-2 pl-2 leading-snug">
              <span className="font-extrabold text-sm text-foreground uppercase tracking-tight block">
                {actionLabel(action)}
              </span>
              <span className="text-sm text-muted-foreground max-w-[460px] break-words block mt-0.5 leading-relaxed">
                {description}
              </span>
            </div>
          );
        },
      },
      {
        id: "expander",
        size: 60,
        minSize: 50,
        maxSize: 70,
        meta: { className: "text-center", headerClassName: "text-center" },
        header: "",
        cell: ({ row }) => {
          const diff = getDiffs(row.original);
          const hasChanges = diff && (Object.keys(diff.old).length > 0 || Object.keys(diff.new).length > 0);
          if (!hasChanges) return null;

          return (
            <div className="flex items-center justify-center py-3 pr-2">
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform duration-200",
                  expandedRowId === row.original.id && "rotate-180 text-primary"
                )}
              />
            </div>
          );
        },
      },
    ],
    [expandedRowId],
  );

  const filterParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (actionType !== "all") params.actionType = actionType;
    if (canViewAllActivity && actorId !== "all") params.userId = actorId;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    return params;
  }, [actionType, actorId, canViewAllActivity, dateFrom, dateTo]);

  const fetchLogs = useCallback(
    async (targetPage: number, targetLimit: number) => {
      setLoading(true);
      setForbidden(false);
      try {
        const res = await api.get(selfOnly ? "/audit-logs/me" : "/audit-logs", {
          params: {
            ...filterParams,
            page: targetPage,
            limit: targetLimit,
          },
        });

        const fetchedLogs = res.data.logs || [];
        const fetchedTotal = res.data.total ?? 0;
        setLogs(fetchedLogs);
        setTotal(fetchedTotal);
        setMeta(res.data.meta || { criticalCount: 0, activeActors: 0 });

        if (fetchedTotal > 0 && targetPage > Math.ceil(fetchedTotal / targetLimit)) {
          setPage(1);
          updateUrlParams({ page: 1 });
        }
      } catch (err) {
        const status = (err as { response?: { status?: number } }).response
          ?.status;
        if (status === 403) {
          setForbidden(true);
          setLogs([]);
          setTotal(0);
          return;
        }
        toastApiError(err as never);
      } finally {
        setLoading(false);
      }
    },
    [filterParams, selfOnly, updateUrlParams],
  );

  useEffect(() => {
    fetchLogs(page, limit);
  }, [fetchLogs, page, limit]);

  const refreshAuditLogs = useCallback(() => {
    void fetchLogs(page, limit);
    if (canViewAllActivity || selfOnly) {
      void fetchFilterMeta();
    }
  }, [canViewAllActivity, fetchFilterMeta, fetchLogs, page, limit, selfOnly]);

  useRealtimeRefresh({
    topics: AUDIT_LOG_REALTIME_TOPICS,
    onRefresh: refreshAuditLogs,
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get("/audit-logs/export", {
        params: filterParams,
        responseType: "blob",
      });

      const disposition = res.headers["content-disposition"] as
        | string
        | undefined;
      const filenameMatch = disposition?.match(/filename=([^;]+)/i);
      const exportDate = getMockedSystemDate() ?? new Date();
      const filename = filenameMatch
        ? filenameMatch[1].replaceAll('"', "")
        : `audit-logs-${exportDate.toISOString().slice(0, 10)}.csv`;

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      sileo.success({
        title: "Export Ready",
        description: "Activity Report CSV downloaded successfully.",
      });
    } catch (err) {
      toastApiError(err as never);
    } finally {
      setExporting(false);
    }
  };

  const setTitle = useHeaderStore((s) => s.setTitle);

  useEffect(() => {
    setTitle(selfOnly ? "My Activity Log" : "System Activity Logs");
    return () => setTitle(null);
  }, [selfOnly, setTitle]);

  if (!forbidden && loading && logs.length === 0) {
    return <AuditLogsSkeleton />;
  }

  return (
    <div className="space-y-3.5 flex flex-col min-h-0 flex-1">
      {forbidden ? (
        <Card className="border-none shadow-sm">
          <CardContent className="py-10">
            <div className="mx-auto max-w-xl text-center space-y-2">
              <div className="mx-auto h-12 w-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <p className="font-bold">Access Denied/Restricted</p>
              <p className="text-base leading-tight text-foreground font-bold">
                Your role cannot access full audit logs. Contact a system
                administrator if this access is required.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ─── Search Filters ─── */}
          <Card className="border border-border/80 shadow-xs bg-card">
            <CardHeader className="p-3 sm:px-4 sm:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 space-y-0 border-b border-border/50">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm sm:text-sm font-bold uppercase tracking-wider text-foreground">
                  Search Filters
                </CardTitle>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="font-bold text-sm h-8"
                  onClick={() => fetchLogs(page, limit)}
                  disabled={loading}
                >
                  <RefreshCw
                    className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")}
                  />
                  Refresh
                </Button>
                {canViewAllActivity && (
                  <Button
                    size="sm"
                    className="font-bold text-sm h-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                    onClick={handleExport}
                    disabled={exporting}
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    {exporting ? "Exporting..." : "Download Activity Report"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 space-y-2.5">
              <div
                className={cn(
                  "grid gap-3",
                  canViewAllActivity
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                    : "grid-cols-1 sm:grid-cols-3",
                )}
              >
                <div className="space-y-1">
                  <Label className="font-bold uppercase tracking-wider text-muted-foreground">
                    Action Category
                  </Label>
                  <Select
                    isFilter
                    value={actionType}
                    onValueChange={(val) => {
                      setActionType(val);
                      setPage(1);
                      updateUrlParams({ actionType: val, page: 1 });
                    }}
                  >
                    <SelectTrigger className="h-9 font-bold text-sm sm:text-sm">
                      <SelectValue placeholder="All Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="font-bold text-sm sm:text-sm">
                        All Actions
                      </SelectItem>
                      {filterMeta.actionTypes.map((at) => (
                        <SelectItem
                          key={at}
                          value={at}
                          className="font-bold text-sm sm:text-sm"
                        >
                          {actionLabel(at)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {canViewAllActivity && (
                  <div className="space-y-1">
                    <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Actor Filter
                    </Label>
                    <Select
                      isFilter
                      value={actorId}
                      onValueChange={(val) => {
                        setActorId(val);
                        setPage(1);
                        updateUrlParams({ actorId: val, page: 1 });
                      }}
                    >
                      <SelectTrigger className="h-9 font-bold text-sm sm:text-sm">
                        <SelectValue placeholder="All Staff Members" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="font-bold text-sm sm:text-sm">
                          All Staff Members
                        </SelectItem>
                        {filterMeta.actors.map((actor) => (
                          <SelectItem
                            key={actor.id}
                            value={actor.id.toString()}
                            className="font-bold text-sm sm:text-sm"
                          >
                            {actor.name} ({formatUserRole(actor.roles?.[0])})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Date From
                  </Label>
                  <HybridDatePicker
                    value={dateFrom}
                    onChange={(val) => {
                      setDateFrom(val);
                      setPage(1);
                      updateUrlParams({ dateFrom: val, page: 1 });
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Date To
                  </Label>
                  <HybridDatePicker
                    value={dateTo}
                    onChange={(val) => {
                      setDateTo(val);
                      setPage(1);
                      updateUrlParams({ dateTo: val, page: 1 });
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground mr-1">
                    Quick Presets:
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-sm font-bold rounded-md"
                    onClick={() => handlePresetDate(0)}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-sm font-bold rounded-md"
                    onClick={() => handlePresetDate(7)}
                  >
                    Last 7 Days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-sm font-bold rounded-md"
                    onClick={() => handlePresetDate(null)}
                  >
                    This Month
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-sm font-bold text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setActionType("all");
                    setActorId("all");
                    setDateFrom("");
                    setDateTo("");
                    setPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ─── Streamlined KPI Ribbon ─── */}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <Card className="border border-border/80 shadow-xs bg-card py-2.5 px-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
                    <History className="size-3.5 text-foreground" />
                  </div>
                  <p className="text-base font-extrabold uppercase tracking-wider text-foreground truncate">
                    Total Events
                  </p>
                </div>
                <span className="text-xl sm:text-2xl font-extrabold text-foreground tabular-nums">
                  <AnimatedNumber value={total} />
                </span>
              </div>
            </Card>

            <Card className="border border-border/80 shadow-xs bg-card py-2.5 px-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="size-3.5 text-amber-600" />
                  </div>
                  <p className="text-base font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                    Critical Alerts
                  </p>
                </div>
                <span className="text-xl sm:text-2xl font-extrabold text-amber-600 tabular-nums">
                  <AnimatedNumber value={meta.criticalCount} />
                </span>
              </div>
            </Card>

            <Card className="border border-border/80 shadow-xs bg-card py-2.5 px-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary border border-primary/20">
                    <Activity className="size-3.5 text-primary" />
                  </div>
                  <p className="text-base font-extrabold uppercase tracking-wider text-primary truncate">
                    Active Actors
                  </p>
                </div>
                <span className="text-xl sm:text-2xl font-extrabold text-primary tabular-nums">
                  {meta.activeActors}
                </span>
              </div>
            </Card>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex-1 min-h-[460px] flex flex-col">
            <DataTable
              columns={columns}
              data={logs}
              loading={loading}
              transitionKey={`${actionType}-${actorId}`}
              virtualize={false}
              containerHeight="100%"
              isRowClickable={(row) => {
                const diff = getDiffs(row);
                return diff !== null && (Object.keys(diff.old).length > 0 || Object.keys(diff.new).length > 0);
              }}
              onRowClick={(row) => {
                setExpandedRowId((prev) => (prev === row.id ? null : row.id))
              }}
              renderRowAfter={(row) => {
                if (expandedRowId !== row.id) return null;
                const diff = getDiffs(row);
                if (!diff || (Object.keys(diff.old).length === 0 && Object.keys(diff.new).length === 0)) {
                  return null;
                }
                const excludeKeys = new Set(["id", "createdAt", "updatedAt"]);
                const allKeys = Array.from(new Set([...Object.keys(diff.old), ...Object.keys(diff.new)])).filter(k => !excludeKeys.has(k));

                return (
                  <tr className="bg-muted/5 border-b">
                    <td colSpan={columns.length} className="p-0">
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 border-l-4 border-l-primary mx-4 my-2 rounded-r-lg bg-card shadow-sm border border-border/50">
                          <h4 className="text-base font-bold uppercase tracking-wide text-foreground mb-4 flex items-center gap-2">
                            <Activity className="h-4 w-4 text-primary" />
                            Detailed Changes
                          </h4>
                          <div className="rounded-lg border bg-background shadow-sm overflow-hidden">
                            <table className="w-full text-base leading-tight text-left">
                              <thead className="bg-muted border-b">
                                <tr>
                                  <th className="px-4 py-3 font-bold text-foreground">Modified Field</th>
                                  <th className="px-4 py-3 font-bold text-foreground">Changed From</th>
                                  <th className="px-4 py-3 font-bold text-foreground">Changed To</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {allKeys.map(key => {
                                  const oldVal = diff.old[key];
                                  const newVal = diff.new[key];
                                  if (JSON.stringify(oldVal) === JSON.stringify(newVal)) return null;

                                  const isIsoDate = (str: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(str);
                                  const formatVal = (v: unknown) => {
                                    if (v === null || v === undefined) return "—";
                                    if (v === true || String(v) === "true") return <span className="text-green-600 font-bold">Active</span>;
                                    if (v === false || String(v) === "false") return <span className="text-destructive font-bold">Inactive</span>;
                                    if (typeof v === "object") return JSON.stringify(v);
                                    let str = String(v);
                                    if (isIsoDate(str)) {
                                      return new Date(str).toLocaleString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                        hour: "numeric",
                                        minute: "2-digit",
                                        second: "2-digit",
                                      });
                                    }
                                    if (/^[A-Z_]+$/.test(str)) {
                                      str = toTitleCase(str.replaceAll("_", " "));
                                    }
                                    return str;
                                  };

                                  return (
                                    <tr key={key} className="hover:bg-muted/30 transition-colors">
                                      <td className="px-4 py-3 font-bold text-foreground">{formatKeyName(key)}</td>
                                      <td className="px-4 py-3 font-bold text-destructive bg-destructive/5">
                                        <span className="line-through decoration-destructive/40 opacity-80">{formatVal(oldVal)}</span>
                                      </td>
                                      <td className="px-4 py-3 font-bold
                                       text-green-700 bg-green-50">
                                        {formatVal(newVal)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          <div className="mt-4 rounded-lg border bg-background shadow-sm overflow-hidden p-4">
                            <p className="text-sm font-bold uppercase text-foreground mb-1">Network Security Footprint</p>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground">{row.ipAddress || "Unknown IP"}</span>
                              <span className="text-foreground text-sm border-l pl-2 border-border">
                                {parseUserAgent(row.userAgent || "")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </td>
                  </tr>
                );
              }}
            />

            {total > 0 && (
              <PaginationBar
                page={page}
                total={total}
                limit={limit}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
                itemName="Audit Records"
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

