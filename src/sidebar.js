'use strict';

const vscode = require('vscode');
const { randomBytes } = require('node:crypto');
const { SECTION, DEFAULTS, readSettings, validateSettings, getSaveTarget } = require('./settings');
const { THEMES, validateTheme } = require('./themes');
const { messages } = require('./i18n');

class SettingsViewProvider {
  constructor(extensionUri) {
    this.extensionUri = extensionUri;
    this.t = messages(vscode.env?.language);
    this.resource = vscode.window.activeTextEditor?.document.languageId === 'markdown'
      ? vscode.window.activeTextEditor.document.uri
      : undefined;
    this.disposables = [vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor?.document.languageId === 'markdown') {
        this.resource = editor.document.uri;
        this.update();
      }
    })];
    this.saving = false;
  }

  resolveWebviewView(view) {
    this.view = view;
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media')],
    };
    const receive = view.webview.onDidReceiveMessage(message => {
      if (message?.type === 'ready') {
        this.update();
      } else if (['save', 'reset', 'theme'].includes(message?.type)) {
        void this.save(message);
      }
    });
    const visible = view.onDidChangeVisibility(() => {
      if (view.visible) this.update();
    });
    view.onDidDispose(() => {
      receive.dispose();
      visible.dispose();
      if (this.view === view) this.view = undefined;
    });
    view.webview.html = this.getHtml(view.webview);
  }

  getResource() {
    return this.resource ?? vscode.workspace.workspaceFolders?.[0]?.uri;
  }

  state(resource = this.getResource()) {
    return {
      settings: readSettings(vscode, resource),
      scope: getSaveTarget(vscode, resource).label,
      resource: resource?.toString() ?? null,
      file: this.resource?.path.split('/').pop() ?? this.t.allPreviews,
    };
  }

  post(message) {
    if (this.view) void this.view.webview.postMessage(message);
  }

  update() {
    if (!this.saving) this.post({ type: 'state', ...this.state() });
  }

  async save(message) {
    if (this.saving) return;
    this.saving = true;
    try {
      const resource = this.getResource();
      // Never apply a form belonging to a file that stopped being active.
      if (message.resource !== (resource?.toString() ?? null)) {
        throw new Error(this.t.errors.staleFile);
      }
      const values = message.type === 'reset' ? DEFAULTS
        : message.type === 'theme' ? { theme: validateTheme(message.theme, this.t.lang) }
          : validateSettings(message.settings, this.t.lang);
      const { target } = getSaveTarget(vscode, resource);
      const config = vscode.workspace.getConfiguration(SECTION, resource);
      for (const [key, value] of Object.entries(values)) {
        await config.update(key, value, target);
      }
      this.post({ type: 'saved', ...this.state(), action: message.type });
    } catch (error) {
      this.post({ type: 'error', message: error.message, ...this.state(), action: message.type });
    } finally {
      this.saving = false;
      this.update();
    }
  }

  getHtml(webview) {
    const t = this.t;
    const nonce = randomBytes(16).toString('hex');
    const script = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'sidebar.js'));
    const style = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'sidebar.css'));
    const cards = THEMES.map(theme => `<label class="theme-choice">
      <input id="theme-${theme.id}" type="radio" name="theme" value="${theme.id}" data-name="${t.themes[theme.id][0]}">
      <span class="theme-card">
        <span class="theme-sample theme-${theme.id}" aria-hidden="true"><span>${t.lang === 'zh-CN' ? '阅' : 'Y'}</span><i></i><i></i></span>
        <span class="theme-name">${t.themes[theme.id][0]}</span><span class="theme-description">${t.themes[theme.id][1]}</span>
      </span>
    </label>`).join('\n');
    const swatches = THEMES.map(theme => `.theme-${theme.id}{--sample-bg:${theme.background};--sample-text:${theme.foreground};--sample-accent:${theme.accent};}`).join('\n');
    return `<!DOCTYPE html>
<html lang="${t.lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
  <link rel="stylesheet" href="${style}">
  <style nonce="${nonce}">${swatches}</style>
  <title>${t.appName} ${t.panelTitle}</title>
</head>
<body>
  <h1>${t.appName}</h1>
  <p class="description">${t.tagline}</p>
  <p id="file" class="context"></p>
  <form id="settings">
    <fieldset disabled>
      <section class="themes" aria-labelledby="themes-label">
        <h2 id="themes-label">${t.ui.themeHeading}</h2>
        <p class="help">${t.ui.themeHelp}</p>
        <div class="theme-grid" role="radiogroup" aria-labelledby="themes-label">${cards}</div>
      </section>
      <div class="field">
        <label for="fontSize">${t.ui.fontSize} <span>px</span></label>
        <div class="controls">
          <input id="fontSizeRange" type="range" min="10" max="32" step="1" value="14" aria-label="${t.ui.fontSize}">
          <input id="fontSize" type="number" min="10" max="32" step="1" value="14" required aria-describedby="fontHelp">
        </div>
        <p id="fontHelp" class="help">${t.ui.fontHelp}</p>
      </div>
      <div class="field">
        <label for="tableRowHeight">${t.ui.tableRowHeight} <span>px</span></label>
        <div class="controls">
          <input id="tableRowHeightRange" type="range" min="24" max="120" step="1" value="36" aria-label="${t.ui.tableRowHeight}">
          <input id="tableRowHeight" type="number" min="24" max="120" step="1" value="36" required aria-describedby="tableHelp">
        </div>
        <p id="tableHelp" class="help">${t.ui.tableHelp}</p>
      </div>
      <div class="field">
        <label for="horizontalMargin">${t.ui.horizontalMargin} <span>px</span></label>
        <select id="horizontalMarginMode" aria-label="${t.ui.horizontalMargin}"><option value="theme">${t.ui.themeDefault}</option><option value="custom">${t.ui.custom}</option></select>
        <div class="controls">
          <input id="horizontalMarginRange" type="range" min="0" max="320" step="0.1" value="0" aria-label="${t.ui.horizontalMargin}">
          <input id="horizontalMargin" type="number" min="0" max="320" step="any" value="0" required aria-describedby="horizontalMarginHelp">
        </div>
        <p id="horizontalMarginHelp" class="help">${t.ui.horizontalMarginHelp}</p>
      </div>
      <div class="field">
        <label for="verticalMargin">${t.ui.verticalMargin} <span>px</span></label>
        <select id="verticalMarginMode" aria-label="${t.ui.verticalMargin}"><option value="theme">${t.ui.themeDefault}</option><option value="custom">${t.ui.custom}</option></select>
        <div class="controls">
          <input id="verticalMarginRange" type="range" min="0" max="320" step="0.1" value="0" aria-label="${t.ui.verticalMargin}">
          <input id="verticalMargin" type="number" min="0" max="320" step="any" value="0" required aria-describedby="verticalMarginHelp">
        </div>
        <p id="verticalMarginHelp" class="help">${t.ui.verticalMarginHelp}</p>
      </div>
      <p id="scope" class="context"></p>
      <div class="actions">
        <button type="submit">${t.ui.apply}</button>
        <button type="button" id="reset" class="secondary">${t.ui.reset}</button>
      </div>
    </fieldset>
  </form>
  <p id="status" role="status" aria-live="polite">${t.status.loading}</p>
  <script nonce="${nonce}">window.readingStrings=${JSON.stringify(t.status).replace(/</g, '\\u003c')};</script>
  <script nonce="${nonce}" src="${script}"></script>
</body>
</html>`;
  }

  dispose() {
    for (const disposable of this.disposables) disposable.dispose();
  }
}

module.exports = { SettingsViewProvider };
