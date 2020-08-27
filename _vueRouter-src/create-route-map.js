/* @flow */

import Regexp from 'path-to-regexp'
import { cleanPath } from './util/path'
import { assert, warn } from './util/warn'

export function createRouteMap (
  routes: Array<RouteConfig>, // { path: '/user/:id', component: User }
  oldPathList?: Array<string>, // 以下三项为上次解析出来的结果
  oldPathMap?: Dictionary<RouteRecord>,
  oldNameMap?: Dictionary<RouteRecord>
): { // 返回解析结果对象
  pathList: Array<string>,
  pathMap: Dictionary<RouteRecord>,
  nameMap: Dictionary<RouteRecord>
} {
  // the path list is used to control path matching priority
  const pathList: Array<string> = oldPathList || []
  // $flow-disable-line
  const pathMap: Dictionary<RouteRecord> = oldPathMap || Object.create(null)
  // $flow-disable-line
  const nameMap: Dictionary<RouteRecord> = oldNameMap || Object.create(null)

  routes.forEach(route => { // 所有的路由匹配记录都添加到三个引用中
    addRouteRecord(pathList, pathMap, nameMap, route) // 添加一条路由匹配记录
  })

  // ensure wildcard（通配符） routes are always at the end 确保通配符路由在最后
  for (let i = 0, l = pathList.length; i < l; i++) {
    if (pathList[i] === '*') {
      pathList.push(pathList.splice(i, 1)[0])
      l-- // 解决循环次数-1
      i-- // 然后回退上次循环到的地方 因为通配符已经挪到最后一个 不会影响原循环
    }
  }

  if (process.env.NODE_ENV === 'development') {
    // warn if routes do not include leading slashes
    const found = pathList
    // check for missing leading slash 检查是否缺少正斜杠 也就是路由设置不规范
      .filter(path => path && path.charAt(0) !== '*' && path.charAt(0) !== '/')

    if (found.length > 0) {
      const pathNames = found.map(path => `- ${path}`).join('\n')
      warn(false, `Non-nested routes must include a leading slash character. Fix the following routes: \n${pathNames}`)
    }
  }

  return {
    pathList,
    pathMap,
    nameMap
  }
}

// 添加一条路由匹配记录
function addRouteRecord (
  pathList: Array<string>,
  pathMap: Dictionary<RouteRecord>,
  nameMap: Dictionary<RouteRecord>,
  route: RouteConfig,
  parent?: RouteRecord,
  matchAs?: string
) {
  const { path, name } = route // { path: '/user/:id', component: User,name:'user' } => /user/:id  User
  if (process.env.NODE_ENV !== 'production') { // 提示path是必须的
    assert(path != null, `"path" is required in a route configuration.`)
    assert(
      typeof route.component !== 'string',
      `route config "component" for path: ${String(
        path || name
      )} cannot be a ` + `string id. Use an actual component instead.` // 提示name必须为组件而不是字符串
    )
  }

  const pathToRegexpOptions: PathToRegexpOptions =
    route.pathToRegexpOptions || {} // pathToRegexpOptions 路径匹配设置
  const normalizedPath = normalizePath(path, parent, pathToRegexpOptions.strict) // 标准化信息 返回一个标准化的path路径

  if (typeof route.caseSensitive === 'boolean') { // 大小写是否敏感
    pathToRegexpOptions.sensitive = route.caseSensitive
  }

  // 每个record是一个路由的描述
  const record: RouteRecord = {
    path: normalizedPath,
    regex: compileRouteRegex(normalizedPath, pathToRegexpOptions), //  通过编译正则的选项去编译标准化的路径到正则规则
    components: route.components || { default: route.component },
    instances: {},
    name,
    parent,
    matchAs,
    redirect: route.redirect,
    beforeEnter: route.beforeEnter,
    meta: route.meta || {},
    props:
      route.props == null
        ? {}
        : route.components
          ? route.props
          : { default: route.props }
  }

  if (route.children) {
    // Warn if route is named, does not redirect and has a default child route.
    // If users navigate to this route by name, the default child will
    // not be rendered (GH Issue #629)
    if (process.env.NODE_ENV !== 'production') {
      if (
        route.name && // 包含组件对象
        !route.redirect && // 且不是重定向
        route.children.some(child => /^\/?$/.test(child.path)) // 
      ) {
        warn(
          false,
          `Named Route '${route.name}' has a default child route. ` +
            `When navigating to this named route (:to="{name: '${
              route.name
            }'"), ` +
            `the default child route will not be rendered. Remove the name from ` +
            `this route and use the name of the default child route for named ` +
            `links instead.`
        )
      }
    }
    route.children.forEach(child => { // 遍历 为子路由和别名路由创建添加路由记录
      const childMatchAs = matchAs // 别名路由会存在matchAs 为别名路由创建匹配的path
        ? cleanPath(`${matchAs}/${child.path}`)
        : undefined
      addRouteRecord(pathList, pathMap, nameMap, child, record, childMatchAs) // 深度遍历
    })
  }

  if (!pathMap[record.path]) { // 添加当前路径和路由记录
    pathList.push(record.path)
    pathMap[record.path] = record
  }

  if (route.alias !== undefined) { // 如果设置了别名
    const aliases = Array.isArray(route.alias) ? route.alias : [route.alias]
    for (let i = 0; i < aliases.length; ++i) {
      const alias = aliases[i]
      if (process.env.NODE_ENV !== 'production' && alias === path) { // 看看是不是已经和path名称一致了
        warn(
          false,
          `Found an alias with the same value as the path: "${path}". You have to remove that alias. It will be ignored in development.`
        )
        // skip in dev to make it work
        continue
      }

      const aliasRoute = { 
        path: alias,
        children: route.children
      }
      addRouteRecord( // 添加别名路由记录
        pathList,
        pathMap,
        nameMap,
        aliasRoute,
        parent,
        record.path || '/' // matchAs
      )
    }
  }

  if (name) { // 如果当前是命名路由
    if (!nameMap[name]) { 
      nameMap[name] = record
    } else if (process.env.NODE_ENV !== 'production' && !matchAs) {
      warn(
        false,
        `Duplicate named routes definition: ` +
          `{ name: "${name}", path: "${record.path}" }`
      )
    }
  }
}

// 编译路由正则
function compileRouteRegex (
  path: string,
  pathToRegexpOptions: PathToRegexpOptions
): RouteRegExp {
  const regex = Regexp(path, [], pathToRegexpOptions)
  if (process.env.NODE_ENV !== 'production') {
    const keys: any = Object.create(null)
    regex.keys.forEach(key => {
      warn(
        !keys[key.name],
        `Duplicate param keys in route with path: "${path}"`
      )
      keys[key.name] = true
    })
  }
  return regex
}

function normalizePath (
  path: string,
  parent?: RouteRecord,
  strict?: boolean
): string {
  if (!strict) path = path.replace(/\/$/, '') // 不是严格模式就直接把最后的/去掉
  if (path[0] === '/') return path // 判断是不是/开头的 代表绝对路径
  if (parent == null) return path // 判断有没有父级路由
  return cleanPath(`${parent.path}/${path}`) // 相对路径 拼接父级路由
}
