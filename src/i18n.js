'use strict';

// The manifest uses package.nls files; these strings cover the extension host
// and the sidebar webview. VS Code's UI language is the single runtime source.
const en = {
  lang: 'en', appName: 'Yuejing Markdown', panelTitle: 'Reading Settings',
  tagline: 'Choose a page for stories and a clear layout for documents.',
  allPreviews: 'All Markdown previews',
  scope: { folder: 'Folder', workspace: 'Current workspace', user: 'User settings' },
  themes: {
    vue: ['Vue Docs', 'Green accents · follows the editor'],
    paper: ['Warm Paper', 'Ivory pages · serif'],
    bamboo: ['Bamboo', 'Pale green · serif'],
    clean: ['Soft Gray', 'Clean gray · sans serif'],
    parchment: ['Parchment', 'Classic paper · calligraphic serif'],
    night: ['Night Ink', 'Night reading · soft gray text'],
  },
  ui: {
    themeHeading: 'Reading theme', themeHelp: 'Select a theme to save it immediately. Novel themes use first-line indents and generous line spacing.',
    fontSize: 'Body font size', fontHelp: 'Headings and code scale with the body text. Default: 14px. Changing themes keeps your size.',
    tableRowHeight: 'Table row height', tableHelp: 'Default: 36px. Table text stays on one line; wide tables scroll horizontally. Line breaks or images may increase height.',
    horizontalMargin: 'Left and right page padding', horizontalMarginHelp: 'Choose Theme default to keep the theme spacing, or Custom for 0–320px (decimals allowed). The page uses the entire preview width; narrow windows cap custom side padding.',
    verticalMargin: 'Top and bottom page padding', verticalMarginHelp: 'Choose Theme default to keep the theme spacing, or Custom for 0–320px (decimals allowed) on both edges. Screen preview only; print margins are unchanged.',
    themeDefault: 'Theme default', custom: 'Custom', apply: 'Apply Settings', reset: 'Restore Defaults',
  },
  status: {
    loading: 'Reading settings…', applyHint: 'Select Apply Settings to update the preview.', saving: 'Saving…',
    file: 'Current', saveTo: 'Save to', fileLoaded: 'Loaded settings for the current file.',
    initial: 'Select Apply Settings to save and refresh open previews.',
    themeChangedPrefix: 'Switched to “', themeChangedSuffix: '”.', pending: ' Other reading settings are still awaiting Apply.', refreshing: ' Refreshing previews.',
    reset: 'Restored Vue Docs, 14px font, 36px table rows, and theme-default page padding.',
    saved: 'Saved. Refreshing previews.',
  },
  errors: {
    invalidSettings: 'Font size must be an integer from 10–32px, table row height an integer from 24–120px, and page padding a number from 0–320px. Choose a valid padding mode.',
    invalidTheme: 'Choose a valid reading theme.', staleFile: 'The active Markdown file changed. Review the settings again.',
    refreshFailed: detail => `Yuejing Markdown preview refresh failed: ${detail}`,
  },
};

const zh = {
  lang: 'zh-CN', appName: '阅境 Markdown', panelTitle: '阅读设置',
  tagline: '为故事选一张书页，也为文档留一份清晰。',
  allPreviews: '所有 Markdown 预览',
  scope: { folder: '文件夹', workspace: '当前工作区', user: '用户设置' },
  themes: {
    vue: ['Vue 文档', '绿色装饰 · 跟随编辑器'],
    paper: ['暖纸', '米色书页 · 宋体'],
    bamboo: ['青竹', '晋江浅绿 · 宋体'],
    clean: ['雾白', '番茄清爽 · 黑体'],
    parchment: ['古卷', '纵横纸色 · 楷体'],
    night: ['墨夜', '夜间阅读 · 柔和灰字'],
  },
  ui: {
    themeHeading: '阅读主题', themeHelp: '点击立即切换并保存。小说主题使用两字缩进和舒展行距。',
    fontSize: '正文字号', fontHelp: '标题与代码会按比例缩放，默认 14px。切换主题保留你的字号。',
    tableRowHeight: '表格行高', tableHelp: '默认 36px。表格内容不自动换行，超出宽度可横向滚动。手动换行或图片会撑高行。',
    horizontalMargin: '左右页边距', horizontalMarginHelp: '选择“主题默认”沿用主题留白；选择“自定义”可设 0–320px，支持小数。正文会铺满预览可用宽度，窄窗口会限制自定义留白。',
    verticalMargin: '上下页边距', verticalMarginHelp: '选择“主题默认”沿用主题留白；选择“自定义”可设 0–320px，支持小数。仅影响屏幕预览，不改变打印页边距。',
    themeDefault: '主题默认', custom: '自定义', apply: '应用设置', reset: '恢复默认',
  },
  status: {
    loading: '正在读取设置…', applyHint: '点击“应用设置”更新预览。', saving: '正在保存…',
    file: '当前', saveTo: '保存到', fileLoaded: '已读取当前文件的设置。',
    initial: '点击“应用设置”保存，并刷新已打开的预览。',
    themeChangedPrefix: '已切换为“', themeChangedSuffix: '”。', pending: '阅读设置的修改仍待应用。', refreshing: '预览正在刷新。',
    reset: '已恢复 Vue 文档主题、14px 字号、36px 行高和主题默认页边距。',
    saved: '已保存，正在刷新预览。',
  },
  errors: {
    invalidSettings: '字号须为 10–32px 的整数，表格行高须为 24–120px 的整数，页边距须为 0–320px 的数字，并选择有效的页边距模式。',
    invalidTheme: '请选择有效的阅读主题。', staleFile: '当前 Markdown 文件已切换，请重新确认设置。',
    refreshFailed: detail => `阅境 Markdown 预览刷新失败：${detail}`,
  },
};

function messages(locale) {
  return /^zh(?:[-_]|$)/i.test(locale || '') ? zh : en;
}

module.exports = { messages };
