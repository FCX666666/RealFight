<template>
  <div>
    <button @click="change"> click in </button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      num: this.title
    };
  },
  props: ['title'],
  components: {},
  computed: {
    num2(){
      return this.title
    }
  },
  mounted() { },
  created() { },
  methods: {
    change() {
      this.$emit('update:title', ++this.num)
    }
  }
}

</script>
<style lang='less' scoped>
@import "~assets/less/test.less";
</style>