<script>
export default {
  inheritAttrs: false, // 指定父组件在使用当前组件的时候不会继承未在props中声明的属性
  props: ['value', 'inputColor'],
  methods: {
    change(e) {
      this.$emit('input', e.target.value)
    },
    do() {
      console.log({ ...{ attrs: this.$attrs } })
      console.log({ attrs: this.$attrs })
    },
    testEmit() {
      if (this.value === 'xcf') {
        this.$emit('my-god', 'test')
      }
    }
  },
  computed: {
    color() {
      return `color:${this.inputColor ? this.inputColor : 'red'}`
    }
  },
  render(h) {
    return (
      <div>
        <input
          {...{ attrs: this.$attrs }}
          style={this.color}
          value={this.value}
          onInput={this.change}
          onClick={this.do}
          onBlur={this.testEmit}
        />
      </div>
    )
  }
}
</script>