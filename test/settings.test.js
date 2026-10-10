'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { LIMITS, readSettings, validateSettings, getSaveTarget } = require('../src/settings');

function api(values = {}, overrides = {}, folders = [{ name: 'docs' }]) {
  return {
    ConfigurationTarget: { Global: 1, Workspace: 2, WorkspaceFolder: 3 },
    workspace: {
      workspaceFolders: folders,
      getWorkspaceFolder: () => folders?.[0],
      getConfiguration: () => ({
        get: key => values[key],
        inspect: key => overrides[key],
      }),
    },
  };
}

test('invalid configuration falls back to safe defaults without CSS injection', () => {
  for (const value of [undefined, null, NaN, Infinity, -1, 0, 999, '16', '14px;</style>', 14.5]) {
    assert.deepEqual(readSettings(api({ fontSize: value, tableRowHeight: value })), {
      fontSize: 14, tableRowHeight: 36,
    });
    assert.throws(() => validateSettings({ fontSize: value, tableRowHeight: 36 }));
  }
});

test('valid boundaries are accepted and only supported fields are returned', () => {
  assert.deepEqual(validateSettings({ fontSize: 10, tableRowHeight: 24, other: true }), { fontSize: 10, tableRowHeight: 24 });
  assert.deepEqual(validateSettings({ fontSize: 32, tableRowHeight: 120 }), { fontSize: 32, tableRowHeight: 120 });
  assert.throws(() => validateSettings({ fontSize: 14 }));
  assert.throws(() => validateSettings(null));
});

test('sidebar writes to the most specific existing scope, otherwise user settings', () => {
  assert.equal(getSaveTarget(api(), {}).target, 1);
  assert.equal(getSaveTarget(api({}, { fontSize: { workspaceValue: 15 } }), {}).target, 2);
  assert.equal(getSaveTarget(api({}, {
    fontSize: { workspaceValue: 15 }, tableRowHeight: { workspaceFolderValue: 30 },
  }), {}).target, 3);
  assert.equal(getSaveTarget(api({}, { fontSize: { workspaceValue: 15 } }, null)).target, 1);
});

test('manifest defaults and limits agree with configuration validation', () => {
  const properties = require('../package.json').contributes.configuration.properties;
  for (const [key, limit] of Object.entries(LIMITS)) {
    const schema = properties[`vueGreenMarkdown.${key}`];
    assert.equal(schema.default, limit.default);
    assert.equal(schema.minimum, limit.min);
    assert.equal(schema.maximum, limit.max);
  }
});
