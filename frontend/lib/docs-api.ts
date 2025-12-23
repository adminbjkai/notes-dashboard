import { getApiUrl } from "@/lib/api";
import type {
  DocContent,
  DocSearchResult,
  DocStatus,
  DocTreeNode,
  ProjectPulse,
} from "@/types/docs";

export async function getDocsTree(): Promise<DocTreeNode[]> {
  const res = await fetch(`${getApiUrl()}/api/docs/tree`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function getDocById(id: string): Promise<DocContent | null> {
  const res = await fetch(`${getApiUrl()}/api/docs/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export async function getDocsStatus(): Promise<DocStatus | null> {
  const res = await fetch(`${getApiUrl()}/api/docs/status`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export async function searchDocs(query: string): Promise<DocSearchResult[]> {
  const res = await fetch(
    `${getApiUrl()}/api/docs/search?q=${encodeURIComponent(query)}`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  return res.json();
}

export async function getProjectPulse(): Promise<ProjectPulse | null> {
  const res = await fetch(`${getApiUrl()}/api/docs/pulse`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}
