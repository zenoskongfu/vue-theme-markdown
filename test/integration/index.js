'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const vscode = require('vscode');

async function run() {
  const extension = vscode.extensions.getExtension('zenoschen.vue-theme-markdown');
  assert.ok(extension, 'development extension is loaded');
  await extension.activate();
  const folder = vscode.workspace.workspaceFolders[0].uri;
  const resource = vscode.Uri.joinPath(folder, 'preview.md');
  const document = await vscode.workspace.openTextDocument(resource);
  await vscode.window.showTextDocument(document);
  const config = vscode.workspace.getConfiguration('vueGreenMarkdown', resource);
  const original = Object.fromEntries(['fontSize', 'tableRowHeight'].map(key => [key, {
    global: config.inspect(key).globalValue,
    workspace: config.inspect(key).workspaceValue,
    folder: config.inspect(key).workspaceFolderValue,
  }]));
  try {
    await config.update('fontSize', 13, vscode.ConfigurationTarget.Global);
    await config.update('tableRowHeight', 30, vscode.ConfigurationTarget.Global);
    let html = await vscode.commands.executeCommand('markdown.api.render', document.getText());
    assert.match(html, /--vue-font-size:13px/);
    assert.match(html, /--vue-table-row-height:30px/);
    assert.match(html, /<table\b/);

    await config.update('fontSize', 18, vscode.ConfigurationTarget.Workspace);
    html = await vscode.commands.executeCommand('markdown.api.render', document.getText());
    assert.match(html, /--vue-font-size:18px/);

    // Exercise resource-specific folder overrides through the actual exported plugin.
    await config.update('fontSize', 12, vscode.ConfigurationTarget.WorkspaceFolder);
    const MarkdownIt = require('markdown-it');
    const md = extension.exports.extendMarkdownIt(new MarkdownIt());
    html = md.render(document.getText(), { currentDocument: resource });
    assert.match(html, /--vue-font-size:12px/);
    await config.update('tableRowHeight', 28, vscode.ConfigurationTarget.WorkspaceFolder);
    const tokens = md.parse(document.getText(), {});
    html = md.renderer.render(tokens, md.options, { currentDocument: resource });
    assert.match(html, /--vue-table-row-height:28px/);

    await vscode.commands.executeCommand('markdown.showPreviewToSide', resource);
    await vscode.commands.executeCommand('vueGreenMarkdown.openSettings');
    await vscode.commands.executeCommand('markdown.preview.refresh');
    const settingsFile = vscode.Uri.joinPath(folder, '.vscode', 'settings.json');
    const persisted = Buffer.from(await vscode.workspace.fs.readFile(settingsFile)).toString();
    assert.match(persisted, /"vueGreenMarkdown.fontSize": 12/);
    assert.match(persisted, /"vueGreenMarkdown.tableRowHeight": 28/);
    console.log('VS Code integration passed: activation, configuration scopes, persisted settings, rendered preview, and sidebar command.');
  } finally {
    for (const [key, values] of Object.entries(original)) {
      await config.update(key, values.folder, vscode.ConfigurationTarget.WorkspaceFolder);
      await config.update(key, values.workspace, vscode.ConfigurationTarget.Workspace);
      await config.update(key, values.global, vscode.ConfigurationTarget.Global);
    }
    const fs = require('node:fs');
    const settingsDirectory = path.join(__dirname, '../fixtures/.vscode');
    fs.rmSync(settingsDirectory, { recursive: true, force: true });
  }
}

module.exports = { run };
