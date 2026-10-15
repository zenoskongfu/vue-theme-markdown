'use strict';

const vscode = require('vscode');
const { SECTION, readSettings } = require('./settings');
const { extendMarkdownIt } = require('./markdown');
const { SettingsViewProvider } = require('./sidebar');
const { messages } = require('./i18n');

function activate(context) {
  const provider = new SettingsViewProvider(context.extensionUri);
  let refreshTimer;
  context.subscriptions.push(
    provider,
    vscode.window.registerWebviewViewProvider('vueGreenMarkdown.settings', provider),
    vscode.commands.registerCommand('vueGreenMarkdown.openSettings', () =>
      vscode.commands.executeCommand('vueGreenMarkdown.settings.focus')),
    vscode.workspace.onDidChangeConfiguration(event => {
      if (!event.affectsConfiguration(SECTION)) return;
      provider.update();
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        vscode.commands.executeCommand('markdown.preview.refresh').then(undefined, error => {
          vscode.window.showErrorMessage(messages(vscode.env.language).errors.refreshFailed(error.message));
        });
      }, 100);
    }),
    { dispose: () => clearTimeout(refreshTimer) },
  );

  return {
    extendMarkdownIt: md => extendMarkdownIt(md, resource => readSettings(vscode, resource)),
  };
}

module.exports = { activate };
