<script>
export default {
  data() {
    return {
    };
  },
  props: {
    checked: {
      type: Boolean
    }
  },
  model:{
      prop:'checked', // 子组件监听的值
      event:'change' // 表示如果子组件值变化 model将会监听change方法进行数据更新
  },
  render(h) {
    return (
      <label for='icheck'>
        <input
            id='icheck'
            type='checkbox'
            checked={this.checked}
            onChange={this.go}
        /> 真爷们？
      </label>
    )
  },
  methods:{
      go(event){
          this.$emit('change',event.target.checked)
      }
  }
}
</script>
<style lang='less' scoped>
@import "~assets/less/test.less";
</style>