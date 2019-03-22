---
category: Development
tags:
  - js
  - nodejs
title: 'Event Loop in Node.js - Node 事件循环'
description: '理解Node的事件循环机制，以及setTimeout, setImmediate, process.nectTick等方法'
date: 2018-09-25
vssue-title: 'Event Loop in Node.js - Node 事件循环'
---

说到 js 的事件循环，浏览器和 Node 是不同的，这里整理一下 Node 事件循环的相关内容。基本上是根据自己的理解，对 Node 官方文档 Event loop 部分内容的翻译。

事件循环是 Node 最重要的概念之一，虽然 Javascript 是单线程的，但通过 Event loop，就可以实现非阻塞操作。

<!-- more -->

<TOC />

## Event Loop Explained

很多其他语言都有第三方库来支持事件机制，比如 Ruby 的 [Event Machine](https://github.com/eventmachine/eventmachine) 和 Python 的 [Twisted](https://github.com/twisted/twisted)。Node 的事件机制受到了这些库的启发，但并不是作为一个 JS 库来实现，而是直接把事件循环作为了 Node Runtime 中的一部分。

Node 的非阻塞 IO 操作依托于 [libuv](https://github.com/libuv/libuv) 实现。在 Node 启动时，会初始化事件循环，处理 JS 脚本中的代码。代码中可能会进行异步 API 调用、设定 timers、调用 `process.nextTick()` 等操作，接下来 Node 就会依托事件循环机制来处理这些操作。

事件循环总共分为几个 Phases，依次为`timers`, `pending callbacks`, `idle & prepare`, `poll`, `check`, `close callbacks`，不断循环进行下去。

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

每个 Phase 都有一个 FIFO 队列用来存放 callbacks 。当事件循环进入到一个 Phase 时，会执行当前 Phase 的一些特定操作，然后依次执行当前 Phase 的队列中的 callbacks。当满足下列条件之一时，当前 Phase 结束，进入下一个 Phase：

- 当前 Phase 队列中的 callbacks 已经被全部执行
- 当前 Phase 已经执行的 callbacks 数量达到最大限度

## Phases in Detail

- **timers**：执行通过 `setTimeout()` 和 `setInterval()` 设定的 callbacks。
- **pending callbakcs**：执行一些系统操作的 callbacks。比如在一些 *nix 系统中，TCP socket 在连接时收到了 `ECONNREFUSED`，就会将报告错误的任务放置到该 Phase 的队列中。
- **idle, prepare**：这两个 Phase 仅在 Node 内部使用，不参与执行 callbacks。
- **poll**：获取新的 IO 事件，执行所有 IO 相关的 callbacks。基本上除了 close callbacks、timers 和 `setImmediate()` 设定的 callbacks，所有的 callbacks 都是在这个 Phase 执行的。在必要的时候，Node 会在该 Phase 阻塞。
- **check**：执行通过 `setImmediate()` 设定的 callbacks。
- **close callbacks**：如果 socket 或者 handle 突然被关闭（比如通过 `socket.destroy()`），那么 `close` 事件就会在这个 Phase 被触发，否则是通过 `process.nextTick()` 被触发。

下面针对部分 Phases 进行详细介绍。

### Timer Phase

`setTimeout()` 和`setInterval()` 第二参数设定的时间 n，指的是 n 毫秒后，callback 才会被加入到 timer phase 的队列中，并尽快被执行。因此在实际运行过程中，很有可能因为操作系统调度或者其他 callbacks 的执行，导致 timer 的 callback 被推迟，不会是刚好间隔 n 毫秒就执行。

> 从技术层面上来讲，何时执行 timers 是在 Poll Phase 被决定的。

### Poll Phase

Poll Phase 主要有两个功能：

1. 计算阻塞时间，并轮询 IO 操作（`poll for IO`），然后
2. 处理 poll 队列中的事件和 callbacks

当事件循环进入 Poll Phase 时，如果没有 timers 被安排（`there are no timers scheduled`，但文档里没有说“如果有 timers 被安排”又会如何？），那么：

- 如果 poll 队列非空，同步执行队列中的 callbacks，直到队列中的 callbacks 被全部执行完毕，或者达到了该阶段 callbacks 的调用上限（不同系统上限不同）。
- 如果 poll 队列为空，那么：
  - 检查是否有 timers 已经到时间，如果有 timers 到时间了，就会返回 Timer Phase（`wrap back to timer phase`，应该是直接从 Poll Phase 跳回 Timer Phase 的意思）执行相关的 timers callbacks。
  - 如果脚本中通过 `setImmediate()` 设定了 callbacks，那么事件循环将会结束 Poll Phase，并进入 Check Phase 执行相关 callbacks。
  - 如果脚本中没有通过 `setImmediate()` 设定 callbacks，那么事件循环将会停留在 Poll Phase，等待 callbacks 被加入 poll 队列中并立即执行它们。

::: tip
关于 timers 的处理，原文讲的不是很清楚。刚进入 Poll Phase 时：

> When the event loop enters the poll phase and **there are no timers scheduled**, one of two things will happen: ...

那么在进入 Poll Phase 时，如果 `there are timers scheduled`，是怎样处理的呢？

然后在最后写了一句：

> Once the poll queue is empty the event loop will check for timers whose time thresholds have been reached. If one or more timers are ready, the event loop will wrap back to the timers phase to execute those timers' callbacks.

这里的 "Once the poll queue is empty"，没有说清楚检查 timers 和检查 `setImmediate()` 的先后顺序。但是按照后面关于 `setTimeout()` 和 `setImmediate()` 的对比，有可能 `setTimeout()` 会先于 `setImmediate()` 执行，我推断检查 timers 是要优先于检查 `setImmediate()` 的。（这里不是很确定，需要高人指点一下，或者只能从源码中去找答案了）
:::

### Check Phase

通过 `setImmediate()`，可以在 Poll Phase 结束后立即执行 callbacks。

如上面 Poll Phase 中提到的，当 Poll Phase 进入空闲的时候，`setImmediate()` 可以让事件循环进入 Check Phase 执行相关 callbacks，而不是继续在 Poll Phase 等待。

### Close Callbacks Phase

需要注意的是，并不是所有的 close 相关的 callbacks 都是在这个阶段执行的。只有在 `socket` 或者 `handle` 被突然关闭（`is closed abruptly`，比如通过 `socket.destroy()` 关闭）的时候，才会在这个 Phase 触发 close 事件。

否则，一般情况下都是通过 `process.nextTick()` 触发 close 事件。

## `setImmediate()` vs `setTimeout()`

`setTimeout()` 即便延时设置为 0 也不是真正的 0，[至少是 1 毫秒](https://nodejs.org/api/timers.html#timers_settimeout_callback_delay_args)。

从上面的介绍可以知道，在 Poll Phase 进入空闲时，如果 timer 的延时已经到了，就会先执行 `setTimeout()` 的 callback。而如果 timer 的延时还没到，就会先进入 Check Phase 执行 `setImmediate()`的 callback。

如果在 main module 直接调用这两个函数，那么它们的输出顺序是不确定的，取决于 Poll Phase 进入空闲前系统其他应用的资源占用状态：

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

如果在一个 IO 操作的 callback 中调用这两个函数，我们知道 IO callbacks 是在 Poll Phase 的队列中执行的，所以之后会先进入 Check Phase 执行 `setImmediate()` 的 callback，再到 Timer Phase 执行 `setTimeout()` 的 callback：

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

而如果是在 close callback 中调用这两个函数，由于上面各个 Phases 的先后关系，同样结果是不确定的：

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

最后这个 close callback 中的对比，官网文档中并没有，是我自己根据理解尝试的。要注意的是，确实只有类似 `socket.destroy()` 这样的个别 close 事件是在 close callback phase 处理的，导致 immediate 和 timeout 先后关系不确定。

如果像 `stream.close(), stream.on('close')` 这种，先后关系就是确定的了：

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

`process.nextTick()` 同样是 Node 异步 API 的一部分，但是没有出现在 Event Loop 的阶段图中。这是因为 `process.nextTick()` 并不是事件循环的某个部分，而是无论在事件循环的任一 Phase 中，当前操作结束之后都会处理 `nextTickQueue` 中的 callbacks。

换句话说，如果你在事件循环的任意 Phase 中，通过某个操作调用了 `process.nextTick()`，那么在当前操作完成后，事件循环就会暂停，先去执行 `process.nextTick()` 中的操作，然后再返回之前的事件循环继续进行：

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

所以，`process.nextTick()` 可以让 Node 在当前代码执行完毕后立即执行其中的 callback，而不必等到后续事件循环的某个阶段再去执行。可以看出来，`process.nextTick()` 其实要比 `setImmediate()` 要更 "immediate" 一些。

但是 `process.nextTick()` 会打断 Event Loop，如果递归调用 `process.nextTick()` 的话，会导致事件循环被“阻塞”，IO 操作无法在 `process.nextTick()` 的递归调用完成前继续。

所以官方建议用 `setImmediate()` 代替 `process.nextTick()`，可以避免一些潜在的问题。不过如果你充分理解了 `process.nextTick()` 的机制，在适当的时候使用 `process.nextTick()` 也是完全可以的。

## References

- [About Node.js](https://nodejs.org/en/about/)
- [The Node.js Event Loop, Timers, and `process.nextTick()`](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)
