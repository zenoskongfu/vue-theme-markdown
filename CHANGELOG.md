# Changelog

All notable changes to this extension are documented here.

## 0.3.2 - 2026-10-15

- Removed the fixed maximum text-column width from all preview themes so content uses the available preview width.
- Added separate theme-default and custom page-padding modes. Custom 0px now removes padding, fractional pixel values are supported, and 0.3.1 values keep their previous meaning until a mode is selected.
- Added English and Simplified Chinese manifest, sidebar, theme, status, and error strings based on VS Code's UI language. Added an English README and kept the Chinese guide.
- Added wide and narrow viewport geometry checks and English and Chinese VS Code integration checks.

## 0.3.1 - 2026-10-15

- Added horizontal and vertical Markdown preview page margin controls to the reading sidebar and VS Code settings.
- Kept each theme's original page spacing when margin settings remain at 0, including narrow preview widths.
- Capped custom horizontal spacing in narrow previews and left print margins unchanged.

## 0.3.0 - 2026-10-10

- Renamed the extension to 阅境 Markdown (Reading Realm), retaining its extension ID and existing settings.
- Added five novel reading themes: warm paper, pale green, clean gray, parchment, and night.
- Added immediate theme switching through sidebar preview cards, without overwriting sizing settings or unsaved edits.
- Added novel typography with two-character indentation, spacious line height, and simplified chapter headings.
- Preserved existing full-width-space indentation and Markdown source maps when switching themes.
- Kept explicit high-contrast editor colors, non-wrapping tables, and readable white print output.
- Updated the sidebar and Marketplace branding with book icons.

## 0.2.0 - 2026-10-10

- Added a Vue Markdown sidebar with font-size and table-row-height controls, Apply, and Reset.
- Added persistent user/workspace/folder settings and automatic preview refresh.
- Reduced the default preview font size to 14px and scaled headings and code with it.
- Kept table text and inline code on one line, with horizontal scrolling for wide tables.
- Set the default minimum table row height to 36px and made it configurable.
- Added local extension code for settings; no telemetry or network access.
- Fixed white gutters in dark previews and conflicting built-in heading/table borders.
- Made native sidebar controls follow the VS Code theme even when the system theme differs.

## 0.1.2 - 2026-08-05

- Added author, repository, homepage, and issue tracker metadata.
- Excluded development-only Git files from the packaged extension.

## 0.1.1 - 2026-08-05

- Added a dedicated Vue Markdown extension icon for the VS Code Marketplace.

## 0.1.0 - 2026-08-05

- Initial release.
- Added Vue and VitePress inspired Markdown preview styling.
- Added light, dark, high-contrast, responsive, print, and reduced-motion support.
