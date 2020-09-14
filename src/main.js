// import Vue from 'vue'
// import FastClick from 'fastclick'
// FastClick.attach(document.body)
// // import VueClipboard from 'vue-clipboard2'
// // Vue.use(VueClipboard)
// const myapp = new Vue({
//   router,
//   render: h => h(App),
//   filters: {
//     testFilterCode(val) {
//       return val
//     }
//   }
// }).$mount('#app')
// debounced（防抖动） => 坐电梯 一个一个上会等待 一直上一直等 如果十秒钟中来了一个人 点开门 则当前十秒钟的事件重新计算 等到十秒没人进了电梯才会走
// 假设delay 如果两次执行事件的时间间隔小于delay 就重置delay 当超过一个delay没有重新触发方法就会触发这个方法
// throttle （节流） => 一定间隔内仅仅允许执行一次
// 定时执行 在一定时间delay内重复触发无效 比如滚动事件会触发一个事件去调用接口 如果无限滚动 节流后只能在delay间隔满足要求后才会调用接口

// function anonymous() {
//   with(this) {
//     return _c('div', [_m(0), (message) ? _c('p', [_v(_s(message))]) : _c('p', [_v("No message.")])])
//   }
// }

// import _ from 'lodash'

// const data = {
//   name: 'zhangsan',
//   age: 18,
//   obj: {
//     test: 123,
//     objIn: {
//       testIn: 456
//     }
//   }
// }

// function cap(data) {
//   Object.keys(data).forEach(function (v) {
//     let u = _.upperFirst(v)
//     data[u] = data[v]
//     delete data[v]
//     if (_.isObject(data[u])) {
//       cap(data[u])
//     }
//   })
// }
// cap(data)

// console.log(data)

// let dom = "<img src=\"http://baidu.com\" /> <div></div> <img src=\"http://baidu.com\" />"
// let res = dom.match(/(?<=src=)(['"]).*?\1/g).map(i=> i.replace(/['"]/gs,''))
// console.log(res)

// let dom = "{width:500px;height:500px;background-size:100% 100%; background-image:url(http://baidu.com);}\n"+
// "{width:500px;height:500px;background-size:100% 100%; background-image:url(http://fuck.com);}"
// let res = dom.match(/(?<=url)\((['"])?.*?\1\)/gs).map(i=> i.replace(/[\(\)]/gs,''))
// console.log(res)

// var hyphenateRE = /\B([A-Z])/g;
// var hyphenate = function (str) { // camel => 短横链接
//   return str.replace(hyphenateRE, '-$1').toLowerCase()
// };

// let res = hyphenate('zASDjsASDASDzS')
// console.log(res)
import Vue from 'vue'
import router from './router'
import App from './App.vue'
// import http from './network/http'
import store from './store'
import mermaid from 'mermaid'
mermaid.initialize({startOnLoad:false})
Vue.prototype.maidApi = mermaid.mermaidAPI
// import utils from 'common/utils'
// import toast from 'components/common/toast'
// import lazyLoad from 'vue-lazyload'
// import _ from 'lodash'
// import 'animate.css'
// import fastClick from 'fastclick'
// import {
//   mixinBackTop
// } from 'common/mixin'

//解决移动端点击延迟300ms
// fastClick.attach(document.body)
// Vue.mixin({
//   data () {
//     return {
//       time:Date.now()
//     }
//   },
//   created () {
//     console.log('created')
//   }
// })

// Vue.config.productionTip = false
// Vue.prototype.$http = http
// Vue.prototype.$bus = new Vue
// Vue.prototype.$utils = utils
// Vue.mixin(mixinBackTop)
// Vue.use(toast)
// Vue.use(lazyLoad, {
//   error:require('@/assets/img/logo.png'),//加載失敗
//   loading:require('@/assets/img/logo.png')//加載中
// })

Vue.component('my-cpn', function (resolve) {
  setTimeout(() => {
    resolve({
      name: 'MyCpn',
      data: () => ({
        name: 'zhangSan'
      }),
      template: '<div> just simple component for component funciton,name:{{name}} </div>'
    })
  }, 5000);
})

new Vue({
  render: h => h(App),
  router,
  store
}).$mount('#app')
// this.$refs.x.$el可以获取组件对应渲染的元素节点  img标签 - @load监听图片加载完毕事件
