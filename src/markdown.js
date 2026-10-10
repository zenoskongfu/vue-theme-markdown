'use strict';

const extended = new WeakSet();

function extendMarkdownIt(md, getSettings) {
  if (extended.has(md)) return md;
  extended.add(md);
  const render = md.renderer.render;
  md.renderer.render = function (tokens, options, env) {
    // Read during rendering, rather than parsing: VS Code caches parsed tokens.
    const settings = getSettings(env?.currentDocument);
    const styles = `<style id="vue-green-markdown-settings">:root{--vue-font-size:${settings.fontSize}px;--vue-table-row-height:${settings.tableRowHeight}px;}</style>\n`;
    return styles + render.call(this, tokens, options, env);
  };
  return md;
}

module.exports = { extendMarkdownIt };
