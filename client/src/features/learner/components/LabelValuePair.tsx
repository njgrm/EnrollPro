import { cn } from "@/shared/lib/utils";

export interface LabelValuePairProps {
  label: string;
  value: string | number | null | undefined;
  className?: string;
  valueClassName?: string;
}

export function LabelValuePair({
  label,
  value,
  className,
  valueClassName,
}: LabelValuePairProps) {
  const isValueEmpty =
    value === null ||
    value === undefined ||
    value === "" ||
    value === "-" ||
    (typeof value === "string" && value.trim() === "");
  const rawValue = isValueEmpty ? "Not Specified" : String(value);
  const displayValue = isValueEmpty ? rawValue : rawValue.replace(/_/g, " ");

  return (
    <div
      className={cn(
        "flex flex-col space-y-1 p-3 rounded-lg bg-muted/40 border border-border/60 transition-colors",
        className,
      )}
    >
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground select-none">
        {label}
      </span>
      <span
        className={cn(
          "text-sm sm:text-base font-bold text-foreground leading-snug break-words uppercase",
          isValueEmpty && "text-muted-foreground italic font-normal normal-case",
          valueClassName,
        )}
      >
        {displayValue}
      </span>
    </div>
  );
}
