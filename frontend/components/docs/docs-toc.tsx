"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { DocHeading } from "@/types/docs";

type DocsTocProps = {
  headings: DocHeading[];
};

export function DocsToc({ headings }: DocsTocProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -80% 0px" }
    );

    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  const filtered = headings.filter((h) => h.level <= 3);
  if (filtered.length === 0) return null;

  return (
    <nav className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-dark-border dark:bg-dark-elevated">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        On this page
      </h3>
      <ul className="space-y-1 text-sm">
        {filtered.map((heading) => (
          <li key={heading.id} style={{ paddingLeft: (heading.level - 1) * 12 }}>
            <a
              href={`#${heading.id}`}
              className={cn(
                "block truncate text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100",
                activeId === heading.id && "font-medium text-blue-600 dark:text-blue-400"
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
