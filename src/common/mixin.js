/**
 * 混入操作 会在vue组件中添加混入对象中的内容
 * 多组件公共代码 复用代码
 */

import backTop from 'components/common/backtotop/BackToTop'

export const mixinBackTop = {
  components: {
    backTop
  },
  data() {
    return {
      isShowBackTop: false
    }
  },
  methods: {
    backTop() {
      this.$refs.scroll.scrollTo(0, 0, 300)
      this.isShowBackTop = false
    }
  }
}
