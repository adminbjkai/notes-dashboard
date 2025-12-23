"use client";

import { useDocStatus } from "@/hooks/use-doc-status";
import type { DocStatus } from "@/types/docs";
import { StatusBadges } from "@/components/docs/status-badges";

type DocsStatusLiveProps = {
  initialStatus: DocStatus | null;
};

export function DocsStatusLive({ initialStatus }: DocsStatusLiveProps) {
  const { status } = useDocStatus();
  const resolved = status ?? initialStatus;

  if (!resolved) return null;

  const updatedLabel = resolved.last_modified
    ? new Date(resolved.last_modified).toLocaleString()
    : "Unknown";

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Live System Status</h3>
        <span className="text-xs text-gray-400">Updated {updatedLabel}</span>
      </div>
      <div className="mt-3">
        <StatusBadges badges={resolved.badges} />
      </div>
    </section>
  );
}
