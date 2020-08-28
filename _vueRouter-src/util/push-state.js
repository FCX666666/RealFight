/* @flow */

import { inBrowser } from './dom'
import { saveScrollPosition } from './scroll'
import { genStateKey, setStateKey, getStateKey } from './state-key'
import { extend } from './misc'

// 检查当前浏览器环境是不是支持window.hsitory.pushState
export const supportsPushState =
  inBrowser &&
  (function () {
    const ua = window.navigator.userAgent

    if ( // 特定版本不支持
      (ua.indexOf('Android 2.') !== -1 || ua.indexOf('Android 4.0') !== -1) &&
      ua.indexOf('Mobile Safari') !== -1 &&
      ua.indexOf('Chrome') === -1 &&
      ua.indexOf('Windows Phone') === -1
    ) {
      return false
    }

    // 直接通过全局变量支持
    return window.history && 'pushState' in window.history
  })()

  // mdn原文：the history.pushState() method adds a state to the browser's session history stack.
  // add 再历史栈添加一个路由状态
  // 举例说明：history.pushState({foo:bar}, "page 2", "bar.html")
  // 这将导致显示URL栏http://mozilla.org/bar.html，但不会导致浏览器加载bar.html,也不会检查bar.html是否存在。
  // 现在假设用户导航到http://google.com，然后单击“上一步”按钮。
  // 此时，URL栏将显示http://mozilla.org/bar.html并history.state包含{foo:bar}这个对象。
  // popstate事件不会被触发，因为页面被reloaded并不是在mozilla内部转换路由。该页面本身就好像是bar.html（实际上foo.html）。
  // 如果用户再次单击“上一步”，则URL将更改为http://mozilla.org/foo.html，
  // 并且dom将触发一个popstate事件，这次history得到的是一个null状态对象。
  // 在这里，尽管文档可能会在接收到popstate事件后手动更新dom内容，但是返回时也不会更改dom的上一步内容。

  // mdn原文：The History.replaceState() method modifies the current history entry,  
  // modifies 修改当前历史栈栈顶元素 
  // 举例说明：
  // 假设现在地址栏 https://www.mozilla.org/foo.html 
  // 然后使用 history.pushState({foo:bar}, "page 2", "bar0.html")添加bar0.html到地址栏中 地址栏变为 https://www.mozilla.org/bar0.html 
  // 此时调用 history.replaceState(stateObj, '', 'bar2.html') 会让路由地址 https://www.mozilla.org/bar2.html 如此展示，同样的，也不会展示bar2.html是不是存在更不会加载它
  // 然后点击返回上一步或者go(-1) 会发现页面并没有回到 bar0 ，而是直接跳转到了foo 
export function pushState (url?: string, replace?: boolean) {
  saveScrollPosition() // 保存滚动到的位置
  // try...catch the pushState call to get around Safari
  // DOM Exception 18 where it limits to 100 pushState calls
  const history = window.history
  try {
    if (replace) { //
      // preserve existing history state as it could be overriden by the user
      //保留现有的历史记录状态，因为它可能被用户覆盖
      const stateCopy = extend({}, history.state) // 获取当前的state对象
      stateCopy.key = getStateKey() // 获取密钥  其实就是一个时间戳 这个时间戳在replace的过程中是不会重新生成的
      history.replaceState(stateCopy, '', url) // 调用原生api去更新url
    } else {
      history.pushState({ key: setStateKey(genStateKey()) }, '', url) // 只有push才会更新密钥 生成key并替换全局key  下次replace是上次push的结果
    }
  } catch (e) { // 一百次更新之后就直接利用其他方法去更新url
    // The replace() method of the Location interface replaces the current resource with the one at the provided URL.
    // The Location.assign() method causes the window to load and display the document at the URL specified. 
    window.location[replace ? 'replace' : 'assign'](url)
  }
}

export function replaceState (url?: string) {
  pushState(url, true)
}
