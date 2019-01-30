---
layout: post
category: Development
tags:
  - js
  - koa
title: 'Koa Core - 源码阅读 2 - Context'
description: 'Read and learn the source code of koa core. Part 2: Context'
date: 2018-09-26
vssue-title: 'Koa Core - 源码阅读 2 - Context'
---

阅读学习Koa Core源码，基于koa v2.5.2。

Koa的核心代码很少，就四个文件`application`, `context`, `request`, `response`，算上注释和空行目前也还没过2000行代码。

这一篇针对`context`的源码进行阅读学习。

<!-- more -->

# Koa Core

[koajs/koa](https://github.com/koajs/koa/tree/2.5.2)

- `lib/application`
- `lib/context`
- `lib/request`
- `lib/response`

主要这四个文件，当然也还依赖了很多外部库，以及koa的其他仓库。这一篇看第二部分`lib/context`。


[[toc]]

## Context

```js
/**
 * Context prototype.
 */

const proto = module.exports = {
  // ...
}
```

`context`, `request`, `response`其实exports的都是一个对象，而不是一个class。

在`Application`的代码里可以看到，都是通过`Object.create(context)`的方式创建的。所以这里的`proto`就是实际使用中`ctx`的`prototype`。其实不是很准确，实际使用的`ctx`是`Object.create(Object.create(context))`，所以准确来说，`proto`是`ctx`的原型对象的原型对象。实际都在原型链上，没有太大差别。

---

### Delegation

```js

const delegate = require('delegates');

/**
 * Response delegation.
 */

delegate(proto, 'response')
  .method('attachment')
  .method('redirect')
  .method('remove')
  .method('vary')
  .method('set')
  .method('append')
  .method('flushHeaders')
  .access('status')
  .access('message')
  .access('body')
  .access('length')
  .access('type')
  .access('lastModified')
  .access('etag')
  .getter('headerSent')
  .getter('writable');

/**
 * Request delegation.
 */

delegate(proto, 'request')
  .method('acceptsLanguages')
  .method('acceptsEncodings')
  .method('acceptsCharsets')
  .method('accepts')
  .method('get')
  .method('is')
  .access('querystring')
  .access('idempotent')
  .access('socket')
  .access('search')
  .access('method')
  .access('query')
  .access('path')
  .access('url')
  .access('accept')
  .getter('origin')
  .getter('href')
  .getter('subdomains')
  .getter('protocol')
  .getter('host')
  .getter('hostname')
  .getter('URL')
  .getter('header')
  .getter('headers')
  .getter('secure')
  .getter('stale')
  .getter('fresh')
  .getter('ips')
  .getter('ip');
```

这部分虽然在文件的末尾，但是其实是最主要的部分，所以写在开头。

`delegate`翻译过来就是**委托、代理**的意思，作用很好理解。通过`delegate`函数，将`response`和`request`中的方法、成员变量等，直接挂在`ctx`上。

举例来说：

- 设置`ctx.body = ...`，实际上是`ctx.response.body = ...`，设置响应的`body`。
- 获取`ctx.method`，实际上是获取`ctx.request.method`，查看请求的`method`。

---

### assert(), throw()

```js
const createError = require('http-errors');
const httpAssert = require('http-assert');

//...

const proto = module.exports = {
  //...

  /**
   * Similar to .throw(), adds assertion.
   *
   *    this.assert(this.user, 401, 'Please login!');
   *
   * See: https://github.com/jshttp/http-assert
   *
   * @param {Mixed} test
   * @param {Number} status
   * @param {String} message
   * @api public
   */

  assert: httpAssert,

  /**
   * Throw an error with `msg` and optional `status`
   * defaulting to 500. Note that these are user-level
   * errors, and the message may be exposed to the client.
   *
   *    this.throw(403)
   *    this.throw('name required', 400)
   *    this.throw(400, 'name required')
   *    this.throw('something exploded')
   *    this.throw(new Error('invalid'), 400);
   *    this.throw(400, new Error('invalid'));
   *
   * See: https://github.com/jshttp/http-errors
   *
   * @param {String|Number|Error} err, msg or status
   * @param {String|Number|Error} [err, msg or status]
   * @param {Object} [props]
   * @api public
   */

  throw(...args) {
    throw createError(...args);
  },

  //...
}
```

用于抛出错误信息，依赖于`http-errors`和`http-assert`这两个库。`assert`如果不满足要求，就会同样抛出一个`http-errors`的`HttpError`，和`throw()`的效果是一样的。

在`Application`中的`handleRequest`部分我们可以看到：

```js {4,7}
handleRequest(ctx, fnMiddleware) {
  const res = ctx.res;
  res.statusCode = 404;
  const onerror = err => ctx.onerror(err);
  const handleResponse = () => respond(ctx);
  onFinished(res, onerror);
  return fnMiddleware(ctx).then(handleResponse).catch(onerror);
}
```

也就是说，`assert()`和`throw()`抛出的错误是通过`context`的`onerror()`方法处理的。

---

### onerror()

```js {25}
const statuses = require('statuses');

//...

const proto = module.exports = {
  //...

  /**
   * Default error handling.
   *
   * @param {Error} err
   * @api private
   */

  onerror(err) {
    // don't do anything if there is no error.
    // this allows you to pass `this.onerror`
    // to node-style callbacks.
    if (null == err) return;

    if (!(err instanceof Error)) err = new Error(util.format('non-error thrown: %j', err));

    let headerSent = false;
    if (this.headerSent || !this.writable) {
      headerSent = err.headerSent = true;
    }

    // delegate
    this.app.emit('error', err, this);

    // nothing we can do here other
    // than delegate to the app-level
    // handler and log.
    if (headerSent) {
      return;
    }

    const { res } = this;

    // first unset all headers
    /* istanbul ignore else */
    if (typeof res.getHeaderNames === 'function') {
      res.getHeaderNames().forEach(name => res.removeHeader(name));
    } else {
      res._headers = {}; // Node < 7.7
    }

    // then set those specified
    this.set(err.headers);

    // force text/plain
    this.type = 'text';

    // ENOENT support
    if ('ENOENT' == err.code) err.status = 404;

    // default to 500
    if ('number' != typeof err.status || !statuses[err.status]) err.status = 500;

    // respond
    const code = statuses[err.status];
    const msg = err.expose ? err.message : code;
    this.status = err.status;
    this.length = Buffer.byteLength(msg);
    this.res.end(msg);
  },

  //...
}
```

默认用于处理`error`的函数，传入的参数就是`Error`实例。将`Error`转换为相应的Http响应，通过node http原生的`res`发送给客户端。

注意区分`context`的`onerror()`和`application`的`onerror`。实际上，是先进入`context`的`onerror()`，然后通过上面的`this.app.emit('error', err, this);`，将`error`事件emit，然后`application`的`onerror()`作为handler再处理这个错误。

---

### cookies()

```js
const Cookies = require('cookies');
const COOKIES = Symbol('context#cookies');

//...

const proto = module.exports = {
  //...

  get cookies() {
    if (!this[COOKIES]) {
      this[COOKIES] = new Cookies(this.req, this.res, {
        keys: this.app.keys,
        secure: this.request.secure
      });
    }
    return this[COOKIES];
  },

  set cookies(_cookies) {
    this[COOKIES] = _cookies;
  }
};
```

用于设置和获取`cookies`，依赖于`cookies`库。在创建`new Cookies()`实例的时候，传入了`request`, `response`和相关参数，所以就不用在代码的其他地方处理cookies相关的内容了。

---

### inspect(), toJSON()

```js
const util = require('util');

//...

const proto = module.exports = {
  //...

  /**
   * util.inspect() implementation, which
   * just returns the JSON output.
   *
   * @return {Object}
   * @api public
   */

  inspect() {
    if (this === proto) return this;
    return this.toJSON();
  },

  /**
   * Return JSON representation.
   *
   * Here we explicitly invoke .toJSON() on each
   * object, as iteration will otherwise fail due
   * to the getters and cause utilities such as
   * clone() to fail.
   *
   * @return {Object}
   * @api public
   */

  toJSON() {
    return {
      request: this.request.toJSON(),
      response: this.response.toJSON(),
      app: this.app.toJSON(),
      originalUrl: this.originalUrl,
      req: '<original node req>',
      res: '<original node res>',
      socket: '<original node socket>'
    };
  },

  //...
}

/**
 * Custom inspection implementation for newer Node.js versions.
 *
 * @return {Object}
 * @api public
 */

/* istanbul ignore else */
if (util.inspect.custom) {
  module.exports[util.inspect.custom] = module.exports.inspect;
}
```

这一部分主要是自定义`inspect()`方法，没太多可说的。

## Summary

`context`部分的代码很少，主要是起到了代理`request`, `response`, `cookies`等相关方法，在koa的目前版本中方便直接通过`ctx`进行各种操作。

实际上，通过`ctx`代理`request`, `response`的部分方法和变量，虽然使用起来比较方便，但是可能会引起一些语义上的不明确，比如`request`和`response`其实都有`headers`，为什么`ctx`代理的是`request`的`headers`而不是`response`的`headers`？

在使用过程中有时候确实会搞不清楚`ctx`下代理的是哪一个，反而不如直接用`ctx.response.xxx`或者`ctx.request.xxx`来得更清楚一些，也可以提高代码的可读性。

现在koa的仓库里专门有一个issue讨论这个问题，不知道在koa3中会不会有所改变：https://github.com/koajs/koa/issues/849

## References

- [koajs/koa v2.5.2](https://github.com/koajs/koa/tree/2.5.2)

## Related posts

> Koa源码阅读：  
> [Koa Core - 源码阅读 1 - Application](/posts/2018/08/15/koa-core-read-source-code-part-1.html)  
> [Koa Core - 源码阅读 3 - Request & Response](/posts/2018/11/06/koa-core-read-source-code-part-3.html)
