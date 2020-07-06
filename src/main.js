import Vue from 'vue'
import App from './App.vue'
import router from './router'
import http from './network/http'
import store from './store'
import utils from 'common/utils'
import toast from 'components/common/toast'
import lazyLoad from 'vue-lazyload'
import _ from 'lodash'
import 'animate.css'
import fastClick from 'fastclick'
import {
  mixinBackTop
} from 'common/mixin'

//解决移动端点击延迟300ms
fastClick.attach(document.body)

Vue.config.productionTip = false
Vue.prototype.$http = http
Vue.prototype.$bus = new Vue
Vue.prototype.$utils = utils
Vue.mixin(mixinBackTop)
Vue.use(toast)
Vue.use(lazyLoad, {
  error:require('@/assets/img/logo.png'),//加載失敗
  loading:require('@/assets/img/logo.png')//加載中
})
new Vue({
  render: h => h(App),
  router,
  // store
}).$mount('#app')
// this.$refs.x.$el可以获取组件对应渲染的元素节点  img标签 - @load监听图片加载完毕事件