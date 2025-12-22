import { Node, mergeAttributes } from "@tiptap/core";

export interface CalloutOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (attributes?: { type?: string }) => ReturnType;
      toggleCallout: (attributes?: { type?: string }) => ReturnType;
    };
  }
}

export const Callout = Node.create<CalloutOptions>({
  name: "callout",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: "block",

  content: "block+",

  defining: true,

  addAttributes() {
    return {
      type: {
        default: "info",
        parseHTML: (element) => element.getAttribute("data-callout-type") || "info",
        renderHTML: (attributes) => ({
          "data-callout-type": attributes.type,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const type = node.attrs.type || "info";
    const typeStyles: Record<string, string> = {
      info: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950",
      warning: "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950",
      error: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
      success: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
    };

    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "callout",
        "data-callout-type": type,
        class: `callout callout-${type} border-l-4 rounded-r-md p-4 my-4 ${typeStyles[type] || typeStyles.info}`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setCallout:
        (attributes) =>
        ({ commands }) => {
          return commands.wrapIn(this.name, attributes);
        },
      toggleCallout:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleWrap(this.name, attributes);
        },
    };
  },
});
