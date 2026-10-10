'use strict';

const vscode = require('vscode');
const { randomBytes } = require('node:crypto');
const { SECTION, DEFAULTS, readSettings, validateSettings, getSaveTarget } = require('./settings');
const { THEMES, validateTheme } = require('./themes');

class SettingsViewProvider {
  constructor(extensionUri) {
    this.extensionUri = extensionUri;
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
      file: this.resource?.path.split('/').pop() ?? '所有 Markdown 预览',
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
        throw new Error('当前 Markdown 文件已切换，请重新确认设置。');
      }
      const values = message.type === 'reset' ? DEFAULTS
        : message.type === 'theme' ? { theme: validateTheme(message.theme) }
          : validateSettings(message.settings);
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
    const nonce = randomBytes(16).toString('hex');
    const script = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'sidebar.js'));
    const style = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'sidebar.css'));
    const cards = THEMES.map(theme => `<label class="theme-choice">
      <input id="theme-${theme.id}" type="radio" name="theme" value="${theme.id}" data-name="${theme.name}">
      <span class="theme-card">
        <span class="theme-sample theme-${theme.id}" aria-hidden="true"><span>阅</span><i></i><i></i></span>
        <span class="theme-name">${theme.name}</span><span class="theme-description">${theme.description}</span>
      </span>
    </label>`).join('\n');
    const swatches = THEMES.map(theme => `.theme-${theme.id}{--sample-bg:${theme.background};--sample-text:${theme.foreground};--sample-accent:${theme.accent};}`).join('\n');
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
  <link rel="stylesheet" href="${style}">
  <style nonce="${nonce}">${swatches}</style>
  <title>阅境 Markdown 阅读设置</title>
</head>
<body>
  <h1>阅境 Markdown</h1>
  <p class="description">为故事选一张书页，也为文档留一份清晰。</p>
  <p id="file" class="context"></p>
  <form id="settings">
    <fieldset disabled>
      <section class="themes" aria-labelledby="themes-label">
        <h2 id="themes-label">阅读主题</h2>
        <p class="help">点击立即切换并保存。小说主题使用两字缩进和舒展行距。</p>
        <div class="theme-grid" role="radiogroup" aria-labelledby="themes-label">${cards}</div>
      </section>
      <div class="field">
        <label for="fontSize">正文字号 <span>px</span></label>
        <div class="controls">
          <input id="fontSizeRange" type="range" min="10" max="32" step="1" value="14" aria-label="正文字号">
          <input id="fontSize" type="number" min="10" max="32" step="1" value="14" required aria-describedby="fontHelp">
        </div>
        <p id="fontHelp" class="help">标题与代码会按比例缩放，默认 14px。切换主题保留你的字号。</p>
      </div>
      <div class="field">
        <label for="tableRowHeight">表格行高 <span>px</span></label>
        <div class="controls">
          <input id="tableRowHeightRange" type="range" min="24" max="120" step="1" value="36" aria-label="表格行高">
          <input id="tableRowHeight" type="number" min="24" max="120" step="1" value="36" required aria-describedby="tableHelp">
        </div>
        <p id="tableHelp" class="help">默认 36px。表格内容不自动换行，超出宽度可横向滚动。手动换行或图片会撑高行。</p>
      </div>
      <p id="scope" class="context"></p>
      <div class="actions">
        <button type="submit">应用设置</button>
        <button type="button" id="reset" class="secondary">恢复默认</button>
      </div>
    </fieldset>
  </form>
  <p id="status" role="status" aria-live="polite">正在读取设置…</p>
  <script nonce="${nonce}" src="${script}"></script>
</body>
</html>`;
  }

  dispose() {
    for (const disposable of this.disposables) disposable.dispose();
  }
}

module.exports = { SettingsViewProvider };
