import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

// Node's test runner does not read tsconfig paths. Map `@/` and extensionless
// TypeScript imports onto src so the SEO unit tests can load those modules.
function withTypeScript(filePath) {
  if (existsSync(filePath)) return filePath;
  if (existsSync(`${filePath}.ts`)) return `${filePath}.ts`;
  if (existsSync(`${filePath}.tsx`)) return `${filePath}.tsx`;
  if (existsSync(`${filePath}/index.ts`)) return `${filePath}/index.ts`;
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const file = withTypeScript(
      fileURLToPath(new URL(`../src/${specifier.slice(2)}`, import.meta.url)),
    );
    if (file) return { url: pathToFileURL(file).href, shortCircuit: true };
  }
  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    context.parentURL &&
    !/\.(?:[cm]?[jt]s|json|mjs|css)$/.test(specifier)
  ) {
    const file = withTypeScript(
      fileURLToPath(new URL(specifier, context.parentURL)),
    );
    if (file) return { url: pathToFileURL(file).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
