'use strict';

const vscode = require('vscode');
const { randomBytes } = require('node:crypto');
const { SECTION, LIMITS, readSettings, validateSettings, getSaveTarget } = require('./settings');

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
      } else if (message?.type === 'save' || message?.type === 'reset') {
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
      const values = message.type === 'reset'
        ? Object.fromEntries(Object.entries(LIMITS).map(([key, limit]) => [key, limit.default]))
        : validateSettings(message.settings);
      const { target } = getSaveTarget(vscode, resource);
      const config = vscode.workspace.getConfiguration(SECTION, resource);
      for (const [key, value] of Object.entries(values)) {
        await config.update(key, value, target);
      }
      this.post({ type: 'saved', ...this.state(), reset: message.type === 'reset' });
    } catch (error) {
      this.post({ type: 'error', message: error.message, ...this.state() });
    } finally {
      this.saving = false;
      this.update();
    }
  }

  getHtml(webview) {
    const nonce = randomBytes(16).toString('hex');
    const script = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'sidebar.js'));
    const style = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'sidebar.css'));
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
  <link rel="stylesheet" href="${style}">
  <title>Markdown 预览设置</title>
</head>
<body>
  <h1>Markdown 预览</h1>
  <p class="description">调整阅读大小，让长表格更紧凑。</p>
  <p id="file" class="context"></p>
  <form id="settings">
    <fieldset disabled>
      <div class="field">
        <label for="fontSize">正文字号 <span>px</span></label>
        <div class="controls">
          <input id="fontSizeRange" type="range" min="10" max="32" step="1" value="14" aria-label="正文字号">
          <input id="fontSize" type="number" min="10" max="32" step="1" value="14" required aria-describedby="fontHelp">
        </div>
        <p id="fontHelp" class="help">标题与代码会按比例缩放，默认 14px。</p>
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
