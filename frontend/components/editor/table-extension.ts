import { Table } from "@tiptap/extension-table";

/**
 * Custom Table extension with compact styling.
 * The floating toolbar is rendered by FloatingTableMenu component.
 */
export const CustomTable = Table.configure({
  resizable: true,
  HTMLAttributes: {
    class: "table-compact",
  },
});
