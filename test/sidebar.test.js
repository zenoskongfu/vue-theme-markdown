'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const path = require('node:path');

function sidebar(failOnKey) {
  const values = { theme: 'vue', fontSize: 14, tableRowHeight: 36, horizontalMargin: 0, verticalMargin: 0 };
  const writes = [];
  const messages = [];
  const vscode = {
    ConfigurationTarget: { Global: 1, Workspace: 2, WorkspaceFolder: 3 },
    window: { onDidChangeActiveTextEditor: () => ({ dispose() {} }) },
    workspace: {
      getConfiguration: () => ({
        get: key => values[key],
        inspect: () => ({}),
        update: async (key, value, target) => {
          if (key === failOnKey) throw new Error('Cannot write settings');
          writes.push({ key, value, target });
          values[key] = value;
        },
      }),
      getWorkspaceFolder: () => undefined,
    },
  };
  const filename = path.resolve(__dirname, '../src/sidebar.js');
  const localRequire = createRequire(filename);
  const module = { exports: {} };
  const wrapper = vm.runInNewContext(`(function(require, module, exports) {${fs.readFileSync(filename, 'utf8')}\n})`);
  wrapper(name => name === 'vscode' ? vscode : localRequire(name), module, module.exports);
  const provider = new module.exports.SettingsViewProvider({});
  provider.view = { webview: { postMessage: message => messages.push(message) } };
  return { provider, values, writes, messages };
}

test('sidebar rejects invalid input and a stale document before writing settings', async () => {
  const { provider, writes, messages } = sidebar();
  await provider.save({ type: 'save', resource: null, settings: { fontSize: 999, tableRowHeight: 30, horizontalMargin: 0, verticalMargin: 0 } });
  assert.equal(writes.length, 0);
  assert.ok(messages.some(message => message.type === 'error'));
  messages.length = 0;
  await provider.save({ type: 'save', resource: 'file:///other.md', settings: { fontSize: 13, tableRowHeight: 30, horizontalMargin: 0, verticalMargin: 0 } });
  assert.equal(writes.length, 0);
  assert.ok(messages.some(message => message.type === 'error'));
});

test('Apply and Reset persist values before reporting success', async () => {
  const { provider, writes, values, messages } = sidebar();
  await provider.save({ type: 'save', resource: null, settings: { theme: 'paper', fontSize: 13, tableRowHeight: 30, horizontalMargin: 140, verticalMargin: 72 } });
  assert.deepEqual(values, { theme: 'paper', fontSize: 13, tableRowHeight: 30, horizontalMargin: 140, verticalMargin: 72 });
  assert.ok(writes.every(write => write.target === 1));
  assert.equal(messages.filter(message => message.type === 'saved').length, 1);
  await provider.save({ type: 'reset', resource: null });
  assert.deepEqual(values, { theme: 'vue', fontSize: 14, tableRowHeight: 36, horizontalMargin: 0, verticalMargin: 0 });
});

test('failed writes report the actual partial configuration and keep controls recoverable', async () => {
  const { provider, messages } = sidebar('tableRowHeight');
  await provider.save({ type: 'save', resource: null, settings: { theme: 'night', fontSize: 13, tableRowHeight: 30, horizontalMargin: 140, verticalMargin: 72 } });
  const error = messages.find(message => message.type === 'error');
  assert.ok(error);
  assert.deepEqual(error.settings, { theme: 'night', fontSize: 13, tableRowHeight: 36, horizontalMargin: 0, verticalMargin: 0 });
  assert.equal(messages.some(message => message.type === 'saved'), false);
  assert.equal(provider.saving, false);
});

test('instant theme switching only persists the theme and rejects invalid or stale requests', async () => {
  const { provider, values, writes, messages } = sidebar();
  await provider.save({ type: 'theme', theme: 'bamboo', resource: null, settings: { fontSize: 22, tableRowHeight: 60, horizontalMargin: 140, verticalMargin: 72 } });
  assert.deepEqual(writes, [{ key: 'theme', value: 'bamboo', target: 1 }]);
  assert.deepEqual(values, { theme: 'bamboo', fontSize: 14, tableRowHeight: 36, horizontalMargin: 0, verticalMargin: 0 });
  assert.equal(messages.find(message => message.type === 'saved').action, 'theme');
  await provider.save({ type: 'theme', theme: 'invalid', resource: null });
  await provider.save({ type: 'theme', theme: 'paper', resource: 'file:///other.md' });
  assert.equal(writes.length, 1);
  assert.equal(messages.filter(message => message.type === 'error').length, 2);
});
