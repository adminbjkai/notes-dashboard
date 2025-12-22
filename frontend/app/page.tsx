import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <FileText className="h-8 w-8 text-gray-400" />
        </div>
        <h1 className="mb-2 text-xl font-medium text-gray-900">
          Select a page to start editing
        </h1>
        <p className="mb-6 text-gray-500">
          Choose a page from the sidebar, or create a new one.
        </p>
        <Link href="/notes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Page
          </Button>
        </Link>
      </div>
    </div>
  );
}
