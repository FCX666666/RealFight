<template>
  <div id="app">
    <!-- <div v-if="isShow"> -->
      <!-- <my-cpn :cool='i'></my-cpn> -->
    <!-- </div> -->
    <!-- {{isShow}} 
    {{name}} -->
    {{name}}
    {{zs}}
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
    // i:'i am not on my-cpns props',
    zs:{
      name:"zs",
      age:20
    }
  }),
  components: {
    MainTabBar
  },
  methods: {
    show() {
      this.isShow = !this.isShow
    }
  },
  watch: {
    isShow(old,val){
      console.log(val === old)
    }
  },
  computed:{
    name(){
      return this.isShow
    }
  }
};
</script>

<style lang="less">
@import "~assets/css/base.css";
</style>
