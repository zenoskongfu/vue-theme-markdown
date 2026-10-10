'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const MarkdownIt = require('markdown-it');
const { extendMarkdownIt } = require('../src/markdown');

const source = '# 标题\n\nParagraph with **bold** and `inline code`.\n\n| Name | Value |\n| --- | --- |\n| 中文表格 | a long value |\n\n```js\nconst a = 1;\n```';

test('settings do not change headings, links, tables, code, or token source maps', () => {
  const expected = new MarkdownIt().render(source);
  const md = extendMarkdownIt(new MarkdownIt(), () => ({ fontSize: 14, tableRowHeight: 36 }));
  const tokens = md.parse(source, {});
  const maps = tokens.map(token => token.map);
  const html = md.renderer.render(tokens, md.options, {});
  assert.equal(html.replace(/^<style[^>]*>.*?<\/style>\n/, ''), expected);
  assert.deepEqual(tokens.map(token => token.map), maps);
});

test('cached tokens use changed settings and the current preview resource', () => {
  let size = 13;
  const resources = [];
  const md = extendMarkdownIt(new MarkdownIt(), resource => {
    resources.push(resource);
    return { fontSize: size, tableRowHeight: 30 };
  });
  const tokens = md.parse(source, {});
  assert.match(md.renderer.render(tokens, md.options, { currentDocument: 'first.md' }), /--vue-font-size:13px/);
  size = 18;
  assert.match(md.renderer.render(tokens, md.options, { currentDocument: 'second.md' }), /--vue-font-size:18px/);
  assert.deepEqual(resources, ['first.md', 'second.md']);
});

test('registering twice does not add duplicate style elements', () => {
  const md = new MarkdownIt();
  const settings = () => ({ fontSize: 14, tableRowHeight: 36 });
  extendMarkdownIt(md, settings);
  extendMarkdownIt(md, settings);
  assert.equal(md.render('').match(/<style/g).length, 1);
});
