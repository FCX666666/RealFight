<template>
  <div id="app">
    <main-tab-bar></main-tab-bar>
    <router-view></router-view>
  </div>
</template>

<script>
import MainTabBar from "components/content/maintabbar/MainTabbar";
export default {
  name: "app",
  components: {
    MainTabBar
  },
  created(){
    console.log(this)
  }
};
</script>

<style lang="less">
@import "./assets/css/base.css";
</style>
