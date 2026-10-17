import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Progress } from "@/shared/ui/progress";
import { Badge } from "@/shared/ui/badge";
import api from "@/shared/api/axiosInstance";
import { sileo } from "sileo";
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  Users,
  UserCheck,
  RefreshCw,
  FileCheck2,
  HelpCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { useQueryClient } from "@tanstack/react-query";

interface UploadState {
  status: "idle" | "uploading" | "success" | "error";
  progress: number;
  fileName: string | null;
  message: string | null;
  count?: number;
}

const INITIAL_STATE: UploadState = {
  status: "idle",
  progress: 0,
  fileName: null,
  message: null,
};

export function DepEdBulkImportCard(): React.JSX.Element {
  const queryClient = useQueryClient();

  const [sf1State, setSf1State] = useState<UploadState>(INITIAL_STATE);
  const [sf7State, setSf7State] = useState<UploadState>(INITIAL_STATE);
  const [sf1DragOver, setSf1DragOver] = useState(false);
  const [sf7DragOver, setSf7DragOver] = useState(false);

  const sf1FileInputRef = useRef<HTMLInputElement | null>(null);
  const sf7FileInputRef = useRef<HTMLInputElement | null>(null);

  const simulateProgress = (
    setState: React.Dispatch<React.SetStateAction<UploadState>>,
    onComplete: () => Promise<void>,
  ) => {
    let current = 15;
    setState((prev) => ({ ...prev, status: "uploading", progress: current }));

    const timer = setInterval(() => {
      current = Math.min(current + Math.floor(Math.random() * 15) + 5, 90);
      setState((prev) => ({ ...prev, progress: current }));
    }, 150);

    return onComplete()
      .then(() => {
        clearInterval(timer);
        setState((prev) => ({ ...prev, progress: 100 }));
      })
      .catch((err) => {
        clearInterval(timer);
        throw err;
      });
  };

  const handleSf1Upload = useCallback(
    async (file: File) => {
      const lowerName = file.name.toLowerCase();
      if (!lowerName.endsWith(".xlsx") && !lowerName.endsWith(".xls")) {
        sileo.error({
          title: "Invalid File Format",
          description: "School Form 1 only accepts .xlsx and .xls Excel files.",
        });
        return;
      }

      setSf1State({
        status: "uploading",
        progress: 10,
        fileName: file.name,
        message: "Reading and validating SF1 learner register...",
      });

      const formData = new FormData();
      formData.append("file", file);

      try {
        await simulateProgress(setSf1State, async () => {
          interface Sf1ImportApiResponse {
            success: boolean;
            totalParsed: number;
            importedCount: number;
            gradeLevelName: string;
            sectionName: string;
            sectionId: number;
            message: string;
          }

          const res = await api.post<Sf1ImportApiResponse>("/sections/sf1/import", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          const result = res.data;
          setSf1State({
            status: "success",
            progress: 100,
            fileName: file.name,
            message:
              result.message ||
              `Success: ${result.importedCount} Learners imported into ${result.gradeLevelName} - ${result.sectionName}`,
            count: result.importedCount,
          });

          sileo.success({
            title: "SF1 Bulk Import Complete",
            description: `Successfully imported ${result.importedCount} learners into ${result.gradeLevelName} - ${result.sectionName}.`,
          });

          void queryClient.invalidateQueries({ queryKey: ["students"] });
          void queryClient.invalidateQueries({ queryKey: ["sections"] });
          void queryClient.invalidateQueries({ queryKey: ["sectioning"] });
          void queryClient.invalidateQueries({ queryKey: ["homerooms"] });
        });
      } catch (err: unknown) {
        const errorMsg =
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          typeof err.response === "object" &&
          err.response !== null &&
          "data" in err.response &&
          typeof err.response.data === "object" &&
          err.response.data !== null &&
          "message" in err.response.data &&
          typeof err.response.data.message === "string"
            ? err.response.data.message
            : "Failed to parse SF1 roster file. Please ensure it follows official DepEd format.";

        setSf1State({
          status: "error",
          progress: 0,
          fileName: file.name,
          message: errorMsg,
        });

        sileo.error({
          title: "SF1 Import Failed",
          description: errorMsg,
        });
      } finally {
        if (sf1FileInputRef.current) {
          sf1FileInputRef.current.value = "";
        }
      }
    },
    [queryClient],
  );

  const handleSf7Upload = useCallback(
    async (file: File) => {
      const lowerName = file.name.toLowerCase();
      if (!lowerName.endsWith(".xlsx") && !lowerName.endsWith(".xls")) {
        sileo.error({
          title: "Invalid File Format",
          description: "School Form 7 only accepts .xlsx and .xls Excel files.",
        });
        return;
      }

      setSf7State({
        status: "uploading",
        progress: 10,
        fileName: file.name,
        message: "Reading and parsing SF7 personnel list...",
      });

      const formData = new FormData();
      formData.append("file", file);

      try {
        await simulateProgress(setSf7State, async () => {
          interface Sf7ImportApiResponse {
            success: boolean;
            count: number;
            updatedCount: number;
            createdCount: number;
            skippedCount: number;
            message: string;
          }

          const res = await api.post<Sf7ImportApiResponse>("/sf7/import", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          const result = res.data;
          setSf7State({
            status: "success",
            progress: 100,
            fileName: file.name,
            message:
              result.message ||
              `Success: ${result.count} Personnel imported (${result.createdCount} new, ${result.updatedCount} updated)`,
            count: result.count,
          });

          sileo.success({
            title: "SF7 Bulk Import Complete",
            description: `Successfully processed ${result.count} personnel records.`,
          });

          void queryClient.invalidateQueries({ queryKey: ["teachers"] });
        });
      } catch (err: unknown) {
        const errorMsg =
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          typeof err.response === "object" &&
          err.response !== null &&
          "data" in err.response &&
          typeof err.response.data === "object" &&
          err.response.data !== null &&
          "message" in err.response.data &&
          typeof err.response.data.message === "string"
            ? err.response.data.message
            : "Failed to parse SF7 personnel list. Please ensure it follows official DepEd format.";

        setSf7State({
          status: "error",
          progress: 0,
          fileName: file.name,
          message: errorMsg,
        });

        sileo.error({
          title: "SF7 Import Failed",
          description: errorMsg,
        });
      } finally {
        if (sf7FileInputRef.current) {
          sf7FileInputRef.current.value = "";
        }
      }
    },
    [queryClient],
  );

  return (
    <Card className="w-full border-border/80 shadow-sm overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <div className="h-10 w-10 shrink-0 bg-primary/10 text-primary rounded-lg flex items-center justify-center shadow-sm border border-primary/20">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <span className="break-words min-w-0 font-extrabold">DepEd Forms Bulk Import</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Zone A: School Form 1 (Learner Register) */}
          <div className="flex flex-col h-full rounded-xl border border-slate-200 bg-slate-50/50 p-5 shadow-xs transition-colors hover:border-slate-300">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200/80 mb-4 min-h-[44px]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 shrink-0 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Users className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="text-base font-extrabold text-foreground leading-tight truncate">
                    Upload School Form 1 (Learner Register)
                  </h3>
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary p-0.5"
                          aria-label="School Form 1 information"
                        >
                          <HelpCircle className="h-4 w-4 cursor-help shrink-0" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-sm">
                        Registers learners into the school masterlist and automatically enrolls them into their assigned class sections.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <Badge variant="outline" className="font-bold text-xs uppercase bg-white shrink-0 whitespace-nowrap">
                .xlsx, .xls
              </Badge>
            </div>

            <input
              ref={sf1FileInputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleSf1Upload(file);
              }}
            />

            {sf1State.status === "uploading" ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 min-h-[190px]">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                <div className="w-full max-w-xs space-y-2 text-center">
                  <p className="text-sm font-bold text-foreground truncate">
                    {sf1State.fileName ?? "Uploading..."}
                  </p>
                  <Progress value={sf1State.progress} className="h-2 w-full" />
                  <p className="text-xs font-bold text-muted-foreground">{sf1State.message}</p>
                </div>
              </div>
            ) : sf1State.status === "success" ? (
              <div className="flex-1 flex flex-col justify-between p-5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-950 space-y-4 min-h-[190px]">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-base font-extrabold text-emerald-900 leading-tight">
                      {sf1State.message}
                    </p>
                    <p className="text-xs font-bold text-emerald-700">
                      File: {sf1State.fileName} — Demographics and enrollment assignments written to
                      database.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSf1State(INITIAL_STATE);
                      sf1FileInputRef.current?.click();
                    }}
                    className="font-bold border-emerald-300 hover:bg-emerald-100 text-emerald-900"
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    Upload Another SF1
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setSf1DragOver(true);
                }}
                onDragLeave={() => setSf1DragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setSf1DragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) void handleSf1Upload(file);
                }}
                onClick={() => sf1FileInputRef.current?.click()}
                className={`flex-1 flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed cursor-pointer transition-all min-h-[190px] text-center ${
                  sf1DragOver
                    ? "border-primary bg-primary/10 scale-[0.99]"
                    : "border-slate-300 hover:border-primary/60 hover:bg-white bg-slate-50/80"
                }`}
              >
                <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="font-extrabold text-foreground">
                  Click to browse or drag & drop School Form 1
                </p>
                <p className="text-xs font-bold text-muted-foreground mt-1 max-w-sm">
                  Extracts Grade Level, Section, 12-digit LRNs, Demographics, and Enrolls Learners
                </p>
                {sf1State.status === "error" && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded px-2.5 py-1.5 max-w-sm text-center">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{sf1State.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Zone B: School Form 7 (Personnel List) */}
          <div className="flex flex-col h-full rounded-xl border border-slate-200 bg-slate-50/50 p-5 shadow-xs transition-colors hover:border-slate-300">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200/80 mb-4 min-h-[44px]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 shrink-0 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="text-base font-extrabold text-foreground leading-tight truncate">
                    Upload School Form 7 (Personnel List)
                  </h3>
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary p-0.5"
                          aria-label="School Form 7 information"
                        >
                          <HelpCircle className="h-4 w-4 cursor-help shrink-0" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-sm">
                        Registers new personnel and updates existing staff records using their DepEd Employee Number.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <Badge variant="outline" className="font-bold text-xs uppercase bg-white shrink-0 whitespace-nowrap">
                .xlsx, .xls
              </Badge>
            </div>

            <input
              ref={sf7FileInputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleSf7Upload(file);
              }}
            />

            {sf7State.status === "uploading" ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 min-h-[190px]">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                <div className="w-full max-w-xs space-y-2 text-center">
                  <p className="text-sm font-bold text-foreground truncate">
                    {sf7State.fileName ?? "Uploading..."}
                  </p>
                  <Progress value={sf7State.progress} className="h-2 w-full" />
                  <p className="text-xs font-bold text-muted-foreground">{sf7State.message}</p>
                </div>
              </div>
            ) : sf7State.status === "success" ? (
              <div className="flex-1 flex flex-col justify-between p-5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-950 space-y-4 min-h-[190px]">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-base font-extrabold text-emerald-900 leading-tight">
                      {sf7State.message}
                    </p>
                    <p className="text-xs font-bold text-emerald-700">
                      File: {sf7State.fileName} — Personnel directory records successfully
                      synchronized.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSf7State(INITIAL_STATE);
                      sf7FileInputRef.current?.click();
                    }}
                    className="font-bold border-emerald-300 hover:bg-emerald-100 text-emerald-900"
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    Upload Another SF7
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setSf7DragOver(true);
                }}
                onDragLeave={() => setSf7DragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setSf7DragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) void handleSf7Upload(file);
                }}
                onClick={() => sf7FileInputRef.current?.click()}
                className={`flex-1 flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed cursor-pointer transition-all min-h-[190px] text-center ${
                  sf7DragOver
                    ? "border-primary bg-primary/10 scale-[0.99]"
                    : "border-slate-300 hover:border-primary/60 hover:bg-white bg-slate-50/80"
                }`}
              >
                <div className="h-12 w-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                  <FileCheck2 className="h-6 w-6" />
                </div>
                <p className="font-extrabold text-foreground">
                  Click to browse or drag & drop School Form 7
                </p>
                <p className="text-xs font-bold text-muted-foreground mt-1 max-w-sm">
                  Extracts Employee No., Names, Position, Appointment Status, and Upserts Personnel
                </p>
                {sf7State.status === "error" && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded px-2.5 py-1.5 max-w-sm text-center">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{sf7State.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
