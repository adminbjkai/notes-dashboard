"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Global store for the dialog callback
let showDialogCallback: ((callback: (url: string) => void) => void) | null = null;

export function showImageUrlDialog(callback: (url: string) => void) {
  if (showDialogCallback) {
    showDialogCallback(callback);
  } else {
    // Fallback to window.prompt if dialog not mounted
    const url = window.prompt("Enter image URL:");
    if (url) callback(url);
  }
}

interface ImageUrlDialogProps {
  // No props needed - uses global store
}

export function ImageUrlDialog(_props: ImageUrlDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const callbackRef = useRef<((url: string) => void) | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Register the global callback on mount
  useEffect(() => {
    showDialogCallback = (callback: (url: string) => void) => {
      callbackRef.current = callback;
      setUrl("");
      setOpen(true);
    };

    return () => {
      showDialogCallback = null;
    };
  }, []);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      callbackRef.current?.(url.trim());
      setOpen(false);
      setUrl("");
    }
  };

  const handleClose = () => {
    setOpen(false);
    setUrl("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!open) return null;

  // Use portal to render at document root
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div
        className={cn(
          "bg-white dark:bg-gray-900 rounded-lg shadow-xl",
          "w-full max-w-md mx-4 p-6",
          "border border-gray-200 dark:border-gray-700"
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Insert Image from URL
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="image-url"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Image URL
              </label>
              <input
                ref={inputRef}
                id="image-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={cn(
                  "w-full px-3 py-2 rounded-md text-sm",
                  "border border-gray-300 dark:border-gray-600",
                  "bg-white dark:bg-gray-800",
                  "text-gray-900 dark:text-gray-100",
                  "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                )}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium",
                  "border border-gray-300 dark:border-gray-600",
                  "text-gray-700 dark:text-gray-300",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  "transition-colors"
                )}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!url.trim()}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium",
                  "bg-blue-600 text-white",
                  "hover:bg-blue-700",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-colors"
                )}
              >
                Insert
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
