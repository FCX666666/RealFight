<template>
  <div id="app">
    <!-- <div v-if="isShow"> -->
      <my-cpn></my-cpn>
    <!-- </div> -->
    <button @click="show">click</button>
    <!-- <main-tab-bar></main-tab-bar> -->
    <!-- <router-view></router-view> -->
  </div>
</template>

<script>
import MainTabBar from "components/content/MainTabBar";
export default {
  name: "app",
  data: () => ({
    isShow: false
  }),
  components: {
    MainTabBar
  },
  methods: {
    show() {
      this.isShow = true;
    }
  }
};
</script>

<style lang="less">
@import "~assets/css/base.css";
</style>
