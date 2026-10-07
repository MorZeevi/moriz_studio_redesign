const path = require("node:path");
const ts = require("typescript");

function instrumentSource(source, filename, root) {
  const relative = path.relative(root, filename).split(path.sep).join("/");
  if (
    !relative.startsWith("src/") ||
    relative.startsWith("src/components/devtools/") ||
    !relative.endsWith(".tsx")
  ) {
    return { code: source, map: null };
  }
  const result = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.Preserve,
      verbatimModuleSyntax: true,
      sourceMap: true,
      inlineSources: true,
    },
    transformers: {
      before: [
        (context) => {
          const factory = context.factory;
          return (file) => {
            function componentName(node) {
              let insideFunction = false;
              for (let parent = node.parent; parent; parent = parent.parent) {
                if (
                  (ts.isFunctionDeclaration(parent) ||
                    ts.isFunctionExpression(parent) ||
                    ts.isClassDeclaration(parent)) &&
                  parent.name &&
                  /^[A-Z]/.test(parent.name.text)
                )
                  return parent.name.text;
                if (
                  ts.isArrowFunction(parent) ||
                  ts.isFunctionExpression(parent)
                )
                  insideFunction = true;
                if (
                  insideFunction &&
                  ts.isVariableDeclaration(parent) &&
                  ts.isIdentifier(parent.name) &&
                  /^[A-Z]/.test(parent.name.text)
                )
                  return parent.name.text;
              }
              return null;
            }
            function visit(node) {
              if (
                (ts.isJsxOpeningElement(node) ||
                  ts.isJsxSelfClosingElement(node)) &&
                ts.isIdentifier(node.tagName) &&
                /^[a-z]/.test(node.tagName.text)
              ) {
                const position = file.getLineAndCharacterOfPosition(
                  node.getStart(file),
                );
                const values = {
                  "data-inspector-file": relative,
                  "data-inspector-line": String(position.line + 1),
                  "data-inspector-column": String(position.character + 1),
                  "data-inspector-component": componentName(node),
                };
                const existing = node.attributes.properties.filter(
                  (attribute) =>
                    !(
                      ts.isJsxAttribute(attribute) &&
                      attribute.name.getText(file).startsWith("data-inspector-")
                    ),
                );
                const attributes = factory.createJsxAttributes([
                  ...existing,
                  ...Object.entries(values)
                    .filter(([, value]) => value !== null)
                    .map(([name, value]) =>
                      factory.createJsxAttribute(
                        factory.createIdentifier(name),
                        factory.createStringLiteral(value),
                      ),
                    ),
                ]);
                const updated = ts.isJsxOpeningElement(node)
                  ? factory.updateJsxOpeningElement(
                      node,
                      node.tagName,
                      node.typeArguments,
                      attributes,
                    )
                  : factory.updateJsxSelfClosingElement(
                      node,
                      node.tagName,
                      node.typeArguments,
                      attributes,
                    );
                return ts.visitEachChild(updated, visit, context);
              }
              return ts.visitEachChild(node, visit, context);
            }
            return ts.visitNode(file, visit);
          };
        },
      ],
    },
  });
  const map = JSON.parse(result.sourceMapText);
  // Keep the original TSX available to downstream source-map consumers.
  map.sources = [filename];
  return {
    code: result.outputText.replace(/\/\/# sourceMappingURL=.*(?:\r?\n)?$/, ""),
    map,
  };
}

module.exports = function sourceLoader(source) {
  const result = instrumentSource(source, this.resourcePath, this.rootContext);
  this.callback(null, result.code, result.map);
};
module.exports.instrumentSource = instrumentSource;
