"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from "@tiptap/react";
import { Paperclip, Download, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Get the backend URL for downloads
function getDownloadUrl(href: string): string {
  // If already absolute URL, use as-is
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }
  // For relative /uploads/ paths, prepend the backend URL
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return `${backendUrl}${href}`;
}

// Custom attachment chip component
function FileAttachmentComponent({ node, deleteNode, selected }: NodeViewProps) {
  const { href, filename } = node.attrs;

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Open in new tab or trigger download - use full backend URL
    const downloadUrl = getDownloadUrl(href);
    window.open(downloadUrl, "_blank");
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteNode();
  };

  return (
    <NodeViewWrapper as="span" className="inline-block align-middle my-0.5">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm",
          "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
          "hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors",
          selected && "ring-2 ring-blue-500"
        )}
      >
        <Paperclip className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 shrink-0" />
        <span className="text-gray-700 dark:text-gray-300 max-w-[200px] truncate">
          {filename || "Attachment"}
        </span>
        <button
          onClick={handleDownload}
          className="p-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          title="Download"
        >
          <Download className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
        </button>
        <button
          onClick={handleRemove}
          className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          title="Remove"
        >
          <X className="h-3.5 w-3.5 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400" />
        </button>
      </span>
    </NodeViewWrapper>
  );
}

// Custom file attachment extension
export const FileAttachment = Node.create({
  name: "fileAttachment",

  group: "inline",

  inline: true,

  atom: true,

  addAttributes() {
    return {
      href: {
        default: null,
      },
      filename: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        // Parse links with /uploads/ URLs as file attachments
        tag: 'a[href^="/uploads/"]',
        getAttrs: (dom) => {
          const element = dom as HTMLAnchorElement;
          return {
            href: element.getAttribute("href"),
            filename: element.textContent || element.getAttribute("href")?.split("/").pop(),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // Render as a standard link for HTML output
    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        href: HTMLAttributes.href,
        class: "file-attachment",
        target: "_blank",
        rel: "noopener noreferrer",
      }),
      HTMLAttributes.filename || "Attachment",
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileAttachmentComponent);
  },
});
