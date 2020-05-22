---
category: Development
tags:
  - js
  - note
title: '【学习笔记】 JavaScript 深入系列'
description: '冴羽 JavaScript 深入系列学习笔记'
date: 2019-12-13
vssue-title: '【学习笔记】 JavaScript 深入系列'
---

工作后忙于各种需求，业余时间也更倾向于休息娱乐，学习提升的时间明显少了。最近看了知乎的一篇 [写给初中级前端的高级进阶指南](https://zhuanlan.zhihu.com/p/117490792) ，决定按照其中的思路巩固基础、深入提高。

这里记录一下学习 [冴羽的博客 - JavaScript 深入系列](https://github.com/mqyqingfeng/Blog#%E6%B7%B1%E5%85%A5%E7%B3%BB%E5%88%97%E7%9B%AE%E5%BD%95) 的笔记。

<!-- more -->

## JavaScript 深入之从原型到原型链

从一个构造函数 `First` 和它的实例对象 `first` 说起

```js
function First() {}
const first = new First();
```

实例的原型是其构造函数的 `prototype` 属性

```js
Object.getPrototypeOf(first) === First.prototype
// true
```

`__proto__` 并非标准，只是绝大多数 JS 引擎约定俗成的实现，相当于 ` Object.getPrototypeOf()` 的一个 getter

```js
first.__proto__ === First.prototype
// true
```

构造函数 `prototype` 属性的 `constructor` 属性，是构造函数本身

```js
First.prototype.constructor === First
// true
```

实例会继承原型上的属性

```js
first.constructor === First
// true

First.prototype.foo = 'foo'
First.prototype.bar = () => 'bar'

first.foo
// "foo"
first.bar()
// "bar"
```

修改实例中的同名属性，不会影响其原型

```js
first.foo = 'foobar'
first.bar = () => 'foobar'

First.prototype.foo
// "foo"
First.prototype.bar()
// "bar"
```

作为 `first` 原型的 `First.prototype` ，其本身又是一个对象 (Object)，继承了 `Object.prototype` 作为原型

```js
Object.getPrototypeOf(First.prototype) === Object.prototype
```

这种一层层的原型继承关系，就称之为“原型链”。所以 `first` 实例的原型链就是 `First.prototype` -> `Object.prototype` -> `null`

```js
first.__proto__ === First.prototype
// true
first.__proto__.__proto__ === Object.prototype
// true
first.__proto__.__proto__.__proto__ === null
// true
```

实例从原型“继承”来的属性，实际上是依次沿着原型链查找对应的属性。例如几乎所有对象都有的 `toString` 方法，就是从 `Object.prototype` 上继承来的

```js
first.toString === Object.prototype.toString
// true
```

`Object.prototype` 本身没有原型，它的原型是 `null`

> 在 JS 的世界里， `Object.prototype` 有点类似“万物之源”的味道

```js
Object.getPrototypeOf(Object.prototype) === null
// true
Object.prototype.__proto__ === null
// true
```

### 对于原型和原型链的扩展

`Object.create(foo)` 可以创建一个以 `foo` 为原型的对象，当然这里 `foo` 本身也以 `Object.prototype` 作为原型

```js
const foo = {}

Object.create(foo).__proto__ === foo
// true
foo.__proto__ === Object.prototype
// true
```

`Object.create(null)` 可以创建一个原型为 `null` 的对象，它没有任何可用的属性和方法，甚至连 `__proto__` 这个 getter 也没有

```js
const noPrototypeObj = Object.create(null)

Object.getPrototypeOf(noPrototypeObj) === null
// true
noPrototypeObj.__proto__ === undefined
// true
```

`Object.getOwnPropertyNames()` 可以只获取当前对象的属性名，而不会获取到其原型上的属性名。

```js
const parent = {
  a: 'a',
  b() {},
}
Object.getOwnPropertyNames(parent)
// ["a", "b"]

const child = Object.create(parent)
Object.getOwnPropertyNames(child)
// []
```

`Object.keys()` 与 `Object.getOwnPropertyNames()` 的作用类似，区别在于  `Object.keys()` 不会获取到不可枚举 (`enumerable: false`) 的属性

```js
Object.getOwnPropertyNames(Object.prototype)
// ["constructor", .....]
Object.keys(Object.prototype)
// []
```

从上例可以看出，万物之源 `Object.prototype` 这个对象的所有属性都是不可枚举的，使用 `Object.getOwnPropertyDescriptors()` 方法可以查看当前对象(不包含原型链)属性的 descriptor ，其中就包含了是否可枚举

```js
Object.getOwnPropertyDescriptors(Object.prototype)
```

`in` 关键字则会查找属性名是否存在与当前对象及其原型链上，**包含** 不可枚举的属性

```js
'a' in child
// true
'toString' in child
// true
```

`for .. in` 循环则会遍历当前对象及其原型链上的所有属性，但 **不包含** 不可枚举的属性

```js
for (let key in child) {
  console.log(key)
}
// a
// b
```

还有一个有意思的东西是 `Function.prototype` ，它是所有函数的原型

```js
function foobar () {}
foobar.__proto__ === Function.prototype
// true
```

`Function.prototype` 中定义了函数的默认行为，包括函数是如何被调用的这些底层实现。其本身也是一个函数，可以被调用

```js
typeof Function.prototype
// "function"
Function.prototype()
// undefined
```

我们刚才提到， `Function.prototype` 是“所有函数”的原型，其实是不准确的。因为它自己就是一个函数，但它并不是它自己的原型

```js
Function.prototype.__proto__ === Function.prototype
// false
Function.prototype.__proto__ === Object.prototype
// true
```

在浏览器控制台打印 `Function.prototype` 会出现 `[native code]` ，说明它是通过原生代码而不是 JS 本身实现的，应该是在原生代码实现时，“篡改”了它的原型吧 （深入了解的话应该需要看 V8 的实现了）

```js
Function.prototype
// ƒ () { [native code] }
```

## JavaScript 深入之词法作用域和动态作用域

> TODO
