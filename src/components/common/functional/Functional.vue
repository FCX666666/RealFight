<template functional>
  <div :style="props" v-bind="data.attrs" v-on="data.on">
    <slot name='test'/>
    <slot />
  </div>
</template>
<script>
export default {
  name: "",
  props: {
    color: {
      type: String,
      default: "red"
    }
  }
};
</script>
<style lang="less" scoped></style>
