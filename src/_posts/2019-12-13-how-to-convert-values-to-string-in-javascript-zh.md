---
category: Development
tags:
  - js
title: '如何将 Javascript 的值转换为字符串'
description: '如何将 Javascript 的值转换为字符串'
date: 2019-12-13
vssue-title: '如何将 Javascript 的值转换为字符串'
---

将 JS 的原始类型 (primitive type) 转换成字符串是一个很常用的操作，在 TS 中可能更是如此，因为你可能需要保证某个值一定是字符串类型。

这篇文章就来讨论一下如何将一个值转换为字符串。

<!-- more -->

## 常用方法

我们有几种常用的方法来将 `value` 转换为字符串：

```js
const emptyStringMethod = value => value + '';
const stringMethod = value => String(value);
const templateMethod = value => `${value}`;
const toStringMethod = value => value.toString();
const concatMethod = value => ''.concat(value);
```

1. 拼接一个空字符串： `value => value + ''`
    - 一种有效的方法，但是语义并不明确，代码可读性较差。

2. 使用 `String()` 函数： `value => String(value)`
    - 可以明确表达代码的目的：将这个值转换成字符串。
    - 是 [Airbnb JavaScript Style Guide](https://airbnb.io/javascript/#coercion--strings) 中推荐使用的方法。

3. 使用字符串模板： `` value => `${value}` ``
    - 比 #1 更可读，但不如 #2。
    - ES6 语法。

4. 调用 `toString()` 方法： `value => value.toString()`
    - 如果 `value` 是 `null` 或者 `undefined` 时无法使用。
    - 不能保证返回值一定是字符串，因为这个方法可能被用户重写。

5. 在一个空字符串上调用 `concat()` 方法： `value => ''.concat(value)`
    - 实际上（我认为）这不是一种常用的方法。
    - 如果你开启了 Babel 的 es2015 preset， Babel 会将 #3 转译成这种方法，所以我们也把这种方式考虑在内。

## 在代码中测试

说了这么多，还是直接在代码里测试一下这些方法吧。

这里我们使用 JS 的 原始类型 和一些内置的对象进行测试。

```js
const undefinedValue = undefined;
const nullValue = null;
const numberValue = 233;
const bigintValue = 233333n;
const stringValue = 'string';
const booleanValue = true;
const objectValue = {};
const functionValue = () => {};
const arrayValue = ['a', 'r', 'r', 'a', 'y'];
const dateValue = new Date();
const mapValue = new Map();
const setValue = new Set();
const symbolValue = Symbol();
```

### 兼容性

分为将每种方法在各个类型上使用，比较一下结果。

|           | `value + ''`       | `String(value)`    | `` `${value}` ``   | `value.toString()` | `''.concat(value)` |
|-----------|--------------------|--------------------|--------------------|--------------------|--------------------|
| undefined | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :x:                | :heavy_check_mark: |
| null      | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :x:                | :heavy_check_mark: |
| number    | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| bigint    | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| string    | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| boolean   | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| object    | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| function  | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| array     | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| date      | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| map       | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| set       | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| symbol    | :x:                | :heavy_check_mark: | :x:                | :heavy_check_mark: | :x:                |

::: details 点击查看结果
```js
// value => value + ''
undefinedValue // undefined
nullValue // null
numberValue // 233
bigintValue // 233333
stringValue // string
booleanValue // true
objectValue // [object Object]
functionValue // () => {}
arrayValue // a,r,r,a,y
dateValue // Thu Dec 12 2019 15:15:05 GMT+0800 (China Standard Time)
mapValue // [object Map]
setValue // [object Set]
symbolValue // TypeError : Cannot convert a Symbol value to a string

// value => String(value)
undefinedValue // undefined
nullValue // null
numberValue // 233
bigintValue // 233333
stringValue // string
booleanValue // true
objectValue // [object Object]
functionValue // () => {}
arrayValue // a,r,r,a,y
dateValue // Thu Dec 12 2019 15:15:05 GMT+0800 (China Standard Time)
mapValue // [object Map]
setValue // [object Set]
symbolValue // Symbol()

// value => `${value}`
undefinedValue // undefined
nullValue // null
numberValue // 233
bigintValue // 233333
stringValue // string
booleanValue // true
objectValue // [object Object]
functionValue // () => {}
arrayValue // a,r,r,a,y
dateValue // Thu Dec 12 2019 15:15:05 GMT+0800 (China Standard Time)
mapValue // [object Map]
setValue // [object Set]
symbolValue // TypeError : Cannot convert a Symbol value to a string

// value => value.toString()
undefinedValue // TypeError : Cannot read property 'toString' of undefined
nullValue // TypeError : Cannot read property 'toString' of null
numberValue // 233
bigintValue // 233333
stringValue // string
booleanValue // true
objectValue // [object Object]
functionValue // () => {}
arrayValue // a,r,r,a,y
dateValue // Thu Dec 12 2019 15:15:05 GMT+0800 (China Standard Time)
mapValue // [object Map]
setValue // [object Set]
symbolValue // Symbol()
```
:::

### 性能

对于每个类型，将每种方法在 for 循环中调用 10,000,000 次，使用 `console.time()` / `console.timeEnd()` 来测试他们的性能。

|           | `value + ''`       | `String(value)`    | `` `${value}` ``   | `value.toString()` | `''.concat(value)` |
|-----------|--------------------|--------------------|--------------------|--------------------|--------------------|
| undefined | :trophy:           |                    | :heavy_check_mark: | :x:                |                    |
| null      | :heavy_check_mark: |                    | :trophy:           | :x:                |                    |
| number    | :heavy_check_mark: |                    | :trophy:           |                    |                    |
| bigint    | :heavy_check_mark: | :heavy_check_mark: | :trophy:           | :heavy_check_mark: | :heavy_check_mark: |
| string    | :heavy_check_mark: |                    | :trophy:           |                    |                    |
| boolean   | :heavy_check_mark: |                    | :trophy:           |                    |                    |
| object    |                    |                    |                    | :trophy:           |                    |
| function  |                    |                    |                    | :trophy:           |                    |
| array     |                    |                    |                    | :trophy:           |                    |
| date      |                    |                    |                    | :trophy:           |                    |
| map       |                    |                    |                    | :trophy:           |                    |
| set       |                    |                    |                    | :trophy:           |                    |
| symbol    | :x:                | :trophy:           | :x:                | :heavy_check_mark: | :x:                |

::: details 点击查看 CentOS 7 + Node v10.16.0 的运行结果
```js
// undefinedValue
value => value + '' // undefinedValue: 58.000ms
value => String(value) // undefinedValue: 232.600ms
value => `${value}` // undefinedValue: 70.451ms
value => value.toString() // TypeError : Cannot read property 'toString' of undefined
value => ''.concat(value) // undefinedValue: 262.118ms
combinedMethod // undefinedValue: 77.594ms
value => value // undefinedValue: 56.058ms

// nullValue
value => value + '' // nullValue: 94.229ms
value => String(value) // nullValue: 230.025ms
value => `${value}` // nullValue: 73.234ms
value => value.toString() // TypeError : Cannot read property 'toString' of null
value => ''.concat(value) // nullValue: 252.326ms
combinedMethod // nullValue: 63.787ms
value => value // nullValue: 57.017ms

// numberValue
value => value + '' // numberValue: 87.574ms
value => String(value) // numberValue: 217.538ms
value => `${value}` // numberValue: 74.305ms
value => value.toString() // numberValue: 2420.441ms
value => ''.concat(value) // numberValue: 243.225ms
combinedMethod // numberValue: 100.762ms
value => value // numberValue: 56.982ms

// bigintValue
value => value + '' // bigintValue: 1245.823ms
value => String(value) // bigintValue: 1278.527ms
value => `${value}` // bigintValue: 1217.750ms
value => value.toString() // bigintValue: 1327.024ms
value => ''.concat(value) // bigintValue: 1686.117ms
combinedMethod // bigintValue: 1303.342ms
value => value // bigintValue: 56.561ms

// stringValue
value => value + '' // stringValue: 78.080ms
value => String(value) // stringValue: 221.387ms
value => `${value}` // stringValue: 71.038ms
value => value.toString() // stringValue: 228.160ms
value => ''.concat(value) // stringValue: 228.169ms
combinedMethod // stringValue: 66.930ms
value => value // stringValue: 56.783ms

// booleanValue
value => value + '' // booleanValue: 84.989ms
value => String(value) // booleanValue: 228.475ms
value => `${value}` // booleanValue: 72.270ms
value => value.toString() // booleanValue: 215.083ms
value => ''.concat(value) // booleanValue: 250.289ms
combinedMethod // booleanValue: 104.924ms
value => value // booleanValue: 56.512ms

// objectValue
value => value + '' // objectValue: 688.530ms
value => String(value) // objectValue: 1379.448ms
value => `${value}` // objectValue: 1214.434ms
value => value.toString() // objectValue: 284.757ms
value => ''.concat(value) // objectValue: 1398.605ms
combinedMethod // objectValue: 329.529ms
value => value // objectValue: 61.880ms

// functionValue
value => value + '' // functionValue: 2176.381ms
value => String(value) // functionValue: 2680.691ms
value => `${value}` // functionValue: 2161.740ms
value => value.toString() // functionValue: 971.473ms
value => ''.concat(value) // functionValue: 2258.815ms
combinedMethod // functionValue: 2230.455ms
value => value // functionValue: 56.556ms

// arrayValue
value => value + '' // arrayValue: 3382.521ms
value => String(value) // arrayValue: 3953.702ms
value => `${value}` // arrayValue: 3865.723ms
value => value.toString() // arrayValue: 2459.709ms
value => ''.concat(value) // arrayValue: 4036.602ms
combinedMethod // arrayValue: 2820.734ms
value => value // arrayValue: 75.712ms

// dateValue
value => value + '' // dateValue: 9790.499ms
value => String(value) // dateValue: 11019.162ms
value => `${value}` // dateValue: 10812.841ms
value => value.toString() // dateValue: 9147.117ms
value => ''.concat(value) // dateValue: 10822.232ms
combinedMethod // dateValue: 8531.814ms
value => value // dateValue: 56.917ms

// mapValue
value => value + '' // mapValue: 1481.131ms
value => String(value) // mapValue: 2131.177ms
value => `${value}` // mapValue: 1990.044ms
value => value.toString() // mapValue: 749.332ms
value => ''.concat(value) // mapValue: 2187.658ms
combinedMethod // mapValue: 801.426ms
value => value // mapValue: 56.688ms

// setValue
value => value + '' // setValue: 1473.784ms
value => String(value) // setValue: 2149.367ms
value => `${value}` // setValue: 1952.415ms
value => value.toString() // setValue: 746.106ms
value => ''.concat(value) // setValue: 2161.314ms
combinedMethod // setValue: 786.448ms
value => value // setValue: 56.538ms

// symbolValue
value => value + '' // TypeError : Cannot convert a Symbol value to a string
value => String(value) // symbolValue: 839.981ms
value => `${value}` // TypeError : Cannot convert a Symbol value to a string
value => value.toString() // symbolValue: 957.605ms
value => ''.concat(value) // TypeError : Cannot convert a Symbol value to a string
combinedMethod // symbolValue: 857.334ms
value => value // symbolValue: 56.601ms
```
:::

::: details 点击查看 Windows 10 + Chrome v75.0.3770.100 的运行结果
```js
// undefinedValue
value => value + '' // undefinedValue: 102.10693359375ms
value => String(value) // undefinedValue: 402.427001953125ms
value => `${value}` // undefinedValue: 250.614990234375ms
value => value.toString() // TypeError : Cannot read property 'toString' of undefined
value => ''.concat(value) // undefinedValue: 423.710693359375ms
combinedMethod // undefinedValue: 176.237060546875ms
value => value // undefinedValue: 177.76611328125ms

// nullValue
value => value + '' // nullValue: 268.691162109375ms
value => String(value) // nullValue: 377.067138671875ms
value => `${value}` // nullValue: 244.4580078125ms
value => value.toString() // TypeError : Cannot read property 'toString' of null
value => ''.concat(value) // nullValue: 424.60302734375ms
combinedMethod // nullValue: 170.494140625ms
value => value // nullValue: 168.5390625ms

// numberValue
value => value + '' // numberValue: 244.487060546875ms
value => String(value) // numberValue: 413.4501953125ms
value => `${value}` // numberValue: 245.074951171875ms
value => value.toString() // numberValue: 2864.587890625ms
value => ''.concat(value) // numberValue: 409.827880859375ms
combinedMethod // numberValue: 294.450927734375ms
value => value // numberValue: 174.172119140625ms

// bigintValue
value => value + '' // bigintValue: 1171.18603515625ms
value => String(value) // bigintValue: 1376.6689453125ms
value => `${value}` // bigintValue: 1148.179931640625ms
value => value.toString() // bigintValue: 1441.513916015625ms
value => ''.concat(value) // bigintValue: 1381.7021484375ms
combinedMethod // bigintValue: 1159.9140625ms
value => value // bigintValue: 180.094970703125ms

// stringValue
value => value + '' // stringValue: 271.109130859375ms
value => String(value) // stringValue: 385.6826171875ms
value => `${value}` // stringValue: 237.927001953125ms
value => value.toString() // stringValue: 402.6689453125ms
value => ''.concat(value) // stringValue: 388.739990234375ms
combinedMethod // stringValue: 181.837158203125ms
value => value // stringValue: 163.588134765625ms

// booleanValue
value => value + '' // booleanValue: 247.594970703125ms
value => String(value) // booleanValue: 399.536865234375ms
value => `${value}` // booleanValue: 247.7919921875ms
value => value.toString() // booleanValue: 407.852294921875ms
value => ''.concat(value) // booleanValue: 404.489990234375ms
combinedMethod // booleanValue: 298.165771484375ms
value => value // booleanValue: 178.60400390625ms

// objectValue
value => value + '' // objectValue: 970.120849609375ms
value => String(value) // objectValue: 728.369140625ms
value => `${value}` // objectValue: 616.529052734375ms
value => value.toString() // objectValue: 405.568115234375ms
value => ''.concat(value) // objectValue: 747.236083984375ms
combinedMethod // objectValue: 433.838134765625ms
value => value // objectValue: 178.79296875ms

// functionValue
value => value + '' // functionValue: 1950.94091796875ms
value => String(value) // functionValue: 1747.811767578125ms
value => `${value}` // functionValue: 1664.344970703125ms
value => value.toString() // functionValue: 1272.31201171875ms
value => ''.concat(value) // functionValue: 1872.4521484375ms
combinedMethod // functionValue: 1652.277099609375ms
value => value // functionValue: 164.71923828125ms

// arrayValue
value => value + '' // arrayValue: 3498.611083984375ms
value => String(value) // arrayValue: 3287.943115234375ms
value => `${value}` // arrayValue: 3145.638916015625ms
value => value.toString() // arrayValue: 2741.306884765625ms
value => ''.concat(value) // arrayValue: 3386.108154296875ms
combinedMethod // arrayValue: 2683.225830078125ms
value => value // arrayValue: 179.222900390625ms

// dateValue
value => value + '' // dateValue: 18721.93408203125ms
value => String(value) // dateValue: 19385.274169921875ms
value => `${value}` // dateValue: 18611.85205078125ms
value => value.toString() // dateValue: 18062.15625ms
value => ''.concat(value) // dateValue: 19092.984130859375ms
combinedMethod // dateValue: 17983.06103515625ms
value => value // dateValue: 179.385009765625ms

// mapValue
value => value + '' // mapValue: 1548.31982421875ms
value => String(value) // mapValue: 1383.64306640625ms
value => `${value}` // mapValue: 1066.041015625ms
value => value.toString() // mapValue: 814.724853515625ms
value => ''.concat(value) // mapValue: 1321.1689453125ms
combinedMethod // mapValue: 824.772216796875ms
value => value // mapValue: 165.73486328125ms

// setValue
value => value + '' // setValue: 1562.81884765625ms
value => String(value) // setValue: 1275.81787109375ms
value => `${value}` // setValue: 1101.871826171875ms
value => value.toString() // setValue: 799.289794921875ms
value => ''.concat(value) // setValue: 1215.7021484375ms
combinedMethod // setValue: 863.14599609375ms
value => value // setValue: 173.0078125ms

// symbolValue
value => value + '' // TypeError : Cannot convert a Symbol value to a string
value => String(value) // symbolValue: 969.258056640625ms
value => `${value}` // TypeError : Cannot convert a Symbol value to a string
value => value.toString() // symbolValue: 982.421875ms
value => ''.concat(value) // TypeError : Cannot convert a Symbol value to a string
combinedMethod // symbolValue: 992.149169921875ms
value => value // symbolValue: 165.337158203125ms
```
:::

## 结论

- 想要使用最少的代码，并且使用语义明确的代码风格：
  - 使用 `String()`.
- 想要得到最好的性能，但你的代码要转译成 ES5 ：
  - 字符串：直接返回它本身
  - `null`：直接返回 `'null'` 或 `''`
  - Symbols：使用 `String()`
  - Objects: 使用 `toString()`
  - 其他原始类型：使用 `value + ''`
- 想要得到最好的性能，且直接使用 ES6 (即上面的性能结果中的 `combinedMethod`):
  - 字符串：直接返回它本身
  - `null`：直接返回 `'null'` 或 `''`
  - `undefined`：直接返回 `'undefined'` 或 `''`
  - Symbols：使用 `String()`
  - Objects: 使用 `toString()`
  - 其他原始类型：使用 `` `${value}` ``

::: tip
需要注意的是，你的判断条件越多，也同样会花费更多的时间。所以你可以根据你的实际使用情况下减少一些判断条件。

我们这里得到的结论并不一定是最佳的，你可以参考一些工具库的实现方法。例如， lodash 的 [_.toString()](https://github.com/lodash/lodash/blob/cefddab1cab49189b2ff4d72acf8df7ec723dc22/toString.js) 方法就和我们的结论有些区别，并且它们还考虑了更多边界情况。
:::

## 深入挖掘

这里我们只讨论 `value + ''`, `String(value)` 和字符串模板。

**将一个值转换为字符串的时候发生了什么？**

这三种方法都会使用 JS 的 [***内部 ToString 操作***](https://www.ecma-international.org/ecma-262/10.0/index.html#sec-tostring)：

| 类型          | 结果                                                                                                                           |
|---------------|--------------------------------------------------------------------------------------------------------------------------------|
| Undefined     | 返回 `'undefined'` 。                                                                                                          |
| Null          | 返回 `'null'` 。                                                                                                               |
| Boolean       | 返回 `'true'` 或 `'false'`.                                                                                                    |
| Number        | 使用 ***内部 NumberToString 操作*** (lodash 中的一些边界情况就来自此处，我们这里不讨论这个操作) 。                                 |
| String        | 返回它本身。                                                                                                                   |
| Symbol        | 抛出一个 TypeError 异常。                                                                                                      |
| Object        | 使用 ***内部 ToPrimitive 操作*** 将它转换为一个原始值，然后再对该原始值使用 ***内部 ToString 操作***。                            |

**为什么对 Symbols 使用 `String()` 不会导致 TypeError ？**

> 参考 [ECMAScript Specification](https://www.ecma-international.org/ecma-262/10.0/index.html#sec-string-constructor-string-value)

简单来讲， `String()` 做的事情是：

- If `value` 是 Symbol ，使用 ***内部 SymbolDescriptiveString 操作*** 将它转换为字符串，这个也同样是 `Symbol.prototype.toString()` 中使用的方法。
- Else ，使用上面提到的 ***内部 ToString 操作***。

这就是 `String()` 可以对 Symbol 使用的原因。

**如何处理 Object ？**

> 注意下面的内容都 **只是针对 Object** 的。

[***内部 ToPrimitive 操作***](https://www.ecma-international.org/ecma-262/10.0/index.html#sec-toprimitive) 用于将一个值转化为原始类型 (primitive type) ：

简单来讲， `ToPrimitive(value, hint)` 做的事情是：

- If `hint` 没有传入，将 `hint` 设置为 `'default'` 。
- Else if `hint` 不等于 `'string'` ，将 `hint` 设置为 `'number'`。
- If 定义了 `value[Symbol.toPrimitive]` ，返回 `value[Symbol.toPrimitive](hint)` 的结果。
- Else:
    - If `hint` 等于 `'default'` ，将 `hint` 设置为 `'number'` 。
    - 使用 ***内部 OrdinaryToPrimitive 操作***，返回 `OrdinaryToPrimitive(value, hint)` 的结果。

::: details 模拟 内部 ToPrimitive 操作 的代码
```js
function fakeInternalToPrimitive(value, hint = 'default') {
  if (value[Symbol.toPrimitive] !== undefined) {
    return value[Symbol.toPrimitive](hint);
  }
  if (hint === 'default') {
    hint = 'number';
  }
  return fakeInternalOrdinaryToPrimitive(value, hint);
}
```
:::

很明显可以看出来，***内部 ToPrimitive 操作*** 的默认行为会被 `[Symbol.toPrimitive]` 所覆盖掉，并且 `hint` 参数可以是 `'default'`, `'number'` 或 `'string'`。

```js
const obj = {
  [Symbol.toPrimitive](hint) {
    return `Result of [Symbol.toPrimitive]('${hint}')`;
  },
};
console.log(obj + ''); // Result of [Symbol.toPrimitive]('default')
console.log(String(obj)); // Result of [Symbol.toPrimitive]('string')
console.log(`${obj}`); // Result of [Symbol.toPrimitive]('string')
```

因此，这三种方法的区别在于：

- `value + ''`
  - 它会调用 ***内部 ToPrimitive 操作***，并且不会传入 `hint` (即使用 `'default'`)
  - [参考链接](https://www.ecma-international.org/ecma-262/10.0/index.html#sec-addition-operator-plus-runtime-semantics-evaluation)
- `String(value)`
  - 它会调用 ***内部 ToString 操作***，进而会调用 ***内部 ToPrimitive 操作*** 并传入 `'string'` 作为 `hint`
  - [参考链接](https://www.ecma-international.org/ecma-262/10.0/index.html#sec-string-constructor-string-value)
- `` `${value}` ``
  - 它会调用 ***内部 ToString 操作***，进而会调用 ***内部 ToPrimitive 操作*** 并传入 `'string'` 作为 `hint`
  - [参考链接](https://www.ecma-international.org/ecma-262/10.0/index.html#sec-template-literals-runtime-semantics-evaluation)


接下来，如果 `[Symbol.toPrimitive]` 没有被定义：

- `value + ''` 会调用 ***内部 OrdinaryToPrimitive 操作*** 并传入 `'number'` 作为 `hint`
- `String(value)` 和 `` `${value}` `` 会调用 ***内部 OrdinaryToPrimitive 操作*** 并传入 `'string'` 作为 `hint`

简单来讲， `OrdinaryToPrimitive(value, hint)` 做的事情是：

- If `hint` 等于 `'string'`:
  - If `value.toString()` 的结果不是 Object ，则返回该结果。
  - Else if `value.valueOf()` 的结果不是 Object ，则返回该结果。
  - Else ，抛出 TypeError 异常。
- Else:
  - If `value.valueOf()` 的结果不是 Object ，则返回该结果。
  - Else if `value.toString()` 的结果不是 Object ，则返回该结果。
  - Else ，抛出 TypeError 异常。

::: details 模拟 内部 OrdinaryToPrimitive 操作 的代码
```js
function fakeInternalOrdinaryToPrimitive(value, hint) {
  let methodNames;
  if (hint === 'string') {
    methodNames = ['toString', 'valueOf'];
  } else {
    methodNames = ['valueOf', 'toString'];
  }
  for (const methodName of methodNames) {
    const result = value[methodName]();
    if (result === null || typeof result !== 'object') {
      return result
    }
  }
  throw new TypeError('Cannot convert object to primitive value');
}
```
:::

所以 `hint = 'string'` 和 `hint = 'number'` 唯一的区别在于：

- `'string'`: `toString()` -> `valueOf()`
- `'number'`: `valueOf()` -> `toString()`

```js
const obj = {
  valueOf() {
    console.log('valueOf');
    return {};
  },
  toString() {
    console.log('toString');
    return {};
  },
};

obj + '';
// valueOf
// toString
// TypeError: Cannot convert object to primitive value

String(obj);
// toString
// valueOf
// TypeError: Cannot convert object to primitive value

`${obj}`;
// toString
// valueOf
// TypeError: Cannot convert object to primitive value
```

::: tip
`Date.prototype[Symbol.toPrimitive]` 和 `Symbol.prototype[Symbol.toPrimitive]` 是已经预定义过的，所以它们的默认行为和其它 Object 不一样。
:::

现在我们知道，为什么 Babel 会把字符串模板转译成这样了：

- 使用 es2015 preset:

```js
// From
value => `${value}`;

// To
// 保持完全一致的内部行为
"".concat(value);
```

- 使用 es2015-loose preset:

```js
// From
value => `${value}`;

// To
// 内部行为不同，但性能更好
"" + value;
```

## Resources

- 测试用代码 - [Gist](https://gist.github.com/meteorlxy/c5f056144df3d60e0ec3c087a2f84e37)

## References

- [ECMAScript® 2019 Language Specification](https://www.ecma-international.org/ecma-262/10.0/index.html)
- [Converting a value to string in JavaScript](https://2ality.com/2012/03/converting-to-string.html)
- [5 Ways to Convert a Value to String in JavaScript](https://medium.com/dailyjs/5-ways-to-convert-a-value-to-string-in-javascript-6b334b2fc778)
