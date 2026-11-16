import fs from 'node:fs';
import ts from 'typescript';
const cache = new Map();
async function moduleUrl(file) {
  const url = file instanceof URL ? file : new URL(file, import.meta.url);
  if (cache.has(url.href)) return cache.get(url.href);
  const promise = (async () => {
    const source = fs.readFileSync(url, 'utf8').replaceAll('import.meta.env.VITE_API_BASE_URL', 'undefined');
    let { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
    const ast = ts.createSourceFile('module.js', outputText, ts.ScriptTarget.ES2022, true);
    const imports = ast.statements.filter(node => ts.isImportDeclaration(node) || ts.isExportDeclaration(node)).filter(node => node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier));
    for (const node of imports.reverse()) {
      const specifier = node.moduleSpecifier.text;
      const target = specifier.startsWith('.') ? await moduleUrl(new URL(specifier + '.ts', url)) : import.meta.resolve(specifier);
      outputText = outputText.slice(0, node.moduleSpecifier.getStart(ast)) + JSON.stringify(target) + outputText.slice(node.moduleSpecifier.end);
    }
    return 'data:text/javascript;base64,' + Buffer.from(outputText).toString('base64');
  })();
  cache.set(url.href, promise);
  return promise;
}
export async function loadTypescript(file) {
  return import(await moduleUrl(file));
}

