import { StarterKit } from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Placeholder } from "@tiptap/extension-placeholder";
import { common, createLowlight } from "lowlight";
import { ResizableImage } from "./resizable-image";
import { createSlashCommandExtension } from "./slash-command";
import { Callout } from "./callout-extension";
import { FileAttachment } from "./file-attachment";

const lowlight = createLowlight(common);

export const editorExtensions = [
  StarterKit.configure({
    codeBlock: false, // Use CodeBlockLowlight instead
    heading: {
      levels: [1, 2, 3],
    },
  }),
  Table.configure({
    resizable: true,
    HTMLAttributes: {
      class: "border-collapse border border-gray-300",
    },
  }),
  TableRow,
  TableCell.configure({
    HTMLAttributes: {
      class: "border border-gray-300 px-3 py-2",
    },
  }),
  TableHeader.configure({
    HTMLAttributes: {
      class: "border border-gray-300 bg-gray-100 px-3 py-2 font-semibold",
    },
  }),
  CodeBlockLowlight.configure({
    lowlight,
    HTMLAttributes: {
      class: "bg-gray-900 text-gray-100 rounded-md p-4 my-2 overflow-x-auto",
    },
  }),
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
