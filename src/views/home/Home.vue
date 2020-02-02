<template>
  <nav-bar>
    <div class="center" slot="center">购物车</div>
  </nav-bar>
</template>

<script>
import http from "network/home";
import NavBar from "components/common/navbar/NavBar";
export default {
  components: {
    NavBar
  },
  data() {
    return {};
  },
  created() {
    http.getHomeData().then(data => {});
  }
};
</script>

<style>
</style>