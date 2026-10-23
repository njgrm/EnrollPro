import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnDef, SortingState, OnChangeFn, Row, RowSelectionState, TableMeta } from "@tanstack/react-table";
import React, { useState, useRef, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { Loader2 } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { cn } from "@/shared/lib/utils";
import { useDelayedLoading } from "@/shared/hooks/useDelayedLoading";

type SkeletonShape = "line" | "pill" | "circle" | "button";

interface DataTableColumnMeta {
  className?: string;
  headerClassName?: string;
  skeletonClassName?: string;
  customSkeleton?: React.ReactNode;
  skeletonWidth?: string;
  skeletonShape?: SkeletonShape;
  pin?: "left" | "right";
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  meta?: TableMeta<TData>;
  getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string;
  onRowClick?: (row: TData) => void;
  loading?: boolean;
  loadingBehavior?: "immediate" | "delayed";
  transitionKey?: unknown;
  className?: string;
  tableClassName?: string;
  noResultsMessage?: string;
  forceEmptyState?: boolean;
  emptyStateContent?: ReactNode;
  bodyOverlay?: ReactNode;
  disableScrolling?: boolean;
  prependBodyRow?: ReactNode;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  virtualize?: boolean;
  manualSorting?: boolean;
  estimatedRowHeight?: number;
  containerHeight?: string;
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: OnChangeFn<Record<string, boolean>>;
  getRowClassName?: (row: TData) => string;
  renderRowAfter?: (row: TData, index: number) => ReactNode;
  dense?: boolean;
  isRowClickable?: (row: TData) => boolean;
  getRowAriaExpanded?: (row: TData) => boolean | undefined;
  getRowAriaLabel?: (row: TData) => string | undefined;
  skeletonRowCount?: number;
  isHeaderRow?: (row: TData) => boolean;
  renderHeaderRow?: (row: TData, columnsCount: number, style?: React.CSSProperties) => ReactNode;
  striped?: boolean;
  renderMobileCard?: (row: TData, index: number) => ReactNode;
  disableMobileCardTransformation?: boolean;
}

interface TableRowComponentProps<TData> {
  row: Row<TData>;
  onRowClick?: (data: TData) => void;
  "data-index"?: number;
  style?: React.CSSProperties;
  className?: string;
  getRowClassName?: (row: TData) => string;
  dense?: boolean;
  isRowClickable?: (row: TData) => boolean;
  getRowAriaExpanded?: (row: TData) => boolean | undefined;
  getRowAriaLabel?: (row: TData) => string | undefined;
  striped?: boolean;
}

function isInteractiveRowTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(
    "button, a, input, select, textarea, [role='button'], [role='combobox'], [data-row-click-ignore='true']",
  ));
}

function getColumnIdentifier<TData, TValue>(
  column: ColumnDef<TData, TValue>,
): string | undefined {
  if ("id" in column && typeof column.id === "string") {
    return column.id;
  }

  if ("accessorKey" in column && typeof column.accessorKey === "string") {
    return column.accessorKey;
  }

  return undefined;
}

function TableRowComponentInner<TData>(
  {
    row,
    onRowClick,
    "data-index": dataIndex,
    style,
    className,
    getRowClassName,
    dense,
    isRowClickable,
    getRowAriaExpanded,
    getRowAriaLabel,
    striped,
  }: TableRowComponentProps<TData>,
  ref: React.ForwardedRef<HTMLTableRowElement>,
) {
  const customClassName = getRowClassName ? getRowClassName(row.original) : "";
  const isClickable = isRowClickable ? isRowClickable(row.original) : !!onRowClick;

  return (
    <TableRow
      ref={ref}
      data-index={dataIndex}
      style={style}
      data-state={row.getIsSelected() && "selected"}
      tabIndex={isClickable ? 0 : undefined}
      aria-expanded={isClickable ? getRowAriaExpanded?.(row.original) : undefined}
      aria-label={isClickable ? getRowAriaLabel?.(row.original) : undefined}
      onClick={(event) => {
        if (isClickable && onRowClick && !isInteractiveRowTarget(event.target)) {
          onRowClick(row.original);
        }
      }}
      onKeyDown={(event) => {
        if (
          isClickable
          && onRowClick
          && event.target === event.currentTarget
          && (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();
          onRowClick(row.original);
        }
      }}
      className={cn(
        "text-center text-sm transition-colors",
        striped ? ((dataIndex ?? row.index) % 2 === 0 ? "bg-background" : "bg-muted") : "bg-background",
        isClickable ? "hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" : "",
        row.getIsSelected() ? "bg-muted hover:bg-slate-100 dark:hover:bg-slate-800" : "",
        customClassName,
        className,
      )}>
      {row.getVisibleCells().map((cell) => {
        const meta = cell.column.columnDef.meta as { className?: string } | undefined;
        const isPinned = cell.column.getIsPinned();
        const isLeftPinned = isPinned === "left";
        const isRightPinned = isPinned === "right";
        return (
          <TableCell
            key={cell.id}
            className={cn(
              dense ? "py-1.5 px-2" : "p-3",
              "first:pl-6 last:pr-6 whitespace-nowrap",
              meta?.className,
              isPinned ? "sticky bg-inherit z-10" : "",
              isLeftPinned ? "shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] dark:shadow-slate-800" : "",
              isRightPinned ? "shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] dark:shadow-slate-800" : ""
            )}
            style={{ 
              width: cell.column.getSize(),
              minWidth: cell.column.columnDef.minSize,
              maxWidth: cell.column.columnDef.maxSize,
              left: isLeftPinned ? `${cell.column.getStart('left')}px` : undefined,
              right: isRightPinned ? `${cell.column.getAfter('right')}px` : undefined,
            }}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        );
      })}
    </TableRow>
  );
}

const TableRowComponent = React.memo(
  React.forwardRef(TableRowComponentInner),
  (prevProps, nextProps) => {
    if (prevProps["data-index"] !== nextProps["data-index"]) return false;
    if (prevProps.dense !== nextProps.dense) return false;
    if (prevProps.striped !== nextProps.striped) return false;
    if (prevProps.className !== nextProps.className) return false;
    if (prevProps.row.getIsSelected() !== nextProps.row.getIsSelected()) return false;
    if (prevProps.row.original !== nextProps.row.original) return false;
    if (prevProps.style !== nextProps.style) {
      if (!prevProps.style || !nextProps.style) return false;
      if (
        prevProps.style.height !== nextProps.style.height ||
        prevProps.style.transform !== nextProps.style.transform ||
        prevProps.style.top !== nextProps.style.top
      ) {
        return false;
      }
    }
    const prevExpanded = prevProps.getRowAriaExpanded?.(prevProps.row.original);
    const nextExpanded = nextProps.getRowAriaExpanded?.(nextProps.row.original);
    if (prevExpanded !== nextExpanded) return false;

    if (prevProps.onRowClick !== nextProps.onRowClick) return false;
    if (prevProps.getRowClassName !== nextProps.getRowClassName) return false;
    if (prevProps.isRowClickable !== nextProps.isRowClickable) return false;

    return true;
  },
) as <TData>(
  props: TableRowComponentProps<TData> & {
    ref?: React.ForwardedRef<HTMLTableRowElement>;
  },
) => React.ReactElement;

function DefaultMobileCard<TData>({
  row,
  onRowClick,
  getRowClassName,
}: {
  row: Row<TData>;
  onRowClick?: (data: TData) => void;
  getRowClassName?: (row: TData) => string;
}) {
  const visibleCells = row.getVisibleCells();
  const dataCells = visibleCells.filter((c) => {
    const id = c.column.id.toLowerCase();
    return id !== "select" && id !== "selection";
  });

  const actionCell = dataCells.find((c) => {
    const id = c.column.id.toLowerCase();
    return id.includes("action") || id === "manage" || id === "profile";
  });

  const contentCells = dataCells.filter((c) => c !== actionCell);
  const headerCell = contentCells[0];
  const detailCells = contentCells.slice(1);

  return (
    <div
      onClick={(e) => {
        if (onRowClick && !isInteractiveRowTarget(e.target)) {
          onRowClick(row.original);
        }
      }}
      className={cn(
        "rounded-lg border border-border bg-card p-4 text-card-foreground shadow-xs transition-colors space-y-3",
        onRowClick && "cursor-pointer hover:border-primary/50 active:bg-muted/40",
        getRowClassName?.(row.original),
      )}
    >
      {headerCell && (
        <div className="font-extrabold text-base text-foreground leading-snug">
          {flexRender(headerCell.column.columnDef.cell, headerCell.getContext())}
        </div>
      )}

      {detailCells.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm pt-2 border-t border-border/50">
          {detailCells.map((cell) => {
            const header = cell.column.columnDef.header;
            let headerText = cell.column.id.replace(/_/g, " ").toUpperCase();
            if (typeof header === "string") {
              headerText = header;
            }
            return (
              <div key={cell.id} className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                  {headerText}
                </span>
                <div className="text-foreground font-medium text-sm break-words">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {actionCell && (
        <div className="pt-2 border-t border-border flex w-full [&>button]:w-full [&>a]:w-full [&_button]:w-full">
          {flexRender(actionCell.column.columnDef.cell, actionCell.getContext())}
        </div>
      )}
    </div>
  );
}

export function DataTable<TData, TValue>({
  columns,
  data,
  getRowId,
  onRowClick,
  loading = false,
  loadingBehavior = "delayed",
  transitionKey,
  className,
  tableClassName,
  noResultsMessage = "No results.",
  forceEmptyState = false,
  emptyStateContent,
  bodyOverlay,
  disableScrolling = false,
  prependBodyRow,
  sorting: externalSorting,
  onSortingChange: externalOnSortingChange,
  virtualize = true,
    manualSorting,
  estimatedRowHeight = 45,
  containerHeight = "65vh",
  rowSelection: externalRowSelection,
  onRowSelectionChange: externalOnRowSelectionChange,
  getRowClassName,
  renderRowAfter,
  dense = false,
  isRowClickable,
  getRowAriaExpanded,
  getRowAriaLabel,
  skeletonRowCount: _skeletonRowCount = 50,
  isHeaderRow,
  renderHeaderRow,
  striped = true,
  renderMobileCard,
  disableMobileCardTransformation = false,
  meta,
}: DataTableProps<TData, TValue>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const [internalRowSelection, setInternalRowSelection] = useState<RowSelectionState>({});
  const containerRef = useRef<HTMLDivElement>(null);

    // Fallback to implicit first/last column pinning if no explicit pins are set
    const explicitLeftPinned = columns.filter((c) => (c.meta as DataTableColumnMeta)?.pin === "left").map((c) => getColumnIdentifier(c)!);
    const explicitRightPinned = columns.filter((c) => (c.meta as DataTableColumnMeta)?.pin === "right").map((c) => getColumnIdentifier(c)!);

    const leftPinned = explicitLeftPinned.length > 0 
      ? explicitLeftPinned 
      : columns[0] ? [getColumnIdentifier(columns[0])!] : [];

    const rightPinned = explicitRightPinned.length > 0
      ? explicitRightPinned
      : columns.length > 1 ? [getColumnIdentifier(columns[columns.length - 1])!] : [];

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    meta,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
      manualSorting,
    onSortingChange: externalOnSortingChange ?? setInternalSorting,
    onRowSelectionChange:
      externalOnRowSelectionChange ?? setInternalRowSelection,
    initialState: {
      columnPinning: {
        left: leftPinned,
        right: rightPinned,
      },
    },
    state: {
      sorting: externalSorting ?? internalSorting,
      rowSelection: externalRowSelection ?? internalRowSelection,
      columnPinning: {
        left: leftPinned,
        right: rightPinned,
      },
    },
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: virtualize ? rows.length : 0,
    getScrollElement: () => containerRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const delayedLoading = useDelayedLoading(Boolean(loading), 350, transitionKey);
  const showLoadingRows = loadingBehavior === "immediate" ? Boolean(loading) : delayedLoading;
  const suppressEmptyDuringDelayedLoading = (Boolean(loading) || delayedLoading) && !showLoadingRows;

  return (
    <div
      className={cn(
        "rounded-md border overflow-hidden max-w-full flex flex-col h-full relative",
        className,
      )}>
      {/* Mobile Card View (< md) */}
      {!disableMobileCardTransformation && (
        <div className="block md:hidden overflow-y-auto p-3 space-y-3 flex-1 min-h-0">
          {showLoadingRows ? (
            <div className="min-h-[260px] flex flex-col items-center justify-center p-6 space-y-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-bold text-muted-foreground">Loading records...</p>
            </div>
          ) : !forceEmptyState && !suppressEmptyDuringDelayedLoading && rows.length > 0 ? (
            rows.map((row, index) => {
              if (renderMobileCard) {
                return (
                  <div
                    key={row.id}
                    onClick={(e) => {
                      if (onRowClick && !isInteractiveRowTarget(e.target)) {
                        onRowClick(row.original);
                      }
                    }}
                    className={cn(
                      "rounded-lg border border-border bg-card p-4 text-card-foreground shadow-xs transition-colors",
                      onRowClick && "cursor-pointer hover:border-primary/50 active:bg-muted/40",
                      getRowClassName?.(row.original),
                    )}
                  >
                    {renderMobileCard(row.original, index)}
                  </div>
                );
              }

              return (
                <DefaultMobileCard
                  key={row.id}
                  row={row}
                  onRowClick={onRowClick}
                  getRowClassName={getRowClassName}
                />
              );
            })
          ) : (
            <div className="min-h-[160px] flex items-center justify-center p-6 text-center text-sm font-bold text-muted-foreground">
              {noResultsMessage}
            </div>
          )}
        </div>
      )}

      {/* Desktop & Tablet Table View (>= md, or always if disableMobileCardTransformation is true) */}
      <div
        ref={containerRef}
        className={cn(
          disableMobileCardTransformation ? "flex flex-1" : "hidden md:flex flex-1",
          "relative min-h-0 w-full pb-3 flex-col",
          disableScrolling ? "overflow-hidden" : "overflow-auto"
        )}
        style={containerHeight !== "100%" ? { maxHeight: containerHeight } : undefined}>
        <Table wrapperClassName="overflow-visible" className={cn("w-full", tableClassName)}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="hover:bg-transparent border-none">
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as DataTableColumnMeta | undefined;
                  const isPinned = header.column.getIsPinned();
                  const isLeftPinned = isPinned === "left";
                  const isRightPinned = isPinned === "right";
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "text-center font-bold text-foreground dark:text-slate-200 text-sm px-3 sticky top-0 border-b border-slate-200 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-sm",
                        "first:pl-6 last:pr-6",
                        dense ? "h-8" : "h-11",
                        isPinned ? "z-30" : "z-20",
                        isLeftPinned ? "shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] dark:shadow-slate-800" : "",
                        isRightPinned ? "shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] dark:shadow-slate-800" : "",
                        meta?.headerClassName || meta?.className
                      )}
                      style={{
                        width: header.column.getSize(),
                        minWidth: header.column.columnDef.minSize,
                        maxWidth: header.column.columnDef.maxSize,
                        left: isLeftPinned ? `${header.column.getStart('left')}px` : undefined,
                        right: isRightPinned ? `${header.column.getAfter('right')}px` : undefined,
                      }}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          {showLoadingRows ? (
            <TableBody className="relative">
              <TableRow key="loading">
                <TableCell colSpan={columns.length} className="p-0">
                  <div className="min-h-[460px] flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <div className="flex flex-col items-center space-y-1">
                      <p className="text-2xl font-extrabold text-foreground">Loading...</p>
                      <p className="text-base text-muted-foreground">Fetching records...</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : !forceEmptyState && !suppressEmptyDuringDelayedLoading && rows.length > 0 ? (
            <TableBody className="relative">
              {prependBodyRow}
              {virtualize
                ? [
                  virtualItems.length > 0 && (
                    <TableRow
                      key="virtual-padding-top"
                      style={{ height: `${virtualItems[0].start}px` }}
                      className="hover:bg-transparent border-none">
                      <TableCell
                        colSpan={columns.length}
                        className="p-0"
                      />
                    </TableRow>
                  ),
                  ...virtualItems.map((virtualRow) => {
                    const rowData = rows[virtualRow.index].original;
                    const isHeader = isHeaderRow?.(rowData);

                    if (isHeader && renderHeaderRow) {
                      const renderedHeader = renderHeaderRow(rowData, columns.length);

                      return (
                        <React.Fragment key={rows[virtualRow.index].id}>
                          {React.isValidElement(renderedHeader)
                            ? React.cloneElement(renderedHeader as React.ReactElement<{
                              ref?: typeof rowVirtualizer.measureElement;
                              "data-index"?: number;
                            }>, {
                              ref: rowVirtualizer.measureElement,
                              "data-index": virtualRow.index
                            })
                            : renderedHeader}
                        </React.Fragment>
                      );
                    }

                    return (
                      <TableRowComponent
                        key={rows[virtualRow.index].id}
                        ref={rowVirtualizer.measureElement}
                        data-index={virtualRow.index}
                        row={rows[virtualRow.index]}
                        onRowClick={onRowClick}
                        getRowClassName={getRowClassName}
                        dense={dense}
                        isRowClickable={isRowClickable}
                        getRowAriaExpanded={getRowAriaExpanded}
                        getRowAriaLabel={getRowAriaLabel}
                        striped={striped}
                      />
                    );
                  }),
                  virtualItems.length > 0 && (
                    <TableRow
                      key="virtual-padding-bottom"
                      style={{
                        height: `${rowVirtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end}px`,
                      }}
                      className="hover:bg-transparent border-none">
                      <TableCell
                        colSpan={columns.length}
                        className="p-0"
                      />
                    </TableRow>
                  ),
                ]
                : rows.map((row, index) => {
                  const isHeader = isHeaderRow?.(row.original);

                  if (isHeader && renderHeaderRow) {
                    return (
                      <React.Fragment key={row.id}>
                        {renderHeaderRow(row.original, columns.length)}
                      </React.Fragment>
                    );
                  }

                  return (
                    <React.Fragment key={row.id}>
                      <TableRowComponent
                        data-index={index}
                        row={row}
                        onRowClick={onRowClick}
                        getRowClassName={getRowClassName}
                        dense={dense}
                        isRowClickable={isRowClickable}
                        getRowAriaExpanded={getRowAriaExpanded}
                        getRowAriaLabel={getRowAriaLabel}
                        striped={striped}
                      />
                      {renderRowAfter?.(row.original, row.index)}
                    </React.Fragment>
                  );
                })}
            </TableBody>
          ) : prependBodyRow ? (
            <TableBody className="relative">
              {prependBodyRow}
            </TableBody>
          ) : suppressEmptyDuringDelayedLoading ? (
            <TableBody className="relative">
              <TableRow key="delayed-loading-gap">
                <TableCell
                  colSpan={columns.length}
                  className="p-0">
                  <div className="h-24" aria-hidden="true" />
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody className="relative">
              <TableRow key="no-results" className="hover:bg-transparent border-none">
                <TableCell
                  colSpan={columns.length}
                  className="p-0 border-none">
                  {/* Invisible spacer to maintain table structure and minimum height if needed */}
                  <div className="min-h-[400px] w-full" aria-hidden="true" />
                </TableCell>
              </TableRow>
            </TableBody>
          )}
        </Table>
      </div>

      {!showLoadingRows && !forceEmptyState && !suppressEmptyDuringDelayedLoading && rows.length === 0 && (
        <div
          className={cn(
            "hidden md:flex absolute inset-x-0 bottom-0 z-20 items-center justify-center bg-background/80 backdrop-blur-[2px]",
            dense ? "top-8" : "top-11"
          )}
        >
          <div className="pointer-events-auto h-full flex flex-col items-center justify-center w-full">
            {emptyStateContent ?? (
              <div className="flex flex-col items-center justify-center text-center font-bold">
                {noResultsMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {bodyOverlay && (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 top-11 z-40",
            dense && "top-8",
          )}
        >
          {bodyOverlay}
        </div>
      )}
    </div>
  );
}
