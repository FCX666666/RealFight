<template>
  <div class="nav-bar">
    <div class="left">
      <slot name="left"></slot>
    </div>
    <div class="center">
      <slot name="center"></slot>
    </div>
    <div class="right">
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script>
export default {
  components: {},
  data() {
    return {};
  }
};
</script>
<style lang='css' scoped>
.nav-bar {
  text-align: center;
  display: flex;
  height: 44px;
  line-height: 44px;
  box-shadow: 0px 1px 1px rgba(50, 50, 50, 0.2);
}
.left,
.right {
  width: 60px;
  background-color: black;
}
.center {
  flex: 1;
  background-color: var(--color-tint);
}
</style>