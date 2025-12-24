import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

/**
 * Media Features Tests
 * Tests Image URL, Image Upload, and File Attachment features
 */

const API_BASE = "http://localhost:8000";

async function createTestNote(request: any, data: { title: string; content?: string }) {
  const response = await request.post(`${API_BASE}/api/notes`, {
    data: {
      title: data.title,
      content: data.content || "",
    },
  });
  return response.json();
}

async function deleteTestNote(request: any, id: string) {
  await request.delete(`${API_BASE}/api/notes/${id}`);
}

test.describe("Image URL Insertion", () => {
  test("inserts image via slash command and Image URL dialog", async ({ page, request }) => {
    // Use a stable, public domain image URL
    const testImageUrl = "https://via.placeholder.com/150";
    const noteTitle = `Image Test ${Date.now()}`;
    let noteId: string | null = null;

    try {
      // Create a fresh note
      const note = await createTestNote(request, { title: noteTitle });
      noteId = note.id;

      // Navigate to the note
      await page.goto(`http://localhost:3000/notes/${noteId}`);
      await page.waitForSelector("main", { timeout: 10000 });

      // Click in the editor area to focus it
      const editorArea = page.locator(".tiptap, .ProseMirror").first();
      await editorArea.click();
      await page.waitForTimeout(300);

      // Type / to open slash command menu
      await page.keyboard.type("/");
      await page.waitForTimeout(500);

      // Look for the slash menu and select "Image (URL)"
      const imageUrlOption = page.locator('button:has-text("Image (URL)")').first();
      await expect(imageUrlOption).toBeVisible({ timeout: 5000 });
      await imageUrlOption.click();
      await page.waitForTimeout(300);

      // The dialog should now be open
      const dialog = page.locator('text="Insert Image from URL"');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Find and fill the URL input
      const urlInput = page.locator('input[type="url"], input#image-url');
      await expect(urlInput).toBeVisible({ timeout: 3000 });
      await urlInput.fill(testImageUrl);

      // Click the Insert button
      const insertButton = page.locator('button:has-text("Insert")');
      await insertButton.click();
      await page.waitForTimeout(500);

      // Verify the dialog closed
      await expect(dialog).not.toBeVisible({ timeout: 3000 });

      // Verify the image is in the editor (check for img tag with our URL)
      // The image may be wrapped in a resize container, so check for count instead of visibility
      const image = page.locator(`img[src="${testImageUrl}"]`);
      await expect(image).toHaveCount(1, { timeout: 5000 });

      // Also verify the resize controls are visible (S, M, L, Full buttons)
      const resizeControls = page.locator('button:has-text("S"), button:has-text("M"), button:has-text("L"), button:has-text("Full")');
      await expect(resizeControls.first()).toBeVisible({ timeout: 3000 });

      // Wait for auto-save to complete (look for "Saved" indicator)
      const savedIndicator = page.locator('text="Saved"');
      await expect(savedIndicator).toBeVisible({ timeout: 10000 });

      // Reload page and verify persistence
      await page.reload();
      await page.waitForSelector("main", { timeout: 10000 });

      // Check image still exists after reload
      const persistedImage = page.locator(`img[src="${testImageUrl}"]`);
      await expect(persistedImage).toHaveCount(1, { timeout: 5000 });

    } finally {
      // Cleanup
      if (noteId) {
        await deleteTestNote(request, noteId);
      }
    }
  });

  test("cancels image URL dialog without inserting", async ({ page, request }) => {
    const noteTitle = `Cancel Test ${Date.now()}`;
    let noteId: string | null = null;

    try {
      const note = await createTestNote(request, { title: noteTitle });
      noteId = note.id;

      await page.goto(`http://localhost:3000/notes/${noteId}`);
      await page.waitForSelector("main", { timeout: 10000 });

      const editorArea = page.locator(".tiptap, .ProseMirror").first();
      await editorArea.click();
      await page.waitForTimeout(300);

      // Open slash menu and select Image URL
      await page.keyboard.type("/");
      await page.waitForTimeout(500);

      const imageUrlOption = page.locator('button:has-text("Image (URL)")').first();
      await expect(imageUrlOption).toBeVisible({ timeout: 5000 });
      await imageUrlOption.click();
      await page.waitForTimeout(300);

      // Verify dialog is open
      const dialog = page.locator('text="Insert Image from URL"');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Click Cancel button
      const cancelButton = page.locator('button:has-text("Cancel")');
      await cancelButton.click();

      // Dialog should close
      await expect(dialog).not.toBeVisible({ timeout: 3000 });

      // Verify no image was inserted
      const images = page.locator("main img");
      await expect(images).toHaveCount(0);

    } finally {
      if (noteId) {
        await deleteTestNote(request, noteId);
      }
    }
  });
});

test.describe("Image Upload", () => {
  test("uploads image via slash command and file picker", async ({ page, request }) => {
    const noteTitle = `Upload Test ${Date.now()}`;
    let noteId: string | null = null;

    try {
      // Create a fresh note
      const note = await createTestNote(request, { title: noteTitle });
      noteId = note.id;

      // Navigate to the note
      await page.goto(`http://localhost:3000/notes/${noteId}`);
      await page.waitForSelector("main", { timeout: 10000 });

      // Click in the editor area to focus it
      const editorArea = page.locator(".tiptap, .ProseMirror").first();
      await editorArea.click();
      await page.waitForTimeout(300);

      // Type / to open slash command menu
      await page.keyboard.type("/");
      await page.waitForTimeout(500);

      // Set up file chooser handler BEFORE clicking the option
      const fileChooserPromise = page.waitForEvent("filechooser");

      // Look for the slash menu and select "Image (upload)"
      const imageUploadOption = page.locator('button:has-text("Image (upload)")').first();
      await expect(imageUploadOption).toBeVisible({ timeout: 5000 });
      await imageUploadOption.click();

      // Wait for file chooser and provide a test image
      const fileChooser = await fileChooserPromise;

      // Create a simple 1x1 PNG in memory (smallest valid PNG)
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, // IDAT chunk
        0x54, 0x08, 0xd7, 0x63, 0xf8, 0xff, 0xff, 0x3f,
        0x00, 0x05, 0xfe, 0x02, 0xfe, 0xdc, 0xcc, 0x59,
        0xe7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, // IEND chunk
        0x44, 0xae, 0x42, 0x60, 0x82
      ]);

      await fileChooser.setFiles({
        name: "test-image.png",
        mimeType: "image/png",
        buffer: pngBuffer,
      });

      // Wait for upload to complete and image to appear
      await page.waitForTimeout(1000);

      // Verify an image with /uploads/ URL is in the editor
      // Note: src may be absolute (http://localhost:8000/uploads/...) or relative (/uploads/...)
      const uploadedImage = page.locator('img[src*="/uploads/"]');
      await expect(uploadedImage).toHaveCount(1, { timeout: 10000 });

      // Verify the resize controls are visible
      const resizeControls = page.locator('button:has-text("S"), button:has-text("M"), button:has-text("L"), button:has-text("Full")');
      await expect(resizeControls.first()).toBeVisible({ timeout: 3000 });

      // Wait for auto-save
      const savedIndicator = page.locator('text="Saved"');
      await expect(savedIndicator).toBeVisible({ timeout: 10000 });

      // Get the image src for persistence check
      const imageSrc = await uploadedImage.getAttribute("src");

      // Reload and verify persistence
      await page.reload();
      await page.waitForSelector("main", { timeout: 10000 });

      // Check image still exists after reload
      const persistedImage = page.locator(`img[src="${imageSrc}"]`);
      await expect(persistedImage).toHaveCount(1, { timeout: 5000 });

    } finally {
      if (noteId) {
        await deleteTestNote(request, noteId);
      }
    }
  });
});

test.describe("File Attachment", () => {
  test("attaches file via slash command and file picker", async ({ page, request }) => {
    const noteTitle = `File Attach Test ${Date.now()}`;
    let noteId: string | null = null;

    try {
      const note = await createTestNote(request, { title: noteTitle });
      noteId = note.id;

      await page.goto(`http://localhost:3000/notes/${noteId}`);
      await page.waitForSelector("main", { timeout: 10000 });

      const editorArea = page.locator(".tiptap, .ProseMirror").first();
      await editorArea.click();
      await page.waitForTimeout(300);

      // Open slash menu
      await page.keyboard.type("/");
      await page.waitForTimeout(500);

      // Set up file chooser handler
      const fileChooserPromise = page.waitForEvent("filechooser");

      // Select "File attachment"
      const fileAttachOption = page.locator('button:has-text("File attachment")').first();
      await expect(fileAttachOption).toBeVisible({ timeout: 5000 });
      await fileAttachOption.click();

      const fileChooser = await fileChooserPromise;

      // Create a simple text file
      const textBuffer = Buffer.from("Test file content for attachment");
      await fileChooser.setFiles({
        name: "test-document.txt",
        mimeType: "text/plain",
        buffer: textBuffer,
      });

      await page.waitForTimeout(1000);

      // Verify the file attachment chip appears with the filename
      const attachmentChip = page.locator('text="test-document.txt"');
      await expect(attachmentChip).toBeVisible({ timeout: 10000 });

      // Wait for auto-save
      const savedIndicator = page.locator('text="Saved"');
      await expect(savedIndicator).toBeVisible({ timeout: 10000 });

      // Reload and verify persistence
      await page.reload();
      await page.waitForSelector("main", { timeout: 10000 });

      // Check attachment still exists after reload
      const persistedAttachment = page.locator('text="test-document.txt"');
      await expect(persistedAttachment).toBeVisible({ timeout: 5000 });

    } finally {
      if (noteId) {
        await deleteTestNote(request, noteId);
      }
    }
  });
});
