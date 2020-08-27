/* @flow */

import { _Vue } from '../install'
import { warn, isError } from './warn'

// 获取异步组件 传入需要activeted的record 返回一个方法
export function resolveAsyncComponents (matched: Array<RouteRecord>): Function {
  // 跟路由守卫是一样的 都传入了 to from next 三个参数
  return (to, from, next) => {
    let hasAsync = false
    let pending = 0
    let error = null

    flatMapComponents(matched, (def, _, match, key) => {
      // if it's a function and doesn't have cid attached,
      // assume it's an async component resolve function.
      // we are not using Vue's default async resolving mechanism because
      // we want to halt the navigation until the incoming component has been
      // resolved.
      // 路由内部帮助用户去获取异步组件 
      // 这个匿名方法将会处理每个record中的组件options
      // 这的注意的是 对于异步组件还没有创建vm实例 所以也就没有第二个参数
      // def即为异步工厂函数
      if (typeof def === 'function' && def.cid === undefined) {
        hasAsync = true // 标记当前包含异步组件
        pending++

        const resolve = once(resolvedDef => {
          if (isESModule(resolvedDef)) {
            resolvedDef = resolvedDef.default
          }
          // save resolved on async factory in case it's used elsewhere
          def.resolved = typeof resolvedDef === 'function'
            ? resolvedDef
            : _Vue.extend(resolvedDef)
          match.components[key] = resolvedDef // 组件构造器
          pending-- // 判断当前是不是已经获取所有的组件构造器了 如果是 进行下一步任务
          if (pending <= 0) {
            next()
          }
        })

        const reject = once(reason => {
          const msg = `Failed to resolve async component ${key}: ${reason}`
          process.env.NODE_ENV !== 'production' && warn(false, msg)
          if (!error) {
            error = isError(reason)
              ? reason
              : new Error(msg)
            next(error)
          }
        })

        let res
        try {
          // 执行异步工厂去获取组件资源
          res = def(resolve, reject)
        } catch (e) {
          reject(e)
        }
        if (res) {
          // 判断是不是thenable
          if (typeof res.then === 'function') {
            res.then(resolve, reject)
          } else { // 支持新语法
            // new syntax in Vue 2.3
            const comp = res.component
            if (comp && typeof comp.then === 'function') {
              comp.then(resolve, reject)
            }
          }
        }
      }
    })

    if (!hasAsync) next()
  }
}

// 传入record数组遍历 返回一个方法数组
export function flatMapComponents (
  matched: Array<RouteRecord>,
  fn: Function
): Array<?Function> {
  // 没有扁平化的数据结构可能为 [[fn,fn,[fn,fn]],[fn,fn,[fn]]]  深度为3 顺序是按照从父到子的钩子排列的 因为在初始化matched的时候就是unshift的
  // 扁平化一层之后[fn,fn,[fn,fn],fn,fn,[fn]] 深度为2
  return flatten(matched.map(m => { // 遍历每个record 
    // 每个record可能对应多个组件 一般都是将用户传入的组件包裹成 {default:cpn}
    // 遍历matched匹配到的多个组件  提取每个组件的钩子（数组）到一个数组中
    // 每个options中的钩子可能返是一个方法也可能是个方法数组 
    // 此时返回的数据结构可能为 [fn,fn,[fn,fn]]
    return Object.keys(m.components).map(key => fn(
      m.components[key], // 传入组件options
      m.instances[key], // 传入组件vm实例
      m, key
    ))
  }))
}
// 拍平一次 扁平化一级
export function flatten (arr: Array<any>): Array<any> {
  return Array.prototype.concat.apply([], arr)
}

const hasSymbol =
  typeof Symbol === 'function' &&
  typeof Symbol.toStringTag === 'symbol'

function isESModule (obj) {
  return obj.__esModule || (hasSymbol && obj[Symbol.toStringTag] === 'Module')
}

// in Webpack 2, require.ensure now also returns a Promise
// so the resolve/reject functions may get called an extra time
// if the user uses an arrow function shorthand that happens to
// return that Promise.
function once (fn) {
  let called = false
  return function (...args) {
    if (called) return
    called = true
    return fn.apply(this, args)
  }
}
