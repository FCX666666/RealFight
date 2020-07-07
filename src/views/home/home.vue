<template>
  <div>
    <nav-bar>
      <template #left>
        <button class="needsclick" @click="$copyText('testlka;jdfkljklsdnmf kl').then(()=>{log('success')},e=>{log(e)})"> 点击复制 </button> 
      </template>
      <div slot="center">123</div>
      <div slot="right">123</div>
    </nav-bar>
      <input type="text">
  </div>
</template>

<script>
import { getHomeData } from "network/home.js";
import NavBar from "components/common/navbar/NavBar";
export default {
  name: "",
  props: [""],
  data() {
    return {
      log:console.log
    };
  },

  components: {
    NavBar
  },
  created() {
    // getHomeData()
    //   .then(result => {
    //     console.log(result);
    //   })
    //   .catch(err => err);
  },
  computed: {
  },

  beforeMount() {},

  mounted() {
    // console.log(this.__proto__)
  },

  methods: {},

  watch: {}
};
</script>
<style lang="less" scoped>
  .fb {
    color:red !important;
  }
</style>
