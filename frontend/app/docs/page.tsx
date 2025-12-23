import Link from "next/link";
import { getDocsTree, getDocsStatus, getProjectPulse } from "@/lib/docs-api";
import { DocsBreadcrumbs } from "@/components/docs/docs-breadcrumbs";
import { DocsStatusLive } from "@/components/docs/docs-status-live";
import { ProjectPulseCard } from "@/components/docs/project-pulse";

export default async function DocsIndexPage() {
  const [tree, status, pulse] = await Promise.all([
    getDocsTree(),
    getDocsStatus(),
    getProjectPulse(),
  ]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section>
        <DocsBreadcrumbs />
        <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Documentation
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Live mirror of system specs, audits, and verification reports.
        </p>

        <div className="mt-6 space-y-2">
          {tree.map((doc) => (
            <Link
              key={doc.id}
              href={`/docs/${doc.id}`}
              className="block rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 shadow-sm hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
            >
              <div className="font-semibold">{doc.title}</div>
              <div className="text-xs text-gray-500">{doc.filename}</div>
            </Link>
          ))}
        </div>
      </section>

      <aside className="space-y-4">
        <DocsStatusLive initialStatus={status} />
        <ProjectPulseCard pulse={pulse} />
      </aside>
    </div>
  );
}
