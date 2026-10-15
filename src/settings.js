'use strict';

const { DEFAULT_THEME, isTheme, validateTheme } = require('./themes');
const { messages } = require('./i18n');
const SECTION = 'vueGreenMarkdown';
const LIMITS = {
  fontSize: { default: 14, min: 10, max: 32, integer: true },
  tableRowHeight: { default: 36, min: 24, max: 120, integer: true },
  horizontalMargin: { default: 0, min: 0, max: 320 },
  verticalMargin: { default: 0, min: 0, max: 320 },
};
const MARGIN_MODES = ['theme', 'custom'];
const DEFAULTS = {
  theme: DEFAULT_THEME,
  ...Object.fromEntries(Object.entries(LIMITS).map(([key, limit]) => [key, limit.default])),
  horizontalMarginMode: 'theme', verticalMarginMode: 'theme',
};

function isValid(key, value) {
  const limit = LIMITS[key];
  return Boolean(limit && typeof value === 'number' && Number.isFinite(value) &&
    (!limit.integer || Number.isInteger(value)) && value >= limit.min && value <= limit.max);
}

function readSettings(vscode, resource) {
  const config = vscode.workspace.getConfiguration(SECTION, resource);
  const theme = config.get('theme');
  const numbers = Object.fromEntries(Object.entries(LIMITS).map(([key, limit]) => {
    const value = config.get(key);
    return [key, isValid(key, value) ? value : limit.default];
  }));
  const modes = Object.fromEntries(['horizontalMargin', 'verticalMargin'].map(key => {
    const modeKey = `${key}Mode`;
    const inspected = config.inspect(modeKey);
    const explicit = ['globalValue', 'workspaceValue', 'workspaceFolderValue'].some(scope => inspected?.[scope] !== undefined);
    const mode = config.get(modeKey);
    // v0.3.1 used 0 for "theme default" and positive values for custom margins.
    // Retain that meaning until the new mode is explicitly configured.
    return [modeKey, explicit && MARGIN_MODES.includes(mode) ? mode : numbers[key] > 0 ? 'custom' : 'theme'];
  }));
  return { theme: isTheme(theme) ? theme : DEFAULT_THEME, ...numbers, ...modes };
}

function validateSettings(value, locale) {
  if (!value || !Object.keys(LIMITS).every(key => isValid(key, value[key])) ||
      !['horizontalMarginMode', 'verticalMarginMode'].every(key => MARGIN_MODES.includes(value[key]))) {
    throw new Error(messages(locale).errors.invalidSettings);
  }
  return { theme: validateTheme(value.theme, locale), ...Object.fromEntries(Object.keys(LIMITS).map(key => [key, value[key]])),
    horizontalMarginMode: value.horizontalMarginMode, verticalMarginMode: value.verticalMarginMode };
}

// Preserve the most specific existing configuration scope so a sidebar change
// takes effect even when a workspace overrides the user's settings.
function getSaveTarget(vscode, resource) {
  const t = messages(vscode.env?.language);
  const config = vscode.workspace.getConfiguration(SECTION, resource);
  const inspected = Object.keys(DEFAULTS).map(key => config.inspect(key));
  const folder = resource && vscode.workspace.getWorkspaceFolder(resource);
  if (folder && inspected.some(value => value?.workspaceFolderValue !== undefined)) {
    return { target: vscode.ConfigurationTarget.WorkspaceFolder, label: `${t.scope.folder}: ${folder.name}` };
  }
  if (vscode.workspace.workspaceFolders?.length && inspected.some(value => value?.workspaceValue !== undefined)) {
    return { target: vscode.ConfigurationTarget.Workspace, label: t.scope.workspace };
  }
  return { target: vscode.ConfigurationTarget.Global, label: t.scope.user };
}

module.exports = { SECTION, LIMITS, DEFAULTS, MARGIN_MODES, isValid, readSettings, validateSettings, getSaveTarget };
