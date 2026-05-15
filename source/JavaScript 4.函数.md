# 1

Q: JavaScript 定义函数有哪两种方式？它们的关系是什么？

A: 1. `function abs(x) { return x; }` — 函数声明
2. `let abs = function(x) { return x; };` — 匿名函数赋值给变量

两者完全等价。函数也是对象，函数名是指向函数对象的变量。第二种方式末尾需要加 `;`。

GROUP: JavaScript 函数

# 2

Q: JavaScript 调用函数时传入的参数个数与定义不一致会发生什么？

A: JavaScript 允许传入任意个参数：
- 多传参数：多余的被忽略，不影响调用
- 少传参数：缺失的参数值为 `undefined`，可通过 `typeof` 检查或参数默认值处理

GROUP: JavaScript 函数

# 3

Q: `arguments` 是什么？和 rest 参数有什么区别？

A: `arguments` 指向调用者传入的所有参数（类似 Array 但不是 Array），常用于判断参数个数。
rest 参数（ES6）：`function foo(a, b, ...rest)`，rest 是真正的 Array，只能写在最后，没填满时为空数组 `[]`。rest 参数是更好的替代方案。

GROUP: JavaScript 函数

# 4

Q: `return` 语句写多行时有什么大坑？

A: `return` 后直接换行会导致引擎自动在 `return` 后加 `;`，实际上变成 `return undefined;`。
解决：让 `return` 与返回值的 `{` 在同一行（`{` 表示语句未结束，不会触发自动分号）。

GROUP: JavaScript 函数

# 5

Q: 什么是变量提升（Hoisting）？

A: JavaScript 引擎会先扫描函数体，把所有 `var` 声明提升到函数顶部，但不提升赋值。
例如 `var x = 'hello ' + y; var y = 'Bob';` 实际变成 `var y; var x = 'hello ' + y; y = 'Bob';`，导致 x 拿到的是 `undefined`。
解决：用 `let` 替代 `var`。

GROUP: JavaScript 函数

# 6

Q: `var` 和 `let` 的核心区别是什么？

A: - `var`：函数作用域，有变量提升，无块级作用域
- `let`：块级作用域，无变量提升，在 `for`/`if` 等块外不可访问

始终推荐用 `let`。

GROUP: JavaScript 函数

# 7

Q: 全局作用域的变量绑定在哪里？如何避免命名冲突？

A: 全局变量绑定到全局对象 `window`（`window.foo` 等价于 `foo`）。
避免命名冲突：将所有代码放入唯一的名字空间对象中，如 `let MYAPP = {}; MYAPP.foo = ...;`（jQuery、underscore 等库的做法）。

GROUP: JavaScript 函数

# 8

Q: 解构赋值如何给已声明的变量赋值？为什么需要括号？

A: 必须用括号包裹：`({x, y} = obj);`
因为 JavaScript 引擎将 `{` 开头的语句当作代码块处理，导致 `=` 语法错误。括号消除了这种歧义。

GROUP: JavaScript 函数

# 9

Q: 对象解构赋值中，如何让变量名与属性名不同？如何使用默认值？

A: 变量名与属性名不同：`let {passport: id} = person;`（passport 不是变量，只有 id 是）。
默认值：`let {name, single = true} = person;` 属性不存在时使用默认值。

GROUP: JavaScript 函数

# 10

Q: JavaScript 中 `this` 的指向由什么决定？strict 模式和非 strict 模式有什么区别？

A: `this` 的指向取决于**调用方式**：
- `obj.method()` → this 指向 obj
- 单独调用 `fn()` → strict 模式为 `undefined`，非 strict 模式为 `window`

这是一个设计缺陷，不是由函数定义位置决定的。

GROUP: JavaScript 函数

# 11

Q: 嵌套函数中 `this` 丢失的问题如何解决？有哪些方案？

A: 解决方案：
1. `let that = this;` 在外部方法中捕获，内部函数用 `that` 替代 `this`
2. 使用箭头函数（箭头函数的 `this` 是词法作用域，自动绑定外层 `this`）

GROUP: JavaScript 函数

# 12

Q: `apply()` 和 `call()` 的区别是什么？如何使用？

A: 两者都用于手动指定函数的 `this`：
- `fn.apply(thisObj, [arg1, arg2])` — 参数以数组形式传入
- `fn.call(thisObj, arg1, arg2)` — 参数按顺序逐个传入

对普通函数调用，通常将 `this` 绑定为 `null`。

GROUP: JavaScript 函数

# 13

Q: 什么是高阶函数？

A: 可以接收另一个函数作为参数（或返回函数）的函数。
例如：`function add(x, y, f) { return f(x) + f(y); }`
这是函数式编程的基础，JavaScript 的 `map`、`reduce`、`filter`、`sort` 都是高阶函数。

GROUP: JavaScript 函数

# 14

Q: `map()` 的作用是什么？如何使用？

A: 对数组每个元素应用回调函数，返回**新数组**。
```javascript
[1, 2, 3].map(x => x * x);  // [1, 4, 9]
[1, 2, 3].map(String);      // ['1', '2', '3']
```
`map` 接收的是函数对象本身，不修改原数组。

GROUP: JavaScript 函数

# 15

Q: `reduce()` 的工作原理是什么？

A: 累积计算：`[x1, x2, x3].reduce(f) = f(f(x1, x2), x3)`
回调接收两个参数（累积结果, 当前元素），可传入第二个参数作为初始值。
```javascript
[1,3,5,7,9].reduce((x,y) => x + y);       // 25（求和）
[1,3,5,7,9].reduce((x,y) => x * 10 + y);   // 13579（拼整数）
```

GROUP: JavaScript 函数

# 16

Q: `filter()` 的作用和回调参数是什么？

A: 根据回调函数的返回值 `true`/`false` 过滤元素，返回**新数组**。
回调参数：`(element, index, self)`
去重技巧：`arr.filter((el, i, self) => self.indexOf(el) === i)`

GROUP: JavaScript 函数

# 17

Q: `sort()` 的默认排序规则有什么陷阱？如何对数字正确排序？

A: 默认将元素**转为字符串按 ASCII 码排序**，导致 `[10, 20, 1, 2]` 排成 `[1, 10, 2, 20]`。
升序：`arr.sort((x, y) => x - y);`（返回负数 → x 在前）
降序：`arr.sort((x, y) => y - x);`
注意：`sort()` **直接修改原数组**。

GROUP: JavaScript 函数

# 18

Q: `every`、`find`、`findIndex`、`forEach` 分别做什么？

A: - `every(fn)` — 是否所有元素满足条件 → `true/false`
- `find(fn)` — 查找第一个满足条件的元素 → 元素 / `undefined`
- `findIndex(fn)` — 查找第一个满足条件的索引 → 索引 / `-1`
- `forEach(fn)` — 遍历每个元素，不返回新数组（与 map 的关键区别）

GROUP: JavaScript 函数

# 19

Q: 什么是闭包（Closure）？

A: 函数返回内部函数时，内部函数"记住"了外部函数的局部变量和参数，这种结构就是闭包。
闭包 = 函数 + 它创建时的环境变量。
每次调用外部函数生成的新闭包之间互不影响（`f1 !== f2`）。

GROUP: JavaScript 函数

# 20

Q: 闭包的"循环变量陷阱"是什么？有哪三种解决方案？

A: 返回的函数引用循环变量时，不会绑定当前值，所有返回函数共享循环变量最终值。
三种解决方案：
1. IIFE 立即绑定：`(function(n) { return () => n * n; })(i)`
2. `for (let i = ...)` — let 的块级作用域让每轮循环创建新绑定
3. 最简单的：返回函数不引用循环变量

GROUP: JavaScript 函数

# 21

Q: 什么是 IIFE（立即执行匿名函数）？语法为什么需要括号？

A: IIFE = Immediately Invoked Function Expression。
语法：`(function(x) { return x * x; })(3);`
括号是必须的，因为 `function (x) { ... } (3)` 会导致语法错误（JS 引擎将 `function` 开头的当作函数声明解析）。
IIFE 用于创建独立作用域、绑定循环变量当前值。

GROUP: JavaScript 函数

# 22

Q: 闭包如何实现"私有变量"？请举例。

A: 外部函数定义局部变量，返回包含方法（内部函数）的对象，方法通过闭包访问局部变量，外部代码无法直接访问：
```javascript
function create_counter(initial) {
    let x = initial || 0;
    return { inc: () => x += 1 };
}
// x 是私有的，只能通过 inc() 修改
```

GROUP: JavaScript 函数

# 23

Q: 箭头函数和普通函数的核心区别是什么？

A: 1. 语法简洁：`x => x * x`（单表达式）或 `x => { return x*x; }`（多语句）
2. **`this` 的行为**：箭头函数的 `this` 是词法作用域，由定义时上下文确定，而非调用方式
3. `call()`/`apply()` 无法改变箭头函数的 `this`（第一个参数被忽略）
4. 不再需要 `let that = this` 的 hack 写法

GROUP: JavaScript 函数

# 24

Q: 箭头函数返回对象时需要注意什么？

A: 直接写 `x => { foo: x }` 会报错，因为 `{}` 被解析为函数体。
必须用括号包裹：`x => ({ foo: x })`。

GROUP: JavaScript 函数

# 25

Q: 什么是标签函数（Tag Function）？参数如何解析？

A: 在模板字符串前加函数名：`fn\`...\``，自动调用 `fn(strings, ...exps)`。
- `strings`：除去 `${}` 的字符串数组
- `exps`：所有 `${}` 表达式的值
常用于 SQL 安全构建、国际化翻译等场景。

GROUP: JavaScript 函数

# 26

Q: 生成器（Generator）的定义和调用方式是什么？

A: 定义：`function* foo() { yield x; return y; }`（`*` + `yield`）。
调用：直接调用仅创建 generator 对象，不执行。
- `f.next()` → `{value: ..., done: false/true}`，每次遇 `yield` 暂停
- `for (let x of generator)` → 自动迭代，done 为 true 自动停止
与普通函数的本质区别：函数一次性返回 → 生成器可多次返回并暂停。

GROUP: JavaScript 函数

# 27

Q: 生成器相比普通函数有哪两个主要优势？

A: 1. 记住执行状态：无需用对象属性手动保存状态，用生成器替"面向对象"风格的状态管理
2. 将异步回调变成"同步"写法：`r1 = yield ajax(url1); r2 = yield ajax(url2);` 消除回调地狱

GROUP: JavaScript 函数
