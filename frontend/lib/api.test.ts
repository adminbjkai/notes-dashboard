import { describe, it, expect } from "vitest";
import { buildNoteTree } from "./api";
import type { Note } from "../types/note";

const baseNote = (overrides: Partial<Note>): Note => ({
  id: "note",
  title: "Note",
  content: null,
  sidenote: null,
  parent_id: null,
  position: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

describe("buildNoteTree cycle guard", () => {
  it("builds a normal parent-child tree", () => {
    const parent = baseNote({ id: "parent", title: "Parent" });
    const child = baseNote({ id: "child", title: "Child", parent_id: "parent" });

    const tree = buildNoteTree([parent, child]);

    expect(tree).toHaveLength(1);
    expect(tree[0]?.id).toBe("parent");
    expect(tree[0]?.children).toHaveLength(1);
    expect(tree[0]?.children[0]?.id).toBe("child");
  });

  it("keeps a self-referencing note at the root", () => {
    const note = baseNote({ id: "self", title: "Self", parent_id: "self" });

    const tree = buildNoteTree([note]);

    expect(tree).toHaveLength(1);
    expect(tree[0]?.id).toBe("self");
    expect(tree[0]?.children).toHaveLength(0);
  });

  it("breaks deep circular references", () => {
    const noteA = baseNote({ id: "a", title: "A", parent_id: "b" });
    const noteB = baseNote({ id: "b", title: "B", parent_id: "c" });
    const noteC = baseNote({ id: "c", title: "C", parent_id: "a" });

    const tree = buildNoteTree([noteA, noteB, noteC]);

    expect(tree).toHaveLength(3);
    for (const node of tree) {
      expect(node.children).toHaveLength(0);
    }
  });
});
