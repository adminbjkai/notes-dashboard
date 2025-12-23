import type { DocBadge } from "@/types/docs";
import { cn } from "@/lib/utils";

type StatusBadgesProps = {
  badges: DocBadge[];
};

const statusStyles: Record<DocBadge["status"], string> = {
  passing: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  failing: "bg-red-50 text-red-700 ring-red-200",
};

export function StatusBadges({ badges }: StatusBadgesProps) {
  if (badges.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <div
          key={`${badge.label}-${badge.line_number}`}
          className={cn(
            "rounded-full px-3 py-1 text-xs ring-1",
            statusStyles[badge.status]
          )}
          title={`${badge.source_file}:${badge.line_number}`}
        >
          <span className="font-semibold">{badge.label}</span> {badge.value}
        </div>
      ))}
    </div>
  );
}
