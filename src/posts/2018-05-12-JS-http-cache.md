---
layout: post
category: 
tags:
  - http
title: 'HTTP Caching - HTTP 缓存'
description: 'Note about HTTP Cache'
date: 2018-05-12
---

::: warning 
还没写完
:::

# HTTP缓存

[[toc]]

## 可能进行缓存的内容

- `GET`请求的`200 OK`响应，可能是HTML文档、图片、文件等资源。
- `301 Moved Permanently`
- `404 Not Found`
- `206 Partial Content`
- `GET`请求以外的、定义了`cache key`的内容

## 缓存类型

- 私有 `private`：只能被特定用户使用，比如浏览器缓存
- 公有/共享 `public`/`shared`：可以被多个用户使用，比如代理缓存、CDN缓存等

## 缓存控制

### Cache-Control Header

`Cache-Control`在`HTTP/1.1`中加入。在`HTTP/1.0`中不能使用`Cache-Control`，只能使用`Pragma: no-cache`。

`Cache-Control`下的指令在通过 proxy 和 gateway application 时必须被传递，因为在 request/response chain 中的任何部分都可能会被用到。

`Cache-Control`可能使用的指令(Directives)有：
- Cacheability
  - `public`: 表明该响应可以被任何类型缓存。(response only)
  - `private[="<field-name>"]`: 表明该响应（在个别`field-name`中）是针对单个用户的，只能被私有缓存，不能被共享缓存。(response only)
  - `no-cache[="<field-name>"]`: 强制（个别`field-name`）缓存系统向服务器进行验证，避免从缓存系统中获取到过期资源（**注意：不是不缓存**）(request & response)

::: tip PS
没太搞懂这里的`field-name`是通过什么来限定的。一般都不指定`field-name`，代表针对所有缓存系统。MDN的文档就没写`field-name`。
:::

- Expiration
  - `max-age=<seconds>`


#### Cache Request

- `no-store`
- `no-cache`
- `no-transform`
- `only-if-cached`
- `max-age=<seconds>`
- `max-stale[=<seconds>]`
- `min-fresh=<seconds>`

#### Cache Response

- `public`
- `private`
- `must-revalidate`
- `no-store`
- `no-cache`
- `no-transform`
- `proxy-revalidate`
- `max-age=<seconds>`
- `s-maxage=<seconds>`

### 缓存新鲜度

- 客户端发起请求，检查缓存是否命中：
    - 若请求没有在缓存中命中，则直接向服务器转发请求。
    - 若请求在缓存中命中，检查缓存是否fresh：
        - 若fresh，则直接返回缓存资源，状态码`200`
        - 若stale，则通过在请求中添加`If-None-Match`向服务器请求检查资源是否fresh：
            - 若返回`304 Not Modified`，则缓存reset age，

References:
- [HTTP caching | MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [Cache-Control | MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Cache-Control)
- [RFC2616 - Cache-Control](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9)
