"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { DocTreeNode } from "@/types/docs";

type DocsSidebarProps = {
  tree: DocTreeNode[];
};

function TreeItem({ node, activeId, depth }: { node: DocTreeNode; activeId: string | null; depth: number }) {
  const isActive = activeId === node.id;
  return (
    <div>
      <Link
        href={`/docs/${node.id}`}
        className={cn(
          "flex items-center rounded px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100",
          "dark:text-gray-300 dark:hover:bg-dark-elevated",
          isActive && "bg-blue-50 font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300"
        )}
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        <span className="truncate">{node.title}</span>
      </Link>
      {node.children.map((child) => (
        <TreeItem key={child.id} node={child} activeId={activeId} depth={depth + 1} />
      ))}
    </div>
  );
}

export function DocsSidebar({ tree }: DocsSidebarProps) {
  const pathname = usePathname();
  const activeId = pathname?.startsWith("/docs/") ? pathname.replace("/docs/", "") : null;
  return (
    <aside className="flex h-full flex-col border-r border-gray-200 bg-gray-50 dark:border-dark-border dark:bg-dark-bg">
      <div className="flex h-12 shrink-0 items-center border-b border-gray-200 px-4 text-xs font-semibold text-gray-500 dark:border-dark-border">
        Documentation
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {tree.length === 0 ? (
          <p className="px-2 text-xs text-gray-400">No docs found.</p>
        ) : (
          tree.map((node) => <TreeItem key={node.id} node={node} activeId={activeId} depth={0} />)
        )}
      </div>
    </aside>
  );
}
