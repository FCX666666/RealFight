import Module from './module'
import { assert, forEachValue } from '../util'

export default class ModuleCollection {
  constructor (rawRootModule) {
    // register root module (Vuex.Store options)
    // 通过传入的options去构造modules
    this.register([], rawRootModule, false)
  }

  // 获取
  get (path) {
    return path.reduce((module, key) => { // module 就是每个模块 key就是数组中的每个值 通过reduce可以轻易的让数组中的每一项和modules层级对应
      return module.getChild(key) // 从root开始不断的深层寻找模块（在自身的_children）
    }, this.root) // 当path是一个空数组的时候刚好返回root
  }

  getNamespace (path) {
    let module = this.root
    return path.reduce((namespace, key) => {
      module = module.getChild(key)
      return namespace + (module.namespaced ? key + '/' : '')
    }, '')
  }

  update (rawRootModule) {
    update([], this.root, rawRootModule)
  }

  /**
   * 初始化modules
   * @param {*} path 模块对应的path 初始化的时候为一个空数组[]
   * @param {*} rawModule options
   * @param {*} runtime 是不是在运行时初始化的
   */
  register (path, rawModule, runtime = true) {
    if (process.env.NODE_ENV !== 'production') {
      assertRawModule(path, rawModule)
    }

    // 创建新的module
    const newModule = new Module(rawModule, runtime)
    if (path.length === 0) { // 根据path长度判断是不是根 如果是根 就为当前collection添加root属性
      this.root = newModule
    } else {
      // 递归进入
      // 获取开始到倒数第二个path并传入get 作为parent
      // 获取当前module的父级module
      const parent = this.get(path.slice(0, -1))
      // 父级children添加当前module
      parent.addChild(path[path.length - 1], newModule)
    }

    // register nested  处理嵌套的modules 实际上就是处理root内部的modules
    if (rawModule.modules) {
      forEachValue(rawModule.modules, (rawChildModule, key) => {
        // 此时递归调用register进行模块的初始化 
        // 注意此时的path不再是[] 而是加入了key
        // 假设现在定义了一个store
        /*
          new vuex.Store({
            modules:{ // rawModule.modules 
              a:{ // a => key    modules.a => rawChildModule
                //...
              },
              b:{
                //...
              }
            }
          })
        */
        // 此时的key就分别是a 和 b
        // 所以concat的结果分别是 [a] [b] 然后有传入了各自的store对象
        this.register(path.concat(key), rawChildModule, runtime)
      })
    }
  }

  unregister (path) {
    const parent = this.get(path.slice(0, -1))
    const key = path[path.length - 1]
    if (!parent.getChild(key).runtime) return

    parent.removeChild(key)
  }
}

function update (path, targetModule, newModule) {
  if (process.env.NODE_ENV !== 'production') {
    assertRawModule(path, newModule)
  }

  // update target module
  targetModule.update(newModule)

  // update nested modules
  if (newModule.modules) {
    for (const key in newModule.modules) {
      if (!targetModule.getChild(key)) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `[vuex] trying to add a new module '${key}' on hot reloading, ` +
            'manual reload is needed'
          )
        }
        return
      }
      update(
        path.concat(key),
        targetModule.getChild(key),
        newModule.modules[key]
      )
    }
  }
}

// 判定是不是function
const functionAssert = {
  assert: value => typeof value === 'function',
  expected: 'function'
}

// 判定是不是function 或者object包含function  handler
const objectAssert = {
  assert: value => typeof value === 'function' ||
    (typeof value === 'object' && typeof value.handler === 'function'),
  expected: 'function or object with "handler" function'
}

const assertTypes = {
  getters: functionAssert,
  mutations: functionAssert,
  actions: objectAssert
}

// 断言module各模块类型
function assertRawModule (path, rawModule) {
  Object.keys(assertTypes).forEach(key => {
    if (!rawModule[key]) return

    const assertOptions = assertTypes[key]

    // 根据预设好的断言
    // 遍历查看当前是不是满足mutation action getters的类型
    forEachValue(rawModule[key], (value, type) => {
      assert(
        assertOptions.assert(value),
        makeAssertionMessage(path, key, type, value, assertOptions.expected)
      )
    })
  })
}
// 拼接字符串
function makeAssertionMessage (path, key, type, value, expected) {
  let buf = `${key} should be ${expected} but "${key}.${type}"`
  if (path.length > 0) {
    buf += ` in module "${path.join('.')}"`
  }
  buf += ` is ${JSON.stringify(value)}.`
  return buf
}
