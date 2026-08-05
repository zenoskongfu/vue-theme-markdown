# Vue Green Markdown Preview

A polished Vue and VitePress inspired theme for VS Code's built-in Markdown preview. It styles Markdown automatically after installation—no workspace settings or commands are required.

## Features

- Vue-inspired green palette, typography, spacing, and content layout
- Matching light, dark, and high-contrast theme support
- Styled headings, links, lists, tables, blockquotes, code, images, and task lists
- GitHub-style Markdown alerts and VitePress-style custom containers
- Responsive layouts, print styles, and reduced-motion support
- No runtime code, telemetry, or network access

## Usage

1. Install and enable the extension.
2. Open a Markdown file.
3. Run **Markdown: Open Preview** (`Ctrl+Shift+V` on Windows/Linux or `Cmd+Shift+V` on macOS).

The theme is applied to every built-in Markdown preview. If another extension also contributes preview styles, the final appearance may depend on the order in which VS Code loads those styles.

## Supported custom blocks

The stylesheet includes presentation for common generated HTML such as `.custom-block.tip`, `.custom-block.warning`, `.custom-block.danger`, `.custom-block.info`, and `.markdown-alert`. Rendering custom syntax into those elements still requires the corresponding Markdown extension.

## Privacy

This extension contains CSS only. It does not collect data, run scripts, or make network requests.

## License

MIT. See the `LICENSE` file included with the extension.
