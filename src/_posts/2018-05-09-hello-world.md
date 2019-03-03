---
category: Essay
title: 'Hello, World!'
description: 'The first post of my blog'
date: 2018-05-09
vssue-title: 'Hello, World!'
---


自从学了 Vue 之后，jQuery 就不说了，连正经的 HTML 都不想写了，所以连 Blog 也想用 Vue 来制作。

常用的博客框架如 Jekyll、Hexo 等，都有自己的一套模板系统，强行使用 Vue 的话，两边的功能和特点都不能完全发挥。

Nuxt 是一个较为成熟的 SSR 框架，比较适合做应用，用来写 Blog 还是有点太重量级了。

<!-- more -->

后来在做学校镜像站前端的时候，也遇到了这个问题，像 TUNA 他们用的就是 Jekyll。后来我是在 [vue-cli][vue-cli] v2 的 [webpack template][webpack template] 的基础上做了一些修改，作为镜像站网站的解决方案。

然后某一天，在看 [Github Trending][trending] 的时候，突然发现了 VuePress！

> **[Vuepress][vuepress] - Vue-powered static site generator**

正是梦寐以求的，还是 Evan 亲自操刀的项目！在 [Vuepress][vuepress] 的介绍中，[Why not..](https://vuepress.vuejs.org/guide/#why-not) 也对其他类似的项目进行了比较，和我自己的想法也比较接近。

于是我很激动地扑了进来，个人网站也终于应运而生啦~:tada:

- [Vuepress Homepage][vuepress]
- [Vuepress Github Repo][vuepress_repo]

---

现在 [Vuepress][vuepress] 还在开发阶段，很多功能不完备，尤其并没有像 Jekyll 和 Hexo 那样专门针对 Blog 的支持（毕竟最开始只是为了写文档用的嘛）：

- Plugin API 才讨论个初稿，还没有 Implement
- Custom Theme 的支持还有问题
- Blog 相关的功能比如 Category, Tag, Draft 等等都还没有，要在 Plugin 初步完备之后才能逐步支持

我也在积极参与这个项目:smiling_imp:所以个人网站也就跟着 Vuepress 一起逐步完善吧~

**PS:**

在参与开发的过程中认识了 [ulivz](https://github.com/ulivz) 和 [jason](https://github.com/ycmjason)，甚至可以在 slack 上欢乐地扯皮，GitHub 不愧是一个出色的同性交友平台啊:sweat_smile:


[vuepress]: <https://vuepress.vuejs.org/>  "Vuepress"
[vuepress_repo]: <https://github.com/vuejs/vuepress>  "Vuepress Repo"
[trending]: <https://github.com/trending>  "Github Trending"
[vue-cli]: <https://github.com/vuejs/vue-cli>  "vue-cli"
[webpack template]: <https://github.com/vuejs-templates/webpack>  "vue-webpack-template"
