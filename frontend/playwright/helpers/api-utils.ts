import type { APIRequestContext } from "@playwright/test";
import type { Note, NoteCreate } from "../../types/note";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function createTestNote(
  request: APIRequestContext,
  data: NoteCreate
): Promise<Note> {
  const res = await request.post(`${API_BASE_URL}/api/notes`, { data });
  if (!res.ok()) {
    throw new Error(`Failed to create test note: ${res.status()}`);
  }
  return (await res.json()) as Note;
}

export async function deleteTestNote(request: APIRequestContext, id: string): Promise<void> {
  const res = await request.delete(`${API_BASE_URL}/api/notes/${id}`);
  if (!res.ok()) {
    throw new Error(`Failed to delete test note: ${res.status()}`);
  }
}

export async function getTestNote(request: APIRequestContext, id: string): Promise<Note> {
  const res = await request.get(`${API_BASE_URL}/api/notes/${id}`);
  if (!res.ok()) {
    throw new Error(`Failed to fetch test note: ${res.status()}`);
  }
  return (await res.json()) as Note;
}
