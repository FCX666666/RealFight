function Vue(options) {
  this._init(options)
}
Vue.prototype.$mount = function mount(el) {
  const dom = document.querySelector(el)
  //   const parentDom = 
}


Vue.prototype._init = function init(opts) {
  const {
    data,
    method,
    render
  } = opts

  function def(obj, key) {
    Object.defineProperty(obj, key, {
      get() {

      },
      set() {

      }
    })
  }

  initData(vm, data) {
    const data = vm.$data = data()
    const keys = Object.keys(data)
    key.forEach(item => {
      def(data, key)
    })
  }

  initRender(vm, render) {

  }

  initMethod(vm, method) {

  }

}
