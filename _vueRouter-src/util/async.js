/* @flow */

// 执行队列中的任务
export function runQueue (queue: Array<?NavigationGuard>, fn: Function, cb: Function) {
  const step = index => {
    if (index >= queue.length) { // 如果当前执行的步骤index大于等于数组长度就代表已经执行完了 直接调用cb通知外层已经完成任务
      cb()
    } else {
      if (queue[index]) { // 判断当前是不是空任务
        fn(queue[index], () => { // 执行当前任务（每个任务也就是一个守卫钩子） 并把任务的“继续权”移交给fn 也就是任务队列中的某一个任务
          step(index + 1)
        })
      } else { // 空任务直接跳到下一任务
        step(index + 1)
      }
    }
  }
  step(0) // 从0开始执行 也就是从个数组0开始
}
