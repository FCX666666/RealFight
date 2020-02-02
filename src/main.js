import Vue from 'vue'
import App from './App.vue'
import router from './router'
import http from './network/http'
import store from './store'

Vue.config.productionTip = false
Vue.prototype.$http = http

new Vue({
  render: h => h(App),
  router,
  store
}).$mount('#app')