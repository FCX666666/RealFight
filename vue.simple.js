function Vue(options) {
  this._init(options)
}

Vue.prototype.$mount = function mount(el) {
  this._el = el
  this.$el.id = this._el.replace('#', '')
  const dom = document.querySelector(el)
  const parent = dom.parentNode
  const children = parent.children
  parent.removeChild(dom)
  parent.appendChild(this.$el)
}

Vue.prototype._init = function init(opts) {
  const {
    data,
    methods,
    render
  } = opts

  function def(obj, key) {
    const dep = new Dep()
    let val = obj[key]
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: true,
      get() {
        dep.depend()
        return val
      },
      set(value) {
        val = value
        dep.notify()
      }
    })
  }

  function initData(vm, data) {
    const dataObj = vm.$data = data()
    const keys = Object.keys(dataObj)
    keys.forEach(key => {
      def(dataObj, key)
    })
  }

  function initMethod(vm, methods) {
    const keys = Object.keys(methods)
    keys.forEach(key => {
      methods[key] = methods[key].bind(vm)
    })
    vm.$method = methods
  }

  function initRender(vm, render) {
    vm.$render = render
  }

  initData(this, data)
  initMethod(this, methods)
  initRender(this, render)

  function _render(vm) {
    new Watcher(vm)
  }
  _render(this)
}

function Dep() {
  this.subs = []
}

Dep.target = null

Dep.prototype.notify = function notify() {
  this.subs.forEach(item => {
    item.update()
  })
}

Dep.prototype.depend = function depend() {
  this.subs.push(Dep.target)
}

function createElm(tag, data, children) {
  if (typeof data === 'object') {
    let tp = ''
    let keys = Object.keys(data)
    keys.forEach(key => {
      tp += data[key]
    })
    data = tp
  }
  const dom = document.createElement(tag)
  dom.innerText = data
  return dom
}

function Watcher(vm) {
  Dep.target = this
  this.vm = vm
  vm.$el = vm.$render(createElm)
}

Watcher.prototype.update = function () {
  const data = this.vm.$data
  const tag = this.vm.$el.nodeName
  this.vm.$el = createElm(tag, data)
  this.vm.$mount(this.vm._el)
}
