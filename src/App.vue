

<script>
import MainTabBar from "components/content/MainTabBar";
export default {
  name: "app",
  template:`
   <div>
   <main-tab-bar v-model="zs.age" @click="show">click it</main-tab-bar> 
    <button @click="zs.age+=1"> click </button> {{this.zs.age}}
  </div>`,
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
