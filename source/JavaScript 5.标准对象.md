# 1

Q: `typeof` 操作符可以区分哪些类型？哪些类型无法区分？

A: 可以区分的：`'number'`、`'bigint'`、`'string'`、`'boolean'`、`'undefined'`、`'function'`。
无法区分：`null`、`Array`、普通对象 `{}` — 三者都返回 `'object'`。

GROUP: JavaScript 标准对象

# 2

Q: 如何判断 `null`、`Array` 和全局变量是否存在？

A: - `null`：`myVar === null`
- Array：`Array.isArray(arr)`
- 全局变量存在：`typeof window.myVar === 'undefined'`
- 函数内变量存在：`typeof myVar === 'undefined'`

GROUP: JavaScript 标准对象

# 3

Q: 什么是包装对象？为什么不推荐使用？

A: `new Number()`、`new Boolean()`、`new String()` 创建包装对象，类型变为 `'object'`：
```javascript
new Number(123) === 123;  // false
```
类型不同导致 `===` 比较失败。应使用 `parseInt()`/`Number()`/`String()` 进行纯粹的类型转换。

GROUP: JavaScript 标准对象

# 4

Q: 不加 `new` 调用 `Number()`、`Boolean()`、`String()` 时行为有何不同？

A: 作为普通函数进行**类型转换**，返回原始类型（非 object）：
- `Number('123')` → `123`（number）
- `Boolean('false')` → `true`（非空字符串全部为 true）
- `Boolean('')` → `false`
- `String(123)` → `'123'`（string）

GROUP: JavaScript 标准对象

# 5

Q: `123.toString()` 为什么报 SyntaxError？如何解决？

A: JavaScript 引擎将第一个 `.` 解析为浮点数的小数点。解决方案：
- `123..toString()` — 两个点
- `(123).toString()` — 括号包裹（推荐）
注意：`null` 和 `undefined` 没有 `toString()` 方法。

GROUP: JavaScript 标准对象

# 6

Q: Date 对象的 `getMonth()` 有什么大坑？

A: 月份返回 0~11（0=1月, 1=2月, ..., 11=12月）。`new Date(2015, 5, 19)` 创建的是 6 月 19 日。

GROUP: JavaScript 标准对象

# 7

Q: Date 有哪些常用的 getter 方法？

A: - `getFullYear()` — 年份
- `getMonth()` — 月份（0~11）
- `getDate()` — 日期（1~31）
- `getDay()` — 星期（0=Sun, 6=Sat）
- `getHours/Minutes/Seconds/Milliseconds()`
- `getTime()` — 时间戳（毫秒数）

GROUP: JavaScript 标准对象

# 8

Q: 什么是时间戳？它有什么关键特性？

A: 从 1970-01-01 00:00:00 GMT 到现在的毫秒数，自增整数。
关键特性：**时区无关**——同一时刻全球任何时区的电脑产生的时间戳都相同。所以存储/传输时只存时间戳，显示时再转换为本地时间。

GROUP: JavaScript 标准对象

# 9

Q: 创建指定时间的 Date 对象有哪三种方式？

A: 1. 构造函数（月份 0~11）：`new Date(2015, 5, 19, 20, 15, 30, 123)`
2. 时间戳：`new Date(1435146562875)`
3. Date.parse() + new Date：`Date.parse('2015-06-24T19:49:22.875+08:00')` 返回时间戳（注意字符串月份用 01~12 正常值）

GROUP: JavaScript 标准对象

# 10

Q: 正则表达式中 `\d`、`\w`、`\s`、`.` 分别匹配什么？

A: - `\d` — 一个数字
- `\w` — 一个字母、数字或下划线
- `\s` — 一个空白符（空格、Tab 等）
- `.` — 任意一个字符

GROUP: JavaScript 标准对象

# 11

Q: 正则表达式的量词 `*`、`+`、`?`、`{n}`、`{n,m}` 分别表示什么？

A: - `*` — 0 个或多个
- `+` — 至少 1 个
- `?` — 0 或 1 个
- `{n}` — 恰好 n 个
- `{n,m}` — n 到 m 个

GROUP: JavaScript 标准对象

# 12

Q: 正则表达式中 `^`、`$`、`[]`、`|`、`()` 分别有什么作用？

A: - `^` — 行的开头
- `$` — 行的结尾
- `[...]` — 字符范围（如 `[0-9a-zA-Z_]`）
- `A|B` — 匹配 A 或 B
- `( )` — 捕获分组，可用 `exec()` 提取子串

GROUP: JavaScript 标准对象

# 13

Q: JavaScript 创建正则表达式有哪两种方式？构造函数有什么注意事项？

A: 1. 字面量：`/正则表达式/`（推荐）
2. 构造函数：`new RegExp('正则表达式')`
注意：构造函数中字符串的 `\` 要双重转义，如 `new RegExp('\\d+')` 才等价于 `/\d+/`。

GROUP: JavaScript 标准对象

# 14

Q: `test()` 和 `exec()` 的区别是什么？

A: - `test(str)` — 返回 `true/false`，仅判断是否匹配
- `exec(str)` — 返回匹配结果数组 `[完整匹配, 分组1, 分组2, ...]`，失败返回 `null`
`exec()` 配合分组 `()` 可用于提取子串。

GROUP: JavaScript 标准对象

# 15

Q: 什么是贪婪匹配？如何切换为非贪婪匹配？

A: 正则默认**贪婪匹配**（尽可能多匹配），如 `/\d+/` 在 `'102300'` 中匹配整个 `'102300'`。
在量词后加 `?` 切换为非贪婪匹配：`/\d+?/` 只会匹配最少的字符。
示例：`/^(\d+?)(0*)$/.exec('102300')` → `['102300', '1023', '00']`。

GROUP: JavaScript 标准对象

# 16

Q: 正则表达式的三个标志 `g`、`i`、`m` 分别表示什么？

A: - `g`（global）：全局匹配，多次 `exec()` 依次匹配，通过 `lastIndex` 记录位置
- `i`（ignoreCase）：忽略大小写
- `m`（multiline）：多行匹配，`^` `$` 匹配每行开头结尾
注意：全局匹配不能使用 `/^...$/`，否则相当于最多匹配一次。

GROUP: JavaScript 标准对象

# 17

Q: 如何用正则表达式切分字符串？

A: `str.split(regex)` 可以按正则匹配的分隔符切分：
```javascript
'a b   c'.split(/\s+/);         // 按空白切分 → ['a', 'b', 'c']
'a,b; c  d'.split(/[\s\,\;]+/); // 同时处理空格、逗号、分号
```
比固定字符串分隔符更灵活。

GROUP: JavaScript 标准对象

# 18

Q: JSON 支持哪几种数据类型？与 JavaScript 对象有什么区别？

A: number, boolean, string, null, array, object。
关键区别：
- JSON 字符串必须用**双引号**
- JSON 的 key 必须用双引号
- JSON 字符集固定为 UTF-8
- JSON 是 JavaScript 的一个子集

GROUP: JavaScript 标准对象

# 19

Q: `JSON.stringify()` 的三个参数分别是什么作用？

A: `JSON.stringify(value, replacer?, space?)`
1. 要序列化的值
2. `replacer`：筛选键值 — 可以是属性名数组或转换函数（对每个 key-value 对）
3. `space`：美化输出的缩进（如 `'  '` 2 空格）

GROUP: JavaScript 标准对象

# 20

Q: 对象如何通过自定义方法控制 JSON 序列化输出？

A: 在对象上定义 `toJSON()` 方法，返回需要序列化的数据：
```javascript
xiaoming.toJSON = function () {
    return { Name: this.name, Age: this.age };
};
JSON.stringify(xiaoming); // 仅输出 Name 和 Age
```

GROUP: JavaScript 标准对象

# 21

Q: `JSON.parse()` 的用法和 reviver 参数是什么？

A: `JSON.parse(text, reviver?)` 将 JSON 字符串反序列化为 JavaScript 对象。
reviver 是一个函数 `(key, value) => 转换后的值`，可对每个解析出的属性做二次转换。

GROUP: JavaScript 标准对象
