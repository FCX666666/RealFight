<template>
  <div id="app">
    <main-tab-bar></main-tab-bar>
    <my-cpn></my-cpn>
    <!-- <router-view></router-view> -->
  </div>
</template>

<script>
import MainTabBar from "components/content/MainTabBar";
export default {
  name: "app",
  components: {
    MainTabBar
  }
};
</script>

<style lang='less'>
@import "~assets/css/base.css";
</style>
