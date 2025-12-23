import { Sidebar } from "./sidebar";
import { getNotes } from "@/lib/api";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * App Shell provides the two-column layout structure:
 * - Left: Sidebar for page navigation (server-rendered page list)
 * - Right: Main content area for page rendering
 */
export async function AppShell({ children }: AppShellProps) {
  const pages = await getNotes();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar: basis-64 (256px) with page list */}
      <div className="hidden shrink-0 basis-64 md:block">
        <Sidebar pages={pages} className="h-full" />
      </div>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto bg-white dark:bg-dark-surface transition-colors">
        {children}
      </main>
    </div>
  );
}
