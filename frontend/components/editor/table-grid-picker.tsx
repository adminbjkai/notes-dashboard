"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface TableGridPickerProps {
  onSelect: (rows: number, cols: number) => void;
  maxRows?: number;
  maxCols?: number;
}

/**
 * Grid picker for selecting table dimensions.
 * Hover over cells to select rows x columns, click to confirm.
 */
export function TableGridPicker({
  onSelect,
  maxRows = 6,
  maxCols = 6,
}: TableGridPickerProps) {
  const [hoverRows, setHoverRows] = useState(2);
  const [hoverCols, setHoverCols] = useState(4);

  const handleMouseEnter = useCallback((row: number, col: number) => {
    setHoverRows(row);
    setHoverCols(col);
  }, []);

  const handleClick = useCallback(() => {
    onSelect(hoverRows, hoverCols);
  }, [onSelect, hoverRows, hoverCols]);

  return (
    <div className="p-2">
      <div className="mb-2 text-xs text-gray-500 dark:text-gray-400 text-center">
        {hoverRows} × {hoverCols} table
      </div>
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${maxCols}, 1fr)`,
        }}
      >
        {Array.from({ length: maxRows }, (_, rowIndex) =>
          Array.from({ length: maxCols }, (_, colIndex) => {
            const row = rowIndex + 1;
            const col = colIndex + 1;
            const isSelected = row <= hoverRows && col <= hoverCols;

            return (
              <button
                key={`${row}-${col}`}
                type="button"
                onMouseEnter={() => handleMouseEnter(row, col)}
                onClick={handleClick}
                className={cn(
                  "w-5 h-5 rounded-sm border transition-colors",
                  isSelected
                    ? "bg-blue-500 border-blue-600"
                    : "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-blue-400"
                )}
                aria-label={`${row} rows, ${col} columns`}
              />
            );
          })
        )}
      </div>
      <div className="mt-2 text-xs text-gray-400 dark:text-gray-500 text-center">
        Click to insert
      </div>
    </div>
  );
}
