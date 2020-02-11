<template>
  <div>
    <scroll
      ref="scroll"
      class="category-scroll"
      id="scroll"
      @scroll="topIcon"
      :probe-type="3"
    >
      <ol>
        <li>no_1</li>
        <li>no_2</li>
        <li>no_3</li>
        <li>no_4</li>
        <li>no_5</li>
        <li>no_6</li>
        <li>no_7</li>
        <li>no_8</li>
        <li>no_9</li>
        <li>no_10</li>
        <li>no_11</li>
        <li>no_12</li>
        <li>no_13</li>
        <li>no_14</li>
        <li>no_15</li>
        <li>no_16</li>
        <li>no_17</li>
        <li>no_18</li>
        <li>no_19</li>
        <li>no_20</li>
        <li>no_21</li>
        <li>no_22</li>
        <li>no_23</li>
        <li>no_24</li>
        <li>no_25</li>
        <li>no_26</li>
        <li>no_27</li>
        <li>no_28</li>
        <li>no_29</li>
        <li>no_30</li>
        <li>no_31</li>
        <li>no_32</li>
        <li>no_33</li>
        <li>no_34</li>
        <li>no_35</li>
        <li>no_36</li>
        <li>no_37</li>
        <li>no_38</li>
        <li>no_39</li>
        <li>no_40</li>
        <li>no_41</li>
        <li>no_42</li>
        <li>no_43</li>
        <li>no_44</li>
        <li>no_45</li>
        <li>no_46</li>
        <li>no_47</li>
        <li>no_48</li>
        <li>no_49</li>
        <li>no_50</li>
        <li>no_51</li>
        <li>no_52</li>
        <li>no_53</li>
        <li>no_54</li>
        <li>no_55</li>
        <li>no_56</li>
        <li>no_57</li>
        <li>no_58</li>
        <li>no_59</li>
        <li>no_60</li>
        <li>no_61</li>
        <li>no_62</li>
        <li>no_63</li>
        <li>no_64</li>
        <li>no_65</li>
        <li>no_66</li>
        <li>no_67</li>
        <li>no_68</li>
        <li>no_69</li>
        <li>no_70</li>
        <li>no_71</li>
        <li>no_72</li>
        <li>no_73</li>
        <li>no_74</li>
        <li>no_75</li>
        <li>no_76</li>
        <li>no_77</li>
        <li>no_78</li>
        <li>no_79</li>
        <li>no_80</li>
        <li>no_81</li>
        <li>no_82</li>
        <li>no_83</li>
        <li>no_84</li>
        <li>no_85</li>
        <li>no_86</li>
        <li>no_87</li>
        <li>no_88</li>
        <li>no_89</li>
        <li>no_90</li>
        <li>no_91</li>
        <li>no_92</li>
        <li>no_93</li>
        <li>no_94</li>
        <li>no_95</li>
        <li>no_96</li>
        <li>no_97</li>
        <li>no_98</li>
        <li>no_99</li>
        <li>no_100</li>
      </ol>
    </scroll>
    <back-top
      @backTop="backTop"
      class="back-top"
      v-show="isShowBackTop"
    >
      <img
        src="~assets/img/logo.png"
        alt=""
      >
    </back-top>
  </div>
</template>

<script>
import Scroll from 'components/common/scroll/Scroll'
import {Person} from '../../../src/common/class'
export default {
  data() {
    return {
    };
  },

  components: {
    Scroll
  },

  computed: {},

  mounted() {
    console.log(new Person('zhangSAN',12));
  },
  created() { },

  methods: {
    topIcon() {
      -this.$refs.scroll.scroll.y > 100 && (this.isShowBackTop = true)
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