"use client";

import { cn } from "@/lib/utils";
import { PageTree } from "./page-tree";
import { ThemeToggle } from "@/components/theme-toggle";
import { resetNotes } from "@/lib/api";
import type { Note } from "@/types/note";

interface SidebarProps {
  pages: Note[];
  className?: string;
}

/**
 * Sidebar component for page navigation.
 * Renders hierarchical page tree with CRUD and drag-and-drop.
 */
export function Sidebar({ pages, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 transition-colors",
        className
      )}
    >
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-gray-200 dark:border-gray-800 px-4">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Pages</h2>
        <ThemeToggle />
      </div>

      {/* Page tree with CRUD */}
      <PageTree pages={pages} />

      <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 px-4 py-3">
        <button
          onClick={async () => {
            if (!confirm("Delete all notes? This cannot be undone.")) return;
            try {
              await resetNotes();
              window.location.reload();
            } catch (err) {
              console.error("Failed to reset notes:", err);
              alert("Failed to reset notes. Check the console for details.");
            }
          }}
          className={cn(
            "flex w-full items-center justify-center rounded px-3 py-2 text-xs text-red-600",
            "hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          )}
        >
          Reset Data
        </button>
      </footer>
    </aside>
  );
}
