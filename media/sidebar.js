(() => {
  'use strict';
  const vscode = acquireVsCodeApi();
  const form = document.getElementById('settings');
  const fieldset = form.querySelector('fieldset');
  const status = document.getElementById('status');
  const keys = ['fontSize', 'tableRowHeight'];
  let resource = null;
  let dirty = false;
  let saving = false;

  function showStatus(text, error = false) {
    status.textContent = text;
    status.classList.toggle('error', error);
  }

  function populate(message) {
    resource = message.resource;
    for (const key of keys) {
      document.getElementById(key).value = message.settings[key];
      document.getElementById(`${key}Range`).value = message.settings[key];
    }
    dirty = false;
  }

  for (const key of keys) {
    const number = document.getElementById(key);
    const range = document.getElementById(`${key}Range`);
    range.addEventListener('input', () => {
      number.value = range.value;
      dirty = true;
      showStatus('点击“应用设置”更新预览。');
    });
    number.addEventListener('input', () => {
      if (number.validity.valid) range.value = number.value;
      dirty = true;
      showStatus('点击“应用设置”更新预览。');
    });
  }

  function send(type) {
    saving = true;
    fieldset.disabled = true;
    showStatus('正在保存…');
    vscode.postMessage({
      type,
      resource,
      settings: Object.fromEntries(keys.map(key => [key, Number(document.getElementById(key).value)])),
    });
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!saving && form.reportValidity()) send('save');
  });
  document.getElementById('reset').addEventListener('click', () => {
    if (!saving) send('reset');
  });

  window.addEventListener('message', event => {
    const message = event.data;
    if (!['state', 'saved', 'error'].includes(message?.type)) return;
    document.getElementById('file').textContent = `当前：${message.file}`;
    document.getElementById('scope').textContent = `保存到：${message.scope}`;
    const changedFile = message.resource !== resource;
    if (message.type === 'state') {
      if (!saving && (!dirty || changedFile)) {
        populate(message);
        fieldset.disabled = false;
        if (changedFile) showStatus('已读取当前文件的设置。');
        else if (status.textContent === '正在读取设置…') showStatus('点击“应用设置”保存，并刷新已打开的预览。');
      }
    } else {
      saving = false;
      fieldset.disabled = false;
      populate(message);
      showStatus(message.type === 'error' ? message.message : message.reset ? '已恢复默认，正在刷新预览。' : '已保存，正在刷新预览。', message.type === 'error');
    }
  });

  vscode.postMessage({ type: 'ready' });
})();
