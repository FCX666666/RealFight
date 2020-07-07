import axios from 'axios'

let http = {};

let _axios = axios.create({
  baseURL: 'http://123.207.32.32:8000/', //这里的配置仅仅属于_axios
  timeout: 5000
});
_axios.interceptors.request.use(config => {
  /**
   * 请求拦截的作用
   * 1. 拦截信息不符合服务器要求的请求
   * 2. 可以在发送请求时希纳是请求图标
   * 3. 某些网络请求需要携带一些token之类的特殊信息
   */
  // console.log(config)
  return config
}, err => {
  // console.log(err);
})
_axios.interceptors.response.use(data => {
  // console.log(data);
  return data.data
}, err => {
  // console.log(err);
})

http.get = function get(url,params,config) {
  return _axios({
    method: 'get',
    url,
    params,
    ...config
  })
}

http.post = function get(url,data,config) {
  return _axios({
    method: 'get',
    url,
    data,
    ...config
  })
}

export default http
