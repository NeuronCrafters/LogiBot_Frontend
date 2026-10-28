import fs from "node:fs";
import assert from "node:assert/strict";

const languages = ["pt-BR", "en-US", "es-ES"];
const catalogs = Object.fromEntries(languages.map(language => [language, JSON.parse(fs.readFileSync(`src/i18n/catalogs/${language}.json`, "utf8"))]));
const baseline = JSON.parse(fs.readFileSync("tests/fixtures/portuguese-ui.json", "utf8"));
for (const [key, value] of Object.entries(baseline)) assert.equal(catalogs["pt-BR"][key], value, `Português alterado: ${key}`);
const parameters = value => [...value.matchAll(/\{\{(\w+)\}\}/g)].map(match => match[1]).sort();
for (const language of languages) {
  assert.deepEqual(Object.keys(catalogs[language]).sort(), Object.keys(catalogs["pt-BR"]).sort(), `Chaves divergentes: ${language}`);
  for (const [key, value] of Object.entries(catalogs[language])) {
    assert.ok(value.trim(), `${language}: ${key} vazio`);
    assert.deepEqual(parameters(value), parameters(catalogs["pt-BR"][key]), `Parâmetros divergentes: ${language}/${key}`);
  }
}
console.log(`${Object.keys(catalogs["pt-BR"]).length} chaves conferidas em ${languages.length} idiomas; ${Object.keys(baseline).length} textos originais preservados.`);

const { default: ts } = await import("typescript");
function inspect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) { if (!['i18n', '__tests__'].includes(entry.name)) inspect(path); continue; }
    if (!path.endsWith('.tsx')) continue;
    const source = ts.createSourceFile(path, fs.readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node) {
      if (ts.isJsxText(node) && /\p{L}/u.test(node.text)) {
        const text = node.text.trim().replace(/\s+/g, ' ');
        assert.ok(['LogiBot.AI', 'min'].includes(text), `Texto fora do catálogo em ${path}: ${text}`);
      }
      if (ts.isJsxAttribute(node) && ['aria-label', 'placeholder', 'title', 'alt', 'emptyText', 'createLabel', 'info', 'eyebrow'].includes(node.name.getText(source)) && node.initializer && ts.isStringLiteral(node.initializer)) {
        const text = node.initializer.text;
        assert.ok(!/\p{L}/u.test(text) || /^(?:LogiBot(?:\.AI)?|SAEL|logo|Avatar|avatar|image|user|PNG)$/i.test(text), `Atributo fora do catálogo em ${path}: ${text}`);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
}
inspect('src');
console.log('Textos JSX e atributos acessíveis conferidos.');
