import {
  inBrowser,
  CustomEvent,
  remove,
  some,
  find,
  _,
  throttle,
  supportWebp,
  getDPR,
  scrollParent,
  getBestSelectionFromSrcset,
  assign,
  isObject,
  hasIntersectionObserver,
  modeType,
  ImageCache
} from './util'

import ReactiveListener from './listener'

const DEFAULT_URL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
const DEFAULT_EVENTS = ['scroll', 'wheel', 'mousewheel', 'resize', 'animationend', 'transitionend', 'touchmove']
const DEFAULT_OBSERVER_OPTIONS = {
  rootMargin: '0px',
  threshold: 0
}

export default function (Vue) {
  return class Lazy {
    constructor ({ preLoad, error, throttleWait, preLoadTop, dispatchEvent, loading, attempt, silent = true, scale, listenEvents, hasbind, filter, adapter, observer, observerOptions }) {
      this.version = '__VUE_LAZYLOAD_VERSION__'
      this.mode = modeType.event
      this.ListenerQueue = []
      this.TargetIndex = 0
      this.TargetQueue = []
      this.options = {
        silent: silent,
        dispatchEvent: !!dispatchEvent,
        throttleWait: throttleWait || 200,
        preLoad: preLoad || 1.3,
        preLoadTop: preLoadTop || 0,
        error: error || DEFAULT_URL,
        loading: loading || DEFAULT_URL,
        attempt: attempt || 3,
        scale: scale || getDPR(scale),
        ListenEvents: listenEvents || DEFAULT_EVENTS,
        hasbind: false,
        supportWebp: supportWebp(),
        filter: filter || {},
        adapter: adapter || {},
        observer: !!observer,
        observerOptions: observerOptions || DEFAULT_OBSERVER_OPTIONS
      }
      this._initEvent()
      this._imageCache = new ImageCache({ max: 200 })
      this.lazyLoadHandler = throttle(this._lazyLoadHandler.bind(this), this.options.throttleWait)

      this.setMode(this.options.observer ? modeType.observer : modeType.event)
    }

    /**
     * update config
     * @param  {Object} config params
     * @return
     */
    config (options = {}) {
      assign(this.options, options)
    }

    /**
     * output listener's load performance
     * @return {Array}
     */
    performance () {
      let list = []

      this.ListenerQueue.map(item => {
        list.push(item.performance())
      })

      return list
    }

    /*
     * add lazy component to queue
     * @param  {Vue} vm lazy component instance
     * @return
     */
    addLazyBox (vm) {
      this.ListenerQueue.push(vm)
      if (inBrowser) {
        this._addListenerTarget(window)
        this._observer && this._observer.observe(vm.el)
        if (vm.$el && vm.$el.parentNode) {
          this._addListenerTarget(vm.$el.parentNode)
        }
      }
    }

    /*
     * add image listener to queue
     * @param  {DOM} el
     * @param  {object} binding vue directive binding
     * @param  {vnode} vnode vue directive vnode
     * @return
     */
    add (el, binding, vnode) {

      /**
       * binding: 一个对象，包含以下属性：
            name: 指令名，不包括 v- 前缀。
            value: 指令的绑定值， 例如： v-my-directive="1 + 1", value 的值是 2。
            oldValue: 指令绑定的前一个值，仅在 update 和 componentUpdated 钩子中可用。无论值是否改变都可用。
            expression: 绑定值的表达式或变量名。 例如 v-my-directive="1 + 1" ， expression 的值是 "1 + 1"。
            arg: 传给指令的参数。例如 v-my-directive:foo， arg 的值是 "foo"。
            modifiers: 一个包含修饰符的对象。 例如： v-my-directive.foo.bar, 修饰符对象 modifiers 的值是 { foo: true, bar: true }。
       * 
       */
      if (some(this.ListenerQueue, item => item.el === el)) { // 首先检查ListenerQueue中已经包含当前dom元素了 就直接进行一次更新方法
        this.update(el, binding)
        return Vue.nextTick(this.lazyLoadHandler)
      }

      let { src, loading, error } = this._valueFormatter(binding.value) // 拿到格式化的数据

      Vue.nextTick(() => { // 在下个事件循环进行一些初始化操作
        src = getBestSelectionFromSrcset(el, this.options.scale) || src
        this._observer && this._observer.observe(el)

        const container = Object.keys(binding.modifiers)[0] // 判断当前有没有指定滚动父级元素
        let $parent

        if (container) {
          $parent = vnode.context.$refs[container] // 直接通过ref去取出来
          // if there is container passed in, try ref first, then fallback to getElementById to support the original usage
          $parent = $parent ? $parent.$el || $parent : document.getElementById(container) // $parent最终都是真是dom元素
        }

        if (!$parent) {
          $parent = scrollParent(el) // 获取滚动的dom参照物元素
        }

        // 去创建一个listener
        const newListener = new ReactiveListener({
          bindType: binding.arg,
          $parent,
          el,
          loading,
          error,
          src, // 图片url
          elRenderer: this._elRenderer.bind(this),
          options: this.options,
          imageCache: this._imageCache
        })

        // 当前listner入队
        this.ListenerQueue.push(newListener)

        // 浏览器环境下添加listener目标
        if (inBrowser) {
          this._addListenerTarget(window)
          this._addListenerTarget($parent)
        }

        this.lazyLoadHandler()// 当前环境下检查是不是需要渲染
        Vue.nextTick(() => this.lazyLoadHandler()) // 在vue渲染完dom之后再次检查是不是需要加载图片
      })
    }

    /**
    * update image src
    * @param  {DOM} el
    * @param  {object} vue directive binding
    * @return
    */
    update (el, binding, vnode) { // vnode更新的时候会触发
      let { src, loading, error } = this._valueFormatter(binding.value)
      src = getBestSelectionFromSrcset(el, this.options.scale) || src

      const exist = find(this.ListenerQueue, item => item.el === el) // 检查当前listener队列中有没有
      if (!exist) { // 如果不存在就进行初始化
        this.add(el, binding, vnode)
      } else {
        exist.update({ // 如果有就执行listener.upadte
          src,
          loading,
          error
        })
      }
      if (this._observer) {
        this._observer.unobserve(el)
        this._observer.observe(el)
      }
      this.lazyLoadHandler() // 再次检查是否更新图片
      Vue.nextTick(() => this.lazyLoadHandler()) // 在下个时间循环检查更新图片
    }

    /**
    * remove listener form list
    * @param  {DOM} el
    * @return
    */
    remove (el) {
      if (!el) return
      this._observer && this._observer.unobserve(el)
      const existItem = find(this.ListenerQueue, item => item.el === el)
      if (existItem) {
        this._removeListenerTarget(existItem.$parent)
        this._removeListenerTarget(window)
        remove(this.ListenerQueue, existItem)
        existItem.$destroy()
      }
    }

    /*
     * remove lazy components form list
     * @param  {Vue} vm Vue instance
     * @return
     */
    removeComponent (vm) {
      if (!vm) return
      remove(this.ListenerQueue, vm)
      this._observer && this._observer.unobserve(vm.el)
      if (vm.$parent && vm.$el.parentNode) {
        this._removeListenerTarget(vm.$el.parentNode)
      }
      this._removeListenerTarget(window)
    }

    setMode (mode) { // 大多情况下使用 event
      if (!hasIntersectionObserver && mode === modeType.observer) {
        mode = modeType.event
      }

      this.mode = mode // event or observer

      if (mode === modeType.event) {
        if (this._observer) { // 在event模式下去停止所有IntersectionObserver  ？ 感觉多余 安全检查？
          this.ListenerQueue.forEach(listener => {
            this._observer.unobserve(listener.el)
          })
          this._observer = null
        }

        this.TargetQueue.forEach(target => { // 为当前target添加监听事件
          this._initListen(target.el, true)
        })
      } else {
        this.TargetQueue.forEach(target => { // 去解除所有事件的监听 ？ 多余？
          this._initListen(target.el, false)
        })
        this._initIntersectionObserver() // 添加监听事件
      }
    }

    /*
    *** Private functions ***
    */

    /*
     * add listener target
     * @param  {DOM} el listener target
     * @return
     */
    _addListenerTarget (el) {
      if (!el) return
      let target = find(this.TargetQueue, target => target.el === el) // 首先在当前队列中找到当前dom元素 如果有就把子计数器+1 否则创建target对象
      if (!target) {
        target = {
          el: el,
          id: ++this.TargetIndex,
          childrenCount: 1,
          listened: true
        }
        this.mode === modeType.event && this._initListen(target.el, true) // 如果当前是event而非observer就进行初始化操作
        this.TargetQueue.push(target) // target入队
      } else {
        target.childrenCount++
      }
      return this.TargetIndex // 返回当前target编号
    }

    /*
     * remove listener target or reduce target childrenCount
     * @param  {DOM} el or window
     * @return
     */
    _removeListenerTarget (el) {
      this.TargetQueue.forEach((target, index) => {
        if (target.el === el) {
          target.childrenCount--
          if (!target.childrenCount) {
            this._initListen(target.el, false)
            this.TargetQueue.splice(index, 1)
            target = null
          }
        }
      })
    }

    /*
     * add or remove eventlistener
     * @param  {DOM} el DOM or Window
     * @param  {boolean} start flag
     * @return
     * 
     * 为dom元素添加懒加载核心方法
     */
    _initListen (el, start) {
      // 为当前滚动相关的事件类型添加事件  以便在视图滚动之后检查需要加载的内容 
      this.options.ListenEvents.forEach((evt) => _[start ? 'on' : 'off'](el, evt, this.lazyLoadHandler))
    }

    _initEvent () { // 初始化事件中心
      this.Event = {
        listeners: {
          loading: [],
          loaded: [],
          error: []
        }
      }

      /// 和vue内部事件中心几乎一致
      this.$on = (event, func) => {
        if (!this.Event.listeners[event]) this.Event.listeners[event] = []
        this.Event.listeners[event].push(func)
      }

      this.$once = (event, func) => {
        const vm = this
        function on () {
          vm.$off(event, on)
          func.apply(vm, arguments)
        }
        this.$on(event, on)
      }

      this.$off = (event, func) => {
        if (!func) {
          if (!this.Event.listeners[event]) return
          this.Event.listeners[event].length = 0
          return
        }
        remove(this.Event.listeners[event], func)
      }

      this.$emit = (event, context, inCache) => {
        if (!this.Event.listeners[event]) return
        this.Event.listeners[event].forEach(func => func(context, inCache))
      }
    }

    /**
     * find nodes which in viewport and trigger load
     * 查找在视窗中的dom元素并触发加载
     * @return
     */
    _lazyLoadHandler () {
      const freeList = [] // 需要销毁的listenr列表
      this.ListenerQueue.forEach((listener, index) => {
        if (!listener.el || !listener.el.parentNode) {
          freeList.push(listener) // 当前节点啊或者父级节点已经没有了
        }
        const catIn = listener.checkInView() // 检查是不是需要加载
        if (!catIn) return
        listener.load()
      })
      freeList.forEach(item => { // 释放
        remove(this.ListenerQueue, item)
        item.$destroy()
      })
    }
    /**
    * init IntersectionObserver
    * set mode to observer
    * @return
    */
    _initIntersectionObserver () {
      if (!hasIntersectionObserver) return
      this._observer = new IntersectionObserver(this._observerHandler.bind(this), this.options.observerOptions)
      if (this.ListenerQueue.length) {
        this.ListenerQueue.forEach(listener => {
          this._observer.observe(listener.el)
        })
      }
    }

    /**
    * init IntersectionObserver
    * @return
    */
    _observerHandler (entries, observer) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.ListenerQueue.forEach(listener => {
            if (listener.el === entry.target) {
              if (listener.state.loaded) return this._observer.unobserve(listener.el)
              listener.load()
            }
          })
        }
      })
    }

    /**
    * set element attribute with image'url and state
    * @param  {object} lazyload listener object
    * @param  {string} state will be rendered
    * @param  {bool} inCache  is rendered from cache
    * @return
    */
    _elRenderer (listener, state, cache) { // 初次执行会传入 loading
      if (!listener.el) return
      const { el, bindType } = listener

      let src
      switch (state) { // 根据状态去src
        case 'loading':
          src = listener.loading
          break
        case 'error':
          src = listener.error
          break
        default:
          src = listener.src
          break
      }

      if (bindType) { // v-lazy:background-image="imgUrl"  在这里就会为设置背景图片 
        el.style[bindType] = 'url("' + src + '")' // el.style['background-image'] = url('src...')
      } else if (el.getAttribute('src') !== src) { // 检查当前是不是已经赋值过了
        el.setAttribute('src', src) // 没传就默认设置src
      }

      el.setAttribute('lazy', state) // 初次渲染时设置一个lazy的属性为loading

      this.$emit(state, listener, cache) // 初次渲染时触发事件中心中的loading的方法数组内的所有方法 相当于是钩子函数
      this.options.adapter[state] && this.options.adapter[state](listener, this.options) // 执行adaptar中的方法

      if (this.options.dispatchEvent) { // 如果配置了需要触发dom事件 {dispatchEvent:true}
        const event = new CustomEvent(state, {
          detail: listener
        })
        el.dispatchEvent(event) // 去派发这个state事件（自定义事件）
      }
    }

    /**
    * generate loading loaded error image url
    * @param {string} image's src
    * @return {object} image's loading, loaded, error url
    */
    _valueFormatter (value) {
      let src = value
      let loading = this.options.loading
      let error = this.options.error

      // value is object
      if (isObject(value)) {
        if (!value.src && !this.options.silent) console.error('Vue Lazyload warning: miss src with ' + value)
        src = value.src
        loading = value.loading || this.options.loading // 没传就直接取默认值
        error = value.error || this.options.error
      }
      return {
        src,
        loading,
        error
      }
    }
  }
}
