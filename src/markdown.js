'use strict';

const { DEFAULT_THEME, isTheme, getThemeCss } = require('./themes');
const extended = new WeakSet();

function extendMarkdownIt(md, getSettings) {
  if (extended.has(md)) return md;
  extended.add(md);
  const render = md.renderer.render;
  const paragraphOpen = md.renderer.rules.paragraph_open || ((tokens, index, options, env, self) => self.renderToken(tokens, index, options));
  let novel = false;
  md.renderer.rules.paragraph_open = function (tokens, index, options, env, self) {
    const token = tokens[index];
    if (!novel || token.level !== 0 || !/^\u3000/.test(tokens[index + 1]?.content ?? '')) {
      return paragraphOpen.call(this, tokens, index, options, env, self);
    }
    // Temporary attributes do not leak into VS Code's cached tokens or Vue mode.
    const attrs = token.attrs;
    token.attrs = attrs?.map(attr => [...attr]) ?? [];
    token.attrSet('data-reading-indent', 'existing');
    try {
      return paragraphOpen.call(this, tokens, index, options, env, self);
    } finally {
      token.attrs = attrs;
    }
  };
  md.renderer.render = function (tokens, options, env) {
    // Read during rendering, rather than parsing: VS Code caches parsed tokens.
    const settings = getSettings(env?.currentDocument);
    const styles = `<style id="vue-green-markdown-settings">:root{--vue-font-size:${settings.fontSize}px;--vue-table-row-height:${settings.tableRowHeight}px;}${getThemeCss(settings.theme)}</style>\n`;
    const previous = novel;
    novel = isTheme(settings.theme) && settings.theme !== DEFAULT_THEME;
    try {
      return styles + render.call(this, tokens, options, env);
    } finally {
      novel = previous;
    }
  };
  return md;
}

module.exports = { extendMarkdownIt };
