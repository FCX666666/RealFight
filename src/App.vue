

<script>
import "../_element-ui/lib/theme-chalk/index.css";
import MainTabBar from "components/content/MainTabBar";
import ElAside from "../_element-ui/packages/aside/src/main";
import ElMain from "../_element-ui/packages/main/src/main";
import ElCont from "../_element-ui/packages/container/src/main";
import Vue from "vue";

const A = {
  name: "A",
  template: "<div>  {{per}} ｜ {{some}} ｜{{tes}} </div>",
  inject: ["some", "per", "tes"],
  beforeCreate() {
    this.$emit("click");
  },
  mixins: [
    {
      data() {
        return {
          age: 10,
          // name: "lisi",
        };
      },
    },
  ],
  props: ["test", "name"],
};

const B = {
  name: "B",
  template: "<p> click 2 </p>",
};
const t = Vue.observable({
  name: "zs",
});
export default {
  template: `
  <div>
  <div id='me'></div>
  <div style="width:200px;height:200px" class='content'></div>
    <component :is='cpn' :test='lala' name='zozo' @click='change1' />
    {{per}}
    {{name}}
    <main-tab-bar @click='hdl'></main-tab-bar>
  </div>`,
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
    name: "zhangan",
    per: {
      name: "ls",
      age: 18,
    },
    lala: 100,
    // i:'i am not on my-cpns props',
    // zs:{
    //   name:"zs",
    //   age:20
    // }
  }),
  provide() {
    return {
      some: this.name,
      per: this.per,
      tes: t,
    };
  },
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
    hdl() {
      this.change3();
    },
    change1() {
      console.log("con beforecreated");
      this.per.name = "zs";
    },
    change2() {
      this.per = {
        name: "zs",
      };
    },
    change3() {
      this.name = 10;
    },
    change4() {
      t.name = "ls";
    },
  },
  watch: {
    isShow(old, val) {
      console.log(val === old);
    },
  },
  computed: {
    // name() {
    //   return this.isShow;
    // },
  },
  mounted() {
    // this.mermaidApi.initialize({startOnLoad:true})
    // this.$nextTick(() => {
    //   this.mermaidApi.render("me", "graph TB\na-->b", () => {
    //     console.log(1);
    //   });
    // });
    // console.log(document.querySelector('#editor'))
    // new this.E('.tool','.content').create()
  },
};
</script>

<style lang="less">
@import "~assets/css/base.css";
</style>
