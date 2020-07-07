<script>
export default {
  data() {
    return {
      items: ["1", "2", "3"]
    };
  },
  inheritAttrs: false,
  model: {
    prop: "value",
    event: "input"
  },
  props: ["value", "level"],
  methods: {},
  computed: {
    listen() {
      const vm = this;
      return Object.assign({}, this.$listeners, {
        input: function(event) {
          vm.$emit("input", event.target.value);
        }
      });
    }
  },
  render(h) {
    let Tag = 'h'+ this.level
    const items = this.items.map(item => {
      return <Tag>{item}</Tag>;
    });
    console.log(items)
    return (
      <label>
        <input value={this.value} {...{ on: this.listen }} />
        {items}
      </label>
    );
  }
};
</script>
<style lang="less" scoped></style>
