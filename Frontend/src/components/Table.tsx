import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";

interface ColumnMeta {
  align?: "left" | "right" | "center";
}

interface TableProps<T> {
  columns: ColumnDef<T, any>[]; 
  data: T[];
  className?: string;
  emptyMessage?: string;
  pagination?: boolean;
  pageSize?: number;
}

export function Table<T extends object>({
  columns,
  data,
  className,
  emptyMessage = "Sin resultados",
  pagination = true,
  pageSize = 5,
}: TableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(pagination
      ? {
          getPaginationRowModel: getPaginationRowModel(),
          initialState: {
            pagination: {
              pageSize,
            },
          },
        }
      : {}),
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  // Páginas visibles en la barra (máximo 5)
  const visiblePages = React.useMemo(() => {
    const total = pageCount;
    const current = pageIndex;
    const rangeSize = 5;
    const half = Math.floor(rangeSize / 2);

    let start = Math.max(0, current - half);
    let end = start + rangeSize;

    if (end > total) {
      end = total;
      start = Math.max(0, end - rangeSize);
    }

    return Array.from({ length: end - start }, (_, i) => start + i);
  }, [pageIndex, pageCount]);

  return (
    <div className={`overflow-x-auto ${className ?? ""}`}>
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
            {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                    const align = (header.column.columnDef.meta as ColumnMeta)?.align ?? "left";
                    return (
                    <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none text-${align}`}
                    >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" && " 🔼"}
                        {header.column.getIsSorted() === "desc" && " 🔽"}
                    </th>
                    );
                })}
                </tr>
            ))}
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
            {table.getRowModel().rows.length === 0 ? (
                <tr>
                <td colSpan={columns.length} className="text-center py-6 text-gray-500">
                    {emptyMessage}
                </td>
                </tr>
            ) : (
                table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => {
                    const align = (cell.column.columnDef.meta as ColumnMeta)?.align ?? "left";
                    return (
                        <td
                        key={cell.id}
                        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-${align}`}
                        >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                    );
                    })}
                </tr>
                ))
            )}
            </tbody>
        </table>

        {/* Paginación */}
        {pagination && pageCount > 1 && (
        <div className="flex justify-between items-center mt-2 text-sm py-2">
            <div className="text-gray-600 font-medium">
            Página <span className="font-bold">{pageIndex + 1}</span> de <span className="font-bold">{pageCount}</span>
            </div>
            <div className="flex items-center gap-1">
            <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 rounded-lg border text-sm font-medium bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Anterior
            </button>

            {visiblePages.map((pg) => (
                <button
                key={pg}
                onClick={() => table.setPageIndex(pg)}
                className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all border ${
                    pg === pageIndex
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white text-gray-700 hover:bg-blue-100 border-gray-300"
                }`}
                >
                {pg + 1}
                </button>
            ))}

            <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 rounded-lg border text-sm font-medium bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Siguiente
            </button>
            </div>
        </div>
        )}
    </div>
  );
}
