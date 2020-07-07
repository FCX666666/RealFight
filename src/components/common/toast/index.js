import Toast from './Toast.vue'

export default {
  install(Vue) {
    //创建组件构造器
    const toastCtr = Vue.extend(Toast)
    // 创建组件
    const toast = new toastCtr()
    // 组件元素挂载到某个dom元素中
    toast.$mount(document.createElement('p'))
    // 组件渲染完的dom元素插入dom树中
    document.body.appendChild(toast.$el)
    //引入插件
    Vue.prototype.$toast = toast
  }
}

