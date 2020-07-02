<template>
  <div id="app">
    <keep-alive include="Home">
      <router-view></router-view>
    </keep-alive>
    <main-tab-bar />
  </div>
</template>

<script>
import MainTabBar from "components/content/MainTabBar";
export default {
  name: 'app',
  components: {
    MainTabBar
  }
};
</script>

<style lang='less'>
@import "~assets/css/base.css";
</style>