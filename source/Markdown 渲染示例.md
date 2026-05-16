# 1

Q: Markdown 有哪些**强调**语法？

A: - **粗体**：`**文本**` 或 `__文本__`
- *斜体*：`*文本*` 或 `_文本_`
- ***粗斜体***：`***文本***`
- ~~删除线~~：`~~文本~~`

GROUP: Markdown 示例

# 2

Q: 如何在写代码时使用 `console.log()` 调试？

A: 使用**内联代码**语法包裹代码片段：
- 打印变量：`` `console.log(变量)` ``
- 打印多个值：`` `console.log(a, b)` ``

单行代码用**反引号**包裹，多行代码用**三个反引号**包裹。

GROUP: Markdown 示例

# 3

Q: 下面代码块的输出是什么？
```js
const arr = [1, 2, 3];
const doubled = arr.map(x => x * 2);
console.log(doubled);
```

A: 输出 `[2, 4, 6]`

`map()` 方法对数组中**每个元素**调用函数，返回新数组，***不修改原数组***。

GROUP: Markdown 示例

# 4

Q: JavaScript 的基本数据类型有哪些？

A: | 类型 | 示例 | 说明 |
|------|------|------|
| Number | `42`, `3.14` | 不区分整数/浮点 |
| String | `'hello'` | 单引号或双引号 |
| Boolean | `true`, `false` | 逻辑值 |
| null | `null` | 空值 |
| undefined | `undefined` | 未定义 |

> 注意：`typeof null` 返回 `"object"`，这是 JavaScript 的历史遗留 bug。

GROUP: Markdown 示例

# 5

Q: Git 提交代码的标准流程是什么？

A: 1. `git add .` — 暂存所有修改
2. `git commit -m "提交信息"` — 创建提交
3. `git push` — 推送到远程仓库

> 提示：提交前先用 `git status` 查看当前状态，用 `git diff` 查看具体改动。

GROUP: Markdown 示例

# 6

Q: HTML、CSS、JavaScript 三者分别负责什么？

A: ### HTML
负责页面的**结构**和**内容**。

### CSS
负责页面的**样式**和**布局**。

### JavaScript
负责页面的**交互**和**逻辑**。

---
三者共同构成前端开发的**三大基石**。

GROUP: Markdown 示例
