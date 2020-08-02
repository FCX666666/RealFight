

<script>
import MainTabBar from "components/content/MainTabBar";
export default {
  name: "app",
  template:' <div><button @click.prevent>click it</button> </div>',
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
    show(a,e) {
      console.log(e)
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
