import {
  ADD_CART,
  ADD_COUNT
} from './mutations_types'
import utils from '../common/utils'
import {
  ADD_CART_ACTIONS
} from './actions_types'
export default {
  //异步操作和判断逻辑的复杂操作
  //this.$store.dispatch('action', payload)
  [ADD_CART_ACTIONS]({
    commit
  }, payload) {
    // utils.getType(payload) == utils.typesName.numberTag ? commit(ADD_COUNT, payload) : commit(ADD_CART, payload)
    utils.getType(payload) == utils.typesName.numberTag ?
      setTimeout(() => { //模拟异步操作
        commit(ADD_COUNT, payload)
        console.log('asdasd');
      }, 10000) :
      commit(ADD_CART, payload)
    return new Promise(res => {
      setTimeout(() => {
        res('ok')
      }, 2000);
    })
  },
}
