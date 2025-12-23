import { redirect } from "next/navigation";
import { getApiUrl } from "@/lib/api";

/**
 * Create a new page and redirect to the editor.
 * This is a server action that happens on navigation.
 */
export default async function NewNotePage() {
  // Create a new untitled page
  const res = await fetch(`${getApiUrl()}/api/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Untitled" }),
    cache: "no-store",
  });

  if (!res.ok) {
    // If creation fails, redirect to home
    redirect("/");
  }

  const page = await res.json();
  redirect(`/notes/${page.id}`);
}
