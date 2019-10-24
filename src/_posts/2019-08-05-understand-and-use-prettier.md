---
category: Development
tags:
  - js
  - prettier
  - eslint
title: '理解 Prettier 并用它统一你的代码风格'
description: '理解 Prettier 并用它统一你的代码风格'
date: 2019-08-05
vssue-title: '理解 Prettier 并用它统一你的代码风格'
---

Prettier 是一个代码样式检查与优化工具，除了少部分可配置的规则外，强制性统一代码风格。起初接触时对 Prettier 存在的意义不太理解，感觉有 ESLint 做检查后代码风格已经被规范了，但实际上并非如此。这篇文章将对于 Prettier 的理解以及相应使用方法进行简单的总结。

<!-- more -->

## Prettier vs. Linters

官方文档中其实有对这个问题的[解释](https://prettier.io/docs/en/comparison.html)。

以 JS 为例，Prettier 包含（几乎）所有 ESLint 中关于代码样式 (Formatting) 的规则，但不包含 ESLint 中关于代码质量 (Code-quality) 的规则。

虽然官方说是包含了所有关于样式的规则，但是实际上并没有。可以自行对比 [ESLint Rules - Stylistic Issues](https://eslint.org/docs/rules/#stylistic-issues) 和 [eslint-config-prettier](https://github.com/prettier/eslint-config-prettier/blob/master/index.js)。

在实际使用 Prettier 的过程中你就会发现，Prettier 对样式的覆盖面比常用的 `eslint-config-standard` 和 `eslint-config-airbnb` 还要广。这当中有一些是 Prettier 比 ESLint 的样式规则更多，有一些也可能是 ESLint 对应的规则没有进行配置。这就引出了 Prettier 的一个重要价值 —— 对于一些可有可无的、只和个人习惯有关的样式，进行强制性统一，并不给你配置的选项。

这种价值在个人项目中并不明显，很多人还会因为 Prettier 的规则与个人习惯不同而选择不使用 Prettier。但是这在团队项目中就显得比较重要了，每个人的习惯和喜好并不同，一套强制性的工具是最简单直接的解决方案。

::: tip
在 Prettier 中，除了一些圣战级别的习惯分歧（比如用双引号 `"` 还是单引号 `'`，用 `tab` 还是 `spaces`，用 2 格缩进还是 4 格缩进等），别的样式都不可改动，统一使用 “Prettier 风格”。这可以说一种限制，但也可以说免去了考虑配置的烦恼。
:::

除此之外，Prettier 不只适用于 JS 代码，还适用于其他前端常用语言，只要一个工具就能免去绝大部分关于代码样式的烦恼，这也是 Prettier 广受欢迎的原因。

![Prettier vs. Linters](/assets/img/posts/20190805-prettier-vs-linters.png)

## 如何使用 Prettier

### 与 ESLint 结合使用

Prettier 提供了一些与 ESLint 配合使用的工具或插件，刚接触的人可能会比较蒙，不知道这些工具是干什么用的。Stackoverflow 上的 [这个回答](https://stackoverflow.com/questions/44690308/whats-the-difference-between-prettier-eslint-eslint-plugin-prettier-and-eslint) 解释得比较清楚，这里也简单总结一下：

- [prettier-eslint](https://github.com/prettier/prettier-eslint) - 一个单独的工具，基本上就是对你的代码先用 `prettier` 再用 `eslint`，可以代替 `eslint` 命令。个人不是很推荐使用。
- [eslint-config-prettier](https://github.com/prettier/eslint-config-prettier) - 和一般的 `eslint-config-xxx` 不同，它不是用来共享 ESlint 配置的，而是用来关闭 ESLint 的样式规则的，避免 ESLint 的样式规则和 Prettier 冲突。使用该配置后，对代码进行 `prettier` 和 `eslint` 就不会冲突了。但要注意一定要把它放在 `extends` 中最后的位置，避免后续的配置又把相关规则打开了。
- [eslint-plugin-prettier](https://github.com/prettier/eslint-plugin-prettier) - 将 Prettier 集成到 ESlint 工作流中，不需要再单独使用 `prettier` 命令。将 Prettier 发现的代码样式问题当作一条 ESLint 规则，在运行 `eslint` 检查后显示出来，也同样可以在 `--fix` 时修复。需要配合 `eslint-config-prettier` 使用。个人使用了一下基本 OK，但是由于 Prettier 不像 ESLint 那样是单独的一条条规则，因此错误的显示不是很友好。

::: tip
无论哪种方式，对 ESLint 不支持的文件，还是需要单独使用 `prettier` 进行处理。
:::

个人推荐使用 `eslint-config-prettier` + `eslint-plugin-prettier`：

```sh
npm i -D prettier eslint-plugin-prettier eslint-config-prettier
```

在 ESLint 配置文件中加入这些即可：

```js
// .eslintrc.js
module.exports = {
  extends: [
    // 各种你需要继承的配置列在前面
    'airbnb'
    'plugin:vue/recommended',
    // prettier 规则列在最后
    'plugin:prettier/recommended',
    'prettier/vue',
  ],
}
```

::: tip
目前 Prettier 对 Vue 文件的支持并不理想，基本上会把 Vue 文件直接当作 HTML 文件对待，无法支持 Custom Blocks，更无法支持 Vue 官方 Style Guide 中对模板语法的建议。用 [eslint-plugin-prettier-vue](https://github.com/meteorlxy/eslint-plugin-prettier-vue) 代替 `eslint-plugin-prettier` 可以解决这个问题，将会在另一篇文章中详细说明。
:::

### 配合 husky 和 lint-staged 使用

husky 和 lint-staged 就不单独介绍了，开发工作流好帮手，将 prettier 加入相关工作流即可：

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,vue}": [
      "eslint --fix",
      "git add"
    ],
    "*.{md,scss}": [
      "prettier --write",
      "git add"
    ],
  },
}
```

## 相关文章

- [如何让 Prettier 更好地处理 Vue SFC](/posts/2019/10/24/eslint-plugin-prettier-vue.html)  
