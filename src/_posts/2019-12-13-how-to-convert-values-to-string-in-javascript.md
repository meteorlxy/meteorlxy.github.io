---
category: Development
tags:
  - js
title: 'How to Convert Values to String in Javascript'
description: 'How to Convert Values to String in Javascript'
date: 2019-12-13
vssue-title: 'How to Convert Values to String in Javascript'
---

Converting a primitive value to string is a common operation in javascript. It might be more common in typescript as you may need to ensure a value to be exact string type.

Here we are going to discuss how to convert values to string.

<!-- more -->

## Commonly Used Ways

Typically, we have several ways to convert a `value` to string:

```js
const emptyStringMethod = value => value + '';
const stringMethod = value => String(value);
const templateMethod = value => `${value}`;
const toStringMethod = value => value.toString();
const concatMethod = value => ''.concat(value);
```

1. Concat an empty string: `value => value + ''`
    - A valid and effective way, but less explicit.

2. Use `String()` function: `value => String(value)`
    - Explicit and descriptive enough to express the intention: convert it to string.
    - The recommended way of [Airbnb JavaScript Style Guide](https://airbnb.io/javascript/#coercion--strings)

3. Use template literals: `` value => `${value}` ``
    - More explicit than #1. Less explicit than #2.
    - ES6 syntax.

4. Call `toString()` method: `value => value.toString()`
    - Won't work if `value` is `null` or `undefined`.
    - It is not guaranteed to return a string, as it may be rewritten by users.

5. Call `concat()` method on an empty string: `value => ''.concat(value)`
    - In fact it's not a commonly used way (I think).
    - Babel will transpile #3 to this method if you enable `es2015` preset, so we also take it into consideration.

## Test in Code

Talk is cheap. Let's test them in code.

Here we use primitive types and some built-in objects for testing.

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

### Compatibility

Call each method on each type to check their result.

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

::: details Click to see the result
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

### Performance

Call each method on each type 10,000,000 time in a for-loop, and use `console.time()` / `console.timeEnd()` to check their performance.

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

::: details Click to see the result on CentOS 7 + Node v10.16.0
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

::: details Click to see the result on Windows 10 + Chrome v75.0.3770.100
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

## Conclusion

- For best compatibility and explicit code style, and the least code:
  - use `String()`.
- For best performance if you will transpile code into ES5:
  - string: return itself directly
  - `null`: return `'null'` or `''` directly
  - Symbols: use `String()`
  - Objects: use `toString()`
  - Other primitive types: use `value + ''`
- For best performance in ES6 (the `combinedMethod` in the performance result):
  - string: return itself directly
  - `null`: return `'null'` or `''` directly
  - `undefined`: return `'undefined'` or `''` directly
  - Symbols: use `String()`
  - Objects: use `toString()`
  - Other primitive types: use `` `${value}` ``

::: tip
Notice that more conditions will cost more time, too. So you could reduce the conditions depending on your usage.

Our conclusion might not be the best, you can check the implementations of some utils libs for references. For example, the [_.toString()](https://github.com/lodash/lodash/blob/cefddab1cab49189b2ff4d72acf8df7ec723dc22/toString.js) method of lodash has some differences from our conclusion, and they also consider many other edge cases.
:::

## Dig Deeper

Here we only discuss `value + ''`, `String()` and template literals.

**What happens when trying to convert a value to string?**

All the three approaches will use the [***internal ToString operation***](https://www.ecma-international.org/ecma-262/10.0/index.html#sec-tostring):

| Type          | Result                                                                                                                           |
|---------------|----------------------------------------------------------------------------------------------------------------------------------|
| Undefined     | Return `'undefined'`.                                                                                                            |
| Null          | Return `'null'`.                                                                                                                 |
| Boolean       | Return `'true'` or `'false'`.                                                                                                    |
| Number        | Use ***internal NumberToString operation*** (some edge cases in lodash comes from it, let's ignore it here).                     |
| String        | Return itself.                                                                                                                   |
| Symbol        | Throw a TypeError exception.                                                                                                     |
| Object        | Use ***internal ToPrimitive operation*** to convert it to primitive value, and then use ***internal ToString operation*** on it. |

**Why `String()` won't throw a TypeError on Symbols?**

> See [ECMAScript Specification](https://www.ecma-international.org/ecma-262/10.0/index.html#sec-string-constructor-string-value)

In brief, what `String()` does is:

- If `value` is a Symbol, use ***internal SymbolDescriptiveString operation*** to convert it to string, which is also used by `Symbol.prototype.toString()`.
- Else, use ***internal ToString operation*** that described above.

That's the reason why `String()` can be used on Symbols.

**What happens on Object?**

> Remember the following contents are **only for Object**.

The [***internal ToPrimitive operation***](https://www.ecma-international.org/ecma-262/10.0/index.html#sec-toprimitive) is to convert a value to primitive type:

In brief, what `ToPrimitive(value, hint)` does is:

- If `hint` is not defined, set `hint` to `'default'`.
- Else if `hint` is not `'string'`, set `hint` to `'number'`.
- If `value[Symbol.toPrimitive]` is defined, return `value[Symbol.toPrimitive](hint)`.
- Else:
    - If `hint` is `'default'`, set `hint` to `'number'`
    - Use ***internal OrdinaryToPrimitive operation***, return `OrdinaryToPrimitive(value, hint)`.

::: details Code of fake internal ToPrimitive operation
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

It's obvious that the default behavior of ***internal ToPrimitive operation*** can be overridden by `[Symbol.toPrimitive]` method, and the `hint` argument could be `'default'`, `'number'` or `'string'`.

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

So the differences of these three approaches are:

- `value + ''`
  - It will call ***internal ToPrimitive operation*** without hint (`'default'`)
  - [Reference](https://www.ecma-international.org/ecma-262/10.0/index.html#sec-addition-operator-plus-runtime-semantics-evaluation)
- `String(value)`
  - It will call ***internal ToString operation***, which will call ***internal ToPrimitive operation*** with `'string'`
  - [Reference](https://www.ecma-international.org/ecma-262/10.0/index.html#sec-string-constructor-string-value)
- `` `${value}` ``
  - It will call ***internal ToString operation***, which will call ***internal ToPrimitive operation*** with `'string'`
  - [Reference](https://www.ecma-international.org/ecma-262/10.0/index.html#sec-template-literals-runtime-semantics-evaluation)

Next, if `[Symbol.toPrimitive]` is not defined:

- `value + ''` will call ***internal OrdinaryToPrimitive operation*** with `'number'`
- `String(value)` and `` `${value}` `` will call ***internal OrdinaryToPrimitive operation*** with `'string'`

In brief, what `OrdinaryToPrimitive(value, hint)` does is:

- If `hint` is `'string'`:
  - If the result of `value.toString()` is not Object, return the result.
  - Else if the result of `value.valueOf()` is not Object, return the result.
  - Else, Throw a TypeError exception.
- Else:
  - If the result of `value.valueOf()` is not Object, return the result.
  - Else if the result of `value.toString()` is not Object, return the result.
  - Else, Throw a TypeError exception.

::: details Code of fake internal OrdinaryToPrimitive operation
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

So the only difference of `hint = 'string'` and `hint = 'number'` is:

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

Now you know the reason why babel transpile template literals to ES5 in this way:

- In es2015 preset:

```js
// From
value => `${value}`;

// To
// Keep exact the same internal behavior
"".concat(value);
```

- In es2015-loose preset:

```js
// From
value => `${value}`;

// To
// Different internal behavior, better performance
"" + value;
```

## Resources

- Source code of tests - [Gist](https://gist.github.com/meteorlxy/c5f056144df3d60e0ec3c087a2f84e37)

## References

- [ECMAScript® 2019 Language Specification](https://www.ecma-international.org/ecma-262/10.0/index.html)
- [Converting a value to string in JavaScript](https://2ality.com/2012/03/converting-to-string.html)
- [5 Ways to Convert a Value to String in JavaScript](https://medium.com/dailyjs/5-ways-to-convert-a-value-to-string-in-javascript-6b334b2fc778)
