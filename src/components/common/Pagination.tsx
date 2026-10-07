import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
  compact?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 25, 50],
  itemLabel = "items",
  className = "",
  compact = false,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (safePage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (safePage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      safePage - 1,
      safePage,
      safePage + 1,
      "...",
      totalPages,
    ];
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 ${className}`}
    >
      {/* Left: Summary Count */}
      <div className="flex items-center gap-2">
        <span>
          Showing{" "}
          <strong className="font-bold text-slate-900 dark:text-white">
            {startItem}
          </strong>{" "}
          to{" "}
          <strong className="font-bold text-slate-900 dark:text-white">
            {endItem}
          </strong>{" "}
          of{" "}
          <strong className="font-bold text-slate-900 dark:text-white">
            {totalItems}
          </strong>{" "}
          {itemLabel}
        </span>

        {/* Page Size Selector */}
        {onPageSizeChange && pageSizeOptions.length > 1 && (
          <div className="flex items-center gap-1.5 ml-3 pl-3 border-l border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-400">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page Navigation Buttons */}
      <div className="flex items-center gap-1 ml-auto">
        {!compact && (
          <button
            onClick={() => onPageChange(1)}
            disabled={safePage <= 1}
            title="First Page"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          title="Previous Page"
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 px-2"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-xs font-medium">Prev</span>
        </button>

        {/* Page Number Buttons */}
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, idx) => {
            if (typeof p === "string") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-slate-400 font-bold select-none"
                >
                  ...
                </span>
              );
            }

            const isActive = p === safePage;
            return (
              <button
                key={`page-${p}`}
                onClick={() => onPageChange(p)}
                className={`min-w-[30px] h-[30px] px-2 rounded-lg text-xs font-bold transition ${
                  isActive
                    ? "bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30"
                    : "border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Mobile active indicator */}
        <span className="sm:hidden px-2 text-xs font-bold text-slate-800 dark:text-slate-200">
          Page {safePage} / {totalPages}
        </span>

        <button
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          title="Next Page"
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 px-2"
        >
          <span className="hidden sm:inline text-xs font-medium">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {!compact && (
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={safePage >= totalPages}
            title="Last Page"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

