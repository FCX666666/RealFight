import assign from 'assign-deep'

const inBrowser = typeof window !== 'undefined'
export const hasIntersectionObserver = checkIntersectionObserver()

function checkIntersectionObserver () { // 检查当前浏览器有没有提供intersectionobserver  这个属性在用户设置了{observer:true}时候会进行检测 否则进行
  if (inBrowser &&
    'IntersectionObserver' in window &&
    'IntersectionObserverEntry' in window &&
    'intersectionRatio' in window.IntersectionObserverEntry.prototype) {
  // Minimal polyfill for Edge 15's lack of `isIntersecting`
  // See: https://github.com/w3c/IntersectionObserver/issues/211
    if (!('isIntersecting' in window.IntersectionObserverEntry.prototype)) {
      Object.defineProperty(window.IntersectionObserverEntry.prototype,
        'isIntersecting', {
          get: function () {
            return this.intersectionRatio > 0 // 大于0就代表当前被监听元素已经进入了当前root的view内
          }
        })
    }
    return true
  }
  return false
}

export const modeType = {
  event: 'event',
  observer: 'observer'
}

// CustomEvent polyfill
const CustomEvent = (function () {
  if (!inBrowser) return
  if (typeof window.CustomEvent === 'function') return window.CustomEvent
  function CustomEvent (event, params) {
    params = params || { bubbles: false, cancelable: false, detail: undefined }
    var evt = document.createEvent('CustomEvent')
     // loading: false,
      // error: false,
      // loaded: false,
      // rendered: false  detail:listener
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail)
    return evt
  }
  CustomEvent.prototype = window.Event.prototype
  return CustomEvent
})()

function remove (arr, item) {
  if (!arr.length) return
  const index = arr.indexOf(item)
  if (index > -1) return arr.splice(index, 1)
}

function some (arr, fn) {
  let has = false
  for (let i = 0, len = arr.length; i < len; i++) {
    if (fn(arr[i])) {
      has = true
      break
    }
  }
  return has
}

function getBestSelectionFromSrcset (el, scale) {
  if (el.tagName !== 'IMG' || !el.getAttribute('data-srcset')) return

  let options = el.getAttribute('data-srcset')
  const result = []
  const container = el.parentNode
  const containerWidth = container.offsetWidth * scale

  let spaceIndex
  let tmpSrc
  let tmpWidth

  options = options.trim().split(',')

  options.map(item => {
    item = item.trim()
    spaceIndex = item.lastIndexOf(' ')
    if (spaceIndex === -1) {
      tmpSrc = item
      tmpWidth = 999998
    } else {
      tmpSrc = item.substr(0, spaceIndex)
      tmpWidth = parseInt(item.substr(spaceIndex + 1, item.length - spaceIndex - 2), 10)
    }
    result.push([tmpWidth, tmpSrc])
  })

  result.sort(function (a, b) {
    if (a[0] < b[0]) {
      return 1
    }
    if (a[0] > b[0]) {
      return -1
    }
    if (a[0] === b[0]) {
      if (b[1].indexOf('.webp', b[1].length - 5) !== -1) {
        return 1
      }
      if (a[1].indexOf('.webp', a[1].length - 5) !== -1) {
        return -1
      }
    }
    return 0
  })
  let bestSelectedSrc = ''
  let tmpOption

  for (let i = 0; i < result.length; i++) {
    tmpOption = result[i]
    bestSelectedSrc = tmpOption[1]
    const next = result[i + 1]
    if (next && next[0] < containerWidth) {
      bestSelectedSrc = tmpOption[1]
      break
    } else if (!next) {
      bestSelectedSrc = tmpOption[1]
      break
    }
  }

  return bestSelectedSrc
}

//满足方法就赋值当前item
function find (arr, fn) {
  let item
  for (let i = 0, len = arr.length; i < len; i++) {
    if (fn(arr[i])) {
      item = arr[i]
      break
    }
  }
  return item
}

const getDPR = (scale = 1) => inBrowser ? (window.devicePixelRatio || scale) : scale

function supportWebp () {
  if (!inBrowser) return false

  let support = true
  const d = document

  try {
    let el = d.createElement('object')
    el.type = 'image/webp'
    el.style.visibility = 'hidden'
    el.innerHTML = '!'
    d.body.appendChild(el)
    support = !el.offsetWidth
    d.body.removeChild(el)
  } catch (err) {
    support = false
  }

  return support
}

//节流
function throttle (action, delay) {
  let timeout = null
  let lastRun = 0
  return function () {
    if (timeout) {
      return
    }
    let elapsed = Date.now() - lastRun
    let context = this
    let args = arguments
    let runCallback = function () {
      lastRun = Date.now()
      timeout = false
      action.apply(context, args)
    }
    if (elapsed >= delay) {
      runCallback()
    } else {
      timeout = setTimeout(runCallback, delay)
    }
  }
}

// 测试当前浏览器是不是支持事件的passive属性
function testSupportsPassive () {
  if (!inBrowser) return
  let support = false
  try {
    let opts = Object.defineProperty({}, 'passive', {  // 浏览器内部会调用passive属性
      get: function () {
        support = true
      }
    })
    window.addEventListener('test', null, opts)
  } catch (e) {}
  return support
}

const supportsPassive = testSupportsPassive()

const _ = { // 操作dom元素 添加事件或者移除事件
  on (el, type, func, capture = false) {
    if (supportsPassive) {
      el.addEventListener(type, func, {
        capture: capture,
        passive: true
      })
    } else {
      el.addEventListener(type, func, capture)
    }
  },
  off (el, type, func, capture = false) {
    el.removeEventListener(type, func, capture)
  }
}


// 去加载图片
const loadImageAsync = (item, resolve, reject) => {
  let image = new Image()
  if (!item || !item.src) {
    const err = new Error('image src is required')
    return reject(err)
  }

  image.src = item.src

  image.onload = function () {
    resolve({ // 图片加载完毕之后去获取一些数据并返回
      naturalHeight: image.naturalHeight,
      naturalWidth: image.naturalWidth,
      src: image.src
    })
  }

  image.onerror = function (e) {
    reject(e)
  }
}

// 获取计算后的style属性
const style = (el, prop) => {
  return typeof getComputedStyle !== 'undefined' // 判断浏览器环境支不支持computedStyle方法 IE9及以上
    ? getComputedStyle(el, null).getPropertyValue(prop) // 获取计算后的属性名
    : el.style[prop] // 如果没有直接通过style属性去取值
}

// 获取横向纵向和缩写的属性对应的值
const overflow = (el) => {
  return style(el, 'overflow') + style(el, 'overflow-y') + style(el, 'overflow-x')
}

// 根据元素去获取其滚动的参照元素 
const scrollParent = (el) => {
  if (!inBrowser) return
  if (!(el instanceof HTMLElement)) {
    return window
  }

  let parent = el

  while (parent) {
    if (parent === document.body || parent === document.documentElement) {// 如果当前是body或者html  直接返回当前元素
      break
    }

    if (!parent.parentNode) { // 已经找不到父级了直接返回当前元素
      break
    }

    if (/(scroll|auto)/.test(overflow(parent))) { // 正则匹配当前元素是不是设置了滚动  auto或者scroll 值得注意的是横向和纵向滚动都会返回当前dom元素
      return parent
    }

    parent = parent.parentNode // 不断向上级搜寻 找到第一个满足滚动条件的元素
  }

  return window
}

function isObject (obj) {
  return obj !== null && typeof obj === 'object'
}

function ObjectKeys (obj) {
  if (!(obj instanceof Object)) return []
  if (Object.keys) {
    return Object.keys(obj)
  } else {
    let keys = []
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        keys.push(key)
      }
    }
    return keys
  }
}

function ArrayFrom (arrLike) {
  let len = arrLike.length
  const list = []
  for (let i = 0; i < len; i++) {
    list.push(arrLike[i])
  }
  return list
}

function noop () {}

class ImageCache { // 图片缓存 默认100 实际传入200
  constructor ({ max }) {
    this.options = {
      max: max || 100
    }
    this._caches = []
  }

  has (key) { // 检查
    return this._caches.indexOf(key) > -1
  }

  add (key) { // 添加
    if (this.has(key)) return
    this._caches.push(key)
    if (this._caches.length > this.options.max) {
      this.free()
    }
  }

  free () { // 删除array[0]
    this._caches.shift()
  }
}

export {
  ImageCache,
  inBrowser,
  CustomEvent,
  remove,
  some,
  find,
  assign,
  noop,
  ArrayFrom,
  _,
  isObject,
  throttle,
  supportWebp,
  getDPR,
  scrollParent,
  loadImageAsync,
  getBestSelectionFromSrcset,
  ObjectKeys
}
