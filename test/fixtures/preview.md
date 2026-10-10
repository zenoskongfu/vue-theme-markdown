# Vue Markdown 阅读示例

字号更小，标题、正文和代码按比例缩放。The sidebar controls font size and table row height.

## 不换行的表格

| 名称 | 一段很长的说明文字 | 行内代码 |
| --- | --- | --- |
| 中文内容 | 这是用于验证不自动换行的很长很长的中文说明，即使在窄窗口中也保持一行显示。 | `a long inline code value with spaces` |
| 第二行 | Another long table value that should stay on one line in a narrow preview. | `fontSize: 14` |
| 手动换行 | 第一行<br>第二行 | `tableRowHeight: 36` |

正文仍可正常换行：这是一段比较长的中文说明文字，用于确保只限制表格内容换行，并且文档在不同宽度下仍然便于阅读。ABCDEFGHIJKLMNOPQRSTUVWXYZ

```javascript
const settings = { fontSize: 14, tableRowHeight: 36 };
console.log(settings);
```

> 调整侧边栏中的字号和行高，点击“应用设置”，已打开的预览会更新。

- 标题使用绿色主题装饰
- 默认正文字号为 14px
- 默认表格行高为 36px
