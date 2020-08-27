<template>
  <div>
    <router-view></router-view>
    <el-cont>
      <el-aside>123123123123123123123123123</el-aside>
      <el-main>123123123</el-main>
    </el-cont>
  </div>
</template>

<script>
import "../_element-ui/lib/theme-chalk/index.css";
import MainTabBar from "components/content/MainTabBar";
import ElAside from "../_element-ui/packages/aside/src/main";
import ElMain from "../_element-ui/packages/main/src/main";
import ElCont from "../_element-ui/packages/container/src/main";
import Vue from "vue";
const A = {
  name: "A",
  template: "<div> click 1 </div>",
  mixins: [
    {
      data() {
        return {
          name: "zhangsan",
        };
      },
    },
    {
      data() {
        return {
          age: 10,
          name: "lisi",
        };
      },
    },
  ],
};

const B = {
  name: "B",
  template: "<p> click 2 </p>",
};

export default {
  name: "app",
  // template:`
  //  <div>
  //  <slot></slot>
  //   <button @click="show"> sjsjsj</button>
  //   <keep-alive>
  //     <div>1</div>
  //     <component :is="cpn" />
  //   </keep-alive>
  // </div>`,
  data: () => ({
    isShow: false,
    cpn: "A",
    // i:'i am not on my-cpns props',
    // zs:{
    //   name:"zs",
    //   age:20
    // }
  }),
  components: {
    MainTabBar,
    A,
    B,
    ElAside,
    ElMain,
    ElCont,
  },
  methods: {
    show(a, e) {
      this.cpn = this.cpn == "A" ? "B" : "A";
    },
  },
  watch: {
    isShow(old, val) {
      console.log(val === old);
    },
  },
  computed: {
    name() {
      return this.isShow;
    },
  },
  mounted() {
    console.log(this);
  },
};
</script>

<style lang="less">
@import "~assets/css/base.css";
</style>
