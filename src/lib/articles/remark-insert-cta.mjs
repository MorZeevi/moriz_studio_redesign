import { parse } from "yaml";

/**
 * Inserts `<CtaCard />` near the middle of an article that does not already
 * place one, unless frontmatter sets `cta: false`.
 */
export function insertAutoCta(tree) {
  const data = frontmatter(tree);
  if (data.cta === false || hasCta(tree)) return false;
  const index = middleIndex(tree.children ?? []);
  tree.children.splice(index, 0, {
    type: "mdxJsxFlowElement",
    name: "CtaCard",
    attributes: [],
    children: [],
    data: { _mdxExplicitJsx: true },
  });
  return true;
}

export default function remarkInsertCta() {
  return (tree) => {
    insertAutoCta(tree);
  };
}

function frontmatter(tree) {
  const node = tree.children?.find((child) => child.type === "yaml");
  if (!node || typeof node.value !== "string") return {};
  try {
    const data = parse(node.value, { schema: "core", strict: true });
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}

function hasCta(tree) {
  const stack = [...(tree.children ?? [])];
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== "object") continue;
    if (
      (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") &&
      node.name === "CtaCard"
    ) {
      return true;
    }
    if (Array.isArray(node.children)) stack.push(...node.children);
  }
  return false;
}

function middleIndex(children) {
  const flow = children
    .map((node, index) => ({ node, index }))
    .filter(({ node }) => node.type !== "yaml" && node.type !== "toml");
  if (flow.length < 2) return children.length;
  const target = Math.floor(flow.length / 2);
  const headings = flow.filter(
    ({ node }) => node.type === "heading" && node.depth === 2,
  );
  const nearest = headings.reduce((best, item) => {
    const bestAt = flow.indexOf(best);
    const itemAt = flow.indexOf(item);
    const bestDistance = Math.abs(bestAt - target);
    const itemDistance = Math.abs(itemAt - target);
    if (itemDistance < bestDistance) return item;
    if (itemDistance === bestDistance && itemAt >= target) return item;
    return best;
  }, headings[0]);
  return (nearest ?? flow[target]).index;
}
