<template>
  <div>
    <my-input @my-god='go' v-model="val"></my-input>
    <my-checkbox v-model="val2" @click="say"></my-checkbox>
    <my-sync v-bind:title.sync="val3" ></my-sync> 
    <button @click="change">click out</button>out:{{val3}}
    <my-slot :todos='todos' :condition='1'>
      <template #todo='{todo}'>
          {{todo.text+':'+todo.id}}
      </template>
    </my-slot>
  </div>
</template>

<script>
import MyInput from 'components/common/input/Input'
import MyCheckbox from 'components/common/check/Checkbox'
import MySync from 'components/common/sync/Sync'
import MySlot from 'components/common/slot/Slot'
export default {
  data() {
    return {
      val: '',
      val2: '',
      val3: 0,
      slotNow:'left',
      todos:[{
        id:1,
        text:'text 1 '
      },{
        id:2,
        text:'text 2 '
      },{
        id:3,
        text:'text 3 '
      },{
        id:4,
        text:'text 4 '
      },{
        id:5,
        text:'text 5 '
      },{
        id:6,
        text:'text 6 '
      },]
    };
  },
  components: {
    MyInput,
    MyCheckbox,
    MySync,
    MySlot
  },
  computed: {},
  mounted() { },
  created() { },
  methods: {
    go(payload) {
      console.log(payload)
    },
    say() {
      console.log(1)
    },
    change(){
      this.val3++
    }
  }
}

</script>
<style lang='less' scoped>
@import "~assets/less/test.less";
</style>