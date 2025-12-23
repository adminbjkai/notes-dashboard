export type DocBadge = {
  label: string;
  value: string;
  status: "passing" | "failing" | "warning";
  source_file: string;
  line_number: number;
};

export type DocHeading = {
  level: number;
  text: string;
  id: string;
};

export type DocTreeNode = {
  id: string;
  title: string;
  filename: string;
  children: DocTreeNode[];
  modified_at: string;
};

export type DocContent = {
  id: string;
  title: string;
  filename: string;
  content: string;
  badges: DocBadge[];
  headings: DocHeading[];
  modified_at: string;
};

export type DocStatus = {
  badges: DocBadge[];
  last_modified: string | null;
  files_checked: number;
};

export type DocSearchResult = {
  doc_id: string;
  filename: string;
  line: number;
  match: string;
  context: string;
};

export type ProjectPulse = {
  summary: string;
  metrics: Record<string, string>;
  citations: Array<{ file: string; line: number; excerpt: string }>;
  generated_by: "rule-based" | "claude";
};
