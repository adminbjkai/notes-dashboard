"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { createNote, updateNote, deleteNote } from "@/lib/api";
import type { Note } from "@/types/note";

interface NoteFormProps {
  note?: Note;
}

export function NoteForm({ note }: NoteFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [sidenote, setSidenote] = useState(note?.sidenote ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!note;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditing && note) {
        await updateNote(note.id, { title, content, sidenote });
      } else {
        await createNote({ title, content, sidenote });
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!note || !confirm("Are you sure you want to delete this note?")) {
      return;
    }

    setIsSubmitting(true);

    try {
      await deleteNote(note.id);
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Title
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          required
        />
      </div>

      {/* Content - Rich Text Editor */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Content
        </label>
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder="Write your note here..."
        />
      </div>

      {/* Sidenote */}
      <div>
        <label
          htmlFor="sidenote"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Sidenote
        </label>
        <Textarea
          id="sidenote"
          value={sidenote}
          onChange={(e) => setSidenote(e.target.value)}
          placeholder="Optional sidenote..."
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isEditing ? "Save Changes" : "Create Note"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/")}
          >
            Cancel
          </Button>
        </div>

        {isEditing && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        )}
      </div>
    </form>
  );
}

