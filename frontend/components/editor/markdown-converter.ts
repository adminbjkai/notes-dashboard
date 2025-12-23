/**
 * Markdown ⇄ HTML conversion using battle-tested libraries.
 * - marked: Markdown → HTML (handles GFM tables, task lists, etc.)
 * - turndown: HTML → Markdown (handles any HTML structure)
 */
import { marked, Renderer } from "marked";
import TurndownService from "turndown";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const headingRenderer = new Renderer();
headingRenderer.heading = function ({ text, depth }) {
  const id = slugify(text);
  return `<h${depth} id="${id}">${text}</h${depth}>\n`;
};

// Configure marked for GFM (GitHub Flavored Markdown)
marked.setOptions({
  gfm: true,
  breaks: false,
});

// Configure turndown for markdown output
const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
  bulletListMarker: "-",
});

// Add GFM table support to turndown
turndownService.addRule("tableCell", {
  filter: ["th", "td"],
  replacement: function (content: string): string {
    return ` ${content.trim()} |`;
  },
});

turndownService.addRule("tableRow", {
  filter: "tr",
  replacement: function (content: string, node: Node): string {
    const cells = content.trim();
    const element = node as HTMLElement;
    // Check for header row: either parent is THEAD or row contains TH cells
    // TipTap doesn't use <thead>, it just uses <th> cells in the first row
    const isHeader =
      element.parentElement?.tagName === "THEAD" ||
      (element.querySelector("th") !== null &&
       element.parentElement?.tagName === "TBODY" &&
       element === element.parentElement?.firstElementChild) ||
      (element.querySelector("th") !== null &&
       element.parentElement?.tagName === "TABLE" &&
       element === element.parentElement?.querySelector("tr"));
    if (isHeader) {
      const cellCount = element.querySelectorAll("th, td").length;
      const separator = "| " + Array(cellCount).fill("---").join(" | ") + " |";
      return "|" + cells + "\n" + separator + "\n";
    }
    return "|" + cells + "\n";
  },
});

turndownService.addRule("table", {
  filter: "table",
  replacement: function (content: string): string {
    return "\n" + content + "\n";
  },
});

// Add task list support to turndown
turndownService.addRule("taskListItem", {
  filter: function (node: HTMLElement): boolean {
    return (
      node.nodeName === "LI" &&
      node.getAttribute("data-type") === "taskItem"
    );
  },
  replacement: function (content: string, node: Node): string {
    const isChecked = (node as HTMLElement).getAttribute("data-checked") === "true";
    const checkbox = isChecked ? "[x]" : "[ ]";
    // Extract text from the div inside the task item
    const div = (node as HTMLElement).querySelector("div");
    const text = div ? div.textContent?.trim() : content.trim();
    return `- ${checkbox} ${text}\n`;
  },
});

turndownService.addRule("taskList", {
  filter: function (node: HTMLElement): boolean {
    return (
      node.nodeName === "UL" &&
      node.getAttribute("data-type") === "taskList"
    );
  },
  replacement: function (content: string): string {
    return content + "\n";
  },
});

// Handle callouts (custom TipTap extension)
turndownService.addRule("callout", {
  filter: function (node: HTMLElement): boolean {
    return (
      node.nodeName === "DIV" &&
      node.getAttribute("data-type") === "callout"
    );
  },
  replacement: function (content: string, node: Node): string {
    const type = (node as HTMLElement).getAttribute("data-callout-type") || "info";
    const lines = content.trim().split("\n");
    return `> [!${type}]\n${lines.map((line: string) => `> ${line}`).join("\n")}\n\n`;
  },
});

// Keep code blocks with language
turndownService.addRule("codeBlock", {
  filter: function (node: HTMLElement): boolean {
    return (
      node.nodeName === "PRE" &&
      node.firstChild?.nodeName === "CODE"
    );
  },
  replacement: function (content: string, node: Node): string {
    const codeEl = (node as HTMLElement).querySelector("code");
    const langMatch = codeEl?.className.match(/language-(\w+)/);
    const lang = langMatch ? langMatch[1] : "";
    const code = codeEl?.textContent || content;
    return `\n\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
  },
});

// Handle file attachment links (convert to markdown links)
turndownService.addRule("fileAttachment", {
  filter: function (node: HTMLElement): boolean {
    return (
      node.nodeName === "A" &&
      (node.classList.contains("file-attachment") ||
       (node.getAttribute("href")?.startsWith("/uploads/") ?? false))
    );
  },
  replacement: function (content: string, node: Node): string {
    const href = (node as HTMLAnchorElement).getAttribute("href") || "";
    const filename = content.trim() || href.split("/").pop() || "attachment";
    return `[${filename}](${href})`;
  },
});

/**
 * Convert Markdown to HTML for TipTap editor.
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return "";

  // Pre-process callouts before marked (since marked doesn't know about them)
  let processed = markdown.replace(
    /^> \[!(\w+)\]\n((?:^> .+\n?)+)/gm,
    (_, type, content) => {
      const innerContent = content.replace(/^> /gm, "").trim();
      return `<div data-type="callout" data-callout-type="${type}" class="callout callout-${type} border-l-4 rounded-r-md p-4 my-4"><p>${innerContent}</p></div>\n\n`;
    }
  );

  // Pre-process task lists before marked
  processed = processed.replace(
    /^- \[([ x])\] (.+)$/gm,
    (_, checked, text) => {
      const isChecked = checked === "x";
      return `<li data-type="taskItem" data-checked="${isChecked}"><label><input type="checkbox" ${isChecked ? "checked" : ""}></label><div>${text}</div></li>`;
    }
  );
  // Wrap consecutive task items in task list
  processed = processed.replace(
    /(<li data-type="taskItem"[^>]*>.*<\/li>\n?)+/g,
    (match) => `<ul data-type="taskList">${match}</ul>\n\n`
  );

  // Use marked for the rest
  const html = marked.parse(processed, { renderer: headingRenderer }) as string;

  return html;
}

/**
 * Convert HTML (from TipTap) to Markdown for storage.
 */
export function htmlToMarkdown(html: string): string {
  if (!html || html === "<p></p>") return "";

  return turndownService.turndown(html).trim();
}
