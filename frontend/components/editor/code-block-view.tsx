"use client";

import { useState, useCallback } from "react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockViewProps {
  node: {
    attrs: {
      language?: string;
    };
    textContent: string;
  };
}

/**
 * Custom code block view with copy-to-clipboard button
 */
export function CodeBlockView({ node }: CodeBlockViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(node.textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [node.textContent]);

  return (
    <NodeViewWrapper className="relative group">
      <pre className="bg-gray-900 text-gray-100 rounded-md p-4 my-2 overflow-x-auto">
        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "absolute top-2 right-2 p-1.5 rounded",
            "text-gray-400 hover:text-gray-200",
            "bg-gray-800 hover:bg-gray-700",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
            copied && "text-green-400 hover:text-green-400"
          )}
          aria-label={copied ? "Copied!" : "Copy code"}
          title={copied ? "Copied!" : "Copy code"}
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
        <NodeViewContent as="code" className={node.attrs.language ? `language-${node.attrs.language}` : ""} />
      </pre>
    </NodeViewWrapper>
  );
}
