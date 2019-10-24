---
category: Development
tags:
  - js
  - vue
  - prettier
title: '如何让 Prettier 更好地处理 Vue 文件'
description: '如何让 Prettier 更好地处理 Vue 文件'
date: 2019-10-24
vssue-title: '如何让 Prettier 更好地处理 Vue 文件'
---

Prettier 支持处理 Vue 文件，但大体上是将其作为含有部分特殊语法的 HTML 文件处理，这样会和 Vue Style Guide 有部分冲突，并且无法处理 Custom Blocks。为了解决这些问题，可以使用 [eslint-plugin-prettier-vue](https://github.com/meteorlxy/eslint-plugin-prettier-vue)，让 Prettier 更好地处理 Vue SFC。

这篇文章对 [eslint-plugin-prettier-vue](https://github.com/meteorlxy/eslint-plugin-prettier-vue) 的实现思路进行简单的介绍和总结。

<!-- more -->

## 概述

Prettier 1.15 开始支持处理 Vue 文件，但大体上是把 Vue 文件当作普通的 HTML 文件处理。这样存在两个问题：

- [Vue Style Guide](https://vuejs.org/v2/style-guide/) 对 SFC 中 `<template>` 的样式有较为详细的建议，并且通过 eslint-plugin-vue 可以直接引入。但使用 Prettier 会与 `eslint-plugin-vue` 中的规则有一定的冲突，需要通过 `eslint-config-prettier/vue` 关闭相关规则。
- [Vue Custom Blocks](https://vue-loader.vuejs.org/guide/custom-blocks.html) 可能并不是 HTML 中支持的语言，直接使用 Prettier 是无法处理这些自定义块的样式的。

为了解决这些问题，可以使用 [eslint-plugin-prettier-vue](https://github.com/meteorlxy/eslint-plugin-prettier-vue)，让 Prettier 更好地处理 Vue SFC。

## 实现思路

### 将 Prettier 集成到 ESLint 工作流中

主要参考 Prettier 官方提供的 `eslint-plugin-prettier`，将 Prettier 转化为 ESLint 中的一条 rule：

- 在 `meta` 中设置支持的 Prettier 等相关选项
- 在 `create` 方法中实现对 Prettier 的集成

这一部分主要是关于 ESLint Plugin 的写法，以及对 `eslint-plugin-prettier` 的一些重构调整，不再多加赘述。

### 将不同 block 分开处理

我们知道，在通过 `webpack` 处理 Vue SFC 时，vue-loader 会将 `<template>`, `<script>`, `<style>`, `<custom-block>` 分开处理，底层实际上是使用了 [@vue/component-compiler-utils](https://www.npmjs.com/package/@vue/component-compiler-utils) 和 [vue-template-compiler](https://www.npmjs.com/package/vue-template-compiler) 的能力。

通过 `@vue/component-compiler-utils` 的 `parse()` 方法，传入文件内容和文件名，就可以得到包含各个 SFC Blocks 详细描述的对象。将这些 SFC Blocks 当作不同格式的文件传给 Prettier ，即可实现各个 block 分开处理的能力，也能支持 Custom Blocks 的处理了。

`parse()` 方法所需要的内容均可以在 `create()` 方法的第一个参数 `context ` 中获取到，熟悉 ESLint 相关 API 即可实现。

## 一些需要注意的点

### 如何处理代码的位置

- `parse()` 方法返回的 SFC Blocks 中，有 block 在原始文件的 `start` 和 `end`
- `parse()` 方法返回的 SFC Blocks 中，`content` 会默认填充空行和消除缩进，即 `compilerParseOptions: { pad: 'line', deindent: true }`，这是为了方便 vue-loader 定位原始代码位置，但在 Prettier 中是应该去掉的，否则会影响 Prettier 对格式的处理和代码定位。因此需要设置为 `compilerParseOptions: { pad: false, deindent: false }`。
  > 这两个配置项的使用方法在对应文档里基本都没有，需要到源码中才能找到

有了这些信息，配合 `prettier-linter-helpers` 提供的 `offset`，就可以给 ESLint 反馈正确的代码位置了。

### @vue/component-compiler-utils 的缓存问题

`@vue/component-compiler-utils` 根据文件内容 `filename` 和文件内容 `source` 对 vue 文件进行了缓存，如果缓存命中则会直接返回之前的处理结果 ([对应源码](https://github.com/vuejs/component-compiler-utils/blob/37b4a6a99ecaa8bf27c777191ac17e9168c70cd1/lib/parse.ts#L55-L57))。

由于缓存没有对 `compilerParseOptions` 进行区分，在 webpack + vue-loader + eslint-loader 的情况下会有问题：

1. vue-loader 调用 `@vue/component-compiler-utils` 时，使用了 `compilerParseOptions: { pad: 'line' }`
2. eslint-loader (即 `eslint-plugin-prettier-vue`) 调用 `@vue/component-compiler-utils` 时，使用了 `compilerParseOptions: { pad: false, deindent: false }`
3. 此时由于 eslint 中的调用同样命中了缓存，`compilerParseOptions: { pad: false, deindent: false }` 就会失效，prettier 中就会得到填充空行和消除缩进的代码导致样式处理出错。

为了应对这种情况，可以：

1. 给传入 `@vue/component-compiler-utils` 的 `filename` 加上前缀 / 后缀用以区分
2. 向 `@vue/component-compiler-utils` 提 PR，将 `compilerParseOptions` 也加入缓存 key

由于 `@vue/component-compiler-utils` 目前并不在积极维护（都在努力搞 vue 3.0 吧），并且该项目基本只是为 vue-loader 服务的，所以目前简单用第一种方式解决。

## 存在的不足

### 整个文件级别的样式处理问题

由于我们将整个 `.vue` 文件根据 block 拆分为了几个不同格式的小文件交给 prettier 处理，那么 prettier 就无法感知 block 之外内容的格式问题：

- block 之间有多个空行 / 没有空行
- 文件末尾有多个空行 / 没有空行

这些样式问题就无法被 prettier 检测到了。

## 相关文章

- [理解 Prettier 并用它统一你的代码风格](/posts/2019/08/05/understand-and-use-prettier.html)  
