const webpack = require('webpack')
const path = require('path')

module.exports = {
  title: 'Meteorlxy',
  description: 'meteorlxy\'s homepage',
  head: [
    ['link', { rel: 'icon', href: `/favicon.ico` }],
  ],
  locales: {
    '/': {
      lang: 'zh-CN',
    },
  },
  // theme: 'meteorlxy',
  themeConfig: {
    personalInfo: {
      nickname: 'meteorlxy',
      description: 'Happy Coding<br/>Happy Life',
      email: 'meteor.lxy@foxmail.com',
      location: 'Xi\'an City, China',
      avator: '/assets/img/avator.jpg',
      sns: {
        facebook: {
          account: 'meteorlxy.cn',
          link: 'https://www.facebook.com/meteorlxy.cn'
        },
        github: {
          account: 'meteorlxy',
          link: 'https://github.com/meteorlxy'
        },
        linkedin: {
          account: 'meteorlxy',
          link: 'http://www.linkedin.com/in/meteorlxy'
        },
        twitter: {
          account: 'meteorlxy_cn',
          link: 'https://twitter.com/meteorlxy_cn'
        },
        // zhihu: {
        //   account: 'meteorlxy.cn',
        //   link: 'https://www.zhihu.com/people/meteorlxy.cn'
        // },
        // douban: {
        //   account: '159342708',
        //   link: 'https://www.zhihu.com/people/159342708'
        // },
        weibo: {
          account: '@焦炭君_Meteor',
          link: 'https://weibo.com/u/2039655434'
        }
      }
    },
    // headerBackground priority: url > useGeo
    headerBackground: {
      // url: '/assets/img/bg.jpg',
      useGeo: true
    },
    lastUpdated: true,
    nav: [
      { text: 'Home', link: '/', exact: true },
      { text: 'Posts', link: '/posts/', exact: false  },
      { text: 'About', link: '/about/', exact: false  }, 
    ]
  },
  chainWebpack: (config, isServer) => {
    if (!isServer) {
      config.resolve
        .modules
          .add(path.resolve(__dirname, '../../node_modules'))

      config.node.set('Buffer', false)

      config
        .plugin('context-replace')
        .use(webpack.ContextReplacementPlugin, [
          /moment[\/\\]locale$/, /zh-cn/
        ])

      config.optimization.splitChunks({
        maxInitialRequests: 5,
        cacheGroups: {
          moment: {
            test: /[\\/]node_modules[\\/]moment[\\/]/,
            name: 'vendor.moment',
            chunks: 'all'
          },
          vue: {
            test: /[\\/]node_modules[\\/](vue|vue-router)[\\/]/,
            name: 'vendor.vue',
            chunks: 'all'
          },
          commons: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            name: 'vendor.commons',
            chunks: 'all'
          }
        }
      })
    }
  }
}