# 1

Q: JavaScript 有哪两种引入 HTML 的方式？

A: 1. 内嵌：`<script>...</script>` 直接写在 HTML 中
2. 外部文件：`<script src="xxx.js"></script>` 引入独立的 .js 文件（推荐）

GROUP: JavaScript 快速入门

# 2

Q: Chrome 开发者工具的 Console 面板有什么用？

A: 可以直接输入 JavaScript 代码并执行；使用 `console.log(变量)` 查看变量内容，比 `alert()` 更便捷。

GROUP: JavaScript 快速入门

# 3

Q: JavaScript 的基本语法规则是什么？

A: - 每个语句以 `;` 结束（强烈建议始终加分号）
- 语句块用 `{...}` 包裹，缩进 4 空格
- 注释：`//` 行注释，`/* */` 块注释
- 严格区分大小写

GROUP: JavaScript 快速入门

# 4

Q: JavaScript 有哪些基本数据类型？

A: - Number（不区分整数/浮点）
- BigInt（超大整数，后缀 `n`）
- String（`''` 或 `""`）
- Boolean（`true` / `false`）
- null（空值）
- undefined（未定义）
- Object（对象、数组等引用类型）

GROUP: JavaScript 快速入门

# 5

Q: `NaN` 是什么？如何判断一个值是不是 `NaN`？

A: NaN 表示 Not a Number，当无法计算结果时返回。
特点：`NaN === NaN` 为 `false`（与任何值都不相等，包括自身）。
唯一判断方式：`isNaN(NaN)` → `true`。

GROUP: JavaScript 快速入门

# 6

Q: `==` 和 `===` 的区别是什么？应该用哪个？

A: `==` 会自动转换数据类型再比较（会得到诡异结果）。
`===` 严格比较，类型不同直接返回 false。
始终坚持使用 `===`。

GROUP: JavaScript 快速入门

# 7

Q: 如何正确比较两个浮点数是否相等？

A: 浮点数运算有精度误差，不能直接用 `===`。
应计算差值绝对值，看是否小于阈值：
`Math.abs(a - b) < 0.0000001`

GROUP: JavaScript 快速入门

# 8

Q: `null` 和 `undefined` 有什么区别？

A: `null` 表示"空值"，是一个已赋值的空。
`undefined` 表示"未定义"，变量声明但未赋值时的默认值。
大多数情况下应使用 `null`，`undefined` 仅在判断函数参数是否传递时有用。

GROUP: JavaScript 快速入门

# 9

Q: 什么是 strict 模式？如何启用？

A: strict 模式强制用 `var`/`let` 声明变量，未声明就使用会报错（解决变量自动变全局的设计缺陷）。
启用：在 JavaScript 代码第一行写 `'use strict';`。

GROUP: JavaScript 快速入门

# 10

Q: JavaScript 是动态语言还是静态语言？有什么特点？

A: 动态语言。变量本身类型不固定，同一个变量可以反复赋值为不同类型。
```javascript
var a = 123;  // Number
a = 'ABC';    // 变为 String
```
静态语言（如 Java）必须在定义时指定类型，类型不匹配会报错。

GROUP: JavaScript 快速入门

# 11

Q: ES6 模板字符串怎么写？有什么优点？

A: 使用反引号 `` ` `` 包裹，变量用 `${变量名}` 嵌入：
```javascript
let msg = `你好, ${name}, 你今年${age}岁了!`;
```
优点：不需要用 `+` 拼接，支持多行，比传统字符串拼接更简洁。

GROUP: JavaScript 快速入门

# 12

Q: 字符串有哪些常用方法？

A: - `s.length` — 获取长度
- `s[i]` — 索引访问字符（只读，赋值无效）
- `toUpperCase()` / `toLowerCase()` — 大小写转换（返回新串）
- `indexOf(str)` — 查找子串位置，未找到返回 -1
- `substring(a, b)` — 截取 [a, b)，省略 b 截到末尾

字符串是不可变的，所有方法返回新字符串。

GROUP: JavaScript 快速入门

# 13

Q: 数组的 `push`/`pop` 和 `unshift`/`shift` 分别操作哪一端？返回值是什么？

A: - `push(...)` / `pop()` — 操作末尾。push 返回新长度，pop 返回被删元素
- `unshift(...)` / `shift()` — 操作头部。unshift 返回新长度，shift 返回被删元素
- 空数组 pop/shift 不会报错，返回 `undefined`

GROUP: JavaScript 快速入门

# 14

Q: `slice` 和 `splice` 的区别是什么？

A: - `slice(a, b)` — 截取 [a, b)，返回新数组，**不修改**原数组。`arr.slice()` 可复制数组
- `splice(i, n, ...)` — 从索引 i 删除 n 个元素，再插入新元素，**直接修改**原数组，返回被删元素数组

GROUP: JavaScript 快速入门

# 15

Q: 数组的 `concat` 和 `join` 分别做什么？

A: - `concat(arr2)` — 连接两个数组，返回新数组，不修改原数组。可接收多个参数
- `join(sep)` — 用指定分隔符将数组元素连成字符串，返回字符串，不修改原数组

GROUP: JavaScript 快速入门

# 16

Q: JavaScript 对象如何访问属性？属性名含特殊字符时怎么办？

A: 标准属性名用 `.` 操作符：`obj.name`
属性名含特殊字符（如 `middle-school`）必须用 `[]`：`obj['middle-school']`
对象所有属性名本质都是字符串，值可以是任意类型。

GROUP: JavaScript 快速入门

# 17

Q: 如何检测对象是否拥有某个属性？`in` 和 `hasOwnProperty` 的区别？

A: `'prop' in obj` — 检查属性是否存在（含继承的属性，如 `toString`）
`obj.hasOwnProperty('prop')` — 只检查对象**自身**拥有的属性，不包含继承的

GROUP: JavaScript 快速入门

# 18

Q: JavaScript 对象可以动态增删属性吗？如何操作？

A: 可以，对象是动态类型。
- 添加/修改：`obj.age = 18;`
- 删除：`delete obj.age;`
- 访问不存在的属性返回 `undefined`，不报错
- 删除不存在的属性也不报错

GROUP: JavaScript 快速入门

# 19

Q: JavaScript 中哪些值在条件判断中视为 `false`（Falsy 值）？

A: 6 个 Falsy 值：
- `null`
- `undefined`
- `0`
- `NaN`
- `''`（空字符串）
- `false`

其余所有值一律视为 `true`。

GROUP: JavaScript 快速入门

# 20

Q: `if...else if...else` 的执行逻辑是什么？

A: 二选一逻辑，从上到下依次判断条件：
- 某一条件为 `true` → 执行对应语句块 → 跳过后续所有判断
- 全部条件为 `false` → 执行 `else` 语句块
条件判断的**顺序非常重要**，应先判断范围更小的条件。

GROUP: JavaScript 快速入门

# 21

Q: `for` 循环的三个条件分别是什么？可以省略吗？

A: 三个条件：
1. 初始条件（如 `i=1`）— 循环开始前执行一次
2. 判断条件（如 `i<=100`）— 每次循环前判断
3. 递增条件（如 `i++`）— 每次循环后执行

三个条件都可以省略，但省略判断条件必须用 `break` 退出，否则死循环。

GROUP: JavaScript 快速入门

# 22

Q: `for...in` 和 `for...of` 有什么区别？遍历数组时应该用哪个？

A: - `for...in` 遍历对象的**属性名**（数组索引是 String 类型），会遍历到额外添加的属性
- `for...of`（ES6）只遍历集合的**元素值**，不受额外属性影响
遍历数组推荐用 `for...of`。

GROUP: JavaScript 快速入门

# 23

Q: `while` 和 `do...while` 的关键区别是什么？

A: - `while`：先判断条件，再执行循环体（可能一次都不执行）
- `do...while`：先执行循环体，再判断条件（**至少执行一次**）

GROUP: JavaScript 快速入门

# 24

Q: `Map` 和普通对象 `{}` 相比有什么优势？

A: 普通对象的键只能是字符串，Map 的键可以是任意数据类型（Number、Object 等）。
Map 方法：
- `set(key, value)` — 添加
- `get(key)` — 获取
- `has(key)` — 判断是否存在
- `delete(key)` — 删除

GROUP: JavaScript 快速入门

# 25

Q: `Set` 是什么？有什么特点？

A: Set 是一组 key 的集合（不存储 value），**key 不能重复**，自动去重。
```javascript
new Set([1, 2, 3, 3, '3']); // {1, 2, 3, "3"}
```
方法：`add(key)`、`delete(key)`、`has(key)`。

GROUP: JavaScript 快速入门

# 26

Q: `Array`、`Map`、`Set` 的 `forEach` 回调参数分别是什么？

A: - Array：`(element, index, array)`
- Set：`(element, sameElement, set)` — 没有索引，前两个参数相同
- Map：`(value, key, map)` — 注意是 value 在前，key 在后

GROUP: JavaScript 快速入门

# 27

Q: JavaScript 的 Number 类型的整数范围有什么限制？

A: Number 整数最大范围是 ±2⁵³（不是 ±2⁶³），超出此范围会无法精确表示。
超大整数应用 BigInt 类型（后缀 `n`，如 `9223372036854775808n`），BigInt 和 Number 不能混合运算。

GROUP: JavaScript 快速入门

# 28

Q: `&&`、`||`、`!` 三种布尔运算符的规则是什么？

A: - `&&`（与）：全 true 才 true，遇 false 短路
- `||`（或）：有一个 true 即 true，遇 true 短路
- `!`（非）：单目运算符，true ↔ false 取反

GROUP: JavaScript 快速入门
