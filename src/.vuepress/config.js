module.exports = {
  title: 'Meteorlxy',

  description: 'meteorlxy\'s homepage',

  head: [
    ['link', { rel: 'icon', href: '/assets/img/avatar.jpg' }],
  ],

  locales: {
    '/': {
      lang: 'zh-CN',
    },
  },

  theme: 'vuepress-theme-meteorlxy',

  themeConfig: {
    lang: Object.assign(require('vuepress-theme-meteorlxy/lib/langs/zh-CN'), {
      home: `Welcome to meteorlxy's Homepage`,
      posts: 'My Posts',
    }),

    personalInfo: {
      nickname: 'meteorlxy',
      description: 'Happy Coding<br/>Happy Life',
      email: 'meteor.lxy@foxmail.com',
      location: 'Xi\'an City, China',
      organization: 'Xi\'an Jiao Tong University',

      avatar: '/assets/img/avatar.jpg',

      sns: {
        github: {
          account: 'meteorlxy',
          link: 'https://github.com/meteorlxy',
        },
        facebook: {
          account: 'meteorlxy.cn',
          link: 'https://www.facebook.com/meteorlxy.cn',
        },
        linkedin: {
          account: 'meteorlxy',
          link: 'http://www.linkedin.com/in/meteorlxy',
        },
        twitter: {
          account: 'meteorlxy_cn',
          link: 'https://twitter.com/meteorlxy_cn',
        },
        weibo: {
          account: '@焦炭君_Meteor',
          link: 'https://weibo.com/u/2039655434',
        },
        zhihu: {
          account: 'meteorlxy.cn',
          link: 'https://www.zhihu.com/people/meteorlxy.cn',
        },
        douban: {
          account: '159342708',
          link: 'https://www.douban.com/people/159342708',
        },
      },
    },

    headerBackground: {
      // url: '/assets/img/bg.jpg',

      useGeo: true,
    },

    nav: [
      { text: 'Home', link: '/', exact: true },
      { text: 'Posts', link: '/posts/', exact: false  },
      { text: 'Projects', link: '/projects/', exact: false  }, 
    ],

    comments: {
      platform: 'github',
      owner: 'meteorlxy',
      repo: 'meteorlxy.github.io',
      clientId: '960bbc7e80512b06153e',
      clientSecret: 'd63ad26efd7e29fc5a9533742d7fc5c88347b6ba',
      prefix: '[Comments] ',
      labels: ['comments'],
      autoCreateIssue: process.env.NODE_ENV === 'production',
    },
  },

  markdown: {
    toc: {
      includeLevel: [2, 3],
    },
  },

  plugins: [
    ['@vuepress/google-analytics', {
      'ga': 'UA-132770851-1',
    }],
  ],

  chainWebpack: (config, isServer) => {
    if (isServer === false) {
      config.optimization.splitChunks({
        maxInitialRequests: 5,
        cacheGroups: {
          2: {
            test: /[\\/]node_modules[\\/](@vssue|@vuepress|vssue|nprogress|geopattern)[\\/]/,
            name: 'vendor.2',
            chunks: 'all',
          },
          1: {
            test: /[\\/]node_modules[\\/](vue|vue-router|vue-i18n|vue-class-component)[\\/]/,
            name: 'vendor.1',
            chunks: 'all',
          },
          0: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            name: 'vendor.0',
            chunks: 'all',
          },
        },
      })
    }
  },
}
