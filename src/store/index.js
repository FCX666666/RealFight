import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: { //状态 也就是数据
    count: 1000
  },
  mutations: { //同步操作

  },
  actions: { //异步操作

  },
  getters: {
    countX(state) {
      return state.count * 2
    },
    countY(state, getters) {
      return getters.countX * 2
    }
  },
  modules: {

  }
})

export default store
