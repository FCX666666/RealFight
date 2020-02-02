import http from './http'

const homeRequest = {
  getHomeData(){
    return http.get('/home/data')
  }
}

export default homeRequest
