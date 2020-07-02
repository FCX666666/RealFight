<template>
  <div class="header-bar">
    <div class="left-icon" @click="goBack">
      <slot name="left">
        <img src="~assets/img/logo.png" />
      </slot>
    </div>
    <div class="middle-icon">
      <span>{{title}}</span>
      <slot name="middle"></slot>
    </div>
    <div class="right-icon">
      <slot name="right" :data="names"></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: "HeadBar",
  props: {
    title: {
      type: String,
      default: ""
    },
    backCon: {
      type: Object,
      default() {
        return {
          Type: "",
          Url: "",
          Params: ""
        };
      }
    }
  },
  data () {
    return {
      names:['zhangsan','lisi','wangwu']
    }
  },
  methods: {
    goBack() {}
  }
};
</script>

<style scoped>
.header-bar {
  background-color: #fff;
  height: 3rem;
  color: #2e2e2e;
  font-size: 0.8rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
  box-shadow: 0px 1.25px 1px rgba(50, 50, 50, 0.2);
}
.left-icon .right-icon,
.middle-icon {
  display: flex;
  justify-content: center;
  color: #333333;
}
.left-icon {
  margin-left: 1.25rem;
}
.right-icon {
  margin-right: 1.25rem;
}
.middle-icon {
  margin: auto;
}
.left-icon img {
  width: 1.5rem;
  height: 1.5rem;
}
</style>
