import { markdownToHtml } from "@/components/editor/markdown-converter";

type DocsContentProps = {
  markdown: string;
};

export function DocsContent({ markdown }: DocsContentProps) {
  const html = markdownToHtml(markdown);
  return (
    <article
      className="prose prose-slate max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
