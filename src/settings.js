'use strict';

const { DEFAULT_THEME, isTheme, validateTheme } = require('./themes');
const SECTION = 'vueGreenMarkdown';
const LIMITS = {
  fontSize: { default: 14, min: 10, max: 32 },
  tableRowHeight: { default: 36, min: 24, max: 120 },
};
const DEFAULTS = { theme: DEFAULT_THEME, ...Object.fromEntries(Object.entries(LIMITS).map(([key, limit]) => [key, limit.default])) };

function isValid(key, value) {
  const limit = LIMITS[key];
  return Boolean(limit && Number.isInteger(value) && value >= limit.min && value <= limit.max);
}

function readSettings(vscode, resource) {
  const config = vscode.workspace.getConfiguration(SECTION, resource);
  const theme = config.get('theme');
  return { theme: isTheme(theme) ? theme : DEFAULT_THEME, ...Object.fromEntries(Object.entries(LIMITS).map(([key, limit]) => {
    const value = config.get(key);
    return [key, isValid(key, value) ? value : limit.default];
  })) };
}

function validateSettings(value) {
  if (!value || !Object.keys(LIMITS).every(key => isValid(key, value[key]))) {
    throw new Error('字号须为 10–32 的整数，表格行高须为 24–120 的整数。');
  }
  return { theme: validateTheme(value.theme), fontSize: value.fontSize, tableRowHeight: value.tableRowHeight };
}

// Preserve the most specific existing configuration scope so a sidebar change
// takes effect even when a workspace overrides the user's settings.
function getSaveTarget(vscode, resource) {
  const config = vscode.workspace.getConfiguration(SECTION, resource);
  const inspected = Object.keys(DEFAULTS).map(key => config.inspect(key));
  const folder = resource && vscode.workspace.getWorkspaceFolder(resource);
  if (folder && inspected.some(value => value?.workspaceFolderValue !== undefined)) {
    return { target: vscode.ConfigurationTarget.WorkspaceFolder, label: `文件夹：${folder.name}` };
  }
  if (vscode.workspace.workspaceFolders?.length && inspected.some(value => value?.workspaceValue !== undefined)) {
    return { target: vscode.ConfigurationTarget.Workspace, label: '当前工作区' };
  }
  return { target: vscode.ConfigurationTarget.Global, label: '用户设置' };
}

module.exports = { SECTION, LIMITS, DEFAULTS, readSettings, validateSettings, getSaveTarget };
