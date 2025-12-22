import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Note } from "@/types/note";

interface NoteCardProps {
  note: Note;
}

/**
 * Strip markdown syntax for cleaner card preview.
 * Converts markdown to plain text for display in note cards.
 */
function getMarkdownPreview(content: string, maxLength: number = 150): string {
  let plain = content
    .replace(/#{1,6}\s/g, "") // Remove headings
    .replace(/\*\*(.+?)\*\*/g, "$1") // Remove bold
    .replace(/\*(.+?)\*/g, "$1") // Remove italic
    .replace(/`{3}[\s\S]*?`{3}/g, "[code]") // Replace code blocks
    .replace(/`([^`]+)`/g, "$1") // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links, keep text
    .replace(/^[>\-\*]\s/gm, "") // Remove list/quote markers
    .replace(/\|[^|]+\|/g, "") // Remove table content
    .replace(/\n+/g, " ") // Collapse newlines
    .trim();

  if (plain.length > maxLength) {
    plain = plain.substring(0, maxLength).trim() + "...";
  }

  return plain;
}

export function NoteCard({ note }: NoteCardProps) {
  const preview = note.content ? getMarkdownPreview(note.content) : null;

  return (
    <Link href={`/notes/${note.id}`}>
      <Card className="transition-colors hover:border-gray-300">
        <CardHeader>
          <h2 className="font-medium text-gray-900">{note.title}</h2>
        </CardHeader>
        <CardContent>
          {preview && (
            <p className="line-clamp-2 text-sm text-gray-600">{preview}</p>
          )}
          {note.sidenote && (
            <p className="mt-1 text-xs text-gray-400 italic">{note.sidenote}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

