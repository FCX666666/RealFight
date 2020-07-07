module.exports = {
  publicPath: './',
  outputDir: 'dist',
  assetsDir: '',
  configureWebpack: {
    resolve: {
      alias: {
        'assets': '@/assets',
        'common': '@/common',
        'components': '@/components',
        'network': '@/network',
        'views': '@/views',
        'vue$':'vue/dist/vue.esm.js'
      }
    }
  },
  css: {
    loaderOptions: {
      postcss: {
        plugins: [
          require('postcss-px-to-viewport')({
            unitToConvert: 'px', //将要转化的单位
            viewportWidth: 750, //(Number)视图的宽度
            viewportHeight: 1334, //(Number)视图的高度
            unitPrecision: 5, //(Number)指定`px`转换为视窗单位值的小数位数，默认是5
            propList: ['*'], //(Array)指定可以转换的css属性，默认是['*']，代表全部属性进行转换
            viewportUnit: 'vw', //(String)指定需要转换成的视窗单位，默认vw
            fontViewportUnit: 'vw', //(String)指定字体需要转换成的视窗单位，默认vw
            selectorBlackList: ['.ignore'], // (Array) 指定不转换为视窗单位的类，保留px，值为string或正则regexp，建议定义一至两个通用的类名
            minPixelValue: 1, //(Number) 默认值1，小于或等于`1px`不转换为视窗单位,
            mediaQuery: false, // (Boolean) 是否在媒体查询时也转换px，默认false
            replace: true, //替换包含vw的规则，而不是添加回退。
            exclude: [/node_modules/g], // (Array or Regexp) 设置忽略文件，如node_modules
            landscape: false,
            landscapeUnit: 'vh', // 横屏时使用的单位
            landscapeWidth: 568 // 横屏时使用的视口宽度
          })
        ]
      }
    }
  }
}
// module.exports = {
//   // 部署应用时的基本 URL(从 Vue CLI 3.3 起已弃用，请使用publicPath。)
//   baseUrl: process.env.NODE_ENV === 'production' ? '192.168.60.110:8080' : '192.168.60.110:8080',
//   // 部署应用包时的基本 URL。用法和 webpack 本身的 output.publicPath 一致
//   publicPath: '/',

//   // build时构建文件的目录 构建时传入 --no-clean 可关闭该行为
//   outputDir: 'dist',

//   // build时放置生成的静态资源 (js、css、img、fonts) 的 (相对于 outputDir 的) 目录
//   assetsDir: '',

//   // 指定生成的 index.html 的输出路径 (相对于 outputDir)。也可以是一个绝对路径。
//   indexPath: 'index.html',

//   // 默认在生成的静态资源文件名中包含hash以控制缓存
//   filenameHashing: true,

//   // 构建多页面应用，页面的配置
//   pages: {
//     index: {
//       // page 的入口
//       entry: 'src/index/main.js',
//       // 模板来源
//       template: 'public/index.html',
//       // 在 dist/index.html 的输出
//       filename: 'index.html',
//       // 当使用 title 选项时，
//       // template 中的 title 标签需要是 <title><%= htmlWebpackPlugin.options.title %></title>
//       title: 'Index Page',
//       // 在这个页面中包含的块，默认情况下会包含
//       // 提取出来的通用 chunk 和 vendor chunk。
//       chunks: ['chunk-vendors', 'chunk-common', 'index']
//     },
//     // 当使用只有入口的字符串格式时，
//     // 模板会被推导为 `public/subpage.html`
//     // 并且如果找不到的话，就回退到 `public/index.html`。
//     // 输出文件名会被推导为 `subpage.html`。
//     subpage: 'src/subpage/main.js'
//   },

//   // 是否在开发环境下通过 eslint-loader 在每次保存时 lint 代码 (在生产构建时禁用 eslint-loader)
//   lintOnSave: process.env.NODE_ENV !== 'production',

//   // 是否使用包含运行时编译器的 Vue 构建版本
//   runtimeCompiler: false,

//   // Babel 显式转译列表
//   transpileDependencies: [],

//   // 如果你不需要生产环境的 source map，可以将其设置为 false 以加速生产环境构建
//   productionSourceMap: true,

//   // 设置生成的 HTML 中 <link rel="stylesheet"> 和 <script> 标签的 crossorigin 属性（注：仅影响构建时注入的标签）
//   crossorigin: '',

//   // 在生成的 HTML 中的 <link rel="stylesheet"> 和 <script> 标签上启用 Subresource Integrity (SRI)
//   integrity: false,

//   // 如果这个值是一个对象，则会通过 webpack-merge 合并到最终的配置中
//   // 如果你需要基于环境有条件地配置行为，或者想要直接修改配置，那就换成一个函数 (该函数会在环境变量被设置之后懒执行)。该方法的第一个参数会收到已经解析好的配置。在函数内，你可以直接修改配置，或者返回一个将会被合并的对象
//   configureWebpack: {},

//   // 对内部的 webpack 配置（比如修改、增加Loader选项）(链式操作)
//   chainWebpack: () => {

//   },

//   // css的处理
//   css: {
//     // 从 v4 起已弃用，请使用css.requireModuleExtension。 在 v3 中，这个选项含义与 css.requireModuleExtension 相反。
//     modules: true,
//     // 默认情况下，只有 *.module.[ext] 结尾的文件才会被视作 CSS Modules 模块。设置为 false 后你就可以去掉文件名中的 .module 并将所有的 *.(css|scss|sass|less|styl(us)?) 文件视为 CSS Modules 模块。
//     requireModuleExtension: true,
//     // 是否将组件中的 CSS 提取至一个独立的 CSS 文件中,当作为一个库构建时，你也可以将其设置为 false 免得用户自己导入 CSS
//     // 默认生产环境下是 true，开发环境下是 false
//     extract: false,
//     // 是否为 CSS 开启 source map。设置为 true 之后可能会影响构建的性能
//     sourceMap: false,
//     //向 CSS 相关的 loader 传递选项(支持 css-loader postcss-loader sass-loader less-loader stylus-loader)
//     loaderOptions: {
//       css: {},
//       less: {},
//       postcss: {
//         plugins: [
//           require('postcss-pxtorem')({
//             rootValue: 37.5, // 换算的基数
//             selectorBlackList: ['weui', 'mu'], // 忽略转换正则匹配项
//             propList: ['*'],
//           }),
//         ]
//       }
//     }
//   },

//   // 所有 webpack-dev-server 的选项都支持
//   devServer: {},

//   // 是否为 Babel 或 TypeScript 使用 thread-loader
//   parallel: require('os').cpus().length > 1,

//   // 向 PWA 插件传递选项
//   pwa: {},

//   // 可以用来传递任何第三方插件选项
//   pluginOptions: {}
// }
