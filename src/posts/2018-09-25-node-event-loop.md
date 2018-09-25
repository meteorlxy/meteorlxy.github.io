---
layout: post
category: Development
tags:
  - js
  - nodejs
title: 'Event Loop in Node.js - Node 事件循环'
description: '理解Node的事件循环机制，以及setTimeout, setImmediate, process.nectTick等方法'
date: 2018-09-25
---

说到js的事件循环，浏览器和node是不同的，这里整理一下node事件循环的相关内容。基本上是根据自己的理解，对Node官方文档event loop部分内容的翻译。

事件循环是node最重要的概念之一，虽然Javascript是单线程的，但通过event loop，就可以实现非阻塞操作。

<!-- more -->

[[toc]]

## Event Loop Explained

很多其他语言都有第三方库来支持事件机制，比如Ruby的[Event Machine](https://github.com/eventmachine/eventmachine)和Python的[Twisted](https://github.com/twisted/twisted)。Node的事件机制受到了这些库的启发，但并不是作为一个JS库来实现，而是直接把事件循环作为了Node runtime中的一部分。

Node的非阻塞IO操作依托于[libuv](https://github.com/libuv/libuv)实现。在Node启动时，会初始化事件循环，处理JS脚本中的代码。代码中可能会进行异步API调用、设定timers、调用`process.nextTick()`等操作，接下来node就会依托事件循环机制来处理这些操作。

事件循环总共分为几个Phases，依次为`timers`, `pending callbacks`, `idle, prepare`, `poll`, `check`, `close callbacks`，不断循环进行下去。

如下图所示（摘自官方文档）：

```
   ┌───────────────────────────┐
┌─>│           timers          │
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks     │
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │
│  └─────────────┬─────────────┘      ┌───────────────┐
│  ┌─────────────┴─────────────┐      │   incoming:   │
│  │           poll            │<─────┤  connections, │
│  └─────────────┬─────────────┘      │   data, etc.  │
│  ┌─────────────┴─────────────┐      └───────────────┘
│  │           check           │
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
└──┤      close callbacks      │
   └───────────────────────────┘
```

每个Phase都有一个FIFO队列用来存放callbacks。当事件循环进入到一个Phase时，会执行当前Phase的一些特定操作，然后依次执行当前Phase的队列中的callbacks。当满足下列条件之一时，当前Phase结束，进入下一个Phase：

- 当前Phase队列中的callbacks已经被全部执行
- 当前Phase已经执行的callbacks数量达到最大限度

## Phases in Detail

- **timers**：执行通过`setTimeout()`和`setInterval()`设定的callbacks。
- **pending callbakcs**：执行一些系统操作的callbacks。比如在一些*nix系统中，TCP socket在连接时收到了`ECONNREFUSED`，就会将报告错误的任务放置到该Phase的队列中。
- **idle, prepare**：这两个Phase仅在node内部使用，不参与执行callbacks。
- **poll**：获取新的IO事件，执行所有IO相关的callbacks。基本上除了close callbacks、timers和`setImmediate()`设定的callbacks，所有的callbacks都是在这个Ohase执行的。在必要的时候，node会在该Phase阻塞。
- **check**：执行通过`setImmediate()`设定的callbacks。
- **close callbacks**：如果socket或者handle突然被关闭（比如通过`socket.destroy()`），那么`close`事件就会在这个Phase被触发，否则是通过`process.nextTick()`被触发。

下面针对部分phases进行详细介绍。

### Timer Phase

`setTimeout()`和`setInterval()`第二参数设定的时间n，指的是n毫秒后，callback才会被加入到timer phase的队列中，并尽快被执行。因此在实际运行过程中，很有可能因为操作系统调度或者其他callbacks的执行，导致timer的callback被推迟，不会是刚好间隔n毫秒就执行。

> 从技术层面上来讲，何时执行timers是在poll phase被决定的。

### Poll Phase

Poll phase主要有两个功能：

1. 计算阻塞时间，并轮询IO操作（`poll for IO`），然后
2. 处理poll队列中的事件和callbacks

当事件循环进入poll phase时，如果没有timers被安排（`there are no timers scheduled`，但文档里没有说“如果有timers被安排”又会如何？），那么：

- 如果poll队列非空，同步执行队列中的callbacks，直到队列中的callbacks被全部执行完毕，或者达到了该阶段callbacks的调用上限（不同系统上限不同）。
- 如果poll队列为空，那么：
  - 检查是否有timers已经到时间，如果有timers到时间了，就会返回timer phase（`wrap back to timer phase`，应该是直接从poll phase跳回timer phase的意思）执行相关的timers callbacks。
  - 如果脚本中通过`setImmediate()`设定了callbacks，那么事件循环将会结束poll phase，并进入check phase执行相关callbacks。
  - 如果脚本中没有通过`setImmediate()`设定callbacks，那么事件循环将会停留在poll phase，等待callbacks被加入poll队列中并立即执行它们。

::: tip
关于timers的处理，原文讲的不是很清楚。刚进入poll阶段时：

> When the event loop enters the poll phase and **there are no timers scheduled**, one of two things will happen: ...

那么在进入poll阶段时，如果`there are timers scheduled`，是怎样处理的呢？

然后在最后写了一句：

> Once the poll queue is empty the event loop will check for timers whose time thresholds have been reached. If one or more timers are ready, the event loop will wrap back to the timers phase to execute those timers' callbacks.

这里的“Once the poll queue is empty”，没有说清楚检查timers和检查`setImmediate()`的先后顺序。但是按照后面关于`setTimeout()`和`setImmediate()`的对比，有可能`setTimeout()`会先于`setImmediate()`执行，我推断检查timers是要优先于检查`setImmediate()`的。（这里不是很确定，需要高人指点一下，或者只能从源码中去找答案了）
:::

### Check Phase

通过`setImmediate()`，可以在poll phase结束后立即执行callbacks。

如上面poll phase中提到的，当poll phase进入空闲的时候，`setImmediate()`可以让事件循环进入check phase执行相关callbacks，而不是继续在poll phase等待。

### Close Callbacks Phase

需要注意的是，并不是所有的close相关的callbacks都是在这个阶段执行的。只有在`socker`或者`handle`被突然关闭（`is closed abruptly`，比如通过`socket.destroy()`关闭）的时候，才会在这个Phase触发close事件。

否则，一般情况下都是通过`process.nextTick()`触发close事件。

## `setImmediate()` vs `setTimeout()`

`setTimeout()`即便延时设置为0也不是真正的0，[至少是1毫秒](https://nodejs.org/api/timers.html#timers_settimeout_callback_delay_args)。

从上面的介绍可以知道，在poll阶段进入空闲时，如果timer的延时已经到了，就会先执行`setTimeout()`的callback。而如果timer的延时还没到，就会先进入check phase执行`setImmediate()`的callback。

如果在main module直接调用这两个函数，那么它们的输出顺序是不确定的，取决于poll phase进入空闲前系统其他应用的资源占用状态：

```js
// timeout_vs_immediate.js
setTimeout(() => {
  console.log('timeout');
}, 0);

setImmediate(() => {
  console.log('immediate');
});
```

```sh
$ node timeout_vs_immediate.js
timeout
immediate

$ node timeout_vs_immediate.js
immediate
timeout
```

如果在一个IO操作的callback中调用这两个函数，我们知道IO callbacks是在poll phase的队列中执行的，所以之后会先进入check phase执行`setImmediate()`的callback，再到timer phase执行`setTimeout()`的callback：

```js
// timeout_vs_immediate.js
const fs = require('fs');

fs.readFile(__filename, () => {
  setTimeout(() => {
    console.log('timeout');
  }, 0);
  setImmediate(() => {
    console.log('immediate');
  });
});
```

```sh
$ node timeout_vs_immediate.js
immediate
timeout

$ node timeout_vs_immediate.js
immediate
timeout
```

而如果是在close callback中调用这两个函数，由于上面各个Phase的先后关系，同样结果是不确定的：

```js
// timeout_vs_immediate.js
const socket = new net.Socket();

socket.connect();
socket.destroy();

socket.on('close', () => {
  setTimeout(() => {
    console.log('timeout');
  }, 0);
  setImmediate(() => {
    console.log('immediate');
  });
});
```

```sh
$ node timeout_vs_immediate.js
immediate
timeout

$ node timeout_vs_immediate.js
timeout
immediate
```

最后这个close callback中的对比，官网文档中并没有，是我自己根据理解尝试的。要注意的是，确实只有类似`socket.destroy()`这样的个别close事件是在close callback phase处理的，导致immediate和timeout先后关系不确定。

如果像`stream.close(), stream.on('close')`这种，先后关系就是确定的了：

```js
// timeout_vs_immediate.js
const fs = require('fs');

const stream = fs.createReadStream(__filename);

stream.read();
stream.close();

stream.on('close', () => {
  setTimeout(() => {
    console.log('timeout');
  }, 0);
  setImmediate(() => {
    console.log('immediate');
  });
});
```

```sh
$ node timeout_vs_immediate.js
immediate
timeout

$ node timeout_vs_immediate.js
immediate
timeout
```

## `process.nextTick()`

`process.nextTick()`同样是node异步API的一部分，但是没有出现在event loop的阶段图中。这是因为`process.nextTick()`并不是事件循环的某个部分，而是无论在事件循环的任一Phase中，当前操作结束之后都会处理`nextTickQueue`中的callbacks。

换句话说，如果你在事件循环的任意Phase中，通过某个操作调用了`process.nextTick()`，那么在当前操作完成后，事件循环就会暂停，先去执行`process.nextTick()`中的操作，然后再返回之前的事件循环继续进行：

```sh
# queue of some phase
┌─────────────────────────┐     ┌─────────────────┐
│       callback 1        │-X-> │    callback 2   │---> ...
│ call process.nextTick() │     └──┬──────────────┘
└───────────────────┬─────┘        ↑
                    ↓              │
                 ┌──┴──────────────┴──┐
                 │   nextTickQueue    │
                 └────────────────────┘
```

所以，`process.nextTick()`可以让node在当前代码执行完毕后立即执行其中的callback，而不必等到后续事件循环的某个阶段再去执行。可以看出来，`process.nextTick()`其实要比`setImmediate()`要更“immediate”一些。

但是`process.nextTick()`会打断event loop，如果递归调用`process.nextTick()`的话，会导致事件循环被“阻塞”，IO操作无法在`process.nextTick()`的递归调用完成前继续。

所以官方建议用`setImmediate()`代替`process.nextTick()`，可以避免一些潜在的问题。不过如果你充分理解了`process.nextTick()`的机制，在适当的时候使用`process.nextTick()`也是完全可以的。

## References

- [About Node.js](https://nodejs.org/en/about/)
- [The Node.js Event Loop, Timers, and `process.nextTick()`](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)
