import Vue from 'vue'
import App from './App.vue'
import router from './router'
import http from './network/http'
import store from './store'
import utils from 'common/utils'
import {
  mixinBackTop
} from 'common/mixin'

Vue.config.productionTip = false
Vue.prototype.$http = http
Vue.prototype.$bus = new Vue
Vue.prototype.$utils = utils

Vue.mixin(mixinBackTop)

new Vue({
  render: h => h(App),
  router,
  store
}).$mount('#app')

// this.$refs.x.$el可以获取组件对应渲染的元素节点  img标签 - @load监听图片加载完毕事件
