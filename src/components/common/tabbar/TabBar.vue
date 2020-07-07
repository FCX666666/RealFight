<template>
  <div>
    <div class="tab-bar">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: "TabBar",
  data() {
    return {};
  }
};
</script>
<style lang="css" scoped>
.tab-bar {
  display: flex;
  height: 49px;
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;

  background-color: #f6f6f6;
  /* box-shadow ： x偏移量 y偏移量 模糊程度 在通过rgba(color,color,color,opacity)设置颜色和透明度 */
  box-shadow: 0px -1px 1px rgba(100, 100, 100, 0.1);
}
</style>
