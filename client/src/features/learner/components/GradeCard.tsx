import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";

export interface GradeCardProps {
  subject: string;
  q1: string;
  q2: string;
  q3: string;
  q4?: string | null;
  isTrimester: boolean;
  finalRating: string;
  remarks: string;
}

export function GradeCard({
  subject,
  q1,
  q2,
  q3,
  q4,
  isTrimester,
  finalRating,
  remarks,
}: GradeCardProps) {
  const isPassed = remarks.toLowerCase().includes("passed");
  const isFailed = remarks.toLowerCase().includes("failed");

  return (
    <Card className="border border-border bg-card shadow-xs overflow-hidden">
      <CardHeader className="p-3.5 pb-2.5 bg-muted/30 border-b border-border/50 flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-sm font-bold uppercase tracking-tight text-foreground truncate">
          {subject}
        </CardTitle>
        <div className="flex items-center gap-1.5 shrink-0">
          {finalRating !== "—" && (
            <span className="text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded border border-border/40">
              Final: {finalRating}
            </span>
          )}
          {remarks !== "—" && (
            <Badge
              variant={isPassed ? "success" : isFailed ? "danger" : "outline"}
              className="text-[11px] px-2 py-0.5 uppercase font-bold"
            >
              {remarks}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-3">
        <div className={cn("grid gap-2", isTrimester ? "grid-cols-3" : "grid-cols-4")}>
          <div className="flex flex-col items-center justify-center p-2 rounded-md bg-muted/40 border border-border/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {isTrimester ? "T1" : "Q1"}
            </span>
            <span className="text-sm font-bold text-foreground mt-0.5">{q1}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-md bg-muted/40 border border-border/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {isTrimester ? "T2" : "Q2"}
            </span>
            <span className="text-sm font-bold text-foreground mt-0.5">{q2}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-md bg-muted/40 border border-border/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {isTrimester ? "T3" : "Q3"}
            </span>
            <span className="text-sm font-bold text-foreground mt-0.5">{q3}</span>
          </div>
          {!isTrimester && (
            <div className="flex flex-col items-center justify-center p-2 rounded-md bg-muted/40 border border-border/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Q4
              </span>
              <span className="text-sm font-bold text-foreground mt-0.5">{q4 ?? "—"}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
