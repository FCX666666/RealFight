<template>
  <div
    id="toast"
    class="toast"
    v-show="isShow"
  >
    {{message}}
  </div>
</template>

<script>
export default {
  data() {
    return {
      isShow: false,
      message: ''
    };
  },
  methods: {
    showToast(msg, delay = 2000) {
      this.message = msg
      this.isShow = true
      setTimeout(() => {
        this.isShow = false
      }, delay);
    }
  }
}

</script>
<style lang='css' scoped>
.toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate3d(-50%, -50%, 0);
  color: #fff;
  background-color: rgba(0, 0, 0, 0.75);
  padding: 0.5rem;
  z-index: 10086;
}
</style>