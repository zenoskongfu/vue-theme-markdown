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
const { THEMES } = require('../../src/themes');
const novelSource = fs.readFileSync(path.join(root, 'test/fixtures/novel.md'), 'utf8');

test('page margins keep theme defaults, respond to settings, and fit narrow previews', async () => {
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    for (const [theme, desktop, narrow] of [
      ['vue', [48, 56, 80], [28, 22, 56]],
      ['paper', [56, 60, 96], [32, 24, 64]],
    ]) {
      for (const [width, margins, expected] of [
        [1100, [0, 0], desktop],
        [420, [0, 0], narrow],
        [1100, [240, 70], [70, 240, 70]],
        [761, [320, 70], [70, 240.5, 70]],
        [420, [240, 70], [70, 42, 70]],
        [420, [0.5, 1.25], [1.25, 0.5, 1.25]],
      ]) {
        await page.setViewportSize({ width, height: 900 });
        const md = extendMarkdownIt(new MarkdownIt(), () => ({ theme, fontSize: 14, tableRowHeight: 36, horizontalMargin: margins[0], verticalMargin: margins[1] }));
        await page.setContent(`<html><head><style>${hostCss}</style><style>${css}</style></head><body class="vscode-body vscode-light">${md.render('# Title\n\nA paragraph for measuring the preview page.')}</body></html>`);
        const metrics = await page.evaluate(() => {
          const body = getComputedStyle(document.body);
          return {
            padding: [body.paddingTop, body.paddingRight, body.paddingBottom, body.paddingLeft].map(parseFloat),
            bodyWidth: document.body.getBoundingClientRect().width,
            headingLeft: document.querySelector('h1').getBoundingClientRect().left,
            headingRight: document.querySelector('h1').getBoundingClientRect().right,
            overflow: document.documentElement.scrollWidth > innerWidth,
          };
        });
        assert.deepEqual(metrics.padding, [expected[0], expected[1], expected[2], expected[1]], `${theme} at ${width}px`);
        assert.ok(Math.abs(metrics.bodyWidth - width) < 1, `${theme} body must use the full ${width}px viewport: ${JSON.stringify(metrics)}`);
        assert.ok(Math.abs(metrics.headingLeft - expected[1]) < 1, `${theme} visible content starts at the page padding`);
        assert.ok(Math.abs(metrics.headingRight - (width - expected[1])) < 1, `${theme} visible content ends at the page padding`);
        assert.equal(metrics.overflow, false);
        if (margins[0]) {
          await page.emulateMedia({ media: 'print' });
          assert.equal(await page.$eval('body', body => getComputedStyle(body).padding), '0px');
          await page.emulateMedia({ media: 'screen' });
        }
      }
    }
  } finally {
    await browser.close();
  }
});

test('a 2048px preview has no centered width cap, and custom 0px is truly edge to edge', async () => {
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 2048, height: 900 } });
    for (const theme of THEMES.map(item => item.id)) {
      for (const [margin, mode] of [[0, 'theme'], [1, 'custom'], [0.5, 'custom'], [0, 'custom']]) {
        const md = extendMarkdownIt(new MarkdownIt(), () => ({ theme, fontSize: 14, tableRowHeight: 36,
          horizontalMargin: margin, verticalMargin: 0, horizontalMarginMode: mode, verticalMarginMode: mode }));
        await page.setContent(`<html><head><style>${hostCss}</style><style>${css}</style></head><body class="vscode-body vscode-light">${md.render('# Title\n\nParagraph')}</body></html>`);
        const geometry = await page.evaluate(() => {
          const body = document.body.getBoundingClientRect();
          const heading = document.querySelector('h1').getBoundingClientRect();
          const style = getComputedStyle(document.body);
          return { bodyLeft: body.left, bodyRight: body.right, headingLeft: heading.left, headingRight: heading.right,
            top: parseFloat(style.paddingTop), left: parseFloat(style.paddingLeft), maxWidth: style.maxWidth,
            overflow: document.documentElement.scrollWidth > innerWidth };
        });
        const expected = mode === 'theme' ? (theme === 'vue' ? 56 : 60) : margin;
        assert.equal(geometry.maxWidth, 'none', `${theme} max width`);
        assert.ok(Math.abs(geometry.bodyLeft) < 1 && Math.abs(geometry.bodyRight - 2048) < 1, JSON.stringify(geometry));
        assert.ok(Math.abs(geometry.headingLeft - expected) < 1 && Math.abs(geometry.headingRight - (2048 - expected)) < 1, JSON.stringify(geometry));
        if (mode === 'custom' && margin === 0) assert.equal(geometry.top, 0);
        assert.equal(geometry.overflow, false);
      }
    }
  } finally { await browser.close(); }
});

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

test('novel themes keep their palettes, prose layout, and tables across editor appearances and narrow previews', async () => {
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    for (const theme of THEMES.filter(theme => theme.id !== 'vue')) {
      const md = extendMarkdownIt(new MarkdownIt({ html: true }), () => ({ theme: theme.id, fontSize: 16, tableRowHeight: 36 }));
      for (const width of [1100, 420]) {
        await page.setViewportSize({ width, height: 900 });
        for (const appearance of ['light', 'dark']) {
          await page.emulateMedia({ colorScheme: appearance });
          await page.setContent(`<html><head><style>${hostCss}</style><style>${css}</style></head><body class="vscode-body vscode-${appearance}"><div class="markdown-body">${md.render(novelSource)}</div></body></html>`);
          const metrics = await page.evaluate(() => {
            const prose = document.querySelector('.markdown-body > p');
            const table = document.querySelector('table');
            return {
              background: getComputedStyle(document.body).backgroundColor,
              scheme: getComputedStyle(document.body).colorScheme,
              font: parseFloat(getComputedStyle(document.body).fontSize),
              lineHeight: parseFloat(getComputedStyle(prose).lineHeight),
              indent: getComputedStyle(prose).textIndent,
              existingIndent: getComputedStyle(document.querySelector('p[data-reading-indent]')).textIndent,
              quoteIndent: getComputedStyle(document.querySelector('blockquote p')).textIndent,
              headingAlign: getComputedStyle(document.querySelector('h1')).textAlign,
              headingBorder: getComputedStyle(document.querySelector('h1')).borderBottomWidth,
              headingDecoration: getComputedStyle(document.querySelector('h1'), '::after').display,
              cellWhiteSpace: getComputedStyle(document.querySelector('td')).whiteSpace,
              rowHeight: document.querySelector('tbody tr').getBoundingClientRect().height,
              tableScrolls: table.scrollWidth > table.clientWidth,
              pageOverflows: document.documentElement.scrollWidth > window.innerWidth,
            };
          });
          const rgb = theme.background.match(/[\da-f]{2}/g).map(value => parseInt(value, 16));
          assert.equal(metrics.background, `rgb(${rgb.join(', ')})`);
          assert.equal(metrics.scheme, theme.scheme);
          assert.equal(metrics.font, 16);
          assert.ok(Math.abs(metrics.lineHeight - 16 * Number(theme.lineHeight)) < 0.1);
          assert.equal(metrics.indent, '32px');
          assert.equal(metrics.existingIndent, '0px');
          assert.equal(metrics.quoteIndent, '0px');
          assert.equal(metrics.headingAlign, theme.align);
          assert.equal(metrics.headingBorder, '0px');
          assert.equal(metrics.headingDecoration, 'none');
          assert.equal(metrics.cellWhiteSpace, 'nowrap');
          assert.ok(Math.abs(metrics.rowHeight - 36) < 1);
          if (width === 420) assert.equal(metrics.tableScrolls, true);
          assert.equal(metrics.pageOverflows, false);
          const pixels = PNG.sync.read(await page.screenshot());
          const offset = (50 * pixels.width) * 4;
          assert.deepEqual([...pixels.data.subarray(offset, offset + 3)], rgb, `${theme.id} themed gutter`);
        }
      }
      await page.emulateMedia({ media: 'print' });
      const print = await page.evaluate(() => ({
        font: parseFloat(getComputedStyle(document.body).fontSize),
        background: getComputedStyle(document.body).backgroundColor,
        color: getComputedStyle(document.querySelector('p')).color,
      }));
      assert.ok(Math.abs(print.font - 11 * 96 / 72) < 0.1);
      assert.equal(print.background, 'rgb(255, 255, 255)');
      assert.equal(print.color, 'rgb(71, 101, 130)');
      await page.emulateMedia({ media: 'screen' });
    }
    for (const [appearance, background, foreground, scheme] of [
      ['high-contrast', '#000000', '#ffffff', 'dark'],
      ['high-contrast-light', '#ffffff', '#000000', 'light'],
    ]) {
      await page.evaluate(({ appearance, background, foreground }) => {
        document.body.className = `vscode-body vscode-${appearance}`;
        document.body.style.setProperty('--vscode-editor-background', background);
        document.body.style.setProperty('--vscode-editor-foreground', foreground);
      }, { appearance, background, foreground });
      assert.equal(await page.$eval('body', body => getComputedStyle(body).colorScheme), scheme);
      assert.equal(await page.$eval('p', p => getComputedStyle(p).color), scheme === 'dark' ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)');
      await page.emulateMedia({ media: 'print' });
      assert.equal(await page.$eval('p', p => getComputedStyle(p).color), 'rgb(71, 101, 130)');
      await page.emulateMedia({ media: 'screen' });
    }
  } finally {
    await browser.close();
  }
});

test('sidebar theme cards persist immediately while preserving unsaved sizing edits and recovering after failures', async () => {
  const vm = require('node:vm');
  const { createRequire } = require('node:module');
  const filename = path.join(root, 'src/sidebar.js');
  const localRequire = createRequire(filename);
  const module = { exports: {} };
  const vscode = {
    env: { language: 'zh-cn' },
    window: { onDidChangeActiveTextEditor: () => ({ dispose() {} }) },
    Uri: { joinPath: (base, ...segments) => segments.join('/') },
  };
  const wrapper = vm.runInNewContext(`(function(require, module, exports) {${fs.readFileSync(filename, 'utf8')}\n})`);
  wrapper(name => name === 'vscode' ? vscode : localRequire(name), module, module.exports);
  const provider = new module.exports.SettingsViewProvider({});
  const sidebarHtml = provider.getHtml({ cspSource: 'https://reading.test', asWebviewUri: uri => `https://reading.test/${uri}` });
  vscode.env.language = 'en';
  const englishHtml = new module.exports.SettingsViewProvider({}).getHtml({ cspSource: 'https://reading.test', asWebviewUri: uri => `https://reading.test/${uri}` });
  const nonce = sidebarHtml.match(/<style nonce="([^"]+)"/)[1];
  // VS Code supplies these theme tokens to every webview.
  const hostTheme = `<style nonce="${nonce}">:root{--vscode-foreground:#cccccc;--vscode-descriptionForeground:#9d9d9d;--vscode-font-family:system-ui,sans-serif;--vscode-font-size:13px;--vscode-focusBorder:#007fd4;--vscode-widget-border:#454545;--vscode-input-foreground:#cccccc;--vscode-input-background:#3c3c3c;--vscode-button-background:#0078d4;--vscode-button-foreground:#ffffff;--vscode-button-hoverBackground:#026ec1;--vscode-button-secondaryBackground:#313131;--vscode-button-secondaryForeground:#cccccc;--vscode-button-secondaryHoverBackground:#3c3c3c;--vscode-list-hoverBackground:#2b2b2b;--vscode-errorForeground:#f48771}body{background:#181818}</style>`;
  const html = sidebarHtml.replace('</head>', `${hostTheme}</head>`).replace('<body>', '<body class="vscode-dark">');
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 330, height: 1080 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://reading.test/**', route => {
      const asset = new URL(route.request().url()).pathname;
      return route.fulfill(asset === '/sidebar' || asset === '/sidebar-en'
        ? { contentType: 'text/html', body: asset === '/sidebar' ? html : englishHtml }
        : { contentType: asset.endsWith('.css') ? 'text/css' : 'text/javascript', body: fs.readFileSync(path.join(root, asset.slice(1)), 'utf8') });
    });
    await page.addInitScript(() => {
      window.readingSettings = { theme: 'vue', fontSize: 14, tableRowHeight: 36, horizontalMargin: 0, verticalMargin: 0, horizontalMarginMode: 'theme', verticalMarginMode: 'theme' };
      window.readingRequests = [];
      const state = () => ({ settings: { ...window.readingSettings }, resource: 'file:///novel.md', file: 'novel.md',
        scope: document.documentElement.lang === 'en' ? 'User settings' : '用户设置' });
      window.acquireVsCodeApi = () => ({ postMessage: request => {
        window.readingRequests.push(request);
        if (request.type === 'ready') return window.postMessage({ type: 'state', ...state() }, '*');
        if (request.type === 'theme' && window.failTheme) {
          return window.postMessage({ type: 'error', action: 'theme', message: 'Cannot save theme', ...state() }, '*');
        }
        if (request.type === 'theme') window.readingSettings.theme = request.theme;
        else if (request.type === 'reset') window.readingSettings = { theme: 'vue', fontSize: 14, tableRowHeight: 36, horizontalMargin: 0, verticalMargin: 0, horizontalMarginMode: 'theme', verticalMarginMode: 'theme' };
        else window.readingSettings = request.settings;
        window.postMessage({ type: 'saved', action: request.type, ...state() }, '*');
      } });
    });
    await page.goto('https://reading.test/sidebar');
    await page.waitForFunction(() => !document.querySelector('fieldset').disabled);
    assert.equal(await page.locator('h1').innerText(), '阅境 Markdown');
    assert.equal(await page.locator('.theme-choice').count(), 6);
    await page.locator('#fontSize').fill('20');
    await page.locator('#horizontalMarginMode').selectOption('custom');
    await page.locator('#verticalMarginMode').selectOption('custom');
    await page.locator('#horizontalMargin').fill('240');
    await page.locator('#verticalMargin').fill('70');
    await page.getByText('暖纸', { exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('fieldset').disabled && window.readingSettings.theme === 'paper');
    assert.equal(await page.locator('#fontSize').inputValue(), '20');
    assert.equal(await page.locator('#horizontalMargin').inputValue(), '240');
    assert.equal(await page.locator('#verticalMargin').inputValue(), '70');
    assert.equal(await page.locator('#horizontalMarginMode').inputValue(), 'custom');
    assert.equal(await page.evaluate(() => window.readingSettings.fontSize), 14);
    assert.match(await page.locator('#status').innerText(), /仍待应用/);
    await page.evaluate(() => { window.failTheme = true; });
    await page.getByText('青竹', { exact: true }).click();
    await page.waitForFunction(() => document.querySelector('#status').textContent === 'Cannot save theme');
    assert.equal(await page.locator('#theme-paper').isChecked(), true);
    assert.equal(await page.locator('#fontSize').inputValue(), '20');
    assert.equal(await page.locator('#horizontalMargin').inputValue(), '240');
    await page.getByRole('button', { name: '应用设置' }).click();
    await page.waitForFunction(() => !document.querySelector('fieldset').disabled && window.readingSettings.fontSize === 20 && window.readingSettings.horizontalMargin === 240 && window.readingSettings.verticalMargin === 70);
    await page.getByRole('button', { name: '恢复默认' }).click();
    await page.waitForFunction(() => !document.querySelector('fieldset').disabled && window.readingSettings.theme === 'vue');
    assert.equal(await page.locator('#fontSize').inputValue(), '14');
    assert.equal(await page.locator('#horizontalMargin').inputValue(), '0');
    assert.equal(await page.locator('#verticalMargin').inputValue(), '0');
    assert.equal(await page.locator('#horizontalMarginMode').inputValue(), 'theme');
    assert.equal(await page.locator('#theme-vue').isChecked(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: path.join(root, 'work/reading-sidebar.png'), fullPage: true });
    await page.goto('https://reading.test/sidebar-en');
    await page.waitForFunction(() => !document.querySelector('fieldset').disabled);
    assert.equal(await page.locator('h1').innerText(), 'Yuejing Markdown');
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    assert.equal(await page.locator('.theme-name').first().innerText(), 'Vue Docs');
    await page.locator('#horizontalMarginMode').selectOption('custom');
    await page.locator('#horizontalMargin').fill('0.5');
    await page.getByRole('button', { name: 'Apply Settings' }).click();
    await page.waitForFunction(() => !document.querySelector('fieldset').disabled && window.readingSettings.horizontalMarginMode === 'custom');
    assert.match(await page.locator('#status').innerText(), /Saved\. Refreshing previews\./);
    assert.equal(await page.evaluate(() => window.readingRequests.at(-1).settings.horizontalMargin), 0.5);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: path.join(root, 'work/reading-sidebar-en.png'), fullPage: true });
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
