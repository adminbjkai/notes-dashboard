"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import { useCallback, useEffect } from "react";

export type { Editor };
export { EditorToolbar } from "./editor-toolbar";
import { EditorToolbar } from "./editor-toolbar";
import { editorExtensions } from "./editor-extensions";
import { FloatingTableMenu } from "./floating-table-menu";
import { cn } from "@/lib/utils";
import { htmlToMarkdown, markdownToHtml } from "./markdown-converter";
import { ImageUrlDialog } from "./image-url-dialog";

interface RichTextEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  className?: string;
  showToolbar?: boolean;
  onEditorReady?: (editor: ReturnType<typeof useEditor>) => void;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  className,
  showToolbar = false,
  onEditorReady,
}: RichTextEditorProps) {
  const handleUpdate = useCallback(
    ({ editor }: { editor: ReturnType<typeof useEditor> }) => {
      if (!editor) return;
      const html = editor.getHTML();
      const markdown = htmlToMarkdown(html);
      onChange(markdown);
    },
    [onChange]
  );

  const editor = useEditor({
    extensions: editorExtensions,
    content: markdownToHtml(content),
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-lg dark:prose-invert max-w-none focus:outline-none",
          "prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-headings:font-semibold",
          "prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-4",
          "prose-h2:text-2xl prose-h2:mt-6 prose-h2:mb-3",
          "prose-h3:text-xl prose-h3:mt-5 prose-h3:mb-2",
          "prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:my-3",
          "prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono",
          "prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:my-4",
          "prose-blockquote:border-l-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400",
          "prose-ul:list-disc prose-ul:my-3 prose-ol:list-decimal prose-ol:my-3",
          "prose-li:my-1",
          "prose-table:border-collapse prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-600 prose-th:bg-gray-100 dark:prose-th:bg-gray-800 prose-th:px-3 prose-th:py-2",
          "prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-600 prose-td:px-3 prose-td:py-2",
          "[&_*]:outline-none"
        ),
      },
    },
    onUpdate: handleUpdate,
    immediatelyRender: false,
  });

  // Notify parent when editor is ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  if (!editor) {
    return (
      <div className={cn("animate-pulse bg-gray-50 dark:bg-gray-800 min-h-[200px] rounded", className)} />
    );
  }

  return (
    <div className={cn("relative", className)}>
      {showToolbar && (
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 -mx-8 px-8 transition-colors">
          <EditorToolbar editor={editor} />
        </div>
      )}
      <FloatingTableMenu editor={editor} />
      <EditorContent
        editor={editor}
        className="min-h-[200px]"
      />
      <ImageUrlDialog />
    </div>
  );
}
