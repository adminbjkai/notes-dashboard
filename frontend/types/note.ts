export interface Note {
  id: string;
  title: string;
  content: string | null;
  sidenote: string | null;
  parent_id: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface NoteCreate {
  title: string;
  content?: string | null;
  sidenote?: string | null;
  parent_id?: string | null;
}

export interface NoteUpdate {
  title?: string;
  content?: string | null;
  sidenote?: string | null;
  parent_id?: string | null;
  position?: number;
}

export interface NoteReorder {
  parent_id: string | null;
  position: number;
}

// Tree structure for sidebar
export interface NoteTreeNode extends Note {
  children: NoteTreeNode[];
}
