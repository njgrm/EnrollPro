import React, { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Progress } from "@/shared/ui/progress";
import api from "@/shared/api/axiosInstance";
import { sileo } from "sileo";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  RefreshCw,
} from "lucide-react";

interface SectionInfo {
  id: number;
  name: string;
  gradeLevel: string;
}

interface SectionSf1UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: SectionInfo | null;
  onSuccess: () => void;
}

export function SectionSf1UploadModal({
  open,
  onOpenChange,
  section,
  onSuccess,
}: SectionSf1UploadModalProps): React.JSX.Element {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetState = () => {
    setFile(null);
    setIsUploading(false);
    setProgress(0);
    setSuccessMessage(null);
    setErrorMessage(null);
    setIsDragOver(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    const lower = selectedFile.name.toLowerCase();
    if (!lower.endsWith(".xlsx") && !lower.endsWith(".xls")) {
      sileo.error({
        title: "Invalid File Format",
        description: "Only .xlsx and .xls Excel files are supported.",
      });
      return;
    }
    setFile(selectedFile);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleUpload = useCallback(async () => {
    if (!file || !section) return;

    setIsUploading(true);
    setProgress(15);
    setErrorMessage(null);

    const timer = setInterval(() => {
      setProgress((prev) => Math.min(prev + Math.floor(Math.random() * 15) + 5, 90));
    }, 150);

    const formData = new FormData();
    formData.append("file", file);

    try {
      interface Sf1ImportResponse {
        success: boolean;
        totalParsed: number;
        importedCount: number;
        gradeLevelName: string;
        sectionName: string;
        sectionId: number;
        message: string;
      }

      const res = await api.post<Sf1ImportResponse>(
        `/sections/${section.id}/sf1/import`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      clearInterval(timer);
      setProgress(100);
      setSuccessMessage(
        res.data.message ||
          `Success: ${res.data.importedCount} Learners imported into ${res.data.gradeLevelName} - ${res.data.sectionName}`,
      );
      sileo.success({
        title: "SF1 Roster Imported",
        description: `Successfully added ${res.data.importedCount} learners to ${res.data.sectionName}.`,
      });
      onSuccess();
    } catch (err: unknown) {
      clearInterval(timer);
      setIsUploading(false);
      setProgress(0);
      const msg =
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
      setErrorMessage(msg);
      sileo.error({
        title: "Upload Failed",
        description: msg,
      });
    }
  }, [file, section, onSuccess]);

  const handleDownloadTemplate = async () => {
    if (!section) return;
    setIsDownloadingTemplate(true);
    try {
      const res = await api.get<Blob>(`/sections/${section.id}/masterlist/sf1/template`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SF1_Blank_Template_${section.gradeLevel.replace(/\s+/g, "_")}_${section.name.replace(/\s+/g, "_")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      sileo.success({
        title: "Template Downloaded",
        description: `Blank SF1 roster template for ${section.name} is ready.`,
      });
    } catch {
      sileo.error({
        title: "Download Failed",
        description: "Could not download the blank SF1 template.",
      });
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isUploading) return;
        if (!nextOpen) resetState();
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold uppercase">
                Import SF1 for {section ? `${section.gradeLevel} - ${section.name}` : "Section"}
              </DialogTitle>
              <DialogDescription className="text-xs font-bold text-muted-foreground">
                School Form 1 (School Register) — Roster Bulk Import
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
            }}
          />

          {successMessage ? (
            <div className="flex flex-col p-4 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-950 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-base font-extrabold text-emerald-900 leading-tight">
                    {successMessage}
                  </p>
                  <p className="text-xs font-bold text-emerald-700">
                    Learners are now enrolled in this section and visible in the SF1 masterlist.
                  </p>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetState();
                    fileInputRef.current?.click();
                  }}
                  className="font-bold border-emerald-300 hover:bg-emerald-100 text-emerald-900"
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Upload Another File
                </Button>
              </div>
            </div>
          ) : isUploading ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-3 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm font-bold text-foreground truncate max-w-xs">{file?.name}</p>
              <div className="w-full max-w-xs space-y-1 text-center">
                <Progress value={progress} className="h-2 w-full" />
                <p className="text-xs font-bold text-muted-foreground">
                  Parsing learners and enrolling into section...
                </p>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const dropped = e.dataTransfer.files?.[0];
                if (dropped) handleFileSelect(dropped);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed cursor-pointer transition-all text-center ${
                isDragOver
                  ? "border-primary bg-primary/10"
                  : "border-slate-300 hover:border-primary/60 hover:bg-slate-50/80 bg-slate-50/50"
              }`}
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                <Upload className="h-5 w-5" />
              </div>
              {file ? (
                <div className="space-y-1">
                  <p className="text-sm font-extrabold text-foreground">{file.name}</p>
                  <p className="text-xs font-bold text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB — Click to change file
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-extrabold text-foreground">
                    Click to select or drag & drop School Form 1
                  </p>
                  <p className="text-xs font-bold text-muted-foreground">
                    Assigns learners directly to {section?.name ?? "this section"} (.xlsx, .xls)
                  </p>
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-xs font-bold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground pt-1">
            <span>Extracts LRN, Name, Sex, Birth Date, Demographics</span>
            {section && (
              <Button
                type="button"
                variant="link"
                size="sm"
                disabled={isDownloadingTemplate}
                onClick={handleDownloadTemplate}
                className="h-auto p-0 text-xs font-bold text-primary underline"
              >
                <Download className="h-3 w-3 mr-1" />
                Download Blank Template
              </Button>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            onClick={() => {
              resetState();
              onOpenChange(false);
            }}
            className="font-bold"
          >
            {successMessage ? "Close" : "Cancel"}
          </Button>
          {!successMessage && (
            <Button
              type="button"
              disabled={!file || isUploading}
              onClick={() => void handleUpload()}
              className="font-bold bg-primary text-white hover:bg-primary/90"
            >
              {isUploading ? "Importing..." : "Start Import"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
