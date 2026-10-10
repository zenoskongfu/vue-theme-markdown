'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { PNG } = require('pngjs');
const MarkdownIt = require('markdown-it');
const { extendMarkdownIt } = require('../../src/markdown');

const root = path.resolve(__dirname, '../..');
const css = fs.readFileSync(path.join(root, 'v-green.css'), 'utf8');
const hostCss = fs.readFileSync(path.join(root, 'test/fixtures/vscode-preview-base.css'), 'utf8');
const source = fs.readFileSync(path.join(root, 'test/fixtures/preview.md'), 'utf8');
const executablePath = process.env.CHROME_EXECUTABLE || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

test('preview sizes scale, table text stays single-line, and wide tables scroll', async () => {
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    for (const width of [1100, 480]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [fontSize, tableRowHeight] of [[14, 36], [12, 28], [20, 60]]) {
        const md = extendMarkdownIt(new MarkdownIt({ html: true }), () => ({ fontSize, tableRowHeight }));
        await page.setContent(`<html><head><style>${hostCss}</style><style>${css}</style></head><body class="vscode-body vscode-light">${md.render(source)}</body></html>`);
        const metrics = await page.evaluate(() => {
          const table = document.querySelector('table');
          const cells = [...document.querySelectorAll('tbody tr:first-child td')];
          return {
            bodyFont: parseFloat(getComputedStyle(document.body).fontSize),
            rootFont: parseFloat(getComputedStyle(document.documentElement).fontSize),
            headingFont: parseFloat(getComputedStyle(document.querySelector('h1')).fontSize),
            codeFont: parseFloat(getComputedStyle(document.querySelector('pre code')).fontSize),
            rowHeight: document.querySelector('tbody tr:first-child').getBoundingClientRect().height,
            cells: cells.map(cell => ({
              whiteSpace: getComputedStyle(cell).whiteSpace,
              height: cell.getBoundingClientRect().height,
              lineHeight: parseFloat(getComputedStyle(cell).lineHeight),
            })),
            codeWhiteSpace: getComputedStyle(cells[2].querySelector('code')).whiteSpace,
            scrolls: table.scrollWidth > table.clientWidth,
            pageOverflows: document.documentElement.scrollWidth > window.innerWidth,
          };
        });
        assert.equal(metrics.bodyFont, fontSize);
        assert.equal(metrics.rootFont, fontSize);
        assert.ok(Math.abs(metrics.headingFont - fontSize * (width < 760 ? 1.9 : 2.25)) < 0.1);
        assert.ok(Math.abs(metrics.codeFont - fontSize * 0.9) < 0.1);
        assert.ok(Math.abs(metrics.rowHeight - tableRowHeight) < 1, JSON.stringify(metrics));
        assert.ok(metrics.cells.every(cell => cell.whiteSpace === 'nowrap' && cell.height < cell.lineHeight * 2 + tableRowHeight));
        assert.equal(metrics.codeWhiteSpace, 'nowrap');
        assert.equal(metrics.scrolls, true);
        assert.equal(metrics.pageOverflows, false);
      }
    }
    fs.mkdirSync(path.join(root, 'work'), { recursive: true });
    await page.screenshot({ path: path.join(root, 'work/preview-narrow.png'), fullPage: true });
    await page.emulateMedia({ media: 'print' });
    assert.ok(Math.abs(await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize)) - 11 * 96 / 72) < 0.1);
  } finally {
    await browser.close();
  }
});

test('theme switching repaints the gutters and overrides host borders independently of system appearance', async () => {
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const md = extendMarkdownIt(new MarkdownIt({ html: true }), () => ({ fontSize: 14, tableRowHeight: 36 }));
    await page.setContent(`<html><head><style>${hostCss}</style><style>${css}</style></head><body class="vscode-body">${md.render(source)}</body></html>`);
    fs.mkdirSync(path.join(root, 'work'), { recursive: true });
    for (const systemScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: systemScheme });
      // Change classes on the existing preview, as VS Code does when switching themes.
      for (const [theme, expectedBg, expectedBorder] of [
        ['dark', [27, 27, 31], 'rgb(60, 63, 68)'],
        ['light', [255, 255, 255], 'rgb(226, 226, 227)'],
        ['dark', [27, 27, 31], 'rgb(60, 63, 68)'],
      ]) {
        await page.evaluate(theme => { document.body.className = `vscode-body vscode-${theme}`; }, theme);
        const borders = await page.evaluate(() => ({
          heading: getComputedStyle(document.querySelector('h1')).borderBottomColor,
          header: getComputedStyle(document.querySelector('th')).borderBottomColor,
          row: getComputedStyle(document.querySelector('tbody tr:nth-child(2) td')).borderBottomColor,
          topWidth: getComputedStyle(document.querySelector('tbody tr:nth-child(2) td')).borderTopWidth,
        }));
        assert.equal(borders.header, expectedBorder);
        assert.equal(borders.row, expectedBorder);
        assert.equal(borders.topWidth, '0px');
        assert.equal(borders.heading, theme === 'dark' ? 'rgb(46, 46, 50)' : 'rgb(231, 231, 232)');
        const pixels = PNG.sync.read(await page.screenshot({ path: path.join(root, `work/preview-${theme}.png`) }));
        for (const x of [0, 50, 1199]) {
          const offset = (50 * pixels.width + x) * 4;
          assert.deepEqual([...pixels.data.subarray(offset, offset + 3)], expectedBg, `${theme} gutter at x=${x} under ${systemScheme} system theme`);
        }
      }
    }

    const sidebarCss = fs.readFileSync(path.join(root, 'media/sidebar.css'), 'utf8');
    await page.setContent(`<style>${sidebarCss}</style><body><input type="range"><input type="number"></body>`);
    for (const [theme, scheme] of [['dark', 'dark'], ['light', 'light'], ['high-contrast', 'dark'], ['high-contrast-light', 'light']]) {
      await page.emulateMedia({ colorScheme: scheme === 'dark' ? 'light' : 'dark' });
      await page.evaluate(theme => { document.body.className = `vscode-${theme}`; }, theme);
      assert.equal(await page.$eval('input', input => getComputedStyle(input).colorScheme), scheme);
    }
  } finally {
    await browser.close();
  }
});
