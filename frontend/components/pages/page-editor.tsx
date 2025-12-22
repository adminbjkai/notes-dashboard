"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { updateNote } from "@/lib/api";
import type { Note } from "@/types/note";

interface PageEditorProps {
  page: Note;
}

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
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);

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
    <div className="mx-auto max-w-3xl px-8 py-12">
      {/* Status indicator */}
      <div className="mb-8 flex items-center justify-end gap-2 text-xs text-gray-400">
        {isSaving ? (
          <span>Saving...</span>
        ) : lastSaved ? (
          <span>Saved</span>
        ) : null}
      </div>

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
        />
      </div>
    </div>
  );
}
