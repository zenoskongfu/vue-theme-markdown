# Yuejing Markdown · Reading Realm

English · [简体中文](README.zh-CN.md)

Read novels and everyday documents in VS Code's built-in Markdown preview. Yuejing Markdown provides five novel themes, a Vue documentation theme, and sidebar controls for font size, table row height, and page padding.

## Getting started

1. Install and enable the extension, then open a Markdown file.
2. Run **Markdown: Open Preview** (`Cmd+Shift+V` on macOS, `Ctrl+Shift+V` on Windows or Linux).
3. Select the book icon **Yuejing Markdown** in the Activity Bar, or run **Yuejing Markdown: Open Reading Settings**.
4. Select a theme to save it immediately. Adjust the other controls and choose **Apply Settings** to save them and refresh open previews.

The sidebar follows the most recently active Markdown file. It shows where settings will be saved. A file's preview reads settings for that file, including workspace and folder overrides.

## Reading themes

| Theme | Appearance | Layout |
| --- | --- | --- |
| **Vue Docs** | Green accents; follows the editor's light or dark appearance | Familiar document, code, and table styling |
| **Warm Paper** | Ivory page and serif type | Centered chapter headings, 2.05 line spacing |
| **Bamboo** | Pale green and serif type | Centered chapter headings, 2.1 line spacing |
| **Soft Gray** | Clean gray and sans serif type | Left-aligned headings, 2.0 line spacing |
| **Parchment** | Classic paper and calligraphic serif type | Centered chapter headings, 2.15 line spacing |
| **Night Ink** | Dark gray with gentle text contrast | Centered chapter headings, 2.05 line spacing |

Novel themes add first-line paragraph indents and generous paragraph spacing. Existing full-width-space indents are preserved. Quotes, lists, code, and tables keep their Markdown layouts. Fonts come from the system with local fallbacks; no download is needed. Novel palettes are independent of the editor's light or dark mode. Explicit high-contrast editor themes retain accessible editor colors. Printing uses a separate white-page layout.

## Settings

| Setting | Default | Values |
| --- | --- | --- |
| `vueGreenMarkdown.theme` | `vue` | `vue`, `paper`, `bamboo`, `clean`, `parchment`, `night` |
| `vueGreenMarkdown.fontSize` | 14px | Integer, 10–32px |
| `vueGreenMarkdown.tableRowHeight` | 36px | Integer, 24–120px |
| `vueGreenMarkdown.horizontalMarginMode` | `theme` | `theme` or `custom` |
| `vueGreenMarkdown.horizontalMargin` | 0px | Number, 0–320px; decimals allowed |
| `vueGreenMarkdown.verticalMarginMode` | `theme` | `theme` or `custom` |
| `vueGreenMarkdown.verticalMargin` | 0px | Number, 0–320px; decimals allowed |

For example, use the warm-paper theme with 24px horizontal padding and no vertical padding:

```json
{
  "vueGreenMarkdown.theme": "paper",
  "vueGreenMarkdown.horizontalMarginMode": "custom",
  "vueGreenMarkdown.horizontalMargin": 24,
  "vueGreenMarkdown.verticalMarginMode": "custom",
  "vueGreenMarkdown.verticalMargin": 0
}
```

The text column has no fixed maximum width: it fills the available preview window. **Theme default** uses each theme's built-in padding. **Custom** applies the pixel value, including a true `0px`. In narrow previews, custom horizontal padding is capped at 10% of the viewport width to keep content visible. Padding affects screen previews only; print margins are unchanged. Wide tables and code blocks can scroll horizontally, while images remain within their container.

For compatibility, existing 0.3.1 margin values retain their previous meaning until you select a mode: `0` means theme default and positive values remain custom. Applying settings in the sidebar saves an explicit mode. Changing themes keeps font, table, and padding settings, including pending sidebar edits. **Restore Defaults** restores the Vue theme, 14px body font, 36px table rows, and theme-default padding.

The sidebar saves at the most specific existing scope: folder, workspace, or user. You can also edit the settings in VS Code's Settings UI or `settings.json`. Changes refresh open previews automatically.

## Compatibility and privacy

The former **Vue Green Markdown Preview** is now **Yuejing Markdown**. Extension ID `zenoschen.vue-theme-markdown` and setting prefix `vueGreenMarkdown` are unchanged. Existing installations can upgrade without losing their settings. If another extension also contributes Markdown preview styles, the final appearance may depend on style load order.

Everything runs locally. The extension stores VS Code settings and refreshes previews; it does not collect data, make network requests, or modify Markdown source files.

## Development

Run `npm ci` to install development dependencies. Then:

- `npm test` checks configuration, localization, Markdown rendering, and sidebar saves.
- `npm run test:layout` checks actual geometry, themes, narrow previews, tables, printing, and sidebar behavior in Chrome. Set `CHROME_EXECUTABLE` if Chrome is elsewhere.
- `npm run test:integration` checks activation, configuration scopes, rendering, and preview commands in an isolated VS Code test profile. `VSCODE_EXECUTABLE`, `VSCODE_TEST_DATA_DIR`, and `VSCODE_TEST_LOCALE` can override the executable, test-data location, and UI language.
- `npm run package` builds a VSIX for local inspection.

Licensed under MIT; see [LICENSE](LICENSE).
