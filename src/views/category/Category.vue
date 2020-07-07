<template>
  <div>
    <button @click="toggleCpn"> 点击切换组件 </button>

    <keep-alive>
      <component :is="current" />
    </keep-alive>
<!-- 
    <input type="checkbox" v-model="toggle" true-value="yes" false-value="no">
    {{toggle ? toggle : ''}}
    <top-input v-model='value'></top-input>
    {{value}}
    <scroll ref="scroll" class="category-scroll" id="scroll" @scroll="topIcon" :probe-type="3">
      <a :[attrname]="attr">baidu</a>
      <button @click="changeAttr"> click 1 </button>
      <button @click="changeValue"> click 2 </button>
    </scroll>
    <back-top @backTop="backTop" class="back-top" v-show="isShowBackTop">
      <img src="~assets/img/logo.png" alt="">
    </back-top> -->
  </div>
</template>

<script>
import Scroll from 'components/common/scroll/Scroll'
import TopInput from 'components/common/input/Input'
export default {
  data() {
    return {
      attrname: 'href',
      attr: 'none',
      toggle: 'yes',
      value: '',
      current: 'back-top',
      idx:0
    };
  },
  components: {
    Scroll,
    TopInput
  },
  computed: {},
  mounted() { },
  created() { },
  methods: {
    topIcon() {
      -this.$refs.scroll.scroll.y > 100 && (this.isShowBackTop = true)
    },
    changeAttr() {
      this.attrname = 'title'
    },
    changeValue() {
      this.attr = 'is truth'
    },
    toggleCpn() {
      (this.idx > 2 ) && (this.idx = 0) 
      this.current = ['back-top','scroll','top-input'][this.idx]
    }
  }
}

</script>
<style lang='css' scoped>
.category-scroll {
  position: absolute;
  top: 3rem;
  left: 0;
  right: 0;
  bottom: 10rem;
}

.scroll-fa {
  position: relative;
  height: 100vh;
}

.back-top {
  position: fixed;
  right: 10px;
  bottom: 65px;
}
</style>