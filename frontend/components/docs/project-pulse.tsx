import type { ProjectPulse } from "@/types/docs";

type ProjectPulseProps = {
  pulse: ProjectPulse | null;
};

export function ProjectPulseCard({ pulse }: ProjectPulseProps) {
  if (!pulse) return null;
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Project Pulse</h3>
        <span className="text-xs text-gray-400">{pulse.generated_by}</span>
      </div>
      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{pulse.summary}</p>
      {Object.keys(pulse.metrics).length > 0 ? (
        <div className="mt-3 grid gap-2 text-xs text-gray-600 dark:text-gray-400">
          {Object.entries(pulse.metrics).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span>{key}</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{value}</span>
            </div>
          ))}
        </div>
      ) : null}
      {pulse.citations.length > 0 ? (
        <div className="mt-3 border-t border-gray-100 pt-2 text-xs text-gray-500 dark:border-gray-800">
          {pulse.citations.map((cite) => (
            <div key={`${cite.file}-${cite.line}`} className="truncate">
              {cite.file}:{cite.line} — {cite.excerpt}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
