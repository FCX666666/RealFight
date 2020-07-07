<template>
  <div class="tabbar-item" @click="itemClick">
    <div v-if="!active" class="img-class"><slot name="non-active"></slot></div>
    <div v-else><slot name="on-active"></slot></div>
    <div :style="activeStyle"><slot name="text-in"></slot></div>
  </div>
</template>

<script>
export default {
  name: "TabBarItem",
  props: {
    path: {
      type: String,
      default: "/home"
    },
    activeClass: {
      type: String,
      default: "red"
    }
  },
  data() {
    return {};
  },

  computed: {
    active() {
      this.$route.path.includes(this.path);
    },
    activeStyle() {
      return this.active
        ? Object.assign(
            {},
            { color: this.activeClass },
            { marginBottom: "3px" }
          )
        : { marginBottom: "3px" };
    }
  },
  methods: {
    itemClick() {
      this.$router.push({
        path: this.path
      });
    }
  }
};
</script>
<style lang="css" scoped>
.tabbar-item {
  /* flex：1会均等分空间 */
  flex: 1;
  display: flex;
  flex-flow: column;
  text-align: center;
}
.active {
  color: red;
}
.img-class {
  margin: auto;
}
.img-class img {
  width: 20px;
  height: 20px;
}
</style>
