import Link from "next/link";

type DocsBreadcrumbsProps = {
  title?: string;
};

export function DocsBreadcrumbs({ title }: DocsBreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-xs text-gray-500">
      <Link href="/docs" className="hover:text-gray-700">
        Docs
      </Link>
      {title ? (
        <>
          <span className="text-gray-400">/</span>
          <span className="text-gray-700 dark:text-gray-200">{title}</span>
        </>
      ) : null}
    </nav>
  );
}
