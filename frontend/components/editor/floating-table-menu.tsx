"use client";

import { useState, useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { TableToolbar } from "./table-toolbar";

interface FloatingTableMenuProps {
  editor: Editor;
}

/**
 * Floating menu that appears above a table when the cursor is inside it.
 * Positions itself near the table using the editor's selection coordinates.
 */
export function FloatingTableMenu({ editor }: FloatingTableMenuProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updatePosition = () => {
      const isInTable = editor.isActive("table");
      setIsVisible(isInTable);

      if (isInTable) {
        // Find the table element containing the selection
        const { view } = editor;
        const { from } = view.state.selection;
        const resolved = view.state.doc.resolve(from);

        // Walk up to find the table node
        for (let depth = resolved.depth; depth > 0; depth--) {
          const node = resolved.node(depth);
          if (node.type.name === "table") {
            const domNode = view.nodeDOM(resolved.before(depth));
            if (domNode instanceof HTMLElement) {
              const rect = domNode.getBoundingClientRect();
              const editorRect = view.dom.getBoundingClientRect();
              setPosition({
                top: rect.top - editorRect.top - 44, // 44px above table
                left: rect.left - editorRect.left,
              });
            }
            break;
          }
        }
      }
    };

    // Update on selection changes
    editor.on("selectionUpdate", updatePosition);
    editor.on("focus", updatePosition);

    // Initial check
    updatePosition();

    return () => {
      editor.off("selectionUpdate", updatePosition);
      editor.off("focus", updatePosition);
    };
  }, [editor]);

  if (!isVisible) return null;

  return (
    <div
      ref={menuRef}
      className="absolute z-20 animate-in fade-in slide-in-from-bottom-1 duration-150"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <TableToolbar editor={editor} />
    </div>
  );
}
