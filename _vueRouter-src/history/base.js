/* @flow */

import { _Vue } from '../install'
import type Router from '../index'
import { inBrowser } from '../util/dom'
import { runQueue } from '../util/async'
import { warn, isError, isExtendedError } from '../util/warn'
import { START, isSameRoute } from '../util/route'
import {
  flatten,
  flatMapComponents,
  resolveAsyncComponents
} from '../util/resolve-components'
import { NavigationDuplicated } from './errors'

export class History {
  router: Router
  base: string
  current: Route
  pending: ?Route
  cb: (r: Route) => void
  ready: boolean
  readyCbs: Array<Function>
  readyErrorCbs: Array<Function>
  errorCbs: Array<Function>

  // implemented by sub-classes 被子类实现
  +go: (n: number) => void
  +push: (loc: RawLocation) => void
  +replace: (loc: RawLocation) => void
  +ensureURL: (push?: boolean) => void
  +getCurrentLocation: () => string

  constructor (router: Router, base: ?string) {
    this.router = router
    this.base = normalizeBase(base) // 处理base标签或者是用户传入的options.base
    // start with a route object that stands for "nowhere"
    this.current = START // 初始化一个初始状态的route对象
    this.pending = null
    this.ready = false
    this.readyCbs = []
    this.readyErrorCbs = []
    this.errorCbs = []
  }

  listen (cb: Function) {
    this.cb = cb
  }

  onReady (cb: Function, errorCb: ?Function) {
    if (this.ready) {
      cb()
    } else {
      this.readyCbs.push(cb)
      if (errorCb) {
        this.readyErrorCbs.push(errorCb)
      }
    }
  }

  onError (errorCb: Function) {
    this.errorCbs.push(errorCb)
  }

  //每个路由模式都会使用这个方法
  transitionTo (
    location: RawLocation, // 对于hash模式是#后边的内容 uri解码之后的
    onComplete?: Function, // 完成
    onAbort?: Function // 终止
  ) {
     // 初始化的时候this.current是undefined  获当前匹配的路由记录
    const route = this.router.match(location, this.current)
    this.confirmTransition(
      route,
      () => { // 执行完所有的导航钩子队列后会进入
        this.updateRoute(route)  // 更新路由和视图
        onComplete && onComplete(route) // 设置url变动监听器
        this.ensureURL() // 使用replace的方式修改当前url

        // fire ready cbs once
        if (!this.ready) {
          this.ready = true
          this.readyCbs.forEach(cb => { // 执行路由成功切换回调
            cb(route)
          })
        }
      },
      err => {
        if (onAbort) {
          onAbort(err)
        }
        if (err && !this.ready) {
          this.ready = true
          this.readyErrorCbs.forEach(cb => { // 执行路由失败回调
            cb(err)
          })
        }
      }
    )
  }

  confirmTransition (route: Route, onComplete: Function, onAbort?: Function) {
    const current = this.current // 路径切换之后更新current
    const abort = err => {
      // after merging https://github.com/vuejs/vue-router/pull/2771 we
      // When the user navigates through history through back/forward buttons
      // we do not want to throw the error. We only throw it if directly calling
      // push/replace. That's why it's not included in isError
      if (!isExtendedError(NavigationDuplicated, err) && isError(err)) {
        if (this.errorCbs.length) {
          this.errorCbs.forEach(cb => {
            cb(err)
          })
        } else {
          warn(false, 'uncaught error during route navigation:')
          console.error(err)
        }
      }
      onAbort && onAbort(err)
    }
    if (
      isSameRoute(route, current) && // 判断是不是相同的路径
      // in the case the route map has been dynamically appended to
      route.matched.length === current.matched.length // 比对父级record组成数组的长度
    ) {
      this.ensureURL()
      return abort(new NavigationDuplicated(route))
    }

    // 获取需要执行的钩子方法
    const { updated, deactivated, activated } = resolveQueue(
      this.current.matched,
      route.matched
    )

    // 根据不同的route对象去提取用户定义在options中的钩子函数并存储到queue数组中
    // 就像是一个任务队列一个接一个去运行
    const queue: Array<?NavigationGuard> = [].concat(
      // in-component leave guards
      extractLeaveGuards(deactivated), // 提取leave-route路由钩子
      // global before hooks
      this.router.beforeHooks, // 全局钩子
      // in-component update hooks
      extractUpdateHooks(updated), // 根据updated-route提取更新钩子
      // in-config enter guards
      activated.map(m => m.beforeEnter), // 获取actived-route的进入前钩子
      // async components
      resolveAsyncComponents(activated) // 获取异步组件
    )

    this.pending = route
    // 任务队列中的每一个任务都将执行这个方法去完成任务
    // 需要注意的是传入了next方法 如果不执行这个方法就无法让任务队列继续执行
    const iterator = (hook: NavigationGuard, next) => {
      if (this.pending !== route) { // 判断等待执行的route和当前route是不是同一个对象
        return abort()
      }
      try {
        // 这里就执行到了我们定义在全局或者是每个组件内部的路由守卫
        // to-要进入的route
        // from-从哪个路由离开的
        // next-执行下一个任务 这个匿名函数对runQueue传入的next进行了一次封装 这层封装是赋予了路由跳转配置 push或者replace
        hook(route, current, (to: any) => {
          if (to === false || isError(to)) {
            // 如果用户使用了 ‘false’就直接维持当前的url
            // next(false) -> abort navigation, ensure current URL
            this.ensureURL(true)
            abort(to)
          } else if (
            // 判断用户next({})传入的数据进行对应路径跳转
            typeof to === 'string' ||
            (typeof to === 'object' &&
              (typeof to.path === 'string' || typeof to.name === 'string'))
          ) {
            // next('/') or next({ path: '/' }) -> redirect
            abort()
            // 判断路由跳转类型
            if (typeof to === 'object' && to.replace) {
              this.replace(to)
            } else {
              this.push(to)
            }
          } else {
            // 直接调用了next进行下一个任务
            // confirm transition and pass on the value
            next(to)
          }
        })
      } catch (e) {
        abort(e)
      }
    }

    // 执行任务队列中的每一个任务
    // 在失活的组件里调用 beforeRouteLeave 守卫。
    // 调用全局的 beforeEach 守卫。
    // 在重用的组件里调用 beforeRouteUpdate 守卫 (2.2+)。
    // 在路由配置里调用 beforeEnter。
    // 解析异步路由组件。
    runQueue(queue, iterator, () => { // 所有任务执行完会执行这个方法
      const postEnterCbs = []
      const isValid = () => this.current === route
      // wait until async components are resolved before
      // extracting in-component enter guards
      // 提取进入钩子
      const enterGuards = extractEnterGuards(activated, postEnterCbs, isValid)
      const queue = enterGuards.concat(this.router.resolveHooks)
      // 在被激活的组件里调用 beforeRouteEnter。
      // 调用全局的 beforeResolve 守卫 (2.5+)。
      runQueue(queue, iterator, () => { // 再次执行队列 完毕后执行这个方法
        if (this.pending !== route) {
          return abort()
        }
        this.pending = null // 当前路由确认
        onComplete(route) // 执行完成回调
        if (this.router.app) {
          this.router.app.$nextTick(() => {
            postEnterCbs.forEach(cb => {
              cb()
            })
          })
        }
      })
    })
  }

  updateRoute (route: Route) {
    const prev = this.current
    this.current = route
    this.cb && this.cb(route) // 更新route到app上 同时触发视图更新
    this.router.afterHooks.forEach(hook => { // 执行全局after钩子
      hook && hook(route, prev)
    })
  }
}

function normalizeBase (base: ?string): string {
  if (!base) { // 如果没有传入base
    if (inBrowser) {  // 浏览器
      // respect <base> tag 指定用于一个文档中包含的所有相对 URL 的根 URL。一份中只能有一个 <base> 元素。
      // 先检查全局的base标签然后添加到前base前边
      const baseEl = document.querySelector('base')
      base = (baseEl && baseEl.getAttribute('href')) || '/'
      // strip full URL origin 把https://yuming 删除
      base = base.replace(/^https?:\/\/[^\/]+/, '')
    } else {
      base = '/'
    }
  }
  // make sure there's the starting slash
  if (base.charAt(0) !== '/') {
    base = '/' + base
  }
  // remove trailing slash 添加开头的/ 并去掉尾巴上的/
  return base.replace(/\/$/, '')
}

function resolveQueue (
  current: Array<RouteRecord>,
  next: Array<RouteRecord>
): {
  updated: Array<RouteRecord>,
  activated: Array<RouteRecord>,
  deactivated: Array<RouteRecord>
} {
  let i
  const max = Math.max(current.length, next.length) // 拿到当前父级record中长的那个
  for (i = 0; i < max; i++) { // 循环 当找到新旧不同的record
    if (current[i] !== next[i]) {
      break
    }
  }
  return {
    updated: next.slice(0, i), // 相同的链条代表当前的record是需要执行路由更新的
    activated: next.slice(i), // 剩余部分是新旧路由不同的部分 对于上次的路由 要执行离开路由钩子 对于本次即将进入的路由要执行进入前钩子
    deactivated: current.slice(i)
  }
}

// 提取对应状态的钩子
function extractGuards (
  records: Array<RouteRecord>,
  name: string,
  bind: Function,
  reverse?: boolean
): Array<?Function> {
  // 这里会生成一个2层深度的数组 所以需要拍平一次
  const guards = flatMapComponents(records, (def, instance, match, key) => {
    const guard = extractGuard(def, name) // 从options中提取钩子
    if (guard) { // 进行运行时作用域绑定
      return Array.isArray(guard)
        ? guard.map(guard => bind(guard, instance, match, key))
        : bind(guard, instance, match, key)
    }
  })
  // 在一些情况需要保证顺序并再次拍平 最后得到1个一位数组
  return flatten(reverse ? guards.reverse() : guards)
}

function extractGuard (
  def: Object | Function,
  key: string
): NavigationGuard | Array<NavigationGuard> {
  if (typeof def !== 'function') { // 对于不是构造器的options执行一次构造 对于异步工厂函数会直接跳过
    // extend now so that global mixins are applied.
    def = _Vue.extend(def)
  }
  return def.options[key]
}

// 根据key进行钩子函数的提取
function extractLeaveGuards (deactivated: Array<RouteRecord>): Array<?Function> {
  return extractGuards(deactivated, 'beforeRouteLeave', bindGuard, true)
}

function extractUpdateHooks (updated: Array<RouteRecord>): Array<?Function> {
  return extractGuards(updated, 'beforeRouteUpdate', bindGuard)
}

// 接受一个守卫 返回一个函数 函数内部执行守卫方法 绑定作用域到当前路由对应的vm实例
function bindGuard (guard: NavigationGuard, instance: ?_Vue): ?NavigationGuard {
  if (instance) {
    return function boundRouteGuard () {
      return guard.apply(instance, arguments)
    }
  }
}

function extractEnterGuards (
  activated: Array<RouteRecord>,
  cbs: Array<Function>,
  isValid: () => boolean
): Array<?Function> {
  return extractGuards(
    activated,
    'beforeRouteEnter',
    // 在进入路由之前是没有instance的 所以第二个参数直接 _
    (guard, _, match, key) => {
      return bindEnterGuard(guard, match, key, cbs, isValid)
    }
  )
}

function bindEnterGuard (
  guard: NavigationGuard,
  match: RouteRecord,
  key: string,
  cbs: Array<Function>,
  isValid: () => boolean
): NavigationGuard {
  // 运行时的守卫 内部调用next 不需要用户去执行next
  return function routeEnterGuard (to, from, next) {
    return guard(to, from, cb => {
      if (typeof cb === 'function') {
        cbs.push(() => {
          // #750
          // if a router-view is wrapped with an out-in transition,
          // the instance may not have been registered at this time.
          // we will need to poll for registration until current route
          // is no longer valid.
          poll(cb, match.instances, key, isValid)
        })
      }
      next(cb)
    })
  }
}

function poll (
  cb: any, // somehow flow cannot infer this is a function
  instances: Object,
  key: string,
  isValid: () => boolean
) {
  if (
    instances[key] &&
    !instances[key]._isBeingDestroyed // do not reuse being destroyed instance
  ) {
    cb(instances[key])
  } else if (isValid()) {
    setTimeout(() => {
      poll(cb, instances, key, isValid)
    }, 16)
  }
}
