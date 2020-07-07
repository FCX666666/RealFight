import Vue from 'vue'
import Vuex from 'vuex'
import mutations from './mutations'
import actions from './actions'
import getters from './getters'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: { //状态 也就是数据
    count: 0,
    cartList: []
  },
  mutations,
  actions,
  getters,
  modules: {}
})

export default store
