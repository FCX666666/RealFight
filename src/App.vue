

<script>

let ID$1 = 0

import MainTabBar from "components/content/MainTabBar";
import Vue from "vue";

const A = {
  name: "A",
  template: `

  <div>  
    <div ref='flow' :class='id'></div>
  </div>
  
  `,
  props: ['steps', 'type', 'direction'],
  data() {
    return {
      id:'__MERMAID__ID__'+ID$1++
    }
  },
  computed: {
    maidSteps() {
      return this.steps.join('\n')
    },
    maidType() {
      return this.type.indexOf('raph') !== -1 ? 'graph' : 'sequenceDiagram'
    },
    direct() {
      return ' ' + (this.maidType === 'graph' ? this.direction.toUpperCase() : '') + '\n'
    },
    res() {
      return this.maidType + this.direct + this.maidSteps
    },
    append(val){
      console.log()
    }
  },
  methods: {
    initMermaid(val) {
      this.maidApi.initialize({ startOnLoad: true })
      this.maidApi.render(this.id, val, (a, b) => {
        this.$refs.flow.innerHTML = a
      })
    }
  },
  mounted() {
    this.initMermaid(this.res)
  },
  watch: {
    res(val){
      this.initMermaid(val)
    }
  }
};

const t = Vue.observable({
  name: 'zs'
})
export default {
  template: `
  <div>
    <component :is='cpn' type='graph' direction='lr' :steps="['a-->b','b-->c','c--s-->d',arr]" />
    <component :is='cpn' type='graph' direction='lr' :steps="['a-->b','b-->c','c--s-->d',arr]" />
    <component :is='cpn' type='graph' direction='lr' :steps="['a-->b','b-->c','c--s-->d',arr]" />
    <component :is='cpn' type='graph' direction='lr' :steps="['a-->b','b-->c','c--s-->d',arr]" />
    <component :is='cpn' type='graph' direction='lr' :steps="['a-->b','b-->c','c--s-->d',arr]" />
    <component :is='cpn' type='graph' direction='lr' :steps="['a-->b','b-->c','c--s-->d',arr]" />
    <component :is='cpn' type='graph' direction='lr' :steps="['a-->b','b-->c','c--s-->d',arr]" />
    <component :is='cpn' type='graph' direction='lr' :steps="['a-->b','b-->c','c--s-->d',arr]" />
    {{arr}}
    <button @click='arr="d--ss-->a"'>click</button>
  </div>`,
  name: "app",
  data: () => ({
    arr: 'test',
    cpn: 'A'
  }),
  components: {
    A
  },
  mounted() {
    console.log(this)
  },
  updated() {
    console.log(this)
  }
};
</script>

<style lang="less">
@import "~assets/css/base.css";
</style>
