(() => {
  'use strict';
  const vscode = acquireVsCodeApi();
  const form = document.getElementById('settings');
  const fieldset = form.querySelector('fieldset');
  const status = document.getElementById('status');
  const t = window.readingStrings;
  const keys = ['fontSize', 'tableRowHeight', 'horizontalMargin', 'verticalMargin'];
  const marginKeys = ['horizontalMargin', 'verticalMargin'];
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
      for (const key of marginKeys) document.getElementById(`${key}Mode`).value = message.settings[`${key}Mode`];
      syncMarginControls();
      dirty = false;
    }
    document.getElementById(`theme-${message.settings.theme}`).checked = true;
  }

  function syncMarginControls() {
    for (const key of marginKeys) {
      const custom = document.getElementById(`${key}Mode`).value === 'custom';
      document.getElementById(key).disabled = !custom;
      document.getElementById(`${key}Range`).disabled = !custom;
    }
  }

  for (const key of marginKeys) {
    document.getElementById(`${key}Mode`).addEventListener('change', () => {
      syncMarginControls();
      dirty = true;
      showStatus(t.applyHint);
    });
  }

  for (const key of keys) {
    const number = document.getElementById(key);
    const range = document.getElementById(`${key}Range`);
    range.addEventListener('input', () => {
      number.value = range.value;
      dirty = true;
      showStatus(t.applyHint);
    });
    number.addEventListener('input', () => {
      if (number.validity.valid) range.value = number.value;
      dirty = true;
      showStatus(t.applyHint);
    });
  }

  function send(type, theme) {
    saving = true;
    fieldset.disabled = true;
    showStatus(t.saving);
    vscode.postMessage({
      type,
      resource,
      theme,
      settings: {
        theme: form.querySelector('input[name="theme"]:checked').value,
        ...Object.fromEntries(keys.map(key => [key, Number(document.getElementById(key).value)])),
        ...Object.fromEntries(marginKeys.map(key => [`${key}Mode`, document.getElementById(`${key}Mode`).value])),
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
    document.getElementById('file').textContent = `${t.file}: ${message.file}`;
    document.getElementById('scope').textContent = `${t.saveTo}: ${message.scope}`;
    const changedFile = message.resource !== resource;
    if (message.type === 'state') {
      if (!saving) {
        populate(message, dirty && !changedFile);
        fieldset.disabled = false;
        if (changedFile) showStatus(t.fileLoaded);
        else if (status.textContent === t.loading) showStatus(t.initial);
      }
    } else {
      saving = false;
      fieldset.disabled = false;
      populate(message, message.action === 'theme' && dirty && !changedFile);
      const themeName = document.getElementById(`theme-${message.settings.theme}`).dataset.name;
      const saved = message.action === 'theme' ? `${t.themeChangedPrefix}${themeName}${t.themeChangedSuffix}${dirty ? t.pending : t.refreshing}`
        : message.action === 'reset' ? t.reset : t.saved;
      showStatus(message.type === 'error' ? message.message : saved, message.type === 'error');
    }
  });

  vscode.postMessage({ type: 'ready' });
})();
