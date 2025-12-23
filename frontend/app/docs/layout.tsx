import { getDocsTree } from "@/lib/docs-api";
import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { DocsSearch } from "@/components/docs/docs-search";
import Link from "next/link";

export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const tree = await getDocsTree();

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden shrink-0 basis-64 md:block">
        <DocsSidebar tree={tree} />
      </div>
      <main className="flex-1 overflow-y-auto bg-white dark:bg-dark-surface">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/80 px-6 py-3 backdrop-blur dark:border-dark-border dark:bg-dark-surface/80">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="font-semibold text-gray-700 dark:text-gray-200">AI Documentation Portal</span>
            <Link href="/" className="text-gray-400 hover:text-gray-700">
              Notes
            </Link>
          </div>
          <DocsSearch />
        </div>
        <div className="px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
