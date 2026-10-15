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

test('cached paragraphs switch novel palettes without leaking indentation attributes into Vue', () => {
  let theme = 'paper';
  const md = extendMarkdownIt(new MarkdownIt(), () => ({ theme, fontSize: 14, tableRowHeight: 36 }));
  const prose = '普通段落。\n\n\u3000\u3000已有缩进的段落。\n\n> 引用。\n\n- 列表。';
  const tokens = md.parse(prose, {});
  const before = JSON.stringify(tokens);
  let html = md.renderer.render(tokens, md.options, {});
  assert.match(html, /--vue-bg:#f6f1e7;/);
  assert.match(html, /<p data-reading-indent="existing">\u3000\u3000/);
  assert.equal(JSON.stringify(tokens), before);
  theme = 'night';
  html = md.renderer.render(tokens, md.options, {});
  assert.match(html, /--vue-bg:#202124;/);
  theme = 'vue';
  html = md.renderer.render(tokens, md.options, {});
  assert.doesNotMatch(html, /data-reading-indent|--reading-font/);
  assert.equal(html.replace(/^<style[^>]*>.*?<\/style>\n/, ''), new MarkdownIt().render(prose));
  assert.equal(JSON.stringify(tokens), before);
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

test('page margin settings update cached previews and omit unsafe or default values', () => {
  let margins = { horizontalMargin: 0, verticalMargin: 0 };
  const md = extendMarkdownIt(new MarkdownIt(), () => ({ theme: 'vue', fontSize: 14, tableRowHeight: 36, ...margins }));
  const tokens = md.parse(source, {});
  let html = md.renderer.render(tokens, md.options, {});
  assert.doesNotMatch(html, /--vue-preview-margin-/);
  margins = { horizontalMargin: 180, verticalMargin: 64 };
  html = md.renderer.render(tokens, md.options, {});
  assert.match(html, /--vue-preview-margin-horizontal:180px;/);
  assert.match(html, /--vue-preview-margin-vertical:64px;/);
  margins = { horizontalMargin: '1px;</style><script>', verticalMargin: 321 };
  html = md.renderer.render(tokens, md.options, {});
  assert.doesNotMatch(html, /--vue-preview-margin-|<script>/);
});

test('registering twice does not add duplicate style elements', () => {
  const md = new MarkdownIt();
  const settings = () => ({ fontSize: 14, tableRowHeight: 36 });
  extendMarkdownIt(md, settings);
  extendMarkdownIt(md, settings);
  assert.equal(md.render('').match(/<style/g).length, 1);
});
