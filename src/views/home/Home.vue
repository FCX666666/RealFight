<template>
  <div>
    <head-bar title="123"></head-bar>
    <button
      style="position:relative;top:10rem;"
      @click="tesdMutaionsAndMutations"
    >
      {{countX}} click
    </button>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { ADD_CART_ACTIONS } from '@/store/actions_types'
import http from "network/home";
import HeadBar from "components/common/headbar/HeadBar";
export default {
  name: "Home",
  components: {
    HeadBar
  },
  methods: {
    tesdMutaionsAndMutations() {
      this.$store.dispatch(ADD_CART_ACTIONS, 1).then(res => console.log(res))
    }
  },
  data() {
    return {};
  },
  created() {
    http.getHomeData().then(data => { });
    /**
     * 
     */
    this.$nextTick(() => { });
  },
  activated() {
    console.log('页面活跃');
  },
  deactivated() {
    console.log("页面不活跃");
  },
  computed: {
    //將vuex.getter轉換成 計算屬性
    ...mapGetters(['countX'])
  }
};
</script>

<style>
</style>