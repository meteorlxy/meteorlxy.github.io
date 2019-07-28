---
draft: true
category: Development
tags:
  - js
  - vue
title: 'Vssue 开发笔记'
description: 'Development notes of Vssue'
date: 2019-07-29
vssue-title: 'Vssue 开发笔记'
---

[Vssue](https://vssue.js.org) 是一款基于代码托管平台 Issue 评论系统的静态页面评论插件，支持 GitHub, GitLab, Bitbucket, Gitee 等多个代码托管平台，并且很容易扩展到其他平台上。

这篇文章对 Vssue 开发过程中遇到的问题和一些经验做个简要的记录。

<!-- more -->

## 项目思路

评论是博客的一项常用功能，而静态博客则必须借助第三方工具才能实现评论功能。

Gitment 和 Gitalk 是两款基于 GitHub 的 Issue 系统实现的评论插件，其基本思路就是利用 GitHub 提供的 OAuth 等 API ，在前端获取 Issue 中的评论，将对应 Issue 的评论显示到当前页面，作为当前页面的评论。这两个项目存在一些特点和问题：

- 分别使用原生 js 和 Preact 开发。
- 仅支持 GitHub ，项目代码与 GitHub API 耦合，难以向其它平台扩展。
- 没有支持编辑、删除等常用操作。

鉴于这两个项目目前均已不再积极维护，再加上目前对 Vue 比较感兴趣，我决定自己开一个类似的坑 —— Vssue 。

## 相关工具和技术

### lerna 与 mono repo

Vssue 的主要特点就是支持多个平台，而不仅仅是 GitHub 。因此，核心思想就是将主项目代码和平台 API 解耦。

Vssue 的解决思路是，不同平台的 API 实现同一个 Interface ，使得平台对主项目“不透明”，主项目只需要通过调用对应方法即可获取所需要的评论相关数据。

在这种思路下，Vssue 使用 [lerna](https://github.com/lerna/lerna) + [yarn workspace](https://yarnpkg.com/lang/en/docs/workspaces/) 实现 monorepo ，即多项目仓库。Vssue 项目包含一个主项目以及不同平台 API 的子项目。

![Vssue monorepo](/assets/img/posts/20190729-01.png)

几点 tips:

- 使用 yarn workspace 后，即通过 yarn 来管理整个项目的依赖关系，包括各个子项目以及彼此间的依赖。这种情况下，lerna 仅用来帮助进行版本发布相关的工作。也就是说，`lerna bootstrap`, `lerna add` 等命令就不需要进行了。目前来看，yarn 来统一管理依赖的方式，比 npm + lerna 要更方便一些。yarn workspace + lerna 是目前 monorepo 的较优选择。
- 仓库根目录下的 `package.json` 不参与任何要发布在 npm 的项目，一般直接设置为 `private: true`，主要是用来设置项目开发过程中的 `scripts` 和各个项目公用的 `devDependencies`，可以把 `eslint`, `husky`, `lint-staged`, `typescript`, `jest` 这类公用开发依赖加入根目录的 `package.json` 中。注意在使用 yarn 的 workspace 时，需要加入 `-W` 参数确认把依赖装在根目录，即 `yarn add -D -W eslint`。
- lerna 管理 monorepo 时，各个 packages 有 "统一版本" 和 "独立版本" 两种模式，通过 `lerna.json` 中的 `"version": "independent"` 来开启独立版本模式。
  - 统一版本：各个 packages 的 __最高__ 版本以 `lerna.json` 中的版本号为准。每次发布新版本时，可能只更新了部分 packages 的版本号，但是每个 package 在发布时，版本号一定会更新至当前 `lerna.json` 中的版本号。

    > 举例来说：a, b, c 当前均为 1.0.0 版本，其中 b 依赖于 a，c 依赖于 b。你修改了 b 包但没有改动 a, c，此时你 `lerna publish` 发布新版本 1.1.0，将自动检测 b 发生了修改需要更新版本，c 依赖于 b 也会一起更新版本，然后将 `lerna.json` 中的版本号改为 1.1.0。此时 a 仍为 1.0.0 版本，而 b 和 c 为 1.1.0 版本。下一次你对 a, b, c 均有改动，发布 1.1.1 版本时，a 将直接跳过 1.1.0 版本，将版本号更新至 1.1.1。此时 a, b, c 同时发布为 1.1.1 版本。

    > 统一版本的例子有： 7.0 版本后的 [babel](https://github.com/babel/babel)，3.0 版本后的 [vue-cli](https://github.com/vuejs/vue-cli) ，[lerna](https://github.com/lerna/lerna) 本身 等等。

  - 独立版本：顾名思义，各个 packages 的版本互相独立，与 `lerna.json` 无关，所以就在 `lerna.json` 中设置 `"version": "independent"` 开启。这种模式下，每次发布版本会在 commit message 中列出所有发布的 package 及对应版本号，并且 git tag 也会分别打上所有的 `package-name@version`。

    > 举例来说：你通过 `lerna publish` 发布 a 的 1.2.3 版本和 b 的 2.3.4 版本，会打上两个 git tag：`a@1.2.3`, `b@2.3.4`，并且默认的 commit message 会是：
    ```md
    Publish
    - a@1.2.3
    - b@2.3.4
    ```

    > 独立版本的例子有： [saber](https://github.com/saberland/saber) 等等。

### typescript 与 vue



### vue-cli 与 rollup


