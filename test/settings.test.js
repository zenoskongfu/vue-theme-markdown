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
const modes = { horizontalMarginMode: 'theme', verticalMarginMode: 'theme' };

test('invalid configuration falls back to safe defaults without CSS injection', () => {
  for (const value of [undefined, null, NaN, Infinity, -1, 0, 999, '16', '14px;</style>', 14.5]) {
    assert.deepEqual(readSettings(api({ fontSize: value, tableRowHeight: value })), {
      theme: 'vue', fontSize: 14, tableRowHeight: 36, horizontalMargin: 0, verticalMargin: 0, ...modes,
    });
    assert.throws(() => validateSettings({ theme: 'vue', fontSize: value, tableRowHeight: 36, horizontalMargin: 0, verticalMargin: 0 }));
  }
});

test('valid boundaries are accepted and only supported fields are returned', () => {
  assert.deepEqual(validateSettings({ theme: 'paper', fontSize: 10, tableRowHeight: 24, horizontalMargin: 0, verticalMargin: 0, horizontalMarginMode: 'custom', verticalMarginMode: 'custom', other: true }), { theme: 'paper', fontSize: 10, tableRowHeight: 24, horizontalMargin: 0, verticalMargin: 0, horizontalMarginMode: 'custom', verticalMarginMode: 'custom' });
  assert.deepEqual(validateSettings({ theme: 'night', fontSize: 32, tableRowHeight: 120, horizontalMargin: 320, verticalMargin: 320, ...modes }), { theme: 'night', fontSize: 32, tableRowHeight: 120, horizontalMargin: 320, verticalMargin: 320, ...modes });
  assert.throws(() => validateSettings({ fontSize: 14 }));
  assert.throws(() => validateSettings(null));
});

test('invalid page margins fall back to theme defaults and cannot reach CSS', () => {
  for (const value of [undefined, null, -1, 321, '12', '12px;</style>', Infinity]) {
    assert.deepEqual(readSettings(api({ horizontalMargin: value, verticalMargin: value })), {
      theme: 'vue', fontSize: 14, tableRowHeight: 36, horizontalMargin: 0, verticalMargin: 0, ...modes,
    });
    for (const key of ['horizontalMargin', 'verticalMargin']) {
      assert.throws(() => validateSettings({ theme: 'vue', fontSize: 14, tableRowHeight: 36, horizontalMargin: 0, verticalMargin: 0, [key]: value }));
    }
  }
});

test('fractional page padding is accepted while font and table sizes stay integral', () => {
  const value = { theme: 'vue', fontSize: 14, tableRowHeight: 36,
    horizontalMargin: 0.5, verticalMargin: 1.25, horizontalMarginMode: 'custom', verticalMarginMode: 'custom' };
  assert.deepEqual(validateSettings(value), value);
  assert.equal(readSettings(api(value)).verticalMargin, 1.25);
  assert.throws(() => validateSettings({ ...value, fontSize: 14.5 }));
  assert.throws(() => validateSettings({ ...value, tableRowHeight: 36.5 }));
});

test('legacy margin values retain their meaning until a mode is explicitly selected', () => {
  const legacy = readSettings(api({ horizontalMargin: 0, verticalMargin: 96 }));
  assert.equal(legacy.horizontalMarginMode, 'theme');
  assert.equal(legacy.verticalMarginMode, 'custom');
  assert.equal(readSettings(api({ horizontalMargin: 1 })).horizontalMarginMode, 'custom');
  assert.equal(readSettings(api({ horizontalMargin: 96, horizontalMarginMode: 'theme' }, { horizontalMarginMode: { globalValue: 'theme' } })).horizontalMarginMode, 'theme');
  assert.equal(readSettings(api({ horizontalMargin: 0, horizontalMarginMode: 'custom' }, { horizontalMarginMode: { globalValue: 'custom' } })).horizontalMarginMode, 'custom');
  assert.throws(() => validateSettings({ theme: 'vue', fontSize: 14, tableRowHeight: 36, horizontalMargin: 0, verticalMargin: 0, horizontalMarginMode: 'invalid', verticalMarginMode: 'theme' }));
});

test('sidebar writes to the most specific existing scope, otherwise user settings', () => {
  assert.equal(getSaveTarget(api(), {}).target, 1);
  assert.equal(getSaveTarget(api({}, { fontSize: { workspaceValue: 15 } }), {}).target, 2);
  assert.equal(getSaveTarget(api({}, {
    fontSize: { workspaceValue: 15 }, tableRowHeight: { workspaceFolderValue: 30 },
  }), {}).target, 3);
  assert.equal(getSaveTarget(api({}, { fontSize: { workspaceValue: 15 } }, null)).target, 1);
  assert.equal(getSaveTarget(api({}, { theme: { workspaceFolderValue: 'paper' } }), {}).target, 3);
  assert.equal(getSaveTarget(api({}, { horizontalMargin: { workspaceValue: 80 } }), {}).target, 2);
});

test('only known theme identifiers are accepted; old installations retain Vue by default', () => {
  const { THEMES } = require('../src/themes');
  const schema = require('../package.json').contributes.configuration.properties['vueGreenMarkdown.theme'];
  assert.deepEqual(schema.enum, THEMES.map(theme => theme.id));
  assert.equal(schema.default, 'vue');
  for (const theme of THEMES) assert.equal(readSettings(api({ theme: theme.id })).theme, theme.id);
  for (const theme of [undefined, null, 'unknown', 'paper;</style><script>', '__proto__', {}, 1]) {
    assert.equal(readSettings(api({ theme })).theme, 'vue');
    assert.throws(() => validateSettings({ theme, fontSize: 14, tableRowHeight: 36, horizontalMargin: 0, verticalMargin: 0 }));
  }
});

test('manifest defaults and limits agree with configuration validation', () => {
  const properties = require('../package.json').contributes.configuration.properties;
  for (const [key, limit] of Object.entries(LIMITS)) {
    const schema = properties[`vueGreenMarkdown.${key}`];
    assert.equal(schema.default, limit.default);
    assert.equal(schema.minimum, limit.min);
    assert.equal(schema.maximum, limit.max);
    assert.equal(schema.type, limit.integer ? 'integer' : 'number');
  }
});
