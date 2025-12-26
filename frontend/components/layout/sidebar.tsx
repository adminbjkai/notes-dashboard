"use client";

import { useState, useEffect } from "react";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageTree } from "./page-tree";
import { ThemeToggle } from "@/components/theme-toggle";
import { resetNotes } from "@/lib/api";
import type { Note } from "@/types/note";

interface SidebarProps {
  pages: Note[];
  className?: string;
}

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

export function Sidebar({ pages, className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newState));
  };

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg transition-all duration-200",
        isCollapsed ? "w-12" : "w-64",
        className
      )}
    >
      <div className={cn(
        "flex h-12 shrink-0 items-center border-b border-gray-200 dark:border-dark-border",
        isCollapsed ? "justify-center px-2" : "justify-between px-3"
      )}>
        {!isCollapsed && (
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Pages</h2>
        )}
        <div className={cn("flex items-center", !isCollapsed && "gap-1")}>
          {!isCollapsed && <ThemeToggle />}
          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              "flex items-center justify-center rounded-md p-1.5",
              "text-gray-600 dark:text-gray-400",
              "hover:bg-gray-100 dark:hover:bg-gray-800",
              "transition-colors"
            )}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          <PageTree pages={pages} />

          <footer className="mt-auto border-t border-gray-200 dark:border-dark-border px-3 py-2">
            <button
              type="button"
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
                "flex w-full items-center justify-center rounded px-3 py-1.5 text-xs text-red-600",
                "hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              )}
            >
              Reset Data
            </button>
          </footer>
        </>
      )}
    </aside>
  );
}
