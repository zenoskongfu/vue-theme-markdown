# 阅境 Markdown · Reading Realm

[English](README.md) · 简体中文

在 VS Code 的内置 Markdown 预览中阅读小说，也能查看普通文档。提供五套小说阅读主题和原有的 Vue 文档主题，在侧边栏切换主题、设置字号、表格行高与页边距。

## 使用

1. 安装并启用扩展，打开一个 Markdown 文件。
2. 使用 **Markdown: Open Preview** 打开预览（macOS：`Cmd+Shift+V`；Windows/Linux：`Ctrl+Shift+V`）。
3. 点击活动栏的书本图标 **阅境 Markdown**，或运行 **阅境 Markdown: 打开阅读设置**。
4. 点击主题卡片即可保存并刷新预览。字号、表格行高与页边距可通过滑块或数字框调整，再点击 **应用设置**。设置变化会自动刷新已打开的预览。

## 阅读主题

| 主题 | 配色与字体 | 排版 |
| --- | --- | --- |
| **Vue 文档** | Vue 绿色装饰，跟随 VS Code 的深浅色主题 | 保留原有文档、代码和表格样式 |
| **暖纸** | 米色书页，宋体 | 居中章节标题，2.05 倍行距 |
| **青竹** | 晋江阅读页风格的浅绿底，宋体 | 居中章节标题，2.1 倍行距 |
| **雾白** | 番茄阅读页风格的浅灰底，黑体 | 左对齐标题，2 倍行距 |
| **古卷** | 纵横纸色选项启发的古典书页，楷体 | 居中章节标题，2.15 倍行距 |
| **墨夜** | 深灰底，柔和灰字 | 居中章节标题，2.05 倍行距 |

小说主题使用两字首行缩进、较宽的段落间距与简洁章节标题。已有全角空格的段落保留原有缩进；引用、列表、代码和表格使用各自的 Markdown 排版。字体使用本机字体，并提供回退字体，无需下载。

小说主题的配色独立于编辑器深浅色设置；**Vue 文档**仍跟随编辑器。显式高对比度主题使用编辑器的高对比度颜色，同时保留小说排版。打印使用白底和 11pt 正文。

设计参考了[晋江文学城](https://www.jjwxc.net/onebook.php?novelid=3907377&chapterid=1)、[番茄小说](https://fanqienovel.com/reader/7069952706521236001)和[纵横中文网](https://read.zongheng.com/chapter/987598/60986533.html)的公开阅读页及阅读设置。配色与样式由本扩展独立实现。

## 设置

| 设置项 | 默认值 | 范围 |
| --- | --- | --- |
| `vueGreenMarkdown.theme` | `vue` | `vue`、`paper`、`bamboo`、`clean`、`parchment`、`night` |
| `vueGreenMarkdown.fontSize` | 14px | 10–32px |
| `vueGreenMarkdown.tableRowHeight` | 36px | 24–120px |
| `vueGreenMarkdown.horizontalMarginMode` | `theme` | `theme` 沿用主题；`custom` 使用自定义值 |
| `vueGreenMarkdown.horizontalMargin` | 0px | 0–320px，支持小数；自定义模式下用于左右留白 |
| `vueGreenMarkdown.verticalMarginMode` | `theme` | `theme` 沿用主题；`custom` 使用自定义值 |
| `vueGreenMarkdown.verticalMargin` | 0px | 0–320px，支持小数；自定义模式下用于上下留白 |

例如，为小说启用暖纸主题：

```json
{
  "vueGreenMarkdown.theme": "paper",
  "vueGreenMarkdown.fontSize": 16,
  "vueGreenMarkdown.tableRowHeight": 32,
  "vueGreenMarkdown.horizontalMarginMode": "custom",
  "vueGreenMarkdown.horizontalMargin": 96,
  "vueGreenMarkdown.verticalMarginMode": "custom",
  "vueGreenMarkdown.verticalMargin": 48
}
```

标题与代码字号按正文设置缩放。正文不再有最大宽度限制，随预览窗口铺开。页边距单位为 px；选择“主题默认”沿用各主题的留白，选择“自定义”后 `0` 表示真正的零留白。自定义左右边距在窄预览窗口中最多占窗口宽度的 10%，避免挤出正文。页边距仅影响屏幕预览，不改变打印布局。0.3.1 中已有的设置在未选择新模式时保持旧含义：`0` 仍表示主题默认，大于 `0` 的值继续作为自定义边距；在侧边栏点击“应用设置”会保存明确的模式。切换主题保留字号、行高与页边距，也保留侧边栏中尚未应用的修改。**恢复默认**恢复 Vue 文档主题、14px 正文、36px 表格行高和主题默认页边距。

表格文字与行内代码不自动换行，宽表格可横向滚动。行高是最小高度；显式 `<br>` 换行、图片或较高内容仍会撑高行。

设置支持用户、工作区和文件夹范围。侧边栏跟随最近激活的 Markdown 文件，并显示保存位置；任意一项已有工作区或文件夹设置时，侧边栏在最具体的已有范围保存，否则保存到用户设置。每个预览按自己的文件读取设置。

## 升级与兼容

原 **Vue Green Markdown Preview** 更名为 **阅境 Markdown**。扩展 ID `zenoschen.vue-theme-markdown` 与设置项前缀 `vueGreenMarkdown` 保持兼容，现有用户可以直接升级并保留设置。未配置新主题时继续使用 Vue 文档主题。

扩展作用于 VS Code 内置 Markdown 预览；其他扩展同时贡献预览样式时，最终样式可能受加载顺序影响。

## 自定义块

保留 `.custom-block.tip`、`.custom-block.warning`、`.custom-block.danger`、`.custom-block.info` 和 `.markdown-alert` 等样式。自定义语法的 HTML 渲染仍由相应 Markdown 扩展提供。

## 隐私

所有主题与控制逻辑均在本地运行。扩展保存 VS Code 配置并刷新预览，不收集数据、不发起网络请求，也不修改 Markdown 文件内容。

## 开发

运行 `npm ci` 安装开发依赖。

- `npm test`：设置校验、配置范围、Markdown 渲染与侧边栏保存测试。
- `npm run test:layout`：Chrome 中验证小说主题、深浅色与高对比度、窄窗口、表格、打印和侧边栏交互。Chrome 不在 macOS 默认位置时，设置 `CHROME_EXECUTABLE`。
- `npm run test:integration`：在独立的 VS Code 测试配置中验证激活、主题、字号与页边距设置、持久化和预览。可设置 `VSCODE_EXECUTABLE`、`VSCODE_TEST_DATA_DIR` 和 `VSCODE_TEST_LOCALE` 指定程序、临时数据路径及界面语言。
- `npm run package`：生成 VSIX。

## 许可证

MIT，详见随扩展提供的 `LICENSE`。
