import { StarterKit } from "@tiptap/starter-kit";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Placeholder } from "@tiptap/extension-placeholder";
import { ResizableImage } from "./resizable-image";
import { createSlashCommandExtension } from "./slash-command";
import { Callout } from "./callout-extension";
import { FileAttachment } from "./file-attachment";
import { CustomCodeBlock } from "./code-block-extension";
import { CustomTable } from "./table-extension";

export const editorExtensions = [
  StarterKit.configure({
    codeBlock: false, // Use CustomCodeBlock instead
    heading: {
      levels: [1, 2, 3],
    },
  }),
  CustomTable,
  TableRow,
  TableCell.configure({
    HTMLAttributes: {
      class: "border border-gray-200 dark:border-gray-700 px-2 py-1 text-sm",
    },
  }),
  TableHeader.configure({
    HTMLAttributes: {
      class: "border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-sm font-medium",
    },
  }),
  CustomCodeBlock,
  TaskList.configure({
    HTMLAttributes: {
      class: "not-prose pl-0",
    },
  }),
  TaskItem.configure({
    nested: true,
    HTMLAttributes: {
      class: "flex items-start gap-2 my-1",
    },
  }),
  Placeholder.configure({
    placeholder: "Start writing, or press / for commands...",
    emptyEditorClass: "is-editor-empty",
  }),
  ResizableImage.configure({
    inline: false,
    allowBase64: true,
  }),
  Callout,
  FileAttachment,
  createSlashCommandExtension(),
];
