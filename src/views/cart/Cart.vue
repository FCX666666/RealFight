<template>
  <div id="list-demo" class="demo">
    <button v-on:click="add">Add</button>
    <button v-on:click="remove">Remove</button>
    <transition-group tag="p" name="ls" :duration="{enter:500,leave :500}">
      <span v-for="item in items" :key="item" class="list-item">
        {{ item }}
      </span>
    </transition-group>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: []
    }
  },
  methods: {
    add() {
      let t = Math.floor(Math.random() * 10)
      if (!~this.items.indexOf(t)) {
        this.items.push(t)
      }
    },
    remove() {
      this.items.splice(Math.floor(Math.random() * this.items.length), 1)
    }
  }
}
</script>

<style lang="less" scoped>
.list-item {
  vertical-align: middle;
  text-align: center;
  line-height: 100px;
  display: inline-block;
  height: 100px;
  width: 100px;
  margin-right: 10px;
  border: 1px solid #333;
}
.ls-enter,
.ls-leave-to {
  opacity: 0;
  width: 0;
  font-size: 0;
}
.ls-enter-active,
.ls-leave-active {
  transition: all 0.5s;
}
.ls-enter-to,
.ls-leave {
  opacity: 1;
  width: 100px;
  font-size: 1rem;
}
</style>