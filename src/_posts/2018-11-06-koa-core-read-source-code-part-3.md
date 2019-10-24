---
category: Development
tags:
  - js
  - nodejs
  - koa
title: 'Koa Core - 源码阅读 3 - Request & Response'
description: 'Read and learn the source code of koa core. Part 3: Request & Response'
date: 2018-11-06
vssue-title: 'Koa Core - 源码阅读 3 - Request & Response'
---

阅读学习Koa Core源码，基于koa v2.5.2。

Koa的核心代码很少，就四个文件`application`, `context`, `request`, `response`，算上注释和空行目前也还没过2000行代码。

这一篇针对`request`, `response`的源码进行阅读学习。

<!-- more -->

# Koa Core

[koajs/koa](https://github.com/koajs/koa/tree/2.5.2)

- `lib/application`
- `lib/context`
- `lib/request`
- `lib/response`

主要这四个文件，当然也还依赖了很多外部库，以及koa的其他仓库。这一篇看后两部分`lib/request`, `lib/response`。

这两部分代码行数比较多，就不把所有代码贴出来了。

<TOC />

## Request

### Request Socket

> `socket()`

获取请求对应的`socket`对象，即`req.socket`。

### Request URL 相关

> `url()`, `origin()`, `href()`, `path()`, `query()`, `querystring()`, `search()`, `host()`, `hostname()`, `URL()`, `subdomains()`, `protocol()`, `secure()`

URL相关的一系列方法，用于解析、获取URL中的相关信息。

用到的库包括：`querystring`, `parseurl`, `url.format`, `url.URL`

注意区分`url()`和`URL()`:

- `url()`直接对应的是`req.url`
- `URL()`是通过[`url.URL`](https://nodejs.org/api/url.html#url_class_url)类，将`protocol()`, `host()`, `req.url`拼接在一起得到的`URL`对象

### Request Header 获取

> `header()`, `headers()`, `get()`

`header()`和`headers()`是等价的别名，针对request的headers信息，设置相应的getter和setter。只有`get header()`和`get headers()`被代理到了`ctx`上。

`get()`是一个方法，用于获取header中的字段。

例如：`request.header['Content-Type']` 等价于 `request.get('Content-Type')`

### Request Header 相关

通过请求中的各个headers，获取相关的内容：

- `method()`: 获取请求的method。
- `idempotent()`: 判断请求是否是幂等的，主要是通过请求的方法是否是`'GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS', 'TRACE'`之一来判断。
- `fresh()`: 判断请求的内容是否未过期，就是判断请求的`Last-Modified`和`Etag`是否匹配，通过第三方库`fresh`实现。
- `stale()`: 判断请求的内容是否已过期，即`!fresh`。
- `charset()`: 获取请求的`Content-Type`中的`charset`，通过第三方库`content-type`辅助实现。
- `length()`: 获取请求的`Content-Length`。
- `ips()`: 如果请求经过了反向代理，获取请求的`X-Forwarded-For`中的ip数组。
- `ip()`: 如果请求经过了反向代理，获取请求的`X-Forwarded-For`中的ip数组的第一个ip。如果没有经过反向代理，返回`socket.remoteAddress`。
- `is()`: 判断请求的`Content-Type`是否是某种或某些类型，通过第三方库`type-is`实现。
- `type()`: 获取请求的`Content-Type`。

- `accept()`: 解析请求的`Accept-*`一系列headers。通过第三方库`accepts`实现，返回该库的一个`Accept`对象。
- `accepts()`: 即`accept.types`方法，判断请求的`Content-Type`是否匹配某种或某些类型。返回传入的最匹配的类型，如果均不匹配返回`false`。
- `acceptsCharsets()`: 即`accept.charsets`方法，判断`Accept-Charset`。
- `acceptsLanguages()`: 即`accept.languages`方法，判断`Accept-Language`。
- `acceptsEncodings()`: 即`accept.encodings`方法，判断`Accept-Encoding`。

### Request 其它方法

> `inspect()`, `toJSON()`

Request的`inspect`方法。

## Response

### Response Socket

> `socket()`

获取响应对应的`socket`对象，即`res.socket`。

### Response Header 设置

`header()`和`headers()`是等价的别名，针对response的headers信息，仅有getter，而没有setter。`get()`是一个方法，用于获取header中的字段。这三个与request中对应的方法相同，但注意均没有被代理到`ctx`上。

`set()`是一个方法，用于设置响应中对应的header字段。

`append()`方法，用于在相应的header字段中添加内容。和`set()`的区别在于，如果对应字段已存在，`set()`是直接替换相应内容，而`append()`是以数组形式追加相应内容。例如：

```js
response.set('Foo', 'bar')
response.set('Foo', 'baz') // -> Foo: baz

response.set('Fo', 'bar')
response.append('Fo', 'baz') // -> Fo: bar; baz
```

`remove()`方法则是从header中移除相应字段。

`set(), append(), remove()`均被代理到了`ctx`上。

### Response Header 相关

- `length()`: 用于获取和设置响应的`Content-Length`，若没有手动设置过，则自动计算`body`的长度。
- `vary()`: 用于设置响应的`Vary`，通过第三方库`vary`实现。
- `lastModified()`: 用于获取和设置响应的`Last-Modified`。
- `eTag()`: 用于获取和设置响应的`ETag`。
- `type()`: 用于获取和设置响应的`Content-Type`，通过第三方库`cache-content-type`来辅助实现。
- `is()`: 用于判断响应的`Content-Type`是否属于某些类型，通过第三方库`type-is`来辅助实现。
- `attachment()`: 用于设置响应的`Content-Disposition`为`attachment`，同时可以传入`filename`。如果传入`filename`，则会通过`path.extname`判断扩展名，自动设置相应的`Content-Type`。通过第三方库`content-disposition`来辅助实现。
- `redirect()`: 用于设置响应的`Location`，同时将`status`设置为302（除非手动设置为301）。如果请求的`Referrer`存在，可以通过传入`'back'`跳转回之前页面。同时根据请求的`Accepts`预设了返回的`body`内容和相应的`Content-Type`.

### Response 具体响应

- `status()`: 获取和设置响应的HTTP状态码，并将请求的`message`和`body`设置为相应的信息。通过第三方库`statuses`来判断状态码是否合法，并获取对应状态码的状态信息。
- `message()`: 获取和设置响应的HTTP状态码信息。如果使用的HTTP版本低于2.0，将会根据`status()`自动设置（HTTP2.0中不再包含状态信息，只包含状态码）。
- `body()`: 获取和设置响应的主体，并根据传入的类型自动设置`Content-Type`, `Content-Length`等相关headers，以及设置状态码为`200 OK`或`204 No Content`。

注意这三个方法会彼此调用，一般只设置`status()`或只设置`body()`即可。

### Response 状态

- `headerSent()`: 判断响应的headers的内容是否已经写入`socket`，如果已经写入了，上述所有修改headers的方法都将失效，直接return。
- `writable()`: 判断响应的`socket`是否可写，如果响应已结束或者socket已关闭则不可写。
- `flushHeaders()`: 立即将现在已经设置好的headers发送，并开始body部分。

### Response 其它方法

> `inspect()`, `toJSON()`

Response的`inspect`方法。

## More

Koa对request和response的别名，以及在context上的代理，其实并不直观，不太符合语义上的直觉。

很早就有一个Issue([Request / response aliases are bad idea #849](https://github.com/koajs/koa/issues/849))提出过这个问题，里面的讨论有些还是挺有意思的。

其实了解了代码的思想之后，这些就是使用习惯上的问题。

Koa的核心代码其实很短和好理解，还有很多就是中间件、第三方库的内容了。下一篇会将`koa-compose`过一遍，看看koa是怎么把多个中间件按顺序合成一个的。

## References

- [koajs/koa v2.5.2](https://github.com/koajs/koa/tree/2.5.2)

## Related posts

> Koa源码阅读：  
> [Koa Core - 源码阅读 1 - Application](/posts/2018/08/15/koa-core-read-source-code-part-1.html)  
> [Koa Core - 源码阅读 2 - Context](/posts/2018/09/26/koa-core-read-source-code-part-2.html)
