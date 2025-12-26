import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { common, createLowlight } from "lowlight";
import { TextSelection } from "@tiptap/pm/state";
import { CodeBlockView } from "./code-block-view";

const lowlight = createLowlight(common);

/**
 * Custom CodeBlock extension that extends CodeBlockLowlight with:
 * - Syntax highlighting via lowlight
 * - Cmd/Ctrl+A selects only code block contents (not entire document)
 * - Copy-to-clipboard button in top-right corner
 */
export const CustomCodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },

  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      // Override Mod-a (Cmd+A on Mac, Ctrl+A on Windows/Linux)
      // to select only code block contents when cursor is inside a code block
      "Mod-a": ({ editor }) => {
        const { state } = editor;
        const { $from } = state.selection;

        // Check if cursor is inside a code block
        const codeBlock = $from.node($from.depth);
        if (codeBlock?.type.name !== "codeBlock") {
          // Not in a code block, let default behavior handle it
          return false;
        }

        // Find the start and end positions of the code block content
        const start = $from.start($from.depth);
        const end = $from.end($from.depth);

        // Create a text selection spanning the entire code block content
        const selection = TextSelection.create(state.doc, start, end);

        // Apply the selection
        editor.view.dispatch(state.tr.setSelection(selection));

        // Return true to prevent default select-all behavior
        return true;
      },
    };
  },
}).configure({
  lowlight,
});
