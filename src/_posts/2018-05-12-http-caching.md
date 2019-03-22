---
category: Development
tags:
  - http
title: 'HTTP Caching - HTTP 缓存'
description: 'Note about HTTP Caching - 关于HTTP缓存的相关内容整理'
date: 2018-05-12
vssue-title: 'HTTP Caching - HTTP 缓存'
---

缓存对于前端性能优化等方面都有着重要意义。这篇把HTTP缓存相关的知识点总在这里，部分内容自己重新描述了一下，加深理解。

<!-- more -->

::: warning TODOS
- RFC2616 Capter 13: Caching in HTTP
:::

# HTTP Caching - HTTP 缓存

<TOC />

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

### Related HTTP Headers

- `Age`
- [`Cache-Control`](#cache-control-header) (`Pragma` in `HTTP/1.0`)
- `Expires`
- `ETag`
- `If-Match`
- `If-None-Match`
- `If-Range`
- `If-Modified-Since`
- `If-Unmodified-Since`
- `Last-Modified`
- `Vary`


#### Age Header

Syntax:

```
Age: <seconds>
```

Example:

```
Age: 24
```

Type: Response Header

值为seconds数，仅在响应中出现，表明该资源在缓存系统中存在的时间。如果`Age: 0`，则表明该资源刚刚从源服务器获取。

任何包含缓存系统的`HTTP/1.1`服务器，缓存系统的响应必须(MUST)返回`Age` Header。

`Age`的值应该(SHOULD)至少为31 bits。如果值overflow了，则必须(MUST)返回`2147483648 (2^31)`。


#### Cache-Control Header

Examples:

```
Cache-Control: no-cache no-store must-revalidate
Cache-Control: max-age=3600 must-revalidate
```

Type: General Header

`Cache-Control`在`HTTP/1.1`中加入。在`HTTP/1.0`中不能使用`Cache-Control`，只能使用`Pragma: no-cache`。

`Cache-Control`下的指令在通过 proxy 和 gateway application 时必须被传递，因为在 request/response chain 中的任何部分都可能会被用到。

`Cache-Control`可能使用的指令(Directives)有：

> 注：`[...]`内代表可选参数

- **Cacheability**
  - `public`: 表明该响应可以(MAY)被任何类型缓存。(response only)
  - `private[="<field-name>"]`: 表明该响应是针对单个用户的，只能(MAY)被私有缓存，不能(MUST NOT)被共享缓存。(response only)

::: tip PS
可以通过`field-name`对个别缓存系统进行限定，但没太搞懂这里的`field-name`指的是什么。一般都不指定`field-name`，代表针对所有缓存系统。目前MDN的文档上就没写`field-name`。
:::

- **Expiration**
  - `max-age=<seconds>`: 在请求中出现，表明客户端愿意接收的资源的最大age，如果没有`max-stale`一起出现，则拒绝接收过期资源。在响应中出现，表明设置该响应资源的最大过期时间。(request & response)
  - `min-fresh=<seconds>`: 表明客户端希望接收到的资源的最低剩余新鲜度，即距离过期还剩的最少时间。(request only)
  - `max-stale[=<seconds>]`: 表明客户端愿意接收过期资源。如果限定了`<seconds>`，则表明愿意接收过期时间不超过`<seconds>`的资源。如果不限定，则表明愿意接收任何过期资源。
  - `s-maxage=<seconds>`: 只针对共享缓存，不针对私有缓存（被私有缓存忽略）。`s-maxage`将覆盖所有其他的`max-age`指令或`Expires` Header所设定的过期时间。(response only)

- **Revalidation and reloading**
  - `no-cache[="<field-name>"]`: 不论缓存资源是否过期，强制缓存系统向服务器进行验证，避免从缓存系统中获取到过期资源（**注意：不是说没有缓存，只是必须再次验证，避免获取到过期资源。如果验证结果是`304 Not Modified`则可以使用缓存副本**）。如果在请求中出现`no-cache`，则不应该(SHOULD NOT)再出现`min-fresh`, `max-stale`或`max-age`。(request & response)
  - `only-if-cached`: 在发送请求时加入，只请求已缓存的资源，避免向源服务器重载或验证。此时缓存服务器应当返回一个缓存副本，或者`504 Gateway Timeout`。如果配置了缓存集群，则可以将该请求分发到缓存集群中。(request only)
  - `must-revalidate`: 只能在响应中出现，表明该响应资源的缓存一旦过期，必须向源服务器发送重验证，而不能将过期资源提供给客户端。如果缓存系统不能访问到源服务器进行重验证，则返回`504 Gateway Timeout`，不能返回未验证的过期资源。一旦设置`must-revalidate`，则忽略客户端请求的`max-stale`，仅遵守源服务器提供的`max-age`或者`Expires`。(response only)
  - `proxy-revalidate`: 只能在响应中出现，与`must-revalidate`作用相同，但仅对非共享缓存/私有缓存有效。(response only)

- **Other**
  - `no-store`: 禁止缓存系统对资源进行任何存储，即禁止使用缓存。如果在请求中出现，则缓存系统不能(MUST NOT)存储该请求的任何部分，以及针对该请求的响应。如果在响应中出现，则缓存系统不能(MUST NOT)存储该响应的任何部分，以及引发该响应的请求。“不能(MUST NOT)存储”的意思是，缓存系统不能有意地将其存储到非易失性存储器中，且在分发完相关资源后，立即从易失性存储器中移除。主要是为了避免敏感信息的泄露，但恶意缓存服务器可以选择不遵守此规定，并且浏览器的历史记录Buffer是会正常存储相关资源的。(request & response)
  - `no-transform`: 禁止缓存系统对资源进行转换，禁止缓存系统和代理服务器改变相关的Headers(`Content-Encoding`, `Content-Range`, `Content-Type`)。缓存系统常常会把某些媒体类型进行转换，用以节省缓存存储空间，或降低传输负载，而`no-transform` Header禁止进行任何转换。(request & response)

##### 请求和响应中的`Cache-Control`小结

- Cache Request Directives
  - `no-store`: 缓存系统不能(MUST NOT)存储该请求的任何部分，以及针对该请求的响应。
  - `no-cache`: 无论资源是否过期，缓存系统必须向源服务器发送验证。
  - `no-transform`: 禁止缓存系统对资源进行转换。
  - `only-if-cached`: 只接收已缓存资源，避免向源服务器请求。
  - `max-age=<seconds>`: 表明客户端愿意接收的资源的最大age。如果没有`max-stale`一起出现，则拒绝接收过期资源。
  - `max-stale[=<seconds>]`: 表明客户端愿意接收过期资源。如果有参数，则资源的过期时间不能超过`<seconds>`。
  - `min-fresh=<seconds>`: 表明客户端愿意接收的资源至少还有多久过期。

- Cache Response Directives
  - `public`: 允许共享和私有缓存。
  - `private`: 仅允许私有缓存。
  - `no-store`: 缓存系统不能(MUST NOT)存储该响应的任何部分，以及引发该响应的请求。
  - `no-cache`: 无论资源是否过期，缓存系统必须向源服务器发送验证。
  - `no-transform`: 禁止缓存系统对资源进行转换。
  - `must-revalidate`: 表明该响应资源的缓存一旦过期，必须向源服务器发送重验证，而不能将过期资源提供给客户端，忽略请求的`max-stale`。
  - `proxy-revalidate`: 与`must-revalidate`作用相同，仅对共享缓存生效。
  - `max-age=<seconds>`: 设置该响应资源的最大过期时间。
  - `s-maxage=<seconds>`: 覆盖共享缓存中所有其他的过期时间指令。在私有缓存中被忽略。

:::warning 一些需要注意的点
- 部分指令只能在response或request中出现，且两边都能出现的时候意义不完全相同。
- `no-cache`意思是必须验证，不代表不缓存。`no-store`代表不缓存。
- `no-cache`, `must-revalidate`, `max-age=0`的区别。`no-cache`和`max-age`既可以在请求也可以响应中，`must-revalidate`只能在响应中。`no-cache`不论资源是否过期都要验证，`must-revalidate`只有资源过期时必须验证，`max-age=0`代表资源始终是过期的（response），或者表明请求希望得到的资源最大`age`为0（request）。
:::


#### Expires Header

Syntax:

```
Expires: <http-date>
```

Example:

```
Expires: Wed, 21 Oct 2015 07:28:00 GMT
```

Type: Response Header

值为一个HTTP-date timestamp，仅在响应中出现，设置该资源的过期时间，超过该时间视为stale。

如果值不是合法的HTTP-date timestamp，则视为该资源已经过期。

如果`Cache-Control`中设置了`max-age`或`s-maxage`，该字段被忽略。


#### Etag Header

Syntax:

```
ETag: W/"<etag_value>"
ETag: "<etag_value>"
```

Examples:

```
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
ETag: W/"0815"
```

Type: Response Header

当前资源的Entity Tag，可以用于配合`If-Match`, `If-None-Match`, `Vary`来判断是不是同一资源。

`W/`表明使用Weak Validator。

> Etags的生成方法没有在HTTP中指明，常用的方法包括对资源内容进行Hash，对last modification timestamp进行Hash，或者单纯设定一个修订版本号。


#### If-Match Header

Syntax:

```
If-Match: <etag_value>
If-Match: <etag_value>, <etag_value>, …
```

Examples:

```
If-Match: "bfc13a64729c4290ef5b2c2730249c88ca92d82d"
If-Match: W/"67ab43", "54ed21", "7892dd"
If-Match: *
```

Type: Request header

值为entity-tag，仅在请求中出现。当所请求资源的entity-tag匹配时，该请求才生效。如果没有匹配资源，或者`If-Match: *`但没有资源存在时，服务器不(MUST NOT)执行该请求，(MUST)返回`412 Precondition Failed`。

对于需要更新资源的请求(比如PUT)来说，只有当entity-tag匹配时才会更新资源。

如果一个请求在不考虑`If-Match`的情况下，就会返回`2xx/412`之外的状态，则忽略`If-Match`。(应该指的是`If-Match`的优先级比较低)

如果请求同时存在`If-Match + If-None-Match` 或者 `If-Match + If-Modified-Since`，RFC2616中没有明确规定。

> The result of a request having both an If-Match header field and either an If-None-Match or an If-Modified-Since header fields is undefined by this specification.

:::tip PS
在RFC2616中写明，服务器必须使用强验证来比较`If-Match`中的entity-tag：

> A server MUST use the strong comparison function (see section 13.3.3) to compare the entity tags in If-Match.

在MDN文档中，则说明如果加了`W/`前缀，则可以使用弱验证:

> The comparison with the stored ETag uses the strong comparison algorithm, meaning two files are considered identical byte to byte only. This is weakened when the  W/ prefix is used in front of the ETag.

可能后者是Mozilla的implementation，在RFC2616的examples里面没有加`W/`前缀的例子，上面的examples是用的MDN上的。

在缓存方面其实一般都是用`If-None-Match`。但是`If-Match`功能比较接近，所以也一并列出来了。
:::

#### If-None-Match Header

Syntax:

```
If-None-Match: <etag_value>
If-None-Match: <etag_value>, <etag_value>, …
```

Examples:

```
If-None-Match: "bfc13a64729c4290ef5b2c2730249c88ca92d82d"
If-None-Match: W/"67ab43", "54ed21", "7892dd"
If-None-Match: *
```

Type: Request header

值为entity-tag，仅在请求中出现。当所请求资源的entity-tag没有匹配时，该请求才生效。如果存在匹配资源，或者`If-None-Match: *`且有资源存在时，服务器不(MUST NOT)执行该请求，且对于GET和HEAD请求应该(SHOULD)返回`304 Not Modified`并添加相应的缓存相关headers(特别是要添加`ETag`)，而对于其他请求方法(MUST)返回`412 Precondition Failed`。

对于需要更新资源的请求(比如PUT)来说，只有相应资源不存在时才会生效，可以用来避免客户端对已存在的资源进行更新。

如果一个请求的`If-None-Match`没有匹配到资源，则服务器必须(MUST)忽略该请求中的`If-Modified-Since`。也就是说，只要没有entity-tag匹配到，不管`If-Modified-Since`的结果如何，服务器就不能(MUST NOT)返回`304 Not Modified`。

如果一个请求在不考虑`If-None-Match`的情况下，就会返回`2xx/304`(应该还包括`412`，但是RFC2616上没写明)之外的状态，则忽略`If-None-Match`。(同样应该指的是`If-None-Match`的优先级比较低)

:::tip PS
在RFC2616中写明，服务器只能对GET和HEAD请求使用弱验证来比较`If-None-Match`中的entity-tag：

> The weak comparison function can only be used with GET or HEAD requests.

在MDN文档中，则只说明使用弱验证:

> The comparison with the stored ETag uses the weak comparison algorithm.
:::


#### If-Modified-Since Header

Syntax:

```
If-Modified-Since: <day-name>, <day> <month> <year> <hour>:<minute>:<second> GMT
```

Examples:

```
If-Modified-Since: Wed, 21 Oct 2015 07:28:00 GMT
```

Type: Request header

仅在请求中出现，且只能在GET或HEAD中使用。如果请求的资源在给定时间后被修改，则像普通GET请求一样返回`200`。如果没有被修改，则返回`304 Not Modified`。

在和`If-None-Match`一起出现时，将被忽略。


#### If-Unmodified-Since Header

Syntax:

```
If-Unmodified-Since: <day-name>, <day> <month> <year> <hour>:<minute>:<second> GMT
```

Examples:

```
If-Unmodified-Since: Wed, 21 Oct 2015 07:28:00 GMT
```

Type: Request header

仅在请求中出现。如果请求的资源在给定时间没有被修改，则服务器应该(SHOULD)当作没有`If-Unmodified-Since`存在一样处理该请求。如果在给定时间后有被修改，则服务器不(MUST NOT)处理该请求，并返回`412 Precondition Failed`。

如果一个请求在不考虑`If-Unmodified-Since`的情况下，就会返回`2xx/412`之外的状态，则忽略`If-Unmodified-Since`。

:::tip PS
在缓存方面其实一般都是用`If-Modified-Since`。但是`If-Unmodified-Since`功能比较接近，所以也一并列出来了。
:::

#### Last-Modified Header

Syntax:

```
Last-Modified: <day-name>, <day> <month> <year> <hour>:<minute>:<second> GMT
```

Example:

```
Last-Modified: Wed, 21 Oct 2015 07:28:00 GMT
```

Type: Response Header

仅在响应中出现，表明源服务器上该资源的最后修改时间。可以用来验证资源是否是相同的，精确性比`ETag`低，大部分情况下仅作为备用机制。

对于该值的准确意义，与源服务器的实现方式和资源的类型有关。对于文件资源，可以是filesystem的last-modified time；对于数据库gateway，可以是记录的last-update timestamp等等。

源服务器不能(MUST NOT)把`Last-Modified`的值设置为比消息源(message origination，我理解为请求的时间)更晚的时间。如果得到的时间确实超过消息源时间，则必须(MUST)将`Last-Modified`设置为与消息源一样的时间。

`HTTP/1.1`应该(SHOULD)在任何可行的情况下，尽可能发送`Last-Modified` Header。

#### Vary Header

Syntax:

```
Vary: *
Vary: <header-name>, <header-name>, ...
```

Example:

```
Vary: User-Agent
```

Type: Response Header

仅在响应中出现，表明在后续的请求中，要根据设置的Header来判断是否能使用该资源的缓存。

如果设置`Vary: *`，表明缓存系统无法通过Header来判断是否可以返回该资源，相当于每个不同的请求都不能使用该资源的缓存。

`HTTP/1.1`服务器对在所有可缓存的响应中都应该(SHOULD)包含`Vary` Header。

> 大部分常见的会用到`Accept-Encoding`


### Expiration Model [TODO]

- 客户端发起请求，检查缓存是否命中：
  - 若请求没有在缓存中命中，则直接向服务器转发请求，然后缓存响应资源。
  - 若请求在缓存中命中，检查缓存是否fresh：
    - 若fresh，则直接返回缓存资源，状态码`200`
    - 若stale，则通过在请求中添加`If-None-Match`向服务器请求检查资源是否fresh：
      - 若返回`304 Not Modified`，则缓存重置资源`Age`，并将缓存资源返回给客户端
      - 若返回`200`，则缓存新的资源，并返回给客户端

资源“保鲜”时长：

```
freshness_lifetime = `max-age` || (`Expires` - `Date`) || ((`Date` - `Last-Modified`) * 10%)
```

资源过期时间：

```
expiration_time = response_time + freshness_lifetime - current_age
```

`response_time`表示客户端接收到此响应的时间点。

### Validation Model [TODO]

#### Last-Modified / Etag

#### Weak and Strong Validators

## References

- [HTTP caching | MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [Cache-Control | MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Cache-Control)
- [HTTP/1.1: Caching in HTTP - RFC2616](https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html)
- [HTTP/1.1: Header Field Definitions - RFC2616](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html)
- [HTTP ETag - WikiPedia](https://en.wikipedia.org/wiki/HTTP_ETag)
- [web性能优化之：no-cache与must-revalidate深入探究](https://www.cnblogs.com/chyingp/p/no-cache-vs-must-revalidate.html)


## 写在后面

研二快结束了，这一两个月在找暑期实习。

在面腾讯SNG前端的时候，对缓存这部分好像挺重视的。但是当时还没怎么好好看过这部分内容，基本没答上什么，二面面试官就让我趁这两个月回去好好看看。（听这话的意思好像是在说我已经稳了，但是没想到HR面之后已经过了一个月，还是没有任何消息……好慌:sweat_smile:）

实习的事先不论，想好好做前端的话，这些该补的还是要补上。

----update20180601

拿到腾讯SNG的前端实习offer啦，下个月去深圳实习~
