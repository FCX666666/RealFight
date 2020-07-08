<template>
  <div>
    <head-bar class="color">
      <!-- v-slot用法  只能应用在template标签上 v-slot:left 简写成#left -->
      <template #left>123</template>
      <template #middle>123</template>
      <!-- 作用于插槽 用于父组件不满意子组件的排布方式但是仍想用子组件的数据 -->
      <template #right="data">{{data.data}}</template>
    </head-bar>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { ADD_CART_ACTIONS } from '@/store/actions_types'
import http from "network/home";
import HeadBar from "components/common/headbar/HeadBar";
// import Toast from 'components/common/toast/Toast'
export default {
  name: "Home",
  components: {
    HeadBar,
    // Toast
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
    this.$nextTick(() => { });
  },
  mounted () {
    // this.$toast.showToast('asdasd')
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

<style lang="less">
@import '~assets/less/test.less';
.test {
  .color();
}
.toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate3d(-50%, -50%, 0);
}
</style>
