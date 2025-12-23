import { notFound } from "next/navigation";
import { getDocById, getDocsStatus, getProjectPulse } from "@/lib/docs-api";
import { DocsBreadcrumbs } from "@/components/docs/docs-breadcrumbs";
import { DocsContent } from "@/components/docs/docs-content";
import { DocsStatusLive } from "@/components/docs/docs-status-live";
import { ProjectPulseCard } from "@/components/docs/project-pulse";
import { DocsToc } from "@/components/docs/docs-toc";

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [doc, status, pulse] = await Promise.all([
    getDocById(slug),
    getDocsStatus(),
    getProjectPulse(),
  ]);

  if (!doc) return notFound();

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section>
        <DocsBreadcrumbs title={doc.title} />
        <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {doc.title}
        </h1>
        <p className="mt-1 text-xs text-gray-500">{doc.filename}</p>
        <div className="mt-6">
          <DocsContent markdown={doc.content} />
        </div>
      </section>

      <aside className="space-y-4">
        <DocsToc headings={doc.headings} />
        <DocsStatusLive initialStatus={status} />
        <ProjectPulseCard pulse={pulse} />
      </aside>
    </div>
  );
}
