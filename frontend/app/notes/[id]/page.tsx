import { notFound } from "next/navigation";
import { PageEditor } from "@/components/pages/page-editor";
import { getNote } from "@/lib/api";

export default async function EditNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = await getNote(id);

  if (!note) {
    notFound();
  }

  return <PageEditor page={note} />;
}
