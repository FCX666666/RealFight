

<script>
import MainTabBar from "components/content/MainTabBar";

const A = {
  name:'A',
  template:'<div> click 1 </div>',
}

const B = {
  name:'B',
  template:'<p> click 2 </p>'
}


export default {
  name: "app",
  template:`
   <div>
    <button @click="show"> sjsjsj</button>
    <keep-alive>
      <component :is="cpn" />
    </keep-alive>
  </div>`,
  data: () => ({
    isShow: false,
    cpn:'A'
    // i:'i am not on my-cpns props',
    // zs:{
    //   name:"zs",
    //   age:20
    // }
  }),
  components: {
    MainTabBar,
    A,
    B
  },
  methods: {
    show(a,e) {
      this.cpn = this.cpn == 'A' ? 'B': 'A'
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
