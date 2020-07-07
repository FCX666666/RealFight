import Axios from 'axios'

const instance = Axios.create({
  baseURL: 'http://123.207.32.32:8000',
  timeout: 5000
})

instance.interceptors.response.use(res => {
  return res.data
})

const http = {
  get(url, params, config) {
    return instance.get(url,{
      params,
      ...config
    })
  },
  post(url, data, config) {
    return instance.post(url,{
      data,
      ...config
    })
  }
}

export default http