import type { Note, NoteCreate, NoteUpdate, NoteReorder, NoteTreeNode } from "@/types/note";

// Re-export types for convenience
export type { Note, NoteCreate, NoteUpdate, NoteReorder, NoteTreeNode } from "@/types/note";

export function getApiUrl(): string {
  if (typeof window === "undefined") {
    // Server-side: requires API_URL (e.g., http://backend:8000 in Docker)
    const url = process.env.API_URL;
    if (!url) {
      throw new Error("API_URL environment variable is not set");
    }
    return url;
  }
  // Client-side: requires NEXT_PUBLIC_API_URL (e.g., http://localhost:8000)
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_API_URL environment variable is not set");
  }
  return url;
}

export async function createNote(data: NoteCreate): Promise<Note> {
  const res = await fetch(`${getApiUrl()}/api/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("Failed to create note");
  }
  return res.json();
}

export async function updateNote(id: string, data: NoteUpdate): Promise<Note> {
  const res = await fetch(`${getApiUrl()}/api/notes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("Failed to update note");
  }
  return res.json();
}

export async function reorderNote(id: string, data: NoteReorder): Promise<Note> {
  const res = await fetch(`${getApiUrl()}/api/notes/${id}/reorder`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("Failed to reorder note");
  }
  return res.json();
}

export async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`${getApiUrl()}/api/notes/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to delete note");
  }
}

export async function resetNotes(): Promise<void> {
  const res = await fetch(`${getApiUrl()}/api/notes/reset/all`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to reset notes");
  }
}

export async function getNotes(): Promise<Note[]> {
  const res = await fetch(`${getApiUrl()}/api/notes`, {
    cache: "no-store",
  });
  if (!res.ok) {
    return [];
  }
  return res.json();
}

export async function getNote(id: string): Promise<Note | null> {
  const res = await fetch(`${getApiUrl()}/api/notes/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    return null;
  }
  return res.json();
}

/**
 * Convert a flat list of notes into a tree structure for the sidebar.
 */
export function buildNoteTree(notes: Note[]): NoteTreeNode[] {
  const nodeMap = new Map<string, NoteTreeNode>();
  const parentMap = new Map<string, string | null>();
  const rootNodes: NoteTreeNode[] = [];

  // First pass: create tree nodes
  for (const note of notes) {
    nodeMap.set(note.id, { ...note, children: [] });
    parentMap.set(note.id, note.parent_id ?? null);
  }

  const wouldCreateCycle = (noteId: string, parentId: string): boolean => {
    if (noteId === parentId) return true;
    let current: string | null = parentId;
    const seen = new Set<string>();
    while (current) {
      if (current === noteId) return true;
      if (seen.has(current)) return true;
      seen.add(current);
      current = parentMap.get(current) ?? null;
    }
    return false;
  };

  // Second pass: build the tree
  for (const note of notes) {
    const node = nodeMap.get(note.id)!;
    if (
      note.parent_id &&
      nodeMap.has(note.parent_id) &&
      !wouldCreateCycle(note.id, note.parent_id)
    ) {
      nodeMap.get(note.parent_id)!.children.push(node);
    } else {
      rootNodes.push(node);
    }
  }

  // Sort children by position
  const sortByPosition = (nodes: NoteTreeNode[]) => {
    nodes.sort((a, b) => a.position - b.position);
    for (const node of nodes) {
      sortByPosition(node.children);
    }
  };

  sortByPosition(rootNodes);
  return rootNodes;
}
