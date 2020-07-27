<template>
  <tab-bar>
    <tab-bar-item path="/home"  class='nav-xxx'>
      <!-- <img slot="item-icon"  alt="">
      <img slot="item-icon-active"  alt=""> -->
      <div slot="item-text">首页</div>
    </tab-bar-item>
    <tab-bar-item path="/category" class='nav-ccc'>
      <!-- <img slot="item-icon" src="~assets/img/logo.png" alt="">
      <img slot="item-icon-active" src="~assets/img/logo.png" alt=""> -->
      <div slot="item-text" @click="toggle">分类  {{cool}}</div>
      
    </tab-bar-item>
    <!-- <tab-bar-item path="/cart">
      <img slot="item-icon" src="~assets/img/logo.png" alt="">
      <img slot="item-icon-active" src="~assets/img/logo.png" alt="">
      <div slot="item-text">购物车</div>
    </tab-bar-item>
    <tab-bar-item path="/profile">
      <img slot="item-icon" src="~assets/img/logo.png" alt="">
      <img slot="item-icon-active" src="~assets/img/logo.png" alt="">
      <div slot="item-text">我的</div>
    </tab-bar-item> -->
  </tab-bar>
</template>

<script>
  import TabBar from 'components/common/tabbar/TabBar'
  import TabBarItem from 'components/common/tabbar/TabBarItem'
  export default {
    name: "MainTabBar",
    components: {
      TabBar,
      TabBarItem
    },
    mounted(){
      this.cool = 2
    },
    props:{
      cool:{
        type:String,
        required:false
      }
    },
    methods:{
      toggle(){
        this.cool = 1000
      }
    }
  }
</script>

<style scoped>

</style>