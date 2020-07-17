<template>
  <div id="app">
    <!-- <div v-if="isShow"> -->
      <!-- <my-cpn :cool='i'></my-cpn> -->
    <!-- </div> -->
    {{isShow}}
    <button @click="show">click</button>
    <main-tab-bar cool='i'></main-tab-bar>
    <!-- <router-view></router-view> -->
  </div>
</template>

<script>
import MainTabBar from "components/content/MainTabBar";
export default {
  name: "app",
  data: () => ({
    isShow: false,
    i:'i am not on my-cpns props'
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
