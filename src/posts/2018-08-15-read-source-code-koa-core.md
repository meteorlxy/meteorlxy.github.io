---
layout: post
category: Development
tags:
  - js
  - koa
title: '源码阅读 - Koa Core'
description: 'Read and learn the source code of koa core'
date: 2018-08-15
---

阅读学习Koa Core源码，基于koa v2.5.2。

Koa的核心代码很少，就四个文件`application`, `context`, `request`, `response`，算上注释和空行目前也还没过2000行代码。

<!-- more -->

# Koa Core

[koajs/koa](https://github.com/koajs/koa)

- `lib/application`
- `lib/context`
- `lib/request`
- `lib/response`

主要这四个文件，当然也还依赖了很多外部库，以及koa的其他仓库。

[[toc]]

## Application

Koa 的 Hello, world 是这样：

```js
const Koa = require('koa')
const app = new Koa()

app.use(ctx => {
  ctx.body = 'Hello Koa'
})

app.listen(3000)
```

第一个`const Koa = require('koa')`就是引入koa的`Application` 类，即源码中的 `lib/application.js`。

```json
// package.json
{
  // ...
  "main": "lib/application.js",
  // ...
}

```

### Application类的声明与构造函数

```js
// @see https://nodejs.org/dist/latest-v10.x/docs/api/events.html#events_class_eventemitter
const Emitter = require('events');

module.exports = class Application extends Emitter {
  // ...
}
```

整个`Application`类继承自node的[`EventEmitter`](https://nodejs.org/dist/latest-v10.x/docs/api/events.html#events_class_eventemitter)。也就是说，`Application`本身会带有`on()`, `off()`, `emit()`等事件相关的方法。

```js
const context = require('./context');
const request = require('./request');
const response = require('./response');
const util = require('util');

// ...

/**
 * Initialize a new `Application`.
 *
 * @api public
 */
constructor() {
  super();

  this.proxy = false;
  this.middleware = [];
  this.subdomainOffset = 2;
  this.env = process.env.NODE_ENV || 'development';
  this.context = Object.create(context);
  this.request = Object.create(request);
  this.response = Object.create(response);
  if (util.inspect.custom) {
    this[util.inspect.custom] = this.inspect;
  }
}

// ...
```

构造函数，初始化`Application`的属性。

其中的`context`, `request`, `response`就是在另外三个文件中实现的了。

node v6.6.0+ 增加了自定义`inspect`函数，deprecate了原本的`inspect()`方法。为了支持旧版本node，还保留了`this.inspect`。`util.inspect.custom`将返回一个Symbol，专门用于对应`inspect`方法。预计不再支持旧版node后，会把这里移除，直接用`[util.inspect.custom]`。

::: tip
其实有点奇怪，Koa的文档写的是：

> Koa requires node v7.6.0 or higher for ES2015 and async function support.

然后后面又写了：

> If you're not using node v7.6+, we recommend setting up babel with babel-preset-env ...

然后`package.json`里面是这么写的：

```json
"engines": {
  "node": "^4.8.4 || ^6.10.1 || ^7.10.1 || >= 8.1.4"
},
```

所以最上面写的`requires node v7.6.0 or higher`并不是真的"require"，大概是为了和node的LTS版本对齐？但是截止现在(2018-08-15)，node 4.x, 7.x 9.x都已经处于`end-of-life`状态了([参考这里](https://github.com/nodejs/Release#end-of-life-releases))，按理说应该需要排除掉了才对:sweat_smile:。
:::


### Application类的方法

不按照源码顺序放了，大致按照`Hello, world`中的使用顺序来写。

#### use()

```js
// @see https://github.com/visionmedia/debug
const debug = require('debug')('koa:application');
const isGeneratorFunction = require('is-generator-function');
const deprecate = require('depd')('koa');
const convert = require('koa-convert');
// ...

/**
 * Use the given middleware `fn`.
 *
 * Old-style middleware will be converted.
 *
 * @param {Function} fn
 * @return {Application} self
 * @api public
 */
use(fn) {
  if (typeof fn !== 'function') throw new TypeError('middleware must be a function!');
  if (isGeneratorFunction(fn)) {
    deprecate('Support for generators will be removed in v3. ' +
              'See the documentation for examples of how to convert old middleware ' +
              'https://github.com/koajs/koa/blob/master/docs/migration.md');
    fn = convert(fn);
  }
  debug('use %s', fn._name || fn.name || '-');
  this.middleware.push(fn);
  return this;
}

// ...
```

koa默认支持通过`debug`进行调试，只需要启动时增加环境变量`DEBUG=koa*`，即可调试koa相关的组件代码 - [参考文档](https://github.com/koajs/koa/blob/master/docs/guide.md#debugging-koa)。

这里注册了`koa:application`为模块名，所以在当前文件中的`debug`都会属于该模块。后面出现`debug`的地方不再特别说明。

简单说来，`use()`方法就是往`this.middileware`数组中`push`新的`middleware`。由于koa的`middleware`洋葱模型是有顺序的，所以`this.middileware`数组中的顺序就是从外到内的顺序。

旧版`1.x`的`middleware`还不是`async`函数，而是`generator`函数。为了支持旧版`middleware`，对`generator`函数进行了判断，通过`koa-convert`转换成`async`版的`middleware`，并通过`deprecate`提示旧版的`middleware`已经被废弃。预计`3.x`就不再支持旧版`middleware`了。

`use()`支持链式调用，所以最后返回的是`this`。

#### listen()

```js
const http = require('http');

// ...

/**
 * Shorthand for:
 *
 *    http.createServer(app.callback()).listen(...)
 *
 * @param {Mixed} ...
 * @return {Server}
 * @api public
 */
listen(...args) {
  debug('listen');
  const server = http.createServer(this.callback());
  return server.listen(...args);
}

// ...
```

`listen()`方法就是调用了`http`模块并创建了`http.Server`实例进行`listen`。

`this.callback()`作为`requestHandler`传入，监听`request`事件 - [文档](https://nodejs.org/dist/latest-v10.x/docs/api/http.html#http_http_createserver_options_requestlistener)。

#### callback()

```js
const compose = require('koa-compose');

// ...

/**
 * Return a request handler callback
 * for node's native http server.
 *
 * @return {Function}
 * @api public
 */
callback() {
  const fn = compose(this.middleware);

  if (!this.listenerCount('error')) this.on('error', this.onerror);

  const handleRequest = (req, res) => {
    const ctx = this.createContext(req, res);
    return this.handleRequest(ctx, fn);
  };

  return handleRequest;
}

// ...
```

`callback()`就是传入`http`模块的`requestHandler`，通过`koa-compose`将所有通过`use()`注册的`middlewares`打包成一个，然后通过`handleRequest()`去真正处理请求。

`listenerCount()`是node的`EventEmitter`的方法。如果还没有给`Application`单独注册过`error`事件的监听器，则默认使用`onerror`来处理`error`事件。

通过`this.createContext()`方法新建上下文，作为后续整个`middleware`链中的`ctx`。因为每个请求都要有独立的`context`，所以每次处理请求时都要新创建一个。

#### handleRequest()

```js
const onFinished = require('on-finished');

// ...

/**
 * Handle request in callback.
 *
 * @api private
 */

handleRequest(ctx, fnMiddleware) {
  const res = ctx.res;
  res.statusCode = 404;
  const onerror = err => ctx.onerror(err);
  const handleResponse = () => respond(ctx);
  onFinished(res, onerror);
  return fnMiddleware(ctx).then(handleResponse).catch(onerror);
}

// ...
```

执行`middlerware`就是在这里了，将该请求的`ctx`传入之前通过`koa-compose`打包好的`fnMiddleware`中，执行完成后通过`respond`生成最终的响应返回给客户端。

如果`res.statusCode`没有被改过，说明没进入`middleware`，资源未找到，并且也没有报错，所以默认是设置了`404`。后面如果设置了`body`就会改成`200`，如果有别的错误码就会改成别的。

`onFinished()`的话，简单去看了看`on-finished`的[源码](https://github.com/jshttp/on-finished)，就是在HTTP请求/响应关闭(closes)、完成(finishes)或者出错(errors)时，执行一个回调函数。那么这里就是在响应`res`出错的时候，执行`context.onerror()`方法。应该是因为响应出错的时候，有可能不会被后面的`catch`捕捉到，所以这里才额外写了一个方法。

`fnMiddleware(ctx)`传入`ctx`，将所有注册的`middleware`执行一遍，最后最处理完成的`ctx`执行`respond`方法，生成响应返回给客户端。

#### respond()

其实这个`respond()`方法并不是`Application`类的方法，是写在类外的一个`helper`函数。

```js
const isJSON = require('koa-is-json');
const Stream = require('stream');

// ...

/**
 * Response helper.
 */
function respond(ctx) {
  // allow bypassing koa
  if (false === ctx.respond) return;

  const res = ctx.res;
  if (!ctx.writable) return;

  let body = ctx.body;
  const code = ctx.status;

  // ignore body
  if (statuses.empty[code]) {
    // strip headers
    ctx.body = null;
    return res.end();
  }

  if ('HEAD' == ctx.method) {
    if (!res.headersSent && isJSON(body)) {
      ctx.length = Buffer.byteLength(JSON.stringify(body));
    }
    return res.end();
  }

  // status body
  if (null == body) {
    body = ctx.message || String(code);
    if (!res.headersSent) {
      ctx.type = 'text';
      ctx.length = Buffer.byteLength(body);
    }
    return res.end(body);
  }

  // responses
  if (Buffer.isBuffer(body)) return res.end(body);
  if ('string' == typeof body) return res.end(body);
  if (body instanceof Stream) return body.pipe(res);

  // body: json
  body = JSON.stringify(body);
  if (!res.headersSent) {
    ctx.length = Buffer.byteLength(body);
  }
  res.end(body);
}
```

如果设置了`ctx.respond = false`，则跳过koa默认的响应方法。如果`!ctx.writable`（即对应到`res.socket.writable`，或者`res.isfinished`），也跳过默认响应方法。

后面则是对响应的body进行判断和处理，如果不是`string`, `Buffer`, `Stream`等类型，则默认`JSON.stringify`处理后返回。

#### createContext()

```js
/**
 * Initialize a new context.
 *
 * @api private
 */
createContext(req, res) {
  const context = Object.create(this.context);
  const request = context.request = Object.create(this.request);
  const response = context.response = Object.create(this.response);
  context.app = request.app = response.app = this;
  context.req = request.req = response.req = req;
  context.res = request.res = response.res = res;
  request.ctx = response.ctx = context;
  request.response = response;
  response.request = request;
  context.originalUrl = request.originalUrl = req.url;
  context.state = {};
  return context;
}
```

每个请求初始化一个新的`context`，把`ctx`, `res`, `req`互相挂在一起。

::: tip

其实这里有点不太明白，在构造函数里面：

```js
this.context = Object.create(context);
this.request = Object.create(request);
this.response = Object.create(response);
```

已经是继承了一层了，在这里为什么还要再多套一层，又跑一次`Object.create()`。

直接在`createContext`的时候这么写会有什么问题吗：

```js
createContext(req, res) {
  const context = Object.create(context);
  const request = context.request = Object.create(request);
  const response = context.response = Object.create(response);
  // ...
}
```
:::

#### onerror()

```js
// ...

/**
 * Default error handler.
 *
 * @param {Error} err
 * @api private
 */
onerror(err) {
  if (!(err instanceof Error)) throw new TypeError(util.format('non-error thrown: %j', err));

  if (404 == err.status || err.expose) return;
  if (this.silent) return;

  const msg = err.stack || err.toString();
  console.error();
  console.error(msg.replace(/^/gm, '  '));
  console.error();
}

// ...
```

默认的错误处理方法，注意是在`callback()`里面`this.on('error')`注册的，是对`Application`上的`error`进行处理的方法，不是响应的`error`。

`handleRequest()`里面对应的响应的`onerror`是在`context`下实现的。

#### toJSON(), inspect()

```js
const only = require('only');
// ...

/**
 * Return JSON representation.
 * We only bother showing settings.
 *
 * @return {Object}
 * @api public
 */

toJSON() {
  return only(this, [
    'subdomainOffset',
    'proxy',
    'env'
  ]);
}

/**
 * Inspect implementation.
 *
 * @return {Object}
 * @api public
 */

inspect() {
  return this.toJSON();
}

// ...
```

打印`app`时的方法。

`only`就是通过白名单的方式，过滤掉对象中的多余属性，返回一个只包含相应属性的新对象。

## Context [TODO]

## Request [TODO]

## Response [TODO]

## References

- [koajs/koa v2.5.2](https://github.com/koajs/koa/tree/2.5.2)
