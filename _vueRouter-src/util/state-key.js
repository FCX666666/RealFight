/* @flow */
import { inBrowser } from './dom'

// use User Timing api (if present) for more accurate key precision
//使用用户计时api（如果存在）以获得更精确的密钥精度
const Time =
  inBrowser && window.performance && window.performance.now
    ? window.performance
    : Date

export function genStateKey (): string {
  return Time.now().toFixed(3)
}

let _key: string = genStateKey()

export function getStateKey () {
  return _key
}

export function setStateKey (key: string) {
  return (_key = key)
}
