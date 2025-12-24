"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from "@tiptap/react";
import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

// Get the backend URL for uploaded images
function getImageUrl(src: string): string {
  // If already absolute URL, use as-is
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
    return src;
  }
  // For relative /uploads/ paths, prepend the backend URL
  if (src.startsWith("/uploads/")) {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return `${backendUrl}${src}`;
  }
  // For other relative paths, return as-is
  return src;
}

// Custom image component with resize handles
function ResizableImageComponent({ node, updateAttributes, selected }: NodeViewProps) {
  const [isResizing, setIsResizing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const startPosRef = useRef({ x: 0, y: 0, width: 0 });

  const { src, alt, width } = node.attrs;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, direction: "left" | "right") => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);

      const img = imgRef.current;
      if (!img) return;

      startPosRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: img.offsetWidth,
      };

      const handleMouseMove = (e: MouseEvent) => {
        const delta = direction === "right"
          ? e.clientX - startPosRef.current.x
          : startPosRef.current.x - e.clientX;

        const newWidth = Math.max(100, startPosRef.current.width + delta);
        updateAttributes({ width: `${newWidth}px` });
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [updateAttributes]
  );

  // Preset size buttons
  const presetSizes = [
    { label: "S", width: "200px" },
    { label: "M", width: "400px" },
    { label: "L", width: "600px" },
    { label: "Full", width: "100%" },
  ];

  return (
    <NodeViewWrapper className="relative inline-block my-1">
      <div
        className={cn(
          "relative inline-block group",
          selected && "ring-2 ring-blue-500 ring-offset-1 rounded",
          isResizing && "select-none"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={getImageUrl(src)}
          alt={alt || ""}
          style={{ width: width || "auto" }}
          className="max-w-full h-auto rounded"
          draggable={false}
        />

        {/* Resize handles - only show when selected */}
        {selected && (
          <>
            {/* Left handle */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-8 bg-blue-500 rounded-r cursor-ew-resize opacity-60 hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, "left")}
            />
            {/* Right handle */}
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-8 bg-blue-500 rounded-l cursor-ew-resize opacity-60 hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, "right")}
            />

            {/* Size preset buttons - overlay at bottom of image */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5 bg-black/70 backdrop-blur-sm rounded px-1 py-0.5">
              {presetSizes.map((size) => (
                <button
                  key={size.label}
                  onClick={() => updateAttributes({ width: size.width })}
                  className={cn(
                    "px-1.5 py-0.5 text-xs text-white/80 rounded hover:text-white hover:bg-white/20 transition-colors",
                    width === size.width && "bg-white/30 text-white"
                  )}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

// Custom image extension with resize support
export const ResizableImage = Node.create({
  name: "image",

  addOptions() {
    return {
      inline: false,
      allowBase64: true,
      HTMLAttributes: {},
    };
  },

  inline() {
    return this.options.inline;
  },

  group() {
    return this.options.inline ? "inline" : "block";
  },

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
        parseHTML: (element) => {
          // Extract width from style attribute
          const style = element.getAttribute("style") || "";
          const widthMatch = style.match(/width:\s*([^;]+)/);
          if (widthMatch) {
            return widthMatch[1].trim();
          }
          // Also check for width attribute directly
          return element.getAttribute("width") || null;
        },
        renderHTML: (attributes) => {
          if (!attributes.width) {
            return {};
          }
          return { style: `width: ${attributes.width}` };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "img[src]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});
