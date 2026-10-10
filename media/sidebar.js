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

  function populate(message, preserveDraft = false) {
    resource = message.resource;
    if (!preserveDraft) {
      for (const key of keys) {
        document.getElementById(key).value = message.settings[key];
        document.getElementById(`${key}Range`).value = message.settings[key];
      }
      dirty = false;
    }
    document.getElementById(`theme-${message.settings.theme}`).checked = true;
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

  function send(type, theme) {
    saving = true;
    fieldset.disabled = true;
    showStatus('正在保存…');
    vscode.postMessage({
      type,
      resource,
      theme,
      settings: {
        theme: form.querySelector('input[name="theme"]:checked').value,
        ...Object.fromEntries(keys.map(key => [key, Number(document.getElementById(key).value)])),
      },
    });
  }

  for (const radio of form.querySelectorAll('input[name="theme"]')) {
    radio.addEventListener('change', () => {
      if (radio.checked && !saving) send('theme', radio.value);
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
      if (!saving) {
        populate(message, dirty && !changedFile);
        fieldset.disabled = false;
        if (changedFile) showStatus('已读取当前文件的设置。');
        else if (status.textContent === '正在读取设置…') showStatus('点击“应用设置”保存，并刷新已打开的预览。');
      }
    } else {
      saving = false;
      fieldset.disabled = false;
      populate(message, message.action === 'theme' && dirty && !changedFile);
      const themeName = document.getElementById(`theme-${message.settings.theme}`).dataset.name;
      const saved = message.action === 'theme' ? `已切换为“${themeName}”。${dirty ? '字号和行高的修改仍待应用。' : '预览正在刷新。'}`
        : message.action === 'reset' ? '已恢复 Vue 文档主题、14px 字号和 36px 行高。' : '已保存，正在刷新预览。';
      showStatus(message.type === 'error' ? message.message : saved, message.type === 'error');
    }
  });

  vscode.postMessage({ type: 'ready' });
})();
