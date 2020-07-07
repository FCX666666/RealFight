<template>
  <div>
    <tab-bar>
      <tab-bar-item path="/home">
        <div slot="non-active">
          <img src="~assets/img/logo.png" alt="" />
        </div>
        <div slot="on-active">
          <img src="~assets/img/logo.png" alt="" />
        </div>
        <div slot="text-in">首页</div>
      </tab-bar-item>
      <tab-bar-item path="/category">
        <div slot="non-active">
          <img src="~assets/img/logo.png" alt="" />
        </div>
        <div slot="on-active">
          <img src="~assets/img/logo.png" alt="" />
        </div>
        <div slot="text-in">分类</div>
      </tab-bar-item>
      <tab-bar-item path="cart">
        <div slot="non-active">
          <img src="~assets/img/logo.png" alt="" />
        </div>
        <div slot="on-active">
          <img src="~assets/img/logo.png" alt="" />
        </div>
        <div slot="text-in">购物车</div>
      </tab-bar-item>
      <tab-bar-item path="profile">
        <div slot="non-active">
          <img src="~assets/img/logo.png" alt="" />
        </div>
        <div slot="on-active">
          <img src="~assets/img/logo.png" alt="" />
        </div>
        <div slot="text-in">我的</div>
      </tab-bar-item>
    </tab-bar>
  </div>
</template>

<script>
import TabBar from "components/common/tabbar/TabBar";
import TabBarItem from "components/common/tabbar/TabBarItem";
export default {
  name: "",
  props: [""],
  data() {
    return {};
  },

  components: {
    TabBar,
    TabBarItem
  },

  computed: {},

  beforeMount() {},

  mounted() {},

  methods: {},

  watch: {}
};
</script>
<style lang="" scoped></style>
