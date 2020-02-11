import {
  ADD_CART,
  ADD_COUNT
} from './mutations_types'

export default {
  //同步操作 单一操作
  //$store.commit('MUTATIONS', payload)
  //唯一目的：修改state中的状态
  [ADD_COUNT](state, payload) {
    state.count++
  },
  [ADD_CART](state, payload) {
    state.cartList.push(payload)
  }
}
