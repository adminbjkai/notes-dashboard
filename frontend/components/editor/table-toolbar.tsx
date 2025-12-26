"use client";

import type { Editor } from "@tiptap/react";
import {
  Plus,
  Minus,
  Trash2,
  RowsIcon,
  ColumnsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TableToolbarProps {
  editor: Editor;
}

interface ToolbarButtonProps {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  variant?: "default" | "danger";
}

function ToolbarButton({ onClick, title, children, variant = "default" }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded transition-colors",
        "hover:bg-gray-600",
        variant === "danger" && "hover:bg-red-900/50 text-red-400"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-gray-600 mx-0.5" />;
}

/**
 * Floating toolbar for table operations.
 * Appears above the table when focused/hovered.
 */
export function TableToolbar({ editor }: TableToolbarProps) {
  return (
    <div className="flex items-center gap-0.5 px-1.5 py-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
      {/* Add column left */}
      <ToolbarButton
        onClick={() => editor.chain().focus().addColumnBefore().run()}
        title="Add column before"
      >
        <div className="relative w-4 h-4">
          <ColumnsIcon className="h-4 w-4 text-gray-300" />
          <Plus className="h-2 w-2 text-gray-300 absolute -left-1 top-1" />
        </div>
      </ToolbarButton>

      {/* Add column right */}
      <ToolbarButton
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        title="Add column after"
      >
        <div className="relative w-4 h-4">
          <ColumnsIcon className="h-4 w-4 text-gray-300" />
          <Plus className="h-2 w-2 text-gray-300 absolute -right-1 top-1" />
        </div>
      </ToolbarButton>

      {/* Delete column */}
      <ToolbarButton
        onClick={() => editor.chain().focus().deleteColumn().run()}
        title="Delete column"
        variant="danger"
      >
        <div className="relative w-4 h-4">
          <ColumnsIcon className="h-4 w-4" />
          <Minus className="h-2 w-2 absolute -right-1 top-1" />
        </div>
      </ToolbarButton>

      <Divider />

      {/* Add row above */}
      <ToolbarButton
        onClick={() => editor.chain().focus().addRowBefore().run()}
        title="Add row before"
      >
        <div className="relative w-4 h-4">
          <RowsIcon className="h-4 w-4 text-gray-300" />
          <Plus className="h-2 w-2 text-gray-300 absolute left-1 -top-1" />
        </div>
      </ToolbarButton>

      {/* Add row below */}
      <ToolbarButton
        onClick={() => editor.chain().focus().addRowAfter().run()}
        title="Add row after"
      >
        <div className="relative w-4 h-4">
          <RowsIcon className="h-4 w-4 text-gray-300" />
          <Plus className="h-2 w-2 text-gray-300 absolute left-1 -bottom-1" />
        </div>
      </ToolbarButton>

      {/* Delete row */}
      <ToolbarButton
        onClick={() => editor.chain().focus().deleteRow().run()}
        title="Delete row"
        variant="danger"
      >
        <div className="relative w-4 h-4">
          <RowsIcon className="h-4 w-4" />
          <Minus className="h-2 w-2 absolute left-1 -bottom-1" />
        </div>
      </ToolbarButton>

      <Divider />

      {/* Delete table */}
      <ToolbarButton
        onClick={() => editor.chain().focus().deleteTable().run()}
        title="Delete table"
        variant="danger"
      >
        <Trash2 className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}
