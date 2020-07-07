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
    name:'',
    props:[''],
    data () {
      return {

      };
    }
  }

</script>
<style lang='css' scoped>
  .nav-bar {
    background-color: var(--color-tint);
    text-align: center;
    display: flex;
    /* line-height 会撑开div */
    line-height: 44px;
    height: 44px;
    box-shadow: 0 1px 1px rgba(100, 100, 100, 0.1)
  }

  .left,.right {
    color:blue;
    width: 60px;
  }
  .center {
    flex : 1;
  }
</style>