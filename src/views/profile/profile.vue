<template>
  <div>
    <!-- <radio v-model="choose" @blur="blur" @click="click" :level="2">
      <template v-slot:default>
        <p>asdasdasd</p>
      </template>
    </radio> -->
    <functional color="blue" @click="click">
      something
      <template #test> <p>i have name - test</p> </template>
      <p>i am default</p>
    </functional>
    <!-- <button @click="nice">click</button> -->
  </div>
</template>

<script>
import Radio from "components/common/radio/Radio";
import Functional from "components/common/functional/Functional";
export default {
  inject: {
    getAttr: {
      default: "foo"
    }
  },
  name: "",
  props: [""],
  data() {
    return {
      choose: ""
    };
  },

  components: { Radio, Functional },

  computed: {},

  beforeMount() {},

  mounted() {
    // console.log(this.__proto__);
  },

  methods: {
    blur() {
      console.log("blur");
    },
    click() {
      console.log("click");
    },
    nice() {
      console.log(this.getAttr);
    }
  },

  watch: {}
};
</script>
<style lang="" scoped></style>
