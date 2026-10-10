# Vue Green Markdown Preview

A polished Vue and VitePress inspired theme for VS Code's built-in Markdown preview. It styles Markdown automatically after installation—no workspace settings or commands are required.

## Features

- Vue-inspired green palette, typography, spacing, and content layout
- Matching light, dark, and high-contrast theme support
- Styled headings, links, lists, tables, blockquotes, code, images, and task lists
- GitHub-style Markdown alerts and VitePress-style custom containers
- Responsive layouts, print styles, and reduced-motion support
- Sidebar controls for preview font size and table row height
- Single-line table cells with horizontal scrolling for wide tables
- No telemetry or network access

## Usage

1. Install and enable the extension.
2. Open a Markdown file.
3. Run **Markdown: Open Preview** (`Ctrl+Shift+V` on Windows/Linux or `Cmd+Shift+V` on macOS).

The theme is applied to every built-in Markdown preview. If another extension also contributes preview styles, the final appearance may depend on the order in which VS Code loads those styles.

## Preview settings

Click the **Vue Markdown** icon in the Activity Bar to open **Preview Settings**, or run **Vue Markdown: Open Preview Settings** from the Command Palette. Adjust the sliders or enter pixel values, then click **应用设置** (Apply). Open previews refresh automatically. **恢复默认** (Reset) restores 14px text and 36px table rows.

| Setting | Default | Range | Effect |
| --- | --- | --- | --- |
| `vueGreenMarkdown.fontSize` | 14px | 10–32px | Scales body text, headings, and code in the preview. |
| `vueGreenMarkdown.tableRowHeight` | 36px | 24–120px | Sets the minimum table row height, including the header. |

Both settings are also available in VS Code Settings. For example:

```json
{
  "vueGreenMarkdown.fontSize": 13,
  "vueGreenMarkdown.tableRowHeight": 30
}
```

Settings use VS Code's user, workspace, and workspace-folder configuration. The sidebar follows the most recently active Markdown file, displays where it will save, and updates the most specific scope already configured for either setting; otherwise it saves to user settings. This keeps existing workspace overrides effective. Each preview reads the settings for its own file.

Table text, including inline code, does not wrap automatically. Wide tables scroll horizontally. Explicit `<br>` elements, images, and content taller than the configured minimum still increase row height. Narrow previews keep the configured font size and row height. Print layout retains its dedicated 11pt body text.

## Supported custom blocks

The stylesheet includes presentation for common generated HTML such as `.custom-block.tip`, `.custom-block.warning`, `.custom-block.danger`, `.custom-block.info`, and `.markdown-alert`. Rendering custom syntax into those elements still requires the corresponding Markdown extension.

## Privacy

The extension runs local code to show the settings sidebar, save VS Code configuration, and apply numeric sizing values to Markdown previews. It does not collect data or make network requests. It does not modify Markdown files.

## Development

Run `npm ci`, then `npm test` for configuration and Markdown rendering tests. `npm run test:layout` checks responsive layout in Chrome; set `CHROME_EXECUTABLE` if Chrome is installed outside the standard macOS location. Run `npm run test:integration` for tests in VS Code, optionally setting `VSCODE_EXECUTABLE` to an installed executable to avoid a download. `npm run package` builds a VSIX.

## License

MIT. See the `LICENSE` file included with the extension.
