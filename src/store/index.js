import Vue from "vue";
import Vuex from "vuex";
import mutations from "./mutations";
import actions from "./actions";
import getters from "./getters";

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    //状态 也就是数据
    count: 0,
    cartList: []
  },
  mutations: {
    method2() {
      console.log(2);
    }
  },
  modules: {
    a: {
      state: {
        //状态 也就是数据
        countIn: 0,
        cartListIn: [2, 3, 4]
      },
      mutations: {
        method1() {
          console.log(1);
        }
      }
    }
  }
});

window.store = store;

export default store;
