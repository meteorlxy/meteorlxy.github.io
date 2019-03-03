---
category: Development
tags:
  - js
title: 'Throttle and Debounce - 函数节流和去抖小结'
description: '函数节流和去抖小结'
date: 2018-07-20
vssue-title: 'Throttle and Debounce - 函数节流和去抖小结'
---

函数节流(Throttle)和去抖(Debounce)是很常用的工具函数，作用相似，但是并不完全相同。

昨天群里偶然提到这两个，发现概念不是很明确的话还是挺容易混淆的。然后昨天晚上阿里的电话面试就正好问到了“函数节流”的简单实现，感觉自己说的条理不怎么清楚，也是很尴尬。

正好今天的需求跳票了，有一段空闲，简单总结一下这两个函数。

<!-- more -->

有很多js工具库都集成了这两个函数，比如[underscore](https://github.com/jashkenas/underscore)和[lodash](https://github.com/lodash/lodash)。结合它们的源码，看一下实现方式有什么不同。

## Throttle

Throttle，~~就是水龙头~~顾名思义，对函数进行节流，不让函数在一定时间内执行多次。也就是说，保证在一段时间内，让函数最多只被触发一次。

简单的思路就是：

- 每次函数执行之后，记录该次执行的时间点
- 每次要执行函数前，先判断当前时间点和上次执行的时间点的间隔，是否超过指定间隔
  - 如果已经超过间隔，则不冲突，可以立即执行
  - 如果没有超过间隔，则冲突了，不执行

还有一些额外的设置，比如在冲突的时候，推迟到下一个间隔再执行。下面`trailing`的选项就是这个意思。

下面分析一下`underscore`中的`throttle`源码：

```js
/**
 * underscore.throttle
 * 
 * @version v1.9.1
 * 
 * @param {Function} func - 要包装的函数
 * @param {Number} wait - 执行间隔
 * @param {Object} options - 选项
 * @param {boolean} options.leading - 是否在当前间隔内执行，默认相当于true
 *                                    true：正常行为，当前间隔能执行就执行了
 *                                    false：当前间隔能执行时，推迟到下一个间隔再执行。这时如果trailing也设置成false，就永远不执行了
 * @param {boolean} options.trailing - 在当前间隔不能执行时，是否在下一个间隔内执行，默认相当于true
 *                                     true：多出来的这次在下个间隔补上
 *                                     false：多出来的这次就扔掉了
 */
_.throttle = function(func, wait, options) {
  var timeout, context, args, result;
  var previous = 0; // 用来记录上一次执行时间，初始置0
  if (!options) options = {};

  var later = function() {
    previous = options.leading === false ? 0 : _.now();
    timeout = null;
    result = func.apply(context, args);
    if (!timeout) context = args = null;
  };

  var throttled = function() {
    var now = _.now();
    if (!previous && options.leading === false) previous = now; // 如果设置了不在当前间隔内执行，那么在当前间隔空闲时(!previous)，直接把previous设成当前时间，
                                                                // 这样在没有timeout时，将直接进入下面setTimeout分支，在下一个间隔内再执行
    var remaining = wait - (now - previous); // 计算还剩多久才能下一次执行
    context = this; // 保存调用函数时的执行上下文
    args = arguments; // 保存要传入被包装的函数的参数
    if (remaining <= 0 || remaining > wait) { // 如果超过间隔，可以立即执行
      if (timeout) { // 如果设置了timeout，即原计划要在下个间隔执行
        clearTimeout(timeout); // 清除timeout，取消下个间隔的执行
        timeout = null; // 将timeout置null
      }
      previous = now; // 将previous设为当前时间
      result = func.apply(context, args); // 执行被包装的函数，存储结果到result
      if (!timeout) context = args = null; // 如果没有timeout，将上下文和参数置位null - 这里没太明白是在做什么
    } else if (!timeout && options.trailing !== false) { // 如果当前没有timeout，且没有设置trailing: false
      timeout = setTimeout(later, remaining); // 设置timeout，在达到remaining时间后执行函数
    }
    return result; // 返回执行结果，若没有立即执行的话返回的是undefined
  };

  throttled.cancel = function() { // 用来重置为初始状态，感觉叫reset比较合适
    clearTimeout(timeout);
    previous = 0;
    timeout = context = args = null;
  };

  return throttled;
};
```

## Debounce

Debounce，翻译出来都是“防反跳”，其实理解为设置一定的缓冲即可。思想就是，如果函数保持较短的间隔持续被触发，则只执行一次。换句话说，当一个事件一直持续被触发(小于一定间隔才视为“持续”)，那么从刚开始被触发到最后一次触发的这段时间内，该事件绑定的函数只会被执行一次。

举个例子，当改变窗口大小时，要对一些图形进行重绘。但是在调整窗口大小的过程中，`resize`这个事件其实是一直持续不断地被触发的，那么debounce可以帮助你在这段`resize`结束时，才去触发一次重绘动作。

基本的思路是：
- 每次触发函数，都通过setTimeout，等到一定间隔后再执行该函数
- 如果触发函数时，发现已经有一个在等的timeout，则把之前的timeout清掉，设置一个新的timeout
- 这样，当超过timeout没有被再次触发时，函数就会通过setTimeout执行了

下面分析一下`underscore`中的`debounce`源码：

```js
/**
 * underscore.debounce
 * 
 * @version v1.9.1
 * 
 * @param {Function} func - 要包装的函数
 * @param {Number} wait - 间隔多久以内会被视为“持续”
 * @param {boolean} immediate - 是否在触发的开始立即执行函数，而不是等到结束后再执行，默认相当于false
 */
_.debounce = function(func, wait, immediate) {
  var timeout, result;

  var later = function(context, args) {
    timeout = null; // timeout置null，immediate时没有后续操作
    if (args) result = func.apply(context, args);
  };

  var debounced = restArguments(function(args) {
    if (timeout) clearTimeout(timeout); // 如果当前有一个在等着的timeout，则清理掉（注意不是置null）
    if (immediate) { // 如果设置了immediate，timeout的作用就是让后面的不执行
      var callNow = !timeout; // 如果timeout为null，则立即执行
      timeout = setTimeout(later, wait); // 只用来timeout置null，因为没传args给later
      if (callNow) result = func.apply(this, args); // 立即执行
    } else { // 默认不设置immediate，
      timeout = _.delay(later, wait, this, args); // 感觉有点怪啊，第三个this对应_.delay()里面的args了？
    }

    return result;
  });

  debounced.cancel = function() {
    clearTimeout(timeout);
    timeout = null;
  };

  return debounced;
};

// 把debounce用到的delay也放过来，其实就是一个setTimeout
_.delay = restArguments(function(func, wait, args) {
  return setTimeout(function() {
    return func.apply(null, args);
  }, wait);
});
```

## References

- [Debouncing and Throttling Explained Through Examples](https://css-tricks.com/debouncing-throttling-explained-examples/)
- [underscore v1.9.1 - throttle](https://github.com/jashkenas/underscore/blob/1.9.1/underscore.js#L842)
- [underscore v1.9.1 - debounce](https://github.com/jashkenas/underscore/blob/1.9.1/underscore.js#L887)
