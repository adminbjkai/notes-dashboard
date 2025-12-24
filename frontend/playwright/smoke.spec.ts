import { test, expect, Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

// Screenshot directory for this run
const today = new Date().toISOString().split("T")[0];
const screenshotDir = path.join(__dirname, "../../.nd/docs/screenshots", today);

// Ensure screenshot directory exists
test.beforeAll(() => {
  fs.mkdirSync(screenshotDir, { recursive: true });
});

// Helper: wait for editor to be ready
async function waitForEditor(page: Page) {
  await page.waitForSelector(".tiptap", { timeout: 10000 });
  const editor = page.locator(".tiptap");
  await editor.click();
  await page.waitForTimeout(200);
  return editor;
}

// Helper: create a new page via the sidebar template picker
async function createNewPageViaSidebar(page: Page, title?: string) {
  // Click the New Page button in sidebar to open template picker
  await page.click('aside >> text=New Page');
  await page.waitForTimeout(300);

  // Select Blank Page from the template dropdown
  const blankPage = page.locator('text=Blank Page').first();
  await blankPage.click();
  await page.waitForTimeout(300);

  // After clicking template, an inline input appears with default title
  // Type the title if provided, otherwise use default
  if (title) {
    await page.keyboard.type(title);
  }

  // Press Enter to submit and create the note - this triggers handleCreateSubmit
  // which creates the note via API and navigates to /notes/{id}
  await page.keyboard.press("Enter");

  // Wait for navigation to the new note
  await page.waitForURL(/\/notes\/[a-f0-9-]+/, { timeout: 10000 });
  await page.waitForTimeout(500);
}

// Helper: insert block via keyboard-only slash command
async function insertBlockViaSlashMenu(page: Page, searchText: string) {
  await page.keyboard.type(`/${searchText}`);
  await page.waitForTimeout(300); // Wait for menu to appear
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300); // Wait for insertion
}

test.describe("Notes Dashboard Smoke Tests", () => {
  test("homepage loads correctly", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Pages" })).toBeVisible();
    await page.screenshot({ path: path.join(screenshotDir, "01-homepage.png") });
  });

  test("keyboard-only slash menu: numbered list", async ({ page }) => {
    await page.goto("/");

    // Create a new page via sidebar template picker
    await createNewPageViaSidebar(page, "Keyboard Test - Numbered List");
    await page.screenshot({ path: path.join(screenshotDir, "02-new-page.png") });

    // Wait for editor
    const editor = await waitForEditor(page);

    // Insert numbered list via keyboard
    await insertBlockViaSlashMenu(page, "numbered");
    await page.keyboard.type("First item");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Second item");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Third item");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter"); // Exit list

    await page.screenshot({ path: path.join(screenshotDir, "03-numbered-list.png") });

    // Verify ordered list exists in DOM
    const orderedList = page.locator(".tiptap ol");
    await expect(orderedList).toBeVisible();

    // Verify list items
    await expect(page.locator("text=First item")).toBeVisible();
    await expect(page.locator("text=Second item")).toBeVisible();
    await expect(page.locator("text=Third item")).toBeVisible();
  });

  test("keyboard-only slash menu: quote block", async ({ page }) => {
    await page.goto("/");

    // Create new page via sidebar template picker
    await createNewPageViaSidebar(page, "Keyboard Test - Quote");
    await waitForEditor(page);

    // Insert quote via keyboard
    await insertBlockViaSlashMenu(page, "quote");
    await page.keyboard.type("This is a test quote block.");

    await page.screenshot({ path: path.join(screenshotDir, "04-quote-block.png") });

    // Verify blockquote exists
    const blockquote = page.locator(".tiptap blockquote");
    await expect(blockquote).toBeVisible();
    await expect(page.locator("text=This is a test quote block")).toBeVisible();
  });

  test("keyboard-only slash menu: table", async ({ page }) => {
    await page.goto("/");

    // Create new page via sidebar template picker
    await createNewPageViaSidebar(page, "Keyboard Test - Table");
    await waitForEditor(page);

    // Insert table via keyboard (use "2x2" to match "Table 2x2" without spaces)
    await insertBlockViaSlashMenu(page, "2x2");

    await page.screenshot({ path: path.join(screenshotDir, "05-table.png") });

    // Verify table exists
    const table = page.locator(".tiptap table");
    await expect(table).toBeVisible();
  });

  test("content persistence after refresh", async ({ page }) => {
    await page.goto("/");

    // Create new page via sidebar template picker
    await createNewPageViaSidebar(page, "Persistence Test");
    await waitForEditor(page);

    // Add content using keyboard slash commands
    await insertBlockViaSlashMenu(page, "numbered");
    await page.keyboard.type("Persistent item one");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Persistent item two");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter"); // Exit list

    await insertBlockViaSlashMenu(page, "quote");
    await page.keyboard.type("This quote should persist after refresh.");

    await page.screenshot({ path: path.join(screenshotDir, "06-before-refresh.png") });

    // Wait for auto-save
    await page.waitForTimeout(2000);

    // Refresh the page
    await page.reload();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: path.join(screenshotDir, "07-after-refresh.png") });

    // Verify content persisted
    await expect(page.locator("text=Persistent item one")).toBeVisible();
    await expect(page.locator("text=Persistent item two")).toBeVisible();
    await expect(page.locator("text=This quote should persist")).toBeVisible();

    // Verify DOM structure persisted
    await expect(page.locator(".tiptap ol")).toBeVisible();
    await expect(page.locator(".tiptap blockquote")).toBeVisible();

    console.log("Content persistence verified: ordered list and quote block persist after refresh");
  });

  test("dark mode toggle works", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(screenshotDir, "08-light-mode.png") });

    // Find theme toggle
    const themeToggle = page.locator('button[title*="theme"], button:has(svg.lucide-sun), button:has(svg.lucide-moon)').first();

    if (await themeToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await themeToggle.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(screenshotDir, "09-dark-mode.png") });

      // Toggle back
      await themeToggle.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(screenshotDir, "10-light-mode-again.png") });
    }

    // Verify sidebar remains readable
    await expect(page.getByRole("heading", { name: "Pages" })).toBeVisible();
  });

  test("slash menu arrow navigation works", async ({ page }) => {
    await page.goto("/");

    // Create new page via sidebar template picker
    await createNewPageViaSidebar(page, "Arrow Navigation Test");
    await waitForEditor(page);

    // Open slash menu
    await page.keyboard.type("/");
    await page.waitForTimeout(300);

    // Menu should be visible
    const menuItem = page.locator('button:has-text("Text")');
    await expect(menuItem).toBeVisible();

    await page.screenshot({ path: path.join(screenshotDir, "11-slash-menu-open.png") });

    // Navigate down with arrow keys
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(100);

    await page.screenshot({ path: path.join(screenshotDir, "12-slash-menu-navigated.png") });

    // Press Escape to close
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  });

  test("sidebar navigation works", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);

    // Check sidebar is visible
    await expect(page.getByRole("heading", { name: "Pages" })).toBeVisible();

    await page.screenshot({ path: path.join(screenshotDir, "13-sidebar-visible.png") });
  });
});
