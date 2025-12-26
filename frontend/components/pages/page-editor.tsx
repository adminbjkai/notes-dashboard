"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, PanelTop } from "lucide-react";
import { RichTextEditor, EditorToolbar, type Editor } from "@/components/editor/rich-text-editor";
import { updateNote } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Note } from "@/types/note";

interface PageEditorProps {
  page: Note;
}

const FULL_WIDTH_KEY = "editor-full-width";
const SHOW_TOOLBAR_KEY = "editor-show-toolbar";

/**
 * Document-style page editor with:
 * - Inline editable title (looks like a heading, not a form field)
 * - Full-width content editor
 * - Auto-save on changes (debounced)
 */
export function PageEditor({ page }: PageEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isFullWidth, setIsFullWidth] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [editor, setEditor] = useState<Editor | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  // Load preferences from localStorage
  useEffect(() => {
    const storedWidth = localStorage.getItem(FULL_WIDTH_KEY);
    if (storedWidth === "true") {
      setIsFullWidth(true);
    }
    const storedToolbar = localStorage.getItem(SHOW_TOOLBAR_KEY);
    if (storedToolbar === "false") {
      setShowToolbar(false);
    }
  }, []);

  const toggleFullWidth = () => {
    const newState = !isFullWidth;
    setIsFullWidth(newState);
    localStorage.setItem(FULL_WIDTH_KEY, String(newState));
  };

  const toggleToolbar = () => {
    const newState = !showToolbar;
    setShowToolbar(newState);
    localStorage.setItem(SHOW_TOOLBAR_KEY, String(newState));
  };

  // Auto-resize title textarea
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = "auto";
      titleRef.current.style.height = titleRef.current.scrollHeight + "px";
    }
  }, [title]);

  // Debounced auto-save
  const saveChanges = useCallback(
    async (newTitle: string, newContent: string) => {
      setIsSaving(true);
      try {
        await updateNote(page.id, {
          title: newTitle.trim() || "Untitled",
          content: newContent,
        });
        setLastSaved(new Date());
        router.refresh(); // Refresh sidebar
      } catch (err) {
        console.error("Failed to save:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [page.id, router]
  );

  const debouncedSave = useCallback(
    (newTitle: string, newContent: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveChanges(newTitle, newContent);
      }, 800);
    },
    [saveChanges]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  function handleTitleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newTitle = e.target.value;
    setTitle(newTitle);
    debouncedSave(newTitle, content);
  }

  function handleContentChange(newContent: string) {
    setContent(newContent);
    debouncedSave(title, newContent);
  }

  function handleTitleKeyDown(e: React.KeyboardEvent) {
    // Enter moves to content editor
    if (e.key === "Enter") {
      e.preventDefault();
      // Focus the editor - we'll need to expose this
    }
  }

  return (
    <div className={cn(
      "mx-auto px-8 py-6 transition-all duration-200",
      isFullWidth ? "max-w-none" : "max-w-3xl"
    )}>
      {/* Header with status and controls */}
      <div className="mb-4 flex items-center justify-end gap-4 text-xs">
        {/* Toolbar toggle */}
        <button
          type="button"
          onClick={toggleToolbar}
          title={showToolbar ? "Hide toolbar" : "Show toolbar"}
          className={cn(
            "p-1.5 rounded transition-colors",
            showToolbar
              ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
              : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          )}
        >
          <PanelTop className="h-4 w-4" />
        </button>

        {/* Full width toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <ArrowLeftRight className="h-4 w-4 text-gray-400" />
          <span className="text-gray-500 dark:text-gray-400">Full width</span>
          <button
            type="button"
            role="switch"
            aria-checked={isFullWidth}
            onClick={toggleFullWidth}
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
              isFullWidth
                ? "bg-blue-600"
                : "bg-gray-300 dark:bg-gray-600"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
                isFullWidth ? "translate-x-[18px]" : "translate-x-0.5"
              )}
            />
          </button>
        </label>

        {/* Status indicator */}
        <span className="text-gray-400">
          {isSaving ? "Saving..." : lastSaved ? "Saved" : null}
        </span>
      </div>

      {/* Editor toolbar - above title */}
      {showToolbar && editor && (
        <div className="mb-4 -mx-8 px-8 py-1 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 transition-colors">
          <EditorToolbar editor={editor} />
        </div>
      )}

      {/* Title - editable, looks like a heading */}
      <textarea
        ref={titleRef}
        value={title}
        onChange={handleTitleChange}
        onKeyDown={handleTitleKeyDown}
        placeholder="Untitled"
        rows={1}
        className="mb-4 w-full resize-none overflow-hidden border-none bg-transparent text-4xl font-bold text-gray-900 dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:ring-0"
      />

      {/* Content editor */}
      <div className="prose-container">
        <RichTextEditor
          content={content}
          onChange={handleContentChange}
          placeholder="Start writing, or press / for commands..."
          className="min-h-[60vh]"
          onEditorReady={setEditor}
        />
      </div>
    </div>
  );
}
