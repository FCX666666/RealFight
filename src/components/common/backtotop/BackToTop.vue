<template>
  <div
    class="back-top"
    @click="back"
  >
    <slot></slot>
  </div>
</template>

<script>
export default {
  data() {
    return {};
  },
  methods: {
    back() {
      this.$emit('backTop')
    }
  }
}

</script>
<style lang='css' scoped>
.back-top img {
  width: 43px;
  height: 43px;
}
</style>