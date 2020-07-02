<template>
  <div>
    <ul>
      <li v-for="todo in filteredTodos" v-bind:key="todo.id">
        <slot name="todo" :todo="todo">
          {{ todo.text }}
        </slot>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  render(h) {
      return 
  },
  data() {
    return {
      user: {
        name: 'zhangsan',
        age: 18
      },
      color: ['red', 'blue']
    };
  },
  components: {},
  computed: {
    filteredTodos() {
      const vm = this
      return this.todos.filter(function (v, i, arr) {
        return v.id > vm.condition
      })
    }
  },
  props: {
    condition: {
      type: Number
    },
    todos: {
      type: Array
    }
  },
  mounted() { },
  created() { },
  methods: {}
}

</script>
<style lang='less' scoped>
@import "~assets/less/test.less";
</style>