"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { searchDocs } from "@/lib/docs-api";
import type { DocSearchResult } from "@/types/docs";
import { cn } from "@/lib/utils";

function getAnchorFromMatch(match: string): string | null {
  const headingMatch = match.match(/^#{1,6}\s+(.+)$/);
  if (headingMatch) {
    const text = headingMatch[1].trim();
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  return null;
}

export function DocsSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DocSearchResult[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const handler = setTimeout(async () => {
      const next = await searchDocs(query.trim());
      setResults(next);
      setOpen(true);
    }, 250);

    return () => clearTimeout(handler);
  }, [query]);

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search docs..."
        className={cn(
          "h-9 w-56 rounded border border-gray-200 bg-white px-3 text-xs",
          "focus:border-gray-400 focus:outline-none dark:border-dark-border dark:bg-dark-surface"
        )}
      />
      {open && results.length > 0 ? (
        <div className="absolute right-0 mt-2 w-96 rounded border border-gray-200 bg-white shadow-lg dark:border-dark-border dark:bg-dark-elevated">
          <div className="max-h-72 overflow-y-auto">
            {results.map((result, index) => {
            const anchor = getAnchorFromMatch(result.match);
            const href = anchor ? `/docs/${result.doc_id}#${anchor}` : `/docs/${result.doc_id}`;
            return (
              <Link
                key={`${result.doc_id}-${result.line}-${index}`}
                href={href}
                className="block border-b border-gray-100 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 dark:border-dark-border dark:text-gray-300 dark:hover:bg-dark-muted"
                onClick={() => setOpen(false)}
              >
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  {result.filename} · line {result.line}
                </div>
                <div className="mt-1 text-gray-500 dark:text-gray-400">
                  {result.match}
                </div>
                <div className="mt-1 text-gray-400 dark:text-gray-500">
                  {result.context}
                </div>
              </Link>
            );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
