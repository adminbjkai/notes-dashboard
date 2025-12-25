"use client";

import { useState, useRef, useEffect, useMemo, useId } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  DndContext,
  DragCancelEvent,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronRight,
  FilePlus,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createNote, updateNote, deleteNote, reorderNote, buildNoteTree } from "@/lib/api";
import type { Note, NoteTreeNode } from "@/types/note";

interface PageTreeProps {
  pages: Note[];
}

// Special drop zone for moving items to root level (implicit when dragging far left)
const ROOT_DROP_ID = "__ROOT_DROP_ZONE__";

// A droppable element on the left side that accepts drops to move items to root level
function RootDropZone({ isActive }: { isActive: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: ROOT_DROP_ID });

  if (!isActive) return null;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "absolute left-0 top-0 bottom-0 w-5 z-10", // 20px wide strip for root drop zone
        isOver && "bg-blue-100/50 dark:bg-blue-900/30"
      )}
      data-root-drop-zone
    />
  );
}

type DropPosition = "before" | "after" | "on";

type DropTarget = {
  id: string;
  position: DropPosition;
};

interface TreeItemProps {
  node: NoteTreeNode;
  isActive: boolean;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onNavigate: (id: string) => void;
  onStartRename: (node: NoteTreeNode) => void;
  onDelete: (node: NoteTreeNode) => void;
  onCreateSubpage: (parentId: string) => void;
  menuOpenId: string | null;
  setMenuOpenId: (id: string | null) => void;
  invalidTargets: Set<string>;
  dropTarget: DropTarget | null;
  // For rendering new subpage input
  createParentId: string | null;
  isCreating: boolean;
  renderEditInput: () => React.ReactNode;
  // For inline rename
  editingId: string | null;
}

function SortableTreeItem({
  node,
  isActive,
  expandedIds,
  onToggleExpand,
  onNavigate,
  onStartRename,
  onDelete,
  onCreateSubpage,
  menuOpenId,
  setMenuOpenId,
  invalidTargets,
  dropTarget,
  createParentId,
  isCreating,
  renderEditInput,
  editingId,
}: TreeItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isInvalidTarget = invalidTargets.has(node.id);
  const indicatorPosition = dropTarget?.id === node.id ? dropTarget.position : null;
  const isNestTarget = indicatorPosition === "on" && !isInvalidTarget;

  // Visual feedback for outdent mode: highlight parent if child is drop target with "after"
  const isOutdentParentTarget = node.children.some(
    (child) => dropTarget?.id === child.id && dropTarget?.position === "after" && child.parent_id === node.id
  );

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={cn(
          "group relative flex items-center gap-1 rounded px-1 py-1 text-sm",
          "hover:bg-gray-100 dark:hover:bg-dark-elevated transition-colors",
          isActive && "bg-gray-100 dark:bg-dark-elevated font-medium",
          isDragging && "opacity-50",
          isNestTarget && "bg-blue-100/80 dark:bg-blue-900/30 ring-2 ring-blue-400/50 dark:ring-blue-600/50",
          isOutdentParentTarget && "bg-indigo-50/60 dark:bg-indigo-900/20 ring-1 ring-indigo-300/40",
          isOver &&
            isInvalidTarget &&
            "border border-red-400 bg-red-50/70 dark:bg-red-900/30 cursor-not-allowed"
        )}
      >
        {indicatorPosition === "before" && (
          <div className="pointer-events-none absolute left-2 right-2 top-0 h-1 bg-blue-500" />
        )}
        {indicatorPosition === "after" && (
          <div className="pointer-events-none absolute left-2 right-2 bottom-0 h-1 bg-blue-500" />
        )}
        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity p-0.5 min-h-[20px] min-w-[20px] flex items-center justify-center"
          style={isDragging ? { opacity: 1 } : undefined}
          data-dnd-handle
        >
          <GripVertical className="h-3 w-3 text-gray-400" />
        </button>

        {/* Expand/collapse toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            hasChildren && onToggleExpand(node.id);
          }}
          className={cn(
            "p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700",
            !hasChildren && "invisible"
          )}
        >
          <ChevronRight
            className={cn(
              "h-3 w-3 text-gray-400 transition-transform",
              isExpanded && "rotate-90"
            )}
          />
        </button>

        {/* Page title or inline rename input */}
        <div
          className={cn(
            "flex flex-1 items-center gap-1.5 min-w-0",
            editingId !== node.id && "cursor-pointer"
          )}
          onClick={editingId === node.id ? undefined : (e) => {
            e.stopPropagation();
            onNavigate(node.id);
          }}
          role="button"
          aria-label={node.title}
          tabIndex={editingId === node.id ? -1 : 0}
          onKeyDown={editingId === node.id ? undefined : (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onNavigate(node.id);
            }
          }}
        >
          <FileText className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
          {editingId === node.id ? (
            renderEditInput()
          ) : (
            <span className="flex-1 truncate text-gray-700 dark:text-gray-200">{node.title}</span>
          )}
        </div>

        {/* Actions menu */}
        <div
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity shrink-0 relative",
            menuOpenId === node.id && "opacity-100"
          )}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpenId(menuOpenId === node.id ? null : node.id);
            }}
            className="rounded p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700"
            data-menu-toggle
          >
            <MoreHorizontal className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>

          {menuOpenId === node.id && (
            <div
              data-menu
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="absolute right-0 top-full z-20 mt-1 w-40 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-1 shadow-lg"
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCreateSubpage(node.id);
                  setMenuOpenId(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <FilePlus className="h-3.5 w-3.5" />
                Add subpage
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onStartRename(node);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Pencil className="h-3.5 w-3.5" />
                Rename
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(node);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Render children and subpage input if expanded or creating subpage here */}
      {(hasChildren && isExpanded) || (isCreating && createParentId === node.id) ? (
        <div className="pl-4">
          {hasChildren && isExpanded && (
            <SortableContext
              items={node.children.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {node.children.map((child) => (
                <SortableTreeItem
                  key={child.id}
                  node={child}
                  isActive={isActive}
                  expandedIds={expandedIds}
                  onToggleExpand={onToggleExpand}
                  onNavigate={onNavigate}
                  onStartRename={onStartRename}
                  onDelete={onDelete}
                  onCreateSubpage={onCreateSubpage}
                  menuOpenId={menuOpenId}
                  setMenuOpenId={setMenuOpenId}
                  invalidTargets={invalidTargets}
                  dropTarget={dropTarget}
                  createParentId={createParentId}
                  isCreating={isCreating}
                  renderEditInput={renderEditInput}
                  editingId={editingId}
                />
              ))}
            </SortableContext>
          )}
          {/* Show new subpage input inside this node */}
          {isCreating && createParentId === node.id && (
            <div className="py-0.5">
              {renderEditInput()}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function PageTree({ pages }: PageTreeProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dndContextId = useId();
  const [isCreating, setIsCreating] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const hoverExpandRef = useRef<{ id: string | null; timeout: ReturnType<typeof setTimeout> | null }>({
    id: null,
    timeout: null,
  });
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartPointerRef = useRef<{ x: number; y: number } | null>(null);

  const tree = useMemo(() => buildNoteTree(pages), [pages]);
  const nodeMap = useMemo(() => {
    const map = new Map<string, NoteTreeNode>();
    const walk = (nodes: NoteTreeNode[]) => {
      for (const node of nodes) {
        map.set(node.id, node);
        walk(node.children);
      }
    };
    walk(tree);
    return map;
  }, [tree]);
  const invalidTargets = useMemo(() => {
    if (!activeId) {
      return new Set<string>();
    }
    const findNode = (nodes: NoteTreeNode[], id: string): NoteTreeNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        const found = findNode(node.children, id);
        if (found) return found;
      }
      return null;
    };
    const activeNode = findNode(tree, activeId);
    if (!activeNode) {
      return new Set<string>([activeId]);
    }
    const targets = new Set<string>([activeNode.id]);
    const collectDescendants = (node: NoteTreeNode) => {
      for (const child of node.children) {
        targets.add(child.id);
        collectDescendants(child);
      }
    };
    collectDescendants(activeNode);
    return targets;
  }, [activeId, tree]);

  const getPointerPosition = (
    activeRect: { left: number; top: number; width?: number; height?: number } | null,
    delta: { x: number; y: number } | null
  ) => {
    // Primary: use drag start pointer + delta
    if (dragStartPointerRef.current && delta) {
      return {
        x: dragStartPointerRef.current.x + delta.x,
        y: dragStartPointerRef.current.y + delta.y,
      };
    }
    // Fallback: use drag offset
    const offset = dragOffsetRef.current;
    if (activeRect && offset) {
      return {
        x: activeRect.left + offset.x,
        y: activeRect.top + offset.y,
      };
    }
    // Last resort: use activeRect center (for Playwright compatibility)
    if (activeRect && delta) {
      const centerX = activeRect.left + (activeRect.width ?? 0) / 2;
      const centerY = activeRect.top + (activeRect.height ?? 0) / 2;
      return {
        x: centerX + delta.x,
        y: centerY + delta.y,
      };
    }
    return null;
  };

  const getDropPosition = (
    overRect: { top: number; bottom: number; height: number } | null,
    pointerY: number | null
  ): DropPosition => {
    if (!overRect) return "on";
    const y = pointerY ?? overRect.top + overRect.height / 2;
    // Confluence/Docmost Standard: 35/30/35 zones
    const upperBand = overRect.top + overRect.height * 0.35;
    const lowerBand = overRect.bottom - overRect.height * 0.35;
    if (y <= upperBand) return "before";
    if (y >= lowerBand) return "after";
    return "on";
  };

  // Get flat list of all IDs for DnD context
  const allIds = useMemo(() => {
    const ids: string[] = [];
    const collectIds = (nodes: NoteTreeNode[]) => {
      for (const node of nodes) {
        ids.push(node.id);
        collectIds(node.children);
      }
    };
    collectIds(tree);
    return ids;
  }, [tree]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Auto-expand parents of the current page
  useEffect(() => {
    const currentPageId = pathname.startsWith("/notes/")
      ? pathname.split("/notes/")[1]
      : null;

    if (currentPageId) {
      const findParents = (nodes: NoteTreeNode[], target: string, parents: string[] = []): string[] | null => {
        for (const node of nodes) {
          if (node.id === target) return parents;
          const found = findParents(node.children, target, [...parents, node.id]);
          if (found) return found;
        }
        return null;
      };
      const parents = findParents(tree, currentPageId);
      if (parents && parents.length > 0) {
        setExpandedIds((prev) => new Set([...prev, ...parents]));
      }
    }
  }, [pathname, tree]);

  // Focus input when editing starts
  useEffect(() => {
    if ((editingId || isCreating) && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId, isCreating]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Element;
      if (menuOpenId && !target.closest('[data-menu]')) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpenId]);

  const currentPageId = pathname.startsWith("/notes/")
    ? pathname.split("/notes/")[1]
    : null;

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleCreatePage(parentId: string | null = null) {
    setIsCreating(true);
    setCreateParentId(parentId);
    setEditingTitle("Untitled");
    if (parentId) {
      setExpandedIds((prev) => new Set([...prev, parentId]));
    }
  }

  async function handleCreateSubmit() {
    if (!editingTitle.trim()) {
      setIsCreating(false);
      setEditingTitle("");
      setCreateParentId(null);
      return;
    }

    try {
      const newPage = await createNote({
        title: editingTitle.trim(),
        content: null,
        parent_id: createParentId,
      });
      setIsCreating(false);
      setEditingTitle("");
      setCreateParentId(null);
      router.push(`/notes/${newPage.id}`);
      router.refresh();
    } catch (err) {
      console.error("Failed to create page:", err);
      setIsCreating(false);
    }
  }

  function handleStartRename(node: NoteTreeNode) {
    setEditingId(node.id);
    setEditingTitle(node.title);
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

  async function handleDelete(node: NoteTreeNode) {
    if (!confirm(`Delete "${node.title}"${node.children.length > 0 ? " and all subpages" : ""}?`)) {
      return;
    }

    try {
      await deleteNote(node.id);
      setMenuOpenId(null);
      if (pathname === `/notes/${node.id}`) {
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

  async function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
    setDropTarget(null);
    const rect = event.active.rect.current.initial;
    const activator = event.activatorEvent as MouseEvent | TouchEvent;
    if ("clientX" in activator && typeof (activator as MouseEvent).clientX === "number" && rect) {
      dragStartPointerRef.current = {
        x: (activator as MouseEvent).clientX,
        y: (activator as MouseEvent).clientY,
      };
      dragOffsetRef.current = {
        x: (activator as MouseEvent).clientX - rect.left,
        y: (activator as MouseEvent).clientY - rect.top,
      };
    } else if ("touches" in activator && (activator as TouchEvent).touches[0] && rect) {
      const touch = (activator as TouchEvent).touches[0];
      dragStartPointerRef.current = {
        x: Number(touch.clientX),
        y: Number(touch.clientY),
      };
      dragOffsetRef.current = {
        x: Number(touch.clientX) - rect.left,
        y: Number(touch.clientY) - rect.top,
      };
    } else {
      dragOffsetRef.current = null;
    }
  }

  async function handleDragOver(event: DragOverEvent) {
    const overId = event.over?.id;
    const activeRect = event.active.rect.current.translated ?? event.active.rect.current.initial;
    const pointer = getPointerPosition(activeRect, event.delta);
    const navRect = navRef.current?.getBoundingClientRect();
    // Root drop zone detection:
    // 1. Pointer near left edge of nav (primary method)
    // 2. Large leftward horizontal drag offset (fallback for Playwright/edge cases)
    const horizontalOffset = dragStartPointerRef.current && pointer
      ? pointer.x - dragStartPointerRef.current.x
      : null;
    const isRootZoneByPosition = pointer && navRect && pointer.x < navRect.left + 64;
    const isRootZoneByOffset = horizontalOffset !== null && horizontalOffset < -100; // Dragged 100px+ left

    if (isRootZoneByPosition || isRootZoneByOffset) {
      setDropTarget({ id: ROOT_DROP_ID, position: "on" });
      if (hoverExpandRef.current.timeout) {
        clearTimeout(hoverExpandRef.current.timeout);
      }
      hoverExpandRef.current = { id: null, timeout: null };
      document.body.style.cursor = "";
      return;
    }
    if (!overId || overId === ROOT_DROP_ID) {
      // Don't clear if we might be in root zone
      if (dropTarget?.id === ROOT_DROP_ID) return;
      setDropTarget(null);
      if (hoverExpandRef.current.timeout) {
        clearTimeout(hoverExpandRef.current.timeout);
      }
      hoverExpandRef.current = { id: null, timeout: null };
      document.body.style.cursor = "";
      return;
    }
    if (invalidTargets.has(overId as string)) {
      setDropTarget(null);
      if (hoverExpandRef.current.timeout) {
        clearTimeout(hoverExpandRef.current.timeout);
      }
      hoverExpandRef.current = { id: null, timeout: null };
      document.body.style.cursor = "not-allowed";
      return;
    }

    const overNode = nodeMap.get(String(overId));

    // Horizontal offset detection for indent/outdent
    const INDENT_THRESHOLD = 40;
    let position = getDropPosition(event.over?.rect ?? null, pointer?.y ?? null);
    let targetId = String(overId);

    if (pointer && dragStartPointerRef.current) {
      const horizontalOffset = pointer.x - dragStartPointerRef.current.x;

      // Indent: Moving RIGHT > 40px forces "on" position (nest into target)
      if (horizontalOffset > INDENT_THRESHOLD) {
        position = "on";
      }
      // Outdent: Moving LEFT > 40px moves to grandparent level
      else if (horizontalOffset < -INDENT_THRESHOLD && overNode?.parent_id) {
        const parentNode = nodeMap.get(overNode.parent_id);
        if (parentNode) {
          targetId = overNode.parent_id;
          position = "after";
        }
      }
    }

    // Auto-expand collapsed nodes on hover
    if (overNode && overNode.children.length > 0 && !expandedIds.has(overNode.id)) {
      if (hoverExpandRef.current.id !== overNode.id) {
        if (hoverExpandRef.current.timeout) {
          clearTimeout(hoverExpandRef.current.timeout);
        }
        const timeout = setTimeout(() => {
          setExpandedIds((prev) => new Set([...prev, overNode.id]));
        }, 500);
        hoverExpandRef.current = { id: overNode.id, timeout };
      }
    } else if (hoverExpandRef.current.id) {
      if (hoverExpandRef.current.timeout) {
        clearTimeout(hoverExpandRef.current.timeout);
      }
      hoverExpandRef.current = { id: null, timeout: null };
    }

    setDropTarget({ id: targetId, position });
    document.body.style.cursor = "";
  }

  async function handleDragCancel(_: DragCancelEvent) {
    setActiveId(null);
    setDropTarget(null);
    dragOffsetRef.current = null;
    dragStartPointerRef.current = null;
    if (hoverExpandRef.current.timeout) {
      clearTimeout(hoverExpandRef.current.timeout);
    }
    hoverExpandRef.current = { id: null, timeout: null };
    document.body.style.cursor = "";
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const currentDropTarget = dropTarget;
    setDropTarget(null);
    if (hoverExpandRef.current.timeout) {
      clearTimeout(hoverExpandRef.current.timeout);
    }
    hoverExpandRef.current = { id: null, timeout: null };
    document.body.style.cursor = "";
    const { active, over } = event;

    const activeRect = event.active.rect.current.translated ?? event.active.rect.current.initial;
    const pointer = getPointerPosition(activeRect, event.delta);
    const navRect = navRef.current?.getBoundingClientRect();

    // Check for root drop zone BEFORE early return (handles case where over is null)
    // Use both position-based and offset-based detection for robustness
    const finalHorizontalOffset = dragStartPointerRef.current && pointer
      ? pointer.x - dragStartPointerRef.current.x
      : null;

    // Clear refs after using them
    dragOffsetRef.current = null;
    dragStartPointerRef.current = null;

    const dropToRoot = currentDropTarget?.id === ROOT_DROP_ID ||
      (pointer && navRect && pointer.x < navRect.left + 64) ||
      (finalHorizontalOffset !== null && finalHorizontalOffset < -100);

    // Handle drop on root zone - move to root level
    if (dropToRoot || over?.id === ROOT_DROP_ID) {
      try {
        // Use reorderNote only - it handles both parent_id and position
        // Calling updateNote as well causes race conditions with normalization
        await reorderNote(active.id as string, {
          parent_id: null,
          position: tree.length, // Add at end of root
        });
        router.refresh();
      } catch (err) {
        console.error("Failed to move to root:", err);
      }
      return;
    }

    // Early return if no valid drop target or dropping on self
    if (!over || active.id === over.id) return;

    // Cannot drop onto self or own descendants
    if (invalidTargets.has(over.id as string)) {
      return;
    }

    // Find nodes in tree
    const findNodeWithParent = (nodes: NoteTreeNode[], id: string, parent: NoteTreeNode | null = null): { node: NoteTreeNode; parent: NoteTreeNode | null; siblings: NoteTreeNode[] } | null => {
      for (const node of nodes) {
        if (node.id === id) return { node, parent, siblings: nodes };
        const found = findNodeWithParent(node.children, id, node);
        if (found) return found;
      }
      return null;
    };

    const activeResult = findNodeWithParent(tree, active.id as string);
    const overResult = findNodeWithParent(tree, over.id as string);

    if (!activeResult || !overResult) return;

    const dropPosition =
      currentDropTarget?.id === over.id
        ? currentDropTarget.position
        : getDropPosition(event.over?.rect ?? null, pointer?.y ?? null);
    let newParentId: string | null;
    let newPosition: number;

    if (dropPosition === "on") {
      // Drag-to-nest: dropping on a node makes it a child of that node
      newParentId = over.id as string;
      newPosition = overResult.node.children.length; // Add at end of children
    } else {
      const targetParentId = overResult.parent?.id ?? null;
      const targetSiblings = overResult.siblings.filter((n) => n.id !== active.id);
      const overIndex = targetSiblings.findIndex((n) => n.id === over.id);
      if (overIndex < 0) return;
      const insertIndex = dropPosition === "before" ? overIndex : overIndex + 1;
      newParentId = targetParentId;
      newPosition = Math.max(0, insertIndex);
    }

    try {
      // Use reorderNote only - it handles both parent_id and position
      // Calling updateNote as well causes race conditions with normalization
      await reorderNote(active.id as string, {
        parent_id: newParentId,
        position: newPosition,
      });
      if (dropPosition === "on" && newParentId) {
        // Auto-expand the new parent to show the nested item
        setExpandedIds((prev) => new Set([...prev, newParentId]));
      }
      router.refresh();
    } catch (err) {
      console.error("Failed to reorder:", err);
    }
  }

  // Render inline edit input for a specific node
  const renderEditInput = () => (
    <input
      ref={inputRef}
      type="text"
      value={editingTitle}
      onChange={(e) => setEditingTitle(e.target.value)}
      onBlur={() => editingId ? handleRenameSubmit(editingId) : handleCreateSubmit()}
      onKeyDown={(e) =>
        handleKeyDown(
          e,
          () => editingId ? handleRenameSubmit(editingId) : handleCreateSubmit(),
          () => {
            setEditingId(null);
            setIsCreating(false);
            setEditingTitle("");
            setCreateParentId(null);
          }
        )
      }
      placeholder="Page title..."
      className="w-full rounded px-2 py-1 text-sm outline-none ring-2 ring-gray-400 dark:ring-dark-muted bg-white dark:bg-dark-surface"
    />
  );

  return (
    <div className="flex h-full flex-col">
      {/* New Page button at top */}
      <div className="shrink-0 p-2 pb-0">
        <button
          type="button"
          onClick={() => handleCreatePage(null)}
          disabled={isCreating}
          className={cn(
            "flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400",
            "hover:bg-gray-100 dark:hover:bg-dark-elevated transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <Plus className="h-4 w-4" />
          New Page
        </button>
      </div>

      <DndContext
        id={dndContextId}
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        <nav ref={navRef} className="relative flex-1 overflow-y-auto p-2">
          {/* Root drop zone - visible during drag */}
          <RootDropZone isActive={activeId !== null} />
          {tree.length === 0 && !isCreating ? (
            <div className="px-2 py-8 text-center">
              <p className="text-xs text-gray-400">No pages yet</p>
            </div>
          ) : (
            <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
              {tree.map((node) => (
                <SortableTreeItem
                  key={node.id}
                  node={node}
                  isActive={currentPageId === node.id}
                  expandedIds={expandedIds}
                  onToggleExpand={toggleExpand}
                  onNavigate={(id) => router.push(`/notes/${id}`)}
                  onStartRename={handleStartRename}
                  onDelete={handleDelete}
                  onCreateSubpage={(parentId) => handleCreatePage(parentId)}
                  menuOpenId={menuOpenId}
                  setMenuOpenId={setMenuOpenId}
                  invalidTargets={invalidTargets}
                  dropTarget={dropTarget}
                  createParentId={createParentId}
                  isCreating={isCreating}
                  renderEditInput={renderEditInput}
                  editingId={editingId}
                />
              ))}
            </SortableContext>
          )}

          {/* New page input at root level */}
          {isCreating && createParentId === null && (
            <div className="py-0.5">
              {renderEditInput()}
            </div>
          )}
        </nav>

        <DragOverlay>
          {activeId ? (
            <div className="rounded bg-white dark:bg-dark-elevated px-2 py-1 text-sm shadow-lg border border-gray-200 dark:border-dark-border">
              {pages.find((p) => p.id === activeId)?.title || "Page"}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
