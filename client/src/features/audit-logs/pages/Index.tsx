import { useCallback, useEffect, useMemo, useState } from "react";
import { sileo } from "sileo";
import {
  ClipboardList,
  Download,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";
import api from "@/shared/api/axiosInstance";
import { toastApiError } from "@/shared/hooks/useApiToast";
import { useDelayedLoading } from "@/shared/hooks/useDelayedLoading";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Skeleton } from "@/shared/ui/skeleton";

interface AuditUser {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuditLogRow {
  id: number;
  userId: number | null;
  actionType: string;
  description: string;
  subjectType: string | null;
  recordId: number | null;
  ipAddress: string;
  userAgent: string | null;
  createdAt: string;
  user: AuditUser | null;
}

const PAGE_SIZE = 20;

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function actionLabel(actionType: string) {
  return actionType.replaceAll("_", " ");
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const showSkeleton = useDelayedLoading(loading);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const [actionType, setActionType] = useState("");
  const [userId, setUserId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filterParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (actionType.trim()) params.actionType = actionType.trim().toUpperCase();
    if (userId.trim()) params.userId = userId.trim();
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    return params;
  }, [actionType, userId, dateFrom, dateTo]);

  const fetchLogs = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      setForbidden(false);
      try {
        const res = await api.get("/audit-logs", {
          params: {
            ...filterParams,
            page: targetPage,
            limit: PAGE_SIZE,
          },
        });

        setLogs(res.data.logs || []);
        setTotal(res.data.total ?? 0);
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
    [filterParams],
  );

  useEffect(() => {
    fetchLogs(page);
  }, [fetchLogs, page]);

  const visibleActors = useMemo(() => {
    const unique = new Set(
      logs.map((log) => (log.user ? `${log.user.id}` : "system")),
    );
    return unique.size;
  }, [logs]);

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
      const filename = filenameMatch
        ? filenameMatch[1].replaceAll('"', "")
        : `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;

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
        description: "Audit log CSV downloaded successfully.",
      });
    } catch (err) {
      toastApiError(err as never);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-primary" />
            Audit Logs
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Review immutable system activity and actor metadata.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fetchLogs(page)}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Exporting..." : "Export CSV"}
          </Button>
        </div>
      </div>

      {forbidden ? (
        <Card className="border-none shadow-sm">
          <CardContent className="py-10">
            <div className="mx-auto max-w-xl text-center space-y-2">
              <div className="mx-auto h-12 w-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <p className="font-bold">Access Restricted</p>
              <p className="text-sm text-muted-foreground">
                Your role cannot access full audit logs. Contact a system
                administrator if this access is required.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Action Type</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={actionType}
                      onChange={(e) => {
                        setActionType(e.target.value);
                        setPage(1);
                      }}
                      placeholder="e.g. APPLICATION_SUBMITTED"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>User ID</Label>
                  <Input
                    value={userId}
                    onChange={(e) => {
                      setUserId(e.target.value.replace(/[^0-9]/g, ""));
                      setPage(1);
                    }}
                    placeholder="System admin filter"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date From</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date To</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setActionType("");
                    setUserId("");
                    setDateFrom("");
                    setDateTo("");
                    setPage(1);
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Total Results
                </p>
                <CardTitle className="text-2xl font-extrabold">
                  {total}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Visible Rows
                </p>
                <CardTitle className="text-2xl font-extrabold">
                  {logs.length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Actors In View
                </p>
                <CardTitle className="text-2xl font-extrabold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  {visibleActors}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Activity Log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-left">Timestamp</TableHead>
                      <TableHead className="text-left">Actor</TableHead>
                      <TableHead className="text-left">Action</TableHead>
                      <TableHead className="text-left">Subject</TableHead>
                      <TableHead className="text-left">Description</TableHead>
                      <TableHead className="text-left">IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {showSkeleton ? (
                      Array.from({ length: 6 }).map((_, idx) => (
                        <TableRow key={`skeleton-${idx}`}>
                          <TableCell>
                            <Skeleton className="h-4 w-36" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-28" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-28 rounded-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-full max-w-[360px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : logs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="h-20 text-center text-sm text-muted-foreground"
                        >
                          No audit events found for the current filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap text-left text-xs font-medium">
                            {formatTimestamp(log.createdAt)}
                          </TableCell>
                          <TableCell className="text-left">
                            <div className="space-y-0.5">
                              <p className="text-sm font-semibold">
                                {log.user
                                  ? `${log.user.lastName}, ${log.user.firstName}`
                                  : "System / Guest"}
                              </p>
                              {log.user && (
                                <p className="text-xs text-muted-foreground">
                                  ID {log.user.id} • {log.user.role}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-left">
                            <Badge variant="outline" className="font-semibold">
                              {actionLabel(log.actionType)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-left text-xs">
                            {log.subjectType
                              ? `${log.subjectType}${log.recordId ? ` #${log.recordId}` : ""}`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-left text-sm max-w-[480px] break-words">
                            {log.description}
                          </TableCell>
                          <TableCell className="text-left text-xs font-mono">
                            {log.ipAddress}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || loading}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages || loading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
