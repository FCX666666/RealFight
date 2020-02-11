export default {
  countX(state) {
    return state.count * 2
  },
  countY(state, getters) {
    return getters.countX * 2
  }
}
