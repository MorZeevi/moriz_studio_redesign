const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const ts = require("typescript");
const { SourceMapConsumer } = require("next/dist/compiled/source-map");
const { instrumentSource } = require("../../tools/devtools/source-loader.cjs");
const root = process.cwd();

function attributes(code) {
  const file = ts.createSourceFile(
    "sample.tsx",
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const elements = [];
  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      elements.push({
        tag: node.tagName.getText(file),
        values: Object.fromEntries(
          node.attributes.properties
            .filter(ts.isJsxAttribute)
            .map((a) => [a.name.getText(file), a.initializer?.text]),
        ),
      });
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return elements;
}

test("original locations and component names survive type erasure and nested callbacks", () => {
  const source =
    '"use client";\nexport function Hero({items}: {items: string[]}) {\n  return <section>{items.map(item => <span>{item}</span>)}</section>;\n}\n';
  const { code, map } = instrumentSource(
    source,
    path.join(root, "src/components/Hero.tsx"),
    root,
  );
  assert.match(code, /^"use client";/);
  const [section, span] = attributes(code);
  assert.equal(
    section.values["data-inspector-file"],
    "src/components/Hero.tsx",
  );
  assert.equal(section.values["data-inspector-component"], "Hero");
  assert.equal(section.values["data-inspector-line"], "3");
  assert.equal(section.values["data-inspector-column"], "10");
  assert.equal(span.values["data-inspector-component"], "Hero");
  assert.equal(span.values["data-inspector-line"], "3");
  assert.deepEqual(map.sourcesContent, [source]);
});

test("source maps point emitted JSX back to its original source location", async () => {
  const source =
    "export function Hero(props: {name: string}) {\n  return <button>{props.name}</button>;\n}";
  const { code, map } = instrumentSource(
    source,
    path.join(root, "src/components/Hero.tsx"),
    root,
  );
  const lines = code.split("\n");
  const index = lines.findIndex((line) => line.includes("<button"));
  const consumer = await new SourceMapConsumer(map);
  const position = consumer.originalPositionFor({
    line: index + 1,
    column: lines[index].indexOf("<button"),
  });
  assert.equal(position.line, 2);
  assert.equal(position.column, 9);
});

test("arrow wrappers, SVG and spreads receive intrinsic metadata only", () => {
  const source =
    'const Icon = memo(() => <svg {...props}><path d="M0 0" /><Other /></svg>);';
  const { code } = instrumentSource(
    source,
    path.join(root, "src/components/Icon.tsx"),
    root,
  );
  const [svg, svgPath, other] = attributes(code);
  assert.equal(svg.values["data-inspector-component"], "Icon");
  assert.equal(svgPath.values["data-inspector-component"], "Icon");
  assert.equal(other.values["data-inspector-file"], undefined);
  assert.ok(code.indexOf("{...props}") < code.indexOf("data-inspector-file"));
});

test("reserved attributes are replaced and anonymous declarations do not invent names", () => {
  const source = 'export default () => <div data-inspector-file="wrong" />;';
  const { code } = instrumentSource(
    source,
    path.join(root, "src/app/page.tsx"),
    root,
  );
  assert.equal((code.match(/data-inspector-file=/g) || []).length, 1);
  assert.equal(
    attributes(code)[0].values["data-inspector-component"],
    undefined,
  );
});

test("devtools and foreign files are passed through untouched", () => {
  for (const file of [
    "src/components/devtools/tool.tsx",
    "node_modules/library/a.tsx",
    "src/lib/value.ts",
  ]) {
    const source = "const Value = <div />;";
    assert.deepEqual(instrumentSource(source, path.join(root, file), root), {
      code: source,
      map: null,
    });
  }
});

test("JSX constants are not mistaken for components and named classes are recognized", () => {
  const source =
    "export function Hero() { const Content = <span />; return Content; }\nclass Card extends React.Component { render() { return <article />; } }";
  const { code } = instrumentSource(
    source,
    path.join(root, "src/components/Hero.tsx"),
    root,
  );
  const [span, article] = attributes(code);
  assert.equal(span.values["data-inspector-component"], "Hero");
  assert.equal(article.values["data-inspector-component"], "Card");
});
