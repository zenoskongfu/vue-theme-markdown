'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { messages } = require('./i18n');

const DEFAULT_THEME = 'vue';
const song = '"Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif';
const sans = '"PingFang SC", "Microsoft YaHei", system-ui, sans-serif';

// Original palettes inspired by Chinese reading sites. All CSS values are local
// constants; configuration can select a theme, never supply arbitrary styles.
const THEMES = [
  { id: 'vue', background: '#ffffff', foreground: '#213547', accent: '#42b883' },
  { id: 'paper', background: '#f6f1e7', foreground: '#352e25', accent: '#95613f',
    soft: '#eee7db', text: '#484036', muted: '#796e60', border: '#d9cebe', selection: '#e8d7c2', font: song, lineHeight: '2.05', align: 'center', scheme: 'light' },
  { id: 'bamboo', background: '#f0f9ed', foreground: '#2d3c29', accent: '#4d7940',
    soft: '#e5f0df', text: '#354630', muted: '#62735a', border: '#cadcc2', selection: '#d1e5c6', font: song, lineHeight: '2.1', align: 'center', scheme: 'light' },
  { id: 'clean', background: '#f2f2f2', foreground: '#262626', accent: '#ab4c32',
    soft: '#e8e8e8', text: '#333333', muted: '#707070', border: '#d8d8d8', selection: '#e6d6ce', font: sans, lineHeight: '2', align: 'left', scheme: 'light' },
  { id: 'parchment', background: '#eae1cf', foreground: '#3d3326', accent: '#82643c',
    soft: '#e0d5bf', text: '#4b4030', muted: '#786a53', border: '#cabda5', selection: '#d4c2a2', font: '"Kaiti SC", STKaiti, KaiTi, "Songti SC", SimSun, serif', lineHeight: '2.15', align: 'center', scheme: 'light' },
  { id: 'night', background: '#202124', foreground: '#dedbd3', accent: '#cfaf7c',
    soft: '#2b2c2f', text: '#c8c5bd', muted: '#99968e', border: '#454546', selection: '#514535', font: sans, lineHeight: '2.05', align: 'center', scheme: 'dark' },
];

const catalog = new Map(THEMES.map(theme => [theme.id, theme]));
const novelLayout = fs.readFileSync(path.join(__dirname, '../themes/novel.css'), 'utf8');

function isTheme(value) {
  return typeof value === 'string' && catalog.has(value);
}

function validateTheme(value, locale) {
  if (!isTheme(value)) throw new Error(messages(locale).errors.invalidTheme);
  return value;
}

function getThemeCss(value) {
  const theme = catalog.get(value);
  if (!theme || theme.id === DEFAULT_THEME) return '';
  const tokens = {
    'vue-bg': theme.background, 'vue-bg-soft': theme.soft, 'vue-bg-mute': theme.soft, 'vue-bg-code': theme.soft,
    'vue-text-1': theme.foreground, 'vue-text-2': theme.text, 'vue-text-3': theme.muted,
    'vue-brand': theme.accent, 'vue-brand-dark': theme.accent, 'vue-brand-soft': theme.selection,
    'vue-border': theme.border, 'vue-divider': theme.border, 'vue-code-text': theme.text,
    'vue-code-inline-bg': theme.soft, 'vue-shadow-1': 'none', 'vue-shadow-2': 'none',
    'reading-font': theme.font, 'reading-line-height': theme.lineHeight,
    'reading-heading-align': theme.align, 'reading-color-scheme': theme.scheme,
  };
  const declarations = Object.entries(tokens).map(([key, value]) => `--${key}:${value};`).join('');
  // Screen-only palettes leave the existing dedicated print layout effective.
  return `\n@media screen{body.vscode-body{${declarations}}\n${novelLayout}\n}`;
}

module.exports = { DEFAULT_THEME, THEMES, isTheme, validateTheme, getThemeCss };
