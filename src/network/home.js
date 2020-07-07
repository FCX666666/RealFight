import http from './index.js'

export function getHomeData() {
  return http.get('/home/multidata')
}
