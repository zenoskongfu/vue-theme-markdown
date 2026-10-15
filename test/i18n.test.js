'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { messages } = require('../src/i18n');

test('manifest localization has matching English and Chinese values for every placeholder', () => {
  const root = path.resolve(__dirname, '..');
  const manifest = fs.readFileSync(path.join(root, 'package.json'), 'utf8');
  const english = JSON.parse(fs.readFileSync(path.join(root, 'package.nls.json'), 'utf8'));
  const chinese = JSON.parse(fs.readFileSync(path.join(root, 'package.nls.zh-cn.json'), 'utf8'));
  const keys = [...manifest.matchAll(/%([\w.]+)%/g)].map(match => match[1]);
  assert.ok(keys.length > 25);
  assert.deepEqual(Object.keys(english).sort(), Object.keys(chinese).sort());
  assert.deepEqual([...new Set(keys)].sort(), Object.keys(english).sort());
  for (const key of keys) {
    assert.ok(english[key] && chinese[key], key);
    assert.doesNotMatch(english[key], /[\u4e00-\u9fff]/);
  }
  assert.equal(english.displayName, messages('en').appName);
  assert.equal(chinese.displayName, messages('zh-cn').appName);
  for (const [id, name] of Object.entries(messages('en').themes)) assert.equal(english[`theme.${id}`], name[0]);
  for (const [id, name] of Object.entries(messages('zh-cn').themes)) assert.equal(chinese[`theme.${id}`], name[0]);
});

test('runtime strings follow VS Code language and unsupported locales fall back to English', () => {
  assert.equal(messages('zh-CN').ui.apply, '应用设置');
  assert.equal(messages('zh-tw').ui.apply, '应用设置');
  assert.equal(messages('en-US').ui.apply, 'Apply Settings');
  assert.equal(messages('de').ui.apply, 'Apply Settings');
  assert.match(messages('en').errors.invalidSettings, /padding mode/);
  assert.match(messages('zh-cn').errors.staleFile, /当前 Markdown 文件/);
});
