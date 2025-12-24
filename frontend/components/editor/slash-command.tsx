"use client";

import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy, { Instance as TippyInstance } from "tippy.js";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  CheckSquare,
  Minus,
  Table,
  Image as ImageIcon,
  AlertCircle,
  Upload,
  Paperclip,
  Link,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: (editor: any) => void;
  keywords?: string[]; // Additional search keywords
}

const COMMANDS: CommandItem[] = [
  {
    title: "Text",
    description: "Just start writing with plain text",
    icon: <Type className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().setParagraph().run(),
    keywords: ["paragraph", "plain"],
  },
  {
    title: "Heading 1",
    description: "Large section heading",
    icon: <Heading1 className="h-4 w-4" />,
    command: (editor) =>
      editor.chain().focus().toggleHeading({ level: 1 }).run(),
    keywords: ["h1", "title", "big"],
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: <Heading2 className="h-4 w-4" />,
    command: (editor) =>
      editor.chain().focus().toggleHeading({ level: 2 }).run(),
    keywords: ["h2", "subtitle"],
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: <Heading3 className="h-4 w-4" />,
    command: (editor) =>
      editor.chain().focus().toggleHeading({ level: 3 }).run(),
    keywords: ["h3", "subheading"],
  },
  {
    title: "Bullet list",
    description: "Create a simple bullet list",
    icon: <List className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
    keywords: ["unordered", "ul", "points"],
  },
  {
    title: "Numbered list",
    description: "Create a numbered list",
    icon: <ListOrdered className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
    keywords: ["ordered", "ol", "steps"],
  },
  {
    title: "To-do list",
    description: "Track tasks with a to-do list",
    icon: <CheckSquare className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
    keywords: ["task", "checkbox", "checklist"],
  },
  {
    title: "Quote",
    description: "Capture a quote",
    icon: <Quote className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
    keywords: ["blockquote", "citation"],
  },
  {
    title: "Code block",
    description: "Display code with syntax highlighting",
    icon: <Code className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    keywords: ["pre", "programming", "syntax"],
  },
  {
    title: "Table 2x2",
    description: "Insert a small 2x2 table",
    icon: <Table className="h-4 w-4" />,
    command: (editor) =>
      editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run(),
    keywords: ["grid", "small"],
  },
  {
    title: "Table 3x3",
    description: "Insert a medium 3x3 table",
    icon: <Table className="h-4 w-4" />,
    command: (editor) =>
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    keywords: ["grid", "medium", "spreadsheet"],
  },
  {
    title: "Table 4x4",
    description: "Insert a large 4x4 table",
    icon: <Table className="h-4 w-4" />,
    command: (editor) =>
      editor.chain().focus().insertTable({ rows: 4, cols: 4, withHeaderRow: true }).run(),
    keywords: ["grid", "large", "data"],
  },
  {
    title: "Image (upload)",
    description: "Upload an image from your device",
    icon: <Upload className="h-4 w-4" />,
    command: (editor) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          // Client-side file size check (10MB limit)
          const MAX_FILE_SIZE = 10 * 1024 * 1024;
          if (file.size > MAX_FILE_SIZE) {
            alert(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max 10MB)`);
            return;
          }

          const formData = new FormData();
          formData.append("file", file);
          try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await fetch(`${apiUrl}/api/uploads`, {
              method: "POST",
              body: formData,
            });
            if (res.ok) {
              const { url } = await res.json();
              editor.chain().focus().insertContent({ type: "image", attrs: { src: url } }).run();
            } else {
              // Surface the actual error message from backend
              const errorData = await res.json().catch(() => ({ detail: "Unknown error" }));
              const errorMsg = errorData.detail || `Upload failed (${res.status})`;
              alert(`Failed to upload image: ${errorMsg}`);
            }
          } catch (err) {
            console.error("Image upload error:", err);
            alert("Failed to upload image: Network error or server unavailable");
          }
        }
      };
      input.click();
    },
    keywords: ["picture", "photo", "upload"],
  },
  {
    title: "Image (URL)",
    description: "Embed an image from a URL",
    icon: <Link className="h-4 w-4" />,
    command: (editor) => {
      // Import dynamically to avoid circular dependency
      import("./image-url-dialog").then(({ showImageUrlDialog }) => {
        showImageUrlDialog((url) => {
          editor.chain().focus().insertContent({ type: "image", attrs: { src: url } }).run();
        });
      });
    },
    keywords: ["picture", "photo", "link", "embed"],
  },
  {
    title: "File attachment",
    description: "Upload and attach a file",
    icon: <Paperclip className="h-4 w-4" />,
    command: (editor) => {
      const input = document.createElement("input");
      input.type = "file";
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          // Client-side file size check (10MB limit)
          const MAX_FILE_SIZE = 10 * 1024 * 1024;
          if (file.size > MAX_FILE_SIZE) {
            alert(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max 10MB)`);
            return;
          }

          const formData = new FormData();
          formData.append("file", file);
          try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await fetch(`${apiUrl}/api/uploads`, {
              method: "POST",
              body: formData,
            });
            if (res.ok) {
              const { url, filename } = await res.json();
              // Insert as fileAttachment node for chip rendering
              editor.chain().focus().insertContent({
                type: "fileAttachment",
                attrs: { href: url, filename },
              }).run();
            } else {
              // Surface the actual error message from backend
              const errorData = await res.json().catch(() => ({ detail: "Unknown error" }));
              const errorMsg = errorData.detail || `Upload failed (${res.status})`;
              alert(`Failed to upload file: ${errorMsg}`);
            }
          } catch (err) {
            console.error("File upload error:", err);
            alert("Failed to upload file: Network error or server unavailable");
          }
        }
      };
      input.click();
    },
    keywords: ["attach", "document", "upload", "file"],
  },
  {
    title: "Callout",
    description: "Highlight important information",
    icon: <AlertCircle className="h-4 w-4" />,
    command: (editor) => {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "callout",
          attrs: { type: "info" },
          content: [{ type: "paragraph" }],
        })
        .run();
    },
    keywords: ["info", "warning", "note", "alert", "tip"],
  },
  {
    title: "Divider",
    description: "Visually divide blocks",
    icon: <Minus className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
    keywords: ["horizontal", "rule", "line", "hr"],
  },
];

interface CommandListProps {
  items: CommandItem[];
  command: (item: CommandItem) => void;
}

export interface CommandListRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

const CommandList = forwardRef<CommandListRef, CommandListProps>(
  function CommandList({ items, command }, ref) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Reset selection when items change
    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    // Scroll selected item into view
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const selected = container.querySelector(`[data-index="${selectedIndex}"]`);
      if (selected) {
        selected.scrollIntoView({ block: "nearest" });
      }
    }, [selectedIndex]);

    // Expose keyboard handler via ref for TipTap suggestion integration
    useImperativeHandle(ref, () => ({
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
          return true;
        }

        if (event.key === "ArrowDown") {
          setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
          return true;
        }

        if (event.key === "Enter") {
          const item = items[selectedIndex];
          if (item) {
            command(item);
          }
          return true;
        }

        return false;
      },
    }), [items, selectedIndex, command]);

    if (items.length === 0) {
      return (
        <div className="p-3 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">No results found</div>
      );
    }

    return (
      <div
        ref={containerRef}
        className="max-h-80 overflow-y-auto p-1 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      >
        {items.map((item, index) => (
          <button
            key={`${item.title}-${item.description}`}
            data-index={index}
            onClick={() => command(item)}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left",
              "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
              selectedIndex === index && "bg-gray-100 dark:bg-gray-800"
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              {item.icon}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {item.title}
              </div>
              <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                {item.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  }
);

// Export the component for rendering
export { CommandList };

// Create the slash command extension
export function createSlashCommandExtension() {
  return Extension.create({
    name: "slashCommand",

    addOptions() {
      return {
        suggestion: {
          char: "/",
          command: ({
            editor,
            range,
            props,
          }: {
            editor: any;
            range: any;
            props: CommandItem;
          }) => {
            // Delete the "/" trigger character
            editor.chain().focus().deleteRange(range).run();
            // Execute the command
            props.command(editor);
          },
        },
      };
    },

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          ...this.options.suggestion,
          items: ({ query }: { query: string }) => {
            const lowerQuery = query.toLowerCase();
            return COMMANDS.filter((item) => {
              const titleMatch = item.title.toLowerCase().includes(lowerQuery);
              const keywordMatch = item.keywords?.some((k) =>
                k.toLowerCase().includes(lowerQuery)
              );
              return titleMatch || keywordMatch;
            });
          },
          render: () => {
            let component: ReactRenderer<CommandListRef> | null = null;
            let popup: TippyInstance[] | null = null;

            return {
              onStart: (props: any) => {
                component = new ReactRenderer(CommandList, {
                  props: {
                    items: props.items,
                    command: props.command,
                  },
                  editor: props.editor,
                });

                if (!props.clientRect) {
                  return;
                }

                popup = tippy("body", {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                  animation: "shift-away",
                  theme: "slash-command",
                });
              },

              onUpdate(props: any) {
                component?.updateProps({
                  items: props.items,
                  command: props.command,
                });

                if (!props.clientRect) {
                  return;
                }

                popup?.[0]?.setProps({
                  getReferenceClientRect: props.clientRect,
                });
              },

              onKeyDown(props: any) {
                if (props.event.key === "Escape") {
                  popup?.[0]?.hide();
                  return true;
                }

                // Delegate arrow/enter keys to the CommandList component
                if (component?.ref?.onKeyDown) {
                  return component.ref.onKeyDown(props.event);
                }

                return false;
              },

              onExit() {
                // Prevent double-destroy warnings by nullifying after cleanup
                if (popup?.[0]) {
                  popup[0].destroy();
                  popup = null;
                }
                if (component) {
                  component.destroy();
                  component = null;
                }
              },
            };
          },
        }),
      ];
    },
  });
}
