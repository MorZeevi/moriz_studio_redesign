export type InspectorRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SourceContext = {
  kind: "exact" | "containing" | "unavailable";
  component?: string;
  file?: string;
  line?: number;
  column?: number;
};

export type SelectedElementContext = {
  tag: string;
  id: string;
  classes: string[];
  dataAttributes: Record<string, string>;
  text: string;
  textTruncated: boolean;
  accessibleName: string;
  selector: string;
  rect: InspectorRect;
  source: SourceContext;
};

export type PromptContext = {
  page: { pathname: string; language: string; direction: string };
  element: SelectedElementContext;
  request: string;
};
