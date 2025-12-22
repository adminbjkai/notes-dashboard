"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Plus, FileText, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createNote, updateNote, deleteNote } from "@/lib/api";
import type { Note } from "@/types/note";

interface PageListProps {
  pages: Note[];
}

export function PageList({ pages }: PageListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if ((editingId || isCreating) && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId, isCreating]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleCreatePage() {
    setIsCreating(true);
    setEditingTitle("Untitled");
  }

  async function handleCreateSubmit() {
    if (!editingTitle.trim()) {
      setIsCreating(false);
      setEditingTitle("");
      return;
    }

    try {
      const newPage = await createNote({ title: editingTitle.trim() });
      setIsCreating(false);
      setEditingTitle("");
      router.push(`/notes/${newPage.id}`);
      router.refresh();
    } catch (err) {
      console.error("Failed to create page:", err);
      setIsCreating(false);
    }
  }

  function handleStartRename(page: Note) {
    setEditingId(page.id);
    setEditingTitle(page.title);
    setMenuOpenId(null);
  }

  async function handleRenameSubmit(pageId: string) {
    if (!editingTitle.trim()) {
      setEditingId(null);
      setEditingTitle("");
      return;
    }

    try {
      await updateNote(pageId, { title: editingTitle.trim() });
      setEditingId(null);
      setEditingTitle("");
      router.refresh();
    } catch (err) {
      console.error("Failed to rename page:", err);
    }
  }

  async function handleDelete(page: Note) {
    if (!confirm(`Delete "${page.title}"?`)) {
      return;
    }

    try {
      await deleteNote(page.id);
      setMenuOpenId(null);
      // Navigate away if we're on the deleted page
      if (pathname === `/notes/${page.id}`) {
        router.push("/");
      }
      router.refresh();
    } catch (err) {
      console.error("Failed to delete page:", err);
    }
  }

  function handleKeyDown(
    e: React.KeyboardEvent,
    action: () => void,
    cancel: () => void
  ) {
    if (e.key === "Enter") {
      e.preventDefault();
      action();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  }

  const currentPageId = pathname.startsWith("/notes/")
    ? pathname.split("/notes/")[1]
    : null;

  return (
    <div className="flex h-full flex-col">
      {/* Page list */}
      <nav className="flex-1 overflow-y-auto p-2">
        {pages.length === 0 && !isCreating ? (
          <div className="px-2 py-8 text-center">
            <p className="text-xs text-gray-400">No pages yet</p>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {pages.map((page) => {
              const isActive = currentPageId === page.id;
              const isEditing = editingId === page.id;

              return (
                <li key={page.id} className="relative">
                  {isEditing ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => handleRenameSubmit(page.id)}
                      onKeyDown={(e) =>
                        handleKeyDown(
                          e,
                          () => handleRenameSubmit(page.id),
                          () => {
                            setEditingId(null);
                            setEditingTitle("");
                          }
                        )
                      }
                      className="w-full rounded px-2 py-1.5 text-sm outline-none ring-2 ring-gray-400"
                    />
                  ) : (
                    <div
                      className={cn(
                        "group flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm",
                        "hover:bg-gray-100 transition-colors cursor-pointer",
                        isActive && "bg-gray-100 font-medium"
                      )}
                    >
                      <div
                        className="flex flex-1 items-center gap-2 min-w-0"
                        onClick={() => router.push(`/notes/${page.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            router.push(`/notes/${page.id}`);
                          }
                        }}
                      >
                        <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                        <span className="flex-1 truncate">{page.title}</span>
                      </div>
                      <div
                        className={cn(
                          "opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
                          menuOpenId === page.id && "opacity-100"
                        )}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(
                              menuOpenId === page.id ? null : page.id
                            );
                          }}
                          className="rounded p-0.5 hover:bg-gray-200"
                        >
                          <MoreHorizontal className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Context menu */}
                  {menuOpenId === page.id && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 top-full z-10 mt-1 w-36 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
                    >
                      <button
                        onClick={() => handleStartRename(page)}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Rename
                      </button>
                      <button
                        onClick={() => handleDelete(page)}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  )}
                </li>
              );
            })}

            {/* New page input */}
            {isCreating && (
              <li>
                <input
                  ref={inputRef}
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={handleCreateSubmit}
                  onKeyDown={(e) =>
                    handleKeyDown(e, handleCreateSubmit, () => {
                      setIsCreating(false);
                      setEditingTitle("");
                    })
                  }
                  placeholder="Page title..."
                  className="w-full rounded px-2 py-1.5 text-sm outline-none ring-2 ring-gray-400"
                />
              </li>
            )}
          </ul>
        )}
      </nav>

      {/* New page button */}
      <div className="shrink-0 border-t border-gray-200 p-2">
        <button
          onClick={handleCreatePage}
          disabled={isCreating}
          className={cn(
            "flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-600",
            "hover:bg-gray-100 transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <Plus className="h-4 w-4" />
          New Page
        </button>
      </div>
    </div>
  );
}
