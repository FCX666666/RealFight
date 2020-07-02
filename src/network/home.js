import http from './http'

const homeRequest = {
  getHomeData(){
    return http.get('/home/data')
  }
}

homeRequest.getHomeData()

export default homeRequest
