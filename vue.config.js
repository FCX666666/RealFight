module.exports = {
  //这里的配置回合@type中的配置进行合并
  configureWebpack: {
    resolve: {
      alias: {
        // 内部默认配置过src为@
        'assets':'@/assets',
        'components':'@/components',
        'Common':'@/common',
        'network':'@/network',
        'views':'@/views', 
        'vue$':'vue/dist/vue.esm.js'
      }
    }
  },
  css :{
    requireModuleExtension:true
  }
}